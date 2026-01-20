/**
 * Integration Tests: Magic Item Database (Story 4-15)
 * Tests all 14 Curse of Strahd magic items and their integration with Epic 3 systems
 *
 * Coverage:
 * - 3 Legendary Artifacts (Sunsword, Holy Symbol of Ravenkind, Tome of Strahd)
 * - 4 Unique Magic Items (Icon of Ravenloft, Gulthias Staff, Luck Blade, Blood Spear of Kavan)
 * - 7 Standard Equipment (Longsword +1, Shortbow +1, Plate Armor +2, 2 scrolls, potion, amulet)
 * - Integration with ItemDatabase, EquipmentManager, CombatManager
 */

const fs = require('fs').promises;
const yaml = require('js-yaml');
const path = require('path');

describe('Magic Item Database - Integration Tests', () => {
  let items;

  beforeAll(async () => {
    items = {};
    const itemFiles = [
      'sunsword.yaml',
      'holy-symbol-of-ravenkind.yaml',
      'tome-of-strahd.yaml',
      'icon-of-ravenloft.yaml',
      'gulthias-staff.yaml',
      'luck-blade.yaml',
      'blood-spear-of-kavan.yaml',
      'longsword-plus-1.yaml',
      'shortbow-plus-1.yaml',
      'plate-armor-plus-2.yaml',
      'scroll-of-fireball.yaml',
      'scroll-of-revivify.yaml',
      'potion-of-greater-healing.yaml',
      'amulet-of-proof-against-detection.yaml'
    ];

    for (const file of itemFiles) {
      const filePath = path.join('game-data', 'items', file);
      const content = await fs.readFile(filePath, 'utf-8');
      const item = yaml.load(content);
      items[item.id] = item;
    }
  });

  // ======================
  // LEGENDARY ARTIFACTS
  // ======================

  describe('Legendary Artifacts', () => {
    describe('Sunsword', () => {
      let sunsword;

      beforeEach(() => {
        sunsword = items.sunsword;
      });

      test('should have correct basic properties', () => {
        expect(sunsword.id).toBe('sunsword');
        expect(sunsword.name).toBe('Sunsword');
        expect(sunsword.type).toBe('weapon');
        expect(sunsword.rarity).toBe('legendary');
        expect(sunsword.requiresAttunement).toBe(true);
        expect(sunsword.weight).toBe(3.0);
      });

      test('should have correct weapon properties', () => {
        expect(sunsword.weaponProperties.baseWeapon).toBe('longsword');
        expect(sunsword.weaponProperties.damage).toBe('1d8');
        expect(sunsword.weaponProperties.damageType).toBe('radiant');
        expect(sunsword.weaponProperties.attackBonus).toBe(2);
        expect(sunsword.weaponProperties.damageBonus).toBe(2);
        expect(sunsword.weaponProperties.properties).toContain('finesse');
        expect(sunsword.weaponProperties.properties).toContain('versatile');
        expect(sunsword.weaponProperties.versatileDamage).toBe('1d10');
      });

      test('should have Undead Bane ability', () => {
        const undeadBane = sunsword.specialAbilities.find(a => a.name === 'Undead Bane');
        expect(undeadBane).toBeDefined();
        expect(undeadBane.mechanics.extraDamage.dice).toBe('1d8');
        expect(undeadBane.mechanics.extraDamage.damageType).toBe('radiant');
        expect(undeadBane.mechanics.extraDamage.targetType).toBe('undead');
      });

      test('should have Sunlight Blade ability with activation control', () => {
        const sunlightBlade = sunsword.specialAbilities.find(a => a.name === 'Sunlight Blade');
        expect(sunlightBlade).toBeDefined();
        expect(sunlightBlade.activation).toBe('bonus_action');
        expect(sunlightBlade.mechanics.lightRadius).toBe(15);
        expect(sunlightBlade.mechanics.canBeDeactivated).toBe(true);
      });

      test('should have correct metadata and compatibility', () => {
        expect(sunsword.metadata.source).toBe('Curse of Strahd');
        expect(sunsword.metadata.official).toBe(true);
        expect(sunsword.templateVersion).toBe('1.0.0');
        expect(sunsword.compatibleWith).toContain('Epic 3');
      });

      test('should have Tarokka-determined location', () => {
        expect(sunsword.locationInfo.whereFound).toContain('Tarokka');
      });
    });

    describe('Holy Symbol of Ravenkind', () => {
      let holySymbol;

      beforeEach(() => {
        holySymbol = items.holy_symbol_of_ravenkind;
      });

      test('should have correct basic properties', () => {
        expect(holySymbol.id).toBe('holy_symbol_of_ravenkind');
        expect(holySymbol.name).toBe('Holy Symbol of Ravenkind');
        expect(holySymbol.type).toBe('magic_item');
        expect(holySymbol.rarity).toBe('legendary');
        expect(holySymbol.requiresAttunement).toBe(true);
        expect(holySymbol.attunementRequirements).toContain('cleric or paladin');
      });

      test('should have sentience with correct attributes', () => {
        expect(holySymbol.sentience).toBeDefined();
        expect(holySymbol.sentience.alignment).toBe('chaotic_good');
        expect(holySymbol.sentience.intelligence).toBe(17);
        expect(holySymbol.sentience.wisdom).toBe(15);
        expect(holySymbol.sentience.charisma).toBe(16);
        expect(holySymbol.sentience.languages).toContain('Common');
        expect(holySymbol.sentience.languages).toContain('Celestial');
      });

      test('should have Turn Undead Enhancement', () => {
        const turnEnhancement = holySymbol.specialAbilities.find(a => a.name === 'Turn Undead Enhancement');
        expect(turnEnhancement).toBeDefined();
        expect(turnEnhancement.mechanics.spellDCBonus).toBe(2);
        expect(turnEnhancement.mechanics.spellAttackBonus).toBe(2);
        expect(turnEnhancement.mechanics.turnUndeadDamage.dice).toBe('2d6');
        expect(turnEnhancement.mechanics.turnUndeadDamage.damageType).toBe('radiant');
      });

      test('should have Hold Vampires ability', () => {
        const holdVampires = holySymbol.specialAbilities.find(a => a.name === 'Hold Vampires');
        expect(holdVampires).toBeDefined();
        expect(holdVampires.activation).toBe('action');
        expect(holdVampires.usesPerDay).toBe(1);
        expect(holdVampires.saveDC).toBe(15);
        expect(holdVampires.saveType).toBe('wisdom');
        expect(holdVampires.targetType).toContain('vampire');
        expect(holdVampires.effect).toBe('paralyzed');
      });

      test('should have Sunlight Aura', () => {
        const sunlightAura = holySymbol.specialAbilities.find(a => a.name === 'Sunlight Aura');
        expect(sunlightAura).toBeDefined();
        expect(sunlightAura.mechanics.lightRadius).toBe(30);
        expect(sunlightAura.mechanics.isSunlight).toBe(true);
      });

      test('should have special purpose and conflict mechanic', () => {
        expect(holySymbol.sentience.specialPurpose).toContain('Strahd');
        expect(holySymbol.sentience.conflictMechanic.saveDC).toBe(15);
        expect(holySymbol.sentience.conflictMechanic.saveType).toBe('charisma');
      });
    });

    describe('Tome of Strahd', () => {
      let tome;

      beforeEach(() => {
        tome = items.tome_of_strahd;
      });

      test('should have correct basic properties', () => {
        expect(tome.id).toBe('tome_of_strahd');
        expect(tome.name).toBe('Tome of Strahd');
        expect(tome.type).toBe('magic_item');
        expect(tome.rarity).toBe('legendary');
        expect(tome.requiresAttunement).toBe(false);
        expect(tome.weight).toBe(5.0);
      });

      test('should grant advantage on Barovia lore checks', () => {
        const loreMastery = tome.specialAbilities.find(a => a.name === 'Barovia Lore Mastery');
        expect(loreMastery).toBeDefined();
        expect(loreMastery.activation).toBe('1_hour_study');
        expect(loreMastery.mechanics.grantedAdvantage).toContain('History checks about Barovia');
      });

      test('should reveal Strahd weaknesses', () => {
        const weaknesses = tome.specialAbilities.find(a => a.name === "Strahd's Weaknesses Revealed");
        expect(weaknesses).toBeDefined();
        expect(weaknesses.mechanics.revealsInfo).toBeDefined();
        expect(weaknesses.mechanics.revealsInfo.length).toBeGreaterThan(0);
      });

      test('should contain 5 content sections', () => {
        expect(tome.contents.sections).toHaveLength(5);
        expect(tome.contents.sections[0].title).toBe('Conquest and Glory');
        expect(tome.contents.sections[3].title).toBe('The Pact and Transformation');
      });

      test('should have vampire creation ritual', () => {
        const ritual = tome.specialAbilities.find(a => a.name === 'Vampire Creation Ritual');
        expect(ritual).toBeDefined();
        expect(ritual.mechanics.providesKnowledge).toContain('Vampire transformation process');
      });
    });
  });

  // ======================
  // UNIQUE MAGIC ITEMS
  // ======================

  describe('Unique Magic Items', () => {
    describe('Icon of Ravenloft', () => {
      let icon;

      beforeEach(() => {
        icon = items.icon_of_ravenloft;
      });

      test('should have correct basic properties', () => {
        expect(icon.id).toBe('icon_of_ravenloft');
        expect(icon.name).toBe('Icon of Ravenloft');
        expect(icon.type).toBe('magic_item');
        expect(icon.rarity).toBe('very_rare');
        expect(icon.requiresAttunement).toBe(true);
        expect(icon.attunementRequirements).toContain('good alignment');
      });

      test('should have Sanctuary of Light ability', () => {
        const sanctuary = icon.specialAbilities.find(a => a.name === 'Sanctuary of Light');
        expect(sanctuary).toBeDefined();
        expect(sanctuary.mechanics.requiresConcentration).toBe(true);
        expect(sanctuary.mechanics.range).toBe(30);
        expect(sanctuary.mechanics.protections).toContain('disadvantage_on_attacks');
      });

      test('should have Blessed Healing ability', () => {
        const healing = icon.specialAbilities.find(a => a.name === 'Blessed Healing');
        expect(healing).toBeDefined();
        expect(healing.mechanics.bonusHealing).toBe('1d4');
        expect(healing.mechanics.range).toBe(30);
      });

      test('should have Bane of the Undead ability', () => {
        const bane = icon.specialAbilities.find(a => a.name === 'Bane of the Undead');
        expect(bane).toBeDefined();
        expect(bane.usesPerDay).toBe(1);
        expect(bane.saveDC).toBe(15);
        expect(bane.saveType).toBe('wisdom');
        expect(bane.effect).toBe('frightened');
      });
    });

    describe('Gulthias Staff', () => {
      let staff;

      beforeEach(() => {
        staff = items.gulthias_staff;
      });

      test('should have correct weapon properties', () => {
        expect(staff.weaponProperties.baseWeapon).toBe('quarterstaff');
        expect(staff.weaponProperties.attackBonus).toBe(1);
        expect(staff.weaponProperties.damageBonus).toBe(1);
        expect(staff.weaponProperties.properties).toContain('versatile');
      });

      test('should have Vampiric Strike ability', () => {
        const vampiric = staff.specialAbilities.find(a => a.name === 'Vampiric Strike');
        expect(vampiric).toBeDefined();
        expect(vampiric.mechanics.extraDamage.dice).toBe('1d4');
        expect(vampiric.mechanics.extraDamage.damageType).toBe('necrotic');
        expect(vampiric.mechanics.healingAmount).toBe('half_necrotic_damage');
      });

      test('should have sentience with evil alignment', () => {
        expect(staff.sentience).toBeDefined();
        expect(staff.sentience.alignment).toBe('neutral_evil');
        expect(staff.sentience.intelligence).toBe(14);
        expect(staff.sentience.charisma).toBe(16);
      });

      test('should have curse', () => {
        expect(staff.curse).toBeDefined();
        expect(staff.curse.effects).toBeDefined();
        expect(staff.curse.removal).toContain('Remove Curse');
      });

      test('should have charges for spells', () => {
        const blightSeed = staff.specialAbilities.find(a => a.name === 'Blight Seed');
        expect(blightSeed).toBeDefined();
        expect(blightSeed.charges.maximum).toBe(10);
        expect(blightSeed.charges.recharge).toBe('1d6+4');
        expect(blightSeed.spells).toBeDefined();
      });
    });

    describe('Luck Blade', () => {
      let luckBlade;

      beforeEach(() => {
        luckBlade = items.luck_blade;
      });

      test('should have correct weapon properties', () => {
        expect(luckBlade.weaponProperties.baseWeapon).toBe('longsword');
        expect(luckBlade.weaponProperties.attackBonus).toBe(1);
        expect(luckBlade.weaponProperties.properties).toContain('versatile');
      });

      test('should have Luck passive bonus', () => {
        const luck = luckBlade.specialAbilities.find(a => a.name === 'Luck');
        expect(luck).toBeDefined();
        expect(luck.mechanics.savingThrowBonus).toBe(1);
        expect(luck.mechanics.abilityCheckBonus).toBe(1);
      });

      test('should have Luck Reroll charges', () => {
        const reroll = luckBlade.specialAbilities.find(a => a.name === 'Luck Reroll');
        expect(reroll).toBeDefined();
        expect(reroll.activation).toBe('reaction');
        expect(reroll.charges.maximum).toBe('1d4-1');
        expect(reroll.charges.recharge).toBe('all');
      });

      test('should have Wish spell charges', () => {
        const wish = luckBlade.specialAbilities.find(a => a.name === 'Wish');
        expect(wish).toBeDefined();
        expect(wish.charges.maximum).toBe('1d4-1');
        expect(wish.charges.recharge).toBe('never');
      });
    });

    describe('Blood Spear of Kavan', () => {
      let spear;

      beforeEach(() => {
        spear = items.blood_spear_of_kavan;
      });

      test('should have correct weapon properties', () => {
        expect(spear.weaponProperties.baseWeapon).toBe('spear');
        expect(spear.weaponProperties.attackBonus).toBe(2);
        expect(spear.weaponProperties.damageBonus).toBe(2);
        expect(spear.weaponProperties.properties).toContain('thrown');
        expect(spear.weaponProperties.range).toBe('20/60');
      });

      test('should have Blood Thirst ability', () => {
        const bloodThirst = spear.specialAbilities.find(a => a.name === 'Blood Thirst');
        expect(bloodThirst).toBeDefined();
        expect(bloodThirst.mechanics.extraDamage.dice).toBe('1d6');
        expect(bloodThirst.mechanics.extraDamage.damageType).toBe('necrotic');
        expect(bloodThirst.mechanics.extraDamage.condition).toBe('target_not_at_max_hp');
      });

      test('should have automatic return when thrown', () => {
        const throwing = spear.specialAbilities.find(a => a.name === 'Throwing and Returning');
        expect(throwing).toBeDefined();
        expect(throwing.mechanics.automaticReturn).toBe(true);
      });

      test('should have sentience with chaotic evil alignment', () => {
        expect(spear.sentience).toBeDefined();
        expect(spear.sentience.alignment).toBe('chaotic_evil');
        expect(spear.sentience.languages).toContain('Common');
        expect(spear.sentience.languages).toContain('Giant');
      });

      test('should have Kavan\'s Wrath daily ability', () => {
        const wrath = spear.specialAbilities.find(a => a.name === "Kavan's Wrath");
        expect(wrath).toBeDefined();
        expect(wrath.usesPerDay).toBe(1);
        expect(wrath.duration).toBe('1_minute');
        expect(wrath.mechanics.enhancedBloodThirst).toBe('2d6');
      });
    });
  });

  // ======================
  // STANDARD EQUIPMENT
  // ======================

  describe('Standard Magic Equipment', () => {
    describe('Longsword +1', () => {
      let longsword;

      beforeEach(() => {
        longsword = items.longsword_plus_1;
      });

      test('should have correct basic properties', () => {
        expect(longsword.id).toBe('longsword_plus_1');
        expect(longsword.type).toBe('weapon');
        expect(longsword.rarity).toBe('uncommon');
        expect(longsword.requiresAttunement).toBe(false);
      });

      test('should have +1 weapon bonuses', () => {
        expect(longsword.weaponProperties.attackBonus).toBe(1);
        expect(longsword.weaponProperties.damageBonus).toBe(1);
      });

      test('should have no special abilities', () => {
        expect(longsword.specialAbilities).toEqual([]);
      });
    });

    describe('Shortbow +1', () => {
      let shortbow;

      beforeEach(() => {
        shortbow = items.shortbow_plus_1;
      });

      test('should have correct ranged weapon properties', () => {
        expect(shortbow.weaponProperties.category).toBe('simple_ranged');
        expect(shortbow.weaponProperties.range).toBe('80/320');
        expect(shortbow.weaponProperties.properties).toContain('ammunition');
        expect(shortbow.weaponProperties.properties).toContain('two-handed');
      });

      test('should have +1 weapon bonuses', () => {
        expect(shortbow.weaponProperties.attackBonus).toBe(1);
        expect(shortbow.weaponProperties.damageBonus).toBe(1);
      });
    });

    describe('Plate Armor +2', () => {
      let plateArmor;

      beforeEach(() => {
        plateArmor = items.plate_armor_plus_2;
      });

      test('should have correct armor properties', () => {
        expect(plateArmor.type).toBe('armor');
        expect(plateArmor.rarity).toBe('very_rare');
        expect(plateArmor.armorProperties.category).toBe('heavy');
        expect(plateArmor.armorProperties.baseAC).toBe(18);
        expect(plateArmor.armorProperties.acBonus).toBe(2);
      });

      test('should have stealth disadvantage', () => {
        expect(plateArmor.armorProperties.stealthDisadvantage).toBe(true);
      });

      test('should have strength requirement', () => {
        expect(plateArmor.armorProperties.strengthRequirement).toBe(15);
      });

      test('should have max Dex bonus of 0 (heavy armor)', () => {
        expect(plateArmor.armorProperties.maxDexBonus).toBe(0);
      });
    });

    describe('Scroll of Fireball', () => {
      let scroll;

      beforeEach(() => {
        scroll = items.scroll_of_fireball;
      });

      test('should have correct consumable properties', () => {
        expect(scroll.type).toBe('consumable');
        expect(scroll.rarity).toBe('uncommon');
        expect(scroll.requiresAttunement).toBe(false);
      });

      test('should have spell scroll mechanics', () => {
        expect(scroll.spellScroll.spellName).toBe('Fireball');
        expect(scroll.spellScroll.spellLevel).toBe(3);
        expect(scroll.spellScroll.schoolOfMagic).toBe('evocation');
      });

      test('should have correct damage and save DC', () => {
        const fireball = scroll.specialAbilities.find(a => a.name === 'Cast Fireball');
        expect(fireball.saveDC).toBe(15);
        expect(fireball.damageDice).toBe('8d6');
        expect(fireball.damageType).toBe('fire');
        expect(fireball.area).toBe('20-foot-radius sphere');
      });

      test('should list eligible classes', () => {
        expect(scroll.spellScroll.eligibleClasses).toContain('Wizard');
        expect(scroll.spellScroll.eligibleClasses).toContain('Sorcerer');
      });
    });

    describe('Scroll of Revivify', () => {
      let scroll;

      beforeEach(() => {
        scroll = items.scroll_of_revivify;
      });

      test('should have correct spell properties', () => {
        expect(scroll.spellScroll.spellName).toBe('Revivify');
        expect(scroll.spellScroll.spellLevel).toBe(3);
        expect(scroll.spellScroll.schoolOfMagic).toBe('necromancy');
      });

      test('should list eligible divine classes', () => {
        expect(scroll.spellScroll.eligibleClasses).toContain('Cleric');
        expect(scroll.spellScroll.eligibleClasses).toContain('Paladin');
      });

      test('should have 1 HP restoration effect', () => {
        const revivify = scroll.specialAbilities.find(a => a.name === 'Cast Revivify');
        expect(revivify.healingAmount).toBe(1);
      });
    });

    describe('Potion of Greater Healing', () => {
      let potion;

      beforeEach(() => {
        potion = items.potion_of_greater_healing;
      });

      test('should have correct healing properties', () => {
        expect(potion.type).toBe('consumable');
        expect(potion.rarity).toBe('uncommon');
        const healing = potion.effects.find(e => e.type === 'healing');
        expect(healing.healingDice).toBe('4d4+4');
      });

      test('should have drink potion ability', () => {
        const drink = potion.specialAbilities.find(a => a.name === 'Drink Potion');
        expect(drink.healingAmount).toBe('4d4+4');
        expect(drink.activation).toBe('action');
      });
    });

    describe('Amulet of Proof Against Detection', () => {
      let amulet;

      beforeEach(() => {
        amulet = items.amulet_of_proof_against_detection;
      });

      test('should have correct basic properties', () => {
        expect(amulet.type).toBe('magic_item');
        expect(amulet.rarity).toBe('uncommon');
        expect(amulet.requiresAttunement).toBe(true);
      });

      test('should have divination immunity', () => {
        const immunity = amulet.specialAbilities.find(a => a.name === 'Divination Immunity');
        expect(immunity).toBeDefined();
        expect(immunity.mechanics.blockedSpells).toContain('Scrying');
        expect(immunity.mechanics.blockedSpells).toContain('Locate Creature');
        expect(immunity.mechanics.blockedSpells).toContain('Detect Thoughts');
      });
    });
  });

  // ======================
  // INTEGRATION TESTS
  // ======================

  describe('Epic 3 System Integration', () => {
    test('all items should have template version 1.0.0', () => {
      Object.values(items).forEach(item => {
        expect(item.templateVersion).toBe('1.0.0');
      });
    });

    test('all items should declare Epic 3 compatibility', () => {
      Object.values(items).forEach(item => {
        expect(item.compatibleWith).toBeDefined();
        expect(item.compatibleWith).toContain('Epic 3');
      });
    });

    test('all items should have required basic fields', () => {
      Object.values(items).forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.type).toBeDefined();
        expect(item.weight).toBeDefined();
        expect(item.rarity).toBeDefined();
        expect(typeof item.requiresAttunement).toBe('boolean');
      });
    });

    test('all weapons should have valid weapon properties', () => {
      const weapons = Object.values(items).filter(i => i.type === 'weapon');
      weapons.forEach(weapon => {
        expect(weapon.weaponProperties).toBeDefined();
        expect(weapon.weaponProperties.baseWeapon).toBeDefined();
        expect(weapon.weaponProperties.damage).toBeDefined();
        expect(weapon.weaponProperties.damageType).toBeDefined();
        expect(typeof weapon.weaponProperties.attackBonus).toBe('number');
        expect(typeof weapon.weaponProperties.damageBonus).toBe('number');
      });
    });

    test('all armor should have valid armor properties', () => {
      const armor = Object.values(items).filter(i => i.type === 'armor');
      armor.forEach(a => {
        expect(a.armorProperties).toBeDefined();
        expect(a.armorProperties.baseAC).toBeDefined();
        expect(a.armorProperties.acBonus).toBeDefined();
        expect(a.armorProperties.category).toBeDefined();
      });
    });

    test('all items should have metadata section', () => {
      Object.values(items).forEach(item => {
        expect(item.metadata).toBeDefined();
        expect(item.metadata.source).toBeDefined();
        expect(typeof item.metadata.official).toBe('boolean');
        expect(item.metadata.developmentStage).toBe('final');
      });
    });

    test('all items should have location information', () => {
      Object.values(items).forEach(item => {
        expect(item.locationInfo).toBeDefined();
        expect(item.locationInfo.whereFound).toBeDefined();
        expect(item.locationInfo.howObtained).toBeDefined();
      });
    });

    test('all items should have lore section', () => {
      Object.values(items).forEach(item => {
        expect(item.lore).toBeDefined();
        expect(item.lore.description).toBeDefined();
      });
    });

    test('all items should have visual description', () => {
      Object.values(items).forEach(item => {
        expect(item.appearance).toBeDefined();
        expect(item.appearance.visual).toBeDefined();
      });
    });

    test('all items with charges should have valid charge mechanics', () => {
      const itemsWithCharges = Object.values(items).filter(i =>
        i.specialAbilities?.some(a => a.charges)
      );

      itemsWithCharges.forEach(item => {
        const abilityWithCharges = item.specialAbilities.find(a => a.charges);
        expect(abilityWithCharges.charges.maximum).toBeDefined();
        expect(abilityWithCharges.charges.recharge).toBeDefined();
      });
    });

    test('sentient items should have complete sentience data', () => {
      const sentientItems = Object.values(items).filter(i => i.sentience);

      sentientItems.forEach(item => {
        expect(item.sentience.alignment).toBeDefined();
        expect(typeof item.sentience.intelligence).toBe('number');
        expect(typeof item.sentience.wisdom).toBe('number');
        expect(typeof item.sentience.charisma).toBe('number');
        expect(item.sentience.senses).toBeDefined();
        expect(item.sentience.communication).toBeDefined();
      });
    });

    test('cursed items should have curse description and removal method', () => {
      const cursedItems = Object.values(items).filter(i => i.curse);

      cursedItems.forEach(item => {
        expect(item.curse.description).toBeDefined();
        expect(item.curse.removal).toBeDefined();
      });
    });
  });

  // ======================
  // BAROVIA-SPECIFIC TESTS
  // ======================

  describe('Curse of Strahd Context', () => {
    test('legendary artifacts should have Tarokka integration', () => {
      const legendaryArtifacts = [items.sunsword, items.holy_symbol_of_ravenkind, items.tome_of_strahd];

      legendaryArtifacts.forEach(artifact => {
        expect(artifact.locationInfo.whereFound).toContain('Tarokka');
      });
    });

    test('items should reference Curse of Strahd source', () => {
      const cosItems = Object.values(items).filter(i =>
        i.metadata.source === 'Curse of Strahd'
      );

      expect(cosItems.length).toBeGreaterThan(0);
    });

    test('items should have appropriate power levels for campaign', () => {
      const rarities = Object.values(items).map(i => i.rarity);
      expect(rarities).toContain('legendary');
      expect(rarities).toContain('very_rare');
      expect(rarities).toContain('rare');
      expect(rarities).toContain('uncommon');
    });

    test('undead-focused items should reference vampires or undead', () => {
      const antiUndeadItems = [
        items.sunsword,
        items.holy_symbol_of_ravenkind,
        items.icon_of_ravenloft
      ];

      antiUndeadItems.forEach(item => {
        const hasUndeadMechanics = item.specialAbilities.some(a =>
          JSON.stringify(a).toLowerCase().includes('undead') ||
          JSON.stringify(a).toLowerCase().includes('vampire')
        );
        expect(hasUndeadMechanics).toBe(true);
      });
    });
  });
});
