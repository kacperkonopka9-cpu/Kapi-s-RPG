/**
 * BasePanel - Abstract base class for all webview panels in Kapi's RPG DM Extension
 *
 * Provides common panel lifecycle management, HTML rendering, message passing,
 * state persistence, and error handling for VS Code webview panels.
 *
 * @module base-panel
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Panel configuration options
 */
export interface PanelConfig {
  /** Unique view type identifier (e.g., 'kapis-rpg.character-sheet') */
  viewType: string;

  /** Panel title displayed in VS Code */
  title: string;

  /** Path to HTML template file relative to media/ directory */
  templatePath: string;

  /** Whether to enable scripts in webview */
  enableScripts?: boolean;

  /** Whether to retain context when panel is hidden */
  retainContextWhenHidden?: boolean;

  /** Initial view column (default: ViewColumn.Two) */
  viewColumn?: vscode.ViewColumn;
}

/**
 * Panel state for persistence across VS Code sessions
 */
export interface PanelState {
  /** State data specific to panel implementation */
  data: any;

  /** Last update timestamp */
  lastUpdated: string;

  /** Whether panel should auto-refresh on file changes */
  autoRefresh: boolean;
}

/**
 * Message passed between webview and extension
 */
export interface PanelMessage {
  /** Message type/command */
  type: string;

  /** Message payload */
  payload?: any;
}

/**
 * Result object for panel operations
 */
export interface PanelResult {
  /** Operation success status */
  success: boolean;

  /** Result message */
  message?: string;

  /** Result data */
  data?: any;

  /** Error if operation failed */
  error?: Error;
}

/**
 * Abstract base class for webview panels
 *
 * Subclasses must implement:
 * - getInitialState(): Promise<any>
 * - handleMessage(message: PanelMessage): Promise<void>
 * - refreshData(): Promise<any>
 */
export abstract class BasePanel {
  protected panel: vscode.WebviewPanel | undefined;
  protected readonly extensionUri: vscode.Uri;
  protected readonly context: vscode.ExtensionContext;
  protected readonly config: PanelConfig;
  protected disposables: vscode.Disposable[] = [];
  protected currentState: PanelState | undefined;

  constructor(context: vscode.ExtensionContext, config: PanelConfig) {
    this.context = context;
    this.extensionUri = context.extensionUri;
    this.config = config;
  }

  /**
   * Show the panel (create if not exists, reveal if hidden)
   * @returns Result object indicating success/failure
   */
  public async show(): Promise<PanelResult> {
    try {
      if (this.panel) {
        // Panel exists, just reveal it
        this.panel.reveal(this.config.viewColumn || vscode.ViewColumn.Two);
        return { success: true, message: 'Panel revealed' };
      }

      // Create new panel
      this.panel = vscode.window.createWebviewPanel(
        this.config.viewType,
        this.config.title,
        this.config.viewColumn || vscode.ViewColumn.Two,
        {
          enableScripts: this.config.enableScripts !== false,
          retainContextWhenHidden: this.config.retainContextWhenHidden !== false,
          localResourceRoots: [
            vscode.Uri.joinPath(this.extensionUri, 'media')
          ]
        }
      );

      // Load and set HTML content
      const htmlResult = await this.loadHtmlContent();
      if (!htmlResult.success) {
        this.panel.dispose();
        this.panel = undefined;
        return htmlResult;
      }

      this.panel.webview.html = htmlResult.data!;

      // Set up message handler
      this.panel.webview.onDidReceiveMessage(
        async (message: PanelMessage) => {
          try {
            await this.handleMessage(message);
          } catch (error) {
            console.error(`Error handling webview message:`, error);
            this.showError('Failed to process message from panel');
          }
        },
        null,
        this.disposables
      );

      // Handle panel disposal
      this.panel.onDidDispose(
        () => {
          this.dispose();
        },
        null,
        this.disposables
      );

      // Load initial state
      const state = await this.loadState();
      this.currentState = state;

      // Send initial data to webview
      const initialData = await this.getInitialState();
      await this.postMessage({ type: 'initialize', payload: initialData });

      return {success: true, message: 'Panel created and shown' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to show panel',
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Hide the panel (dispose the webview)
   * @returns Result object indicating success/failure
   */
  public async hide(): Promise<PanelResult> {
    try {
      if (this.panel) {
        // Save state before hiding
        await this.saveState(this.currentState);

        this.panel.dispose();
        this.panel = undefined;
      }
      return { success: true, message: 'Panel hidden' };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to hide panel',
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Refresh panel data and update webview
   * @returns Result object indicating success/failure
   */
  public async refresh(): Promise<PanelResult> {
    try {
      if (!this.panel) {
        return { success: false, message: 'Panel not visible' };
      }

      const data = await this.refreshData();
      await this.postMessage({ type: 'refresh', payload: data });

      if (this.currentState) {
        this.currentState.lastUpdated = new Date().toISOString();
        await this.saveState(this.currentState);
      }

      return { success: true, message: 'Panel refreshed', data };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to refresh panel',
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Dispose panel and clean up resources
   */
  public dispose(): void {
    // Dispose panel
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }

    // Dispose all event listeners
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }

    this.currentState = undefined;
  }

  /**
   * Post message to webview
   * @param message Message to send
   */
  protected async postMessage(message: PanelMessage): Promise<boolean> {
    if (!this.panel) {
      return false;
    }

    return this.panel.webview.postMessage(message);
  }

  /**
   * Load HTML content from template file
   * @returns Result with HTML string or error
   */
  protected async loadHtmlContent(): Promise<PanelResult> {
    try {
      const mediaPath = vscode.Uri.joinPath(this.extensionUri, 'media');
      const templatePath = vscode.Uri.joinPath(mediaPath, this.config.templatePath);

      let html: string;
      try {
        const buffer = await fs.readFile(templatePath.fsPath, 'utf-8');
        html = buffer;
      } catch (error) {
        return {
          success: false,
          message: `Template file not found: ${this.config.templatePath}`,
          error: error instanceof Error ? error : new Error(String(error))
        };
      }

      // Replace resource URIs for webview
      if (this.panel) {
        const stylesUri = this.panel.webview.asWebviewUri(
          vscode.Uri.joinPath(mediaPath, 'styles')
        );
        const scriptsUri = this.panel.webview.asWebviewUri(
          vscode.Uri.joinPath(mediaPath, 'scripts')
        );

        html = html.replace(/\{\{stylesUri\}\}/g, stylesUri.toString());
        html = html.replace(/\{\{scriptsUri\}\}/g, scriptsUri.toString());

        // Add CSP nonce
        const nonce = this.getNonce();
        html = html.replace(/\{\{nonce\}\}/g, nonce);

        // Add CSP meta tag if not present
        if (!html.includes('Content-Security-Policy')) {
          const csp = this.getContentSecurityPolicy(nonce);
          html = html.replace('</head>', `<meta http-equiv="Content-Security-Policy" content="${csp}">\n</head>`);
        }
      }

      return { success: true, data: html };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to load HTML template',
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Get Content Security Policy for webview
   * @param nonce Nonce for inline scripts
   * @returns CSP string
   */
  protected getContentSecurityPolicy(nonce: string): string {
    if (!this.panel) {
      return '';
    }

    const webview = this.panel.webview;
    return [
      `default-src 'none';`,
      `img-src ${webview.cspSource} https:;`,
      `script-src 'nonce-${nonce}';`,
      `style-src ${webview.cspSource} 'unsafe-inline';`,
      `font-src ${webview.cspSource};`
    ].join(' ');
  }

  /**
   * Generate random nonce for CSP
   * @returns Nonce string
   */
  protected getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  /**
   * Load panel state from workspace state
   * @returns Panel state or default state
   */
  protected async loadState(): Promise<PanelState> {
    const stateKey = `${this.config.viewType}.state`;
    const saved = this.context.workspaceState.get<PanelState>(stateKey);

    if (saved) {
      return saved;
    }

    // Return default state
    return {
      data: {},
      lastUpdated: new Date().toISOString(),
      autoRefresh: true
    };
  }

  /**
   * Save panel state to workspace state
   * @param state State to save
   */
  protected async saveState(state: PanelState | undefined): Promise<void> {
    if (!state) {
      return;
    }

    const stateKey = `${this.config.viewType}.state`;
    await this.context.workspaceState.update(stateKey, state);
  }

  /**
   * Show error message in webview
   * @param message Error message
   */
  protected showError(message: string): void {
    if (this.panel && this.panel.visible) {
      this.postMessage({
        type: 'error',
        payload: { message }
      });
    }

    vscode.window.showErrorMessage(`Kapi's RPG: ${message}`);
  }

  /**
   * Abstract method: Get initial state for panel
   * Must be implemented by subclasses
   * @returns Initial state data
   */
  protected abstract getInitialState(): Promise<any>;

  /**
   * Abstract method: Handle message from webview
   * Must be implemented by subclasses
   * @param message Message from webview
   */
  protected abstract handleMessage(message: PanelMessage): Promise<void>;

  /**
   * Abstract method: Refresh panel data
   * Must be implemented by subclasses
   * @returns Refreshed data
   */
  protected abstract refreshData(): Promise<any>;
}
