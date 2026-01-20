# Story 4-14: Monster Reference List

This document lists all monster IDs referenced in Story 4-13 (Side Quests Batch 1) that need to be implemented in Story 4-14 (Monsters & NPCs Batch).

## Monster IDs by Quest

### St. Andral's Feast (Quest: st_andrals_feast)
- `vampire_spawn` (CR 5)
  - Used in: Church attack event
  - Count: 6 vampire spawn
  - Source: Curse of Strahd, p. 242

### Wizard of Wines Delivery (Quest: wizard_of_wines_delivery)
- `needle_blight` (CR 1/4)
  - Used in: Winery assault
  - Count: 30-40 blights total
  - Source: Monster Manual, p. 32

- `vine_blight` (CR 1/2)
  - Used in: Winery assault
  - Count: Part of 30-40 blight total
  - Source: Monster Manual, p. 32

- `tree_blight` (CR 7)
  - Used in: Winery boss fight
  - Count: 1 tree blight (Wintersplinter)
  - Source: Curse of Strahd, p. 232

- `druid` (CR 2)
  - Used in: Yester Hill encounter
  - Count: 12-15 druids
  - Source: Monster Manual, p. 346

### Werewolf Den Hunt (Quest: werewolf_den_hunt)
- `werewolf` (CR 3)
  - Used in: Pack encounters, den assault
  - Count: 6-8 werewolves
  - Source: Monster Manual, p. 211

- `werewolf_alpha` (CR 5)
  - Used in: Pack leader (Kiril Stoyanovich)
  - Count: 1 alpha
  - Special: Pack leader variant with legendary actions
  - Source: Curse of Strahd, p. 201

### Abbey Investigation (Quest: abbey_investigation)
- `mongrelfolk` (CR 1/4)
  - Used in: Abbey encounters
  - Count: 10-15 mongrelfolk
  - Source: Curse of Strahd, p. 235

- `flesh_golem` (CR 5)
  - Used in: Vasilka encounter (if combat occurs)
  - Count: 1 flesh golem (Vasilka)
  - Source: Monster Manual, p. 169

- `deva` (CR 10)
  - Used in: Abbot boss fight (if party opposes Abbot)
  - Count: 1 deva (The Abbot)
  - Special: Fallen deva variant
  - Source: Monster Manual, p. 16; Curse of Strahd, p. 151

### Return Berez Gem (Quest: return_berez_gem)
- `night_hag_boss` (CR 11)
  - Used in: Baba Lysaga boss fight
  - Count: 1 night hag boss (Baba Lysaga)
  - Special: Enhanced night hag with legendary actions, lair actions
  - Source: Curse of Strahd, p. 228

- `animated_hut` (CR 4)
  - Used in: Baba Lysaga fight (creeping hut companion)
  - Count: 1 animated hut
  - Source: Curse of Strahd, p. 228

- `scarecrow` (CR 1)
  - Used in: Berez guardians
  - Count: 2d6 scarecrows
  - Source: Monster Manual, p. 268

### Dream Pastry Investigation (Quest: dream_pastry_investigation)
- `night_hag` (CR 5)
  - Used in: Old Bonegrinder coven
  - Count: 3 night hags (Morgantha, Bella Sunbane, Offalia Wormwiggle)
  - Special: Coven magic when all 3 present
  - Source: Monster Manual, p. 178; Curse of Strahd, p. 125

### Missing Vistana (Quest: missing_vistana)
- No new monsters (uses existing NPCs and location events)

## Monster Summary by CR

### CR 1/4
- `needle_blight` (40+ instances across quests)
- `mongrelfolk` (10-15 instances)

### CR 1/2
- `vine_blight` (30+ instances)

### CR 1
- `scarecrow` (2d6 instances)

### CR 2
- `druid` (12-15 instances)

### CR 3
- `werewolf` (6-8 instances)

### CR 4
- `animated_hut` (1 instance)

### CR 5
- `vampire_spawn` (6 instances)
- `flesh_golem` (1 instance - Vasilka)
- `night_hag` (3 instances - coven)
- `werewolf_alpha` (1 instance - Kiril)

### CR 7
- `tree_blight` (1 instance - Wintersplinter)

### CR 10
- `deva` (1 instance - The Abbot)

### CR 11
- `night_hag_boss` (1 instance - Baba Lysaga)

## Implementation Notes for Story 4-14

### Priority 1 (Critical for Multiple Quests)
1. **night_hag** - Used in 2 quests (Dream Pastry, Return Berez Gem)
2. **vampire_spawn** - Used in St. Andral's Feast (high visibility quest)
3. **werewolf** / **werewolf_alpha** - Core to Werewolf Den Hunt

### Priority 2 (Major Combat Encounters)
4. **Blights** (needle, vine, tree) - Large-scale winery battle
5. **druid** - Yester Hill encounter
6. **night_hag_boss** (Baba Lysaga) - CR 11 boss fight

### Priority 3 (Supporting Encounters)
7. **mongrelfolk** - Abbey encounters
8. **flesh_golem** (Vasilka) - Conditional combat
9. **deva** (The Abbot) - Conditional boss fight
10. **animated_hut** - Baba Lysaga companion
11. **scarecrow** - Berez guardians

### Special Mechanics to Implement

#### Coven Magic (night_hag)
- When 3+ hags within 30 feet, coven spells available
- Spells: Lightning Bolt, Hold Person, Eyebite, Phantasmal Killer
- Shared spell slots

#### Pack Tactics (werewolf, werewolf_alpha)
- Advantage on attacks when ally within 5 feet of target
- Werewolf alpha has legendary actions (2/round)

#### Legendary Actions (night_hag_boss, werewolf_alpha)
- Baba Lysaga: 3 legendary actions/round
- Werewolf Alpha: 2 legendary actions/round

#### Lair Actions (night_hag_boss)
- Baba Lysaga's Creeping Hut provides lair actions
- Initiative count 20

#### Damage Immunities
- **werewolf/werewolf_alpha**: Immune to non-magical, non-silvered weapon damage
- **flesh_golem**: Immune to lightning, poison; fire heals; cold slows

## File Naming Convention

All monster files should use template: `templates/monster/monster-template.yaml`

Monster files should be created at: `game-data/monsters/[monster-id].yaml`

Example:
```
game-data/monsters/vampire-spawn.yaml
game-data/monsters/night-hag.yaml
game-data/monsters/werewolf.yaml
```

## Testing Requirements

Story 4-14 should include integration tests for:
1. Loading all monster stat blocks
2. Validating CR calculations
3. Verifying special abilities (coven magic, pack tactics, immunities)
4. Confirming legendary actions load correctly
5. Testing damage immunities/resistances

## Cross-References

### Quests Using These Monsters
- **st_andrals_feast.yaml** → vampire_spawn
- **wizard_of_wines_delivery.yaml** → blights, druids, tree_blight
- **werewolf_den_hunt.yaml** → werewolf, werewolf_alpha
- **abbey_investigation.yaml** → mongrelfolk, flesh_golem, deva
- **return_berez_gem.yaml** → night_hag_boss, animated_hut, scarecrow
- **dream_pastry_investigation.yaml** → night_hag (coven)

### NPCs Associated with Monsters
- **Kiril Stoyanovich** (NPC) → uses werewolf_alpha stat block
- **Emil Toranescu** (NPC) → uses werewolf_alpha stat block (weakened)
- **Baba Lysaga** (NPC) → uses night_hag_boss stat block
- **The Abbot** (NPC) → uses deva stat block (fallen variant)
- **Morgantha** (NPC) → uses night_hag stat block (coven leader)
- **Bella Sunbane** (NPC) → uses night_hag stat block
- **Offalia Wormwiggle** (NPC) → uses night_hag stat block
- **Vasilka** (NPC) → uses flesh_golem stat block

## Source Material References

All monsters are from official D&D 5e sources:
- **Monster Manual**: vampire_spawn, night_hag, werewolf, flesh_golem, deva, scarecrow, druids
- **Curse of Strahd**: Baba Lysaga, The Abbot, mongrelfolk, Wintersplinter, werewolf_alpha (Kiril), blights

Page references included in monster entries above.

---

**Document Purpose**: Reference guide for Story 4-14 implementation
**Created**: 2025-11-16
**Story**: 4-13 (Side Quests Batch 1)
**Next Story**: 4-14 (Monsters & NPCs Batch)
