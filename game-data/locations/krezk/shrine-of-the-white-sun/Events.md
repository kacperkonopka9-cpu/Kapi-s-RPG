# Shrine of the White Sun - Events

### Event: Morning Prayer Service
```yaml
eventId: morning_prayers
name: "Dawn Prayer Service"
trigger_type: recurring
recurrence: daily
time: "06:00"
effects:
  - type: custom
    description: "Villagers gather for morning prayers. Father Andrei leads service. Party can attend for morale boost and village integration."
  - type: atmosphere
    mood: hopeful_desperate
```

### Event: Evening Prayer Service
```yaml
eventId: evening_prayers
name: "Dusk Prayer Service"
trigger_type: recurring
recurrence: daily
time: "18:00"
effects:
  - type: custom
    description: "Evening prayers before night falls. More desperate than morning service. Villagers reluctant to leave sanctuary of shrine."
  - type: atmosphere
    mood: fearful
```

### Event: Father Andrei's Blessing
```yaml
eventId: father_andrei_blessing
name: "Priest Offers Blessing"
trigger_type: conditional
trigger_conditions:
  - type: party_requests_blessing
    village_trust: minimum_1
effects:
  - type: custom
    description: "Father Andrei blesses party. Grants +1 to saving throws for 24 hours."
  - type: buff_applied
    duration: 24_hours
    effect: save_bonus_1
```

### Event: Funeral Rites (if Ilya dies)
```yaml
eventId: ilya_funeral
name: "Funeral for Ilya Krezkov"
trigger_type: conditional
trigger_conditions:
  - type: npc_status
    npcId: ilya_krezkov
    status: dead
effects:
  - type: custom
    description: "Father Andrei performs funeral service for Ilya. Entire village attends. Dmitri and Anna are devastated. Solemn, tragic event."
  - type: state_update
    locationId: krezk/shrine-of-the-white-sun
    stateChanges:
      funeral_held: true
      village_mourning: true
```

### Event: Crisis of Faith Conversation
```yaml
eventId: andrei_faith_crisis
name: "Father Andrei's Private Doubts"
trigger_type: conditional
trigger_conditions:
  - type: party_speaks_with_andrei
    trust_level: high
    private_setting: true
effects:
  - type: custom
    description: "Father Andrei confides his crisis of faith. Questions if Morninglord hears prayers in this cursed land. Seeks reassurance or guidance from party."
  - type: character_development
    npcId: father_andrei
    revealed: true_feelings
```
