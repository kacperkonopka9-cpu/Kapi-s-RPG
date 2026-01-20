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

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { BasePanel, PanelConfig, PanelMessage, PanelResult } from './base-panel';
import { FileWatcherManager } from '../utils/file-watcher';

/**
 * Calendar widget panel state interface (from tech spec)
 */
export interface CalendarWidgetState {
  current: {
    date: string;            // "735-10-1"
    formattedDate: string;   // "1st of Leaffall, 735 BC"
    time: string;            // "08:00"
    formattedTime: string;   // "8:00 AM"
    dayOfWeek: string;       // "Moonday"
    season: string;          // "autumn"
    seasonIcon: string;      // Season emoji
  };
  moon: {
    phase: string;           // "waxing_gibbous"
    phaseName: string;       // "Waxing Gibbous"
    daysUntilFull: number;
    icon: string;            // Moon emoji
    isFullMoon: boolean;
  };
  weather: {
    condition: string;       // "foggy"
    conditionName: string;   // "Foggy"
    temperature: number;     // Celsius
    icon: string;            // Weather emoji
    gameplayEffect?: string; // "-2 Perception checks"
  };
  upcomingEvents: Array<{
    eventId: string;
    name: string;
    triggerDate: string;
    daysUntil: number;
    urgency: 'safe' | 'soon' | 'urgent';
    locationId?: string;
    filePath?: string;
  }>;
  calendarFilePath: string;  // For opening file on click
  lastUpdated: string;       // ISO timestamp
  errors: Array<{ file: string; message: string }>;
}

/**
 * Raw calendar YAML structure (matches game-data/calendar.yaml from Epic 2)
 */
interface RawCalendarYaml {
  current?: {
    date?: string;
    time?: string;
    day_of_week?: string;
    season?: string;
  };
  moon?: {
    current_phase?: string;
    days_until_full?: number;
  };
  weather?: {
    current?: string;
    temperature?: number;
    visibility?: string;
    wind?: string;
  };
  events?: Array<{
    eventId?: string;
    name?: string;
    triggerDate?: string;
    triggerTime?: string;
    locationId?: string;
    status?: string;
  }>;
}

/**
 * Barovian month names mapping (1-12)
 */
const BAROVIAN_MONTHS: { [key: number]: string } = {
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
const MOON_PHASE_ICONS: { [key: string]: string } = {
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
const MOON_PHASE_NAMES: { [key: string]: string } = {
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
const WEATHER_ICONS: { [key: string]: string } = {
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
const WEATHER_NAMES: { [key: string]: string } = {
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
const WEATHER_EFFECTS: { [key: string]: string } = {
  'foggy': '-2 Perception (sight)',
  'heavy_rain': '-2 Perception (hearing), disadvantage on ranged attacks',
  'thunderstorm': 'Deafened during thunder, disadvantage on ranged attacks',
  'blizzard': 'Heavily obscured, extreme cold exposure',
  'heavy_snow': 'Difficult terrain outdoors'
};

/**
 * Season emoji icons
 */
const SEASON_ICONS: { [key: string]: string } = {
  'spring': '🌸',
  'summer': '☀️',
  'autumn': '🍂',
  'winter': '❄️'
};

/**
 * CalendarWidget - Webview panel for calendar display
 */
export class CalendarWidget extends BasePanel {
  public static readonly viewType = 'kapis-rpg.calendar-widget';

  private static instance: CalendarWidget | undefined;
  private calendarPath: string | undefined;
  private fileWatcherManager: FileWatcherManager | undefined;
  private fileWatcherDisposable: vscode.Disposable | undefined;
  private refreshDebounceTimer: NodeJS.Timeout | undefined;

  /**
   * Create a new CalendarWidget
   * @param context - VS Code extension context
   * @param fileWatcherManager - Optional file watcher manager for auto-refresh
   */
  constructor(
    context: vscode.ExtensionContext,
    fileWatcherManager?: FileWatcherManager
  ) {
    const config: PanelConfig = {
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
  public static getInstance(
    context: vscode.ExtensionContext,
    fileWatcherManager?: FileWatcherManager
  ): CalendarWidget {
    if (!CalendarWidget.instance) {
      CalendarWidget.instance = new CalendarWidget(context, fileWatcherManager);
    }
    return CalendarWidget.instance;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  public static resetInstance(): void {
    if (CalendarWidget.instance) {
      CalendarWidget.instance.dispose();
      CalendarWidget.instance = undefined;
    }
  }

  /**
   * Show the panel
   * @returns Result object
   */
  public async show(): Promise<PanelResult> {
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
  private setupFileWatcher(): void {
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
    const pattern = new vscode.RelativePattern(
      path.dirname(this.calendarPath),
      'calendar.yaml'
    );
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
  protected async getInitialState(): Promise<CalendarWidgetState | { error: string }> {
    return this.loadCalendarData();
  }

  /**
   * Handle messages from the webview
   * Implements abstract method from BasePanel
   */
  protected async handleMessage(message: PanelMessage): Promise<void> {
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
  protected async refreshData(): Promise<CalendarWidgetState | { error: string }> {
    return this.loadCalendarData();
  }

  /**
   * Load calendar data from game-data/calendar.yaml
   */
  private async loadCalendarData(): Promise<CalendarWidgetState> {
    const errors: Array<{ file: string; message: string }> = [];
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!workspaceRoot) {
      return this.createEmptyState('No workspace folder found', errors);
    }

    const calendarPath = path.join(workspaceRoot, 'game-data', 'calendar.yaml');

    // Check if calendar file exists
    let calendarYaml: RawCalendarYaml = {};
    try {
      const content = await fs.readFile(calendarPath, 'utf-8');
      calendarYaml = yaml.load(content) as RawCalendarYaml || {};
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        errors.push({ file: calendarPath, message: 'Calendar not initialized - file does not exist' });
      } else {
        errors.push({ file: calendarPath, message: `Failed to parse calendar: ${(error as Error).message}` });
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
    const state: CalendarWidgetState = {
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
  private async loadUpcomingEvents(
    currentDate: string,
    workspaceRoot: string,
    calendarEvents: RawCalendarYaml['events'],
    errors: Array<{ file: string; message: string }>
  ): Promise<CalendarWidgetState['upcomingEvents']> {
    const events: CalendarWidgetState['upcomingEvents'] = [];
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
        if (!dir.isDirectory()) continue;

        const eventsPath = path.join(locationsDir, dir.name, 'Events.md');
        try {
          const content = await fs.readFile(eventsPath, 'utf-8');
          const locationEvents = this.parseEventsFromMarkdown(content, currentDate, eventsPath, dir.name);
          events.push(...locationEvents);
        } catch (error) {
          // Events.md doesn't exist for this location - that's OK
        }
      }
    } catch (error) {
      // Locations directory doesn't exist
    }

    // Sort by trigger date (soonest first) and limit to 5
    events.sort((a, b) => a.daysUntil - b.daysUntil);
    return events.slice(0, 5);
  }

  /**
   * Parse events from a location's Events.md file
   */
  private parseEventsFromMarkdown(
    content: string,
    currentDate: string,
    filePath: string,
    locationId: string
  ): CalendarWidgetState['upcomingEvents'] {
    const events: CalendarWidgetState['upcomingEvents'] = [];

    // Look for YAML frontmatter with events
    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (yamlMatch) {
      try {
        const frontmatter = yaml.load(yamlMatch[1]) as any;
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
      } catch (error) {
        // Failed to parse YAML frontmatter
      }
    }

    return events;
  }

  /**
   * Calculate days until a target date from current date
   * Date format: YYYY-MM-DD (e.g., "735-10-1")
   */
  private calculateDaysUntil(currentDate: string, targetDate: string): number {
    try {
      const [currentYear, currentMonth, currentDay] = currentDate.split('-').map(Number);
      const [targetYear, targetMonth, targetDay] = targetDate.split('-').map(Number);

      // Simple calculation assuming 30 days per month
      const currentTotal = currentYear * 360 + currentMonth * 30 + currentDay;
      const targetTotal = targetYear * 360 + targetMonth * 30 + targetDay;

      return targetTotal - currentTotal;
    } catch (error) {
      return 999; // Far future if parsing fails
    }
  }

  /**
   * Get urgency level based on days until event
   */
  private getUrgencyLevel(daysUntil: number): 'safe' | 'soon' | 'urgent' {
    if (daysUntil <= 1) return 'urgent';
    if (daysUntil <= 4) return 'soon';
    return 'safe';
  }

  /**
   * Format date from "735-10-1" to "1st of Leaffall, 735 BC"
   */
  private formatDate(dateStr: string): string {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const monthName = BAROVIAN_MONTHS[month] || `Month ${month}`;
      const ordinal = this.getOrdinal(day);
      return `${ordinal} of ${monthName}, ${year} BC`;
    } catch (error) {
      return dateStr;
    }
  }

  /**
   * Get ordinal suffix for day (1st, 2nd, 3rd, etc.)
   */
  private getOrdinal(day: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = day % 100;
    return day + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }

  /**
   * Format time from "08:00" to "8:00 AM"
   */
  private formatTime(timeStr: string): string {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      return timeStr;
    }
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Create empty state with error message
   */
  private createEmptyState(
    errorMessage: string,
    errors: Array<{ file: string; message: string }>
  ): CalendarWidgetState {
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
  private async openCalendarFile(): Promise<void> {
    if (!this.calendarPath) {
      vscode.window.showWarningMessage('Calendar file path not set');
      return;
    }

    try {
      const doc = await vscode.workspace.openTextDocument(this.calendarPath);
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open calendar file: ${(error as Error).message}`);
    }
  }

  /**
   * Open a file in the editor
   */
  private async openFile(filePath: string): Promise<void> {
    try {
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file: ${(error as Error).message}`);
    }
  }

  /**
   * Dispose panel and cleanup
   */
  public dispose(): void {
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

/**
 * Register calendar widget commands
 * @param context - VS Code extension context
 * @param fileWatcherManager - Optional file watcher manager
 */
export function registerCalendarWidgetCommands(
  context: vscode.ExtensionContext,
  fileWatcherManager?: FileWatcherManager
): void {
  // Register showCalendar command
  context.subscriptions.push(
    vscode.commands.registerCommand('kapis-rpg.showCalendar', async () => {
      const panel = CalendarWidget.getInstance(context, fileWatcherManager);
      const result = await panel.show();

      if (!result.success) {
        vscode.window.showErrorMessage(`Failed to show Calendar: ${result.message}`);
      }
    })
  );
}
