# Village of Krezk - Items

## General Village Treasures

### Krezk Coinage
- **itemId**: `krezk_village_coins`
- **Name**: Village Coinage
- **Location**: Various (shops, homes, donations)
- **Description**: A modest amount of coins scattered throughout the village. Krezk is poor—most wealth is in goods, not gold.
- **Value**: 50-100 gp total available from various sources
- **Category**: treasure
- **Hidden**: false
- **Notes**: Villagers will not part with coins easily unless trust is established or services rendered.

---

### Religious Offerings
- **itemId**: `krezk_shrine_offerings`
- **Name**: Shrine Offerings
- **Location**: Shrine of the White Sun
- **Description**: Small tokens left by villagers at the shrine—copper coins, carved wooden holy symbols, dried flowers, prayer notes. Taking these would be grave sacrilege.
- **Value**: Minimal (< 5 gp) but culturally significant
- **Category**: treasure
- **Hidden**: false
- **Notes**: Stealing these decreases village trust severely. Father Andrei blesses new offerings weekly.

---

## Potential Legendary Artifact Locations

### Tarokka Reading Dependent Items
- **Notes**: If the Tarokka reading places one of the three legendary artifacts (Sunsword, Holy Symbol of Ravenkind, Tome of Strahd) in Krezk, specific locations are:
  - **Abbey of St. Markovia**: Most likely location (Abbot's quarters, catacombs)
  - **Blessed Pool**: Hidden beneath the spring or in nearby cave
  - **Burgomaster's House**: Family vault or hidden compartment
  - **Village Gates**: Concealed in gatehouse construction

**Implementation Note**: Artifact placement determined by Tarokka reading system (Story 4-16). When implemented, add specific item entries to appropriate sub-location Items.md files based on reading results.

---

## Key Quest Items

### Krezk Wine Delivery
- **itemId**: `wizard_of_wines_delivery`
- **Name**: Wine Shipment from Wizard of Wines
- **Location**: Not present initially (party must bring)
- **Description**: Crates of wine from the Martikov winery. Krezk has not received a delivery in weeks, and the villagers are desperate for wine for their religious ceremonies.
- **Category**: quest_item
- **Hidden**: false
- **Notes**: Bringing wine to Dmitri Krezkov grants +2 village trust and likely secures entry to Krezk.

---

### Holy Water from Blessed Pool
- **itemId**: `blessed_pool_holy_water`
- **Name**: Holy Water (Enhanced)
- **Location**: Blessed Pool sub-location
- **Description**: Crystal-clear water from the blessed pool. More potent than standard holy water—this spring is directly blessed by the Morninglord's light (or Sergei's spirit).
- **Effect**: Functions as holy water (2d6 radiant damage to undead/fiends) but also cures diseases and neutralizes poison when drunk
- **Category**: consumable
- **Hidden**: false
- **DC**: N/A (freely accessible once pool is discovered)
- **Notes**: Villagers believe this water is sacred. Taking it respectfully is permitted; desecrating the pool is unforgivable.

---

## General Village Equipment

### Mountain Climbing Gear
- **itemId**: `krezk_climbing_gear`
- **Name**: Climbing Equipment
- **Location**: Various homes, guard posts
- **Description**: Rope, pitons, ice axes—standard equipment for mountain living. Most villagers keep some gear for emergency evacuations or shepherding on steep slopes.
- **Value**: 25 gp per set
- **Category**: equipment
- **Hidden**: false
- **Availability**: Can be purchased or borrowed if trust level is sufficient

---

### Warm Clothing
- **itemId**: `krezk_mountain_clothing`
- **Name**: Mountain Furs and Wool
- **Location**: Various homes
- **Description**: Heavy wool cloaks, fur-lined boots, gloves. Essential for surviving the mountain cold.
- **Value**: 10-15 gp per outfit
- **Category**: equipment
- **Hidden**: false
- **Availability**: Can be purchased from villagers or found in abandoned homes

---

## Sub-Location Specific Items

Detailed items for specific buildings and areas are documented in their respective sub-location Items.md files:

- **Abbey of St. Markovia**: Religious relics, surgical tools, Abbot's possessions → `abbey-of-st-markovia/Items.md`
- **Burgomaster's House**: Family heirlooms, fine furnishings, Ilya's belongings → `burgomaster-house/Items.md`
- **Blessed Pool**: Enhanced holy water, pilgrim offerings → `blessed-pool/Items.md`
- **Village Gates**: Guard equipment, confiscated items, inspection records → `village-gates/Items.md`
- **Shrine of the White Sun**: Prayer books, incense, religious texts → `shrine-of-the-white-sun/Items.md`

---

## Random Loot Table (Optional)

When searching Krezk homes or buildings (with permission or as consequence of village conflict):

**Common (60%)**:
- 1d10 copper pieces
- Simple tools (farming, crafting)
- Basic food stores (preserved, dried)

**Uncommon (30%)**:
- 1d6 silver pieces
- Quality wool blankets
- Hand-carved holy symbols

**Rare (10%)**:
- 1d4 gold pieces
- Family heirloom (jewelry, weapon)
- Hidden letters or journals (plot hooks)

---

## Notes for Item Database Integration (Epic 3)

All items follow Epic 3 ItemDatabase schema:
- `itemId`: Unique identifier (lowercase, underscores)
- `name`: Display name
- `description`: Detailed description
- `category`: treasure, consumable, quest_item, equipment
- `hidden`: Boolean (requires search/investigation)
- `dc`: Difficulty to find if hidden
- `value`: Gold piece value
- `weight`: Pounds (if relevant)
- `properties`: Special effects or mechanics

Items will be integrated with Epic 3 InventoryManager when party acquires them.
