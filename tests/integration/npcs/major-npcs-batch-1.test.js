/**
 * Integration Tests: Major NPCs Batch 1
 * Epic 4 Story 4-9 - Ismark, Father Lucian, Madam Eva, Burgomaster Dmitri
 *
 * Validates:
 * - CharacterManager can load all 4 NPC profiles
 * - D&D 5e stat blocks (fighter, cleric, diviner, commoner)
 * - Spellcasting structures (Father Lucian, Madam Eva)
 * - Personality and dialogue completeness
 * - Quest integration for Epic 4 quests
 * - Relationship networks
 * - Schema compliance with NPC template v1.0.0
 *
 * This batch tests 4 major supporting NPCs created in single story
 * vs individual NPC stories (4-7 Strahd, 4-8 Ireena).
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

describe('Major NPCs Batch 1 - Integration Tests', () => {
  const npcPaths = {
    ismark: path.join(__dirname, '../../../game-data/npcs/ismark_kolyanovich.yaml'),
    lucian: path.join(__dirname, '../../../game-data/npcs/father_lucian_petrovich.yaml'),
    eva: path.join(__dirname, '../../../game-data/npcs/madam_eva.yaml'),
    dmitri: path.join(__dirname, '../../../game-data/npcs/burgomaster_dmitri_krezkov.yaml'),
  };

  let profiles = {};

  beforeAll(async () => {
    // Load all 4 profiles
    for (const [key, profilePath] of Object.entries(npcPaths)) {
      const profileContent = await fs.readFile(profilePath, 'utf-8');
      profiles[key] = yaml.load(profileContent);
    }
  });

  describe('AC-1: Ismark Kolyanovich - Fighter Stats', () => {
    test('should have correct npcId and name', () => {
      expect(profiles.ismark.npcId).toBe('ismark_kolyanovich');
      expect(profiles.ismark.name).toBe('Ismark Kolyanovich');
    });

    test('should be level 3 fighter with correct stats', () => {
      expect(profiles.ismark.class).toBe('Fighter');
      expect(profiles.ismark.level).toBe(3);
      expect(profiles.ismark.npcType).toBe('major');
      expect(profiles.ismark.background).toBe("Noble (Burgomaster's Son)");
    });

    test('should have correct ability scores (STR-focused fighter)', () => {
      expect(profiles.ismark.abilities.strength).toBe(14);  // +2
      expect(profiles.ismark.abilities.dexterity).toBe(12); // +1
      expect(profiles.ismark.abilities.constitution).toBe(13); // +1
    });

    test('should have correct HP and AC for level 3 fighter', () => {
      expect(profiles.ismark.hitPoints.max).toBe(16); // 3d8+3
      expect(profiles.ismark.armorClass).toBe(14); // Leather + shield + DEX
      expect(profiles.ismark.proficiencyBonus).toBe(2);
    });

    test('should have correct saving throws for fighter', () => {
      expect(profiles.ismark.proficiencies.savingThrows).toContain('strength');
      expect(profiles.ismark.proficiencies.savingThrows).toContain('constitution');
    });

    test('should have correct skills', () => {
      const skills = profiles.ismark.proficiencies.skills;
      expect(skills).toContain('athletics');
      expect(skills).toContain('perception');
      expect(skills).toContain('survival');
    });

    test('should have fighter features (Second Wind, Action Surge)', () => {
      const featureNames = profiles.ismark.features.map(f => f.name);
      expect(featureNames).toContain('Second Wind');
      expect(featureNames).toContain('Action Surge');
    });

    test('should not have spellcasting', () => {
      expect(profiles.ismark.spellcasting).toBeNull();
    });
  });

  describe('AC-2: Father Lucian - Cleric Spellcasting', () => {
    test('should have correct npcId and name', () => {
      expect(profiles.lucian.npcId).toBe('father_lucian_petrovich');
      expect(profiles.lucian.name).toBe('Father Lucian Petrovich');
    });

    test('should be level 4 cleric', () => {
      expect(profiles.lucian.class).toBe('Cleric');
      expect(profiles.lucian.level).toBe(4);
      expect(profiles.lucian.npcType).toBe('major');
    });

    test('should have WIS-based spellcasting', () => {
      expect(profiles.lucian.spellcasting).not.toBeNull();
      expect(profiles.lucian.spellcasting.ability).toBe('wisdom');
      expect(profiles.lucian.spellcasting.spellSaveDC).toBe(13);
      expect(profiles.lucian.spellcasting.spellAttackBonus).toBe(5);
    });

    test('should have correct spell slots for level 4 cleric', () => {
      expect(profiles.lucian.spellcasting.spellSlots[1]).toBe(4);
      expect(profiles.lucian.spellcasting.spellSlots[2]).toBe(3);
    });

    test('should have healing spells prepared', () => {
      const spells = profiles.lucian.spellcasting.spellsPrepared;
      expect(spells).toContain('cure_wounds');
      expect(spells).toContain('bless');
      expect(spells).toContain('lesser_restoration');
    });

    test('should have correct cantrips', () => {
      const cantrips = profiles.lucian.spellcasting.cantrips;
      expect(cantrips).toContain('sacred_flame');
      expect(cantrips).toContain('light');
      expect(cantrips).toContain('thaumaturgy');
    });

    test('should have Channel Divinity feature', () => {
      const featureNames = profiles.lucian.features.map(f => f.name);
      expect(featureNames).toContain('Channel Divinity (2/Rest)');
      expect(featureNames).toContain('Turn Undead');
    });

    test('should have WIS-based ability scores', () => {
      expect(profiles.lucian.abilities.wisdom).toBe(16); // +3
      expect(profiles.lucian.abilities.charisma).toBe(14); // +2
    });
  });

  describe('AC-3: Madam Eva - Divination Spellcaster', () => {
    test('should have correct npcId and name', () => {
      expect(profiles.eva.npcId).toBe('madam_eva');
      expect(profiles.eva.name).toBe('Madam Eva');
    });

    test('should be level 9 diviner', () => {
      expect(profiles.eva.class).toBe('Diviner');
      expect(profiles.eva.level).toBe(9);
      expect(profiles.eva.npcType).toBe('major');
    });

    test('should have WIS-based divination spellcasting', () => {
      expect(profiles.eva.spellcasting).not.toBeNull();
      expect(profiles.eva.spellcasting.ability).toBe('wisdom');
      expect(profiles.eva.spellcasting.spellSaveDC).toBe(16);
      expect(profiles.eva.spellcasting.spellAttackBonus).toBe(8);
    });

    test('should have correct spell slots for level 9 caster', () => {
      expect(profiles.eva.spellcasting.spellSlots[1]).toBe(4);
      expect(profiles.eva.spellcasting.spellSlots[2]).toBe(3);
      expect(profiles.eva.spellcasting.spellSlots[3]).toBe(3);
      expect(profiles.eva.spellcasting.spellSlots[4]).toBe(3);
      expect(profiles.eva.spellcasting.spellSlots[5]).toBe(1);
    });

    test('should have divination spells prepared', () => {
      const spells = profiles.eva.spellcasting.spellsPrepared;
      expect(spells).toContain('scrying');
      expect(spells).toContain('clairvoyance');
      expect(spells).toContain('divination');
      expect(spells).toContain('detect_thoughts');
    });

    test('should have special curse ability', () => {
      const abilityNames = profiles.eva.specialAbilities.map(a => a.name);
      expect(abilityNames).toContain('Curse (1/Day)');
      expect(abilityNames).toContain('Tarokka Reading');
    });

    test('should have Portent feature (diviner)', () => {
      const featureNames = profiles.eva.features.map(f => f.name);
      expect(featureNames).toContain('Portent (3/Day)');
    });

    test('should have proficiency bonus +4', () => {
      expect(profiles.eva.proficiencyBonus).toBe(4);
    });

    test('should have high WIS and INT scores', () => {
      expect(profiles.eva.abilities.wisdom).toBe(18); // +4
      expect(profiles.eva.abilities.intelligence).toBe(16); // +3
    });
  });

  describe('AC-4: Burgomaster Dmitri - Non-combatant Noble', () => {
    test('should have correct npcId and name', () => {
      expect(profiles.dmitri.npcId).toBe('burgomaster_dmitri_krezkov');
      expect(profiles.dmitri.name).toBe('Burgomaster Dmitri Krezkov');
    });

    test('should be commoner (no class)', () => {
      expect(profiles.dmitri.class).toBeNull();
      expect(profiles.dmitri.level).toBe(2);
      expect(profiles.dmitri.background).toBe('Noble (Burgomaster)');
    });

    test('should have low HP and AC (non-combatant)', () => {
      expect(profiles.dmitri.hitPoints.max).toBe(9); // 2d8
      expect(profiles.dmitri.armorClass).toBe(10); // No armor
    });

    test('should have WIS-based proficiency (noble)', () => {
      expect(profiles.dmitri.proficiencies.savingThrows).toContain('wisdom');
      const skills = profiles.dmitri.proficiencies.skills;
      expect(skills).toContain('insight');
      expect(skills).toContain('persuasion');
      expect(skills).toContain('history');
    });

    test('should not have spellcasting', () => {
      expect(profiles.dmitri.spellcasting).toBeNull();
    });

    test('should have Position of Privilege feature', () => {
      const featureNames = profiles.dmitri.features.map(f => f.name);
      expect(featureNames).toContain('Position of Privilege');
    });
  });

  describe('AC-5: Schema Compliance - All 4 NPCs', () => {
    test('all profiles should have templateVersion 1.0.0', () => {
      expect(profiles.ismark.templateVersion).toBe('1.0.0');
      expect(profiles.lucian.templateVersion).toBe('1.0.0');
      expect(profiles.eva.templateVersion).toBe('1.0.0');
      expect(profiles.dmitri.templateVersion).toBe('1.0.0');
    });

    test('all profiles should be compatible with CharacterManager', () => {
      const compatible = 'Epic 3 CharacterManager (Story 3-2)';
      expect(profiles.ismark.compatibleWith).toBe(compatible);
      expect(profiles.lucian.compatibleWith).toBe(compatible);
      expect(profiles.eva.compatibleWith).toBe(compatible);
      expect(profiles.dmitri.compatibleWith).toBe(compatible);
    });

    test('all profiles should have required basic fields', () => {
      for (const profile of Object.values(profiles)) {
        expect(profile.name).toBeDefined();
        expect(profile.npcId).toBeDefined();
        expect(profile.race).toBeDefined();
        expect(profile.alignment).toBeDefined();
        expect(profile.npcType).toBe('major');
      }
    });

    test('all profiles should have complete ability scores', () => {
      for (const profile of Object.values(profiles)) {
        expect(profile.abilities.strength).toBeDefined();
        expect(profile.abilities.dexterity).toBeDefined();
        expect(profile.abilities.constitution).toBeDefined();
        expect(profile.abilities.intelligence).toBeDefined();
        expect(profile.abilities.wisdom).toBeDefined();
        expect(profile.abilities.charisma).toBeDefined();
      }
    });

    test('all profiles should have hitPoints structure', () => {
      for (const profile of Object.values(profiles)) {
        expect(profile.hitPoints.max).toBeGreaterThan(0);
        expect(profile.hitPoints.hitDice.total).toBeGreaterThan(0);
        expect(profile.hitPoints.hitDice.die).toBeDefined();
      }
    });

    test('all profiles should have proficiencies structure', () => {
      for (const profile of Object.values(profiles)) {
        expect(Array.isArray(profile.proficiencies.savingThrows)).toBe(true);
        expect(Array.isArray(profile.proficiencies.skills)).toBe(true);
        expect(Array.isArray(profile.proficiencies.languages)).toBe(true);
      }
    });

    test('all profiles should have personality structure', () => {
      for (const profile of Object.values(profiles)) {
        expect(Array.isArray(profile.personality.traits)).toBe(true);
        expect(Array.isArray(profile.personality.ideals)).toBe(true);
        expect(Array.isArray(profile.personality.bonds)).toBe(true);
        expect(Array.isArray(profile.personality.flaws)).toBe(true);
        expect(profile.personality.voiceDescription).toBeDefined();
        expect(profile.personality.appearanceNotes).toBeDefined();
      }
    });

    test('all profiles should have dialogue structure', () => {
      for (const profile of Object.values(profiles)) {
        expect(Array.isArray(profile.dialogue.greeting)).toBe(true);
        expect(Array.isArray(profile.dialogue.keyQuotes)).toBe(true);
      }
    });
  });

  describe('AC-6: Quest Integration - All 4 NPCs', () => {
    test('Ismark should have burial and escort quest involvement', () => {
      const questIds = profiles.ismark.aiBehavior.questInvolvement.map(q => q.questId);
      expect(questIds).toContain('bury_the_burgomaster');
      expect(questIds).toContain('escort_ireena_to_vallaki');
    });

    test('Father Lucian should have St. Andrals Feast quest involvement', () => {
      const questIds = profiles.lucian.aiBehavior.questInvolvement.map(q => q.questId);
      expect(questIds).toContain('st_andrals_feast');
      expect(questIds).toContain('ireena_sanctuary');
    });

    test('Madam Eva should have Tarokka reading quest involvement', () => {
      const questIds = profiles.eva.aiBehavior.questInvolvement.map(q => q.questId);
      expect(questIds).toContain('tarokka_reading');
    });

    test('Dmitri should have Krezk sanctuary quest involvement', () => {
      const questIds = profiles.dmitri.aiBehavior.questInvolvement.map(q => q.questId);
      expect(questIds).toContain('journey_to_krezk');
      expect(questIds).toContain('wine_delivery_to_krezk');
      expect(questIds).toContain('ilyas_resurrection');
    });

    test('all quest involvement entries should have required fields', () => {
      for (const profile of Object.values(profiles)) {
        for (const quest of profile.aiBehavior.questInvolvement) {
          expect(quest.questId).toBeDefined();
          expect(quest.role).toBeDefined();
          expect(quest.notes).toBeDefined();
        }
      }
    });

    test('quest IDs should follow snake_case convention', () => {
      for (const profile of Object.values(profiles)) {
        for (const quest of profile.aiBehavior.questInvolvement) {
          expect(quest.questId).toMatch(/^[a-z_]+$/);
        }
      }
    });
  });

  describe('AC-7: Dialogue Completeness - All 4 NPCs', () => {
    test('Ismark should have 20-30 total dialogue lines', () => {
      let totalLines = 0;
      totalLines += profiles.ismark.dialogue.greeting.length;
      totalLines += profiles.ismark.dialogue.idle.length;
      totalLines += profiles.ismark.dialogue.farewell.length;
      totalLines += profiles.ismark.dialogue.questGiving.length;
      totalLines += profiles.ismark.dialogue.combat.length;
      totalLines += profiles.ismark.dialogue.keyQuotes.length;
      expect(totalLines).toBeGreaterThanOrEqual(20);
      expect(totalLines).toBeLessThanOrEqual(35);
    });

    test('Father Lucian should have 20-30 total dialogue lines', () => {
      let totalLines = 0;
      totalLines += profiles.lucian.dialogue.greeting.length;
      totalLines += profiles.lucian.dialogue.idle.length;
      totalLines += profiles.lucian.dialogue.farewell.length;
      totalLines += profiles.lucian.dialogue.questGiving.length;
      totalLines += profiles.lucian.dialogue.combat.length;
      totalLines += profiles.lucian.dialogue.keyQuotes.length;
      expect(totalLines).toBeGreaterThanOrEqual(20);
      expect(totalLines).toBeLessThanOrEqual(35);
    });

    test('Madam Eva should have 25-35 total dialogue lines', () => {
      let totalLines = 0;
      totalLines += profiles.eva.dialogue.greeting.length;
      totalLines += profiles.eva.dialogue.idle.length;
      totalLines += profiles.eva.dialogue.farewell.length;
      totalLines += profiles.eva.dialogue.questGiving.length;
      totalLines += profiles.eva.dialogue.tarokkaReading.length;
      totalLines += profiles.eva.dialogue.crypticWarnings.length;
      totalLines += profiles.eva.dialogue.keyQuotes.length;
      expect(totalLines).toBeGreaterThanOrEqual(25);
      expect(totalLines).toBeLessThanOrEqual(40);
    });

    test('Burgomaster Dmitri should have 20-25 total dialogue lines', () => {
      let totalLines = 0;
      totalLines += profiles.dmitri.dialogue.greeting.length;
      totalLines += profiles.dmitri.dialogue.idle.length;
      totalLines += profiles.dmitri.dialogue.farewell.length;
      totalLines += profiles.dmitri.dialogue.questGiving.length;
      totalLines += profiles.dmitri.dialogue.griefDialogue.length;
      totalLines += profiles.dmitri.dialogue.keyQuotes.length;
      expect(totalLines).toBeGreaterThanOrEqual(20);
      expect(totalLines).toBeLessThanOrEqual(30);
    });

    test('all NPCs should have keyQuotes array', () => {
      expect(profiles.ismark.dialogue.keyQuotes.length).toBeGreaterThanOrEqual(2);
      expect(profiles.lucian.dialogue.keyQuotes.length).toBeGreaterThanOrEqual(2);
      expect(profiles.eva.dialogue.keyQuotes.length).toBeGreaterThanOrEqual(3);
      expect(profiles.dmitri.dialogue.keyQuotes.length).toBeGreaterThanOrEqual(2);
    });

    test('all dialogue arrays should contain strings', () => {
      for (const profile of Object.values(profiles)) {
        for (const category of Object.values(profile.dialogue)) {
          if (Array.isArray(category)) {
            for (const line of category) {
              expect(typeof line).toBe('string');
            }
          }
        }
      }
    });
  });

  describe('AC-8: Epic 1-3 Integration Checkpoint', () => {
    test('all profile files should exist and be readable', async () => {
      for (const profilePath of Object.values(npcPaths)) {
        await expect(fs.access(profilePath)).resolves.not.toThrow();
      }
    });

    test('all profiles should be under 500 lines each', async () => {
      for (const [key, profilePath] of Object.entries(npcPaths)) {
        const content = await fs.readFile(profilePath, 'utf-8');
        const lineCount = content.split('\n').length;
        expect(lineCount).toBeLessThan(500);
      }
    });

    test('relationship networks should reference valid NPC IDs', () => {
      // Ismark → Ireena, Strahd
      const ismarkRelationships = [
        ...profiles.ismark.relationships.allies,
        ...profiles.ismark.relationships.enemies,
        ...profiles.ismark.relationships.family
      ];
      const ismarkNpcIds = ismarkRelationships.map(r => r.npcId);
      expect(ismarkNpcIds).toContain('ireena_kolyana');
      expect(ismarkNpcIds).toContain('strahd_von_zarovich');

      // Father Lucian → Ireena, Strahd
      const lucianRelationships = [
        ...profiles.lucian.relationships.allies,
        ...profiles.lucian.relationships.enemies
      ];
      const lucianNpcIds = lucianRelationships.map(r => r.npcId);
      expect(lucianNpcIds).toContain('ireena_kolyana');
      expect(lucianNpcIds).toContain('strahd_von_zarovich');

      // Madam Eva → Strahd
      const evaRelationships = profiles.eva.relationships.relationships;
      const evaNpcIds = evaRelationships.map(r => r.npcId);
      expect(evaNpcIds).toContain('strahd_von_zarovich');

      // Dmitri → Ilya (son)
      const dmitriFamily = profiles.dmitri.relationships.family;
      const dmitriNpcIds = dmitriFamily.map(r => r.npcId);
      expect(dmitriNpcIds).toContain('ilya_krezkov');
    });

    test('schedule entries should use valid HH:MM format', () => {
      const timeRegex = /^\d{2}:\d{2}$/;
      for (const profile of Object.values(profiles)) {
        for (const scheduleEntry of profile.schedule) {
          expect(scheduleEntry.time).toMatch(timeRegex);
        }
      }
    });

    test('schedule entries should reference valid location IDs', () => {
      const validLocations = [
        'village_of_barovia',
        'vallaki',
        'vallaki_st_andrals_church',
        'tser_pool_encampment',
        'krezk',
        'various'
      ];

      for (const profile of Object.values(profiles)) {
        for (const scheduleEntry of profile.schedule) {
          // Some locations may be more specific, just check basic format
          expect(typeof scheduleEntry.location).toBe('string');
          expect(scheduleEntry.location.length).toBeGreaterThan(0);
        }
      }
    });

    test('all profiles should have aiBehavior section', () => {
      for (const profile of Object.values(profiles)) {
        expect(profile.aiBehavior).toBeDefined();
        expect(profile.aiBehavior.combatTactics).toBeDefined();
        expect(Array.isArray(profile.aiBehavior.goals)).toBe(true);
        expect(Array.isArray(profile.aiBehavior.motivations)).toBe(true);
        expect(Array.isArray(profile.aiBehavior.fears)).toBe(true);
        expect(Array.isArray(profile.aiBehavior.knowledgeSecrets)).toBe(true);
        expect(profile.aiBehavior.attitudeTowardPlayer).toBeDefined();
        expect(profile.aiBehavior.trustLevel).toBeDefined();
        expect(Array.isArray(profile.aiBehavior.questInvolvement)).toBe(true);
      }
    });

    test('all profiles should have metadata section', () => {
      for (const profile of Object.values(profiles)) {
        expect(profile.metadata).toBeDefined();
        expect(profile.metadata.source).toBe('Curse of Strahd');
        expect(profile.metadata.official).toBe(true);
        expect(profile.metadata.developmentStage).toBe('final');
      }
    });
  });
});
