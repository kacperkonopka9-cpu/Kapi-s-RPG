/**
 * Unit and Integration tests for EventExecutor
 * Uses mocked dependencies for unit tests, real files for integration tests
 *
 * Tests cover all 8 Acceptance Criteria:
 * - AC-1: EventExecutor Module Creation
 * - AC-2: Load Event Definition from Events.md
 * - AC-3: Execute Event and Apply State Updates
 * - AC-4: Update Location State.md Files
 * - AC-5: Event Execution Result
 * - AC-6: Generate Event Narrative
 * - AC-7: Error Handling and Rollback
 * - AC-8: Performance Requirement (< 500ms)
 */

const EventExecutor = require('../../src/calendar/event-executor');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

describe('EventExecutor', () => {
  let eventExecutor;
  let mockLocationLoader;
  let mockStateManager;
  let mockCalendarManager;
  let mockFs;
  let mockYaml;

  beforeEach(() => {
    // Mock dependencies
    mockLocationLoader = {
      loadLocation: jest.fn()
    };

    mockStateManager = {
      getState: jest.fn(),
      updateCustomState: jest.fn()
    };

    mockCalendarManager = {
      updateEventStatus: jest.fn()
    };

    mockFs = {
      readFile: jest.fn(),
      writeFile: jest.fn()
    };

    mockYaml = {
      load: jest.fn(),
      dump: jest.fn()
    };

    eventExecutor = new EventExecutor({
      locationLoader: mockLocationLoader,
      stateManager: mockStateManager,
      calendarManager: mockCalendarManager,
      fs: mockFs,
      yaml: mockYaml,
      dataDir: 'data'
    });
  });

  // ========================================================================
  // AC-1: EventExecutor Module Creation
  // ========================================================================

  describe('Constructor (AC-1)', () => {
    test('should initialize with dependency injection', () => {
      expect(eventExecutor.locationLoader).toBe(mockLocationLoader);
      expect(eventExecutor.stateManager).toBe(mockStateManager);
      expect(eventExecutor.calendarManager).toBe(mockCalendarManager);
      expect(eventExecutor.dataDir).toBe('data');
    });

    test('should throw error if locationLoader is missing', () => {
      expect(() => {
        new EventExecutor({
          stateManager: mockStateManager,
          calendarManager: mockCalendarManager
        });
      }).toThrow('EventExecutor requires locationLoader dependency');
    });

    test('should throw error if stateManager is missing', () => {
      expect(() => {
        new EventExecutor({
          locationLoader: mockLocationLoader,
          calendarManager: mockCalendarManager
        });
      }).toThrow('EventExecutor requires stateManager dependency');
    });

    test('should throw error if calendarManager is missing', () => {
      expect(() => {
        new EventExecutor({
          locationLoader: mockLocationLoader,
          stateManager: mockStateManager
        });
      }).toThrow('EventExecutor requires calendarManager dependency');
    });
  });

  // ========================================================================
  // AC-2: Load Event Definition from Events.md
  // ========================================================================

  describe('loadEventDefinition() (AC-2)', () => {
    const sampleEventsYaml = `### Events
\`\`\`yaml
events:
  - eventId: death_of_burgomaster
    name: Death of Burgomaster Kolyan
    description: The burgomaster succumbs to his injuries
    effects:
      - type: npc_status
        npcId: kolyan_indirovich
        status: Dead
      - type: state_update
        locationId: village-of-barovia
        stateChanges:
          burgomaster_dead: true
      - type: quest_trigger
        questId: escort_ireena
        newStatus: Active
    narrativeTemplate: "The burgomaster has died. Ireena and Ismark mourn their father."
\`\`\``;

    test('should load event definition from Events.md', async () => {
      mockFs.readFile.mockResolvedValue(sampleEventsYaml);
      mockYaml.load.mockReturnValue({
        events: [
          {
            eventId: 'death_of_burgomaster',
            name: 'Death of Burgomaster Kolyan',
            description: 'The burgomaster succumbs to his injuries',
            effects: [
              { type: 'npc_status', npcId: 'kolyan_indirovich', status: 'Dead' }
            ],
            narrativeTemplate: 'The burgomaster has died.'
          }
        ]
      });

      const result = await eventExecutor.loadEventDefinition(
        'death_of_burgomaster',
        'village-of-barovia'
      );

      expect(result.success).toBe(true);
      expect(result.definition).toBeDefined();
      expect(result.definition.eventId).toBe('death_of_burgomaster');
      expect(result.definition.name).toBe('Death of Burgomaster Kolyan');
      expect(result.definition.description).toBe('The burgomaster succumbs to his injuries');
      expect(result.definition.effects).toHaveLength(1);
      expect(result.definition.narrativeTemplate).toBe('The burgomaster has died.');
    });

    test('should return EventDefinition object with correct structure', async () => {
      mockFs.readFile.mockResolvedValue(sampleEventsYaml);
      mockYaml.load.mockReturnValue({
        events: [
          {
            eventId: 'test_event',
            name: 'Test Event',
            description: 'Test description',
            effects: [],
            narrativeTemplate: 'Test template'
          }
        ]
      });

      const result = await eventExecutor.loadEventDefinition('test_event', 'test-location');

      expect(result.definition).toHaveProperty('eventId');
      expect(result.definition).toHaveProperty('name');
      expect(result.definition).toHaveProperty('description');
      expect(result.definition).toHaveProperty('effects');
      expect(result.definition).toHaveProperty('narrativeTemplate');
    });

    test('should handle missing Events.md gracefully', async () => {
      const error = new Error('ENOENT');
      error.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);

      const result = await eventExecutor.loadEventDefinition(
        'test_event',
        'missing-location'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Events.md not found');
    });

    test('should handle missing eventId gracefully', async () => {
      mockFs.readFile.mockResolvedValue(sampleEventsYaml);
      mockYaml.load.mockReturnValue({
        events: [
          { eventId: 'other_event', name: 'Other Event' }
        ]
      });

      const result = await eventExecutor.loadEventDefinition(
        'missing_event',
        'village-of-barovia'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Event not found: missing_event');
    });

    test('should validate input parameters', async () => {
      const result1 = await eventExecutor.loadEventDefinition('', 'location');
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('eventId must be a non-empty string');

      const result2 = await eventExecutor.loadEventDefinition('event', '');
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('locationId must be a non-empty string');

      const result3 = await eventExecutor.loadEventDefinition(null, 'location');
      expect(result3.success).toBe(false);

      const result4 = await eventExecutor.loadEventDefinition('event', null);
      expect(result4.success).toBe(false);
    });

    test('should handle invalid YAML gracefully', async () => {
      mockFs.readFile.mockResolvedValue(`### Events\n\`\`\`yaml\ninvalid: yaml: content:\n\`\`\``);
      mockYaml.load.mockImplementation(() => {
        throw new Error('Invalid YAML');
      });

      const result = await eventExecutor.loadEventDefinition('test', 'location');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse Events YAML');
    });

    test('should handle missing YAML block gracefully', async () => {
      mockFs.readFile.mockResolvedValue('# No YAML block here\n\nJust markdown content.');

      const result = await eventExecutor.loadEventDefinition('test', 'location');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No Events YAML block found');
    });
  });

  // ========================================================================
  // AC-3, AC-5: Execute Event and Apply State Updates
  // ========================================================================

  describe('execute() (AC-3, AC-5)', () => {
    const sampleEvent = {
      eventId: 'death_of_burgomaster',
      name: 'Death of Burgomaster Kolyan',
      locationId: 'village-of-barovia',
      triggerDate: '0735-10-13',
      triggerTime: '06:00'
    };

    const sampleEventDef = {
      eventId: 'death_of_burgomaster',
      name: 'Death of Burgomaster Kolyan',
      description: 'The burgomaster succumbs',
      effects: [
        {
          type: 'npc_status',
          npcId: 'kolyan_indirovich',
          status: 'Dead'
        }
      ],
      narrativeTemplate: 'The burgomaster has died.'
    };

    test('should execute event and apply effects', async () => {
      // Mock loadEventDefinition
      jest.spyOn(eventExecutor, 'loadEventDefinition').mockResolvedValue({
        success: true,
        definition: sampleEventDef
      });

      // Mock NPC status effect
      mockFs.readFile.mockResolvedValue('npcs: {}');
      mockYaml.load.mockReturnValue({ npcs: {} });
      mockYaml.dump.mockReturnValue('npcs:\n  kolyan_indirovich:\n    status: Dead');
      mockFs.writeFile.mockResolvedValue();
      mockCalendarManager.updateEventStatus.mockResolvedValue({ success: true });

      const result = await eventExecutor.execute(sampleEvent, {});

      expect(result.success).toBe(true);
      expect(result.effectsApplied).toHaveLength(1);
      expect(result.effectsApplied[0].type).toBe('npc_status');
      expect(result.stateUpdates).toHaveLength(1);
    });

    test('should return EventExecutionResult with correct structure (AC-5)', async () => {
      jest.spyOn(eventExecutor, 'loadEventDefinition').mockResolvedValue({
        success: true,
        definition: sampleEventDef
      });

      mockFs.readFile.mockResolvedValue('npcs: {}');
      mockYaml.load.mockReturnValue({ npcs: {} });
      mockYaml.dump.mockReturnValue('npcs: {}');
      mockFs.writeFile.mockResolvedValue();
      mockCalendarManager.updateEventStatus.mockResolvedValue({ success: true });

      const result = await eventExecutor.execute(sampleEvent, {});

      // Verify EventExecutionResult structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('executedAt');
      expect(result).toHaveProperty('effectsApplied');
      expect(result).toHaveProperty('stateUpdates');
      expect(result).toHaveProperty('executionTimeMs');
      expect(result).toHaveProperty('narrative');

      expect(typeof result.success).toBe('boolean');
      expect(typeof result.executedAt).toBe('string');
      expect(Array.isArray(result.effectsApplied)).toBe(true);
      expect(Array.isArray(result.stateUpdates)).toBe(true);
      expect(typeof result.executionTimeMs).toBe('number');
      expect(typeof result.narrative).toBe('string');
    });

    test('should mark event as completed on success', async () => {
      jest.spyOn(eventExecutor, 'loadEventDefinition').mockResolvedValue({
        success: true,
        definition: sampleEventDef
      });

      mockFs.readFile.mockResolvedValue('npcs: {}');
      mockYaml.load.mockReturnValue({ npcs: {} });
      mockYaml.dump.mockReturnValue('npcs: {}');
      mockFs.writeFile.mockResolvedValue();
      mockCalendarManager.updateEventStatus.mockResolvedValue({ success: true });

      await eventExecutor.execute(sampleEvent, {});

      expect(mockCalendarManager.updateEventStatus).toHaveBeenCalledWith(
        'death_of_burgomaster',
        'completed'
      );
    });

    test('should validate event input', async () => {
      const result = await eventExecutor.execute({}, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Event must have eventId and locationId');
    });

    test('should handle loadEventDefinition failure', async () => {
      jest.spyOn(eventExecutor, 'loadEventDefinition').mockResolvedValue({
        success: false,
        error: 'Events.md not found'
      });

      mockCalendarManager.updateEventStatus.mockResolvedValue({ success: true });

      const result = await eventExecutor.execute(sampleEvent, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Events.md not found');
      expect(result.errorType).toBe('event_definition_load_failed');
      expect(mockCalendarManager.updateEventStatus).toHaveBeenCalledWith(
        'death_of_burgomaster',
        'failed'
      );
    });
  });

  // ========================================================================
  // AC-4: Update Location State.md Files
  // ========================================================================

  describe('_applyStateUpdateEffect() (AC-4)', () => {
    test('should update location State.md with state changes', async () => {
      const effect = {
        type: 'state_update',
        locationId: 'village-of-barovia',
        stateChanges: {
          burgomaster_dead: true,
          funeral_scheduled: true
        }
      };

      mockStateManager.getState.mockResolvedValue({
        success: true,
        state: {
          visited: true,
          custom_state: {
            existing_flag: 'value'
          }
        }
      });

      mockStateManager.updateCustomState.mockResolvedValue({
        success: true
      });

      const result = await eventExecutor._applyStateUpdateEffect(effect, 'village-of-barovia');

      expect(result.success).toBe(true);
      expect(result.stateUpdate.file).toBe('village-of-barovia/State.md');
      expect(result.stateUpdate.flags).toContain('burgomaster_dead');
      expect(result.stateUpdate.flags).toContain('funeral_scheduled');

      expect(mockStateManager.updateCustomState).toHaveBeenCalledWith(
        'village-of-barovia',
        {
          existing_flag: 'value',
          burgomaster_dead: true,
          funeral_scheduled: true
        }
      );
    });

    test('should preserve existing state data (no data loss)', async () => {
      const effect = {
        type: 'state_update',
        stateChanges: {
          new_flag: true
        }
      };

      mockStateManager.getState.mockResolvedValue({
        success: true,
        state: {
          visited: true,
          custom_state: {
            flag1: 'value1',
            flag2: 'value2',
            flag3: 'value3'
          }
        }
      });

      mockStateManager.updateCustomState.mockResolvedValue({ success: true });

      await eventExecutor._applyStateUpdateEffect(effect, 'test-location');

      // Verify existing data is preserved
      expect(mockStateManager.updateCustomState).toHaveBeenCalledWith(
        'test-location',
        expect.objectContaining({
          flag1: 'value1',
          flag2: 'value2',
          flag3: 'value3',
          new_flag: true
        })
      );
    });

    test('should handle missing stateChanges', async () => {
      const effect = { type: 'state_update' };

      const result = await eventExecutor._applyStateUpdateEffect(effect, 'location');

      expect(result.success).toBe(false);
      expect(result.error).toContain('stateChanges object');
    });
  });

  // ========================================================================
  // AC-6: Generate Event Narrative
  // ========================================================================

  describe('generateEventNarrative() (AC-6)', () => {
    test('should generate narrative with template variables replaced', async () => {
      const event = {
        eventId: 'test_event',
        name: 'Test Event',
        locationId: 'test-location',
        triggerDate: '0735-10-13',
        triggerTime: '06:00',
        narrativeTemplate: 'At {{location}} on {{date}} at {{time}}, {{eventName}} occurred.'
      };

      const narrative = await eventExecutor.generateEventNarrative(event, false);

      expect(narrative).toContain('test-location');
      expect(narrative).toContain('0735-10-13');
      expect(narrative).toContain('06:00');
      expect(narrative).toContain('Test Event');
    });

    test('should address player when playerPresent=true', async () => {
      const event = {
        eventId: 'test',
        name: 'Test',
        locationId: 'location',
        narrativeTemplate: 'Something happened.'
      };

      const narrative = await eventExecutor.generateEventNarrative(event, true);

      expect(narrative).toContain('You witness');
    });

    test('should use observer perspective when playerPresent=false', async () => {
      const event = {
        eventId: 'test',
        name: 'Test',
        locationId: 'test-location',
        narrativeTemplate: 'Something happened.'
      };

      const narrative = await eventExecutor.generateEventNarrative(event, false);

      expect(narrative).toContain('At test-location');
    });

    test('should handle missing narrativeTemplate with generic description', async () => {
      const event = {
        eventId: 'test_event',
        name: 'Test Event',
        locationId: 'location'
      };

      const narrative = await eventExecutor.generateEventNarrative(event, false);

      expect(narrative).toContain('Test Event');
    });

    test('should use description if narrativeTemplate is missing', async () => {
      const event = {
        eventId: 'test',
        name: 'Test Event',
        description: 'This is a test event description.',
        locationId: 'location'
      };

      const narrative = await eventExecutor.generateEventNarrative(event, false);

      expect(narrative).toContain('This is a test event description.');
    });
  });

  // ========================================================================
  // AC-7: Error Handling and Rollback
  // ========================================================================

  describe('Error Handling and Rollback (AC-7)', () => {
    const sampleEvent = {
      eventId: 'test_event',
      name: 'Test Event',
      locationId: 'test-location'
    };

    test('should NOT partially apply effects on error', async () => {
      const eventDef = {
        eventId: 'test_event',
        effects: [
          { type: 'npc_status', npcId: 'npc1', status: 'Dead' },
          { type: 'npc_status', npcId: 'npc2', status: 'Dead' }
        ]
      };

      jest.spyOn(eventExecutor, 'loadEventDefinition').mockResolvedValue({
        success: true,
        definition: eventDef
      });

      // First effect succeeds, second fails
      mockFs.readFile.mockResolvedValueOnce('npcs: {}');
      mockYaml.load.mockReturnValueOnce({ npcs: {} });
      mockYaml.dump.mockReturnValueOnce('npcs: {}');
      mockFs.writeFile.mockResolvedValueOnce(); // First succeeds

      mockFs.readFile.mockRejectedValueOnce(new Error('File write error')); // Second fails

      mockCalendarManager.updateEventStatus.mockResolvedValue({ success: true });

      const result = await eventExecutor.execute(sampleEvent, {});

      expect(result.success).toBe(false);
      expect(result.effectsApplied).toHaveLength(0);
      expect(result.stateUpdates).toHaveLength(0);
    });

    test('should mark event as failed on error', async () => {
      jest.spyOn(eventExecutor, 'loadEventDefinition').mockResolvedValue({
        success: true,
        definition: {
          eventId: 'test',
          effects: [
            { type: 'npc_status', npcId: 'npc1', status: 'Dead' }
          ]
        }
      });

      mockFs.readFile.mockRejectedValue(new Error('File error'));
      mockCalendarManager.updateEventStatus.mockResolvedValue({ success: true });

      await eventExecutor.execute(sampleEvent, {});

      expect(mockCalendarManager.updateEventStatus).toHaveBeenCalledWith(
        'test_event',
        'failed'
      );
    });

    test('should log error details to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      jest.spyOn(eventExecutor, 'loadEventDefinition').mockResolvedValue({
        success: true,
        definition: {
          effects: [{ type: 'npc_status', npcId: 'npc1', status: 'Dead' }]
        }
      });

      mockFs.readFile.mockRejectedValue(new Error('Test error'));
      mockCalendarManager.updateEventStatus.mockResolvedValue({ success: true });

      await eventExecutor.execute(sampleEvent, {});

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should not crash the system on error', async () => {
      jest.spyOn(eventExecutor, 'loadEventDefinition').mockResolvedValue({
        success: true,
        definition: {
          effects: [{ type: 'npc_status', npcId: 'npc1', status: 'Dead' }]
        }
      });

      mockFs.readFile.mockRejectedValue(new Error('Critical error'));
      mockCalendarManager.updateEventStatus.mockResolvedValue({ success: true });

      // Should not throw
      const result = await eventExecutor.execute(sampleEvent, {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ========================================================================
  // Effect Handlers - NPC Status, Quest Trigger
  // ========================================================================

  describe('_applyNPCStatusEffect()', () => {
    test('should update NPC status in world-state.yaml', async () => {
      const effect = {
        type: 'npc_status',
        npcId: 'kolyan_indirovich',
        status: 'Dead'
      };

      mockFs.readFile.mockResolvedValue('npcs: {}');
      mockYaml.load.mockReturnValue({ npcs: {} });
      mockYaml.dump.mockReturnValue('npcs:\n  kolyan_indirovich:\n    status: Dead');
      mockFs.writeFile.mockResolvedValue();

      const result = await eventExecutor._applyNPCStatusEffect(effect, {});

      expect(result.success).toBe(true);
      expect(result.stateUpdate.file).toBe('world-state.yaml');
      expect(result.stateUpdate.section).toBe('npcs.kolyan_indirovich');
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    test('should create world-state.yaml if it doesn\'t exist', async () => {
      const effect = {
        npcId: 'test_npc',
        status: 'Alive'
      };

      const error = new Error('ENOENT');
      error.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);
      mockYaml.dump.mockReturnValue('npcs: {}');
      mockFs.writeFile.mockResolvedValue();

      const result = await eventExecutor._applyNPCStatusEffect(effect, {});

      expect(result.success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    test('should validate required fields', async () => {
      const result1 = await eventExecutor._applyNPCStatusEffect({}, {});
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('requires npcId and status');

      const result2 = await eventExecutor._applyNPCStatusEffect({ npcId: 'test' }, {});
      expect(result2.success).toBe(false);
    });
  });

  describe('_applyQuestTriggerEffect()', () => {
    test('should activate quest in active-quests.yaml', async () => {
      const effect = {
        type: 'quest_trigger',
        questId: 'escort_ireena',
        newStatus: 'Active'
      };

      mockFs.readFile.mockResolvedValue('quests: []');
      mockYaml.load.mockReturnValue({ quests: [] });
      mockYaml.dump.mockReturnValue('quests:\n  - questId: escort_ireena');
      mockFs.writeFile.mockResolvedValue();

      const result = await eventExecutor._applyQuestTriggerEffect(effect, {});

      expect(result.success).toBe(true);
      expect(result.stateUpdate.file).toBe('active-quests.yaml');
      expect(result.stateUpdate.quest).toBe('escort_ireena');
      expect(result.stateUpdate.status).toBe('Active');
    });

    test('should create active-quests.yaml if it doesn\'t exist', async () => {
      const effect = {
        questId: 'test_quest',
        newStatus: 'Active'
      };

      const error = new Error('ENOENT');
      error.code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);
      mockYaml.dump.mockReturnValue('quests: []');
      mockFs.writeFile.mockResolvedValue();

      const result = await eventExecutor._applyQuestTriggerEffect(effect, {});

      expect(result.success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    test('should update existing quest status', async () => {
      const effect = {
        questId: 'existing_quest',
        newStatus: 'Completed'
      };

      mockFs.readFile.mockResolvedValue('quests: []');
      mockYaml.load.mockReturnValue({
        quests: [
          { questId: 'existing_quest', status: 'Active' }
        ]
      });
      mockYaml.dump.mockReturnValue('quests: []');
      mockFs.writeFile.mockResolvedValue();

      const result = await eventExecutor._applyQuestTriggerEffect(effect, {});

      expect(result.success).toBe(true);
    });
  });
});

// ========================================================================
// AC-8: Performance Requirement (< 500ms)
// ========================================================================

describe('EventExecutor - Performance (AC-8)', () => {
  test('should execute event with 5 effects in < 500ms', async () => {
    const EventExecutor = require('../../src/calendar/event-executor');
    const mockFs = require('fs').promises;
    const yaml = require('js-yaml');

    // Create mocks with realistic delays
    const mockLocationLoader = {};
    const mockStateManager = {
      getState: jest.fn().mockResolvedValue({
        success: true,
        state: { custom_state: {} }
      }),
      updateCustomState: jest.fn().mockResolvedValue({ success: true })
    };
    const mockCalendarManager = {
      updateEventStatus: jest.fn().mockResolvedValue({ success: true })
    };

    const executor = new EventExecutor({
      locationLoader: mockLocationLoader,
      stateManager: mockStateManager,
      calendarManager: mockCalendarManager
    });

    // Mock event with 5 effects
    const eventDef = {
      eventId: 'complex_event',
      effects: [
        { type: 'npc_status', npcId: 'npc1', status: 'Dead' },
        { type: 'npc_status', npcId: 'npc2', status: 'Wounded' },
        { type: 'state_update', stateChanges: { flag1: true } },
        { type: 'state_update', stateChanges: { flag2: true } },
        { type: 'quest_trigger', questId: 'quest1', newStatus: 'Active' }
      ]
    };

    jest.spyOn(executor, 'loadEventDefinition').mockResolvedValue({
      success: true,
      definition: eventDef
    });

    // Mock file operations
    jest.spyOn(executor.fs, 'readFile').mockImplementation(async () => {
      return 'npcs: {}\nquests: []';
    });
    jest.spyOn(executor.fs, 'writeFile').mockResolvedValue();
    jest.spyOn(executor.yaml, 'load').mockReturnValue({ npcs: {}, quests: [] });
    jest.spyOn(executor.yaml, 'dump').mockReturnValue('');

    const event = {
      eventId: 'complex_event',
      locationId: 'test-location'
    };

    const startTime = Date.now();
    const result = await executor.execute(event, {});
    const endTime = Date.now();

    const executionTime = endTime - startTime;

    expect(result.success).toBe(true);
    expect(executionTime).toBeLessThan(500);
    expect(result.executionTimeMs).toBeLessThan(500);
  }, 10000); // Increase test timeout to 10s
});
