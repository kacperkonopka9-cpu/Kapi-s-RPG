# Creating Locations Guide

This guide explains how to create new locations for Kapi's RPG following the standardized folder structure and location hierarchy system.

## Table of Contents
- [Overview](#overview)
- [Folder Structure](#folder-structure)
- [Location Hierarchy System](#location-hierarchy-system)
- [Required Files](#required-files)
- [Step-by-Step Guide](#step-by-step-guide)
- [Validation](#validation)
- [Examples](#examples)

## Overview

All game locations are stored in `game-data/locations/` with a standardized structure of 6 required files. Locations can be nested using the hierarchy system to represent containment relationships (e.g., a tavern inside a village inside a region).

**Key Principles:**
- **File-First Design:** All data in human-readable markdown/YAML files
- **Git-Compatible:** Plain text files that work well with version control
- **Standardized:** Every location follows the same structure for consistent parsing
- **Hierarchical:** Locations can contain other locations (region → settlement → building → room)

## Folder Structure

```
game-data/locations/
└── [location-name]/           # kebab-case folder name
    ├── Description.md         # Narrative content
    ├── NPCs.md               # NPC data
    ├── Items.md              # Item listings
    ├── Events.md             # Event triggers
    ├── State.md              # Current state
    └── metadata.yaml         # Metadata & hierarchy
```

### Naming Convention

Location folders must use **kebab-case** (lowercase with hyphens):
- ✅ `village-of-barovia`
- ✅ `blood-of-vine-tavern`
- ✅ `castle-ravenloft`
- ❌ `VillageOfBarovia` (no CamelCase)
- ❌ `village_of_barovia` (no snake_case)
- ❌ `Village of Barovia` (no spaces)

## Location Hierarchy System

Locations are organized in a 4-level hierarchy to represent containment:

### Hierarchy Levels

| Level | Description | Example | parent_location | sub_locations |
|-------|-------------|---------|----------------|---------------|
| **region** | Top-level area | Barovia Region | `null` | Array of settlements |
| **settlement** | Village/town/city | Village of Barovia | Region ID | Array of buildings |
| **building** | Structure | Blood of the Vine Tavern | Settlement ID | Array of rooms |
| **room** | Individual room | Tavern Common Room | Building ID | Empty array `[]` |

### Hierarchy Example

```
barovia-region (level: region)
├── parent_location: null
└── sub_locations: [village-of-barovia, castle-ravenloft, tser-pool]
    │
    └─ village-of-barovia (level: settlement)
        ├── parent_location: barovia-region
        └── sub_locations: [blood-of-vine-tavern, burgomaster-mansion, church]
            │
            └─ blood-of-vine-tavern (level: building)
                ├── parent_location: village-of-barovia
                └── sub_locations: [tavern-common-room, tavern-cellar]
                    │
                    └─ tavern-common-room (level: room)
                        ├── parent_location: blood-of-vine-tavern
                        └── sub_locations: []
```

### Navigation Rules

**Two Types of Location Relationships:**

1. **Containment (Hierarchy):** Uses `parent_location` and `sub_locations`
   - Tavern is IN village (parent/child relationship)
   - Village is IN region (parent/child relationship)
   - Used for: "Where am I?" and "What's inside?"

2. **Connections (Travel):** Uses `connected_locations`
   - Village connects TO castle (peer relationship)
   - Tavern connects TO mansion (peer relationship - both in same village)
   - Used for: "Where can I go from here?"

**Example:**
- Village of Barovia `parent_location: barovia-region` (Village is INSIDE region)
- Village of Barovia `connected_locations: [castle-ravenloft, tser-pool]` (Can TRAVEL to these peer locations)

## Required Files

### 1. Description.md

**Purpose:** Narrative description of the location for LLM context

**Required Sections:**
- `## Overview` (50-100 words)
- `## Initial Description` (150-300 words for first visit)
- `## Return Description` (50-100 words for subsequent visits)
- `## Time-Based Variants`
  - `### Morning`
  - `### Night`
- `## Points of Interest` (bullet list)

**Template:** `templates/location/Description.md`

### 2. NPCs.md

**Purpose:** Define NPCs present in this location

**Structure:** Markdown with sections for each NPC
- Type, Age, Location, Status, Relationship, Quest Connection
- Description, Dialogue, Stats, AI Behavior Notes

**Template:** `templates/location/NPCs.md`

### 3. Items.md

**Purpose:** List available and hidden items

**Sections:**
- `## Available Items` (purchasable or visible)
- `## Hidden Items (Requires Investigation)` (with DC checks)

**Template:** `templates/location/Items.md`

### 4. Events.md

**Purpose:** Define events that can trigger at this location

**Sections:**
- `## Scheduled Events` (date/time triggers)
- `## Conditional Events` (condition-based triggers)
- `## Recurring Events` (repeating events)

**Template:** `templates/location/Events.md`

### 5. State.md

**Purpose:** Track current state of the location (mutable)

**Sections:**
- Last Updated, Current Date, Current Time
- Weather
- Location Status
- Changes Since Last Visit
- NPC Positions
- Active Quests

**Template:** `templates/location/State.md`

### 6. metadata.yaml

**Purpose:** Machine-readable metadata and hierarchy

**Required Fields:**
```yaml
location_name: "Full Location Name"
location_type: "Settlement/Dungeon/Wilderness/Building/Room/Region"
region: "Parent region name"
population: 0
danger_level: 1  # 1-5
recommended_level: "1-3"

# HIERARCHY FIELDS (REQUIRED)
parent_location: null  # Location ID or null for top-level
sub_locations: []      # Array of child location IDs
location_level: "settlement"  # region/settlement/building/room

# CONNECTIONS (peer locations for travel)
connected_locations:
  - name: "Connected Location"
    direction: "North"
    travel_time: "2 hours"
```

**Template:** `templates/location/metadata.yaml`

## Step-by-Step Guide

### Creating a New Location

1. **Choose Location Level**
   - Determine if this is a region, settlement, building, or room
   - Identify parent location (or null if region)

2. **Create Folder**
   ```bash
   mkdir game-data/locations/[location-name]
   ```

3. **Copy Templates**
   ```bash
   cp templates/location/* game-data/locations/[location-name]/
   ```

4. **Edit metadata.yaml First**
   - Set `location_name`, `location_type`, `location_level`
   - Set `parent_location` to parent's folder name (or `null`)
   - List child locations in `sub_locations` (or `[]` if none)
   - Define `connected_locations` for travel
   - **This establishes the hierarchy!**

5. **Populate Description.md**
   - Write immersive descriptions for each section
   - Use sensory details (sights, sounds, smells)
   - Capture atmosphere and mood

6. **Define NPCs (NPCs.md)**
   - Add all NPCs present in this location
   - Include dialogue, stats, and behavior notes

7. **Add Items (Items.md)**
   - List available items and prices
   - Add hidden items with Investigation DCs

8. **Create Events (Events.md)**
   - Define scheduled, conditional, and recurring events
   - Specify triggers, types, and effects

9. **Set Initial State (State.md)**
   - Set current date/time, weather
   - Document initial location status
   - Place NPCs in positions

10. **Validate**
    ```bash
    node scripts/validate-location.js game-data/locations/[location-name]
    ```

### Creating a Location Hierarchy

**Example: Adding Blood of the Vine Tavern to Village of Barovia**

1. **Create the tavern folder:**
   ```bash
   mkdir game-data/locations/blood-of-vine-tavern
   cp templates/location/* game-data/locations/blood-of-vine-tavern/
   ```

2. **Edit tavern's metadata.yaml:**
   ```yaml
   location_name: "Blood of the Vine Tavern"
   location_level: "building"
   parent_location: "village-of-barovia"  # Tavern is IN village
   sub_locations: ["tavern-common-room", "tavern-cellar"]  # Rooms inside
   connected_locations:
     - name: "Burgomaster's Mansion"  # Can walk to mansion (peer)
       direction: "North"
       travel_time: "5 minutes"
   ```

3. **Update parent's metadata.yaml (village-of-barovia):**
   ```yaml
   sub_locations:
     - "blood-of-vine-tavern"  # Add to village's children
     - "burgomaster-mansion"
     - "church-of-barovia"
   ```

4. **Validate both locations:**
   ```bash
   node scripts/validate-location.js game-data/locations/village-of-barovia
   node scripts/validate-location.js game-data/locations/blood-of-vine-tavern
   ```

## Validation

### Running Validation

```bash
# Validate a single location
node scripts/validate-location.js game-data/locations/village-of-barovia

# Validation checks:
# ✓ All 6 required files exist
# ✓ Files are non-empty
# ✓ Description.md has all required sections
# ✓ YAML files are readable
# ✓ metadata.yaml has all required fields
# ✓ location_level is valid (region/settlement/building/room)
# ✓ parent_location and sub_locations are properly formatted
```

### Expected Output

✅ **PASS:**
- All checks green
- Only warnings for parent location references (expected)

❌ **FAIL:**
- Missing files
- Empty files
- Missing required sections
- Invalid YAML
- Missing hierarchy fields
- Invalid location_level value

## Examples

### Example 1: Village of Barovia (Settlement)

See: `game-data/locations/village-of-barovia/`

**Hierarchy:**
- **Level:** settlement
- **Parent:** barovia-region
- **Children:** blood-of-vine-tavern, burgomaster-mansion, church-of-barovia, etc.
- **Connections:** Tser Pool, Castle Ravenloft, Svalich Wood (peer locations)

**Key Features:**
- Fully populated with Curse of Strahd content
- 4 detailed NPCs (Ireena, Ismark, Mad Mary, Father Donavich)
- Multiple events (Death of Burgomaster, Zombie Siege, Strahd's Visit)
- Hidden items requiring Investigation checks

### Example 2: Hypothetical Tavern (Building)

```yaml
# blood-of-vine-tavern/metadata.yaml
location_name: "Blood of the Vine Tavern"
location_level: "building"
parent_location: "village-of-barovia"
sub_locations: ["tavern-common-room", "tavern-cellar", "tavern-upstairs"]
connected_locations:
  - name: "Burgomaster's Mansion"
    direction: "North"
    travel_time: "5 minutes"
```

### Example 3: Hypothetical Room

```yaml
# tavern-common-room/metadata.yaml
location_name: "Tavern Common Room"
location_level: "room"
parent_location: "blood-of-vine-tavern"
sub_locations: []  # Rooms have no children
connected_locations:
  - name: "Tavern Cellar"
    direction: "Downstairs"
    travel_time: "1 minute"
```

## Checklist for New Locations

- [ ] Folder created with kebab-case name
- [ ] All 6 files created from templates
- [ ] **metadata.yaml hierarchy fields set:**
  - [ ] parent_location (null or parent ID)
  - [ ] sub_locations (array of child IDs)
  - [ ] location_level (region/settlement/building/room)
- [ ] connected_locations defined for travel
- [ ] Description.md has all required sections
- [ ] NPCs.md populated with location NPCs
- [ ] Items.md lists available and hidden items
- [ ] Events.md defines location events
- [ ] State.md reflects initial state
- [ ] Validation script passes: `node scripts/validate-location.js game-data/locations/[name]`
- [ ] If location has a parent, parent's `sub_locations` array updated

## Additional Resources

- **Templates:** `templates/location/`
- **Validation Script:** `scripts/validate-location.js`
- **Example Location:** `game-data/locations/village-of-barovia/`
- **Architecture Reference:** `docs/technical-architecture.md` §4.2
- **Tech Spec:** `docs/tech-spec-epic-1.md` AC-1

---

**Questions?** Refer to the Village of Barovia example or consult the technical architecture document.
