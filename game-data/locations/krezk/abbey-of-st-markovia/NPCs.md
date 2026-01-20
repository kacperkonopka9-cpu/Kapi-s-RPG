# Abbey of St. Markovia - NPCs

## Primary NPCs

### The Abbot
- **npcId**: `the_abbot`
- **Name**: The Abbot
- **Type**: Celestial (Deva - fallen)
- **CR**: 15
- **Location**: Abbey upper floors, main hall, or courtyard

See parent location `krezk/NPCs.md` for full profile. Key combat abilities: flight, Angelic Weapons (radiant damage), Change Shape, healing magic, 136 HP, AC 17.

**Behavior in Abbey**: The Abbot is calm and welcoming unless party threatens Vasilka or his work. Will attempt to recruit party for tasks (fetch wedding dress, obtain materials). If combat begins, uses full deva powers without mercy.

---

## Mongrelfolk

### Otto Belview
- **npcId**: `otto_belview`
- **Name**: Otto Belview
- **Type**: Mongrelfolk (Human - transformed)
- **Role**: Abbot's chief assistant
- **Appearance**: Dog's head on human body, hunched posture, one arm longer than the other

**Personality**: Servile, desperate to please the Abbot, fears punishment. Speaks in broken sentences. Sees the Abbot as father figure and savior despite his suffering.

**Dialogue**: "Master says you help... you help, yes? Otto help too. Otto good helper."

**Behavior**: Will assist Abbot in tasks, fetch items, show party around abbey if Abbot orders it. Non-combatant unless Abbot is threatened.

---

### Zygfrek Belview
- **npcId**: `zygfrek_belview`
- **Name**: Zygfrek Belview
- **Type**: Mongrelfolk (Human - transformed)
- **Role**: Abbot's assistant, guard
- **Appearance**: Goat head, mismatched limbs, walks with severe limp

**Personality**: More aggressive than Otto. Protective of abbey and Abbot. Suspicious of outsiders. Can be hostile if party shows disrespect.

**Dialogue**: "You not belong here. Master decide if you stay or go. Or become like us."

**Behavior**: Guards abbey entrance. Will attack if party is hostile or tries to enter uninvited. Fights alongside other mongrelfolk.

---

### Vasilka
- **npcId**: `vasilka`
- **Name**: Vasilka
- **Type**: Flesh Golem (constructed)
- **CR**: 5
- **Appearance**: Stitched together from parts of deceased villagers. Eerily beautiful, uncanny valley effect.

**Personality**: Innocent, confused, childlike. Does not understand what she is or why she exists. Gentle by nature. The Abbot treats her as a perfect creation—a bride for Strahd.

**Dialogue**:
- "Why do you stare? Am I... wrong?"
- "The Abbot says I am meant for someone great. A prince. But I do not understand."
- "Do you think I am pretty? The Abbot says I must be perfect."

**Behavior**: Non-combatant unless controlled by Abbot or provoked. If freed or Abbot is killed, she becomes lost and confused. May beg party to destroy her if she realizes what she is.

**Combat**: If forced to fight (Abbot commands her or she's threatened), uses flesh golem statistics. Regenerates unless damaged by fire or magic weapons.

---

### General Mongrelfolk (10-12 total)
- **Type**: Mongrelfolk (various mutations)
- **CR**: 1/4
- **Count**: 10-12 in abbey at any given time

**Mutations**: Mix of animal heads (dog, cat, goat, pig), extra/missing limbs, malformed bodies, patchy fur, tails, etc.

**Personality**: Fearful, subservient to Abbot, pitiful. Most have human minds trapped in monstrous bodies and are aware of their condition.

**Behavior**: Perform menial tasks around abbey (cleaning, fetching, carrying). Will defend Abbot if he's attacked but not effective combatants. Flee if Abbot is defeated. If freed, most don't know what to do—they've only ever known the abbey and the Abbot's control.

**Potential for Liberation**: If party defeats Abbot without killing mongrelfolk, they can be freed. Some may integrate into Krezk society (difficult), others may need to leave Barovia entirely, some may choose death over continued existence in their forms.

---

## Encounter Notes

**Abbot Combat Encounter** (CR 15 Deadly):
- Trigger: Party attacks Abbot, destroys Vasilka, or disrupts work
- Tactics: Abbot uses flight to stay out of melee range, casts healing on self, uses Change Shape to confuse party, deals heavy radiant damage with Angelic Weapons
- Minions: May command mongrelfolk and Vasilka to assist
- Escape Clause: If reduced below 30 HP, may flee using Change Shape or flight

**Mongrelfolk Swarm** (CR 3-4 encounter):
- 8-10 mongrelfolk attack together
- Low HP, weak attacks, but numbers can overwhelm
- Flee if half are defeated

**Vasilka Combat** (CR 5):
- Only if forced by Abbot or party attacks her
- Flesh golem abilities: high HP, regeneration, immunity to many damage types
- Tragic combat—she doesn't want to fight but is compelled

---

## NPC Relationships

- **Abbot → Mongrelfolk**: Creator to creations. Views them as children he has "improved."
- **Abbot → Vasilka**: Masterwork creation. Treats with pride and care (but still as object).
- **Mongrelfolk → Abbot**: Fear, devotion, dependency. See him as god-figure.
- **Otto/Zygfrek → Vasilka**: Confused. She is like them but "better." Some jealousy mixed with pity.
- **Vasilka → Others**: Innocent confusion. Doesn't understand relationships or her role.

---

## Quest Interactions

**If Party Seeks Healing**:
- Abbot may heal Ilya or perform other miracles—for a price
- Price could be: fetch wedding dress, retrieve items, perform task for him
- Healing is genuine but comes from fallen angel—is it a blessing or curse?

**If Party Confronts Abbot**:
- Can attempt to reason with him about the immorality of his actions
- He genuinely doesn't see himself as evil—believes he's helping
- Confrontation may lead to combat or revelation about his fall

**If Party Frees Mongrelfolk**:
- Must decide what to do with them after liberation
- Some may seek revenge on Abbot
- Others may beg party to end their suffering
- A few might be salvageable with magic (Greater Restoration/Remove Curse?)
