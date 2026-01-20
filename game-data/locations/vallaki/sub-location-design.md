# Vallaki Sub-Location Design Document

This document maps the Town of Vallaki's key locations (from Curse of Strahd module areas N1-N9 and related) to logical sub-location folders for implementation.

## Sub-Location Organization Strategy

Unlike Castle Ravenloft (60+ rooms requiring 12 sub-locations), Vallaki is a medium-sized town with 7-10 key areas. Each sub-location represents 1-3 related buildings or areas, organized by function and narrative importance.

**Total Locations to Implement:** 7 sub-locations minimum (per AC-3)

---

## Sub-Location 1: Church of St. Andral
**Folder:** `church-of-st-andral/`
**Module Areas:** N1 (Church interior, crypt, bell tower)
**Room Count:** 3 areas

**Key Features:**
- Father Lucian Petrovich's church and residence
- St. Andral's bones (quest item, stolen)
- Sanctuary for Ireena (potential)
- Milivoj (altar boy, bones thief accomplice)
- Crypt entrance below main church

**Events:** Bones theft discovery, vampire spawn attack (St. Andral's Feast), sanctuary offering

**NPCs:** Father Lucian Petrovich, Milivoj, altar boy

**Lore Significance:** HIGH - St. Andral's bones protect entire town from undead

**Token Budget:** ~1200-1400 tokens (3 areas: main church, crypt, bell tower)

---

## Sub-Location 2: Burgomaster Mansion
**Folder:** `burgomaster-mansion/`
**Module Areas:** N3 (Baron's residence, Izek's quarters)
**Room Count:** 2 main areas

**Key Features:**
- Baron Vargas Vallakovich's residence
- Izek Strazni's quarters
- Festival planning headquarters
- Victor Vallakovich's attic workshop (optional expansion)
- Potential artifact location (Tome of Strahd)

**Events:** Baron's decrees, festival planning, Izek's search for Ireena, Victor's teleportation experiments

**NPCs:** Baron Vargas Vallakovich, Izek Strazni, Victor Vallakovich, Baroness Lydia, servant staff

**Lore Significance:** HIGH - Political power center, Izek connection to Ireena

**Token Budget:** ~1300-1500 tokens (2-3 areas: main hall, Izek's quarters, attic)

---

## Sub-Location 3: Blue Water Inn
**Folder:** `blue-water-inn/`
**Module Areas:** N2 (Inn common room, guest rooms, Rictavio's wagon)
**Room Count:** 3 areas

**Key Features:**
- Urwin Martikov's inn and quest hub
- Rictavio's guest room
- Rictavio's locked carnival wagon (tiger inside)
- Danika Dorakova (Urwin's wife, wereraven)
- Wolf hunters (Szoldar and Yevgeni)
- Potential artifact location (Sunsword via Rictavio/Van Richten)

**Events:** Rictavio identity reveal, wereraven allies, quest assignments, tiger escape

**NPCs:** Urwin Martikov, Danika Dorakova, Rictavio (Van Richten), Brom and Bray (sons), Szoldar Szoldarovich, Yevgeni Krushkin

**Lore Significance:** HIGH - Quest hub, Keeper of the Feather base, Van Richten connection

**Token Budget:** ~1400-1600 tokens (3 areas: common room, guest rooms, wagon courtyard)

---

## Sub-Location 4: Town Square
**Folder:** `town-square/`
**Module Areas:** N8 (Town square, stocks, festival grounds)
**Room Count:** 1 main area

**Key Features:**
- Central gathering place
- Festival staging area
- Public stocks for punishment
- Baron's decree podium
- Market stalls (limited)

**Events:** Weekly festivals, public executions, Baron's speeches, Strahd's arrival point

**NPCs:** Town guards, festival participants, prisoners in stocks, merchants

**Lore Significance:** MEDIUM - Social/political theater, festival events

**Token Budget:** ~1000-1200 tokens (1 large area with multiple features)

---

## Sub-Location 5: Reformation Center
**Folder:** `reformation-center/`
**Module Areas:** N7 (Baron's "rehabilitation" facility)
**Room Count:** 1-2 areas

**Key Features:**
- Political prison for "malcontents"
- Guard barracks
- Interrogation/torture area
- Cells holding "unhappy" citizens

**Events:** Prisoner rescue attempts, guard encounters, malcontent executions

**NPCs:** Guard captain, prisoners, guards

**Lore Significance:** MEDIUM - Shows Baron's tyranny, potential rescue quests

**Token Budget:** ~900-1100 tokens (1-2 areas: main cells, guard post)

---

## Sub-Location 6: Town Gates
**Folder:** `town-gates/`
**Module Areas:** N9 (East and West Gates, guard towers)
**Room Count:** 2 areas

**Key Features:**
- East Gate (toward Village of Barovia)
- West Gate (toward Krezk)
- Guard towers and inspection points
- Entry/exit control and curfew enforcement
- Confiscated goods storage

**Events:** Gate closing at sunset, entry inspections, guard encounters, escape attempts

**NPCs:** Gate guards, travelers, merchants entering/leaving

**Lore Significance:** LOW-MEDIUM - Functional area, town security

**Token Budget:** ~1000-1200 tokens (2 gates: east and west)

---

## Sub-Location 7: Coffin Maker's Shop
**Folder:** `coffin-maker-shop/`
**Module Areas:** N6 (Henrik's shop, vampire spawn nest upstairs)
**Room Count:** 2 areas

**Key Features:**
- Henrik van der Voort's coffin-making workshop
- Stolen St. Andral's bones hidden here
- 6 vampire spawn coffins upstairs (hidden)
- Trap door to upstairs nest

**Events:** Bones discovery, vampire spawn combat, Henrik's confession/death

**NPCs:** Henrik van der Voort (terrified, coerced), vampire spawn (6)

**Lore Significance:** HIGH - St. Andral's Feast quest climax location

**Token Budget:** ~1100-1300 tokens (2 areas: workshop, upstairs nest)

---

## Optional Sub-Location 8: Wachter House (Future Expansion)
**Folder:** `wachter-house/` (Not required for AC-3 minimum)
**Module Areas:** N4 (Lady Fiona Wachter's mansion)
**Room Count:** 3 areas

**Key Features:**
- Lady Fiona Wachter's residence
- Secret Strahd cult headquarters
- Séance room with dead son's spirit
- Political rival to Baron Vallakovich

**NPCs:** Lady Fiona Wachter, sons (dead/undead), servants, cultists

**Lore Significance:** MEDIUM-HIGH - Alternative political path, cult discovery

**Status:** Optional enhancement beyond AC-3 requirements

---

## Total Implementation Summary

**Minimum Required (AC-3):** 7 sub-locations
**Planned:** 7 sub-locations
**Optional:** 1 additional (Wachter House)

**Total Files to Create:**
- Parent: 6 files (complete)
- Sub-locations: 7 × 6 = 42 files
- Design doc: 1 file
- **Total: 49 files minimum**

**Estimated Token Distribution:**
- Parent Description: ~1500 tokens
- Sub-location Descriptions: 1000-1600 tokens each (~9000 tokens total)
- All within context limits (each file <2000 tokens)

**Integration Points:**
- Epic 1 LocationLoader: Nested loading (parent → sub-locations)
- Epic 2 EventScheduler: Town-wide + area-specific events
- Epic 3 CharacterManager: NPC profiles (created in Stories 4-7 to 4-10)

---

## Implementation Order

Recommended creation sequence:

1. **church-of-st-andral** - Quest-critical (St. Andral's Feast)
2. **burgomaster-mansion** - Political center, Izek/Baron
3. **blue-water-inn** - Quest hub, major NPCs
4. **town-square** - Central area, festivals
5. **coffin-maker-shop** - Quest climax location
6. **town-gates** - Functional area
7. **reformation-center** - Atmospheric/optional quests

Each sub-location follows the standard 6-file structure established in Epic 1.
