# Yester Hill - Items

## Quest Items

### Winery Magic Gem (Red Dragon Crush)
```yaml
itemId: winery_gem_red_dragon
name: "Magic Gem of Red Dragon Crush"
category: quest_item
location: gulthias_tree_roots
value: priceless_to_martikovs
hidden: false
requires: digging_or_tree_destruction

description: "One of three magic gems that power the Wizard of Wines winery. This gem produces Red Dragon Crush wine, stolen by druids and embedded in the Gulthias Tree's roots."
```

**Properties**:
- Radiates transmutation magic
- Embedded 10 feet deep in tree roots
- Retrieval requires DC 15 Strength check (10 minutes digging) or destroying the tree
- Returning to Davian Martikov completes quest, restores Red Dragon Crush production

**Quest Value**: Primary objective for visiting Yester Hill. Davian Martikov offers 500 gp reward plus lifetime wine supply.

---

## Loot and Treasure

### Druid Leader's Correspondence
```yaml
itemId: druid_strahd_letters
name: "Correspondence from Strahd"
category: lore_document
location: druid_leader_tent
value: 0_gp_lore_valuable
hidden: false

description: "Letters from Strahd to the druid cultists, commanding them to attack the winery, steal the gems, and create Wintersplinter."
```

**Contents**:
- Strahd's orders to disrupt wine production (punish settlements)
- Instructions for using winery gem to create mega-blight
- Promises of rewards for faithful service
- Reveals Strahd's strategic thinking (wine shortage demoralizes population)

**Lore Value**: Explains druid motivations, confirms Strahd orchestrated the winery attack, provides insight into his methods.

---

### Ritual Components
```yaml
itemId: druid_ritual_items
name: "Druid Ritual Components"
category: equipment
location: druid_camp
value: 150 gp
hidden: false

description: "Druidic focuses, herbs, bones, and ritual tools used in ceremonies to feed the Gulthias Tree."
```

**Contents**:
- Wooden holy symbols (50 gp to druid collectors)
- Rare herbs (25 gp to alchemists)
- Animal bones carved with symbols (10 gp each, 5 total)
- Ritual dagger (ceremonial, 25 gp)

**Use Cases**: Sell to collectors, use in druid-specific spells, or destroy as symbolic victory.

---

### Gulthias Tree Sap
```yaml
itemId: gulthias_sap
name: "Corrupted Tree Sap"
category: alchemical_reagent
location: gulthias_tree
value: 50 gp_per_vial
quantity: 1d4_vials
hidden: false
danger: moderate

description: "Black sap from the Gulthias Tree, radiating necromantic energy. Valuable to alchemists but handling it risks corruption."
```

**Properties**:
- Can be harvested (DC 13 Nature check)
- Valuable alchemical component (necromancy potions, blight creation)
- Prolonged contact (10+ minutes) requires DC 12 Constitution save or suffer temporary hit point maximum reduction (-1d6, recovers after long rest)

**Uses**:
- Sell to dark wizards or alchemists (50 gp per vial)
- Crafting component for plant-based potions
- Can be weaponized (coating blades deals +1d4 necrotic damage but blade rusts after 1d6 hits)

---

## Environmental Items

### Standing Stone Carvings
```yaml
itemId: standing_stone_carvings
name: "Ancient Stone Carvings"
category: historical_artifact
location: standing_stones
value: 1000_gp_per_stone_if_extracted
hidden: false
impractical: true

description: "Primitive carvings depicting Strahd worshipped as a god-king. Valuable to historians but each stone weighs several tons."
```

**Properties**:
- Historical significance (shows how Barovians worship Strahd)
- Extraction impractical (each stone weighs 3+ tons)
- Rubbings can be made (DC 10 Intelligence (History), creates valuable historical record)
- Destroying stones weakens Gulthias Tree (10% HP reduction per stone)

**Strategic Value**: Destroying stones aids in defeating tree but eliminates historical artifacts.

---

### Druid Skull Masks
```yaml
itemId: druid_skull_masks
name: "Animal Skull Masks"
category: equipment
location: druid_corpses
value: 10 gp_each
quantity: 3

description: "Ceremonial masks made from animal skulls (bear, wolf, stag). Worn by druid cultists during rituals."
```

**Properties**:
- Can be worn (provides intimidation advantage against Barovian commoners)
- Symbolic of druid cult membership (wearing them risks being mistaken for cultist)
- Collectible value to dark artifact collectors (10 gp each)

---

### Caged Animals
```yaml
itemId: caged_animals
name: "Sacrificial Animals"
category: livestock
location: druid_camp
value: 5_gp_each
quantity: 1d6

description: "Goats, chickens, and rabbits captured for sacrifice. Can be freed or sold."
```

**Properties**:
- Can be freed (goodwill with nature spirits)
- Can be sold to Barovian farmers (5 gp each)
- Can be used for food (survival rations)

---

### Wintersplinter's Heartwood
```yaml
itemId: wintersplinter_heartwood
name: "Wintersplinter's Heart"
category: rare_material
location: wintersplinter_corpse
value: 500 gp
hidden: false
requires: wintersplinter_defeated

description: "The magical heartwood core of Wintersplinter. Only obtainable if the mega-blight is destroyed."
```

**Properties**:
- Requires defeating Wintersplinter (CR 7 boss)
- Can be extracted with DC 15 Nature or Survival check
- Crafting material for nature-based magic items (staffs, wands)
- Valuable to druids or nature wizards (500 gp)

---

## Consumables

### Stolen Winery Goods
```yaml
itemId: stolen_wine_barrels
name: "Stolen Wine Barrels"
category: consumables
location: druid_camp
value: 25_gp_per_barrel
quantity: 3

description: "Wine stolen from Wizard of Wines during raids. Purple Grapemash No. 3."
```

**Properties**:
- Each barrel contains 50 bottles worth of wine
- Can be returned to Martikovs (goodwill, 25 gp reward per barrel)
- Can be consumed (restores morale, advantage on next saving throw)
- Can be sold elsewhere (25 gp per barrel)

---

## Notes for DM

**Treasure Scaling**: Yester Hill offers modest treasure (gem is quest item, not sellable). Focus is on winery gem recovery and stopping Wintersplinter.

**Quest Integration**: This location is direct continuation of Wizard of Wines quest from Story 4-5. Gem recovery completes phase 2 of winery restoration (phase 3 is Berez gem).

**Loot Priority**:
1. Winery gem (quest completion)
2. Strahd correspondence (lore)
3. Ritual components (sellable, 150 gp)
4. Gulthias sap (dangerous but valuable)
5. Wintersplinter heartwood (only if boss defeated)

**Environmental Consequences**: Destroying Gulthias Tree ends blight spawning in this region. Tree can regenerate from roots if not completely destroyed (requires fire damage or extensive digging).
