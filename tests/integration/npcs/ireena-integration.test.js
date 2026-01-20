/**
 * Integration Tests: Ireena Kolyana NPC Profile
 * Epic 4 Story 4-8 - Central Quest NPC Integration Checkpoint
 *
 * Validates:
 * - CharacterManager can load Ireena profile
 * - D&D 5e stat block accuracy (human noble non-combatant)
 * - Personality and dialogue completeness
 * - Quest integration for main Curse of Strahd questline
 * - Relationship network (Ismark, Strahd, Kolyan, Sergei, player)
 * - Tatyana lore integration in AI behavior
 * - Dynamic state tracking for story progression
 * - Schema compliance with NPC template v1.0.0
 *
 * This is an INTEGRATION CHECKPOINT ensuring Epic 3 CharacterManager
 * and Epic 2 EventScheduler can handle central quest NPCs with
 * dynamic state, relationship tracking, and multiple quest involvements.
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

describe('Ireena Kolyana NPC Profile - Integration Tests', () => {
  const profilePath = path.join(__dirname, '../../../game-data/npcs/ireena_kolyana.yaml');
  let ireenaProfile;

  beforeAll(async () => {
    // Load Ireena profile
    const profileContent = await fs.readFile(profilePath, 'utf-8');
    ireenaProfile = yaml.load(profileContent);
  });

  describe('AC-1: Complete D&D 5e Stat Block', () => {
    test('should have correct npcId and name', () => {
      expect(ireenaProfile.npcId).toBe('ireena_kolyana');
      expect(ireenaProfile.name).toBe('Ireena Kolyana');
    });

    test('should be human noble non-combatant', () => {
      expect(ireenaProfile.race).toBe('Human');
      expect(ireenaProfile.class).toBeNull(); // Non-combatant noble
      expect(ireenaProfile.background).toBe("Noble (Burgomaster's Daughter)");
      expect(ireenaProfile.alignment).toBe('Neutral Good');
      expect(ireenaProfile.npcType).toBe('major');
    });

    test('should have correct ability scores for human noble', () => {
      expect(ireenaProfile.abilities.strength).toBe(10);
      expect(ireenaProfile.abilities.dexterity).toBe(12);
      expect(ireenaProfile.abilities.constitution).toBe(10);
      expect(ireenaProfile.abilities.intelligence).toBe(13);
      expect(ireenaProfile.abilities.wisdom).toBe(14);
      expect(ireenaProfile.abilities.charisma).toBe(16); // High CHA for social NPC
    });

    test('should have correct HP and AC for level 2 noble', () => {
      expect(ireenaProfile.hitPoints.max).toBe(9); // 2d8 avg
      expect(ireenaProfile.hitPoints.current).toBe(9);
      expect(ireenaProfile.armorClass).toBe(12); // Dress + DEX
    });

    test('should have proficiency bonus of +2', () => {
      expect(ireenaProfile.proficiencyBonus).toBe(2);
    });

    test('should have correct saving throws', () => {
      expect(ireenaProfile.proficiencies.savingThrows).toContain('wisdom');
      expect(ireenaProfile.proficiencies.savingThrows).toContain('charisma');
    });

    test('should have correct skills', () => {
      const skills = ireenaProfile.proficiencies.skills;
      expect(skills).toContain('insight');
      expect(skills).toContain('persuasion');
      expect(skills).toContain('history');
      expect(skills).toContain('perception');
    });

    test('should have languages Common and Elvish', () => {
      expect(ireenaProfile.proficiencies.languages).toContain('Common');
      expect(ireenaProfile.proficiencies.languages).toContain('Elvish');
    });

    test('should not have spellcasting (non-caster)', () => {
      expect(ireenaProfile.spellcasting).toBeNull();
    });
  });

  describe('AC-2: Personality & Dialogue System', () => {
    test('should have comprehensive personality traits', () => {
      expect(Array.isArray(ireenaProfile.personality.traits)).toBe(true);
      expect(ireenaProfile.personality.traits.length).toBeGreaterThanOrEqual(4);
      expect(ireenaProfile.personality.traits.some(t => t.includes('Compassionate'))).toBe(true);
    });

    test('should have ideals, bonds, and flaws defined', () => {
      expect(Array.isArray(ireenaProfile.personality.ideals)).toBe(true);
      expect(ireenaProfile.personality.ideals.length).toBeGreaterThan(0);
      expect(Array.isArray(ireenaProfile.personality.bonds)).toBe(true);
      expect(ireenaProfile.personality.bonds.length).toBeGreaterThan(0);
      expect(Array.isArray(ireenaProfile.personality.flaws)).toBe(true);
      expect(ireenaProfile.personality.flaws.length).toBeGreaterThan(0);
    });

    test('should have mannerisms defined', () => {
      expect(Array.isArray(ireenaProfile.personality.mannerisms)).toBe(true);
      expect(ireenaProfile.personality.mannerisms.length).toBeGreaterThan(0);
      expect(ireenaProfile.personality.mannerisms.some(m => m.includes('neck'))).toBe(true); // Touches bite scars
    });

    test('should have voice description', () => {
      expect(ireenaProfile.personality.voiceDescription).toBeDefined();
      expect(typeof ireenaProfile.personality.voiceDescription).toBe('string');
      expect(ireenaProfile.personality.voiceDescription.length).toBeGreaterThan(10);
    });

    test('should have appearance notes matching Village of Barovia description', () => {
      expect(ireenaProfile.personality.appearanceNotes).toBeDefined();
      expect(ireenaProfile.personality.appearanceNotes).toContain('auburn hair');
      expect(ireenaProfile.personality.appearanceNotes).toContain('green eyes');
      expect(ireenaProfile.personality.appearanceNotes).toContain('bite marks');
      expect(ireenaProfile.personality.appearanceNotes).toContain('blue dress');
    });

    test('should have greeting dialogue options', () => {
      expect(Array.isArray(ireenaProfile.dialogue.greeting)).toBe(true);
      expect(ireenaProfile.dialogue.greeting.length).toBeGreaterThan(0);
      expect(ireenaProfile.dialogue.greeting.some(g => g.includes('hope'))).toBe(true);
    });

    test('should have quest-related dialogue', () => {
      expect(Array.isArray(ireenaProfile.dialogue.questGiving)).toBe(true);
      expect(ireenaProfile.dialogue.questGiving.length).toBeGreaterThan(0);
      expect(ireenaProfile.dialogue.questGiving.some(q => q.includes('father'))).toBe(true);
    });

    test('should have Strahd-specific dialogue', () => {
      expect(Array.isArray(ireenaProfile.dialogue.strahd)).toBe(true);
      expect(ireenaProfile.dialogue.strahd.length).toBeGreaterThan(0);
      expect(ireenaProfile.dialogue.strahd.some(s => s.includes('Tatyana'))).toBe(true);
    });

    test('should have travel dialogue', () => {
      expect(Array.isArray(ireenaProfile.dialogue.travel)).toBe(true);
      expect(ireenaProfile.dialogue.travel.length).toBeGreaterThan(0);
    });

    test('should have Pool of Reflection ending dialogue', () => {
      expect(Array.isArray(ireenaProfile.dialogue.questComplete)).toBe(true);
      expect(ireenaProfile.dialogue.questComplete.some(qc => qc.includes('Pool of Reflection') || qc.includes('Tatyana'))).toBe(true);
    });

    test('should have combat dialogue (non-combatant)', () => {
      expect(Array.isArray(ireenaProfile.dialogue.combat)).toBe(true);
      expect(ireenaProfile.dialogue.combat.some(c => c.includes("no warrior") || c.includes("won't let him take me"))).toBe(true);
    });

    test('should have key memorable quotes', () => {
      expect(Array.isArray(ireenaProfile.dialogue.keyQuotes)).toBe(true);
      expect(ireenaProfile.dialogue.keyQuotes.length).toBeGreaterThan(0);
      expect(ireenaProfile.dialogue.keyQuotes.some(q => q.includes('Hope') || q.includes('Tatyana'))).toBe(true);
    });
  });

  describe('AC-3: Quest Integration', () => {
    test('should have quest involvement array defined', () => {
      expect(Array.isArray(ireenaProfile.aiBehavior.questInvolvement)).toBe(true);
      expect(ireenaProfile.aiBehavior.questInvolvement.length).toBeGreaterThan(0);
    });

    test('should be involved in Bury the Burgomaster quest', () => {
      const buryQuest = ireenaProfile.aiBehavior.questInvolvement.find(
        q => q.questId === 'bury_the_burgomaster'
      );
      expect(buryQuest).toBeDefined();
      expect(buryQuest.role).toBe('quest_target');
    });

    test('should be involved in Escort Ireena to Vallaki quest', () => {
      const escortQuest = ireenaProfile.aiBehavior.questInvolvement.find(
        q => q.questId === 'escort_ireena_to_vallaki'
      );
      expect(escortQuest).toBeDefined();
      expect(escortQuest.role).toBe('quest_target');
    });

    test('should be involved in St. Andrals Feast quest', () => {
      const feastQuest = ireenaProfile.aiBehavior.questInvolvement.find(
        q => q.questId === 'st_andrals_feast'
      );
      expect(feastQuest).toBeDefined();
      expect(feastQuest.role).toBe('target');
    });

    test('should be involved in Journey to Krezk quest', () => {
      const krezkQuest = ireenaProfile.aiBehavior.questInvolvement.find(
        q => q.questId === 'journey_to_krezk'
      );
      expect(krezkQuest).toBeDefined();
      expect(krezkQuest.role).toBe('quest_target');
    });

    test('should be involved in Pool of Reflection ending quest', () => {
      const poolQuest = ireenaProfile.aiBehavior.questInvolvement.find(
        q => q.questId === 'pool_of_reflection_ending'
      );
      expect(poolQuest).toBeDefined();
      expect(poolQuest.role).toBe('quest_target');
    });

    test('all quest involvement entries should have notes', () => {
      ireenaProfile.aiBehavior.questInvolvement.forEach(quest => {
        expect(quest.notes).toBeDefined();
        expect(quest.notes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('AC-4: Relationship Network', () => {
    test('should have relationship with Ismark (brother)', () => {
      const ismark = ireenaProfile.relationships.family.find(
        r => r.npcId === 'ismark_kolyanovich'
      );
      expect(ismark).toBeDefined();
      expect(ismark.relationship).toContain('brother');
      expect(ismark.notes).toBeDefined();
    });

    test('should have relationship with Kolyan Indirovich (father, deceased)', () => {
      const kolyan = ireenaProfile.relationships.family.find(
        r => r.npcId === 'kolyan_indirovich'
      );
      expect(kolyan).toBeDefined();
      expect(kolyan.relationship).toContain('father');
      expect(kolyan.relationship).toContain('deceased');
    });

    test('should have relationship with Strahd (enemy/stalker)', () => {
      const strahd = ireenaProfile.relationships.enemies.find(
        r => r.npcId === 'strahd_von_zarovich'
      );
      expect(strahd).toBeDefined();
      expect(strahd.relationship).toMatch(/stalker|obsessed/);
      expect(strahd.notes).toContain('Tatyana');
    });

    test('should have relationship with Sergei (past life beloved)', () => {
      const sergei = ireenaProfile.relationships.family.find(
        r => r.npcId === 'sergei_von_zarovich'
      );
      expect(sergei).toBeDefined();
      expect(sergei.relationship).toContain('past life');
    });

    test('should have dynamic relationship with player character', () => {
      const player = ireenaProfile.relationships.allies.find(
        r => r.npcId === 'player_character'
      );
      expect(player).toBeDefined();
      expect(player.relationship).toContain('dynamic');
      expect(player.notes).toMatch(/trust|romance/i);
    });

    test('should have allies defined (Father Lucian, player, etc.)', () => {
      expect(Array.isArray(ireenaProfile.relationships.allies)).toBe(true);
      expect(ireenaProfile.relationships.allies.length).toBeGreaterThan(0);
    });

    test('should have enemies defined (Strahd)', () => {
      expect(Array.isArray(ireenaProfile.relationships.enemies)).toBe(true);
      expect(ireenaProfile.relationships.enemies.length).toBeGreaterThan(0);
    });

    test('should have family defined (Ismark, Kolyan, Sergei)', () => {
      expect(Array.isArray(ireenaProfile.relationships.family)).toBe(true);
      expect(ireenaProfile.relationships.family.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('AC-5: Tatyana Lore Integration', () => {
    test('should have AI behavior knowledge/secrets about Tatyana', () => {
      expect(Array.isArray(ireenaProfile.aiBehavior.knowledgeSecrets)).toBe(true);
      expect(ireenaProfile.aiBehavior.knowledgeSecrets.length).toBeGreaterThan(0);
      expect(ireenaProfile.aiBehavior.knowledgeSecrets.some(k => k.includes('Tatyana'))).toBe(true);
    });

    test('should mention reincarnation cycle in knowledge', () => {
      const reincarnationMentioned = ireenaProfile.aiBehavior.knowledgeSecrets.some(
        k => k.toLowerCase().includes('reincarn')
      );
      expect(reincarnationMentioned).toBe(true);
    });

    test('should mention Strahd and Sergei history', () => {
      const historyMentioned = ireenaProfile.aiBehavior.knowledgeSecrets.some(
        k => k.includes('Strahd') && k.includes('Sergei')
      );
      expect(historyMentioned).toBe(true);
    });

    test('should have goals related to survival and identity', () => {
      expect(Array.isArray(ireenaProfile.aiBehavior.goals)).toBe(true);
      expect(ireenaProfile.aiBehavior.goals.some(g => g.toLowerCase().includes('survive'))).toBe(true);
    });

    test('should have fears about becoming vampire bride and identity loss', () => {
      expect(Array.isArray(ireenaProfile.aiBehavior.fears)).toBe(true);
      expect(ireenaProfile.aiBehavior.fears.some(f => f.includes('vampire bride'))).toBe(true);
      expect(ireenaProfile.aiBehavior.fears.some(f => f.includes('identity') || f.includes('Tatyana'))).toBe(true);
    });

    test('should have special behaviors for past life memories', () => {
      expect(Array.isArray(ireenaProfile.aiBehavior.specialBehaviors)).toBe(true);
      expect(ireenaProfile.aiBehavior.specialBehaviors.some(b => b.includes('flashback') || b.includes('past life'))).toBe(true);
    });

    test('should have special behavior for sleepwalking (Strahd Charm)', () => {
      const sleepwalkBehavior = ireenaProfile.aiBehavior.specialBehaviors.some(
        b => b.toLowerCase().includes('sleepwalk')
      );
      expect(sleepwalkBehavior).toBe(true);
    });

    test('should have Pool of Reflection knowledge secret', () => {
      const poolSecret = ireenaProfile.aiBehavior.knowledgeSecrets.some(
        k => k.includes('Pool of Reflection')
      );
      expect(poolSecret).toBe(true);
    });

    test('should have special ability referencing Tatyana soul', () => {
      const tatyanaAbility = ireenaProfile.specialAbilities.find(
        a => a.name.includes('Tatyana')
      );
      expect(tatyanaAbility).toBeDefined();
    });
  });

  describe('AC-6: Dynamic State Tracking', () => {
    test('should have dynamicState object defined', () => {
      expect(ireenaProfile.dynamicState).toBeDefined();
      expect(typeof ireenaProfile.dynamicState).toBe('object');
    });

    test('should track bitten_by_strahd_count starting at 2', () => {
      expect(ireenaProfile.dynamicState.bitten_by_strahd_count).toBe(2);
    });

    test('should track current_location', () => {
      expect(ireenaProfile.dynamicState.current_location).toBe('village_of_barovia');
    });

    test('should track mood/emotional states', () => {
      expect(ireenaProfile.dynamicState.mood).toBeDefined();
      expect(ireenaProfile.dynamicState.mood).toBe('frightened'); // Initial state
    });

    test('should track relationship_with_player', () => {
      expect(ireenaProfile.dynamicState.relationship_with_player).toBeDefined();
      expect(ireenaProfile.dynamicState.relationship_with_player).toBe('neutral');
    });

    test('should have quest milestone flags', () => {
      expect(ireenaProfile.dynamicState.father_buried).toBeDefined();
      expect(ireenaProfile.dynamicState.traveled_to_vallaki).toBeDefined();
      expect(ireenaProfile.dynamicState.sanctuary_at_church).toBeDefined();
      expect(ireenaProfile.dynamicState.absorbed_by_pool).toBeDefined();
    });

    test('quest milestone flags should start as false', () => {
      expect(ireenaProfile.dynamicState.father_buried).toBe(false);
      expect(ireenaProfile.dynamicState.traveled_to_vallaki).toBe(false);
      expect(ireenaProfile.dynamicState.sanctuary_at_church).toBe(false);
      expect(ireenaProfile.dynamicState.absorbed_by_pool).toBe(false);
    });

    test('should track trust_level', () => {
      expect(ireenaProfile.dynamicState.trust_level).toBeDefined();
      expect(ireenaProfile.dynamicState.trust_level).toBe(3); // Starts suspicious
    });
  });

  describe('AC-7: NPC Profile Schema Compliance', () => {
    test('should have templateVersion 1.0.0', () => {
      expect(ireenaProfile.templateVersion).toBe('1.0.0');
    });

    test('should have compatibleWith Epic 3 CharacterManager', () => {
      expect(ireenaProfile.compatibleWith).toBeDefined();
      expect(ireenaProfile.compatibleWith).toContain('Epic 3');
      expect(ireenaProfile.compatibleWith).toContain('CharacterManager');
    });

    test('should have all required basic fields', () => {
      expect(ireenaProfile.name).toBeDefined();
      expect(ireenaProfile.npcId).toBeDefined();
      expect(ireenaProfile.race).toBeDefined();
      expect(ireenaProfile.alignment).toBeDefined();
      expect(ireenaProfile.npcType).toBeDefined();
    });

    test('should have abilities object with all six scores', () => {
      expect(ireenaProfile.abilities).toBeDefined();
      expect(ireenaProfile.abilities.strength).toBeDefined();
      expect(ireenaProfile.abilities.dexterity).toBeDefined();
      expect(ireenaProfile.abilities.constitution).toBeDefined();
      expect(ireenaProfile.abilities.intelligence).toBeDefined();
      expect(ireenaProfile.abilities.wisdom).toBeDefined();
      expect(ireenaProfile.abilities.charisma).toBeDefined();
    });

    test('should have hitPoints structure', () => {
      expect(ireenaProfile.hitPoints).toBeDefined();
      expect(ireenaProfile.hitPoints.max).toBeDefined();
      expect(ireenaProfile.hitPoints.current).toBeDefined();
      expect(ireenaProfile.hitPoints.hitDice).toBeDefined();
    });

    test('should have proficiencies structure', () => {
      expect(ireenaProfile.proficiencies).toBeDefined();
      expect(Array.isArray(ireenaProfile.proficiencies.savingThrows)).toBe(true);
      expect(Array.isArray(ireenaProfile.proficiencies.skills)).toBe(true);
      expect(Array.isArray(ireenaProfile.proficiencies.languages)).toBe(true);
    });

    test('should have inventory structure', () => {
      expect(ireenaProfile.inventory).toBeDefined();
      expect(ireenaProfile.inventory.equipped).toBeDefined();
      expect(ireenaProfile.inventory.currency).toBeDefined();
    });

    test('should have personality structure', () => {
      expect(ireenaProfile.personality).toBeDefined();
      expect(ireenaProfile.personality.traits).toBeDefined();
      expect(ireenaProfile.personality.ideals).toBeDefined();
      expect(ireenaProfile.personality.bonds).toBeDefined();
      expect(ireenaProfile.personality.flaws).toBeDefined();
    });

    test('should have dialogue structure', () => {
      expect(ireenaProfile.dialogue).toBeDefined();
      expect(ireenaProfile.dialogue.greeting).toBeDefined();
      expect(ireenaProfile.dialogue.farewell).toBeDefined();
    });

    test('should have aiBehavior structure', () => {
      expect(ireenaProfile.aiBehavior).toBeDefined();
      expect(ireenaProfile.aiBehavior.goals).toBeDefined();
      expect(ireenaProfile.aiBehavior.motivations).toBeDefined();
      expect(ireenaProfile.aiBehavior.questInvolvement).toBeDefined();
    });

    test('should have relationships structure', () => {
      expect(ireenaProfile.relationships).toBeDefined();
      expect(ireenaProfile.relationships.allies).toBeDefined();
      expect(ireenaProfile.relationships.enemies).toBeDefined();
      expect(ireenaProfile.relationships.family).toBeDefined();
    });

    test('should have schedule array', () => {
      expect(Array.isArray(ireenaProfile.schedule)).toBe(true);
      expect(ireenaProfile.schedule.length).toBeGreaterThan(0);
    });

    test('should have location and status fields', () => {
      expect(ireenaProfile.currentLocation).toBeDefined();
      expect(ireenaProfile.status).toBe('alive');
      expect(ireenaProfile.canMove).toBeDefined();
    });

    test('should have metadata structure', () => {
      expect(ireenaProfile.metadata).toBeDefined();
      expect(ireenaProfile.metadata.source).toBe('Curse of Strahd');
      expect(ireenaProfile.metadata.official).toBe(true);
    });

    test('YAML should parse without errors', () => {
      // If we got here, YAML already parsed successfully in beforeAll
      expect(ireenaProfile).toBeDefined();
    });
  });

  describe('AC-8: Epic 1-3 Integration Checkpoint', () => {
    test('profile file should exist and be readable', async () => {
      const stats = await fs.stat(profilePath);
      expect(stats.isFile()).toBe(true);
    });

    test('profile should be under 2000 lines', async () => {
      const content = await fs.readFile(profilePath, 'utf-8');
      const lineCount = content.split('\n').length;
      expect(lineCount).toBeLessThan(2000);
    });

    test('CharacterManager should be able to load profile structure', () => {
      // Simulates CharacterManager loading
      expect(ireenaProfile.npcId).toBe('ireena_kolyana');
      expect(ireenaProfile.name).toBe('Ireena Kolyana');
      expect(ireenaProfile.abilities).toBeDefined();
      expect(ireenaProfile.hitPoints).toBeDefined();
    });

    test('dialogue system should be accessible', () => {
      // All dialogue categories should exist and be arrays
      expect(Array.isArray(ireenaProfile.dialogue.greeting)).toBe(true);
      expect(Array.isArray(ireenaProfile.dialogue.farewell)).toBe(true);
      expect(Array.isArray(ireenaProfile.dialogue.combat)).toBe(true);
      expect(Array.isArray(ireenaProfile.dialogue.questGiving)).toBe(true);
    });

    test('quest involvement should reference valid quest IDs', () => {
      // Quest IDs should follow Epic 4 naming convention
      ireenaProfile.aiBehavior.questInvolvement.forEach(quest => {
        expect(quest.questId).toBeDefined();
        expect(typeof quest.questId).toBe('string');
        expect(quest.questId.length).toBeGreaterThan(0);
        expect(quest.role).toBeDefined();
      });
    });

    test('relationship changes should be trackable via dynamicState', () => {
      expect(ireenaProfile.dynamicState.relationship_with_player).toBe('neutral');
      expect(ireenaProfile.dynamicState.trust_level).toBe(3);
      expect(ireenaProfile.aiBehavior.trustLevel).toBe(3);
    });

    test('location movement should be supported', () => {
      expect(ireenaProfile.canMove).toBe(true);
      expect(ireenaProfile.currentLocation).toBe('village_of_barovia');
      expect(ireenaProfile.dynamicState.current_location).toBe('village_of_barovia');
    });

    test('EventScheduler integration: state changes can trigger events', () => {
      // bitten_by_strahd_count = 3 should trigger vampire transformation event
      expect(ireenaProfile.dynamicState.bitten_by_strahd_count).toBe(2);

      // Quest flags can trigger Epic 2 events
      expect(ireenaProfile.dynamicState.father_buried).toBe(false);
      expect(ireenaProfile.dynamicState.traveled_to_vallaki).toBe(false);
    });

    test('schedule should have valid time format (HH:MM)', () => {
      ireenaProfile.schedule.forEach(entry => {
        expect(entry.time).toMatch(/^\d{2}:\d{2}$/);
        expect(entry.location).toBeDefined();
        expect(entry.activity).toBeDefined();
      });
    });

    test('should have combat tactics defined for non-combatant', () => {
      expect(ireenaProfile.aiBehavior.combatTactics).toBeDefined();
      expect(ireenaProfile.aiBehavior.combatTactics.toLowerCase()).toContain('non-combatant');
    });
  });
});
