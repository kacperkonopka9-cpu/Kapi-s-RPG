"use strict";
/**
 * CalendarWidget - VS Code webview panel for displaying in-game calendar
 *
 * Epic 5 Story 5.10: Calendar Widget
 *
 * Displays current in-game date/time, moon phase, weather, and upcoming events
 * with auto-refresh on file changes and gothic horror styling.
 *
 * Extends BasePanel and implements required abstract methods:
 * - getInitialState(): Load calendar data from YAML file
 * - handleMessage(): Process messages from webview (quick actions)
 * - refreshData(): Reload calendar data for auto-refresh
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
exports.CalendarWidget = void 0;
exports.registerCalendarWidgetCommands = registerCalendarWidgetCommands;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
const base_panel_1 = require("./base-panel");
/**
 * Barovian month names mapping (1-12)
 */
const BAROVIAN_MONTHS = {
    1: 'Snowfall',
    2: 'Icemelt',
    3: 'Blossom',
    4: 'Greengrass',
    5: 'Sunhigh',
    6: 'Midsummer',
    7: 'Highsun',
    8: 'Harvest',
    9: 'Leaffall',
    10: 'Firstfrost',
    11: 'Deepwinter',
    12: 'Longnight'
};
/**
 * Moon phase to emoji mapping
 */
const MOON_PHASE_ICONS = {
    'new': '🌑',
    'new_moon': '🌑',
    'waxing_crescent': '🌒',
    'first_quarter': '🌓',
    'waxing_gibbous': '🌔',
    'full': '🌕',
    'full_moon': '🌕',
    'waning_gibbous': '🌖',
    'last_quarter': '🌗',
    'waning_crescent': '🌘'
};
/**
 * Moon phase display names
 */
const MOON_PHASE_NAMES = {
    'new': 'New Moon',
    'new_moon': 'New Moon',
    'waxing_crescent': 'Waxing Crescent',
    'first_quarter': 'First Quarter',
    'waxing_gibbous': 'Waxing Gibbous',
    'full': 'Full Moon',
    'full_moon': 'Full Moon',
    'waning_gibbous': 'Waning Gibbous',
    'last_quarter': 'Last Quarter',
    'waning_crescent': 'Waning Crescent'
};
/**
 * Weather condition to emoji mapping
 */
const WEATHER_ICONS = {
    'clear': '☀️',
    'cloudy': '☁️',
    'foggy': '🌫️',
    'light_rain': '🌧️',
    'heavy_rain': '🌧️',
    'rainy': '🌧️',
    'thunderstorm': '⛈️',
    'stormy': '⛈️',
    'light_snow': '🌨️',
    'heavy_snow': '❄️',
    'snowy': '❄️',
    'blizzard': '🌨️'
};
/**
 * Weather condition display names
 */
const WEATHER_NAMES = {
    'clear': 'Clear',
    'cloudy': 'Cloudy',
    'foggy': 'Foggy',
    'light_rain': 'Light Rain',
    'heavy_rain': 'Heavy Rain',
    'rainy': 'Rainy',
    'thunderstorm': 'Thunderstorm',
    'stormy': 'Stormy',
    'light_snow': 'Light Snow',
    'heavy_snow': 'Heavy Snow',
    'snowy': 'Snowy',
    'blizzard': 'Blizzard'
};
/**
 * Weather gameplay effects
 */
const WEATHER_EFFECTS = {
    'foggy': '-2 Perception (sight)',
    'heavy_rain': '-2 Perception (hearing), disadvantage on ranged attacks',
    'thunderstorm': 'Deafened during thunder, disadvantage on ranged attacks',
    'blizzard': 'Heavily obscured, extreme cold exposure',
    'heavy_snow': 'Difficult terrain outdoors'
};
/**
 * Season emoji icons
 */
const SEASON_ICONS = {
    'spring': '🌸',
    'summer': '☀️',
    'autumn': '🍂',
    'winter': '❄️'
};
/**
 * CalendarWidget - Webview panel for calendar display
 */
class CalendarWidget extends base_panel_1.BasePanel {
    /**
     * Create a new CalendarWidget
     * @param context - VS Code extension context
     * @param fileWatcherManager - Optional file watcher manager for auto-refresh
     */
    constructor(context, fileWatcherManager) {
        const config = {
            viewType: CalendarWidget.viewType,
            title: 'Calendar',
            templatePath: 'templates/calendar-widget.html',
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
     * @returns CalendarWidget instance
     */
    static getInstance(context, fileWatcherManager) {
        if (!CalendarWidget.instance) {
            CalendarWidget.instance = new CalendarWidget(context, fileWatcherManager);
        }
        return CalendarWidget.instance;
    }
    /**
     * Reset the singleton instance (for testing)
     */
    static resetInstance() {
        if (CalendarWidget.instance) {
            CalendarWidget.instance.dispose();
            CalendarWidget.instance = undefined;
        }
    }
    /**
     * Show the panel
     * @returns Result object
     */
    async show() {
        // Initialize calendar path
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (workspaceRoot) {
            this.calendarPath = path.join(workspaceRoot, 'game-data', 'calendar.yaml');
            this.setupFileWatcher();
        }
        return super.show();
    }
    /**
     * Set up file watcher for calendar.yaml auto-refresh
     */
    setupFileWatcher() {
        // Dispose existing watcher
        if (this.fileWatcherDisposable) {
            this.fileWatcherDisposable.dispose();
            this.fileWatcherDisposable = undefined;
        }
        if (!this.calendarPath) {
            return;
        }
        // Watch the calendar.yaml file with VS Code's file watcher
        const calendarUri = vscode.Uri.file(this.calendarPath);
        const pattern = new vscode.RelativePattern(path.dirname(this.calendarPath), 'calendar.yaml');
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);
        // Debounce refresh calls (300ms)
        const debouncedRefresh = () => {
            if (this.refreshDebounceTimer) {
                clearTimeout(this.refreshDebounceTimer);
            }
            this.refreshDebounceTimer = setTimeout(() => {
                this.refresh();
            }, 300);
        };
        watcher.onDidChange(debouncedRefresh);
        watcher.onDidCreate(debouncedRefresh);
        watcher.onDidDelete(debouncedRefresh);
        this.fileWatcherDisposable = watcher;
        this.disposables.push(watcher);
    }
    /**
     * Get initial state for the panel
     * Implements abstract method from BasePanel
     */
    async getInitialState() {
        return this.loadCalendarData();
    }
    /**
     * Handle messages from the webview
     * Implements abstract method from BasePanel
     */
    async handleMessage(message) {
        switch (message.type) {
            case 'refresh':
                await this.refresh();
                break;
            case 'openCalendarFile':
                await this.openCalendarFile();
                break;
            case 'openEventFile':
                if (message.payload?.filePath) {
                    await this.openFile(message.payload.filePath);
                }
                break;
            default:
                console.warn(`Unknown message type: ${message.type}`);
        }
    }
    /**
     * Refresh panel data
     * Implements abstract method from BasePanel
     */
    async refreshData() {
        return this.loadCalendarData();
    }
    /**
     * Load calendar data from game-data/calendar.yaml
     */
    async loadCalendarData() {
        const errors = [];
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            return this.createEmptyState('No workspace folder found', errors);
        }
        const calendarPath = path.join(workspaceRoot, 'game-data', 'calendar.yaml');
        // Check if calendar file exists
        let calendarYaml = {};
        try {
            const content = await fs.readFile(calendarPath, 'utf-8');
            calendarYaml = yaml.load(content) || {};
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                errors.push({ file: calendarPath, message: 'Calendar not initialized - file does not exist' });
            }
            else {
                errors.push({ file: calendarPath, message: `Failed to parse calendar: ${error.message}` });
            }
        }
        // Parse current date/time
        const rawDate = calendarYaml.current?.date || '735-10-1';
        const rawTime = calendarYaml.current?.time || '08:00';
        const dayOfWeek = calendarYaml.current?.day_of_week || 'Moonday';
        const season = calendarYaml.current?.season || 'autumn';
        // Parse moon phase
        const moonPhase = calendarYaml.moon?.current_phase || 'new';
        const daysUntilFull = calendarYaml.moon?.days_until_full ?? 14;
        // Parse weather
        const weatherCondition = calendarYaml.weather?.current || 'foggy';
        const temperature = calendarYaml.weather?.temperature ?? 8;
        // Load upcoming events
        const upcomingEvents = await this.loadUpcomingEvents(rawDate, workspaceRoot, calendarYaml.events || [], errors);
        // Build state
        const state = {
            current: {
                date: rawDate,
                formattedDate: this.formatDate(rawDate),
                time: rawTime,
                formattedTime: this.formatTime(rawTime),
                dayOfWeek: dayOfWeek,
                season: this.capitalizeFirst(season),
                seasonIcon: SEASON_ICONS[season] || '🍂'
            },
            moon: {
                phase: moonPhase,
                phaseName: MOON_PHASE_NAMES[moonPhase] || 'Unknown',
                daysUntilFull: daysUntilFull,
                icon: MOON_PHASE_ICONS[moonPhase] || '🌑',
                isFullMoon: moonPhase === 'full' || moonPhase === 'full_moon'
            },
            weather: {
                condition: weatherCondition,
                conditionName: WEATHER_NAMES[weatherCondition] || this.capitalizeFirst(weatherCondition.replace(/_/g, ' ')),
                temperature: temperature,
                icon: WEATHER_ICONS[weatherCondition] || '🌫️',
                gameplayEffect: WEATHER_EFFECTS[weatherCondition]
            },
            upcomingEvents: upcomingEvents,
            calendarFilePath: calendarPath,
            lastUpdated: new Date().toISOString(),
            errors: errors
        };
        return state;
    }
    /**
     * Load upcoming events from calendar and location Events.md files
     */
    async loadUpcomingEvents(currentDate, workspaceRoot, calendarEvents, errors) {
        const events = [];
        const locationsDir = path.join(workspaceRoot, 'game-data', 'locations');
        // Process events from calendar.yaml
        if (calendarEvents && Array.isArray(calendarEvents)) {
            for (const event of calendarEvents) {
                if (!event.triggerDate || event.status === 'completed' || event.status === 'triggered') {
                    continue;
                }
                const daysUntil = this.calculateDaysUntil(currentDate, event.triggerDate);
                // Only include events within 7 days
                if (daysUntil >= 0 && daysUntil <= 7) {
                    events.push({
                        eventId: event.eventId || 'unknown',
                        name: event.name || 'Unnamed Event',
                        triggerDate: event.triggerDate,
                        daysUntil: daysUntil,
                        urgency: this.getUrgencyLevel(daysUntil),
                        locationId: event.locationId,
                        filePath: path.join(workspaceRoot, 'game-data', 'calendar.yaml')
                    });
                }
            }
        }
        // Scan location Events.md files for additional events
        try {
            const locationDirs = await fs.readdir(locationsDir, { withFileTypes: true });
            for (const dir of locationDirs) {
                if (!dir.isDirectory())
                    continue;
                const eventsPath = path.join(locationsDir, dir.name, 'Events.md');
                try {
                    const content = await fs.readFile(eventsPath, 'utf-8');
                    const locationEvents = this.parseEventsFromMarkdown(content, currentDate, eventsPath, dir.name);
                    events.push(...locationEvents);
                }
                catch (error) {
                    // Events.md doesn't exist for this location - that's OK
                }
            }
        }
        catch (error) {
            // Locations directory doesn't exist
        }
        // Sort by trigger date (soonest first) and limit to 5
        events.sort((a, b) => a.daysUntil - b.daysUntil);
        return events.slice(0, 5);
    }
    /**
     * Parse events from a location's Events.md file
     */
    parseEventsFromMarkdown(content, currentDate, filePath, locationId) {
        const events = [];
        // Look for YAML frontmatter with events
        const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (yamlMatch) {
            try {
                const frontmatter = yaml.load(yamlMatch[1]);
                if (frontmatter?.events && Array.isArray(frontmatter.events)) {
                    for (const event of frontmatter.events) {
                        if (!event.trigger_date || event.status === 'completed') {
                            continue;
                        }
                        const daysUntil = this.calculateDaysUntil(currentDate, event.trigger_date);
                        if (daysUntil >= 0 && daysUntil <= 7) {
                            events.push({
                                eventId: event.event_id || event.eventId || 'unknown',
                                name: event.name || event.event_name || 'Unnamed Event',
                                triggerDate: event.trigger_date,
                                daysUntil: daysUntil,
                                urgency: this.getUrgencyLevel(daysUntil),
                                locationId: locationId,
                                filePath: filePath
                            });
                        }
                    }
                }
            }
            catch (error) {
                // Failed to parse YAML frontmatter
            }
        }
        return events;
    }
    /**
     * Calculate days until a target date from current date
     * Date format: YYYY-MM-DD (e.g., "735-10-1")
     */
    calculateDaysUntil(currentDate, targetDate) {
        try {
            const [currentYear, currentMonth, currentDay] = currentDate.split('-').map(Number);
            const [targetYear, targetMonth, targetDay] = targetDate.split('-').map(Number);
            // Simple calculation assuming 30 days per month
            const currentTotal = currentYear * 360 + currentMonth * 30 + currentDay;
            const targetTotal = targetYear * 360 + targetMonth * 30 + targetDay;
            return targetTotal - currentTotal;
        }
        catch (error) {
            return 999; // Far future if parsing fails
        }
    }
    /**
     * Get urgency level based on days until event
     */
    getUrgencyLevel(daysUntil) {
        if (daysUntil <= 1)
            return 'urgent';
        if (daysUntil <= 4)
            return 'soon';
        return 'safe';
    }
    /**
     * Format date from "735-10-1" to "1st of Leaffall, 735 BC"
     */
    formatDate(dateStr) {
        try {
            const [year, month, day] = dateStr.split('-').map(Number);
            const monthName = BAROVIAN_MONTHS[month] || `Month ${month}`;
            const ordinal = this.getOrdinal(day);
            return `${ordinal} of ${monthName}, ${year} BC`;
        }
        catch (error) {
            return dateStr;
        }
    }
    /**
     * Get ordinal suffix for day (1st, 2nd, 3rd, etc.)
     */
    getOrdinal(day) {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const v = day % 100;
        return day + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
    }
    /**
     * Format time from "08:00" to "8:00 AM"
     */
    formatTime(timeStr) {
        try {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
            return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        }
        catch (error) {
            return timeStr;
        }
    }
    /**
     * Capitalize first letter
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    /**
     * Create empty state with error message
     */
    createEmptyState(errorMessage, errors) {
        errors.push({ file: 'calendar', message: errorMessage });
        return {
            current: {
                date: '735-10-1',
                formattedDate: '1st of Leaffall, 735 BC',
                time: '08:00',
                formattedTime: '8:00 AM',
                dayOfWeek: 'Unknown',
                season: 'Unknown',
                seasonIcon: '🍂'
            },
            moon: {
                phase: 'unknown',
                phaseName: 'Unknown',
                daysUntilFull: 0,
                icon: '🌑',
                isFullMoon: false
            },
            weather: {
                condition: 'unknown',
                conditionName: 'Unknown',
                temperature: 0,
                icon: '🌫️'
            },
            upcomingEvents: [],
            calendarFilePath: '',
            lastUpdated: new Date().toISOString(),
            errors: errors
        };
    }
    /**
     * Open the calendar.yaml file in editor
     */
    async openCalendarFile() {
        if (!this.calendarPath) {
            vscode.window.showWarningMessage('Calendar file path not set');
            return;
        }
        try {
            const doc = await vscode.workspace.openTextDocument(this.calendarPath);
            await vscode.window.showTextDocument(doc);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to open calendar file: ${error.message}`);
        }
    }
    /**
     * Open a file in the editor
     */
    async openFile(filePath) {
        try {
            const doc = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(doc);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to open file: ${error.message}`);
        }
    }
    /**
     * Dispose panel and cleanup
     */
    dispose() {
        // Clear debounce timer
        if (this.refreshDebounceTimer) {
            clearTimeout(this.refreshDebounceTimer);
            this.refreshDebounceTimer = undefined;
        }
        // Dispose file watcher
        if (this.fileWatcherDisposable) {
            this.fileWatcherDisposable.dispose();
            this.fileWatcherDisposable = undefined;
        }
        // Call parent dispose
        super.dispose();
        // Clear singleton reference
        if (CalendarWidget.instance === this) {
            CalendarWidget.instance = undefined;
        }
    }
}
exports.CalendarWidget = CalendarWidget;
CalendarWidget.viewType = 'kapis-rpg.calendar-widget';
/**
 * Register calendar widget commands
 * @param context - VS Code extension context
 * @param fileWatcherManager - Optional file watcher manager
 */
function registerCalendarWidgetCommands(context, fileWatcherManager) {
    // Register showCalendar command
    context.subscriptions.push(vscode.commands.registerCommand('kapis-rpg.showCalendar', async () => {
        const panel = CalendarWidget.getInstance(context, fileWatcherManager);
        const result = await panel.show();
        if (!result.success) {
            vscode.window.showErrorMessage(`Failed to show Calendar: ${result.message}`);
        }
    }));
}
//# sourceMappingURL=calendar-widget.js.map