# Coffin Maker's Shop - Events

```yaml
events:
  - eventId: bones_discovered_here
    name: "Discovery of St. Andral's Bones"
    trigger_type: conditional
    trigger_conditions:
      workbench_searched: true
      investigation_check: 15
    effects:
      - type: narrative
        text: "Your fingers find the hidden catch. A false panel slides open, revealing a cloth-wrapped bundle. Inside: ancient bones, still radiating faint holy energy. St. Andral's bones—here, in a coffin maker's workshop."
      - type: quest_update
        quest: "st_andrals_bones_quest"
        status: "bones_located"
      - type: state_update
        locationId: church-of-st-andral
        stateChanges:
          bones_location_known: true
      - type: state_update
        stateChanges:
          bones_discovered: true
          henrik_status: "exposed"

  - eventId: vampire_spawn_discovered
    name: "Vampire Spawn Nest Discovered"
    trigger_type: conditional
    trigger_conditions:
      upstairs_entered: true
    effects:
      - type: combat_encounter
        monsters:
          - type: vampire_spawn
            count: 6
            cr: 5
        difficulty: "deadly"
        flee_option: true
      - type: narrative
        text: "You ascend the stairs. The door opens to reveal a scene from nightmares: six coffins arranged in a circle, their lids open. Inside each, a pale figure begins to stir. Red eyes snap open. The vampire spawn rise."
      - type: state_update
        stateChanges:
          vampire_nest_discovered: true
          spawn_alerted: true

  - eventId: henrik_flees
    name: "Henrik Flees Town"
    trigger_type: conditional
    trigger_conditions:
      bones_discovered: true
      henrik_not_arrested: true
    effects:
      - type: narrative
        text: "Henrik van der Voort has fled Vallaki in terror, abandoning his shop and his life. Guards find his workshop empty, the door swinging open in the wind."
      - type: state_update
        stateChanges:
          henrik_status: "fled"
          shop_abandoned: true
```
