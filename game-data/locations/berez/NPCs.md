# Berez - NPCs

## Major NPCs

### Baba Lysaga
```yaml
npcId: baba_lysaga
name: "Baba Lysaga"
type: humanoid
race: night_hag
challenge_rating: 11
role: strahd_servant
status: alive
location: walking_hut
disposition: hostile

stats:
  ac: 16
  hp: 120
  speed: "30 ft., fly 30 ft. (on giant skull)"
  str: 18
  dex: 10
  con: 16
  int: 16
  wis: 17
  cha: 13

abilities:
  - Spellcasting (9th-level caster)
  - Summon swarms (insects, bats)
  - Animate scarecrows
  - Fly on giant floating skull
  - Legendary Actions (3/round)

spells:
  - Cantrips: ray of frost, mage hand
  - 1st: witch bolt, thunderwave
  - 2nd: hold person, web
  - 3rd: lightning bolt, fireball
  - 4th: blight, polymorph
  - 5th: cloudkill
```

**Description**: Ancient hag who believes she is Strahd's mother (she's not—she found him as a baby and raised him briefly). Fanatically devoted to the vampire lord. Guards the third winery gem.

**Dialogue**:
- *"My sweet Strahd! I am your mother! These fools cannot harm you!"*
- *"The gem is mine! Strahd gave it to me!"*
- *"Die, insects! Die for defying my beautiful son!"*

**AI Behavior**: CR 11 boss. Uses flying skull for mobility. Casts area spells (*Fireball*, *Cloudkill*). Summons scarecrow reinforcements. Commands walking hut to attack. Fights to death defending gem.

---

### Baba Lysaga's Creeping Hut
```yaml
npcId: baba_lysaga_hut
name: "Baba Lysaga's Creeping Hut"
type: construct
challenge_rating: 4
role: animated_lair
status: active
disposition: hostile

stats:
  ac: 16
  hp: 72
  speed: "30 ft."

abilities:
  - Multiattack (2 chicken leg kicks)
  - Kick (+8 to hit, 2d10+4 bludgeoning)
  - Swallow (grapple Small creatures)
```

**Description**: Grotesque hut on giant chicken legs. Powered by the winery gem. Fights alongside Baba Lysaga, kicking and trampling enemies.

**AI Behavior**: Fights until destroyed. If hut destroyed, gem can be extracted from wreckage.

---

### Scarecrows
```yaml
npcId: berez_scarecrows
name: "Animated Scarecrows"
type: construct
count: 12
challenge_rating: 1
location: throughout_swamp
disposition: hostile
```

**Description**: Pumpkin-headed scarecrows with claw-like hands. Created by Baba Lysaga to guard Berez.

**AI Behavior**: Ambush from swamp. Immune to frightened condition. Vulnerable to fire. Attack in groups.

---

## Notes

Baba Lysaga is CR 11—one of the toughest encounters in Barovia outside Strahd himself. The hut adds another CR 4 enemy. Scarecrows provide minion swarms. This is end-game content requiring high-level party or excellent tactics.
