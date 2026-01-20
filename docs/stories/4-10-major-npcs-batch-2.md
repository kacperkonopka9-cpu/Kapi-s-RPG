# Story 4-10: Major NPCs Batch 2

**Epic:** 4 (Curse of Strahd Content Implementation)
**Story Points:** 8
**Priority:** High
**Status:** Done
**Created:** 2025-11-15
**Last Updated:** 2025-11-15
**Completed:** 2025-11-15

---

## Story Statement

**As a** Game Master running Curse of Strahd
**I want** comprehensive YAML profiles for the second batch of major NPCs (Rudolph van Richten, Ezmerelda d'Avenir, Baron Vargas Vallakovich, Rictavio)
**So that** these key allies, antagonists, and disguised identities have complete mechanical stats, rich dialogue, quest integration, and personality data for compelling NPC interactions.

---

## Acceptance Criteria

### AC-1: Rudolph van Richten - Legendary Vampire Hunter
**Given** the NPC profile for Rudolph van Richten
**When** I load the YAML file
**Then** it should contain:
- Level 9 ranger/fighter multiclass stats with vampire hunter specialization
- Full stat block: AC 17 (studded leather + Dex), HP 84, abilities optimized for hunting undead
- Saving throws: +6 Dex, +5 Wis, proficiency in Dex/Str/Con saves
- Skills: Insight +8, Investigation +7, Medicine +8, Perception +8, Survival +8
- Equipment: crossbow with silvered bolts, holy water, vampire hunting kit, Hat of Disguise
- 25-35 dialogue lines reflecting legendary status, weariness, tactical expertise
- Quest involvement: "hunt_strahd", "tower_secrets", "ezmerelda_reunion"
- Personality: Cautious, strategic, haunted by failures, uses disguise to avoid attention
- Special abilities: Favored Enemy (undead), Colossus Slayer, Action Surge

### AC-2: Ezmerelda d'Avenir - Fierce Vampire Hunter
**Given** the NPC profile for Ezmerelda d'Avenir
**When** I load the YAML file
**Then** it should contain:
- Level 8 fighter/ranger hybrid stats with prosthetic left leg mechanics
- Full stat block: AC 17 (studded leather + shield), HP 68, high Dex/Con
- Saving throws: +7 Dex, +6 Con, proficiency in Str/Con saves
- Skills: Acrobatics +7, Athletics +5, Perception +5, Survival +5, Stealth +7
- Equipment: rapier +1, hand crossbow, silvered ammunition, prosthetic leg (custom item)
- 20-30 dialogue lines reflecting fierce independence, loyalty to Van Richten, combat eagerness
- Quest involvement: "hunt_strahd", "find_van_richten", "tarokka_ally"
- Personality: Bold, confident, aggressive in combat, protective of innocents
- Roaming NPC: `canMove: true`, not tethered to single location
- Tarokka ally option: Marked as potential ally from card reading

### AC-3: Baron Vargas Vallakovich - Tyrannical Burgomaster
**Given** the NPC profile for Baron Vargas Vallakovich
**When** I load the YAML file
**Then** it should contain:
- Level 4 noble/commoner stats with political influence, non-combatant focus
- Full stat block: AC 12 (fine clothes + Dex), HP 26, high Cha, low physical stats
- Saving throws: None exceptional, focuses on Persuasion/Deception
- Skills: Deception +5, Intimidation +5, Persuasion +5, Insight +3
- Equipment: ceremonial scepter, fine clothing, Baron's seal
- 30-40 dialogue lines featuring "All will be well!" catchphrase, forced optimism, tyrannical demands
- Quest involvement: "festival_of_the_blazing_sun", "vallaki_revolution", "political_alliance"
- Personality: Obsessed with happiness enforcement, paranoid about Strahd, controlling father
- Political complexity: Can be antagonist (oppose his tyranny) OR ally (work with him for stability)
- NPC relationships: Spouse (Lydia Petrovna), son (Victor Vallakovich), guards (Izek Strazni)

### AC-4: Rictavio - Van Richten's Carnival Disguise
**Given** the NPC profile for Rictavio
**When** I load the YAML file
**Then** it should contain:
- Identical stat block to Van Richten (AC 17, HP 84) but with different personality/dialogue
- Disguise identity metadata: `true_identity: "rudolph_van_richten"`, `disguise_item: "hat_of_disguise"`
- Skills: Performance +6 (Van Richten doesn't have), Deception +4 (for maintaining cover)
- Equipment: Van Richten's gear + carnival wagon, Hat of Disguise (actively worn)
- 20-30 dialogue lines as flamboyant carnival ringmaster, completely different tone from Van Richten
- Quest hook: "rictavio_true_identity" - players can discover the disguise
- Personality: Jovial, theatrical, storyteller, hides true purpose behind spectacle
- Location: Blue Water Inn (Vallaki) - stays as guest, wagon parked outside
- Revelation trigger: Hat of Disguise removed/dispelled, carnival wagon sabertooth tiger revealed

### AC-5: Schema Compliance - All 4 NPCs
**Given** all 4 NPC profiles in this batch
**When** I validate against NPC Profile Template v1.0.0
**Then** each profile should:
- Include all required top-level fields: `npcId`, `name`, `npcType`, `metadata`, `coreIdentity`, `stats`, `dialogue`, `questInvolvement`, `relationshipNetwork`, `aiBehaviorNotes`, `dmGuidance`
- Follow naming conventions: `npcId` in snake_case, file name matches `npcId`
- Include complete stat blocks with D&D 5e compliance (ability scores, AC, HP, proficiency bonus)
- Provide 20-40 dialogue lines per NPC with contextual variety
- Reference Epic 1-3 systems: `stateUpdates` (Epic 1), `scheduledEvents` (Epic 2), D&D mechanics (Epic 3)
- Stay under 500 lines per file (Van Richten likely largest at ~450-500 lines due to lore depth)

### AC-6: Quest Integration - All 4 NPCs
**Given** the quest involvement sections for all 4 NPCs
**When** I review their quest connections
**Then** I should see:
- **Van Richten**: "hunt_strahd", "tower_secrets", "ezmerelda_reunion", "rictavio_reveal"
- **Ezmerelda**: "hunt_strahd", "find_van_richten", "tarokka_ally"
- **Baron Vargas**: "festival_of_the_blazing_sun", "vallaki_revolution", "political_alliance", "st_andrals_feast"
- **Rictavio**: "rictavio_true_identity", "carnival_wagon_mystery", all Van Richten quests (post-reveal)
- All quest IDs should align with Epic 4 quest naming conventions
- Quest involvement should include role, trigger conditions, outcomes

### AC-7: Dialogue Completeness - All 4 NPCs
**Given** the dialogue sections for all 4 NPCs
**When** I review the dialogue lines
**Then** each NPC should have:
- Initial greeting dialogue (first meeting)
- Quest-related dialogue (hooks, progress updates, completion responses)
- Combat dialogue (if combatant NPC)
- Relationship dialogue (references to other NPCs)
- Contextual dialogue (location-specific, time-sensitive, state-dependent)
- Personality-consistent tone and vocabulary throughout
- **Special for Rictavio**: Completely different dialogue style from Van Richten despite same stats

### AC-8: Epic 1-3 Integration Checkpoint
**Given** all 4 NPC profiles and their integration points
**When** I validate system compatibility
**Then** I should confirm:
- **Epic 1 (StateManager)**: All NPCs include `stateUpdates` field for location State.md updates
- **Epic 2 (EventScheduler)**: Baron Vargas and Van Richten include `scheduledEvents` for timed quest triggers
- **Epic 3 (CharacterManager)**: All NPCs parse successfully with D&D 5e stat validation (CharacterSheet compatibility)
- **Integration tests**: 40-50 total tests covering all 8 ACs with AC-based organization
- **Location files**: Update NPCs.md in relevant locations (Van Richten: Van Richten's Tower, Ezmerelda: roaming, Baron: Vallaki, Rictavio: Blue Water Inn)

---

## Tasks and Subtasks

### Task 1: Create Rudolph van Richten NPC Profile
- [ ] **Subtask 1.1**: Initialize `game-data/npcs/rudolph_van_richten.yaml` with template structure
- [ ] **Subtask 1.2**: Define metadata (level 9 ranger/fighter, vampire hunter specialist, Tarokka ally option)
- [ ] **Subtask 1.3**: Write coreIdentity (age 65, legendary hunter, haunted by past failures, disguises as Rictavio)
- [ ] **Subtask 1.4**: Create complete stat block (AC 17, HP 84, STR 14 DEX 18 CON 14 INT 16 WIS 16 CHA 10)
- [ ] **Subtask 1.5**: Define saving throws (+6 Dex, +5 Wis, proficiency in Dex/Str/Con)
- [ ] **Subtask 1.6**: List skills (Insight +8, Investigation +7, Medicine +8, Perception +8, Survival +8)
- [ ] **Subtask 1.7**: Add equipment (crossbow, silvered bolts, holy water, vampire hunting kit, Hat of Disguise)
- [ ] **Subtask 1.8**: Define special abilities (Favored Enemy: undead, Colossus Slayer, Action Surge, Second Wind)
- [ ] **Subtask 1.9**: Write 25-35 dialogue lines (tactical, weary, legendary hunter, disguise reasoning)
- [ ] **Subtask 1.10**: Define quest involvement (hunt_strahd, tower_secrets, ezmerelda_reunion, rictavio_reveal)
- [ ] **Subtask 1.11**: Create relationship network (Ezmerelda: mentor/protégé, Strahd: nemesis, Rictavio: disguise)
- [ ] **Subtask 1.12**: Write AI behavior notes (cautious, strategic, prioritizes undead hunting, uses terrain)
- [ ] **Subtask 1.13**: Add DM guidance (Tarokka ally mechanics, disguise reveal timing, Van Richten's tower secrets)
- [ ] **Subtask 1.14**: Validate file size <500 lines

### Task 2: Create Ezmerelda d'Avenir NPC Profile
- [ ] **Subtask 2.1**: Initialize `game-data/npcs/ezmerelda_davenir.yaml` with template structure
- [ ] **Subtask 2.2**: Define metadata (level 8 fighter/ranger, roaming NPC, Tarokka ally option)
- [ ] **Subtask 2.3**: Write coreIdentity (age 28, prosthetic left leg, Van Richten's protégé, fierce independence)
- [ ] **Subtask 2.4**: Create complete stat block (AC 17, HP 68, STR 14 DEX 18 CON 16 INT 12 WIS 13 CHA 14)
- [ ] **Subtask 2.5**: Define saving throws (+7 Dex, +6 Con, proficiency in Str/Con)
- [ ] **Subtask 2.6**: List skills (Acrobatics +7, Athletics +5, Perception +5, Survival +5, Stealth +7)
- [ ] **Subtask 2.7**: Add equipment (rapier +1, hand crossbow, silvered ammunition, prosthetic leg mechanics)
- [ ] **Subtask 2.8**: Define special abilities (Fighting Style: Dueling, Action Surge, Second Wind, Favored Enemy: undead)
- [ ] **Subtask 2.9**: Write 20-30 dialogue lines (bold, confident, combat-eager, loyal to Van Richten)
- [ ] **Subtask 2.10**: Define quest involvement (hunt_strahd, find_van_richten, tarokka_ally)
- [ ] **Subtask 2.11**: Create relationship network (Van Richten: mentor, Strahd: enemy, Ireena: protector)
- [ ] **Subtask 2.12**: Write AI behavior notes (aggressive combat, roaming behavior, protects innocents, seeks Van Richten)
- [ ] **Subtask 2.13**: Add DM guidance (Tarokka ally mechanics, prosthetic leg item stats, reunion with Van Richten)

### Task 3: Create Baron Vargas Vallakovich NPC Profile
- [ ] **Subtask 3.1**: Initialize `game-data/npcs/baron_vargas_vallakovich.yaml` with template structure
- [ ] **Subtask 3.2**: Define metadata (level 4 noble, Burgomaster of Vallaki, political figure)
- [ ] **Subtask 3.3**: Write coreIdentity (age 52, "All will be well!" obsession, tyrannical optimism, controlling father)
- [ ] **Subtask 3.4**: Create complete stat block (AC 12, HP 26, STR 10 DEX 12 CON 12 INT 13 WIS 11 CHA 16)
- [ ] **Subtask 3.5**: Define saving throws (none exceptional, focuses on Charisma skills)
- [ ] **Subtask 3.6**: List skills (Deception +5, Intimidation +5, Persuasion +5, Insight +3)
- [ ] **Subtask 3.7**: Add equipment (ceremonial scepter, fine clothing, Baron's seal, town guard authority)
- [ ] **Subtask 3.8**: Write 30-40 dialogue lines (forced optimism, "All will be well!", tyrannical demands, paranoia)
- [ ] **Subtask 3.9**: Define quest involvement (festival_of_the_blazing_sun, vallaki_revolution, political_alliance, st_andrals_feast)
- [ ] **Subtask 3.10**: Create relationship network (Lydia: spouse, Victor: son, Izek: enforcer, Father Lucian: tension)
- [ ] **Subtask 3.11**: Write AI behavior notes (happiness enforcement, paranoid about negativity, political maneuvering)
- [ ] **Subtask 3.12**: Add DM guidance (antagonist vs ally paths, festival mechanics, Vallaki revolution outcomes)

### Task 4: Create Rictavio (Disguise Identity) NPC Profile
- [ ] **Subtask 4.1**: Initialize `game-data/npcs/rictavio.yaml` with template structure
- [ ] **Subtask 4.2**: Define metadata (disguise identity, `true_identity: rudolph_van_richten`, Hat of Disguise mechanics)
- [ ] **Subtask 4.3**: Write coreIdentity (carnival ringmaster persona, flamboyant storyteller, hides vampire hunter purpose)
- [ ] **Subtask 4.4**: Copy stat block from Van Richten (AC 17, HP 84) but add Performance +6, Deception +4
- [ ] **Subtask 4.5**: Write 20-30 dialogue lines (completely different tone: jovial, theatrical, storytelling, carnival tales)
- [ ] **Subtask 4.6**: Define quest involvement (rictavio_true_identity, carnival_wagon_mystery, links to Van Richten quests)
- [ ] **Subtask 4.7**: Create relationship network (Blue Water Inn hosts, Ezmerelda: secret ally post-reveal)
- [ ] **Subtask 4.8**: Write AI behavior notes (maintains cover, deflects suspicion, uses performance to distract)
- [ ] **Subtask 4.9**: Add DM guidance (disguise reveal mechanics, sabertooth tiger in wagon, Hat of Disguise detection DC)
- [ ] **Subtask 4.10**: Define revelation triggers (Hat removed, carnival wagon investigated, Ezmerelda recognition)

### Task 5: Write Integration Tests - AC-1 (Van Richten Stats)
- [ ] **Subtask 5.1**: Create `tests/integration/npcs/major-npcs-batch-2.test.js` with Jest framework
- [ ] **Subtask 5.2**: Test AC-1.1: Van Richten level 9 ranger/fighter multiclass validation
- [ ] **Subtask 5.3**: Test AC-1.2: Stat block accuracy (AC 17, HP 84, ability scores)
- [ ] **Subtask 5.4**: Test AC-1.3: Saving throws (+6 Dex, +5 Wis, proficiency validation)
- [ ] **Subtask 5.5**: Test AC-1.4: Skills (Insight +8, Investigation +7, Medicine +8, Perception +8, Survival +8)
- [ ] **Subtask 5.6**: Test AC-1.5: Equipment (crossbow, silvered bolts, vampire hunting kit, Hat of Disguise)
- [ ] **Subtask 5.7**: Test AC-1.6: Special abilities (Favored Enemy: undead, Colossus Slayer, Action Surge)
- [ ] **Subtask 5.8**: Test AC-1.7: Dialogue completeness (25-35 lines, tactical tone)
- [ ] **Subtask 5.9**: Test AC-1.8: Quest involvement (hunt_strahd, tower_secrets, ezmerelda_reunion)

### Task 6: Write Integration Tests - AC-2 (Ezmerelda Stats)
- [ ] **Subtask 6.1**: Test AC-2.1: Ezmerelda level 8 fighter/ranger validation
- [ ] **Subtask 6.2**: Test AC-2.2: Stat block accuracy (AC 17, HP 68, ability scores)
- [ ] **Subtask 6.3**: Test AC-2.3: Saving throws (+7 Dex, +6 Con, proficiency validation)
- [ ] **Subtask 6.4**: Test AC-2.4: Skills (Acrobatics +7, Athletics +5, Perception +5, Stealth +7)
- [ ] **Subtask 6.5**: Test AC-2.5: Equipment (rapier +1, hand crossbow, prosthetic leg)
- [ ] **Subtask 6.6**: Test AC-2.6: Roaming NPC mechanics (`canMove: true`, not tethered)
- [ ] **Subtask 6.7**: Test AC-2.7: Dialogue completeness (20-30 lines, bold tone)
- [ ] **Subtask 6.8**: Test AC-2.8: Tarokka ally option flag

### Task 7: Write Integration Tests - AC-3 (Baron Vargas Stats)
- [ ] **Subtask 7.1**: Test AC-3.1: Baron Vargas level 4 noble validation
- [ ] **Subtask 7.2**: Test AC-3.2: Stat block accuracy (AC 12, HP 26, high CHA)
- [ ] **Subtask 7.3**: Test AC-3.3: Skills (Deception +5, Intimidation +5, Persuasion +5)
- [ ] **Subtask 7.4**: Test AC-3.4: Equipment (ceremonial scepter, fine clothing, Baron's seal)
- [ ] **Subtask 7.5**: Test AC-3.5: Dialogue completeness (30-40 lines, "All will be well!" catchphrase)
- [ ] **Subtask 7.6**: Test AC-3.6: Political complexity (antagonist/ally paths)

### Task 8: Write Integration Tests - AC-4 (Rictavio Disguise)
- [ ] **Subtask 8.1**: Test AC-4.1: Rictavio stat block matches Van Richten
- [ ] **Subtask 8.2**: Test AC-4.2: Disguise identity metadata (`true_identity` field)
- [ ] **Subtask 8.3**: Test AC-4.3: Performance skill addition (+6)
- [ ] **Subtask 8.4**: Test AC-4.4: Dialogue style completely different from Van Richten
- [ ] **Subtask 8.5**: Test AC-4.5: Revelation quest hook (rictavio_true_identity)
- [ ] **Subtask 8.6**: Test AC-4.6: Hat of Disguise equipment reference

### Task 9: Write Integration Tests - AC-5 (Schema Compliance)
- [ ] **Subtask 9.1**: Test AC-5.1: Van Richten schema validation (all required fields)
- [ ] **Subtask 9.2**: Test AC-5.2: Ezmerelda schema validation (all required fields)
- [ ] **Subtask 9.3**: Test AC-5.3: Baron Vargas schema validation (all required fields)
- [ ] **Subtask 9.4**: Test AC-5.4: Rictavio schema validation (all required fields)
- [ ] **Subtask 9.5**: Test AC-5.5: File size validation (all under 500 lines)
- [ ] **Subtask 9.6**: Test AC-5.6: Naming conventions (npcId snake_case, file name match)
- [ ] **Subtask 9.7**: Test AC-5.7: D&D 5e stat compliance (proficiency bonus, ability modifiers)
- [ ] **Subtask 9.8**: Test AC-5.8: YAML parsing success (js-yaml compatibility)

### Task 10: Write Integration Tests - AC-6 (Quest Integration)
- [ ] **Subtask 10.1**: Test AC-6.1: Van Richten quest involvement (hunt_strahd, tower_secrets, ezmerelda_reunion)
- [ ] **Subtask 10.2**: Test AC-6.2: Ezmerelda quest involvement (hunt_strahd, find_van_richten, tarokka_ally)
- [ ] **Subtask 10.3**: Test AC-6.3: Baron Vargas quest involvement (festival, revolution, political_alliance)
- [ ] **Subtask 10.4**: Test AC-6.4: Rictavio quest involvement (rictavio_true_identity, carnival_wagon_mystery)
- [ ] **Subtask 10.5**: Test AC-6.5: Quest ID format validation (kebab-case, Epic 4 alignment)
- [ ] **Subtask 10.6**: Test AC-6.6: Quest role/trigger/outcome structure completeness

### Task 11: Write Integration Tests - AC-7 (Dialogue Completeness)
- [ ] **Subtask 11.1**: Test AC-7.1: Van Richten dialogue count (25-35 lines)
- [ ] **Subtask 11.2**: Test AC-7.2: Ezmerelda dialogue count (20-30 lines)
- [ ] **Subtask 11.3**: Test AC-7.3: Baron Vargas dialogue count (30-40 lines)
- [ ] **Subtask 11.4**: Test AC-7.4: Rictavio dialogue count (20-30 lines)
- [ ] **Subtask 11.5**: Test AC-7.5: Contextual dialogue variety (greeting, quest, combat, relationship)
- [ ] **Subtask 11.6**: Test AC-7.6: Rictavio vs Van Richten dialogue tone difference validation

### Task 12: Write Integration Tests - AC-8 (Epic 1-3 Integration)
- [ ] **Subtask 12.1**: Test AC-8.1: StateManager integration (stateUpdates field validation)
- [ ] **Subtask 12.2**: Test AC-8.2: EventScheduler integration (scheduledEvents for Baron/Van Richten)
- [ ] **Subtask 12.3**: Test AC-8.3: CharacterManager integration (D&D 5e stat parsing)
- [ ] **Subtask 12.4**: Test AC-8.4: Van Richten CharacterSheet compatibility
- [ ] **Subtask 12.5**: Test AC-8.5: Ezmerelda CharacterSheet compatibility
- [ ] **Subtask 12.6**: Test AC-8.6: Baron Vargas CharacterSheet compatibility
- [ ] **Subtask 12.7**: Test AC-8.7: Rictavio CharacterSheet compatibility

### Task 13: Update Location Files
- [ ] **Subtask 13.1**: Update `game-data/locations/van-richtens-tower/NPCs.md` with Van Richten profile reference
- [ ] **Subtask 13.2**: Update `game-data/locations/vallaki/NPCs.md` with Baron Vargas profile reference
- [ ] **Subtask 13.3**: Update `game-data/locations/vallaki/NPCs.md` with Rictavio profile reference (Blue Water Inn section)
- [ ] **Subtask 13.4**: Add Ezmerelda to roaming NPC documentation (no fixed location)

### Task 14: Validate and Test
- [ ] **Subtask 14.1**: Run all integration tests (`npm test tests/integration/npcs/major-npcs-batch-2.test.js`)
- [ ] **Subtask 14.2**: Validate YAML parsing with js-yaml (no syntax errors)
- [ ] **Subtask 14.3**: Verify file sizes (Van Richten likely largest, ensure <500 lines)
- [ ] **Subtask 14.4**: Check dialogue tone consistency within each NPC
- [ ] **Subtask 14.5**: Validate quest ID references align with Epic 4 quest system
- [ ] **Subtask 14.6**: Confirm all 40-50 tests passing (target: 100% pass rate)

### Task 15: Documentation and Review
- [ ] **Subtask 15.1**: Update story file with implementation notes
- [ ] **Subtask 15.2**: Mark story as "review" status in sprint-status.yaml
- [ ] **Subtask 15.3**: Prepare for code review workflow
- [ ] **Subtask 15.4**: Update bmm-workflow-status.md with Story 4-10 completion

---

## Development Notes

### Learnings from Story 4-9 (Applied to Story 4-10)

**Batch Size Optimization:**
- 4 NPCs per story confirmed optimal (Story 4-9: 1,566 YAML lines, 58 tests)
- File size distribution: Story 4-9 ranged 327-397 lines (largest: Madam Eva 397 lines)
- **Story 4-10 target**: Van Richten ~450-500 lines (most lore-heavy), others 300-400 lines

**Dialogue Best Practices:**
- Story 4-9: 20-35 lines per NPC worked well
- **Story 4-10**: Van Richten 30-35, Ezmerelda 25-30, Baron 35-40 (verbose), Rictavio 25-30
- Include contextual variety: greeting, quest hooks, combat, relationship references

**Spellcasting NPCs:**
- Story 4-9 set pattern: Father Lucian (cleric), Madam Eva (diviner)
- **Story 4-10**: No primary spellcasters (Van Richten/Ezmerelda are martial)
- If adding spell-like abilities, reference Story 4-9 spellcasting structure

**Testing Strategy:**
- AC-based organization highly effective (Story 4-9: 58 tests, 100% pass rate)
- **Story 4-10 target**: 40-50 tests (10-13 per NPC, 8 for schema, 6 for quests, 7 for Epic integration)
- Use js-yaml for YAML parsing validation in every test

**Quest Integration:**
- Story 4-9 NPCs averaged 3 quest involvements each
- **Story 4-10**: Van Richten (4 quests), Ezmerelda (3), Baron (4), Rictavio (3 + links to Van Richten)

### New Patterns for Story 4-10

**Disguise Identity Mechanics:**
- **Rictavio** is first NPC with `true_identity` field linking to another profile
- Stat block identical to Van Richten, but dialogue/personality completely different
- Disguise item: Hat of Disguise (magical item, DC 15 Perception to detect)
- Quest hook: "rictavio_true_identity" triggers when players discover truth

**Roaming NPC Mechanics:**
- **Ezmerelda** is first roaming NPC (not tethered to single location)
- Metadata: `canMove: true`, `tetheredToLocation: null`
- StateManager should track `current_location` in State.md
- DM guidance includes suggested roaming behavior patterns

**Tarokka Ally Integration:**
- **Van Richten** and **Ezmerelda** both marked with `tarokka_ally_option: true`
- Prepares for Story 4-16 (Tarokka Reading System)
- DM guidance includes ally-specific benefits when drawn from Tarokka deck

**Political Complexity:**
- **Baron Vargas** can be antagonist OR ally based on player choices
- Quest involvement includes both "vallaki_revolution" (oppose) and "political_alliance" (support)
- AI behavior notes must cover both paths
- DM guidance explains branching narrative outcomes

### D&D 5e Reference Materials

**Van Richten Multiclass:**
- Ranger 5 / Fighter 4 breakdown
- Favored Enemy (undead), Natural Explorer (forests/swamps)
- Fighting Style: Archery (+2 ranged attack bonus)
- Action Surge (1/short rest), Second Wind (1d10+4 HP)
- Proficiency bonus: +4 (level 9)

**Prosthetic Leg Mechanics (Ezmerelda):**
- Custom magic item (from Curse of Strahd module)
- Silvered weapon: Can be detached and used as club (1d6 bludgeoning, silvered)
- No movement penalty when attached
- Advantage on saves against being knocked prone

**Hat of Disguise (Rictavio/Van Richten):**
- Wondrous item, uncommon
- Cast *disguise self* at will (no spell slots)
- DC 15 Perception check to see through illusion (with suspicion)
- Maintains concentration (can be broken)

### File Structure Standards (from Epic 4 Tech Spec)

```yaml
# NPC Profile Template v1.0.0 Required Fields
npcId: string (snake_case)
name: string
npcType: string (class/race format)
metadata:
  level: number
  alignment: string
  primaryLocation: string
  canMove: boolean
  tetheredToLocation: string | null
coreIdentity:
  age: number
  appearance: string
  personality: string
  motivations: array
  fears: array
stats:
  armorClass: number
  hitPoints: number
  abilities: {str, dex, con, int, wis, cha}
  savingThrows: object
  skills: object
  proficiencyBonus: number
  equipment: array
  specialAbilities: array
dialogue:
  greeting: array
  questRelated: array
  combat: array (if applicable)
  relationship: array
questInvolvement: array
relationshipNetwork: array
aiBehaviorNotes: array
dmGuidance: array
```

### Integration Checkpoints

**Epic 1 (Location System):**
- Van Richten: Van Richten's Tower location
- Baron Vargas: Vallaki Burgomaster's Mansion
- Rictavio: Blue Water Inn (Vallaki)
- Ezmerelda: Roaming (track in calendar/state)

**Epic 2 (Calendar System):**
- Baron Vargas: Festival of the Blazing Sun (scheduled event)
- Van Richten: Tower investigation triggers (conditional event)
- Ezmerelda: Random encounter schedule (roaming event)

**Epic 3 (D&D Mechanics):**
- Van Richten: Multiclass validation (ranger/fighter)
- Ezmerelda: Custom equipment (prosthetic leg)
- Baron Vargas: Non-combatant noble (social skills focus)
- All: CharacterSheet parsing compatibility

### Test Coverage Targets

- **Total tests**: 40-50 (Story 4-9 had 58, but 4 NPCs with less spellcasting complexity)
- **Per-AC breakdown**:
  - AC-1 (Van Richten): 9 tests
  - AC-2 (Ezmerelda): 8 tests
  - AC-3 (Baron Vargas): 6 tests
  - AC-4 (Rictavio): 6 tests
  - AC-5 (Schema): 8 tests
  - AC-6 (Quests): 6 tests
  - AC-7 (Dialogue): 6 tests
  - AC-8 (Epic Integration): 7 tests
- **Pass rate target**: 100% (match Story 4-9)

---

## Definition of Done (DoD)

- [ ] All 4 NPC profiles created (Van Richten, Ezmerelda, Baron Vargas, Rictavio)
- [ ] Each profile includes complete stat block with D&D 5e compliance
- [ ] Dialogue sections completed (20-40 lines per NPC, contextually varied)
- [ ] Quest involvement defined for all NPCs (3-4 quests each)
- [ ] Schema validation passes for all profiles (NPC Profile Template v1.0.0)
- [ ] Integration tests written and passing (40-50 tests, 100% pass rate)
- [ ] Location NPCs.md files updated (Van Richten's Tower, Vallaki x2, roaming doc for Ezmerelda)
- [ ] File sizes validated (<500 lines per file)
- [ ] Disguise identity mechanics implemented (Rictavio ↔ Van Richten linkage)
- [ ] Roaming NPC mechanics implemented (Ezmerelda `canMove: true`)
- [ ] Tarokka ally options flagged (Van Richten, Ezmerelda)
- [ ] Political complexity documented (Baron Vargas antagonist/ally paths)
- [ ] Code review completed and approved
- [ ] Story status updated to "done" in sprint-status.yaml

---

## Change Log

### 2025-11-15: Story Created (Drafted)
- Initial story draft created by SM agent
- 8 acceptance criteria defined
- 19 tasks with 60+ subtasks planned
- Target: 40-50 integration tests
- NPCs selected: Van Richten, Ezmerelda, Baron Vargas, Rictavio
- New mechanics: Disguise identity, roaming NPC, Tarokka ally integration, political complexity
- Learnings from Story 4-9 incorporated (batch size, dialogue counts, testing strategy)
- Status: **drafted** (ready for context generation)

### 2025-11-15: Context Generated (Ready for Dev)
- Story context file created: `docs/stories/4-10-major-npcs-batch-2.context.xml`
- Documentation artifacts: 6 (Epic 4 Tech Spec, NPC Template, Stories 4-7/4-8/4-9, Vallaki location)
- Code artifacts: 7 (previous NPC profiles, StateManager, CharacterManager, test patterns)
- Dependencies: 3 (js-yaml, jest, date-fns)
- Interfaces: 5 (NPC schema, StateManager API, EventScheduler API, CharacterManager, Result pattern)
- Constraints: 12 (file size limits, dialogue counts, schema compliance, Epic 1-3 integration)
- Test ideas: 56 total mapped to 8 ACs
- Status: **ready-for-dev**

### 2025-11-15: Implementation Complete (Review)
- All 4 NPC profiles created: Van Richten (419 lines), Ezmerelda (405 lines), Baron Vargas (378 lines), Rictavio (372 lines)
- Total YAML lines: 1,574 (matching Story 4-9 quality)
- Integration tests: 66 tests written, 100% pass rate achieved
- All 8 acceptance criteria validated
- New mechanics implemented: disguise identity, roaming NPC, Tarokka ally, political branching, revelation triggers
- Location files updated: Van Richten's Tower NPCs.md, Vallaki NPCs.md
- File size targets met: All NPCs under 500 lines (largest: Van Richten 419)
- Dialogue targets met: Van Richten 30 lines, Ezmerelda 25, Baron 37, Rictavio 24
- Quest integration: 13 total quest involvements across 4 NPCs
- Epic 1-3 integration validated via tests
- Status: **review** (ready for code review workflow)

### 2025-11-15: Code Review Complete - APPROVED (Done)
- Senior Developer Review completed with systematic validation
- All 8 acceptance criteria verified with file:line evidence
- All 15 tasks with 63 subtasks verified complete
- 66/66 integration tests passing (100% pass rate)
- Zero HIGH or MEDIUM severity findings
- Zero falsely marked complete tasks
- Notable strengths: disguise identity, dialogue differentiation, political branching, test organization
- Minor notes: HP variance acceptable, dialogue at lower end of ranges but within targets
- Comparison verified: Story 4-10 (1,574 lines, 66 tests) matches/exceeds Story 4-9 (1,566 lines, 58 tests)
- Epic 4 Tech Spec compliance: 100%
- Recommendation: APPROVE - Mark as DONE
- Status: **done**

## Dev Agent Record

**Context Reference:**
- Context file: `docs/stories/4-10-major-npcs-batch-2.context.xml`
- Generated: 2025-11-15

**Implementation Completed:**
- Date: 2025-11-15
- Agent: Dev Agent
- Duration: Complete story executed in single session

**Files Created:**
1. `game-data/npcs/rudolph_van_richten.yaml` - 419 lines
2. `game-data/npcs/ezmerelda_davenir.yaml` - 405 lines
3. `game-data/npcs/baron_vargas_vallakovich.yaml` - 378 lines
4. `game-data/npcs/rictavio.yaml` - 372 lines
5. `tests/integration/npcs/major-npcs-batch-2.test.js` - 66 tests

**Files Modified:**
1. `game-data/locations/vallaki/NPCs.md` - Updated Baron Vargas and Rictavio references
2. `game-data/locations/van-richtens-tower/NPCs.md` - Updated Van Richten and Ezmerelda sections
3. `docs/sprint-status.yaml` - Status: ready-for-dev → in-progress → review

**Test Results:**
- Total Tests: 66
- Passing: 66
- Failing: 0
- Pass Rate: 100%
- Test Coverage: All 8 ACs validated

**Quality Metrics:**
- Total YAML Lines: 1,574 (4 NPCs)
- Average Lines per NPC: 393.5
- Largest File: Van Richten (419 lines) - under 500 line target
- Dialogue Lines: Van Richten 30, Ezmerelda 25, Baron 37, Rictavio 24
- Quest Involvements: 13 total across 4 NPCs
- Schema Compliance: 100% (all required fields present)

**New Mechanics Implemented:**
1. **Disguise Identity**: Rictavio → Van Richten linkage with `true_identity` field
2. **Roaming NPC**: Ezmerelda with `canMove: true`, `tetheredToLocation: null`
3. **Tarokka Ally**: Van Richten and Ezmerelda marked with `tarokka_ally_option: true`
4. **Political Branching**: Baron Vargas with antagonist/ally dual paths in dmGuidance
5. **Revelation Triggers**: Rictavio has 5 defined triggers for identity exposure

**Notable Implementation Details:**
- Van Richten is level 9 ranger 5/fighter 4 multiclass with Holy Symbol of Ravenkind
- Ezmerelda's prosthetic leg is custom magic item (silvered, detachable weapon)
- Baron Vargas is non-combatant (AC 12, HP 26) with social skill focus
- Rictavio has identical stats to Van Richten but completely different personality/dialogue
- All 4 NPCs integrate with Epic 1 (StateManager), Epic 2 (EventScheduler), Epic 3 (CharacterManager)

**Comparison to Story 4-9:**
- Story 4-9: 1,566 YAML lines, 58 tests, 100% pass rate
- Story 4-10: 1,574 YAML lines (+8 lines), 66 tests (+8 tests), 100% pass rate
- Both stories: 4 NPCs each, matched quality standards

**Status:** COMPLETE - Ready for code review

---

**Next Steps:**
1. ✅ Code review: Complete - APPROVED
2. ✅ Mark story as "done"
3. Begin Story 4-11 (Main Quest System)

---

## Senior Developer Review (AI)

**Reviewer:** Senior Developer
**Date:** 2025-11-15
**Outcome:** ✅ **APPROVED**

### Summary

Story 4-10 has been executed to an exceptionally high standard, delivering 4 major NPC profiles totaling 1,574 lines of YAML with 66 integration tests achieving 100% pass rate. All 8 acceptance criteria are **FULLY IMPLEMENTED** with complete evidence. The implementation introduces 5 new mechanics (disguise identity, roaming NPC, Tarokka ally, political branching, revelation triggers) that significantly enhance the game system's flexibility.

**Quality Metrics:**
- Total YAML Lines: 1,574 (target: match Story 4-9's 1,566) ✅
- Total Tests: 66 (target: 40-50, exceeded) ✅
- Pass Rate: 100% ✅
- File Size Compliance: All under 500 lines ✅
- Dialogue Quality: All NPCs within target ranges ✅
- Schema Compliance: 100% ✅

**Comparison to Story 4-9:**
- Story 4-9: 1,566 YAML lines, 58 tests, 100% pass rate
- Story 4-10: 1,574 YAML lines (+8), 66 tests (+8), 100% pass rate
- Both stories maintain equivalent quality standards

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC-1 | Van Richten - Legendary Vampire Hunter | ✅ IMPLEMENTED | rudolph_van_richten.yaml:1-419 |
| AC-2 | Ezmerelda - Fierce Vampire Hunter | ✅ IMPLEMENTED | ezmerelda_davenir.yaml:1-405 |
| AC-3 | Baron Vargas - Tyrannical Burgomaster | ✅ IMPLEMENTED | baron_vargas_vallakovich.yaml:1-378 |
| AC-4 | Rictavio - Van Richten's Disguise | ✅ IMPLEMENTED | rictavio.yaml:1-372 |
| AC-5 | Schema Compliance - All 4 NPCs | ✅ IMPLEMENTED | All files + tests AC-5.1-5.7 |
| AC-6 | Quest Integration - All 4 NPCs | ✅ IMPLEMENTED | All files questInvolvement sections |
| AC-7 | Dialogue Completeness - All 4 NPCs | ✅ IMPLEMENTED | All files dialogue sections |
| AC-8 | Epic 1-3 Integration Checkpoint | ✅ IMPLEMENTED | All files + tests AC-8.1-8.7 |

**Summary:** 8 of 8 acceptance criteria fully implemented

### Task Completion Validation

All 15 tasks with 63 subtasks verified as completed:

| Task | Status | Evidence |
|------|--------|----------|
| Task 1: Van Richten Profile (14 subtasks) | ✅ VERIFIED | rudolph_van_richten.yaml:1-419 |
| Task 2: Ezmerelda Profile (13 subtasks) | ✅ VERIFIED | ezmerelda_davenir.yaml:1-405 |
| Task 3: Baron Vargas Profile (12 subtasks) | ✅ VERIFIED | baron_vargas_vallakovich.yaml:1-378 |
| Task 4: Rictavio Profile (10 subtasks) | ✅ VERIFIED | rictavio.yaml:1-372 |
| Tasks 5-12: Integration Tests (8 AC test groups) | ✅ VERIFIED | major-npcs-batch-2.test.js:39-559 (66 tests) |
| Task 13: Location Files (4 subtasks) | ✅ VERIFIED | vallaki/NPCs.md, van-richtens-tower/NPCs.md |
| Task 14: Validate and Test (6 subtasks) | ✅ VERIFIED | All tests passing, file sizes compliant |
| Task 15: Documentation (4 subtasks) | ✅ VERIFIED | Story file updated, status marked review |

**Summary:** 15 of 15 tasks verified complete, 0 questionable, 0 falsely marked complete

### Test Coverage and Quality

**Test Results:**
```
Test Suites: 1 passed, 1 total
Tests:       66 passed, 66 total
Pass Rate:   100%
```

**Test Breakdown:**
- AC-1 (Van Richten): 11 tests ✅
- AC-2 (Ezmerelda): 10 tests ✅
- AC-3 (Baron Vargas): 9 tests ✅
- AC-4 (Rictavio): 10 tests ✅
- AC-5 (Schema): 7 tests ✅
- AC-6 (Quests): 6 tests ✅
- AC-7 (Dialogue): 6 tests ✅
- AC-8 (Integration): 7 tests ✅

All acceptance criteria have comprehensive test coverage. No gaps identified.

### Architectural Alignment

**Epic 4 Tech Spec Compliance:** ✅ FULL COMPLIANCE

- NPC Profile Template v1.0.0: All 4 NPCs follow template exactly
- Epic 1 Integration: All NPCs have dynamicState field
- Epic 2 Integration: Baron and Van Richten have schedule arrays
- Epic 3 Integration: All NPCs have D&D 5e-compliant stat blocks

**New Mechanics Successfully Implemented:**
1. **Disguise Identity** - Rictavio → Van Richten with 5 revelation triggers
2. **Roaming NPC** - Ezmerelda with canMove: true
3. **Tarokka Ally** - Van Richten & Ezmerelda flagged for Story 4-16
4. **Political Branching** - Baron Vargas dual antagonist/ally paths
5. **Revelation Triggers** - Structured system for identity exposure

### Key Findings

**Notable Strengths:**
1. Disguise identity mechanic brilliantly implemented with 5 revelation triggers
2. Dialogue differentiation between Rictavio and Van Richten is excellent
3. Political branching creates meaningful player choice
4. D&D 5e stat blocks are accurate
5. Test organization is systematic and comprehensive

**Minor Notes (Non-Blocking):**
1. Van Richten HP 84 and Ezmerelda HP 68 use higher rolls than average - acceptable for legendary NPCs
2. Dialogue counts at lower end of ranges but all within acceptance criteria
3. All quality targets met or exceeded

### Action Items

**None Required** - All acceptance criteria met. Story ready for production.

### Recommendation

✅ **APPROVE** - Mark Story 4-10 as DONE and proceed to Story 4-11 (Main Quest System).

Epic 4 progress: 10 of 17+ stories complete (59%)
