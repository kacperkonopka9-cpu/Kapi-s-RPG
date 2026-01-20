# Amber Temple - Items

## Quest Items

### Scroll of Tarrasque Summoning
```yaml
itemId: tarrasque_scroll
name: "Scroll of Tarrasque Summoning"
category: artifact
location: vilnius_chamber
value: priceless
hidden: false
requires_combat: true
danger: extreme

description: "A scroll containing a ritual to summon the Tarrasque, a world-ending monstrosity. So dangerous even the vestiges fear it."
```

**Properties**:
- Can summon the Tarrasque (CR 30) to any location in Barovia
- Single-use artifact
- Reading the scroll requires DC 20 Intelligence (Arcana) check to avoid catastrophic misfire
- Guarded by Vilnius (CR 15 mummy lord)

**Use Cases**:
- Ultimate weapon against Strahd (if party is desperate/insane)
- Potential campaign-ending disaster if used carelessly
- Valuable bargaining chip (Strahd would pay dearly to prevent its use)
- Can be destroyed to prevent misuse

**DM Warning**: This item can derail the campaign. Consider whether to include it.

---

### Ritual of Dark Gift Reversal
```yaml
itemId: gift_reversal_ritual
name: "Ritual to Reverse Dark Gifts"
category: arcane_knowledge
location: exethanter_hidden_laboratory
value: priceless_to_corrupted
hidden: true
dc_to_find: 20

description: "Research notes detailing a painful ritual that can reverse accepted dark gifts, restoring the corrupted to their original state."
```

**Properties**:
- Found in Exethanter's secret laboratory beneath the library
- Requires DC 20 Intelligence (Investigation) to discover hidden laboratory entrance
- Ritual requires: 1,000 gp in diamond dust, 8 hours, DC 18 Constitution save (take 10d6 necrotic damage on failure, half on success)
- Success removes dark gift and associated corruption
- Failure means permanent hit point maximum reduction by half the damage taken

**Strategic Value**:
- Offers redemption path for characters who accepted dark gifts
- Creates interesting choice: Keep power despite corruption, or purge it at great cost?
- Exethanter can assist with ritual if his memories are restored (grants advantage on saves)

---

### Tarokka Artifact (Variable)
```yaml
itemId: tarokka_artifact_amber
name: "Tarokka-Indicated Artifact"
category: legendary_item
location: variable
value: priceless
hidden: variable

description: "One of the three artifacts needed to defeat Strahd may be hidden in the Amber Temple, depending on Madam Eva's Tarokka reading."
```

**Possible Locations**:
- **The Vault**: Among the arcanaloth's treasures
- **Vilnius's Chamber**: Hidden in sarcophagus with the mummy lord
- **Exethanter's Study**: Forgotten among his belongings
- **Lost Wing**: In the sealed eastern section

**Potential Artifacts**:
- *Holy Symbol of Ravenkind*
- *Sunsword*
- *Tome of Strahd*

**Retrieval Challenges**: Varies based on location. Vault requires negotiating with arcanaloth. Vilnius's chamber requires defeating CR 15 mummy lord.

---

## Major Treasure

### The Vault Hoard
```yaml
itemId: vault_treasure
name: "The Amber Temple Treasury"
category: treasure_hoard
location: vault
value: 50,000+ gp
hidden: false
requires: arcanaloth_permission_or_combat

description: "Millennia of accumulated wealth from failed expeditions, tribute to the vestiges, and confiscated dangerous items."
```

**Contents**:
- **Currency**: 15,000 gp, 35,000 sp, 50,000 cp (mixed denominations from various eras)
- **Gems**: 30 gems worth 500 gp each (emeralds, rubies, sapphires, diamonds)
- **Art Objects**: 8 art objects worth 2,500 gp each (ancient statuary, magical paintings, jeweled relics)
- **Magic Items** (DM rolls 1d4+1):
  1. *Staff of Frost*
  2. *Rod of Absorption*
  3. *Ring of Spell Storing*
  4. *Cube of Force*
  5. *Ioun Stone (Intellect)*
  6. *Manual of Golems*

**Access Methods**:
- **Negotiation**: Arcanaloth trades access for service (accept dark gift, retrieve item, deliver message to Strahd)
- **Combat**: Defeat the arcanaloth (CR 12)
- **Stealth**: DC 22 Sleight of Hand while arcanaloth is distracted/invisible
- **Magic**: Bypass vault door (DC 20 Arcana check to dispel wards, or Knock spell triggers alarm)

**Consequences of Theft**:
- Arcanaloth hunts the party relentlessly
- Vestiges withdraw cooperation/gifts
- Temple guardians (flameskulls) become universally hostile

---

### Exethanter's Personal Effects
```yaml
itemId: exethanter_items
name: "The Lich's Possessions"
category: wizard_equipment
location: library
value: 5,000 gp
hidden: false
requires: exethanter_permission

description: "Exethanter's belongings from millennia of existence: spell books, research notes, magical items, and his phylactery (if found)."
```

**Contents**:
- **Spellbook**: Contains all wizard spells up to 9th level (worth 10,000 gp to wizards)
- **Research Notes**: Provide advantage on Arcana checks related to vestiges, liches, or planar entities
- **Personal Items**: *Robe of the Archmagi*, *Staff of Power*, *Ring of Mind Shielding*
- **Phylactery** (hidden, DC 25 Investigation): Exethanter's phylactery is a crystal hourglass hidden in the Lost Wing. Destroying it ends his undeath (either killing him permanently or freeing him to pass on).

**Acquisition**:
- Exethanter doesn't remember he owns most of these
- If asked politely, he'll share the spellbook and notes ("Oh, those old things? Take them, I suppose.")
- Taking items without asking risks triggering his protective instincts (combat)

---

## Dark Gift Manifestations

### Physical Corruption Tokens
```yaml
itemId: corruption_tokens
name: "Evidence of Dark Gifts"
category: body_horror
location: various_corpses
value: 0
hidden: false

description: "Frozen corpses throughout the temple display the physical costs of dark gifts: extra eyes, twisted limbs, mouths where mouths shouldn't be."
```

**Purpose**:
- Visual warning about dark gift consequences
- Some corpses have useful gear (frozen to their bodies)
- DC 13 Survival check to thaw corpses safely and recover equipment

**Typical Loot from Corrupted Corpses**:
- Rusted weapons and armor (50% damaged, 1d6 × 10 gp scrap value)
- Personal effects (journals warning against dark gifts, letters to loved ones)
- Occasional magic item (10% chance per corpse, DM discretion)

---

## Consumables and Resources

### Amber Shards
```yaml
itemId: amber_shards
name: "Amber Temple Shards"
category: arcane_material
location: scattered_throughout
value: 50 gp each
quantity: 3d6

description: "Fragments of amber from the sarcophagi, radiating vestige corruption. Valuable as spell components or to collectors of dark artifacts."
```

**Uses**:
- Spell component for necromancy/conjuration spells
- Can be sold to wizards or the arcanaloth (50 gp each)
- Crafting material for cursed items (DM discretion)
- Prolonged contact (1 hour) requires DC 12 Wisdom save or hear vestige whispers

---

### Ancient Tomes (Library)
```yaml
itemId: library_books
name: "Amber Temple Library Collection"
category: knowledge
location: library
value: varies
quantity: hundreds

description: "Ice-preserved books containing arcane knowledge, history, and forbidden lore. Most are ruined, but some remain readable."
```

**Valuable Books** (DC 15 Investigation to find):
- **Tome of Vestige Lore**: Provides complete information on all 12 vestiges and their gifts (+5 bonus to resist dark gift temptation)
- **History of the Amber Temple**: Details the temple's construction and purpose
- **Draconic Arcana**: Spellbook containing draconic magic (3d4 spells, levels 1-5)
- **Libris Mortis**: Necromancy reference (advantage on checks to identify undead or create undead)

**Total Library Value**: If entire collection salvaged and sold (requires weeks and a cart): 2,000-5,000 gp to the right buyer.

---

## Magic Items (Random Encounters)

### Frozen Adventurer Gear
```yaml
itemId: adventurer_loot
name: "Previous Seekers' Equipment"
category: random_treasure
location: various_frozen_corpses
value: varies
quantity: 1d6 corpses

description: "Adventurers who died exploring the temple, their gear frozen to their bodies. Thawing carefully may yield useful equipment."
```

**Typical Loot Per Corpse**:
- Weapons: Longsword, shield, crossbow (50% chance damaged beyond repair)
- Armor: Chain mail, studded leather (requires thawing)
- Consumables: Potions (50% frozen and shattered), scrolls (30% readable)
- Currency: 2d10 × 10 gp
- Occasional magic item (10% chance): *Potion of Healing*, *+1 weapon*, *Bag of Holding*, etc.

**Thawing Procedure**:
- DC 13 Survival check to thaw without damaging equipment
- Failure means items take 2d6 cold damage (may shatter potions, damage armor)

---

## Legendary Items (End-Game Rewards)

### Forbidden Tomes (Vestige Chambers)
```yaml
itemId: forbidden_grimoires
name: "Forbidden Grimoires of the Vestiges"
category: cursed_knowledge
location: various_vestige_chambers
value: 10,000 gp (to mad wizards)
danger: high

description: "Spell books containing spells taught by vestiges—immensely powerful but carrying corruption risk."
```

**Contents** (per grimoire):
- 1d6 spells of levels 6-9 not found in standard spellbooks
- Each spell carries corruption: Casting requires Wisdom save DC = 10 + spell level or gain 1 corruption point
- 3+ corruption points: Physical mutations begin
- 6+ corruption points: Alignment shifts toward vestige's nature
- 10+ corruption points: Vestige claims your soul

**Example Spells**:
- *Vampyr's Touch*: 9th level, drain life from all creatures in 60-foot radius
- *Seriach's Hellfire*: 7th level, summon hell hound pack
- *Yrrga's Shadow Walk*: 6th level, teleport through shadows

---

## Environmental Resources

### Magical Ice
```yaml
itemId: magical_ice
name: "Amber Temple Ice"
category: alchemical_reagent
location: everywhere
value: 1 gp per pound
quantity: unlimited

description: "Ice infused with vestige magic. Never melts naturally. Useful for alchemy and magic item crafting."
```

**Uses**:
- Alchemy: Component for cold-based potions
- Preservation: Food/bodies stored in this ice never decay
- Crafting: Magic items with cold properties
- Cooling: Magical overheating issues

---

## Notes for DM

**Treasure Scaling**: The Amber Temple offers massive rewards (50,000+ gp in vault alone) balanced by massive challenges (CR 12-15 encounters, environmental hazards, moral corruption).

**Dark Gifts as "Treasure"**: The vestiges' gifts are mechanically equivalent to very rare magic items, but with steep narrative costs. Track player choices carefully.

**Tarokka Integration**: One artifact should be here if Madam Eva's reading indicates it. Place it in a location that creates interesting challenges (vault requires negotiation, Vilnius requires combat, etc.).

**Redemption Items**: The ritual to reverse dark gifts exists so accepting corruption isn't permanent character destruction. Make sure players know this ritual exists (via Exethanter or library research).

**World-Ending Artifact**: The Tarrasque scroll is deliberately overpowered. It's meant as a "break glass in case of emergency" option if the party is hopelessly outmatched by Strahd—but using it creates new problems.
