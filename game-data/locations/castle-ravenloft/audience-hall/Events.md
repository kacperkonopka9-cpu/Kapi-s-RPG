# Events in Castle Ravenloft - Audience Hall

events:
  - eventId: audience_hall_strahd_holds_court
    name: "Strahd Holds Formal Court"
    trigger_type: conditional
    trigger_conditions:
      party_enters: true
      strahd_present: true
    effects:
      - type: narrative
        text: "Strahd sits on his throne, Rahadin at his side. 'Approach. State your business in my domain.'"

  - eventId: audience_hall_throne_curse
    name: "Throne Rejects Non-Strahd Sitter"
    trigger_type: conditional
    trigger_conditions:
      non_strahd_sits_on_throne: true
    effects:
      - type: custom
        description: "DC 15 Wisdom save or disadvantage on Charisma checks for 1 hour. Strahd finds this amusing if present."

  - eventId: audience_hall_guards_activate
    name: "Animated Armor Guards Attack"
    trigger_type: conditional
    trigger_conditions:
      throne_threatened: true
    effects:
      - type: combat_encounter
        monsters:
          - type: animated_armor
            count: "1d4+1"
            cr: 1
