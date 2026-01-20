# Death House - NPCs

## Primary NPCs

### Rose and Thorn Durst (Ghosts)
- **npcId**: `rose_durst`, `thorn_durst`
- **Type**: Undead (ghosts, children)
- **Age**: Appear 11 and 7 years old
- **Role**: Tragic victims, quest givers

**Personality**: Innocent, frightened, desperate for help. They don't understand they're dead. Rose protects her younger brother Thorn. Both want their parents' remains given proper burial and the monster in the basement destroyed.

**Appearance**: Translucent, pale children in old-fashioned clothing. Rose wears a tattered dress, Thorn wears shorts and a jacket. Both look malnourished and sad.

**Dialogue Snippets**:
- Rose: "Please, we need help. There's a monster in the basement. It took our baby brother Walter."
- Thorn: "Mommy and daddy won't wake up. They're in the third-floor bedroom, but they won't talk to us anymore."
- Rose: "We're not supposed to go in the basement. That's where the bad people did the bad things."

**Quest Hooks**:
- Want the "monster" (shambling mound) destroyed
- Want their parents' remains given proper burial
- Can provide hints about house layout and dangers
- If helped, they pass on peacefully; if ignored, they become hostile and possessive

**AI Behavior Notes**: Initially appear as living children outside the house, luring party inside. Inside, reveal their ghostly nature gradually. Become increasingly desperate and controlling as party tries to leave. If party helps them, they assist against the house's dangers. If betrayed, they trap the party and turn hostile.

**Full Profile**: `game-data/npcs/durst-children.yaml` (to be created in Stories 4-7 to 4-10)

---

### Gustav and Elisabeth Durst (Ghosts - Hostile)
- **npcId**: `gustav_durst`, `elisabeth_durst`
- **Type**: Undead (ghosts, cultist parents)
- **Location**: Third floor bedroom (corpses), haunt entire house

**Personality**: Proud, cruel, unrepentant. They participated in cult rituals and sacrificed their own baby. Now bound to the house, they attack anyone who threatens to expose their secrets or destroy their legacy.

**Appearance**: Spectral figures in fine noble clothing, faces twisted in rage. Gustav wears a dark suit, Elisabeth a bloodstained gown.

**AI Behavior Notes**: Attack if party disturbs their corpses or reads their letters. Use possession and telekinesis to throw objects. Can manifest anywhere in the house simultaneously.

---

## Monsters and Encounters

### Animated Armor
- **npcId**: `death_house_animated_armor`
- **Type**: Construct
- **CR**: 1
- **Count**: 4 suits in the main hall
- **Behavior**: Attack intruders attempting to leave or access certain rooms. Patrol main floor at night.

### Ghouls
- **npcId**: `death_house_ghouls`
- **Type**: Undead
- **CR**: 1
- **Count**: 5 in the dungeon
- **Behavior**: Chained in prison cells. Attack if freed or if party enters their cells. Hunger for fresh flesh.

### Specter
- **npcId**: `death_house_specter`
- **Type**: Undead
- **CR**: 1
- **Count**: 1 in the conservatory
- **Behavior**: Attacks anyone touching the dead plants. Drains life energy.

### Shadows
- **npcId**: `death_house_shadows`
- **Type**: Undead
- **CR**: 1/2
- **Count**: 3 in the dungeon
- **Behavior**: Lurk in dark corners. Attack from surprise. Strength drain attacks.

### Shambling Mound (Walter)
- **npcId**: `walter_shambling_mound`
- **Type**: Plant (animated corpse mass)
- **CR**: 5
- **Count**: 1 in ritual chamber
- **Behavior**: Boss encounter. The remains of baby Walter Durst and cult sacrifices, animated by dark magic. Guards the ritual chamber. Relentlessly pursues intruders. If destroyed, the house begins to collapse (timed escape sequence).

**Quest Impact**: Destroying this creature fulfills Rose and Thorn's quest and triggers the house's collapse. Party has limited time to escape before being buried alive.

---

## Generic NPCs

### Cult Member Spirits
- **Type**: Echoes/Visions
- **Behavior**: Spectral visions of the cult performing rituals. Don't interact, just replay past events to unsettle the party.
