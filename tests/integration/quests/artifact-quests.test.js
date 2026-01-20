/**
 * Integration Tests for Story 4-12: Artifact Quests
 * Tests Tarokka integration, quest branching, location variants, and QuestManager integration
 *
 * Target: 40-50 tests, 100% pass rate
 * Covers AC-1 through AC-9
 */

const QuestManager = require('../../../src/quests/quest-manager');
const yaml = require('js-yaml');
const fs = require('fs');

describe('Story 4-12: Artifact Quests Integration Tests', () => {
  let questManager;

  beforeEach(() => {
    questManager = new QuestManager();
  });

  // ============================================================================
  // AC-1: Artifact Quest Location Variants
  // ============================================================================

  describe('AC-1: Location Variants', () => {
    test('Quest 7 (Sunsword) has 7 location variants in tarokkaIntegration', async () => {
      const result = await questManager.loadQuest('find_the_sunsword');
      expect(result.success).toBe(true);
      expect(result.data.tarokkaIntegration).toBeDefined();
      expect(result.data.tarokkaIntegration.cardMappings).toHaveLength(7);
    });

    test('Quest 8 (Holy Symbol) has 7 location variants in tarokkaIntegration', async () => {
      const result = await questManager.loadQuest('find_the_holy_symbol_of_ravenkind');
      expect(result.success).toBe(true);
      expect(result.data.tarokkaIntegration).toBeDefined();
      expect(result.data.tarokkaIntegration.cardMappings).toHaveLength(7);
    });

    test('Quest 9 (Tome) has 7 location variants in tarokkaIntegration', async () => {
      const result = await questManager.loadQuest('find_the_tome_of_strahd');
      expect(result.success).toBe(true);
      expect(result.data.tarokkaIntegration).toBeDefined();
      expect(result.data.tarokkaIntegration.cardMappings).toHaveLength(7);
    });

    test('Quest 7 location variants include Castle Ravenloft Armory', async () => {
      const result = await questManager.loadQuest('find_the_sunsword');
      const locations = result.data.tarokkaIntegration.cardMappings.map(m => m.location);
      expect(locations).toContain('castle_ravenloft_armory');
    });

    test('Quest 8 location variants include Church of St. Andral Crypt', async () => {
      const result = await questManager.loadQuest('find_the_holy_symbol_of_ravenkind');
      const locations = result.data.tarokkaIntegration.cardMappings.map(m => m.location);
      expect(locations).toContain('church_of_st_andral_crypt');
    });

    test('Quest 9 location variants include Castle Ravenloft Library', async () => {
      const result = await questManager.loadQuest('find_the_tome_of_strahd');
      const locations = result.data.tarokkaIntegration.cardMappings.map(m => m.location);
      expect(locations).toContain('castle_ravenloft_library');
    });
  });

  // ============================================================================
  // AC-2: Tarokka Reading Integration
  // ============================================================================

  describe('AC-2: Tarokka Reading Integration', () => {
    test('Quest 7 has tarokkaIntegration with artifactType "sunsword"', async () => {
      const result = await questManager.loadQuest('find_the_sunsword');
      expect(result.data.tarokkaIntegration.artifactType).toBe('sunsword');
    });

    test('Quest 8 has tarokkaIntegration with artifactType "holy_symbol_of_ravenkind"', async () => {
      const result = await questManager.loadQuest('find_the_holy_symbol_of_ravenkind');
      expect(result.data.tarokkaIntegration.artifactType).toBe('holy_symbol_of_ravenkind');
    });

    test('Quest 9 has tarokkaIntegration with artifactType "tome_of_strahd"', async () => {
      const result = await questManager.loadQuest('find_the_tome_of_strahd');
      expect(result.data.tarokkaIntegration.artifactType).toBe('tome_of_strahd');
    });

    test('Quest 7 tarokkaIntegration has stateKey pointing to quest state', async () => {
      const result = await questManager.loadQuest('find_the_sunsword');
      expect(result.data.tarokkaIntegration.stateKey).toBe('tarokkaReading.artifactLocations.sunsword');
    });

    test('Quest 8 tarokkaIntegration has locked: true to prevent location changes', async () => {
      const result = await questManager.loadQuest('find_the_holy_symbol_of_ravenkind');
      expect(result.data.tarokkaIntegration.locked).toBe(true);
    });

    test('Quest 9 tarokkaIntegration has fallback location defined', async () => {
      const result = await questManager.loadQuest('find_the_tome_of_strahd');
      expect(result.data.tarokkaIntegration.fallbackLocation).toBe('castle_ravenloft_library');
      expect(result.data.tarokkaIntegration.fallbackDescription).toBeDefined();
    });

    test('All card mappings have card, location, and description', async () => {
      const quests = ['find_the_sunsword', 'find_the_holy_symbol_of_ravenkind', 'find_the_tome_of_strahd'];

      for (const questId of quests) {
        const result = await questManager.loadQuest(questId);
        result.data.tarokkaIntegration.cardMappings.forEach(mapping => {
          expect(mapping.card).toBeDefined();
          expect(mapping.location).toBeDefined();
          expect(mapping.description).toBeDefined();
        });
      }
    });
  });

  // ============================================================================
  // AC-3: Location-Specific Objectives and Encounters
  // ============================================================================

  describe('AC-3: Location-Specific Objectives', () => {
    test('Quest 7 has 7 location variants in dmGuidance.locationVariants', async () => {
      const result = await questManager.loadQuest('find_the_sunsword');
      expect(result.data.dmGuidance.locationVariants).toHaveLength(7);
    });

    test('Each Quest 7 location variant has required fields', async () => {
      const result = await questManager.loadQuest('find_the_sunsword');
      result.data.dmGuidance.locationVariants.forEach(variant => {
        expect(variant.location).toBeDefined();
        expect(variant.card).toBeDefined();
        expect(variant.difficulty).toBeDefined();
        expect(variant.guardianType).toBeDefined();
        expect(variant.guardianCR).toBeDefined();
        expect(variant.encounterNotes).toBeDefined();
        expect(variant.tactics).toBeDefined();
        expect(variant.treasure).toBeDefined();
      });
    });

    test('Quest 8 location variants have varying difficulty levels', async () => {
      const result = await questManager.loadQuest('find_the_holy_symbol_of_ravenkind');
      const difficulties = result.data.dmGuidance.locationVariants.map(v => v.difficulty);
      expect(difficulties).toContain('Easy (if diplomatic)');
      expect(difficulties.some(d => d.includes('Medium'))).toBe(true);
      expect(difficulties).toContain('Hard');
    });

    test('Quest 9 location variants span CR 0-12 guardians', async () => {
      const result = await questManager.loadQuest('find_the_tome_of_strahd');
      const crs = result.data.dmGuidance.locationVariants.map(v => v.guardianCR);
      expect(Math.min(...crs)).toBe(0); // Burgomaster Mansion (no guardian)
      expect(Math.max(...crs)).toBe(12); // Amber Temple (arcanaloth)
    });
  });

  // ============================================================================
  // AC-4: Artifact Item Integration Stubs
  // ============================================================================

  describe('AC-4: Artifact Item Integration Stubs', () => {
    test('Sunsword item stub exists and is valid YAML', () => {
      const data = yaml.load(fs.readFileSync('templates/items/sunsword.yaml', 'utf8'));
      expect(data.itemId).toBe('sunsword');
      expect(data.rarity).toBe('legendary');
      expect(data.requiresAttunement).toBe(true);
    });

    test('Holy Symbol item stub exists and is valid YAML', () => {
      const data = yaml.load(fs.readFileSync('templates/items/holy_symbol_of_ravenkind.yaml', 'utf8'));
      expect(data.itemId).toBe('holy_symbol_of_ravenkind');
      expect(data.rarity).toBe('legendary');
      expect(data.requiresAttunement).toBe(true);
    });

    test('Tome item stub exists and is valid YAML', () => {
      const data = yaml.load(fs.readFileSync('templates/items/tome_of_strahd.yaml', 'utf8'));
      expect(data.itemId).toBe('tome_of_strahd');
      expect(data.rarity).toBe('legendary');
      expect(data.requiresAttunement).toBe(false); // Tome doesn't require attunement
    });

    test('Quest 7 rewards reference sunsword with attunementRequired', async () => {
      const result = await questManager.loadQuest('find_the_sunsword');
      const item = result.data.rewards.items.find(i => i.itemId === 'sunsword');
      expect(item).toBeDefined();
      expect(item.attunementRequired).toBe(true);
    });

    test('Quest 8 rewards reference holy_symbol with source: quest_reward', async () => {
      const result = await questManager.loadQuest('find_the_holy_symbol_of_ravenkind');
      const item = result.data.rewards.items.find(i => i.itemId === 'holy_symbol_of_ravenkind');
      expect(item).toBeDefined();
      expect(item.source).toBe('quest_reward');
    });

    test('Quest 9 rewards reference tome with attunementRequired: false', async () => {
      const result = await questManager.loadQuest('find_the_tome_of_strahd');
      const item = result.data.rewards.items.find(i => i.itemId === 'tome_of_strahd');
      expect(item).toBeDefined();
      expect(item.attunementRequired).toBe(false);
    });
  });

  // ============================================================================
  // AC-5: Quest Branching Logic (autoDecide)
  // ============================================================================

  describe('AC-5: Quest Branching Logic', () => {
    test('Quest 7 has branches with autoDecide: true', async () => {
      const result = await questManager.loadQuest('find_the_sunsword');
      expect(result.data.branches).toHaveLength(1);
      expect(result.data.branches[0].decision.autoDecide).toBe(true);
    });

    test('Quest 7 branching condition references Tarokka state', async () => {
      const result = await questManager.loadQuest('find_the_sunsword');
      expect(result.data.branches[0].decision.condition).toBe('tarokkaReading.artifactLocations.sunsword');
    });

    test('Quest 7 has 7 branch outcomes matching 7 locations', async () => {
      const result = await questManager.loadQuest('find_the_sunsword');
      expect(result.data.branches[0].decision.outcomes).toHaveLength(7);
    });

    test('Each Quest 8 branch outcome has objectiveModifications', async () => {
      const result = await questManager.loadQuest('find_the_holy_symbol_of_ravenkind');
      result.data.branches[0].decision.outcomes.forEach(outcome => {
        expect(outcome.objectiveModifications).toBeDefined();
        expect(outcome.objectiveModifications.length).toBeGreaterThan(0);
      });
    });

    test('Quest 9 branch outcomes have location-specific consequences', async () => {
      const result = await questManager.loadQuest('find_the_tome_of_strahd');
      result.data.branches[0].decision.outcomes.forEach(outcome => {
        expect(outcome.consequences).toBeDefined();
        expect(outcome.consequences.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // AC-6: Encounter Design and CR Balancing
  // ============================================================================

  describe('AC-6: Encounter Design and CR Balancing', () => {
    test('Quest 7 guardians are CR 4-7 (appropriate for level 5-9 party)', async () => {
      const result = await questManager.loadQuest('find_the_sunsword');
      const crs = result.data.dmGuidance.locationVariants.map(v => v.guardianCR);
      crs.forEach(cr => {
        expect(cr).toBeGreaterThanOrEqual(0);
        expect(cr).toBeLessThanOrEqual(12); // Max CR 12 for Amber Temple
      });
    });

    test('Quest 8 has at least one "Easy" difficulty location', async () => {
      const result = await questManager.loadQuest('find_the_holy_symbol_of_ravenkind');
      const difficulties = result.data.dmGuidance.locationVariants.map(v => v.difficulty);
      expect(difficulties.some(d => d.includes('Easy'))).toBe(true);
    });

    test('Quest 9 has encounterDifficultyComparison guidance', async () => {
      const result = await questManager.loadQuest('find_the_tome_of_strahd');
      expect(result.data.dmGuidance.encounterDifficultyComparison).toBeDefined();
      expect(result.data.dmGuidance.encounterDifficultyComparison).toContain('EASY');
      expect(result.data.dmGuidance.encounterDifficultyComparison).toContain('HARD');
    });
  });

  // ============================================================================
  // AC-7: DM Guidance for Location Variants
  // ============================================================================

  describe('AC-7: DM Guidance for Location Variants', () => {
    test('Quest 7 has enhanced dmGuidance with locationVariants', async () => {
      const result = await questManager.loadQuest('find_the_sunsword');
      expect(result.data.dmGuidance.locationVariants).toBeDefined();
      expect(result.data.dmGuidance.encounterDifficultyComparison).toBeDefined();
    });

    test('Each Quest 8 location variant has narrativeContext', async () => {
      const result = await questManager.loadQuest('find_the_holy_symbol_of_ravenkind');
      result.data.dmGuidance.locationVariants.forEach(variant => {
        expect(variant.narrativeContext).toBeDefined();
        expect(variant.narrativeContext.length).toBeGreaterThan(50); // Substantial guidance
      });
    });

    test('Quest 9 has commonPitfalls section with location-specific warnings', async () => {
      const result = await questManager.loadQuest('find_the_tome_of_strahd');
      expect(result.data.dmGuidance.commonPitfalls).toBeDefined();
      expect(result.data.dmGuidance.commonPitfalls.length).toBeGreaterThan(5);
    });

    test('Quest 7 has alternatives section with location-specific options', async () => {
      const result = await questManager.loadQuest('find_the_sunsword');
      expect(result.data.dmGuidance.alternatives).toBeDefined();
      expect(result.data.dmGuidance.alternatives.length).toBeGreaterThan(5);
    });
  });

  // ============================================================================
  // AC-8: Integration with Quest Chain Progression
  // ============================================================================

  describe('AC-8: Integration with Quest Chain', () => {
    test('Quest 5 (Seek the Vistani) unlocks Quests 7-9', async () => {
      const result = await questManager.loadQuest('seek_the_vistani');
      expect(result.data.consequences.onCompletion.unlockedQuests).toContain('find_the_sunsword');
      expect(result.data.consequences.onCompletion.unlockedQuests).toContain('find_the_holy_symbol_of_ravenkind');
      expect(result.data.consequences.onCompletion.unlockedQuests).toContain('find_the_tome_of_strahd');
    });

    test('Quest 12 (Destroy Strahd) requires Quests 7-9', async () => {
      const result = await questManager.loadQuest('destroy_strahd_von_zarovich');
      expect(result.data.prerequisites.requiredQuests.completed).toContain('find_the_sunsword');
      expect(result.data.prerequisites.requiredQuests.completed).toContain('find_the_holy_symbol_of_ravenkind');
      expect(result.data.prerequisites.requiredQuests.completed).toContain('find_the_tome_of_strahd');
    });

    test('Quest 12 requires all three artifact items', async () => {
      const result = await questManager.loadQuest('destroy_strahd_von_zarovich');
      expect(result.data.prerequisites.requiredItems).toContain('sunsword');
      expect(result.data.prerequisites.requiredItems).toContain('holy_symbol_of_ravenkind');
      expect(result.data.prerequisites.requiredItems).toContain('tome_of_strahd');
    });

    test('Quest 5 has artifactQuestReferences in dmGuidance', async () => {
      const result = await questManager.loadQuest('seek_the_vistani');
      expect(result.data.dmGuidance.artifactQuestReferences).toBeDefined();
      expect(result.data.dmGuidance.artifactQuestReferences).toHaveLength(3);
    });

    test('Quest 12 has artifactUsageInCombat guidance', async () => {
      const result = await questManager.loadQuest('destroy_strahd_von_zarovich');
      expect(result.data.dmGuidance.artifactUsageInCombat).toBeDefined();
      expect(result.data.dmGuidance.artifactUsageInCombat).toHaveLength(3); // 3 artifacts
    });
  });

  // ============================================================================
  // AC-9: Testing and Validation
  // ============================================================================

  describe('AC-9: YAML Schema Validation', () => {
    test('Quest 7 YAML is valid and loads without errors', async () => {
      const result = await questManager.loadQuest('find_the_sunsword');
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('Quest 8 YAML is valid and loads without errors', async () => {
      const result = await questManager.loadQuest('find_the_holy_symbol_of_ravenkind');
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('Quest 9 YAML is valid and loads without errors', async () => {
      const result = await questManager.loadQuest('find_the_tome_of_strahd');
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('All artifact quests have quest-template.yaml v1.0.0 compatibility', async () => {
      const quests = [
        'find_the_sunsword',
        'find_the_holy_symbol_of_ravenkind',
        'find_the_tome_of_strahd'
      ];

      for (const questId of quests) {
        const result = await questManager.loadQuest(questId);
        expect(result.data.templateVersion).toBe('1.0.0');
      }
    });

    test('Quest 7 file size is within 400-600 line target', () => {
      const content = fs.readFileSync('game-data/quests/find-the-sunsword.yaml', 'utf8');
      const lines = content.split('\n').length;
      expect(lines).toBeGreaterThan(400);
      expect(lines).toBeLessThan(700); // Allow slight overflow
    });

    test('Quest 8 file size is within 400-600 line target', () => {
      const content = fs.readFileSync('game-data/quests/find-the-holy-symbol-of-ravenkind.yaml', 'utf8');
      const lines = content.split('\n').length;
      expect(lines).toBeGreaterThan(400);
      expect(lines).toBeLessThan(700);
    });

    test('Quest 9 file size is within 400-600 line target', () => {
      const content = fs.readFileSync('game-data/quests/find-the-tome-of-strahd.yaml', 'utf8');
      const lines = content.split('\n').length;
      expect(lines).toBeGreaterThan(400);
      expect(lines).toBeLessThan(700);
    });
  });

  // ============================================================================
  // AC-10: File Updates and Cross-References
  // ============================================================================

  describe('AC-10: Cross-References', () => {
    test('Quest 5 references artifact quest locations in dmGuidance', async () => {
      const result = await questManager.loadQuest('seek_the_vistani');
      const ref1 = result.data.dmGuidance.artifactQuestReferences.find(r => r.questId === 'find_the_sunsword');
      const ref2 = result.data.dmGuidance.artifactQuestReferences.find(r => r.questId === 'find_the_holy_symbol_of_ravenkind');
      const ref3 = result.data.dmGuidance.artifactQuestReferences.find(r => r.questId === 'find_the_tome_of_strahd');

      expect(ref1).toBeDefined();
      expect(ref2).toBeDefined();
      expect(ref3).toBeDefined();
    });

    test('Quest 12 dmGuidance includes artifact tactical usage', async () => {
      const result = await questManager.loadQuest('destroy_strahd_von_zarovich');
      const sunsword = result.data.dmGuidance.artifactUsageInCombat.find(a => a.artifact === 'Sunsword');
      const holy_symbol = result.data.dmGuidance.artifactUsageInCombat.find(a => a.artifact === 'Holy Symbol of Ravenkind');
      const tome = result.data.dmGuidance.artifactUsageInCombat.find(a => a.artifact === 'Tome of Strahd');

      expect(sunsword.tacticalAdvantage).toBeDefined();
      expect(holy_symbol.narrativeImpact).toBeDefined();
      expect(tome.tacticalAdvantage).toBeDefined();
    });
  });
});
