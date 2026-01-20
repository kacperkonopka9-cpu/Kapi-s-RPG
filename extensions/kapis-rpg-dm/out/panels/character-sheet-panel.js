"use strict";
/**
 * CharacterSheetPanel - VS Code webview panel for displaying character stats
 *
 * Epic 5 Story 5.8: Character Sheet Sidebar
 *
 * Displays live character data (HP, AC, spell slots, conditions, abilities)
 * with auto-refresh on file changes and gothic horror styling.
 *
 * Extends BasePanel and implements required abstract methods:
 * - getInitialState(): Load character data from YAML file
 * - handleMessage(): Process messages from webview (quick actions)
 * - refreshData(): Reload character data for auto-refresh
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
exports.CharacterSheetPanel = void 0;
exports.registerCharacterSheetCommands = registerCharacterSheetCommands;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
const base_panel_1 = require("./base-panel");
/**
 * CharacterSheetPanel - Webview panel for character sheet display
 */
class CharacterSheetPanel extends base_panel_1.BasePanel {
    /**
     * Create a new CharacterSheetPanel
     * @param context - VS Code extension context
     * @param fileWatcherManager - Optional file watcher manager for auto-refresh
     */
    constructor(context, fileWatcherManager) {
        const config = {
            viewType: CharacterSheetPanel.viewType,
            title: 'Character Sheet',
            templatePath: 'templates/character-sheet.html',
            enableScripts: true,
            retainContextWhenHidden: true,
            viewColumn: vscode.ViewColumn.Two
        };
        super(context, config);
        this.fileWatcherManager = fileWatcherManager;
    }
    /**
     * Get or create the singleton panel instance
     * @param context - VS Code extension context
     * @param fileWatcherManager - Optional file watcher manager
     * @returns CharacterSheetPanel instance
     */
    static getInstance(context, fileWatcherManager) {
        if (!CharacterSheetPanel.instance) {
            CharacterSheetPanel.instance = new CharacterSheetPanel(context, fileWatcherManager);
        }
        return CharacterSheetPanel.instance;
    }
    /**
     * Reset the singleton instance (for testing)
     */
    static resetInstance() {
        if (CharacterSheetPanel.instance) {
            CharacterSheetPanel.instance.dispose();
            CharacterSheetPanel.instance = undefined;
        }
    }
    /**
     * Show the panel with a specific character file
     * @param characterPath - Path to character YAML file
     * @returns Result object
     */
    async showWithCharacter(characterPath) {
        this.characterFilePath = characterPath;
        // Set up file watcher for auto-refresh
        this.setupFileWatcher(characterPath);
        // Show the panel
        const result = await this.show();
        if (result.success) {
            // Store character path in state for persistence
            if (this.currentState) {
                this.currentState.characterFilePath = characterPath;
                await this.saveState(this.currentState);
            }
        }
        return result;
    }
    /**
     * Set up file watcher for character file auto-refresh
     * @param characterPath - Path to watch
     */
    setupFileWatcher(characterPath) {
        // Dispose existing watcher
        if (this.fileWatcherDisposable) {
            this.fileWatcherDisposable.dispose();
            this.fileWatcherDisposable = undefined;
        }
        if (this.fileWatcherManager) {
            // Watch the character file
            this.fileWatcherManager.watch(characterPath, 'character');
            // Subscribe to character update events
            this.fileWatcherDisposable = this.fileWatcherManager.onCharacterUpdated(async (event) => {
                if (event.filePath === characterPath && event.changeType !== 'deleted') {
                    // Auto-refresh panel data
                    await this.refresh();
                }
            });
            this.disposables.push(this.fileWatcherDisposable);
        }
    }
    /**
     * Get initial state for the panel
     * Implements abstract method from BasePanel
     * @returns Character data or error state
     */
    async getInitialState() {
        // Try to load from saved state first
        const savedState = await this.loadState();
        if (!this.characterFilePath && savedState.data?.characterFilePath) {
            this.characterFilePath = savedState.data.characterFilePath;
            if (this.characterFilePath) {
                this.setupFileWatcher(this.characterFilePath);
            }
        }
        // If no character path, try to get from active session
        if (!this.characterFilePath) {
            const sessionCharacter = await this.getCharacterFromSession();
            if (sessionCharacter) {
                this.characterFilePath = sessionCharacter;
                this.setupFileWatcher(this.characterFilePath);
            }
        }
        // If still no character, try to auto-select from characters directory
        if (!this.characterFilePath) {
            const selectedCharacter = await this.autoSelectCharacter();
            if (selectedCharacter) {
                this.characterFilePath = selectedCharacter;
                this.setupFileWatcher(this.characterFilePath);
            }
            else {
                return {
                    error: 'No character selected. Use "Select Character" button to choose one.'
                };
            }
        }
        // Load character data
        return this.loadCharacterData(this.characterFilePath);
    }
    /**
     * Handle messages from the webview
     * Implements abstract method from BasePanel
     * @param message - Message from webview
     */
    async handleMessage(message) {
        switch (message.type) {
            case 'selectCharacter':
                await this.handleSelectCharacter();
                break;
            case 'refresh':
                await this.refresh();
                break;
            case 'hpAction':
                await this.handleHpAction(message.payload);
                break;
            case 'conditionInfo':
                await this.handleConditionInfo(message.payload);
                break;
            case 'spellSlotInfo':
                await this.handleSpellSlotInfo(message.payload);
                break;
            default:
                console.warn(`Unknown message type: ${message.type}`);
        }
    }
    /**
     * Refresh panel data
     * Implements abstract method from BasePanel
     * @returns Refreshed character data
     */
    async refreshData() {
        if (!this.characterFilePath) {
            return {
                error: 'No character loaded. Select a character file or start a session.'
            };
        }
        return this.loadCharacterData(this.characterFilePath);
    }
    /**
     * Load and parse character data from YAML file
     * @param filePath - Path to character YAML file
     * @returns Parsed character state
     */
    async loadCharacterData(filePath) {
        try {
            // Read and parse YAML file
            const content = await fs.readFile(filePath, 'utf-8');
            const rawData = yaml.load(content);
            if (!rawData || typeof rawData !== 'object') {
                return { error: `Invalid character file format: ${filePath}` };
            }
            // Map to CharacterSheetPanelState
            const state = {
                character: {
                    name: rawData.name || 'Unknown',
                    level: rawData.level || 1,
                    class: rawData.class || 'Unknown',
                    race: rawData.race,
                    hp: {
                        current: rawData.hitPoints?.current ?? 0,
                        max: rawData.hitPoints?.max ?? 0
                    },
                    ac: rawData.armorClass || 10,
                    abilities: {
                        STR: rawData.abilities?.strength ?? 10,
                        DEX: rawData.abilities?.dexterity ?? 10,
                        CON: rawData.abilities?.constitution ?? 10,
                        INT: rawData.abilities?.intelligence ?? 10,
                        WIS: rawData.abilities?.wisdom ?? 10,
                        CHA: rawData.abilities?.charisma ?? 10
                    },
                    conditions: rawData.conditions || [],
                    proficiencyBonus: rawData.proficiencyBonus,
                    speed: rawData.speed,
                    hitDice: rawData.hitPoints?.hitDice,
                    features: rawData.features?.map(f => ({
                        name: f.name,
                        description: f.description,
                        uses: f.uses ?? undefined,
                        maxUses: f.maxUses ?? undefined
                    }))
                },
                lastUpdated: new Date().toISOString(),
                autoRefresh: true,
                characterFilePath: filePath
            };
            // Handle spell slots for spellcasters
            if (rawData.spellcasting?.spellSlots) {
                state.character.spellSlots = {};
                for (const [level, slots] of Object.entries(rawData.spellcasting.spellSlots)) {
                    state.character.spellSlots[level] = {
                        used: slots.used || 0,
                        total: slots.total || 0
                    };
                }
            }
            return state;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('ENOENT')) {
                return { error: `Character file not found: ${filePath}` };
            }
            return { error: `Failed to parse character file: ${errorMessage}` };
        }
    }
    /**
     * Auto-select character from characters directory
     * If only one character exists, use it automatically
     * If multiple, prompt user to select
     * @returns Selected character file path or undefined
     */
    async autoSelectCharacter() {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                return undefined;
            }
            const charactersDir = path.join(workspaceRoot, 'characters');
            let characterFiles = [];
            try {
                const entries = await fs.readdir(charactersDir);
                characterFiles = entries.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
            }
            catch {
                // Characters directory doesn't exist
                return undefined;
            }
            if (characterFiles.length === 0) {
                return undefined;
            }
            // If only one character, use it automatically
            if (characterFiles.length === 1) {
                const selectedPath = path.join(charactersDir, characterFiles[0]);
                vscode.window.showInformationMessage(`Auto-selected character: ${characterFiles[0]}`);
                return selectedPath;
            }
            // Multiple characters - prompt user to select
            const selectedFile = await vscode.window.showQuickPick(characterFiles.map(file => file.replace(/\.ya?ml$/, '')), {
                placeHolder: 'Select your character',
                title: 'Character Sheet - Choose Character'
            });
            if (!selectedFile) {
                return undefined;
            }
            // Find the actual filename (with extension)
            const actualFile = characterFiles.find(f => f.replace(/\.ya?ml$/, '') === selectedFile);
            return actualFile ? path.join(charactersDir, actualFile) : undefined;
        }
        catch {
            return undefined;
        }
    }
    /**
     * Get character file path from active session
     * @returns Character file path or undefined
     */
    async getCharacterFromSession() {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                return undefined;
            }
            const sessionPath = path.join(workspaceRoot, 'game-data', 'session', 'current-session.yaml');
            try {
                const content = await fs.readFile(sessionPath, 'utf-8');
                const sessionData = yaml.load(content);
                if (sessionData?.character?.filePath) {
                    const charPath = sessionData.character.filePath;
                    // Check if already absolute path
                    if (path.isAbsolute(charPath)) {
                        return charPath;
                    }
                    // Convert relative to absolute path
                    return path.join(workspaceRoot, charPath);
                }
            }
            catch {
                // Session file doesn't exist or is invalid
                return undefined;
            }
        }
        catch {
            return undefined;
        }
        return undefined;
    }
    /**
     * Handle character selection via file picker
     */
    async handleSelectCharacter() {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const defaultUri = workspaceRoot
            ? vscode.Uri.file(path.join(workspaceRoot, 'characters'))
            : undefined;
        const fileUri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select Character',
            defaultUri,
            filters: {
                'YAML Files': ['yaml', 'yml']
            }
        });
        if (fileUri && fileUri[0]) {
            this.characterFilePath = fileUri[0].fsPath;
            this.setupFileWatcher(this.characterFilePath);
            // Refresh with new character
            const data = await this.loadCharacterData(this.characterFilePath);
            await this.postMessage({ type: 'refresh', payload: data });
            // Save to state
            if (this.currentState) {
                this.currentState.characterFilePath = this.characterFilePath;
                await this.saveState(this.currentState);
            }
        }
    }
    /**
     * Handle HP modification actions
     * @param payload - Action payload with type and amount
     */
    async handleHpAction(payload) {
        // Show input dialog for amount if not provided
        const inputAmount = payload.amount ?? await this.promptForNumber(payload.action === 'heal' ? 'Heal Amount' : 'Damage Amount', `Enter ${payload.action} amount:`);
        if (inputAmount === undefined) {
            return; // User cancelled
        }
        // Execute the appropriate slash command
        const commandId = payload.action === 'heal'
            ? 'kapis-rpg-dm.heal'
            : 'kapis-rpg-dm.damage';
        try {
            await vscode.commands.executeCommand(commandId, inputAmount);
            // Refresh after command execution (file watcher should also trigger)
            await this.refresh();
        }
        catch (error) {
            // Command may not exist yet - show info message
            vscode.window.showInformationMessage(`${payload.action === 'heal' ? 'Heal' : 'Damage'} command not available. ` +
                `Modify the character file directly.`);
        }
    }
    /**
     * Handle condition info requests
     * @param payload - Condition name
     */
    async handleConditionInfo(payload) {
        // Show condition rules in a quick pick or information message
        const conditionRules = {
            'blinded': 'Cannot see. Auto-fail sight checks. Attack rolls have disadvantage. Attacks against have advantage.',
            'charmed': 'Cannot attack charmer. Charmer has advantage on social checks.',
            'deafened': 'Cannot hear. Auto-fail hearing checks.',
            'frightened': 'Disadvantage on checks/attacks while source visible. Cannot willingly move closer.',
            'grappled': 'Speed becomes 0. Ends if grappler incapacitated or moved out of reach.',
            'incapacitated': 'Cannot take actions or reactions.',
            'invisible': 'Impossible to see without magic. Attacks have advantage. Attacks against have disadvantage.',
            'paralyzed': 'Incapacitated. Cannot move or speak. Auto-fail STR/DEX saves. Attacks have advantage. Hits within 5ft are crits.',
            'petrified': 'Transformed to stone. Weight x10. Incapacitated. Resistance to all damage. Immune to poison/disease.',
            'poisoned': 'Disadvantage on attack rolls and ability checks.',
            'prone': 'Can only crawl. Disadvantage on attacks. Melee attacks have advantage, ranged have disadvantage.',
            'restrained': 'Speed 0. Attacks have disadvantage. Attacks against have advantage. DEX saves disadvantage.',
            'stunned': 'Incapacitated. Cannot move. Speak only falteringly. Auto-fail STR/DEX saves. Attacks have advantage.',
            'unconscious': 'Incapacitated. Cannot move/speak. Unaware. Drop items. Fall prone. Auto-fail STR/DEX. Attacks have advantage. Hits within 5ft are crits.',
            'exhausted-1': 'Disadvantage on ability checks.',
            'exhausted-2': 'Speed halved.',
            'exhausted-3': 'Disadvantage on attack rolls and saving throws.',
            'exhausted-4': 'Hit point maximum halved.',
            'exhausted-5': 'Speed reduced to 0.',
            'exhausted-6': 'Death.'
        };
        const conditionKey = payload.condition.toLowerCase();
        const rules = conditionRules[conditionKey] || 'No rules found for this condition.';
        vscode.window.showInformationMessage(`**${payload.condition}**: ${rules}`, { modal: false });
    }
    /**
     * Handle spell slot info requests
     * @param payload - Spell slot level
     */
    async handleSpellSlotInfo(payload) {
        // Show message about spell slots
        vscode.window.showInformationMessage(`Spell Slot Level ${payload.level}: View your spellbook to see available spells.`);
    }
    /**
     * Prompt user for a number input
     * @param title - Input box title
     * @param prompt - Input box prompt
     * @returns Number or undefined if cancelled
     */
    async promptForNumber(title, prompt) {
        const input = await vscode.window.showInputBox({
            title,
            prompt,
            validateInput: (value) => {
                const num = parseInt(value, 10);
                if (isNaN(num) || num < 0) {
                    return 'Please enter a valid positive number';
                }
                return null;
            }
        });
        if (input === undefined) {
            return undefined;
        }
        return parseInt(input, 10);
    }
    /**
     * Dispose panel and clean up resources
     */
    dispose() {
        // Unwatch character file
        if (this.characterFilePath && this.fileWatcherManager) {
            this.fileWatcherManager.unwatch(this.characterFilePath);
        }
        // Dispose file watcher subscription
        if (this.fileWatcherDisposable) {
            this.fileWatcherDisposable.dispose();
            this.fileWatcherDisposable = undefined;
        }
        // Clear singleton reference
        if (CharacterSheetPanel.instance === this) {
            CharacterSheetPanel.instance = undefined;
        }
        // Call parent dispose
        super.dispose();
    }
}
exports.CharacterSheetPanel = CharacterSheetPanel;
CharacterSheetPanel.viewType = 'kapis-rpg.character-sheet';
/**
 * Register character sheet panel commands
 * @param context - VS Code extension context
 * @param fileWatcherManager - File watcher manager for auto-refresh
 */
function registerCharacterSheetCommands(context, fileWatcherManager) {
    // Register show character sheet command
    context.subscriptions.push(vscode.commands.registerCommand('kapis-rpg.showCharacterSheet', async () => {
        const panel = CharacterSheetPanel.getInstance(context, fileWatcherManager);
        const result = await panel.show();
        if (!result.success) {
            vscode.window.showErrorMessage(`Failed to show Character Sheet: ${result.message}`);
        }
    }));
    // Register command to show with specific character
    context.subscriptions.push(vscode.commands.registerCommand('kapis-rpg.showCharacterSheetWith', async (characterPath) => {
        const panel = CharacterSheetPanel.getInstance(context, fileWatcherManager);
        const result = await panel.showWithCharacter(characterPath);
        if (!result.success) {
            vscode.window.showErrorMessage(`Failed to show Character Sheet: ${result.message}`);
        }
    }));
}
//# sourceMappingURL=character-sheet-panel.js.map