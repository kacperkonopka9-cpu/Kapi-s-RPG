# Amber Temple - NPCs

## Major NPCs

### Exethanter (The Forgotten Lich)
```yaml
npcId: exethanter
name: "Exethanter"
type: undead
race: lich
challenge_rating: 14
role: mad_guardian
status: alive
location: library
disposition: confused_neutral

stats:
  ac: 17
  hp: 135
  speed: "30 ft."
  str: 11
  dex: 16
  con: 16
  int: 20
  wis: 14
  cha: 16

abilities:
  - Legendary Resistance (3/day)
  - Rejuvenation (reforms in 1d10 days if phylactery intact)
  - Spellcasting (18th-level wizard)
  - Paralyzing Touch (+12 to hit, 3d6 cold damage, DC 18 Con save or paralyzed)

spells_prepared:
  - Cantrips: mage hand, prestidigitation, ray of frost
  - 1st: detect magic, magic missile, shield
  - 2nd: detect thoughts, mirror image
  - 3rd: animate dead, counterspell, dispel magic
  - 4th: dimension door
  - 5th: cloudkill, scrying
  - 6th: disintegrate, globe of invulnerability
  - 7th: finger of death
  - 8th: dominate monster, power word stun
  - 9th: power word kill

current_state: memory_loss
```

**Description**: Exethanter appears as a desiccated corpse in tattered wizard robes, his eyes glowing with dim green light. Once a brilliant archwizard tasked with guarding the temple, millennia of isolation have eroded his memories. He now wanders the halls, forgetting his purpose, his past, even conversations mere minutes after they occur.

**Dialogue**:
- *"Have we met? I feel we've met. Or perhaps you remind me of... someone. I forget."*
- *"The prisoners must be guarded. The... what were they called? The dark ones. In the amber. Yes. That's important."*
- *"I had a duty once. A sacred trust. But the years... so many years... what was I protecting?"*
- *"Beware the gifts. They promise power but... but... I'm sorry, what were we discussing?"*
- *"My phylactery? I... I had one. Somewhere. Important, that. Can't remember where I put it."*

**Quest Hooks**:
- Exethanter possesses crucial information about the vestiges but can't remember it reliably
- His lost memories can be partially restored via *Greater Restoration* or similar magic
- He knows the ritual to reverse dark gifts (recorded in his hidden laboratory notes)
- His phylactery is hidden in the temple—destroying it could free him from undeath (or ensure permanent death)

**AI Behavior Notes**:
- **Combat**: Exethanter only fights if attacked or if characters attempt to destroy amber sarcophagi (his dim memories trigger protective instinct). Uses legendary actions and lair actions typical of liches.
- **Interaction**: Mostly harmless if approached peacefully. Willing to talk but provides contradictory or incomplete information due to memory loss.
- **Memory Pattern**: Retains short-term memory for 1d10 minutes, then forgets everything except core directive (guard the vestiges).
- **Restoration Path**: If party helps restore his memories, he becomes invaluable ally—provides full vestige lore, warns about specific dark gifts, reveals hidden areas.
- **Tragic Figure**: Exethanter is more pitiable than threatening. He's been alone for millennia, watching thousands of seekers corrupt themselves or die in his temple.

---

### The Arcanaloth
```yaml
npcId: amber_temple_arcanaloth
name: "The Vault Keeper"
type: fiend
race: arcanaloth
challenge_rating: 12
role: treasurer_guardian
status: alive
location: vault
disposition: lawful_evil

stats:
  ac: 17
  hp: 104
  speed: "30 ft., fly 30 ft."
  str: 10
  dex: 17
  con: 14
  int: 20
  wis: 16
  cha: 17

abilities:
  - Magic Resistance (advantage on saves vs. spells)
  - Innate Spellcasting (Charisma, DC 15)
  - Claws (2 attacks, +7 to hit, 2d4+3 slashing)
  - Teleport (at will, self plus 50 lbs)

spells:
  - At will: detect magic, disguise self, invisibility
  - 1/day each: banishment, heat metal, magic circle
```

**Description**: A jackal-headed fiend in ornate robes, the arcanaloth serves as the temple's treasurer and deals-maker. Unlike the corrupted vestiges or mad Exethanter, the arcanaloth is perfectly sane, coldly intelligent, and utterly mercenary. It guards the vault not from loyalty but from contractual obligation—and it's always willing to renegotiate terms.

**Dialogue**:
- *"Welcome, seekers. I am the Vault Keeper. All transactions are final, all contracts binding."*
- *"You wish access to the treasury? Acceptable. The price is... let me see... your firstborn child? No? Then perhaps a decade of service?"*
- *"Information about Strahd? Oh, I have that. The price is accepting ONE dark gift. Any gift. Your choice."*
- *"You may leave peacefully... after you've fulfilled our arrangement. Breaking contracts has consequences."*
- *"The vestiges are generous employers. Serve them faithfully, and riches beyond imagination await."*

**Quest Hooks**:
- The arcanaloth knows Strahd's current weaknesses and the locations of artifacts (Tarokka items)
- It will trade information for service: accept a dark gift, deliver a message to Strahd, retrieve an item from outside the temple
- It guards immense treasure but drives cruel bargains for access
- It might negotiate safe passage through the temple in exchange for a magical item or spell scroll

**AI Behavior Notes**:
- **Combat**: Only fights if treasure is stolen without payment or if contracts are broken. Uses invisibility and teleport to avoid melee, prefers banishment and heat metal to control battlefield.
- **Negotiation**: The arcanaloth is the ultimate deal-maker. It always honors contracts exactly as worded (with lawyer-precision exploitation of loopholes).
- **Information Broker**: It knows everything about the temple, the vestiges, Strahd's history, and the locations of powerful items. All information has a price.
- **Neutral Observer**: The arcanaloth doesn't care if the party destroys Strahd or joins him. It serves the vestiges because they pay well (in souls and arcane power).

---

### Vilnius (The Mummy Lord)
```yaml
npcId: vilnius
name: "Vilnius, High Priest of the Dark Vestiges"
type: undead
race: mummy_lord
challenge_rating: 15
role: temple_high_priest
status: dormant
location: catacombs
disposition: hostile

stats:
  ac: 17
  hp: 97
  speed: "20 ft."
  str: 18
  dex: 10
  con: 17
  int: 11
  wis: 18
  cha: 16

abilities:
  - Magic Resistance
  - Rejuvenation (reforms in 24 hours unless sacred canopic jars destroyed)
  - Rotting Fist (+9 to hit, 3d6+4 bludgeoning plus 6d6 necrotic, DC 16 Con save or cursed)
  - Dreadful Glare (DC 16 Wisdom save or frightened and paralyzed)
  - Spellcasting (6th-level cleric)
```

**Description**: Vilnius was the temple's high priest millennia ago, the most devoted servant of the dark vestiges. Even in undeath, he maintains fanatic loyalty. His chamber is a shrine to the vestiges, decorated with profane symbols and soaked in dark magic. He accepted multiple dark gifts in life, and his mummified form bears visible corruption—extra eyes, twisted limbs, mouths that whisper in dead languages.

**Dialogue** (speaks telepathically):
- *"Desecrators! You dare enter this holy place?!"*
- *"The Dark Ones shall grant you oblivion for your intrusion!"*
- *"Accept their gifts, or accept death. These are your only choices."*
- *"I have served the vestiges for ten thousand years. I shall serve ten thousand more."*

**Quest Hooks**:
- Vilnius guards the *Scroll of Tarrasque Summoning*—an artifact of world-ending power
- His chamber contains records of all dark gifts ever accepted and their consequences
- Destroying his canopic jars (hidden throughout the catacombs) prevents his rejuvenation
- His fanatic devotion provides cautionary tale about vestige corruption's ultimate cost

**AI Behavior Notes**:
- **Combat**: Vilnius fights to destroy intruders. Uses Dreadful Glare to paralyze, then Rotting Fist to curse victims. Casts harmful spells (Harm, Contagion) from distance.
- **Tactics**: Summons undead servants from crypts (mummies, wights). Uses lair actions to animate temple statuary.
- **Rejuvenation**: Unless canopic jars destroyed, he reforms 24 hours after death. Jars are hidden in four separate crypts (DC 18 Investigation to find each).
- **Treasure Guardian**: The Scroll of Tarrasque Summoning is too dangerous for casual access. Vilnius exists as final guardian preventing its misuse.

---

## Minor NPCs / Creatures

### Flameskulls (Guardians)
```yaml
npcId: amber_temple_flameskulls
name: "Temple Flame skulls"
type: undead
challenge_rating: 4
count: 6
role: magical_guardians
location: scattered_throughout_temple
disposition: hostile
```

**Description**: Floating skulls wreathed in green flame patrol the temple corridors. Created by the original builders as eternal guardians, they attack intruders on sight. Each flameskull retains fragments of the wizard it once was—sometimes muttering spell incantations or arcane theorems between attacks.

**AI Behavior**: Attack on sight unless Exethanter (their creator) commands otherwise. Use Fire Ray and Fireball. Rejuvenate 1 hour after destruction unless killed with holy water or dispel magic.

---

### Flesh Golems (Deactivated)
```yaml
npcId: temple_flesh_golems
name: "Temple Flesh Golems"
type: construct
challenge_rating: 5
count: 2
role: workshop_guardians
location: golem_workshop
disposition: dormant_hostile
```

**Description**: Two massive flesh golems stand motionless in alcoves. They activate if combat erupts nearby or if workshop items are disturbed. Once active, they attack all living creatures indiscriminately.

**AI Behavior**: Attack nearest living creature. Berserk trait means once damaged, they attack everyone (including each other). Immune to most magic.

---

### Wights and Mummies (Crypt Guardians)
```yaml
npcId: catacombs_undead
name: "Catacombs Undead"
type: undead
challenge_rating: 3-5
count: 12
role: crypt_guardians
location: catacombs
disposition: hostile
```

**Description**: The frozen corpses of wizards who built the temple, risen as wights and mummies. They guard the catacombs and Vilnius's chamber.

**AI Behavior**: Attack intruders. Mummies use Rotting Fist, wights drain life. Wights are intelligent enough to use tactics; mummies just attack closest target.

---

## The Vestiges (Non-Combat NPCs)

The vestiges are trapped entities that communicate telepathically. They cannot physically manifest but offer dark gifts:

### Vampyr (Most Powerful)
**Offer**: Become a true vampire with all powers and none of Strahd's curse limitations.
**Price**: Lose your soul to serve Vampyr's cosmic agenda. Become a rival to Strahd.

### Seriach, Talos, Yrrga, Savnok (See Description.md)
Each offers specific mechanical benefits with physical/narrative costs.

### Others (8 Additional Vestiges)
Each chamber contains different vestiges offering unique dark gifts. All follow pattern: significant power-up, severe consequence.

---

## Notes for DM

**Exethanter's Role**: He's the tragic center of the temple. Helping him regain memories creates rich roleplay opportunities and provides crucial lore. Alternatively, he's a CR 14 boss fight if provoked.

**Arcanaloth Negotiations**: This NPC creates moral dilemmas. Players can gain massive advantages (information, treasure, safe passage) by accepting devil's bargains. How far will they compromise?

**Vilnius**: The CR 15 mummy lord is optional boss for high-level parties seeking the Tarrasque scroll. His rejuvenation mechanic creates multi-stage challenge (destroy canopic jars first).

**Flameskull Patrol Patterns**: Space these out to avoid overwhelming the party with multiple CR 4 encounters simultaneously.
