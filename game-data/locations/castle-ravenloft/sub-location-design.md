# Castle Ravenloft Sub-Location Architecture Design

## Overview
This document maps Castle Ravenloft's 60+ rooms (K1-K88 from Curse of Strahd) to 12 logical sub-location folders for the folder-based RPG engine. Each sub-location groups thematically related rooms to create manageable content modules.

## Design Principles
1. **Thematic Grouping**: Rooms grouped by function, theme, or narrative connection
2. **Navigational Logic**: Sub-locations reflect physical proximity and access patterns
3. **Encounter Balance**: Distribute combat, exploration, and roleplay encounters across sub-locations
4. **Token Management**: Each sub-location Description.md must be <2000 tokens
5. **Independent Validation**: Each sub-location validates as a complete location folder

## Sub-Location Mapping

### 1. entrance (Main Gates & Courtyard)
**Folder:** `castle-ravenloft/entrance/`
**Room Numbers:** K1-K7
**Theme:** Arrival and first line of defense

**Rooms:**
- K1: Front Courtyard
- K2: Center Court Gate
- K3: Servants' Entrance
- K4: Carriage House
- K5: Chapel Garden
- K6: Overlook
- K7: Entry

**Key Features:**
- Drawbridge over chasm
- Main iron-banded gates
- Gargoyle guardians
- Animated armor patrols
- First impression of castle's oppressive atmosphere

**Recommended Party Level:** 8-9

---

### 2. great-entry (Grand Entrance Hall)
**Folder:** `castle-ravenloft/great-entry/`
**Room Numbers:** K8-K10
**Theme:** Gothic grandeur and psychological intimidation

**Rooms:**
- K8: Great Entry
- K9: Guests' Hall
- K10: Dining Hall (approach)

**Key Features:**
- Towering pipe organ (plays ominously)
- High vaulted ceiling disappearing into shadow
- Tattered tapestries depicting von Zarovich victories
- Strahd often appears here to greet "guests"
- Grand staircase to upper levels

**Recommended Party Level:** 8-9

---

### 3. chapel (Desecrated Chapel)
**Folder:** `castle-ravenloft/chapel/`
**Room Numbers:** K15-K17
**Theme:** Corrupted faith and family tragedy

**Rooms:**
- K15: Chapel
- K16: North Chapel Access
- K17: South Chapel Access

**Key Features:**
- Desecrated altar (no divine magic works here)
- Tombs of King Barov and Queen Ravenovia (Strahd's parents)
- Broken holy symbols
- Oppressive unholy aura
- Potential for divine artifact placement (Holy Symbol of Ravenkind)

**Recommended Party Level:** 8-10

---

### 4. dining-hall (Banquet Hall)
**Folder:** `castle-ravenloft/dining-hall/`
**Room Numbers:** K10-K11
**Theme:** Illusory hospitality and entrapment

**Rooms:**
- K10: Dining Hall
- K11: South Archers' Post

**Key Features:**
- Long banquet table (seats 20)
- Illusory feast (turns to ash when touched)
- Strahd may dine with party (psychological warfare)
- Hidden archer posts
- Potential ambush location

**Recommended Party Level:** 8-10

---

### 5. tower-of-strahd (Study, Private Chambers, Heart of Sorrow)
**Folder:** `castle-ravenloft/tower-of-strahd/`
**Room Numbers:** K20, K37, K59-K60
**Theme:** Strahd's sanctum and seat of power

**Rooms:**
- K20: Heart of Sorrow (crystal heart artifact)
- K37: Study
- K59: High Tower Peak
- K60: North Tower Peak

**Key Features:**
- Heart of Sorrow (AC 17, 50 HP, absorbs damage for Strahd)
- Strahd's spellbooks and research
- Private study with Tome of Strahd (possible artifact location)
- Commanding view of Barovia
- Heavily warded and trapped

**Recommended Party Level:** 9-10 (endgame area)

---

### 6. catacombs (Ancient Crypts & Tombs)
**Folder:** `castle-ravenloft/catacombs/`
**Room Numbers:** K84-K88
**Theme:** Death, undeath, and Strahd's final resting place

**Rooms:**
- K84: Catacombs
- K85: Sergei's Tomb (Strahd's brother)
- K86: Strahd's Coffin (final confrontation point)
- K87: Guardians
- K88: Tomb of King Barov and Queen Ravenovia

**Key Features:**
- Strahd's coffin (must be destroyed here to permanently kill him)
- Sergei's tomb (tragic love story with Tatyana/Ireena)
- Undead guardians (wights, wraiths, vampires)
- Teleportation traps
- Final battle location

**Recommended Party Level:** 10 (final encounter)

---

### 7. larders (Dungeons & Torture Chambers)
**Folder:** `castle-ravenloft/larders/`
**Room Numbers:** K72-K76
**Theme:** Imprisonment, torture, and horror

**Rooms:**
- K72: Chamberlain's Office (Rahadin)
- K73: Dungeon Hall
- K74: North Dungeon
- K75: South Dungeon
- K76: Elevator Trap

**Key Features:**
- Prison cells with captives (potential rescue NPCs)
- Torture devices (Iron Maiden, rack, braziers)
- Cyrus Belview (mongrelfolk servant)
- Elevator trap (descends to catacombs)
- Evidence of Strahd's cruelty

**Recommended Party Level:** 8-10

---

### 8. guest-quarters (Prisoner Rooms & Vampire Spawn Nests)
**Folder:** `castle-ravenloft/guest-quarters/`
**Room Numbers:** K49-K57
**Theme:** False hospitality and vampire spawn domain

**Rooms:**
- K49: Lounge
- K50: Guest Room
- K51: Guest Room
- K52: Closet (secret door)
- K53: Rooftop
- K54: Familiar Room
- K55: Element Room
- K56: Painting Room (Tatyana portrait)
- K57: Tower Roof

**Key Features:**
- Vampire spawn brides (Ludmilla, Anastrasya, Volenta)
- Escher's quarters
- Tatyana portrait (major story element)
- Lavish but decaying rooms
- Potential combat encounters

**Recommended Party Level:** 8-10

---

### 9. hall-of-bones (Giant's Skull Entrance)
**Folder:** `castle-ravenloft/hall-of-bones/`
**Room Numbers:** K67-K71
**Theme:** Macabre grandeur and guardian challenges

**Rooms:**
- K67: Hall of Bones
- K68: Guards' Quarters
- K69: Guards' Run
- K70: Kingsmen Hall
- K71: Kingsmen Quarters

**Key Features:**
- Giant's skull entrance to lower levels
- Skeletal guardians
- Animated armor patrols
- Strategic chokepoint
- Access to catacombs below

**Recommended Party Level:** 9-10

---

### 10. audience-hall (Throne Room)
**Folder:** `castle-ravenloft/audience-hall/`
**Room Numbers:** K25-K30
**Theme:** Formal power and judgment

**Rooms:**
- K25: Audience Hall
- K26: Guards' Post
- K27: King's Hall
- K28: King's Apartment (unused)
- K29: Turret Post
- K30: King's Accountant (treasury access)

**Key Features:**
- Throne of Strahd (formal encounters)
- Rahadin often present as chamberlain
- Guardians and traps
- Access to treasury
- Potential negotiation or combat location

**Recommended Party Level:** 8-10

---

### 11. treasury (Vault & Treasure Hoard)
**Folder:** `castle-ravenloft/treasury/`
**Room Numbers:** K41, K78
**Theme:** Wealth, traps, and legendary artifacts

**Rooms:**
- K41: Treasury
- K78: Brazier Room (access point)

**Key Features:**
- Massive treasure hoard (centuries of plunder)
- Magic items (potions, scrolls, weapons)
- Art objects (paintings, sculptures)
- Potential artifact location (Sunsword)
- Heavily trapped and guarded

**Recommended Party Level:** 9-10

---

### 12. overlook (High Balconies & Towers)
**Folder:** `castle-ravenloft/overlook/`
**Room Numbers:** K6, K18-K19, K46-K48, K53, K57-K60
**Theme:** Commanding views and environmental hazards

**Rooms:**
- K6: Overlook
- K18: High Tower Staircase
- K19: Grand Landing
- K46: Parapets
- K47: Portrait of Strahd
- K48: Offstair
- K53: Rooftop
- K57: Tower Roof
- K58: Tower Roof
- K59: High Tower Peak
- K60: North Tower Peak

**Key Features:**
- Commanding views of Barovia valley
- Wind and weather hazards (high altitude)
- Gargoyle encounters
- Potential combat arena (limited escape routes)
- Access to multiple tower levels

**Recommended Party Level:** 8-10

---

## Unmapped Rooms (Other Areas)
The following rooms are distributed across multiple sub-locations or serve as connectors:

**Halls & Stairs (distributed):**
- K12, K13, K14: Connecting hallways (assigned to nearest sub-location)
- K21-K24: Staircases and landings (assigned to nearest sub-location)
- K31-K36: Upper hallways (assigned to nearest sub-location)
- K38-K40: Tower access (assigned to tower-of-strahd or overlook)

**Service Areas:**
- K61-K66: Servants' areas, kitchens, storage (assigned to larders or great-entry)

**Random Encounters:**
- K77-K83: Various chambers (assigned to nearest thematic sub-location)

## Validation Checklist
- [x] All 12 sub-locations defined
- [x] Room numbers (K1-K88) mapped to sub-locations
- [x] Thematic grouping logical and consistent
- [x] Each sub-location has clear purpose and theme
- [x] Recommended party levels assigned
- [x] Key features identified for each sub-location
- [x] Design supports independent folder validation
- [x] Mapping documented for reference during Task 3 (folder creation)

## Implementation Notes for Task 3
When creating sub-location folders and content:
1. Use this document as room number reference
2. Group room descriptions within each Description.md
3. Assign NPCs based on their typical locations (per NPCs.md)
4. Create location-specific events (per Events.md)
5. Initialize state tracking (per State.md)
6. Set parent_location: "castle-ravenloft" in each metadata.yaml

## Token Budget Estimates
Based on room count per sub-location:
- entrance (7 rooms): ~1200 tokens (safe)
- great-entry (3 rooms): ~800 tokens (safe)
- chapel (3 rooms): ~900 tokens (safe)
- dining-hall (2 rooms): ~700 tokens (safe)
- tower-of-strahd (4 rooms): ~1100 tokens (safe)
- catacombs (5 rooms): ~1300 tokens (safe)
- larders (5 rooms): ~1200 tokens (safe)
- guest-quarters (9 rooms): ~1600 tokens (monitor closely)
- hall-of-bones (5 rooms): ~1200 tokens (safe)
- audience-hall (6 rooms): ~1400 tokens (safe)
- treasury (2 rooms): ~700 tokens (safe)
- overlook (11 rooms): ~1800 tokens (monitor closely)

**Action Items:** guest-quarters and overlook may need content compression to stay under 2000 token limit.

---

**Design Document Status:** Complete
**Author:** Claude Code (Sonnet 4.5)
**Date:** 2025-11-11
**Story:** 4-2-castle-ravenloft-structure (Task 2)
