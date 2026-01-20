# Tsolenka Pass - NPCs

## Major NPCs

### The Roc
```yaml
npcId: tsolenka_roc
name: "The Roc of Tsolenka Pass"
type: beast
race: Roc
challenge_rating: 11
role: territorial_guardian
status: alive
location: northern_guard_tower
disposition: hostile

stats:
  ac: 15
  hp: 248
  speed: "20 ft., fly 120 ft."
  str: 28
  dex: 10
  con: 20
  int: 3
  wis: 10
  cha: 9

abilities:
  - Multiattack (two attacks: one beak, one talons)
  - Beak (+13 to hit, 4d8+9 piercing damage)
  - Talons (+13 to hit, 4d6+9 slashing damage, grapple DC 19)
  - Keen Sight (advantage on Perception checks using sight)

tactics:
  - Attacks from above, using superior mobility
  - Grapples Medium or smaller creatures and drops them into chasm
  - Defends nest ferociously during breeding season
  - Retreats if reduced below 50 HP and nest not threatened
```

**Description**: A massive bird of prey, the Roc has a wingspan exceeding 70 feet. Its feathers are mottled grey and white, perfect camouflage against the mountain snow and fog. Eyes like molten gold scan the pass for prey. The creature is intelligent enough to recognize threats and prioritize targets—spell casters and ranged attackers first, then melee combatants.

**Dialogue**: The Roc doesn't speak, but its piercing cry can be heard for miles. The sound strikes terror into mountain travelers: *"SKREEEEE!"*

**Quest Hooks**:
- The Roc may possess treasure from travelers it's killed, potentially including Tarokka-indicated artifacts
- Defeating or pacifying the Roc makes future passage to Amber Temple safer
- The Roc's eggs are valuable alchemical components (if party is morally flexible)

**AI Behavior Notes**:
- **Combat Strategy**: The Roc uses hit-and-run tactics, attacking from above then climbing back to altitude. It focuses on grappling smaller characters and dropping them into the chasm (automatic 10d6 damage on a 1,000-foot fall). Prioritize characters who attack its nest or eggs.
- **Morale**: Fights to the death if nest/eggs threatened. Otherwise retreats at half HP to return another day.
- **Environmental Use**: Uses wind and fog to its advantage, imposing disadvantage on ranged attacks against it during storms.
- **Treasure Guardian**: The Roc's nest contains significant treasure from decades of hunting travelers, including possible Tarokka artifacts.

---

## Minor NPCs

### Frozen Guards (Spirits)
```yaml
npcId: frozen_guards
name: "The Last Sentinels of Tsolenka"
type: undead_spirits
count: 4
challenge_rating: N/A
role: lorekeepers
status: deceased
location: southern_guard_tower
disposition: melancholic_neutral

description: "Four Barovian soldiers who froze to death at their post, their spirits occasionally manifest on cold nights."
```

**Description**: During particularly cold nights, spectral forms of four soldiers appear in the southern guard tower, sitting around a fire that gives no heat. They don't acknowledge the living unless directly addressed, and even then only sometimes respond.

**Dialogue**: If the party speaks to them respectfully:
- *"The pass... we held the pass..."*
- *"No relief came. No supplies. Just cold..."*
- *"The bird came. Took the others. We stayed..."*
- *"The temple... don't go to the temple... amber promises, amber lies..."*

**Information Provided**:
- Warnings about the Amber Temple's dark gifts
- History of the pass (once heavily guarded, now abandoned)
- Mention of "the bird" (the Roc) arriving about 20 years ago
- Hints that Strahd deliberately stopped supply caravans to isolate the temple

**Quest Hooks**:
- The guards ask to be laid to rest properly (burial with military honors)
- They can reveal the hidden cache in the tower (see Items.md)
- They warn about temple guardians (flameskulls, arcanaloth)

**AI Behavior Notes**:
- **Manifestation Trigger**: The spirits appear on nights when temperature drops below freezing or when living creatures take shelter in the southern tower.
- **Interaction**: They're not hostile, but profoundly sad. Respectful treatment (Intelligence (History) check DC 12 to recognize their military rank and address them properly) makes them more talkative.
- **Resolution**: If given proper burial or if their remains are returned to Vallaki for military honors, they depart peacefully and leave a blessing (advantage on first saving throw in Amber Temple).
- **Warnings**: They actively try to dissuade the party from entering the Amber Temple, having watched countless treasure-seekers enter and emerge corrupted or not at all.

---

## Environmental Encounters

### Mountain Goats (Non-hostile)
```yaml
type: beast
challenge_rating: 0
role: atmosphere
description: "Hardy mountain goats that have learned to navigate the treacherous pass, potential Roc prey."
```

Occasionally the party spots mountain goats clinging to impossible cliff faces. These animals represent the Roc's primary food source. Finding fresh goat carcasses (half-eaten, talon marks) signals the Roc is nearby and actively hunting.

---

## Notes for DM

**Roc Encounter Scaling**:
- **CR 11** makes this a deadly encounter for parties below level 8
- Consider having the Roc initially just observe the party from a distance (Intimidation factor)
- Full combat should be triggered by: attacking the Roc, approaching its nest, or spending extended time on the bridge

**Treasure Distribution**:
- See Items.md for specific treasure in Roc's nest
- Frozen guards' hidden cache in southern tower
- Random traveler remains in chasm (if party descends with magic)

**Connection to Amber Temple**:
- Tsolenka Pass is the gateway to the temple
- Successfully navigating the pass (defeating or sneaking past the Roc) is the first test
- The frozen guards' warnings foreshadow the temple's corruption
