# Events in Castle Ravenloft - Hall of Bones

events:
  - eventId: hall_of_bones_skeletons_activate
    name: "Skeletal Guardians Animate"
    trigger_type: conditional
    trigger_conditions:
      party_enters_hall: true
    effects:
      - type: combat_encounter
        monsters:
          - type: skeleton
            count: "1d4+2"
            cr: 0.25

  - eventId: hall_of_bones_wight_reinforcements
    name: "Wight Reinforcements Arrive"
    trigger_type: conditional
    trigger_conditions:
      combat_duration_rounds: 4
    effects:
      - type: combat_encounter
        monsters:
          - type: wight
            count: "1d3"
            cr: 3
