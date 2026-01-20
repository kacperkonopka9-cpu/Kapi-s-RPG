"use strict";
/**
 * BasePanel - Abstract base class for all webview panels in Kapi's RPG DM Extension
 *
 * Provides common panel lifecycle management, HTML rendering, message passing,
 * state persistence, and error handling for VS Code webview panels.
 *
 * @module base-panel
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePanel = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs/promises"));
/**
 * Abstract base class for webview panels
 *
 * Subclasses must implement:
 * - getInitialState(): Promise<any>
 * - handleMessage(message: PanelMessage): Promise<void>
 * - refreshData(): Promise<any>
 */
class BasePanel {
    constructor(context, config) {
        this.disposables = [];
        this.context = context;
        this.extensionUri = context.extensionUri;
        this.config = config;
    }
    /**
     * Show the panel (create if not exists, reveal if hidden)
     * @returns Result object indicating success/failure
     */
    async show() {
        try {
            if (this.panel) {
                // Panel exists, just reveal it
                this.panel.reveal(this.config.viewColumn || vscode.ViewColumn.Two);
                return { success: true, message: 'Panel revealed' };
            }
            // Create new panel
            this.panel = vscode.window.createWebviewPanel(this.config.viewType, this.config.title, this.config.viewColumn || vscode.ViewColumn.Two, {
                enableScripts: this.config.enableScripts !== false,
                retainContextWhenHidden: this.config.retainContextWhenHidden !== false,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.extensionUri, 'media')
                ]
            });
            // Load and set HTML content
            const htmlResult = await this.loadHtmlContent();
            if (!htmlResult.success) {
                this.panel.dispose();
                this.panel = undefined;
                return htmlResult;
            }
            this.panel.webview.html = htmlResult.data;
            // Set up message handler
            this.panel.webview.onDidReceiveMessage(async (message) => {
                try {
                    await this.handleMessage(message);
                }
                catch (error) {
                    console.error(`Error handling webview message:`, error);
                    this.showError('Failed to process message from panel');
                }
            }, null, this.disposables);
            // Handle panel disposal
            this.panel.onDidDispose(() => {
                this.dispose();
            }, null, this.disposables);
            // Load initial state
            const state = await this.loadState();
            this.currentState = state;
            // Send initial data to webview
            const initialData = await this.getInitialState();
            await this.postMessage({ type: 'initialize', payload: initialData });
            return { success: true, message: 'Panel created and shown' };
        }
        catch (error) {
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
    async hide() {
        try {
            if (this.panel) {
                // Save state before hiding
                await this.saveState(this.currentState);
                this.panel.dispose();
                this.panel = undefined;
            }
            return { success: true, message: 'Panel hidden' };
        }
        catch (error) {
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
    async refresh() {
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
        }
        catch (error) {
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
    dispose() {
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
    async postMessage(message) {
        if (!this.panel) {
            return false;
        }
        return this.panel.webview.postMessage(message);
    }
    /**
     * Load HTML content from template file
     * @returns Result with HTML string or error
     */
    async loadHtmlContent() {
        try {
            const mediaPath = vscode.Uri.joinPath(this.extensionUri, 'media');
            const templatePath = vscode.Uri.joinPath(mediaPath, this.config.templatePath);
            let html;
            try {
                const buffer = await fs.readFile(templatePath.fsPath, 'utf-8');
                html = buffer;
            }
            catch (error) {
                return {
                    success: false,
                    message: `Template file not found: ${this.config.templatePath}`,
                    error: error instanceof Error ? error : new Error(String(error))
                };
            }
            // Replace resource URIs for webview
            if (this.panel) {
                const stylesUri = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'styles'));
                const scriptsUri = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'scripts'));
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
        }
        catch (error) {
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
    getContentSecurityPolicy(nonce) {
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
    getNonce() {
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
    async loadState() {
        const stateKey = `${this.config.viewType}.state`;
        const saved = this.context.workspaceState.get(stateKey);
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
    async saveState(state) {
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
    showError(message) {
        if (this.panel && this.panel.visible) {
            this.postMessage({
                type: 'error',
                payload: { message }
            });
        }
        vscode.window.showErrorMessage(`Kapi's RPG: ${message}`);
    }
}
exports.BasePanel = BasePanel;
//# sourceMappingURL=base-panel.js.map