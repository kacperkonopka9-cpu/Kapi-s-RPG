# Town of Vallaki - Events

## Town-Wide Events

```yaml
events:
  - eventId: festival_of_blazing_sun
    name: "Festival of the Blazing Sun"
    trigger_type: date_time
    trigger_schedule:
      frequency: weekly
      day_of_week: Sunday
      time: "10:00"
    trigger_conditions:
      baron_vallakovich_alive: true
    effects:
      - type: custom
        description: "Baron Vargas stages another mandatory festival in town square"
        narrative: "The Baron's voice booms across Vallaki, demanding all citizens gather for the Festival of the Blazing Sun. Guards patrol the streets, ensuring 'proper enthusiasm' from every resident."
      - type: state_update
        locationId: vallaki
        stateChanges:
          festivals_held: increment
          last_festival_date: current_date
      - type: state_update
        locationId: vallaki/town-square
        stateChanges:
          festival_active: true
          crowd_size: large
      - type: quest_trigger
        questId: festival_attendance_required
        status: active

  - eventId: st_andrals_feast
    name: "St. Andral's Feast"
    trigger_type: conditional
    trigger_conditions:
      st_andrals_bones_stolen: true
      bones_not_returned_within: "3 days"
    effects:
      - type: narrative
        text: "As night falls on Vallaki, an unholy scream tears through the darkness. Vampire spawn pour into the Church of St. Andral, the protective barrier shattered with the theft of the saint's bones."
      - type: combat_encounter
        monsters:
          - type: vampire_spawn
            count: 6
            cr: 5
        locationId: vallaki/church-of-st-andral
      - type: state_update
        locationId: vallaki
        stateChanges:
          st_andrals_feast_triggered: true
          town_panic_level: 5
          father_lucian_status: endangered
      - type: state_update
        locationId: vallaki/church-of-st-andral
        stateChanges:
          church_desecrated: true
          sanctuary_broken: true
          father_lucian_fate: determined_by_combat
      - type: quest_trigger
        questId: st_andrals_feast_aftermath
        status: active

  - eventId: strahd_visits_vallaki
    name: "Strahd Visits Vallaki"
    trigger_type: conditional
    trigger_conditions:
      ireena_in_vallaki: true
      strahd_aware_of_location: true
      party_has_defied_strahd: true
    effects:
      - type: custom
        description: "Count Strahd von Zarovich arrives in Vallaki to reclaim Ireena"
        narrative: "The temperature drops suddenly. Mist rolls through the streets despite the walls. And then he appears—Count Strahd von Zarovich, master of Castle Ravenloft, standing in the town square as if he owns it. Because, in truth, he does."
      - type: npc_status
        npcId: strahd_von_zarovich
        status: present
        location: vallaki/town-square
      - type: state_update
        locationId: vallaki
        stateChanges:
          strahd_present: true
          town_panic_level: 5
          gates_closed: true
      - type: custom
        description: "Strahd confronts the party about Ireena"
        options:
          - surrender_ireena
          - refuse_and_face_combat
          - negotiate_alternative

  - eventId: baron_executes_malcontent
    name: "Baron Executes a Malcontent"
    trigger_type: conditional
    trigger_conditions:
      town_panic_level: ">3"
      baron_vallakovich_alive: true
    effects:
      - type: narrative
        text: "The Baron, desperate to restore 'happiness' to Vallaki, orders a public execution in the town square. 'This malcontent's negativity poisoned our joy!' he shouts to the assembled crowd. 'Let this be a lesson to all!'"
      - type: combat_encounter
        encounterId: baron_guards_execution
        optional: true
        description: "Players can intervene to save the condemned, triggering combat with Izek and guards"
      - type: state_update
        locationId: vallaki
        stateChanges:
          baron_reputation: decrease
          town_panic_level: increment_or_decrease
      - type: quest_trigger
        questId: rebellion_brewing
        status: active

  - eventId: vampire_spawn_patrol
    name: "Vampire Spawn Night Patrol"
    trigger_type: conditional
    trigger_conditions:
      time_of_day: night
      st_andrals_feast_triggered: true
    effects:
      - type: combat_encounter
        monsters:
          - type: vampire_spawn
            count: "1d3"
            cr: 5
        description: "After St. Andral's Feast, vampire spawn occasionally patrol Vallaki's streets at night"
        chance: 30
      - type: state_update
        locationId: vallaki
        stateChanges:
          vampire_spawn_sighted: true
          curfew_enforcement: strict

  - eventId: town_gates_close
    name: "Town Gates Close at Sunset"
    trigger_type: date_time
    trigger_schedule:
      frequency: daily
      time: sunset
    effects:
      - type: state_update
        locationId: vallaki/town-gates
        stateChanges:
          gates_closed: true
          guard_doubled: true
      - type: narrative
        text: "As the sun sets, Vallaki's gates slam shut with a heavy thud. Guards bar the entrances from inside, their faces grim. No one enters or leaves Vallaki after dark—not if they value their lives."

  - eventId: festival_failure_aftermath
    name: "Festival Failure - Baron's Wrath"
    trigger_type: conditional
    trigger_conditions:
      festival_disrupted: true
      baron_vallakovich_alive: true
    effects:
      - type: narrative
        text: "The Baron flies into a rage, screaming about saboteurs and malcontents. Izek's club swings freely, and the Reformation Center fills with 'offenders' who failed to celebrate enthusiastically enough."
      - type: state_update
        locationId: vallaki
        stateChanges:
          baron_mood: manic_rage
          reformation_center_prisoners: increased
          town_morale: decreased
      - type: custom
        description: "Baron may target party as scapegoats if they're present"
```
