# Krezk Sub-Location Design Document

**Date**: 2025-11-12
**Story**: 4.4 - Krezk Location
**Pattern Source**: Story 4-3 (Vallaki Location)

## Overview

The Village of Krezk requires a nested sub-location architecture to organize the mountain settlement's key areas. Following the validated pattern from Stories 4-2 (Castle Ravenloft) and 4-3 (Vallaki), Krezk will have:

- **1 parent location**: Village of Krezk (exterior, walls, general atmosphere)
- **5 minimum sub-locations**: Abbey, Burgomaster's House, Blessed Pool, Village Gates, Shrine

This design document maps Curse of Strahd content to sub-location folders and plans content distribution to keep all Description.md files under 2000 tokens.

---

## Sub-Location Mapping

### 1. Abbey of St. Markovia
**Folder**: `krezk/abbey-of-st-markovia/`
**Location Type**: building (monastery complex)
**Danger Level**: 5 (Deadly - Abbot is CR 15 deva)
**Quest Critical**: Yes

**Curse of Strahd Areas**: S1-S18 (abbey main floor, courtyard, north wing, south wing, upstairs, catacombs)

**Content Strategy**:
- **Description.md** (~1500-1800 tokens): Abbey exterior and interior overview, main hall, courtyard, quarters. The Abbey is large (18 areas in CoS) but will be grouped into single sub-location.
- **NPCs.md**: The Abbot (primary), mongrelfolk (Otto Belview, Zygfrek Belview, other mongrelfolk servants), Vasilka (flesh golem)
- **Items.md**: Religious relics, surgical tools, Abbot's personal items, mongrelfolk possessions
- **Events.md**: Abbot's experiments, Vasilka construction progress, mongrelfolk encounters, potential Abbot combat
- **State.md**: Abbey exploration progress, Abbot's disposition, Vasilka status, mongrelfolk freed/enslaved

**Rationale**: Abbey is the major dungeon location in Krezk. While CoS details 18 separate rooms, grouping them into a single sub-location with comprehensive Description.md prevents over-fragmenting the location structure. Party will explore abbey as cohesive location, not room-by-room (that level of detail can be in LLM narration).

---

### 2. Burgomaster's House
**Folder**: `krezk/burgomaster-house/`
**Location Type**: building
**Danger Level**: 1 (Safe, unless village turns hostile)
**Quest Critical**: Yes (Ilya questline)

**Curse of Strahd Areas**: Dmitri Krezkov's cottage (S3)

**Content Strategy**:
- **Description.md** (~800-1000 tokens): Stone cottage interior, main room, Ilya's sickroom, family quarters
- **NPCs.md**: Dmitri Krezkov, Anna Krezkova, Ilya Krezkov (dying), household servants if any
- **Items.md**: Family heirlooms, fine furnishings, Ilya's possessions, potential payment for party
- **Events.md**: Ilya's condition worsens, parents' grief reactions, potential resurrection attempt
- **State.md**: Ilya's health status (days remaining), parents' mental state, party's relationship with family

**Rationale**: Central quest hub. Emotionally significant location. Size is manageable for single sub-location.

---

### 3. Blessed Pool
**Folder**: `krezk/blessed-pool/`
**Location Type**: outdoor (holy spring)
**Danger Level**: 1 (Safe - protected by divine power)
**Quest Critical**: Yes (Ireena/Sergei, resurrection mechanic)

**Curse of Strahd Areas**: Pool and Shrine of the White Sun (S4)

**Content Strategy**:
- **Description.md** (~600-800 tokens): Natural pool at base of walls, crystal-clear water, surrounding area, sacred atmosphere
- **NPCs.md**: Sergei's spirit (manifests conditionally), Father Andrei (visits to bless), pilgrims
- **Items.md**: Enhanced holy water (harvestable), pilgrim offerings, potential Tarokka artifact
- **Events.md**: Sergei manifestation, resurrection attempts, Ireena/Tatyana resolution, pool blessing
- **State.md**: Pool activation status, Sergei appeared, resurrections performed, Ireena outcome

**Rationale**: Spiritually significant location. Small physical footprint but major story importance. Key location for potential campaign resolution (Ireena/Sergei reunion).

---

### 4. Village Gates
**Folder**: `krezk/village-gates/`
**Location Type**: outdoor (fortification)
**Danger Level**: 2-3 (Moderate - guards present, potential combat)
**Quest Critical**: No (but initial access point)

**Curse of Strahd Areas**: Gatehouse (S2)

**Content Strategy**:
- **Description.md** (~700-900 tokens): Fortified gatehouse structure, murder holes, gate mechanism, defensive positions, view from outside/inside
- **NPCs.md**: Boris (Gatekeeper), village guards on duty (4 guards rotating shifts)
- **Items.md**: Guard equipment (weapons, armor, crossbows), confiscated items, inspection records
- **Events.md**: Entry inspection, gate defense (if siege occurs), watch changes, potential gate assault
- **State.md**: Gate status (open/closed), current guards on duty, confiscated items, recent visitors

**Rationale**: First point of contact with Krezk. Guards control access. Potential combat location if village is attacked or party forces entry.

---

### 5. Shrine of the White Sun
**Folder**: `krezk/shrine-of-the-white-sun/`
**Location Type**: building (place of worship)
**Danger Level**: 1 (Safe - sanctuary)
**Quest Critical**: No (but culturally important)

**Curse of Strahd Areas**: Shrine (referenced with pool at S4)

**Content Strategy**:
- **Description.md** (~600-800 tokens): Simple stone shrine interior, wooden pews, altar with sunburst symbol, religious atmosphere
- **NPCs.md**: Father Andrei (primary), worshippers, occasional visiting clergy
- **Items.md**: Prayer books, incense, religious texts, donation offerings, blessed items
- **Events.md**: Morning/evening prayer services, Father Andrei's guidance, blessings, funeral rites (if Ilya dies)
- **State.md**: Recent prayers/services, Father Andrei's availability, party's relationship with clergy

**Rationale**: Represents Krezk's faith. Father Andrei's base of operations. Provides party access to minor healing, blessings, and religious lore.

---

## Additional Sub-Locations (Optional - Not Required for AC-3)

If time and scope allow after completing the 5 required sub-locations, these additional areas could be added:

### 6. Village Square (Optional)
**Folder**: `krezk/village-square/`
**Type**: outdoor
**Content**: Central gathering area, market stalls (unused), guard patrols, village well

**Rationale**: Low priority - not quest-critical. Village square is already described in parent Description.md Points of Interest. Creating separate sub-location only if needed for specific encounters.

---

## Token Budget Analysis

**Parent Location (Village of Krezk)**: ~1600-1700 tokens
- Overview, Initial Description, Return Description, Time-Based Variants (Morning, Night), Points of Interest

**Sub-Locations**:
1. Abbey of St. Markovia: ~1500-1800 tokens (large, complex)
2. Burgomaster's House: ~800-1000 tokens
3. Blessed Pool: ~600-800 tokens
4. Village Gates: ~700-900 tokens
5. Shrine of the White Sun: ~600-800 tokens

**Total Estimated Tokens**: ~5800-7000 tokens across 6 Description.md files (parent + 5 sub-locations)

**Compliance**: All individual files under 2000 token limit ✅

---

## File Structure

```
game-data/locations/krezk/
├── Description.md (parent)
├── NPCs.md (parent - major NPCs overview)
├── Items.md (parent - general village items)
├── Events.md (parent - village-wide events)
├── State.md (parent - overall village state)
├── metadata.yaml (parent - declares 5 sub-locations)
├── sub-location-design.md (this file)
│
├── abbey-of-st-markovia/
│   ├── Description.md
│   ├── NPCs.md (Abbot, mongrelfolk, Vasilka)
│   ├── Items.md
│   ├── Events.md
│   ├── State.md
│   └── metadata.yaml (parent_location: krezk)
│
├── burgomaster-house/
│   ├── Description.md
│   ├── NPCs.md (Dmitri, Anna, Ilya)
│   ├── Items.md
│   ├── Events.md
│   ├── State.md
│   └── metadata.yaml (parent_location: krezk)
│
├── blessed-pool/
│   ├── Description.md
│   ├── NPCs.md (Sergei's spirit, Father Andrei visits)
│   ├── Items.md (holy water)
│   ├── Events.md (Sergei manifestation, resurrections)
│   ├── State.md
│   └── metadata.yaml (parent_location: krezk)
│
├── village-gates/
│   ├── Description.md
│   ├── NPCs.md (Boris, guards)
│   ├── Items.md (guard equipment)
│   ├── Events.md (inspections, defense)
│   ├── State.md
│   └── metadata.yaml (parent_location: krezk)
│
└── shrine-of-the-white-sun/
    ├── Description.md
    ├── NPCs.md (Father Andrei, worshippers)
    ├── Items.md (religious items)
    ├── Events.md (services, blessings)
    ├── State.md
    └── metadata.yaml (parent_location: krezk)
```

**Total Files**: 36 (6 parent + 30 sub-location files)

---

## Content Distribution Strategy

**Parent Location Focus**:
- Village exterior, walls, overall layout
- General village atmosphere and mood
- Major NPCs (overview only, details in sub-locations)
- Village-wide events (Ilya's death, siege, wine delivery)
- Cross-location state (village trust, gates open, pool known)

**Sub-Location Focus**:
- Specific area descriptions and layouts
- Area-specific NPCs and encounters
- Local items and treasures
- Location-based events
- Granular state tracking for each area

**Avoids Duplication**: Each piece of content exists in only one place. Parent has overview, sub-locations have detail.

---

## Navigation Design

**Connections** (defined in metadata.yaml):

**Parent to Sub-Locations**:
- From main village → abbey-of-st-markovia (uphill path)
- From main village → burgomaster-house (central location)
- From main village → blessed-pool (outside walls at base)
- From main village → village-gates (primary entrance)
- From main village → shrine-of-the-white-sun (near center)

**Sub-Location Internal Connections**:
- village-gates ↔ village center ↔ burgomaster-house
- village center ↔ shrine-of-the-white-sun
- village center ↔ mountain path → abbey-of-st-markovia
- village-gates → outside walls → blessed-pool

**External Connections** (from parent):
- To Vallaki (east, 6 hours)
- To Wizard of Wines (southeast, 3 hours)
- To Werewolf Den (north, 2 hours)
- To Ruins of Berez (south, 5 hours)

---

## Implementation Order

1. ✅ Parent location (already complete)
2. Create all 5 sub-location folders with 6 files each (Task 3)
3. Author Description.md for each sub-location (Task 5)
4. Author NPCs.md for each sub-location (Task 7)
5. Author Items.md for each sub-location (Task 9)
6. Author Events.md for each sub-location (Task 11)
7. Create State.md for each sub-location (Task 13)
8. Create metadata.yaml for each sub-location (Task 15)
9. Validate all locations (Task 18)
10. Integration tests (Tasks 16, 17)

---

## References

- **Curse of Strahd Module**: Chapter 8 (Village of Krezk, S1-S18)
- **Story 4-3**: Vallaki sub-location pattern (7 sub-locations, 49 total files)
- **Story 4-2**: Castle Ravenloft nested architecture (16 sub-locations, 79 total files)
- **Epic 1 Tech Spec**: Location folder structure requirements
- **Epic 2 Tech Spec**: Event schema for conditional triggers
