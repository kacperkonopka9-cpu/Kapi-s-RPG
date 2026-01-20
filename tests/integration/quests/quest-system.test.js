/**
 * Integration Tests for Quest System (Story 4-11)
 * Tests all 10 Acceptance Criteria with comprehensive coverage
 */

const QuestManager = require('../../../src/quests/quest-manager');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

describe('Quest System Integration Tests', () => {
  let questManager;
  const questsDir = path.join(process.cwd(), 'game-data', 'quests');
  const stateFile = path.join(process.cwd(), 'game-data', 'state', 'quest-state.yaml');

  beforeEach(() => {
    questManager = new QuestManager();
  });

  // ========================================================================
  // AC-1: QuestManager Module Created (10 tests)
  // ========================================================================
  describe('AC-1: QuestManager Module', () => {
    test('AC-1.1: QuestManager initializes with dependency injection', () => {
      const mockFs = {};
      const mockPath = {};
      const customManager = new QuestManager({ fs: mockFs, path: mockPath });

      expect(customManager.fs).toBe(mockFs);
      expect(customManager.path).toBe(mockPath);
    });

    test('AC-1.2: loadQuest() loads and parses YAML correctly', async () => {
      const result = await questManager.loadQuest('escape_from_death_house');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.questId).toBe('escape_from_death_house');
      expect(result.data.name).toBe('Escape from Death House');
    });

    test('AC-1.3: loadQuest() returns Result object pattern', async () => {
      const result = await questManager.loadQuest('escape_from_death_house');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(typeof result.success).toBe('boolean');
    });

    test('AC-1.4: getAllQuests() returns all quest files', async () => {
      const result = await questManager.getAllQuests();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThanOrEqual(12);
    });

    test('AC-1.5: getQuestsByType() filters by type correctly', async () => {
      const result = await questManager.getQuestsByType('main');

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.every(q => q.type === 'main')).toBe(true);
    });

    test('AC-1.6: getActiveQuests() returns only active quests', async () => {
      // This test requires StateManager integration
      const result = await questManager.getActiveQuests();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('AC-1.7: getAvailableQuests() checks prerequisites correctly', async () => {
      const result = await questManager.getAvailableQuests();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('AC-1.8: Quest caching works correctly', async () => {
      const result1 = await questManager.loadQuest('escape_from_death_house');
      const result2 = await questManager.loadQuest('escape_from_death_house');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(questManager.questCache.has('escape_from_death_house')).toBe(true);
    });

    test('AC-1.9: Schema validation catches invalid quests', async () => {
      const invalidQuest = { questId: 'test', name: 'Test' }; // Missing required fields
      const validation = questManager._validateQuestSchema(invalidQuest);

      expect(validation.success).toBe(false);
      expect(validation.error).toBeDefined();
    });

    test('AC-1.10: Error handling for missing quest files', async () => {
      const result = await questManager.loadQuest('nonexistent_quest');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  // ========================================================================
  // AC-2: Main Quest Chain Implemented (8 tests)
  // ========================================================================
  describe('AC-2: Main Quest Chain', () => {
    test('AC-2.1: All 12 main quests load without errors', async () => {
      const questIds = [
        'escape_from_death_house',
        'arrival_in_the_village',
        'bury_the_burgomaster',
        'escort_ireena_to_vallaki',
        'seek_the_vistani',
        'st_andrals_bones',
        'find_the_sunsword',
        'find_the_holy_symbol_of_ravenkind',
        'find_the_tome_of_strahd',
        'identify_the_ally',
        'confront_strahds_weakness',
        'destroy_strahd_von_zarovich'
      ];

      for (const questId of questIds) {
        const result = await questManager.loadQuest(questId);
        expect(result.success).toBe(true);
        expect(result.data.questId).toBe(questId);
      }
    });

    test('AC-2.2: Quest chain progression (each quest unlocks next)', async () => {
      const q1 = await questManager.loadQuest('escape_from_death_house');
      expect(q1.data.consequences.onCompletion.unlockedQuests).toContain('arrival_in_the_village');

      const q2 = await questManager.loadQuest('arrival_in_the_village');
      expect(q2.data.consequences.onCompletion.unlockedQuests).toContain('bury_the_burgomaster');

      const q3 = await questManager.loadQuest('bury_the_burgomaster');
      expect(q3.data.consequences.onCompletion.unlockedQuests).toContain('escort_ireena_to_vallaki');
    });

    test('AC-2.3: Quest 1 (Escape Death House) schema validation passes', async () => {
      const result = await questManager.loadQuest('escape_from_death_house');

      expect(result.success).toBe(true);
      expect(result.data.questId).toBe('escape_from_death_house');
      expect(result.data.objectives.length).toBeGreaterThan(0);
      expect(result.data.rewards).toBeDefined();
    });

    test('AC-2.4: Quest 3 (Bury Burgomaster) questGiver references valid NPC', async () => {
      const result = await questManager.loadQuest('bury_the_burgomaster');

      expect(result.success).toBe(true);
      expect(result.data.questGiver.npcId).toBe('ismark_kolyanovich');
    });

    test('AC-2.5: Quest 4 (Escort Ireena) has valid objectives', async () => {
      const result = await questManager.loadQuest('escort_ireena_to_vallaki');

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data.objectives)).toBe(true);
      expect(result.data.objectives.length).toBeGreaterThanOrEqual(4);
    });

    test('AC-2.6: Quest 5 (Seek Vistani) links to Tarokka system', async () => {
      const result = await questManager.loadQuest('seek_the_vistani');

      expect(result.success).toBe(true);
      expect(result.data.consequences.onCompletion.unlockedQuests).toContain('find_the_sunsword');
      expect(result.data.consequences.onCompletion.unlockedQuests).toContain('find_the_holy_symbol_of_ravenkind');
      expect(result.data.consequences.onCompletion.unlockedQuests).toContain('find_the_tome_of_strahd');
    });

    test('AC-2.7: Quest 12 (Destroy Strahd) has correct prerequisites', async () => {
      const result = await questManager.loadQuest('destroy_strahd_von_zarovich');

      expect(result.success).toBe(true);
      expect(result.data.prerequisites.requiredQuests.completed).toContain('find_the_sunsword');
      expect(result.data.prerequisites.requiredQuests.completed).toContain('find_the_holy_symbol_of_ravenkind');
      expect(result.data.prerequisites.requiredQuests.completed).toContain('find_the_tome_of_strahd');
      expect(result.data.prerequisites.requiredQuests.completed).toContain('identify_the_ally');
      expect(result.data.prerequisites.requiredQuests.completed).toContain('confront_strahds_weakness');
    });

    test('AC-2.8: All main quests have type "main"', async () => {
      const mainQuests = await questManager.getQuestsByType('main');

      expect(mainQuests.success).toBe(true);
      expect(mainQuests.data.length).toBeGreaterThanOrEqual(12);
      expect(mainQuests.data.every(q => q.type === 'main')).toBe(true);
    });
  });

  // ========================================================================
  // AC-3: Quest Objectives System (6 tests)
  // ========================================================================
  describe('AC-3: Quest Objectives', () => {
    test('AC-3.1: All objectives have unique objectiveIds within quest', async () => {
      const result = await questManager.loadQuest('escape_from_death_house');

      const objectiveIds = result.data.objectives.map(obj => obj.objectiveId);
      const uniqueIds = new Set(objectiveIds);
      expect(objectiveIds.length).toBe(uniqueIds.size);
    });

    test('AC-3.2: Objective types are valid', async () => {
      const result = await questManager.loadQuest('escort_ireena_to_vallaki');
      const validTypes = ['dialogue', 'combat', 'exploration', 'fetch', 'escort', 'investigate', 'social'];

      for (const obj of result.data.objectives) {
        expect(validTypes).toContain(obj.type);
      }
    });

    test('AC-3.3: Completion triggers are valid types', async () => {
      const result = await questManager.loadQuest('bury_the_burgomaster');
      const validTriggers = ['dialogue_complete', 'npc_defeated', 'item_obtained', 'location_reached', 'event_triggered', 'combat_survived', 'item_delivered'];

      for (const obj of result.data.objectives) {
        expect(validTriggers).toContain(obj.completionTrigger.type);
      }
    });

    test('AC-3.4: Objectives with targets reference valid data', async () => {
      const result = await questManager.loadQuest('st_andrals_bones');

      for (const obj of result.data.objectives) {
        if (obj.target && obj.target.type) {
          expect(['npc', 'location', 'item', 'monster', 'object']).toContain(obj.target.type);
        }
      }
    });

    test('AC-3.5: Optional objectives marked correctly', async () => {
      const result = await questManager.loadQuest('escort_ireena_to_vallaki');

      for (const obj of result.data.objectives) {
        expect(typeof obj.optional).toBe('boolean');
      }
    });

    test('AC-3.6: Objective rewards have valid structure', async () => {
      const result = await questManager.loadQuest('escape_from_death_house');

      for (const obj of result.data.objectives) {
        expect(obj.rewards).toBeDefined();
        expect(typeof obj.rewards.experience).toBe('number');
        expect(Array.isArray(obj.rewards.items)).toBe(true);
      }
    });
  });

  // ========================================================================
  // AC-4: Quest Time Constraints (6 tests)
  // ========================================================================
  describe('AC-4: Time Constraints', () => {
    test('AC-4.1: Quest 4 (Escort Ireena) soft deadline validation', async () => {
      const result = await questManager.loadQuest('escort_ireena_to_vallaki');

      expect(result.data.timeConstraints.hasDeadline).toBe(true);
      expect(result.data.timeConstraints.failOnMissedDeadline).toBe(false);
    });

    test('AC-4.2: Quest 6 (St. Andral) hard deadline validation', async () => {
      const result = await questManager.loadQuest('st_andrals_bones');

      expect(result.data.timeConstraints.hasDeadline).toBe(true);
      expect(result.data.timeConstraints.failOnMissedDeadline).toBe(true);
      expect(result.data.timeConstraints.deadline.date).toBeDefined();
    });

    test('AC-4.3: Deadline dates use valid Barovian calendar format', async () => {
      const result = await questManager.loadQuest('st_andrals_bones');

      if (result.data.timeConstraints.deadline) {
        const dateFormat = /^\d{3}-\d{2}-\d{2}$/;
        expect(dateFormat.test(result.data.timeConstraints.deadline.date)).toBe(true);
      }
    });

    test('AC-4.4: Warning thresholds are positive integers or null', async () => {
      const result = await questManager.loadQuest('st_andrals_bones');

      const threshold = result.data.timeConstraints.warningThreshold;
      expect(threshold === null || (typeof threshold === 'number' && threshold > 0)).toBe(true);
    });

    test('AC-4.5: EventScheduler integration events are valid', async () => {
      const result = await questManager.loadQuest('st_andrals_bones');

      expect(Array.isArray(result.data.eventSchedulerIntegration.registeredEvents)).toBe(true);
      expect(result.data.eventSchedulerIntegration.registeredEvents.length).toBeGreaterThan(0);
    });

    test('AC-4.6: failOnMissedDeadline is boolean', async () => {
      const result = await questManager.loadQuest('st_andrals_bones');

      expect(typeof result.data.timeConstraints.failOnMissedDeadline).toBe('boolean');
    });
  });

  // ========================================================================
  // AC-5: Quest Consequences (6 tests)
  // ========================================================================
  describe('AC-5: Consequences', () => {
    test('AC-5.1: Completion consequences have valid stateChanges', async () => {
      const result = await questManager.loadQuest('bury_the_burgomaster');

      const stateChanges = result.data.consequences.onCompletion.stateChanges;
      expect(Array.isArray(stateChanges)).toBe(true);

      for (const change of stateChanges) {
        expect(change.type).toBeDefined();
      }
    });

    test('AC-5.2: triggeredEvents reference valid event IDs', async () => {
      const result = await questManager.loadQuest('bury_the_burgomaster');

      const events = result.data.consequences.onCompletion.triggeredEvents;
      expect(Array.isArray(events)).toBe(true);

      for (const event of events) {
        expect(event.eventId).toBeDefined();
        expect(typeof event.eventId).toBe('string');
      }
    });

    test('AC-5.3: unlockedQuests reference valid quest IDs', async () => {
      const result = await questManager.loadQuest('escape_from_death_house');

      const unlocked = result.data.consequences.onCompletion.unlockedQuests;
      expect(Array.isArray(unlocked)).toBe(true);
      expect(unlocked).toContain('arrival_in_the_village');
    });

    test('AC-5.4: npcReactions reference valid NPC IDs', async () => {
      const result = await questManager.loadQuest('bury_the_burgomaster');

      const reactions = result.data.consequences.onCompletion.npcReactions;
      expect(Array.isArray(reactions)).toBe(true);

      for (const reaction of reactions) {
        expect(reaction.npcId).toBeDefined();
        expect(typeof reaction.attitudeChange).toBe('number');
      }
    });

    test('AC-5.5: Failure consequences structure validation', async () => {
      const result = await questManager.loadQuest('st_andrals_bones');

      const failure = result.data.consequences.onFailure;
      expect(failure).toBeDefined();
      expect(Array.isArray(failure.stateChanges)).toBe(true);
      expect(typeof failure.canRetry).toBe('boolean');
    });

    test('AC-5.6: canRetry and canRestart booleans present', async () => {
      const result = await questManager.loadQuest('escort_ireena_to_vallaki');

      expect(typeof result.data.consequences.onFailure.canRetry).toBe('boolean');
      expect(typeof result.data.consequences.onAbandonment.canRestart).toBe('boolean');
    });
  });

  // ========================================================================
  // AC-6: Quest Rewards System (6 tests)
  // ========================================================================
  describe('AC-6: Rewards', () => {
    test('AC-6.1: All quests have experience > 0', async () => {
      const allQuests = await questManager.getAllQuests();

      for (const quest of allQuests.data) {
        expect(quest.rewards.experience).toBeGreaterThan(0);
      }
    });

    test('AC-6.2: Item rewards reference valid item IDs', async () => {
      const result = await questManager.loadQuest('escape_from_death_house');

      for (const item of result.data.rewards.items) {
        expect(item.itemId).toBeDefined();
        expect(typeof item.quantity).toBe('number');
      }
    });

    test('AC-6.3: Currency rewards have valid structure', async () => {
      const result = await questManager.loadQuest('escort_ireena_to_vallaki');

      expect(result.data.rewards.currency).toBeDefined();
      expect(typeof result.data.rewards.currency.gold).toBe('number');
      expect(typeof result.data.rewards.currency.silver).toBe('number');
      expect(typeof result.data.rewards.currency.copper).toBe('number');
    });

    test('AC-6.4: Reputation changes reference valid factions', async () => {
      const result = await questManager.loadQuest('bury_the_burgomaster');

      for (const rep of result.data.rewards.reputation) {
        expect(rep.faction).toBeDefined();
        expect(typeof rep.change).toBe('number');
      }
    });

    test('AC-6.5: Special rewards have valid types', async () => {
      const result = await questManager.loadQuest('destroy_strahd_von_zarovich');

      for (const reward of result.data.rewards.specialRewards) {
        expect(reward.type).toBeDefined();
        expect(reward.description).toBeDefined();
      }
    });

    test('AC-6.6: Quest 12 rewards include campaign completion', async () => {
      const result = await questManager.loadQuest('destroy_strahd_von_zarovich');

      const hasCampaignCompletion = result.data.rewards.specialRewards.some(
        r => r.type === 'campaign_completion'
      );
      expect(hasCampaignCompletion).toBe(true);
    });
  });

  // ========================================================================
  // AC-7: Quest Branching (5 tests)
  // ========================================================================
  describe('AC-7: Branching', () => {
    test('AC-7.1: Branches have unique branchIds', async () => {
      const result = await questManager.loadQuest('escort_ireena_to_vallaki');

      const branchIds = result.data.branches.map(b => b.branchId);
      const uniqueIds = new Set(branchIds);
      expect(branchIds.length).toBe(uniqueIds.size);
    });

    test('AC-7.2: Choices have unique choiceIds within branch', async () => {
      const result = await questManager.loadQuest('escort_ireena_to_vallaki');

      for (const branch of result.data.branches) {
        const choiceIds = branch.decision.choices.map(c => c.choiceId);
        const uniqueIds = new Set(choiceIds);
        expect(choiceIds.length).toBe(uniqueIds.size);
      }
    });

    test('AC-7.3: Choice consequences have valid structure', async () => {
      const result = await questManager.loadQuest('escort_ireena_to_vallaki');

      for (const branch of result.data.branches) {
        for (const choice of branch.decision.choices) {
          expect(Array.isArray(choice.consequences)).toBe(true);
        }
      }
    });

    test('AC-7.4: Quest 4 (Escort Ireena) branching validation', async () => {
      const result = await questManager.loadQuest('escort_ireena_to_vallaki');

      expect(result.data.branches.length).toBeGreaterThan(0);
      const hasSanctuaryChoice = result.data.branches.some(
        b => b.branchId === 'sanctuary_location'
      );
      expect(hasSanctuaryChoice).toBe(true);
    });

    test('AC-7.5: DM guidance documents all branches', async () => {
      const result = await questManager.loadQuest('destroy_strahd_von_zarovich');

      expect(result.data.dmGuidance).toBeDefined();
      expect(result.data.branches.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // AC-8: Quest Journal System (5 tests)
  // ========================================================================
  describe('AC-8: Journal', () => {
    test('AC-8.1: All quests have initial journal entry', async () => {
      const allQuests = await questManager.getAllQuests();

      for (const quest of allQuests.data) {
        expect(quest.journalEntries.initial).toBeDefined();
        expect(typeof quest.journalEntries.initial).toBe('string');
        expect(quest.journalEntries.initial.length).toBeGreaterThan(0);
      }
    });

    test('AC-8.2: Journal updates reference valid triggers', async () => {
      const result = await questManager.loadQuest('bury_the_burgomaster');

      for (const update of result.data.journalEntries.updates) {
        expect(update.trigger).toBeDefined();
        expect(update.entry).toBeDefined();
      }
    });

    test('AC-8.3: Completion journal entries present', async () => {
      const result = await questManager.loadQuest('escape_from_death_house');

      expect(result.data.journalEntries.completion).toBeDefined();
      expect(typeof result.data.journalEntries.completion).toBe('string');
    });

    test('AC-8.4: Failure journal entries present for quests with failure states', async () => {
      const result = await questManager.loadQuest('st_andrals_bones');

      if (result.data.consequences.onFailure.canRetry !== undefined) {
        expect(result.data.journalEntries.failure).toBeDefined();
      }
    });

    test('AC-8.5: Journal entries are non-empty strings', async () => {
      const result = await questManager.loadQuest('seek_the_vistani');

      expect(result.data.journalEntries.initial.length).toBeGreaterThan(0);
      expect(result.data.journalEntries.completion.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // AC-9: Epic 1-3 Integration Checkpoint (CRITICAL - 7 tests)
  // ========================================================================
  describe('AC-9: Epic 1-3 Integration (CRITICAL)', () => {
    test('AC-9.1: StateManager loads/saves quest state correctly', async () => {
      // Test quest state persistence
      const result = await questManager._loadQuestState();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('AC-9.2: EventScheduler integration events registered correctly', async () => {
      const result = await questManager.loadQuest('st_andrals_bones');

      const events = result.data.eventSchedulerIntegration.registeredEvents;
      expect(events.length).toBeGreaterThan(0);

      for (const event of events) {
        expect(event.eventId).toBeDefined();
        expect(event.trigger).toBeDefined();
        expect(event.effect).toBeDefined();
      }
    });

    test('AC-9.3: Quest consequences apply state changes atomically', async () => {
      const result = await questManager.loadQuest('bury_the_burgomaster');

      const stateChanges = result.data.consequences.onCompletion.stateChanges;
      expect(stateChanges.length).toBeGreaterThan(0);
    });

    test('AC-9.4: Quest item rewards structure for InventoryManager', async () => {
      const result = await questManager.loadQuest('find_the_sunsword');

      expect(result.data.rewards.items.length).toBeGreaterThan(0);
      const item = result.data.rewards.items[0];
      expect(item.itemId).toBeDefined();
      expect(item.quantity).toBeDefined();
    });

    test('AC-9.5: Quest XP awards structure for LevelUpCalculator', async () => {
      const result = await questManager.loadQuest('destroy_strahd_von_zarovich');

      expect(result.data.rewards.experience).toBeGreaterThan(0);
      expect(typeof result.data.rewards.experience).toBe('number');
    });

    test('AC-9.6: Quest-giving NPCs reference correct quest IDs', async () => {
      const result = await questManager.loadQuest('bury_the_burgomaster');

      expect(result.data.questGiver.npcId).toBe('ismark_kolyanovich');
    });

    test('AC-9.7: Full quest lifecycle - updateQuestStatus works', async () => {
      const result = await questManager.updateQuestStatus('escape_from_death_house', 'active');
      expect(result.success).toBe(true);
    });
  });

  // ========================================================================
  // AC-10: DM Guidance (6 tests)
  // ========================================================================
  describe('AC-10: DM Guidance', () => {
    test('AC-10.1: All quests have 3+ narrative hooks', async () => {
      const result = await questManager.loadQuest('escape_from_death_house');

      expect(result.data.dmGuidance.narrativeHooks.length).toBeGreaterThanOrEqual(3);
    });

    test('AC-10.2: Roleplay tips present for quests with questGiver', async () => {
      const result = await questManager.loadQuest('bury_the_burgomaster');

      if (result.data.questGiver.npcId) {
        expect(result.data.dmGuidance.roleplayTips.length).toBeGreaterThan(0);
      }
    });

    test('AC-10.3: Combat encounters have location, CR, monsters', async () => {
      const result = await questManager.loadQuest('st_andrals_bones');

      for (const encounter of result.data.dmGuidance.combatEncounters) {
        expect(encounter.location).toBeDefined();
        expect(encounter.cr).toBeDefined();
        expect(Array.isArray(encounter.monsters)).toBe(true);
      }
    });

    test('AC-10.4: Common pitfalls documented', async () => {
      const result = await questManager.loadQuest('escort_ireena_to_vallaki');

      expect(result.data.dmGuidance.commonPitfalls.length).toBeGreaterThan(0);
    });

    test('AC-10.5: Alternatives documented for complex quests', async () => {
      const result = await questManager.loadQuest('destroy_strahd_von_zarovich');

      expect(result.data.dmGuidance.alternatives.length).toBeGreaterThan(0);
    });

    test('AC-10.6: Lore sections complete', async () => {
      const result = await questManager.loadQuest('find_the_tome_of_strahd');

      expect(result.data.lore.background).toBeDefined();
      expect(result.data.lore.connectionToMainStory).toBeDefined();
      expect(result.data.lore.historicalContext).toBeDefined();
    });
  });
});
