/**
 * QuestTrackerPanel - VS Code webview panel for displaying active quests
 *
 * Epic 5 Story 5.9: Quest Tracker Panel
 *
 * Displays quest data with objectives, deadlines, and completion status
 * with auto-refresh on file changes and gothic horror styling.
 *
 * Extends BasePanel and implements required abstract methods:
 * - getInitialState(): Load quest data from YAML files
 * - handleMessage(): Process messages from webview (quick actions)
 * - refreshData(): Reload quest data for auto-refresh
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { BasePanel, PanelConfig, PanelMessage, PanelResult, PanelState } from './base-panel';
import { FileWatcherManager, FileChangeEvent } from '../utils/file-watcher';

/**
 * Quest tracker panel state interface (from tech spec)
 */
export interface QuestTrackerPanelState {
  quests: Array<{
    questId: string;
    title: string;
    description?: string;
    status: 'active' | 'completed' | 'failed' | 'available' | 'not_started';
    objectives: Array<{ text: string; completed: boolean; objectiveId: string }>;
    deadline?: string;  // In-game date format: "735-10-8"
    daysRemaining?: number;
    urgency?: 'safe' | 'soon' | 'urgent' | 'overdue';
    priority: 'main' | 'side';
    rewards?: {
      xp?: number;
      gold?: number;
      items?: string[];
    };
    filePath?: string;  // For opening file on click
  }>;
  filter: 'all' | 'active' | 'completed' | 'main' | 'side';
  sortBy: 'priority' | 'deadline' | 'alphabetical';
  currentDate: string;  // From CalendarManager for deadline calculation
  lastUpdated: string;  // ISO timestamp
  errors: Array<{ file: string; message: string }>;
}

/**
 * Raw quest YAML structure (matches game-data/quests/*.yaml)
 */
interface RawQuestYaml {
  questId: string;
  name: string;
  type: 'main' | 'side' | 'personal' | 'faction';
  status?: string;
  description?: {
    short?: string;
    full?: string;
  };
  objectives?: Array<{
    objectiveId: string;
    description: string;
    status?: string;
    optional?: boolean;
  }>;
  timeConstraints?: {
    hasDeadline?: boolean;
    deadline?: string | null;
  };
  rewards?: {
    experience?: number;
    currency?: {
      gold?: number;
      silver?: number;
      copper?: number;
    };
    items?: Array<{ name: string }>;
  };
}

/**
 * QuestTrackerPanel - Webview panel for quest tracking display
 */
export class QuestTrackerPanel extends BasePanel {
  public static readonly viewType = 'kapis-rpg.quest-tracker';

  private static instance: QuestTrackerPanel | undefined;
  private questsDir: string | undefined;
  private fileWatcherManager: FileWatcherManager | undefined;
  private fileWatcherDisposable: vscode.Disposable | undefined;
  private currentFilter: QuestTrackerPanelState['filter'] = 'all';
  private currentSort: QuestTrackerPanelState['sortBy'] = 'priority';

  /**
   * Create a new QuestTrackerPanel
   * @param context - VS Code extension context
   * @param fileWatcherManager - Optional file watcher manager for auto-refresh
   */
  constructor(
    context: vscode.ExtensionContext,
    fileWatcherManager?: FileWatcherManager
  ) {
    const config: PanelConfig = {
      viewType: QuestTrackerPanel.viewType,
      title: 'Quest Tracker',
      templatePath: 'templates/quest-tracker.html',
      enableScripts: true,
      retainContextWhenHidden: true,
      viewColumn: vscode.ViewColumn.Two
    };

    super(context, config);
    this.fileWatcherManager = fileWatcherManager;

    // Load saved preferences
    this.loadPreferences();
  }

  /**
   * Get or create the singleton panel instance
   * @param context - VS Code extension context
   * @param fileWatcherManager - Optional file watcher manager
   * @returns QuestTrackerPanel instance
   */
  public static getInstance(
    context: vscode.ExtensionContext,
    fileWatcherManager?: FileWatcherManager
  ): QuestTrackerPanel {
    if (!QuestTrackerPanel.instance) {
      QuestTrackerPanel.instance = new QuestTrackerPanel(context, fileWatcherManager);
    }
    return QuestTrackerPanel.instance;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  public static resetInstance(): void {
    if (QuestTrackerPanel.instance) {
      QuestTrackerPanel.instance.dispose();
      QuestTrackerPanel.instance = undefined;
    }
  }

  /**
   * Load saved filter/sort preferences from workspace state
   */
  private async loadPreferences(): Promise<void> {
    const savedFilter = this.context.workspaceState.get<QuestTrackerPanelState['filter']>('questTracker.filter');
    const savedSort = this.context.workspaceState.get<QuestTrackerPanelState['sortBy']>('questTracker.sortBy');

    if (savedFilter) {
      this.currentFilter = savedFilter;
    }
    if (savedSort) {
      this.currentSort = savedSort;
    }
  }

  /**
   * Save filter/sort preferences to workspace state
   */
  private async savePreferences(): Promise<void> {
    await this.context.workspaceState.update('questTracker.filter', this.currentFilter);
    await this.context.workspaceState.update('questTracker.sortBy', this.currentSort);
  }

  /**
   * Show the panel
   * @returns Result object
   */
  public async show(): Promise<PanelResult> {
    // Initialize quests directory
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceRoot) {
      this.questsDir = path.join(workspaceRoot, 'game-data', 'quests');
      this.setupFileWatcher();
    }

    return super.show();
  }

  /**
   * Set up file watcher for quest directory auto-refresh
   */
  private setupFileWatcher(): void {
    // Dispose existing watcher
    if (this.fileWatcherDisposable) {
      this.fileWatcherDisposable.dispose();
      this.fileWatcherDisposable = undefined;
    }

    if (!this.questsDir) {
      return;
    }

    // Watch the quests directory with VS Code's file watcher
    const pattern = new vscode.RelativePattern(this.questsDir, '*.yaml');
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);

    // Debounce refresh calls
    let debounceTimer: NodeJS.Timeout | null = null;
    const debounceRefresh = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(async () => {
        debounceTimer = null;
        await this.refresh();
      }, 300);
    };

    watcher.onDidChange(debounceRefresh);
    watcher.onDidCreate(debounceRefresh);
    watcher.onDidDelete(debounceRefresh);

    this.fileWatcherDisposable = watcher;
    this.disposables.push(watcher);
  }

  /**
   * Get initial state for the panel
   * Implements abstract method from BasePanel
   * @returns Quest data or error state
   */
  protected async getInitialState(): Promise<QuestTrackerPanelState | { error: string }> {
    return this.loadQuestData();
  }

  /**
   * Handle messages from the webview
   * Implements abstract method from BasePanel
   * @param message - Message from webview
   */
  protected async handleMessage(message: PanelMessage): Promise<void> {
    switch (message.type) {
      case 'refresh':
        await this.refresh();
        break;

      case 'setFilter':
        await this.handleSetFilter(message.payload?.filter);
        break;

      case 'setSort':
        await this.handleSetSort(message.payload?.sortBy);
        break;

      case 'openQuestFile':
        await this.handleOpenQuestFile(message.payload?.filePath);
        break;

      case 'toggleObjective':
        await this.handleToggleObjective(
          message.payload?.questId,
          message.payload?.objectiveId,
          message.payload?.filePath
        );
        break;

      case 'showQuestDetails':
        await this.handleShowQuestDetails(message.payload?.questId);
        break;

      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Refresh panel data
   * Implements abstract method from BasePanel
   * @returns Refreshed quest data
   */
  protected async refreshData(): Promise<QuestTrackerPanelState | { error: string }> {
    return this.loadQuestData();
  }

  /**
   * Load and parse quest data from YAML files
   * @returns Parsed quest state
   */
  private async loadQuestData(): Promise<QuestTrackerPanelState> {
    const state: QuestTrackerPanelState = {
      quests: [],
      filter: this.currentFilter,
      sortBy: this.currentSort,
      currentDate: await this.getCurrentDate(),
      lastUpdated: new Date().toISOString(),
      errors: []
    };

    if (!this.questsDir) {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (workspaceRoot) {
        this.questsDir = path.join(workspaceRoot, 'game-data', 'quests');
      } else {
        return state;
      }
    }

    try {
      // Check if directory exists
      try {
        await fs.access(this.questsDir);
      } catch {
        // Directory doesn't exist - not an error, just no quests
        return state;
      }

      // Read all quest files
      const files = await fs.readdir(this.questsDir);
      const questFiles = files.filter(f => f.endsWith('.yaml'));

      for (const file of questFiles) {
        const filePath = path.join(this.questsDir, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const rawQuest = yaml.load(content) as RawQuestYaml;

          if (rawQuest && rawQuest.questId) {
            const quest = this.mapQuestToState(rawQuest, filePath, state.currentDate);
            state.quests.push(quest);
          }
        } catch (error) {
          // Track parse error but continue with other files
          state.errors.push({
            file,
            message: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Apply filter and sort
      state.quests = this.filterQuests(state.quests, state.filter);
      state.quests = this.sortQuests(state.quests, state.sortBy);

    } catch (error) {
      state.errors.push({
        file: 'directory',
        message: error instanceof Error ? error.message : String(error)
      });
    }

    return state;
  }

  /**
   * Map raw quest YAML to panel state format
   */
  private mapQuestToState(
    raw: RawQuestYaml,
    filePath: string,
    currentDate: string
  ): QuestTrackerPanelState['quests'][0] {
    // Map objectives
    const objectives = (raw.objectives || []).map(obj => ({
      objectiveId: obj.objectiveId,
      text: obj.description,
      completed: obj.status === 'completed'
    }));

    // Calculate deadline info
    const deadline = raw.timeConstraints?.deadline || undefined;
    let daysRemaining: number | undefined;
    let urgency: 'safe' | 'soon' | 'urgent' | 'overdue' | undefined;

    if (deadline && currentDate) {
      daysRemaining = this.calculateDaysRemaining(currentDate, deadline);
      urgency = this.getUrgencyLevel(daysRemaining);
    }

    // Map priority
    const priority: 'main' | 'side' = raw.type === 'main' ? 'main' : 'side';

    // Map status
    type QuestStatus = 'active' | 'completed' | 'failed' | 'available' | 'not_started';
    let status: QuestStatus = 'not_started';
    if (raw.status) {
      const validStatuses: QuestStatus[] = ['active', 'completed', 'failed', 'available', 'not_started'];
      if (validStatuses.includes(raw.status as QuestStatus)) {
        status = raw.status as QuestStatus;
      }
    }

    // Map rewards
    const rewards = raw.rewards ? {
      xp: raw.rewards.experience,
      gold: raw.rewards.currency?.gold,
      items: raw.rewards.items?.map(i => i.name)
    } : undefined;

    return {
      questId: raw.questId,
      title: raw.name,
      description: raw.description?.short || raw.description?.full,
      status,
      objectives,
      deadline,
      daysRemaining,
      urgency,
      priority,
      rewards,
      filePath
    };
  }

  /**
   * Get current in-game date from calendar
   */
  private async getCurrentDate(): Promise<string> {
    try {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspaceRoot) {
        return '735-10-1';  // Default fallback
      }

      const calendarPath = path.join(workspaceRoot, 'game-data', 'calendar.yaml');
      const content = await fs.readFile(calendarPath, 'utf-8');
      const calendar = yaml.load(content) as { current?: { date?: string } };

      return calendar?.current?.date || '735-10-1';
    } catch {
      return '735-10-1';  // Default fallback
    }
  }

  /**
   * Calculate days remaining until deadline
   * Date format: "735-10-8" (year-month-day)
   */
  private calculateDaysRemaining(currentDate: string, deadline: string): number {
    try {
      const [curYear, curMonth, curDay] = currentDate.split('-').map(Number);
      const [deadYear, deadMonth, deadDay] = deadline.split('-').map(Number);

      // Simple calculation assuming 30 days per month, 12 months per year
      const currentTotalDays = curYear * 360 + curMonth * 30 + curDay;
      const deadlineTotalDays = deadYear * 360 + deadMonth * 30 + deadDay;

      return deadlineTotalDays - currentTotalDays;
    } catch {
      return NaN;
    }
  }

  /**
   * Get urgency level based on days remaining
   */
  private getUrgencyLevel(daysRemaining: number): 'safe' | 'soon' | 'urgent' | 'overdue' {
    if (isNaN(daysRemaining)) {
      return 'safe';
    }
    if (daysRemaining < 0) {
      return 'overdue';
    }
    if (daysRemaining <= 2) {
      return 'urgent';
    }
    if (daysRemaining <= 5) {
      return 'soon';
    }
    return 'safe';
  }

  /**
   * Filter quests based on filter option
   */
  private filterQuests(
    quests: QuestTrackerPanelState['quests'],
    filter: QuestTrackerPanelState['filter']
  ): QuestTrackerPanelState['quests'] {
    switch (filter) {
      case 'active':
        return quests.filter(q => q.status === 'active');
      case 'completed':
        return quests.filter(q => q.status === 'completed');
      case 'main':
        return quests.filter(q => q.priority === 'main');
      case 'side':
        return quests.filter(q => q.priority === 'side');
      case 'all':
      default:
        return quests;
    }
  }

  /**
   * Sort quests based on sort option
   */
  private sortQuests(
    quests: QuestTrackerPanelState['quests'],
    sortBy: QuestTrackerPanelState['sortBy']
  ): QuestTrackerPanelState['quests'] {
    const sorted = [...quests];

    switch (sortBy) {
      case 'priority':
        // Main quests first, then by status (active first)
        sorted.sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority === 'main' ? -1 : 1;
          }
          if (a.status !== b.status) {
            if (a.status === 'active') return -1;
            if (b.status === 'active') return 1;
          }
          return a.title.localeCompare(b.title);
        });
        break;

      case 'deadline':
        // Quests with deadlines first (by urgency), then by name
        sorted.sort((a, b) => {
          if (a.deadline && !b.deadline) return -1;
          if (!a.deadline && b.deadline) return 1;
          if (a.daysRemaining !== undefined && b.daysRemaining !== undefined) {
            return a.daysRemaining - b.daysRemaining;
          }
          return a.title.localeCompare(b.title);
        });
        break;

      case 'alphabetical':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return sorted;
  }

  /**
   * Handle filter change
   */
  private async handleSetFilter(filter: QuestTrackerPanelState['filter']): Promise<void> {
    if (!filter) return;

    this.currentFilter = filter;
    await this.savePreferences();
    await this.refresh();
  }

  /**
   * Handle sort change
   */
  private async handleSetSort(sortBy: QuestTrackerPanelState['sortBy']): Promise<void> {
    if (!sortBy) return;

    this.currentSort = sortBy;
    await this.savePreferences();
    await this.refresh();
  }

  /**
   * Handle opening quest file in editor
   */
  private async handleOpenQuestFile(filePath?: string): Promise<void> {
    if (!filePath) return;

    try {
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open quest file: ${error}`);
    }
  }

  /**
   * Handle toggling objective completion
   */
  private async handleToggleObjective(
    questId?: string,
    objectiveId?: string,
    filePath?: string
  ): Promise<void> {
    if (!questId || !objectiveId || !filePath) return;

    try {
      // Read the quest file
      const content = await fs.readFile(filePath, 'utf-8');
      const quest = yaml.load(content) as RawQuestYaml;

      if (!quest.objectives) {
        return;
      }

      // Find and toggle the objective
      const objective = quest.objectives.find(o => o.objectiveId === objectiveId);
      if (objective) {
        // Toggle status
        objective.status = objective.status === 'completed' ? 'pending' : 'completed';

        // Write back to file
        const updatedYaml = yaml.dump(quest, {
          lineWidth: -1,
          sortKeys: false,
          noRefs: true
        });
        await fs.writeFile(filePath, updatedYaml, 'utf-8');

        // Refresh panel (file watcher should also trigger this)
        await this.refresh();

        // Send success feedback to webview
        await this.postMessage({
          type: 'objectiveToggled',
          payload: { questId, objectiveId, success: true }
        });
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to update objective: ${error}`);
      await this.postMessage({
        type: 'objectiveToggled',
        payload: { questId, objectiveId, success: false }
      });
    }
  }

  /**
   * Handle showing quest details tooltip
   */
  private async handleShowQuestDetails(questId?: string): Promise<void> {
    if (!questId) return;

    // For now, just show a message. Could be expanded to show detailed modal
    vscode.window.showInformationMessage(`Quest: ${questId}`);
  }

  /**
   * Dispose panel and clean up resources
   */
  public dispose(): void {
    // Dispose file watcher
    if (this.fileWatcherDisposable) {
      this.fileWatcherDisposable.dispose();
      this.fileWatcherDisposable = undefined;
    }

    // Clear singleton reference
    if (QuestTrackerPanel.instance === this) {
      QuestTrackerPanel.instance = undefined;
    }

    // Call parent dispose
    super.dispose();
  }
}

/**
 * Register quest tracker panel commands
 * @param context - VS Code extension context
 * @param fileWatcherManager - File watcher manager for auto-refresh
 */
export function registerQuestTrackerCommands(
  context: vscode.ExtensionContext,
  fileWatcherManager?: FileWatcherManager
): void {
  // Register show quest tracker command
  context.subscriptions.push(
    vscode.commands.registerCommand('kapis-rpg.showQuestTracker', async () => {
      const panel = QuestTrackerPanel.getInstance(context, fileWatcherManager);
      const result = await panel.show();

      if (!result.success) {
        vscode.window.showErrorMessage(`Failed to show Quest Tracker: ${result.message}`);
      }
    })
  );
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => htmlEntities[char] || char);
}
