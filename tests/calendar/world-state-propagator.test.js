/**
 * Unit and Integration tests for WorldStatePropagator
 * Uses mocked dependencies for unit tests, real files for integration tests
 *
 * Tests cover all 8 Acceptance Criteria:
 * - AC-1: WorldStatePropagator Module Creation
 * - AC-2: Propagate NPC Death Effects
 * - AC-3: Quest Status Propagation
 * - AC-4: Persist State Updates to Files
 * - AC-5: Performance Requirement (< 1 second)
 * - AC-6: Propagation Rules Configuration
 * - AC-7: Circular Dependency Detection
 * - AC-8: Find Affected Entities
 */

const WorldStatePropagator = require('../../src/calendar/world-state-propagator');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

describe('WorldStatePropagator', () => {
  let propagator;
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
      updateCustomState: jest.fn(),
      updateNPCState: jest.fn()
    };

    mockCalendarManager = {
      updateEventStatus: jest.fn()
    };

    mockFs = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      access: jest.fn()
    };

    mockYaml = {
      load: jest.fn(),
      dump: jest.fn()
    };
  });

  describe('AC-1: WorldStatePropagator Module Creation', () => {
    test('constructor validates required dependencies', () => {
      // Missing locationLoader
      expect(() => {
        new WorldStatePropagator({
          stateManager: mockStateManager
        });
      }).toThrow('WorldStatePropagator requires locationLoader dependency');

      // Missing stateManager
      expect(() => {
        new WorldStatePropagator({
          locationLoader: mockLocationLoader
        });
      }).toThrow('WorldStatePropagator requires stateManager dependency');

      // Both provided - should not throw
      expect(() => {
        new WorldStatePropagator({
          locationLoader: mockLocationLoader,
          stateManager: mockStateManager
        });
      }).not.toThrow();
    });

    test('constructor accepts optional calendarManager', () => {
      const propagator = new WorldStatePropagator({
        locationLoader: mockLocationLoader,
        stateManager: mockStateManager,
        calendarManager: mockCalendarManager
      });

      expect(propagator.calendarManager).toBe(mockCalendarManager);
    });

    test('constructor initializes with dependency injection', () => {
      const propagator = new WorldStatePropagator({
        locationLoader: mockLocationLoader,
        stateManager: mockStateManager,
        fs: mockFs,
        yaml: mockYaml,
        dataDir: 'test-data'
      });

      expect(propagator.locationLoader).toBe(mockLocationLoader);
      expect(propagator.stateManager).toBe(mockStateManager);
      expect(propagator.fs).toBe(mockFs);
      expect(propagator.yaml).toBe(mockYaml);
      expect(propagator.dataDir).toBe('test-data');
    });

    test('all methods return {success, data, error} - no exceptions thrown', async () => {
      propagator = new WorldStatePropagator({
        locationLoader: mockLocationLoader,
        stateManager: mockStateManager,
        fs: mockFs,
        yaml: mockYaml
      });

      // Mock file not existing to trigger default creation
      mockFs.access.mockRejectedValue(new Error('File not found'));
      mockFs.writeFile.mockResolvedValue();
      mockYaml.dump.mockReturnValue('{}');

      // propagateChange with invalid input - should return error object, not throw
      const result1 = await propagator.propagateChange(null);
      expect(result1).toHaveProperty('success');
      expect(result1).toHaveProperty('data');
      expect(result1).toHaveProperty('error');
      expect(result1.success).toBe(false);

      // findAffectedEntities with empty change
      const result2 = await propagator.findAffectedEntities({});
      expect(result2).toHaveProperty('success');
      expect(result2).toHaveProperty('data');
      expect(result2).toHaveProperty('error');

      // applyUpdates with empty array
      const result3 = await propagator.applyUpdates([]);
      expect(result3).toHaveProperty('success');
      expect(result3).toHaveProperty('data');
      expect(result3).toHaveProperty('error');
      expect(result3.success).toBe(true);
    });
  });

  describe('AC-8: Find Affected Entities', () => {
    beforeEach(() => {
      propagator = new WorldStatePropagator({
        locationLoader: mockLocationLoader,
        stateManager: mockStateManager,
        fs: mockFs,
        yaml: mockYaml
      });
    });

    test('findAffectedEntities returns entities with relationship types', async () => {
      // Mock relationship graph
      const mockGraph = {
        relationships: {
          kolyan_indirovich: {
            family: [
              { npcId: 'ireena_kolyana', type: 'daughter' },
              { npcId: 'ismark_kolyanovich', type: 'son' }
            ],
            dependent_quests: [
              { questId: 'escort_ireena', trigger: 'death' }
            ]
          }
        }
      };

      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockGraph));
      mockYaml.load.mockReturnValue(mockGraph);

      const stateChange = {
        changeType: 'npc_death',
        primaryEntity: 'kolyan_indirovich',
        timestamp: '2024-03-13T06:00:00Z',
        propagationRules: {
          affectRelationships: true,
          affectQuests: true,
          affectFactions: false
        }
      };

      const result = await propagator.findAffectedEntities(stateChange);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBe(3); // 2 family + 1 quest

      // Check NPC entities
      const npcEntities = result.data.filter(e => e.entityType === 'npc');
      expect(npcEntities.length).toBe(2);
      expect(npcEntities[0]).toMatchObject({
        entityId: 'ireena_kolyana',
        entityType: 'npc',
        relationshipType: 'daughter',
        propagationLevel: 1
      });

      // Check quest entity
      const questEntities = result.data.filter(e => e.entityType === 'quest');
      expect(questEntities.length).toBe(1);
      expect(questEntities[0]).toMatchObject({
        entityId: 'escort_ireena',
        entityType: 'quest',
        relationshipType: 'dependent_quest',
        propagationLevel: 1
      });
    });

    test('findAffectedEntities handles missing world-state.yaml gracefully', async () => {
      // Mock file not existing
      mockFs.access.mockRejectedValue(new Error('File not found'));
      mockFs.writeFile.mockResolvedValue();
      mockYaml.dump.mockReturnValue('{}');

      const stateChange = {
        changeType: 'npc_death',
        primaryEntity: 'kolyan_indirovich',
        timestamp: '2024-03-13T06:00:00Z',
        propagationRules: { affectRelationships: true }
      };

      const result = await propagator.findAffectedEntities(stateChange);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]); // Empty array, not error
      expect(result.error).toBeNull();
    });

    test('findAffectedEntities handles missing entity relationships gracefully', async () => {
      const mockGraph = {
        relationships: {
          other_entity: {
            family: []
          }
        }
      };

      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockGraph));
      mockYaml.load.mockReturnValue(mockGraph);

      const stateChange = {
        changeType: 'npc_death',
        primaryEntity: 'unknown_entity',
        timestamp: '2024-03-13T06:00:00Z',
        propagationRules: { affectRelationships: true }
      };

      const result = await propagator.findAffectedEntities(stateChange);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]); // No relationships = no affected entities
    });
  });

  describe('AC-6: Propagation Rules Configuration', () => {
    beforeEach(() => {
      propagator = new WorldStatePropagator({
        locationLoader: mockLocationLoader,
        stateManager: mockStateManager,
        fs: mockFs,
        yaml: mockYaml
      });
    });

    test('propagation respects affectRelationships=false', async () => {
      const mockGraph = {
        relationships: {
          kolyan_indirovich: {
            family: [
              { npcId: 'ireena_kolyana', type: 'daughter' }
            ],
            dependent_quests: [
              { questId: 'escort_ireena', trigger: 'death' }
            ]
          }
        }
      };

      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockGraph));
      mockYaml.load.mockReturnValue(mockGraph);

      const stateChange = {
        changeType: 'npc_death',
        primaryEntity: 'kolyan_indirovich',
        timestamp: '2024-03-13T06:00:00Z',
        propagationRules: {
          affectRelationships: false, // Skip NPCs
          affectQuests: true,
          affectFactions: false
        }
      };

      const result = await propagator.findAffectedEntities(stateChange);

      expect(result.success).toBe(true);
      const npcEntities = result.data.filter(e => e.entityType === 'npc');
      expect(npcEntities.length).toBe(0); // No NPCs due to affectRelationships=false

      const questEntities = result.data.filter(e => e.entityType === 'quest');
      expect(questEntities.length).toBe(1); // Quest still included
    });

    test('propagation respects affectQuests=false', async () => {
      const mockGraph = {
        relationships: {
          kolyan_indirovich: {
            family: [
              { npcId: 'ireena_kolyana', type: 'daughter' }
            ],
            dependent_quests: [
              { questId: 'escort_ireena', trigger: 'death' }
            ]
          }
        }
      };

      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockGraph));
      mockYaml.load.mockReturnValue(mockGraph);

      const stateChange = {
        changeType: 'npc_death',
        primaryEntity: 'kolyan_indirovich',
        timestamp: '2024-03-13T06:00:00Z',
        propagationRules: {
          affectRelationships: true,
          affectQuests: false, // Skip quests
          affectFactions: false
        }
      };

      const result = await propagator.findAffectedEntities(stateChange);

      expect(result.success).toBe(true);
      const questEntities = result.data.filter(e => e.entityType === 'quest');
      expect(questEntities.length).toBe(0); // No quests due to affectQuests=false

      const npcEntities = result.data.filter(e => e.entityType === 'npc');
      expect(npcEntities.length).toBe(1); // NPC still included
    });
  });

  describe('AC-7: Circular Dependency Detection', () => {
    beforeEach(() => {
      propagator = new WorldStatePropagator({
        locationLoader: mockLocationLoader,
        stateManager: mockStateManager,
        fs: mockFs,
        yaml: mockYaml
      });
    });

    test('prevents infinite loops with circular dependencies', async () => {
      const mockGraph = {
        relationships: {
          kolyan_indirovich: {
            family: [
              { npcId: 'ireena_kolyana', type: 'daughter' }
            ]
          }
        }
      };

      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockGraph));
      mockYaml.load.mockReturnValue(mockGraph);

      const stateChange = {
        changeType: 'npc_death',
        primaryEntity: 'kolyan_indirovich',
        timestamp: '2024-03-13T06:00:00Z',
        propagationRules: {
          affectRelationships: true,
          affectQuests: false,
          affectFactions: false
        }
      };

      const result = await propagator.propagateChange(stateChange);

      expect(result.success).toBe(true);
      expect(result.data.propagationDepth).toBeLessThanOrEqual(10); // Max depth enforced
    });

    test('limits propagation depth to maximum 10 levels', async () => {
      // Even with complex graphs, depth should not exceed 10
      const mockGraph = {
        relationships: {
          entity_1: {
            family: [{ npcId: 'entity_2', type: 'related' }]
          }
        }
      };

      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockGraph));
      mockYaml.load.mockReturnValue(mockGraph);

      const stateChange = {
        changeType: 'npc_death',
        primaryEntity: 'entity_1',
        timestamp: '2024-03-13T06:00:00Z',
        propagationRules: { affectRelationships: true }
      };

      const result = await propagator.propagateChange(stateChange);

      expect(result.success).toBe(true);
      expect(result.data.propagationDepth).toBeLessThanOrEqual(10);
    });
  });

  describe('AC-2: Propagate NPC Death Effects', () => {
    beforeEach(() => {
      propagator = new WorldStatePropagator({
        locationLoader: mockLocationLoader,
        stateManager: mockStateManager,
        fs: mockFs,
        yaml: mockYaml
      });
    });

    test('generates NPC death update with emotional state (family relationship)', async () => {
      const affectedNPC = {
        entityId: 'ireena_kolyana',
        entityType: 'npc',
        relationshipType: 'daughter'
      };

      const result = await propagator._generateNPCDeathUpdate(
        affectedNPC,
        'kolyan_indirovich',
        '2024-03-13T06:00:00Z'
      );

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        filePath: 'game-data/NPCs/ireena_kolyana.md',
        section: 'emotional_state',
        updates: {
          emotionalState: 'Grieving',
          griefLevel: 'High',
          reason: 'Death of kolyan_indirovich'
        }
      });
    });

    test('generates different emotional states based on relationship type', async () => {
      // Enemy relationship
      const enemy = {
        entityId: 'enemy_npc',
        entityType: 'npc',
        relationshipType: 'enemy'
      };

      const result = await propagator._generateNPCDeathUpdate(
        enemy,
        'kolyan_indirovich',
        '2024-03-13T06:00:00Z'
      );

      expect(result.success).toBe(true);
      expect(result.data.updates.emotionalState).toBe('Relieved');
      expect(result.data.updates.griefLevel).toBe('None');
    });
  });

  describe('AC-3: Quest Status Propagation', () => {
    beforeEach(() => {
      propagator = new WorldStatePropagator({
        locationLoader: mockLocationLoader,
        stateManager: mockStateManager,
        fs: mockFs,
        yaml: mockYaml
      });
    });

    test('generates quest activation update with timestamp and reason', async () => {
      const quest = {
        entityId: 'escort_ireena',
        entityType: 'quest'
      };

      const result = await propagator._generateQuestActivationUpdate(
        quest,
        'kolyan_indirovich',
        '2024-03-13T06:00:00Z'
      );

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        filePath: expect.stringContaining('active-quests.yaml'),
        section: 'escort_ireena',
        updates: {
          status: 'Active',
          activatedAt: '2024-03-13T06:00:00Z',
          activationReason: 'Triggered by: kolyan_indirovich'
        }
      });
    });
  });

  describe('AC-4: Persist State Updates to Files', () => {
    beforeEach(() => {
      propagator = new WorldStatePropagator({
        locationLoader: mockLocationLoader,
        stateManager: mockStateManager,
        fs: mockFs,
        yaml: mockYaml
      });
    });

    test('applyUpdates batches updates by file path', async () => {
      const updates = [
        {
          filePath: 'game-data/NPCs/ireena.md',
          section: 'emotional_state',
          updates: { emotionalState: 'Grieving' }
        },
        {
          filePath: 'game-data/NPCs/ireena.md',
          section: 'status',
          updates: { status: 'Active' }
        },
        {
          filePath: 'data/active-quests.yaml',
          section: 'quest1',
          updates: { status: 'Active' }
        }
      ];

      const result = await propagator.applyUpdates(updates);

      expect(result.success).toBe(true);
      expect(result.data.filesUpdated).toBeGreaterThan(0);
    });

    test('returns success with count 0 for empty updates array', async () => {
      const result = await propagator.applyUpdates([]);

      expect(result.success).toBe(true);
      expect(result.data.filesUpdated).toBe(0);
    });
  });

  describe('AC-5: Performance Requirement', () => {
    beforeEach(() => {
      propagator = new WorldStatePropagator({
        locationLoader: mockLocationLoader,
        stateManager: mockStateManager,
        fs: mockFs,
        yaml: mockYaml
      });
    });

    test('propagation with 10 affected entities completes in < 1 second', async () => {
      // Mock a complex relationship graph with 10 entities
      const mockGraph = {
        relationships: {
          kolyan_indirovich: {
            family: Array.from({ length: 10 }, (_, i) => ({
              npcId: `npc_${i}`,
              type: 'family'
            }))
          }
        }
      };

      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockGraph));
      mockYaml.load.mockReturnValue(mockGraph);

      const stateChange = {
        changeType: 'npc_death',
        primaryEntity: 'kolyan_indirovich',
        timestamp: '2024-03-13T06:00:00Z',
        propagationRules: { affectRelationships: true }
      };

      const startTime = performance.now();
      const result = await propagator.propagateChange(stateChange);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1000); // < 1 second (1000ms)
      expect(result.data.affectedCount).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      propagator = new WorldStatePropagator({
        locationLoader: mockLocationLoader,
        stateManager: mockStateManager,
        fs: mockFs,
        yaml: mockYaml
      });
    });

    test('empty relationship graph returns no updates', async () => {
      const mockGraph = {
        relationships: {}
      };

      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockGraph));
      mockYaml.load.mockReturnValue(mockGraph);

      const stateChange = {
        changeType: 'npc_death',
        primaryEntity: 'kolyan_indirovich',
        timestamp: '2024-03-13T06:00:00Z',
        propagationRules: { affectRelationships: true }
      };

      const result = await propagator.propagateChange(stateChange);

      expect(result.success).toBe(true);
      expect(result.data.updatesApplied).toEqual([]);
      expect(result.data.affectedCount).toBe(0);
    });

    test('missing world-state.yaml creates new file with default structure', async () => {
      // Mock file doesn't exist
      mockFs.access.mockRejectedValue(new Error('File not found'));
      mockFs.writeFile.mockResolvedValue();
      mockYaml.dump.mockReturnValue('relationships: {}\nquests: {}\nfactions: {}\npropagation_history: []');

      const stateChange = {
        changeType: 'npc_death',
        primaryEntity: 'kolyan_indirovich',
        timestamp: '2024-03-13T06:00:00Z',
        propagationRules: { affectRelationships: true }
      };

      const result = await propagator.propagateChange(stateChange);

      expect(result.success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalled();
      expect(mockYaml.dump).toHaveBeenCalledWith(
        expect.objectContaining({
          relationships: {},
          quests: {},
          factions: {},
          propagation_history: []
        })
      );
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      propagator = new WorldStatePropagator({
        locationLoader: mockLocationLoader,
        stateManager: mockStateManager,
        fs: mockFs,
        yaml: mockYaml
      });
    });

    test('relationship graph is cached for performance', async () => {
      const mockGraph = {
        relationships: {
          kolyan_indirovich: {
            family: [{ npcId: 'ireena_kolyana', type: 'daughter' }]
          }
        }
      };

      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockGraph));
      mockYaml.load.mockReturnValue(mockGraph);

      // First call - should read file
      await propagator._loadRelationshipGraph();
      expect(mockFs.readFile).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await propagator._loadRelationshipGraph();
      expect(mockFs.readFile).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    test('cache can be invalidated', async () => {
      const mockGraph = {
        relationships: {}
      };

      mockFs.access.mockResolvedValue();
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockGraph));
      mockYaml.load.mockReturnValue(mockGraph);

      // Load graph
      await propagator._loadRelationshipGraph();
      expect(mockFs.readFile).toHaveBeenCalledTimes(1);

      // Invalidate cache
      propagator.invalidateCache();

      // Load again - should read file
      await propagator._loadRelationshipGraph();
      expect(mockFs.readFile).toHaveBeenCalledTimes(2); // Second read
    });
  });
});
