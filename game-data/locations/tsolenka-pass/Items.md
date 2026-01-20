# Tsolenka Pass - Items

## Quest Items

### None
Tsolenka Pass contains no specific quest items, but the Roc's nest may contain Tarokka-indicated artifacts depending on the fortune told by Madam Eva.

---

## Treasure

### Roc's Nest Hoard
```yaml
itemId: roc_nest_treasure
name: "Roc's Nest Hoard"
category: treasure_hoard
location: northern_guard_tower_rooftop
value: 1500 gp total
hidden: false
requires_combat: true

description: "Decades of accumulated treasure from travelers the Roc has killed. Scattered among bones and debris in the massive nest."
```

**Contents**:
- **Coins**: 450 gp, 1,200 sp, 3,000 cp (scattered throughout nest)
- **Gems**: 6 gems worth 100 gp each (bloodstones, garnets, amethysts)
- **Art Objects**: A golden locket (250 gp), a silver holy symbol of the Morninglord (150 gp), an ornate compass (100 gp)
- **Magic Items** (roll 1d4):
  1. *Potion of Greater Healing* (intact vial, somehow unbroken)
  2. *+1 Longsword* (belonged to a slain paladin, still bears Order of the Silver Dragon insignia)
  3. *Ring of Warmth* (extremely useful for Amber Temple exploration)
  4. *Boots of the Winterlands* (as above)
- **Mundane Valuables**: A intact spyglass (50 gp), a merchant's ledger (historical interest), a bottle of fine wine (Purple Grapemash No. 3, if opened before Wizard of Wines siege)

**Tarokka Artifact Possibility**: If Madam Eva's reading indicated "a nest built on high," one of the following artifacts may be here:
- *Holy Symbol of Ravenkind* (unlikely but possible)
- *Sunsword* (unlikely but possible)
- *Tome of Strahd* (unlikely but possible)

**Retrieval Challenges**:
- Must defeat, drive off, or sneak past the Roc
- Climbing to the tower roof requires DC 13 Strength (Athletics) check
- Nest is unstable—careless searching risks breaking Roc eggs (enrages Roc if present)
- Some items are underneath heavy bones and debris

---

### Frozen Guards' Cache
```yaml
itemId: frozen_guards_cache
name: "Last Guard Post Supplies"
category: military_supplies
location: southern_guard_tower_hidden_compartment
value: 150 gp
hidden: true
dc_to_find: 14

description: "Emergency supplies hidden by the last guards manning Tsolenka Pass before they froze to death."
```

**Contents**:
- **Winter Survival Gear**: 4 sets of cold weather clothing (still usable), fur-lined cloaks, woolen blankets
- **Military Equipment**: 20 crossbow bolts, a whetstone, a military insignia (Barovian army), a horn (cracked, non-functional)
- **Rations**: Hardtack (spoiled, inedible), dried meat (frozen, technically edible but unappetizing)
- **Documents**: A journal detailing the last 30 days of the guards' vigil (see below)
- **Valuables**: 45 gp in mixed coin, a silver flask (25 gp), a dice set (carved bone, 10 gp)

**Journal Contents** (excerpt):
*"Day 12: Still no supply caravan from Vallaki. Rations running low. The cold is getting worse.*

*Day 18: Markov swears he saw something massive circling above the clouds. I think the isolation is getting to him.*

*Day 23: It wasn't isolation. A bird the size of a house attacked this morning. Took Markov and Petrov right off the bridge. We're hiding in the south tower.*

*Day 27: So cold. No food left. The bird circles every day. We'll die here.*

*Day 30: If anyone finds this—tell Vallaki we held our post. We did our duty."*

**Value to Party**:
- Winter gear essential for Amber Temple survival
- Journal provides context and warnings about the Roc
- Guards' spirits appreciate recovery of their belongings

---

## Environmental Items

### Fallen Traveler Remains
```yaml
itemId: chasm_corpses
name: "Remains of Fallen Travelers"
category: scavenged_items
location: chasm_floor
value: variable
hidden: false
requires: flight_or_climbing_magic

description: "Corpses and wreckage at the bottom of the 1,000-foot chasm. Only accessible via flight or climbing magic."
```

**Potential Loot** (if party descends):
- Rusted weapons and armor (mostly worthless, 10-50 gp scrap value)
- Frozen corpses (some recent, some decades old)
- Shattered wagon remains (merchant caravan that lost control on the bridge)
- Random treasure: 2d6 × 10 gp, 1d4 gems (50 gp each), possible magic item (DM discretion)
- **Risk**: Retrieving these items requires *Fly* spell, *Levitate*, or similar magic. No mundane climbing possible due to sheer walls.

---

### Roc Feathers
```yaml
itemId: roc_feathers
name: "Giant Roc Feathers"
category: crafting_material
location: scattered_across_pass
value: 10 gp each
hidden: false
quantity: 2d6

description: "Massive feathers shed by the Roc, each as long as a greatsword. Valuable to collectors and useful for crafting."
```

**Uses**:
- Sold to collectors or mages (10 gp each)
- Crafting component for magical items (DM discretion)
- Can be used to fashion crude signals or markers
- Proof of the Roc's existence

---

### Bridge Planks (Salvage)
```yaml
itemId: old_bridge_planks
name: "Ancient Bridge Timbers"
category: structural_material
location: bridge_gap
value: minimal
hidden: false

description: "Rotting wooden planks bridging a gap in the stone bridge. Dangerous to cross, but could be salvaged for firewood."
```

**Properties**:
- Currently bridging a 10-foot gap in the stone bridge
- Require DC 12 Dexterity (Acrobatics) to cross safely
- If removed, gap becomes much more difficult to cross (DC 15 Strength (Athletics) to jump, or magic required)
- Salvaged wood could provide 1d4 hours of campfire fuel (situationally valuable in Amber Temple)

---

## Consumables

### Ice and Snow (Unlimited)
```yaml
itemId: mountain_ice
name: "Mountain Ice and Snow"
category: environmental_resource
location: everywhere
value: 0
hidden: false

description: "Clean snow and ice can be melted for drinking water. The environment is perpetually frozen."
```

**Uses**:
- Source of fresh water (must be melted)
- Can be packed around injuries to reduce swelling (improvised Medicine aid)
- Useful for cooling overheated magic items or alchemical experiments

---

## Notes for DM

**Treasure Progression**: Tsolenka Pass offers moderate treasure for a deadly encounter (CR 11 Roc). The Roc's nest hoard represents accumulated wealth from dozens of travelers over 20+ years.

**Tarokka Integration**: This location is a valid target for Madam Eva's artifact reading. The "nest built on high" clue directly points here. If artifacts are placed here, they should be in the Roc's nest.

**Risk vs. Reward**:
- **Low Risk**: Frozen guards' cache (requires Investigation check, no combat)
- **Medium Risk**: Roc feathers (can be collected without engaging Roc)
- **High Risk**: Roc's nest hoard (requires defeating CR 11 creature)
- **Very High Risk**: Chasm remains (requires magic to access safely)

**Connection to Amber Temple**: The *Ring of Warmth* or *Boots of the Winterlands* from the Roc's nest significantly ease exploration of the frozen temple ahead. Consider this reward as preparation for the next challenge.
