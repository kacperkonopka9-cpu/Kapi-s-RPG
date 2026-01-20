/**
 * Integration Tests: Monster Loading
 * Tests that all 27 monster YAML files load correctly
 * Story 4-14: Monster Statblocks
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

const MONSTERS_DIR = path.join(__dirname, '../../../game-data/monsters');

describe('Monster Loading Integration Tests', () => {
  const monsterFiles = [
    'zombie.yaml', 'strahd-zombie.yaml', 'skeleton.yaml',
    'vampire-spawn.yaml', 'ghoul.yaml', 'ghast.yaml', 'wight.yaml', 'wraith.yaml',
    'werewolf.yaml', 'werebaven.yaml',
    'night-hag.yaml', 'night-hag-boss.yaml', 'nightmare.yaml',
    'animated-armor.yaml', 'flesh-golem.yaml',
    'needle-blight.yaml', 'vine-blight.yaml', 'tree-blight.yaml',
    'dire-wolf.yaml', 'giant-spider.yaml', 'raven.yaml', 'swarm-of-bats.yaml', 'swarm-of-rats.yaml',
    'mongrelfolk.yaml', 'scarecrow.yaml', 'animated-hut.yaml', 'druid.yaml'
  ];

  describe('AC-1: All 27 Monster Files Exist', () => {
    test.each(monsterFiles)('%s exists in game-data/monsters/', async (filename) => {
      const filepath = path.join(MONSTERS_DIR, filename);
      await expect(fs.access(filepath)).resolves.not.toThrow();
    });
  });

  describe('AC-1: Valid YAML Structure', () => {
    test.each(monsterFiles)('%s is valid YAML', async (filename) => {
      const filepath = path.join(MONSTERS_DIR, filename);
      const content = await fs.readFile(filepath, 'utf-8');
      expect(() => yaml.load(content)).not.toThrow();
    });
  });

  describe('AC-1 & AC-2: Required Fields Present', () => {
    const requiredFields = [
      'name', 'monsterId', 'size', 'type', 'alignment',
      'challengeRating', 'experiencePoints',
      'armorClass', 'hitPoints', 'abilities', 'speed',
      'senses', 'actions', 'combatStats',  // AC-2: CombatManager integration
      'metadata', 'templateVersion'
    ];

    test.each(monsterFiles)('%s has all required fields', async (filename) => {
      const filepath = path.join(MONSTERS_DIR, filename);
      const content = await fs.readFile(filepath, 'utf-8');
      const monster = yaml.load(content);

      requiredFields.forEach(field => {
        expect(monster).toHaveProperty(field);
        expect(monster[field]).toBeDefined();
      });
    });
  });

  describe('AC-2: CombatManager Integration', () => {
    test.each(monsterFiles)('%s has valid combatStats section', async (filename) => {
      const filepath = path.join(MONSTERS_DIR, filename);
      const content = await fs.readFile(filepath, 'utf-8');
      const monster = yaml.load(content);

      expect(monster.combatStats).toBeDefined();
      expect(monster.combatStats).toHaveProperty('id');
      expect(monster.combatStats).toHaveProperty('name');
      expect(monster.combatStats).toHaveProperty('dexModifier');
      expect(typeof monster.combatStats.dexModifier).toBe('number');
      expect(monster.combatStats).toHaveProperty('type');
      expect(monster.combatStats.type).toBe('monster');
    });
  });

  describe('AC-3: Special Traits Implementation', () => {
    const traitsTests = [
      { file: 'zombie.yaml', trait: 'Undead Fortitude' },
      { file: 'strahd-zombie.yaml', trait: 'Lightning Absorption' },
      { file: 'vampire-spawn.yaml', trait: 'Regeneration' },
      { file: 'werewolf.yaml', trait: 'Pack Tactics' },
      { file: 'werebaven.yaml', trait: 'Shapechanger' },
      { file: 'wraith.yaml', trait: 'Incorporeal Movement' },
      { file: 'night-hag.yaml', trait: 'Shapechanger' },
      { file: 'flesh-golem.yaml', trait: 'Lightning Absorption' },
      { file: 'animated-armor.yaml', trait: 'False Appearance' },
      { file: 'scarecrow.yaml', trait: 'False Appearance' }
    ];

    test.each(traitsTests)('$file has $trait trait', async ({ file, trait }) => {
      const filepath = path.join(MONSTERS_DIR, file);
      const content = await fs.readFile(filepath, 'utf-8');
      const monster = yaml.load(content);

      expect(monster.traits).toBeDefined();
      expect(Array.isArray(monster.traits)).toBe(true);

      const hasTrait = monster.traits.some(t => t.name === trait);
      expect(hasTrait).toBe(true);
    });
  });

  describe('AC-4: Undead Monsters (8 types)', () => {
    const undeadMonsters = [
      'zombie', 'strahd-zombie', 'skeleton',
      'vampire-spawn', 'ghoul', 'ghast', 'wight', 'wraith'
    ];

    test.each(undeadMonsters)('%s is type=undead', async (monsterId) => {
      const filepath = path.join(MONSTERS_DIR, `${monsterId}.yaml`);
      const content = await fs.readFile(filepath, 'utf-8');
      const monster = yaml.load(content);

      expect(monster.type).toBe('undead');
    });
  });

  describe('AC-5: Lycanthrope Monsters (2 types)', () => {
    const lycanthropeTests = [
      { file: 'werewolf.yaml', id: 'werewolf', subtype: 'shapechanger' },
      { file: 'werebaven.yaml', id: 'werebaven', subtype: 'shapechanger' }
    ];

    test.each(lycanthropeTests)('$file has lycanthrope characteristics', async ({ file, id, subtype }) => {
      const filepath = path.join(MONSTERS_DIR, file);
      const content = await fs.readFile(filepath, 'utf-8');
      const monster = yaml.load(content);

      expect(monster.monsterId).toBe(id);
      expect(monster.subtype).toContain(subtype);  // "human, shapechanger" contains "shapechanger"

      // Lycanthropes have Shapechanger trait
      const hasShapechangerTrait = monster.traits.some(t => t.name === 'Shapechanger');
      expect(hasShapechangerTrait).toBe(true);
    });
  });

  describe('AC-6: Fiend Monsters (3 types)', () => {
    const fiendTests = [
      { file: 'night-hag.yaml', cr: 5 },
      { file: 'night-hag-boss.yaml', cr: 11 },
      { file: 'nightmare.yaml', cr: 3 }
    ];

    test.each(fiendTests)('$file is type=fiend with CR $cr', async ({ file, cr }) => {
      const filepath = path.join(MONSTERS_DIR, file);
      const content = await fs.readFile(filepath, 'utf-8');
      const monster = yaml.load(content);

      expect(monster.type).toBe('fiend');
      expect(monster.challengeRating).toBe(cr);
    });
  });

  describe('AC-7: Construct & Plant Monsters (5 types)', () => {
    const constructPlantTests = [
      { file: 'animated-armor.yaml', type: 'construct' },
      { file: 'flesh-golem.yaml', type: 'construct' },
      { file: 'needle-blight.yaml', type: 'plant' },
      { file: 'vine-blight.yaml', type: 'plant' },
      { file: 'tree-blight.yaml', type: 'plant' }
    ];

    test.each(constructPlantTests)('$file is type=$type', async ({ file, type }) => {
      const filepath = path.join(MONSTERS_DIR, file);
      const content = await fs.readFile(filepath, 'utf-8');
      const monster = yaml.load(content);

      expect(monster.type).toBe(type);
    });
  });

  describe('AC-8: Beast Monsters (5 types)', () => {
    const beastMonsters = [
      'dire-wolf', 'giant-spider', 'raven', 'swarm-of-bats', 'swarm-of-rats'
    ];

    test.each(beastMonsters)('%s is type=beast or swarm', async (monsterId) => {
      const filepath = path.join(MONSTERS_DIR, `${monsterId}.yaml`);
      const content = await fs.readFile(filepath, 'utf-8');
      const monster = yaml.load(content);

      expect(['beast', 'swarm']).toContain(monster.type);
    });
  });

  describe('AC-9: Special & Unique Monsters (4 types)', () => {
    test('mongrelfolk has Extraordinary Feature trait', async () => {
      const filepath = path.join(MONSTERS_DIR, 'mongrelfolk.yaml');
      const content = await fs.readFile(filepath, 'utf-8');
      const monster = yaml.load(content);

      const hasFeature = monster.traits.some(t => t.name === 'Extraordinary Feature');
      expect(hasFeature).toBe(true);
    });

    test('scarecrow has Terrifying Glare action', async () => {
      const filepath = path.join(MONSTERS_DIR, 'scarecrow.yaml');
      const content = await fs.readFile(filepath, 'utf-8');
      const monster = yaml.load(content);

      const hasAction = monster.actions.some(a => a.name === 'Terrifying Glare');
      expect(hasAction).toBe(true);
    });

    test('animated-hut is Gargantuan construct with CR 4', async () => {
      const filepath = path.join(MONSTERS_DIR, 'animated-hut.yaml');
      const content = await fs.readFile(filepath, 'utf-8');
      const monster = yaml.load(content);

      expect(monster.size).toBe('Gargantuan');
      expect(monster.type).toBe('construct');
      expect(monster.challengeRating).toBe(4);
    });

    test('druid has Spellcasting and Wild Shape traits', async () => {
      const filepath = path.join(MONSTERS_DIR, 'druid.yaml');
      const content = await fs.readFile(filepath, 'utf-8');
      const monster = yaml.load(content);

      const hasSpellcasting = monster.traits.some(t => t.name === 'Spellcasting');
      const hasWildShape = monster.traits.some(t => t.name.includes('Wild Shape'));
      expect(hasSpellcasting).toBe(true);
      expect(hasWildShape).toBe(true);
    });
  });

  describe('Template Version Compatibility', () => {
    test.each(monsterFiles)('%s has templateVersion 1.0.0', async (filename) => {
      const filepath = path.join(MONSTERS_DIR, filename);
      const content = await fs.readFile(filepath, 'utf-8');
      const monster = yaml.load(content);

      expect(monster.templateVersion).toBe('1.0.0');
    });

    test.each(monsterFiles)('%s is compatible with Epic 3 CombatManager', async (filename) => {
      const filepath = path.join(MONSTERS_DIR, filename);
      const content = await fs.readFile(filepath, 'utf-8');
      const monster = yaml.load(content);

      expect(monster.compatibleWith).toContain('Epic 3 CombatManager');
    });
  });
});
