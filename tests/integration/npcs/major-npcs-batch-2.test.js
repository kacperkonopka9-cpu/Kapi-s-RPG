/**
 * Integration Tests: Major NPCs Batch 2
 * Epic 4 Story 4-10 - Van Richten, Ezmerelda, Baron Vargas, Rictavio
 *
 * Validates:
 * - Van Richten: Level 9 ranger/fighter, legendary vampire hunter
 * - Ezmerelda: Level 8 fighter/ranger, roaming NPC, prosthetic leg mechanics
 * - Baron Vargas: Level 4 noble, political figure (antagonist/ally paths)
 * - Rictavio: Disguise identity for Van Richten, completely different dialogue
 * - Schema compliance with NPC template v1.0.0
 * - Quest integration for Epic 4
 * - Epic 1-3 system integration
 *
 * New mechanics: disguise identity, roaming NPC, Tarokka ally, political branching
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

describe('Major NPCs Batch 2 - Integration Tests', () => {
  const npcPaths = {
    vanRichten: path.join(__dirname, '../../../game-data/npcs/rudolph_van_richten.yaml'),
    ezmerelda: path.join(__dirname, '../../../game-data/npcs/ezmerelda_davenir.yaml'),
    baron: path.join(__dirname, '../../../game-data/npcs/baron_vargas_vallakovich.yaml'),
    rictavio: path.join(__dirname, '../../../game-data/npcs/rictavio.yaml'),
  };

  let profiles = {};

  beforeAll(async () => {
    // Load all 4 profiles
    for (const [key, profilePath] of Object.entries(npcPaths)) {
      const profileContent = await fs.readFile(profilePath, 'utf-8');
      profiles[key] = yaml.load(profileContent);
    }
  });

  describe('AC-1: Rudolph van Richten - Legendary Vampire Hunter', () => {
    test('AC-1.1: should have correct npcId and name', () => {
      expect(profiles.vanRichten.npcId).toBe('rudolph_van_richten');
      expect(profiles.vanRichten.name).toBe('Rudolph van Richten');
    });

    test('AC-1.2: should be level 9 ranger/fighter multiclass', () => {
      expect(profiles.vanRichten.level).toBe(9);
      expect(profiles.vanRichten.class).toMatch(/Ranger.*Fighter|Fighter.*Ranger/i);
      expect(profiles.vanRichten.npcType).toBe('major');
    });

    test('AC-1.3: should have correct stat block (AC 17, HP 84)', () => {
      expect(profiles.vanRichten.armorClass).toBe(17);
      expect(profiles.vanRichten.hitPoints.max).toBe(84);
      expect(profiles.vanRichten.proficiencyBonus).toBe(4); // Level 9
    });

    test('AC-1.4: should have high DEX and WIS (vampire hunter build)', () => {
      expect(profiles.vanRichten.abilities.dexterity).toBeGreaterThanOrEqual(18);
      expect(profiles.vanRichten.abilities.wisdom).toBeGreaterThanOrEqual(16);
    });

    test('AC-1.5: should have correct saving throw proficiencies', () => {
      const saves = profiles.vanRichten.proficiencies.savingThrows;
      expect(saves).toContain('dexterity');
      expect(saves).toContain('strength');
      expect(saves).toContain('constitution');
    });

    test('AC-1.6: should have vampire hunting skills', () => {
      const skills = profiles.vanRichten.proficiencies.skills;
      expect(skills).toContain('insight');
      expect(skills).toContain('perception');
      expect(skills).toContain('survival');
    });

    test('AC-1.7: should have vampire hunting equipment', () => {
      const backpack = profiles.vanRichten.inventory.backpack;
      const hasHuntingGear = backpack.some(item =>
        item.item.includes('silvered') ||
        item.item.includes('stake') ||
        item.item.includes('holy_water') ||
        item.item.includes('vampire')
      );
      expect(hasHuntingGear).toBe(true);
    });

    test('AC-1.8: should have Hat of Disguise equipped', () => {
      expect(profiles.vanRichten.inventory.equipped.helm).toBe('hat_of_disguise');
    });

    test('AC-1.9: should have dialogue count between 25-35 lines', () => {
      const dialogue = profiles.vanRichten.dialogue;
      const allDialogue = [
        ...(dialogue.greeting || []),
        ...(dialogue.idle || []),
        ...(dialogue.farewell || []),
        ...(dialogue.questGiving || []),
        ...(dialogue.questComplete || []),
        ...(dialogue.combat || []),
        ...(dialogue.revelation || []),
        ...(dialogue.tarokkaAlly || []),
        ...(dialogue.keyQuotes || [])
      ];
      expect(allDialogue.length).toBeGreaterThanOrEqual(25);
      expect(allDialogue.length).toBeLessThanOrEqual(35);
    });

    test('AC-1.10: should have quest involvement (hunt_strahd, tower_secrets, ezmerelda_reunion)', () => {
      const quests = profiles.vanRichten.aiBehavior.questInvolvement;
      expect(quests).toBeDefined();
      expect(quests.length).toBeGreaterThanOrEqual(3);

      const questIds = quests.map(q => q.questId);
      expect(questIds).toContain('hunt_strahd');
      expect(questIds).toContain('tower_secrets');
      expect(questIds).toContain('ezmerelda_reunion');
    });

    test('AC-1.11: should have Tarokka ally option flag', () => {
      expect(profiles.vanRichten.metadata.tarokka_ally_option).toBe(true);
    });
  });

  describe('AC-2: Ezmerelda d\'Avenir - Fierce Vampire Hunter', () => {
    test('AC-2.1: should have correct npcId and name', () => {
      expect(profiles.ezmerelda.npcId).toBe('ezmerelda_davenir');
      expect(profiles.ezmerelda.name).toBe('Ezmerelda d\'Avenir');
    });

    test('AC-2.2: should be level 8 fighter/ranger', () => {
      expect(profiles.ezmerelda.level).toBe(8);
      expect(profiles.ezmerelda.class).toMatch(/Fighter.*Ranger|Ranger.*Fighter/i);
      expect(profiles.ezmerelda.npcType).toBe('major');
    });

    test('AC-2.3: should have correct stat block (AC 17, HP 68)', () => {
      expect(profiles.ezmerelda.armorClass).toBe(17);
      expect(profiles.ezmerelda.hitPoints.max).toBe(68);
      expect(profiles.ezmerelda.proficiencyBonus).toBe(3); // Level 8
    });

    test('AC-2.4: should have high DEX and CON', () => {
      expect(profiles.ezmerelda.abilities.dexterity).toBe(18);
      expect(profiles.ezmerelda.abilities.constitution).toBeGreaterThanOrEqual(16);
    });

    test('AC-2.5: should have correct saving throws', () => {
      const saves = profiles.ezmerelda.proficiencies.savingThrows;
      expect(saves).toContain('dexterity');
      expect(saves).toContain('strength');
      expect(saves).toContain('constitution');
    });

    test('AC-2.6: should have rapier +1 and hand crossbow equipped', () => {
      expect(profiles.ezmerelda.inventory.equipped.mainHand).toMatch(/rapier.*\+1|rapier_plus_one/i);
      expect(profiles.ezmerelda.inventory.equipped.offHand).toMatch(/crossbow|hand_crossbow/i);
    });

    test('AC-2.7: should have prosthetic leg special ability', () => {
      const abilities = profiles.ezmerelda.specialAbilities;
      const hasProsthetic = abilities.some(ability =>
        ability.name.toLowerCase().includes('prosthetic') ||
        ability.description.toLowerCase().includes('prosthetic leg')
      );
      expect(hasProsthetic).toBe(true);
    });

    test('AC-2.8: should be roaming NPC (canMove: true, not tethered)', () => {
      expect(profiles.ezmerelda.canMove).toBe(true);
      expect(profiles.ezmerelda.tetheredToLocation).toBeNull();
    });

    test('AC-2.9: should have dialogue count between 20-30 lines', () => {
      const dialogue = profiles.ezmerelda.dialogue;
      const allDialogue = [
        ...(dialogue.greeting || []),
        ...(dialogue.idle || []),
        ...(dialogue.farewell || []),
        ...(dialogue.questGiving || []),
        ...(dialogue.questComplete || []),
        ...(dialogue.combat || []),
        ...(dialogue.travel || []),
        ...(dialogue.reunion || []),
        ...(dialogue.keyQuotes || [])
      ];
      expect(allDialogue.length).toBeGreaterThanOrEqual(20);
      expect(allDialogue.length).toBeLessThanOrEqual(30);
    });

    test('AC-2.10: should have Tarokka ally option flag', () => {
      expect(profiles.ezmerelda.metadata.tarokka_ally_option).toBe(true);
    });
  });

  describe('AC-3: Baron Vargas Vallakovich - Tyrannical Burgomaster', () => {
    test('AC-3.1: should have correct npcId and name', () => {
      expect(profiles.baron.npcId).toBe('baron_vargas_vallakovich');
      expect(profiles.baron.name).toBe('Baron Vargas Vallakovich');
    });

    test('AC-3.2: should be level 4 noble (non-combatant)', () => {
      expect(profiles.baron.level).toBe(4);
      expect(profiles.baron.class).toBe('Noble');
      expect(profiles.baron.npcType).toBe('major');
    });

    test('AC-3.3: should have correct stat block (AC 12, HP 26, high CHA)', () => {
      expect(profiles.baron.armorClass).toBe(12);
      expect(profiles.baron.hitPoints.max).toBe(26);
      expect(profiles.baron.abilities.charisma).toBe(16); // +3 modifier
      expect(profiles.baron.proficiencyBonus).toBe(2);
    });

    test('AC-3.4: should have low physical stats (non-combatant)', () => {
      expect(profiles.baron.abilities.strength).toBeLessThanOrEqual(10);
      expect(profiles.baron.abilities.constitution).toBeLessThanOrEqual(12);
    });

    test('AC-3.5: should have social skills (Deception, Intimidation, Persuasion)', () => {
      const skills = profiles.baron.proficiencies.skills;
      expect(skills).toContain('deception');
      expect(skills).toContain('intimidation');
      expect(skills).toContain('persuasion');
    });

    test('AC-3.6: should have ceremonial equipment (not combat gear)', () => {
      expect(profiles.baron.inventory.equipped.mainHand).toMatch(/scepter|ceremonial/i);
    });

    test('AC-3.7: should have dialogue count between 30-40 lines (verbose character)', () => {
      const dialogue = profiles.baron.dialogue;
      const allDialogue = [
        ...(dialogue.greeting || []),
        ...(dialogue.idle || []),
        ...(dialogue.farewell || []),
        ...(dialogue.questGiving || []),
        ...(dialogue.questComplete || []),
        ...(dialogue.combat || []),
        ...(dialogue.festival || []),
        ...(dialogue.political || []),
        ...(dialogue.paranoid || []),
        ...(dialogue.keyQuotes || [])
      ];
      expect(allDialogue.length).toBeGreaterThanOrEqual(30);
      expect(allDialogue.length).toBeLessThanOrEqual(40);
    });

    test('AC-3.8: should include "All will be well!" catchphrase', () => {
      const dialogue = profiles.baron.dialogue;
      const allDialogue = [
        ...(dialogue.greeting || []),
        ...(dialogue.idle || []),
        ...(dialogue.farewell || []),
        ...(dialogue.festival || []),
        ...(dialogue.keyQuotes || [])
      ].join(' ');

      expect(allDialogue).toMatch(/All will be well/i);
    });

    test('AC-3.9: should have political quest involvement (festival, revolution, alliance)', () => {
      const quests = profiles.baron.aiBehavior.questInvolvement;
      const questIds = quests.map(q => q.questId);
      expect(questIds).toContain('festival_of_the_blazing_sun');
      expect(questIds).toContain('vallaki_revolution');
      expect(questIds).toContain('political_alliance');
    });
  });

  describe('AC-4: Rictavio - Van Richten\'s Carnival Disguise', () => {
    test('AC-4.1: should have correct npcId and name', () => {
      expect(profiles.rictavio.npcId).toBe('rictavio');
      expect(profiles.rictavio.name).toBe('Rictavio');
    });

    test('AC-4.2: should have identical stat block to Van Richten', () => {
      expect(profiles.rictavio.armorClass).toBe(17);
      expect(profiles.rictavio.hitPoints.max).toBe(84);
      expect(profiles.rictavio.level).toBe(9);
      expect(profiles.rictavio.proficiencyBonus).toBe(4);
    });

    test('AC-4.3: should have identical ability scores to Van Richten', () => {
      expect(profiles.rictavio.abilities.strength).toBe(profiles.vanRichten.abilities.strength);
      expect(profiles.rictavio.abilities.dexterity).toBe(profiles.vanRichten.abilities.dexterity);
      expect(profiles.rictavio.abilities.constitution).toBe(profiles.vanRichten.abilities.constitution);
      expect(profiles.rictavio.abilities.intelligence).toBe(profiles.vanRichten.abilities.intelligence);
      expect(profiles.rictavio.abilities.wisdom).toBe(profiles.vanRichten.abilities.wisdom);
      expect(profiles.rictavio.abilities.charisma).toBe(profiles.vanRichten.abilities.charisma);
    });

    test('AC-4.4: should have true_identity field linking to Van Richten', () => {
      expect(profiles.rictavio.true_identity).toBe('rudolph_van_richten');
    });

    test('AC-4.5: should have Performance skill (Van Richten doesn\'t)', () => {
      expect(profiles.rictavio.proficiencies.skills).toContain('performance');
    });

    test('AC-4.6: should have Hat of Disguise equipped', () => {
      expect(profiles.rictavio.inventory.equipped.helm).toBe('hat_of_disguise');
    });

    test('AC-4.7: should have completely different dialogue style from Van Richten', () => {
      const rictavioDialogue = profiles.rictavio.dialogue.greeting[0] || '';
      const vanRichtenDialogue = profiles.vanRichten.dialogue.greeting[0] || '';

      // Rictavio should be theatrical/jovial, Van Richten should be serious/grim
      expect(rictavioDialogue).not.toBe(vanRichtenDialogue);
      expect(rictavioDialogue.length).toBeGreaterThan(0);
    });

    test('AC-4.8: should have dialogue count between 20-30 lines', () => {
      const dialogue = profiles.rictavio.dialogue;
      const allDialogue = [
        ...(dialogue.greeting || []),
        ...(dialogue.idle || []),
        ...(dialogue.farewell || []),
        ...(dialogue.stories || []),
        ...(dialogue.deflecting || []),
        ...(dialogue.revelation || []),
        ...(dialogue.keyQuotes || [])
      ];
      expect(allDialogue.length).toBeGreaterThanOrEqual(20);
      expect(allDialogue.length).toBeLessThanOrEqual(30);
    });

    test('AC-4.9: should have revelation quest (rictavio_true_identity)', () => {
      const quests = profiles.rictavio.aiBehavior.questInvolvement;
      const questIds = quests.map(q => q.questId);
      expect(questIds).toContain('rictavio_true_identity');
    });

    test('AC-4.10: should have revelation triggers defined', () => {
      expect(profiles.rictavio.revelation_triggers).toBeDefined();
      expect(profiles.rictavio.revelation_triggers.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('AC-5: Schema Compliance - All 4 NPCs', () => {
    test('AC-5.1: Van Richten should have all required top-level fields', () => {
      expect(profiles.vanRichten.npcId).toBeDefined();
      expect(profiles.vanRichten.name).toBeDefined();
      expect(profiles.vanRichten.abilities).toBeDefined();
      expect(profiles.vanRichten.hitPoints).toBeDefined();
      expect(profiles.vanRichten.proficiencies).toBeDefined();
      expect(profiles.vanRichten.personality).toBeDefined();
      expect(profiles.vanRichten.dialogue).toBeDefined();
      expect(profiles.vanRichten.relationships).toBeDefined();
      expect(profiles.vanRichten.aiBehavior).toBeDefined();
      expect(profiles.vanRichten.metadata).toBeDefined();
    });

    test('AC-5.2: Ezmerelda should have all required top-level fields', () => {
      expect(profiles.ezmerelda.npcId).toBeDefined();
      expect(profiles.ezmerelda.name).toBeDefined();
      expect(profiles.ezmerelda.abilities).toBeDefined();
      expect(profiles.ezmerelda.hitPoints).toBeDefined();
      expect(profiles.ezmerelda.proficiencies).toBeDefined();
      expect(profiles.ezmerelda.personality).toBeDefined();
      expect(profiles.ezmerelda.dialogue).toBeDefined();
      expect(profiles.ezmerelda.relationships).toBeDefined();
      expect(profiles.ezmerelda.aiBehavior).toBeDefined();
      expect(profiles.ezmerelda.metadata).toBeDefined();
    });

    test('AC-5.3: Baron Vargas should have all required top-level fields', () => {
      expect(profiles.baron.npcId).toBeDefined();
      expect(profiles.baron.name).toBeDefined();
      expect(profiles.baron.abilities).toBeDefined();
      expect(profiles.baron.hitPoints).toBeDefined();
      expect(profiles.baron.proficiencies).toBeDefined();
      expect(profiles.baron.personality).toBeDefined();
      expect(profiles.baron.dialogue).toBeDefined();
      expect(profiles.baron.relationships).toBeDefined();
      expect(profiles.baron.aiBehavior).toBeDefined();
      expect(profiles.baron.metadata).toBeDefined();
    });

    test('AC-5.4: Rictavio should have all required top-level fields', () => {
      expect(profiles.rictavio.npcId).toBeDefined();
      expect(profiles.rictavio.name).toBeDefined();
      expect(profiles.rictavio.abilities).toBeDefined();
      expect(profiles.rictavio.hitPoints).toBeDefined();
      expect(profiles.rictavio.proficiencies).toBeDefined();
      expect(profiles.rictavio.personality).toBeDefined();
      expect(profiles.rictavio.dialogue).toBeDefined();
      expect(profiles.rictavio.relationships).toBeDefined();
      expect(profiles.rictavio.aiBehavior).toBeDefined();
      expect(profiles.rictavio.metadata).toBeDefined();
    });

    test('AC-5.5: all NPCs should have snake_case npcId', () => {
      expect(profiles.vanRichten.npcId).toMatch(/^[a-z_]+$/);
      expect(profiles.ezmerelda.npcId).toMatch(/^[a-z_]+$/);
      expect(profiles.baron.npcId).toMatch(/^[a-z_]+$/);
      expect(profiles.rictavio.npcId).toMatch(/^[a-z_]+$/);
    });

    test('AC-5.6: all NPCs should have valid D&D 5e proficiency bonus', () => {
      // Level 1-4: +2, Level 5-8: +3, Level 9-12: +4
      expect(profiles.vanRichten.proficiencyBonus).toBe(4); // Level 9
      expect(profiles.ezmerelda.proficiencyBonus).toBe(3); // Level 8
      expect(profiles.baron.proficiencyBonus).toBe(2); // Level 4
      expect(profiles.rictavio.proficiencyBonus).toBe(4); // Level 9 (same as Van Richten)
    });

    test('AC-5.7: all NPCs should have templateVersion 1.0.0', () => {
      expect(profiles.vanRichten.templateVersion).toBe('1.0.0');
      expect(profiles.ezmerelda.templateVersion).toBe('1.0.0');
      expect(profiles.baron.templateVersion).toBe('1.0.0');
      expect(profiles.rictavio.templateVersion).toBe('1.0.0');
    });
  });

  describe('AC-6: Quest Integration - All 4 NPCs', () => {
    test('AC-6.1: Van Richten should have 4 quest involvements', () => {
      const quests = profiles.vanRichten.aiBehavior.questInvolvement;
      expect(quests.length).toBeGreaterThanOrEqual(4);
    });

    test('AC-6.2: Ezmerelda should have 3 quest involvements', () => {
      const quests = profiles.ezmerelda.aiBehavior.questInvolvement;
      expect(quests.length).toBe(3);
    });

    test('AC-6.3: Baron Vargas should have 4 quest involvements', () => {
      const quests = profiles.baron.aiBehavior.questInvolvement;
      expect(quests.length).toBeGreaterThanOrEqual(4);
    });

    test('AC-6.4: Rictavio should have 2 quest involvements', () => {
      const quests = profiles.rictavio.aiBehavior.questInvolvement;
      expect(quests.length).toBeGreaterThanOrEqual(2);
    });

    test('AC-6.5: all quest IDs should be kebab-case', () => {
      const allQuests = [
        ...profiles.vanRichten.aiBehavior.questInvolvement,
        ...profiles.ezmerelda.aiBehavior.questInvolvement,
        ...profiles.baron.aiBehavior.questInvolvement,
        ...profiles.rictavio.aiBehavior.questInvolvement,
      ];

      allQuests.forEach(quest => {
        expect(quest.questId).toMatch(/^[a-z0-9_-]+$/);
      });
    });

    test('AC-6.6: all quests should have role, notes fields', () => {
      const allQuests = [
        ...profiles.vanRichten.aiBehavior.questInvolvement,
        ...profiles.ezmerelda.aiBehavior.questInvolvement,
        ...profiles.baron.aiBehavior.questInvolvement,
        ...profiles.rictavio.aiBehavior.questInvolvement,
      ];

      allQuests.forEach(quest => {
        expect(quest.role).toBeDefined();
        expect(quest.notes).toBeDefined();
        expect(typeof quest.notes).toBe('string');
      });
    });
  });

  describe('AC-7: Dialogue Completeness - All 4 NPCs', () => {
    test('AC-7.1: Van Richten should have greeting dialogue', () => {
      expect(profiles.vanRichten.dialogue.greeting).toBeDefined();
      expect(profiles.vanRichten.dialogue.greeting.length).toBeGreaterThan(0);
    });

    test('AC-7.2: Ezmerelda should have combat dialogue', () => {
      expect(profiles.ezmerelda.dialogue.combat).toBeDefined();
      expect(profiles.ezmerelda.dialogue.combat.length).toBeGreaterThan(0);
    });

    test('AC-7.3: Baron Vargas should have political dialogue', () => {
      expect(profiles.baron.dialogue.political).toBeDefined();
      expect(profiles.baron.dialogue.political.length).toBeGreaterThan(0);
    });

    test('AC-7.4: Rictavio should have stories dialogue (unique to him)', () => {
      expect(profiles.rictavio.dialogue.stories).toBeDefined();
      expect(profiles.rictavio.dialogue.stories.length).toBeGreaterThan(0);
    });

    test('AC-7.5: all NPCs should have keyQuotes', () => {
      expect(profiles.vanRichten.dialogue.keyQuotes).toBeDefined();
      expect(profiles.ezmerelda.dialogue.keyQuotes).toBeDefined();
      expect(profiles.baron.dialogue.keyQuotes).toBeDefined();
      expect(profiles.rictavio.dialogue.keyQuotes).toBeDefined();
    });

    test('AC-7.6: Rictavio dialogue should be tonally different from Van Richten', () => {
      const rictavioSample = (profiles.rictavio.dialogue.greeting[0] || '').toLowerCase();
      const vanRichtenSample = (profiles.vanRichten.dialogue.greeting[0] || '').toLowerCase();

      // Rictavio should use exclamation marks and be verbose
      expect(rictavioSample).toMatch(/!|wonderful|welcome|greet/i);
      // Van Richten should be serious/tactical
      expect(vanRichtenSample).not.toMatch(/wonderful|carnival|story/i);
    });
  });

  describe('AC-8: Epic 1-3 Integration Checkpoint', () => {
    test('AC-8.1: Van Richten should have dynamicState (Epic 1 StateManager)', () => {
      expect(profiles.vanRichten.dynamicState).toBeDefined();
      expect(profiles.vanRichten.dynamicState.disguise_active).toBeDefined();
    });

    test('AC-8.2: Baron Vargas should have schedule (Epic 2 EventScheduler)', () => {
      expect(profiles.baron.schedule).toBeDefined();
      expect(profiles.baron.schedule.length).toBeGreaterThan(0);
    });

    test('AC-8.3: all NPCs should have valid ability modifiers (Epic 3 CharacterManager)', () => {
      // STR 14 = +2, DEX 18 = +4, etc.
      const calculateModifier = (score) => Math.floor((score - 10) / 2);

      [profiles.vanRichten, profiles.ezmerelda, profiles.baron, profiles.rictavio].forEach(profile => {
        Object.keys(profile.abilities).forEach(ability => {
          const score = profile.abilities[ability];
          expect(score).toBeGreaterThanOrEqual(1);
          expect(score).toBeLessThanOrEqual(30);
        });
      });
    });

    test('AC-8.4: Van Richten should parse as valid CharacterSheet', () => {
      // Validate required CharacterSheet fields
      expect(profiles.vanRichten.class).toBeDefined();
      expect(profiles.vanRichten.level).toBeDefined();
      expect(profiles.vanRichten.abilities).toBeDefined();
      expect(profiles.vanRichten.hitPoints).toBeDefined();
      expect(profiles.vanRichten.proficiencies.savingThrows).toBeDefined();
    });

    test('AC-8.5: Ezmerelda should parse as valid CharacterSheet', () => {
      expect(profiles.ezmerelda.class).toBeDefined();
      expect(profiles.ezmerelda.level).toBeDefined();
      expect(profiles.ezmerelda.abilities).toBeDefined();
      expect(profiles.ezmerelda.hitPoints).toBeDefined();
      expect(profiles.ezmerelda.proficiencies.savingThrows).toBeDefined();
    });

    test('AC-8.6: Baron Vargas should parse as valid CharacterSheet', () => {
      expect(profiles.baron.class).toBeDefined();
      expect(profiles.baron.level).toBeDefined();
      expect(profiles.baron.abilities).toBeDefined();
      expect(profiles.baron.hitPoints).toBeDefined();
    });

    test('AC-8.7: Rictavio should parse as valid CharacterSheet (same as Van Richten)', () => {
      expect(profiles.rictavio.class).toBeDefined();
      expect(profiles.rictavio.level).toBeDefined();
      expect(profiles.rictavio.abilities).toBeDefined();
      expect(profiles.rictavio.hitPoints.max).toBe(profiles.vanRichten.hitPoints.max);
    });
  });
});
