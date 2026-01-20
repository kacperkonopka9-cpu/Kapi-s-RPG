# Lake Zarovich - NPCs

## Major NPCs

### Bluto Krogarov
```yaml
npcId: bluto_krogarov
name: "Bluto Krogarov"
type: humanoid
race: human
challenge_rating: 0
role: mad_fisherman
status: alive
location: boat_offshore
disposition: insane_hostile

stats:
  ac: 10
  hp: 4
  speed: "30 ft."
  str: 9
  dex: 10
  con: 10
  int: 8
  wis: 6
  cha: 6
```

**Description**: Mad fisherman who believes sacrificing Arabelle to "the lake god" will restore his fishing luck. Completely delusional, dangerous because he holds a hostage, not because he's combat-capable.

**Dialogue**:
- *"The lake demands tribute! A Vistana child for good catches!"*
- *"Stay back! The god will be angry if I don't finish the ritual!"*
- *"My nets have been empty for weeks! This is the only way!"*

**AI Behavior**: Threatens to drown Arabelle if approached. DC 13 Persuasion to talk him down. Combat causes him to release her (she sinks—must be rescued). Easily defeated (CR 0 commoner) but hostage situation creates tension.

---

### Arabelle (Hostage)
```yaml
npcId: arabelle_rescue
name: "Arabelle"
type: humanoid
race: human_vistana
challenge_rating: N/A
role: quest_npc
status: endangered
location: bluto_boat
disposition: terrified_grateful
```

**Description**: Young Vistana girl (10 years old), daughter of Luvash from Tser Pool. Kidnapped by Bluto. Bound and gagged, about to be drowned when party arrives.

**Dialogue** (if rescued):
- *"Thank you! That madman was going to kill me!"*
- *"My father will be so happy! He's been searching everywhere!"*
- *"Please, take me back to Tser Pool. I want to go home!"*

**Quest Value**: Rescuing Arabelle completes quest from Tser Pool (Story 4-5). Luvash rewards party with treasure and eternal Vistani gratitude.

---

## Minor NPCs

### Lake Monster (Optional)
```yaml
npcId: lake_zarovich_monster
name: "The Lake Lurker"
type: beast_or_undead
challenge_rating: 3-5
role: optional_encounter
location: deep_water
disposition: territorial
```

**Description**: Legends speak of a creature in the lake's depths. Could be giant catfish, aquatic undead, or nothing. DM's discretion whether to include.

**AI Behavior**: If included, attacks boats or swimmers who disturb its territory. Vulnerable to fire/radiant damage if undead.

---

### Local Fishermen (Non-Combat)
```yaml
npcId: lake_fishermen
name: "Vallaki Fishermen"
type: humanoid
role: atmosphere
location: dock
disposition: neutral
```

**Description**: Desperate villagers trying to catch fish despite poor luck. Provide information about Bluto's deteriorating state and lake rumors.

**Dialogue**:
- *"Bluto's been acting strange. Talking about lake gods and sacrifices."*
- *"Catches have been terrible. Some blame the Vistani. Bluto believes it."*
- *"I saw him take a child onto his boat this morning. Looked like one of the Vistani girls."*

---

## Notes

Lake Zarovich is primarily about Arabelle's rescue. Bluto is CR 0 but creates tension via hostage situation. Optional lake monster adds combat encounter for parties wanting more challenge. Main value is quest completion and Vistani alliance strengthening.
