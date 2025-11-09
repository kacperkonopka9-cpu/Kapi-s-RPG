/**
 * Unit tests for CalendarManager module
 * Target: ≥90% statement coverage
 *
 * Tests cover:
 * - YAML parsing and serialization
 * - Calendar creation with valid initial values
 * - Calendar loading with missing files
 * - Calendar saving with validation
 * - Schema validation for all fields
 * - Error handling and edge cases
 * - Performance requirements (< 50ms load, < 100ms save)
 * - Date/time format validation
 * - Enum validation
 */

const CalendarManager = require('../../src/calendar/calendar-manager');
const path = require('path');

describe('CalendarManager', () => {
  let calendarManager;
  let mockFs;
  let mockYaml;

  beforeEach(() => {
    // Create fresh mocks for each test
    mockFs = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      access: jest.fn()
    };

    mockYaml = {
      load: jest.fn(),
      dump: jest.fn(),
      SAFE_SCHEMA: 'SAFE_SCHEMA'
    };

    // Spy on console.warn to suppress warnings in tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.warn
    console.warn.mockRestore();
  });

  // ========================================================================
  // Constructor and Initialization
  // ========================================================================

  describe('Constructor', () => {
    test('should initialize with default dependencies', () => {
      calendarManager = new CalendarManager();

      expect(calendarManager.fs).toBeDefined();
      expect(calendarManager.path).toBeDefined();
      expect(calendarManager.yaml).toBeDefined();
      expect(calendarManager.calendarPath).toBe('calendar.yaml');
    });

    test('should accept custom calendarPath', () => {
      const customPath = 'custom/calendar.yaml';
      calendarManager = new CalendarManager({ calendarPath: customPath });

      expect(calendarManager.calendarPath).toBe(customPath);
    });

    test('should accept dependency injection', () => {
      calendarManager = new CalendarManager({
        fs: mockFs,
        path: path,
        yaml: mockYaml,
        calendarPath: 'test-calendar.yaml'
      });

      expect(calendarManager.fs).toBe(mockFs);
      expect(calendarManager.yaml).toBe(mockYaml);
      expect(calendarManager.calendarPath).toBe('test-calendar.yaml');
    });
  });

  // ========================================================================
  // Date/Time Format Validation
  // ========================================================================

  describe('Date/Time Format Validation', () => {
    beforeEach(() => {
      calendarManager = new CalendarManager({
        fs: mockFs,
        yaml: mockYaml
      });
    });

    test('should validate correct date format', () => {
      expect(calendarManager._isValidDateFormat('735-10-3')).toBe(true);
      expect(calendarManager._isValidDateFormat('2024-01-15')).toBe(true);
    });

    test('should reject invalid date formats', () => {
      expect(calendarManager._isValidDateFormat('2024/10/03')).toBe(false);
      expect(calendarManager._isValidDateFormat('Oct 3, 2024')).toBe(false);
      expect(calendarManager._isValidDateFormat('2024-1-3')).toBe(true); // Allow single digits
      expect(calendarManager._isValidDateFormat(null)).toBe(false);
      expect(calendarManager._isValidDateFormat(undefined)).toBe(false);
      expect(calendarManager._isValidDateFormat(123)).toBe(false);
    });

    test('should validate correct time format', () => {
      expect(calendarManager._isValidTimeFormat('08:00')).toBe(true);
      expect(calendarManager._isValidTimeFormat('14:30')).toBe(true);
      expect(calendarManager._isValidTimeFormat('23:59')).toBe(true);
      expect(calendarManager._isValidTimeFormat('0:00')).toBe(true);
    });

    test('should reject invalid time formats', () => {
      expect(calendarManager._isValidTimeFormat('8:00 AM')).toBe(false);
      expect(calendarManager._isValidTimeFormat('25:00')).toBe(false);
      expect(calendarManager._isValidTimeFormat('14:60')).toBe(false);
      expect(calendarManager._isValidTimeFormat('14')).toBe(false);
      expect(calendarManager._isValidTimeFormat(null)).toBe(false);
      expect(calendarManager._isValidTimeFormat(undefined)).toBe(false);
    });
  });

  // ========================================================================
  // Enum Validation
  // ========================================================================

  describe('Enum Validation', () => {
    beforeEach(() => {
      calendarManager = new CalendarManager({
        fs: mockFs,
        yaml: mockYaml
      });
    });

    test('should validate enum values', () => {
      const result = calendarManager._validateEnum(
        'spring',
        ['spring', 'summer', 'autumn', 'winter'],
        'season'
      );
      expect(result.valid).toBe(true);
    });

    test('should reject invalid enum values', () => {
      const result = calendarManager._validateEnum(
        'fall',
        ['spring', 'summer', 'autumn', 'winter'],
        'season'
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid season');
      expect(result.error).toContain('fall');
    });
  });

  // ========================================================================
  // createCalendar() Method
  // ========================================================================

  describe('createCalendar()', () => {
    beforeEach(() => {
      calendarManager = new CalendarManager({
        fs: mockFs,
        yaml: mockYaml
      });

      mockYaml.dump.mockReturnValue('mocked yaml content');
      mockFs.writeFile.mockResolvedValue();
    });

    test('should create calendar with valid initial date/time', async () => {
      const result = await calendarManager.createCalendar('735-10-3', '14:30');

      expect(result.success).toBe(true);
      expect(result.calendar).toBeDefined();
      expect(result.calendar.current.date).toBe('735-10-3');
      expect(result.calendar.current.time).toBe('14:30');
    });

    test('should set advancement mode to hybrid by default', async () => {
      const result = await calendarManager.createCalendar('735-10-1', '08:00');

      expect(result.success).toBe(true);
      expect(result.calendar.advancement.mode).toBe('hybrid');
    });

    test('should calculate day of week from date', async () => {
      const result = await calendarManager.createCalendar('735-10-1', '08:00');

      expect(result.success).toBe(true);
      expect(result.calendar.current.day_of_week).toBeDefined();
      expect(['Moonday', 'Toilday', 'Wealday', 'Oathday', 'Fireday', 'Starday', 'Sunday']).toContain(
        result.calendar.current.day_of_week
      );
    });

    test('should calculate season from date', async () => {
      const result = await calendarManager.createCalendar('735-10-15', '12:00');

      expect(result.success).toBe(true);
      expect(result.calendar.current.season).toBe('autumn'); // October is autumn
    });

    test('should calculate moon phase from date', async () => {
      const result = await calendarManager.createCalendar('735-10-1', '08:00');

      expect(result.success).toBe(true);
      expect(result.calendar.moon.current_phase).toBeDefined();
      expect(['new', 'waxing_crescent', 'first_quarter', 'waxing_gibbous', 'full', 'waning_gibbous', 'last_quarter', 'waning_crescent']).toContain(
        result.calendar.moon.current_phase
      );
    });

    test('should initialize weather based on season', async () => {
      const result = await calendarManager.createCalendar('735-10-15', '12:00');

      expect(result.success).toBe(true);
      expect(result.calendar.weather.current).toBeDefined();
      expect(result.calendar.weather.temperature).toBeDefined();
      expect(result.calendar.weather.wind).toBeDefined();
      expect(result.calendar.weather.visibility).toBeDefined();
    });

    test('should create empty events, npc_schedules, and history arrays', async () => {
      const result = await calendarManager.createCalendar('735-10-1', '08:00');

      expect(result.success).toBe(true);
      expect(Array.isArray(result.calendar.events)).toBe(true);
      expect(result.calendar.events.length).toBe(0);
      expect(Array.isArray(result.calendar.npc_schedules)).toBe(true);
      expect(result.calendar.npc_schedules.length).toBe(0);
      expect(Array.isArray(result.calendar.history)).toBe(true);
      expect(result.calendar.history.length).toBe(0);
    });

    test('should set metadata.campaign_start_date', async () => {
      const result = await calendarManager.createCalendar('735-10-1', '08:00');

      expect(result.success).toBe(true);
      expect(result.calendar.metadata.campaign_start_date).toBe('735-10-1 08:00');
    });

    test('should use YAML.dump with sortKeys and SAFE_SCHEMA', async () => {
      await calendarManager.createCalendar('735-10-1', '08:00');

      expect(mockYaml.dump).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          schema: 'SAFE_SCHEMA',
          sortKeys: true,
          lineWidth: -1
        })
      );
    });

    test('should write calendar to file', async () => {
      await calendarManager.createCalendar('735-10-1', '08:00');

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'calendar.yaml',
        'mocked yaml content',
        'utf-8'
      );
    });

    test('should reject invalid date format', async () => {
      const result = await calendarManager.createCalendar('2024/10/01', '08:00');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid date format');
    });

    test('should reject invalid time format', async () => {
      const result = await calendarManager.createCalendar('735-10-1', '8:00 AM');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid time format');
    });

    test('should handle file write errors gracefully', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('Permission denied'));

      const result = await calendarManager.createCalendar('735-10-1', '08:00');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create calendar');
    });
  });

  // ========================================================================
  // loadCalendar() Method
  // ========================================================================

  describe('loadCalendar()', () => {
    beforeEach(() => {
      calendarManager = new CalendarManager({
        fs: mockFs,
        yaml: mockYaml
      });
    });

    test('should load and parse calendar.yaml', async () => {
      const mockCalendar = {
        current: {
          date: '735-10-3',
          time: '14:30',
          day_of_week: 'Fireday',
          season: 'autumn'
        },
        advancement: {
          mode: 'hybrid',
          auto_advance_on_travel: true,
          auto_advance_on_rest: true,
          default_action_minutes: 10
        },
        moon: {
          current_phase: 'full',
          days_until_full: 0
        },
        weather: {
          current: 'clear',
          temperature: 10,
          wind: 'light',
          visibility: 'good'
        },
        events: [],
        npc_schedules: [],
        history: [],
        metadata: {
          campaign_start_date: '735-10-1 08:00',
          real_world_session_count: 1,
          total_in_game_hours: 10
        }
      };

      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue('yaml content');
      mockYaml.load.mockReturnValue(mockCalendar);

      const result = await calendarManager.loadCalendar();

      expect(result.success).toBe(true);
      expect(result.calendar).toEqual(mockCalendar);
      expect(mockYaml.load).toHaveBeenCalledWith('yaml content', { schema: 'SAFE_SCHEMA' });
    });

    test('should return default calendar when file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const result = await calendarManager.loadCalendar();

      expect(result.success).toBe(true);
      expect(result.calendar).toBeDefined();
      expect(result.calendar.current).toBeDefined();
      expect(result.calendar.advancement).toBeDefined();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });

    test('should return default calendar when YAML is malformed', async () => {
      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue('invalid: yaml: content:');
      mockYaml.load.mockImplementation(() => {
        throw new Error('YAMLException: bad indentation');
      });

      const result = await calendarManager.loadCalendar();

      expect(result.success).toBe(true);
      expect(result.calendar).toBeDefined();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Malformed'));
    });

    test('should complete in < 50ms (performance test)', async () => {
      const mockCalendar = {
        current: { date: '735-10-3', time: '14:30', day_of_week: 'Fireday', season: 'autumn' },
        advancement: { mode: 'hybrid', auto_advance_on_travel: true, auto_advance_on_rest: true, default_action_minutes: 10 },
        moon: { current_phase: 'full', days_until_full: 0 },
        weather: { current: 'clear', temperature: 10, wind: 'light', visibility: 'good' },
        events: [],
        npc_schedules: [],
        history: [],
        metadata: { campaign_start_date: '735-10-1 08:00', real_world_session_count: 0, total_in_game_hours: 0 }
      };

      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue('yaml content');
      mockYaml.load.mockReturnValue(mockCalendar);

      const startTime = Date.now();
      await calendarManager.loadCalendar();
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(50);
    });
  });

  // ========================================================================
  // saveCalendar() Method
  // ========================================================================

  describe('saveCalendar()', () => {
    beforeEach(() => {
      calendarManager = new CalendarManager({
        fs: mockFs,
        yaml: mockYaml
      });

      mockYaml.dump.mockReturnValue('yaml output');
      mockFs.writeFile.mockResolvedValue();
    });

    test('should save valid calendar data', async () => {
      const calendar = {
        current: { date: '735-10-3', time: '14:30', day_of_week: 'Fireday', season: 'autumn' },
        advancement: { mode: 'hybrid', auto_advance_on_travel: true, auto_advance_on_rest: true, default_action_minutes: 10 },
        moon: { current_phase: 'full', days_until_full: 0 },
        weather: { current: 'clear', temperature: 10, wind: 'light', visibility: 'good' },
        events: [],
        npc_schedules: [],
        history: [],
        metadata: { campaign_start_date: '735-10-1 08:00', real_world_session_count: 0, total_in_game_hours: 0 }
      };

      const result = await calendarManager.saveCalendar(calendar);

      expect(result.success).toBe(true);
      expect(mockYaml.dump).toHaveBeenCalledWith(
        calendar,
        expect.objectContaining({
          schema: 'SAFE_SCHEMA',
          sortKeys: true,
          lineWidth: -1
        })
      );
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    test('should reject calendar with invalid enum values', async () => {
      const invalidCalendar = {
        current: { date: '735-10-3', time: '14:30', day_of_week: 'InvalidDay', season: 'autumn' },
        advancement: { mode: 'hybrid', auto_advance_on_travel: true, auto_advance_on_rest: true, default_action_minutes: 10 },
        moon: { current_phase: 'full', days_until_full: 0 },
        weather: { current: 'clear', temperature: 10, wind: 'light', visibility: 'good' },
        events: [],
        npc_schedules: [],
        history: [],
        metadata: { campaign_start_date: '735-10-1 08:00', real_world_session_count: 0, total_in_game_hours: 0 }
      };

      const result = await calendarManager.saveCalendar(invalidCalendar);

      expect(result.success).toBe(false);
      expect(result.error).toContain('validation failed');
    });

    test('should reject calendar with invalid date format', async () => {
      const invalidCalendar = {
        current: { date: '2024/10/03', time: '14:30', day_of_week: 'Fireday', season: 'autumn' },
        advancement: { mode: 'hybrid', auto_advance_on_travel: true, auto_advance_on_rest: true, default_action_minutes: 10 },
        moon: { current_phase: 'full', days_until_full: 0 },
        weather: { current: 'clear', temperature: 10, wind: 'light', visibility: 'good' },
        events: [],
        npc_schedules: [],
        history: [],
        metadata: { campaign_start_date: '735-10-1 08:00', real_world_session_count: 0, total_in_game_hours: 0 }
      };

      const result = await calendarManager.saveCalendar(invalidCalendar);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid date format');
    });

    test('should handle file write errors gracefully', async () => {
      const calendar = {
        current: { date: '735-10-3', time: '14:30', day_of_week: 'Fireday', season: 'autumn' },
        advancement: { mode: 'hybrid', auto_advance_on_travel: true, auto_advance_on_rest: true, default_action_minutes: 10 },
        moon: { current_phase: 'full', days_until_full: 0 },
        weather: { current: 'clear', temperature: 10, wind: 'light', visibility: 'good' },
        events: [],
        npc_schedules: [],
        history: [],
        metadata: { campaign_start_date: '735-10-1 08:00', real_world_session_count: 0, total_in_game_hours: 0 }
      };

      mockFs.writeFile.mockRejectedValue(new Error('Permission denied'));

      const result = await calendarManager.saveCalendar(calendar);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to save calendar');
    });

    test('should complete in < 100ms (performance test)', async () => {
      const calendar = {
        current: { date: '735-10-3', time: '14:30', day_of_week: 'Fireday', season: 'autumn' },
        advancement: { mode: 'hybrid', auto_advance_on_travel: true, auto_advance_on_rest: true, default_action_minutes: 10 },
        moon: { current_phase: 'full', days_until_full: 0 },
        weather: { current: 'clear', temperature: 10, wind: 'light', visibility: 'good' },
        events: [],
        npc_schedules: [],
        history: [],
        metadata: { campaign_start_date: '735-10-1 08:00', real_world_session_count: 0, total_in_game_hours: 0 }
      };

      const startTime = Date.now();
      await calendarManager.saveCalendar(calendar);
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(100);
    });
  });

  // ========================================================================
  // getCurrentTime() Method
  // ========================================================================

  describe('getCurrentTime()', () => {
    beforeEach(() => {
      calendarManager = new CalendarManager({
        fs: mockFs,
        yaml: mockYaml
      });
    });

    test('should return current date and time', async () => {
      const mockCalendar = {
        current: { date: '735-10-5', time: '16:45', day_of_week: 'Sunday', season: 'autumn' },
        advancement: { mode: 'hybrid', auto_advance_on_travel: true, auto_advance_on_rest: true, default_action_minutes: 10 },
        moon: { current_phase: 'full', days_until_full: 0 },
        weather: { current: 'clear', temperature: 10, wind: 'light', visibility: 'good' },
        events: [],
        npc_schedules: [],
        history: [],
        metadata: { campaign_start_date: '735-10-1 08:00', real_world_session_count: 0, total_in_game_hours: 0 }
      };

      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue('yaml content');
      mockYaml.load.mockReturnValue(mockCalendar);

      const result = await calendarManager.getCurrentTime();

      expect(result.date).toBe('735-10-5');
      expect(result.time).toBe('16:45');
    });

    test('should return default time when load fails', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const result = await calendarManager.getCurrentTime();

      expect(result.date).toBeDefined();
      expect(result.time).toBeDefined();
    });
  });

  // ========================================================================
  // updateCurrentTime() Method
  // ========================================================================

  describe('updateCurrentTime()', () => {
    beforeEach(() => {
      calendarManager = new CalendarManager({
        fs: mockFs,
        yaml: mockYaml
      });
    });

    test('should update current time and recalculate derived fields', async () => {
      const mockCalendar = {
        current: { date: '735-10-1', time: '08:00', day_of_week: 'Moonday', season: 'autumn' },
        advancement: { mode: 'hybrid', auto_advance_on_travel: true, auto_advance_on_rest: true, default_action_minutes: 10 },
        moon: { current_phase: 'new', days_until_full: 14 },
        weather: { current: 'clear', temperature: 10, wind: 'light', visibility: 'good' },
        events: [],
        npc_schedules: [],
        history: [],
        metadata: { campaign_start_date: '735-10-1 08:00', real_world_session_count: 0, total_in_game_hours: 0 }
      };

      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue('yaml content');
      mockYaml.load.mockReturnValue(mockCalendar);
      mockYaml.dump.mockReturnValue('updated yaml');
      mockFs.writeFile.mockResolvedValue();

      const result = await calendarManager.updateCurrentTime('735-10-15', '20:00');

      expect(result.success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    test('should reject invalid date format', async () => {
      const result = await calendarManager.updateCurrentTime('2024/10/15', '20:00');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid date format');
    });

    test('should reject invalid time format', async () => {
      const result = await calendarManager.updateCurrentTime('735-10-15', '8:00 PM');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid time format');
    });
  });

  // ========================================================================
  // Error Handling
  // ========================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      calendarManager = new CalendarManager({
        fs: mockFs,
        yaml: mockYaml
      });
    });

    test('should never throw exceptions', async () => {
      mockFs.access.mockRejectedValue(new Error('Catastrophic failure'));

      await expect(calendarManager.loadCalendar()).resolves.toBeDefined();
    });

    test('should return error objects with success: false', async () => {
      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockRejectedValue(new Error('Read error'));

      const result = await calendarManager.loadCalendar();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
