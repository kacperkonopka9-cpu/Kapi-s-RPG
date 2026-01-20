# Argynvostholt - NPCs

## Major NPCs

### Vladimir Horngaard
```yaml
npcId: vladimir_horngaard
name: "Vladimir Horngaard"
type: undead
race: revenant
challenge_rating: 5
role: order_leader
status: undead
location: mansion
disposition: hostile_to_strahd_allies

stats:
  ac: 13
  hp: 136
  speed: "30 ft."
  str: 18
  dex: 14
  con: 18
  int: 13
  wis: 16
  cha: 18

abilities:
  - Rejuvenation (returns in 24 hours unless put to rest)
  - Vengeful Tracker (knows direction to Strahd)
  - Fist (+7 to hit, 2d6+4 bludgeoning plus 2d6 necrotic)
```

**Description**: Leader of the Order's revenants. Consumed by hatred for Strahd, but paradoxically opposes Strahd's destruction because eternal torment is his goal.

**Dialogue**:
- *"Strahd must suffer, not die. Death is mercy he doesn't deserve."*
- *"The beacon must not light. Hope weakens our vengeance."*
- *"You would help him? You are no better than his servants!"*

**AI Behavior**: Vladimir opposes lighting the beacon. He may attack party if they attempt it, or negotiate if convinced eternal torment isn't working.

---

### Sir Godfrey Gwilym
```yaml
npcId: godfrey_gwilym
name: "Sir Godfrey Gwilym"
type: undead
race: revenant_knight
challenge_rating: 5
role: honorable_warrior
status: undead
location: chapel
disposition: noble_neutral
```

**Description**: More reasonable than Vladimir. Believes the order's purpose was to protect the innocent, not just punish Strahd. May ally with party.

**Dialogue**:
- *"We failed our sacred duty. The dragon fell, the order broken."*
- *"Vladimir's hatred blinds him. Perhaps you can succeed where we failed."*
- *"Light the beacon. Let Argynvost's spirit guide you."*

**AI Behavior**: Godfrey secretly helps party light beacon if they prove worthy. Provides information about ritual and opposes Vladimir's interference.

---

### Phantom Warriors (Revenants)
```yaml
npcId: argynvost_revenants
name: "Order of the Silver Dragon Revenants"
type: undead
count: 12
challenge_rating: 5
location: throughout_mansion
disposition: hostile_unless_respectful
```

**Description**: Lesser revenants of the fallen order. Follow Vladimir's lead but respect honorable warriors.

**AI Behavior**: Attack defilers, negotiate with respectful visitors. Some may side with Godfrey over Vladimir if ideological split occurs.

---

## Minor NPCs

### Animated Gargoyles
```yaml
npcId: argynvostholt_gargoyles
type: construct
count: 4
challenge_rating: 2
location: roof_and_towers
disposition: hostile
```

**Description**: Stone gargoyles animated by residual magic. Attack intruders on sight.

---

## Notes

Vladimir is the primary obstacle to lighting the beacon. Godfrey is potential ally. Other revenants follow strongest leader. Party must navigate revenant politics or fight their way through.
