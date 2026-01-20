# Yester Hill - NPCs

## Major NPCs

### Druid Cultist Leaders
```yaml
npcId: yester_hill_druids
name: "Druid Cultists of Yester Hill"
type: humanoid
race: human
challenge_rating: 2
count: 3
role: cult_leaders
status: alive
location: hilltop_ritual_circle
disposition: hostile

stats:
  ac: 11
  hp: 27
  speed: "30 ft."
  str: 10
  dex: 12
  con: 13
  int: 12
  wis: 15
  cha: 11

spells:
  - Cantrips: druidcraft, produce flame, thorn whip
  - 1st: cure wounds, entangle, thunderwave
  - 2nd: barkskin, flaming sphere, spike growth
```

**Description**: Fanatic druids wearing animal skull masks and cloaks of woven vines. They worship Strahd as a dark nature god and believe blights are the natural evolution of plant life. Completely devoted to spreading corruption.

**Dialogue**:
- *"The Dark Lord commands! The winery shall fall!"*
- *"You dare defile the sacred hill? Feed them to the tree!"*
- *"Wintersplinter, awaken! Crush the unbelievers!"*

**AI Behavior Notes**:
- Use Entangle and Spike Growth to control battlefield
- Command blight swarms with druidcraft
- If losing, attempt to awaken Wintersplinter as last resort
- Fight to death (fanatic devotion to Strahd)

---

### Wintersplinter (The Mega-Blight)
```yaml
npcId: wintersplinter
name: "Wintersplinter"
type: plant
race: tree_blight
challenge_rating: 7
role: living_siege_weapon
status: dormant
location: hillside_recess
disposition: hostile_when_awakened

stats:
  ac: 16
  hp: 115
  speed: "30 ft."
  str: 23
  dex: 8
  con: 21
  int: 6
  wis: 10
  cha: 3

abilities:
  - Multiattack (2 slam attacks)
  - Slam (+9 to hit, 3d8+6 bludgeoning damage)
  - Grasping Roots (bonus action, 15-foot radius, DC 15 Strength save or restrained)
  - Verdant Surge (recharge 5-6, releases wave of thorns, 20-foot radius, 4d8 piercing damage)
```

**Description**: A 50-foot-tall tree blight covered in frost and ice, with glowing green eyes. Created from the Gulthias Tree as a living weapon to destroy the Wizard of Wines. Weighs several tons, shakes the ground when it moves.

**Dialogue**: Doesn't speak, but roars like splintering wood when angry.

**Quest Hooks**:
- Preventing Wintersplinter's awakening is crucial to winery's survival
- If awakened, it marches to Wizard of Wines to destroy it
- Defeating it before it reaches winery is time-sensitive quest

**AI Behavior Notes**:
- **Combat**: Slam attacks deal massive damage. Grasping Roots restrains multiple targets. Focus on largest threat first.
- **March to Winery**: If awakened, begins 2-hour march to Wizard of Wines. Party must stop it or winery is destroyed.
- **Vulnerability**: Fire deals double damage (standard blight weakness).
- **Tactics**: Too large to be subtle. Crashes through forests, ignores terrain.

---

## Minor NPCs / Creatures

### Twig Blights (Swarm)
```yaml
npcId: yester_hill_twig_blights
name: "Twig Blights"
type: plant
challenge_rating: 0.125
count: 12
role: minion_swarm
location: scattered_among_stones
disposition: hostile
```

**Description**: Small animated bundles of twigs and thorns, spawned by the Gulthias Tree. Weak individually but dangerous in swarms.

**AI Behavior**: Swarm tactics. Attack in groups of 3-4. Easily destroyed but numerous. Respawn from tree if not destroyed at root.

---

### Needle Blights (Ranged Support)
```yaml
npcId: yester_hill_needle_blights
name: "Needle Blights"
type: plant
challenge_rating: 0.25
count: 6
role: ranged_attackers
location: perimeter_guard
disposition: hostile
```

**Description**: Human-sized blights that launch volleys of thorns from range. Provide ranged support to druid cultists.

**AI Behavior**: Stay at range (60 feet). Launch needle volleys (2d6 piercing, DC 12 Dexterity save for half). Fall back if approached.

---

### Vine Blight (Grappler)
```yaml
npcId: yester_hill_vine_blight
name: "Vine Blight"
type: plant
challenge_rating: 0.5
count: 1
role: grapple_specialist
location: near_gulthias_tree
disposition: hostile
```

**Description**: Larger blight with vinelike appendages. Grapples targets and drags them toward the Gulthias Tree for sacrifice.

**AI Behavior**: Grapple spellcasters or ranged attackers. Drag toward tree (+4 constrict damage per round). DC 13 Strength/Dexterity to escape.

---

## Environmental NPCs

### Sacrificial Victims (Non-Hostile)
```yaml
npcId: sacrificial_victims
name: "Captured Prisoners"
type: humanoid
role: quest_npcs
location: druid_camp_cages
disposition: terrified_neutral
```

**Description**: Barovian villagers and travelers kidnapped for sacrifice. Caged in druid camp, awaiting their turn on the altar. If freed, they flee toward nearest settlement.

**Quest Value**: Rescuing prisoners earns reputation and possible rewards. Some may have information about druid plans or winery siege.

---

## Notes for DM

**Encounter Scaling**:
- Start with blight patrols (12 twig, 6 needle)
- Add druid cultists when party engages seriously
- Wintersplinter awakens only if druids desperate or party delays too long
- Full encounter (all enemies) is deadly for level 5-6 parties

**Wintersplinter Timing**:
- If awakened, it takes 2 hours to march to Wizard of Wines
- Party can pursue and ambush en route (forest terrain advantage)
- If Wintersplinter reaches winery, it destroys one building per round until stopped
- Creates time pressure: Stop it before winery destruction

**Treasure Distribution**:
- Winery gem is primary treasure (quest item worth 2,000 gp to Martikovs)
- Druids carry minimal equipment (wooden weapons, hide armor, ritual components)
- Druid leader's tent contains correspondence from Strahd (lore value)
