# Blessed Pool - Events

### Event: Sergei's Manifestation
```yaml
eventId: sergei_manifestation
name: "Sergei's Spirit Appears"
trigger_type: conditional
trigger_conditions:
  - type: corpse_brought_to_pool
    or: ireena_visits_pool
effects:
  - type: npc_encounter
    npcId: sergei_spirit
    manifestation: true
  - type: custom
    description: "Sergei's spirit rises from the pool. Offers resurrection for worthy souls or salvation for Ireena/Tatyana."
  - type: state_update
    locationId: krezk/blessed-pool
    stateChanges:
      sergei_appeared: true
      pool_power_revealed: true
```

### Event: Resurrection at Pool
```yaml
eventId: pool_resurrection
name: "Blessed Pool Resurrection"
trigger_type: conditional
trigger_conditions:
  - type: corpse_submerged
    sergei_manifests: true
    soul_worthy: true
effects:
  - type: custom
    description: "Sergei's spirit performs resurrection. Soul returns to body, person awakens healed."
  - type: resurrection_performed
    target: specified_corpse
```

### Event: Ireena's Choice
```yaml
eventId: ireena_sergei_reunion
name: "Tatyana and Sergei Reunited"
trigger_type: conditional
trigger_conditions:
  - type: ireena_at_pool
    sergei_manifests: true
effects:
  - type: custom
    description: "Sergei offers Ireena choice: become one with him (escape Strahd forever but leave mortal world) or remain mortal. Campaign-altering decision."
  - type: quest_resolution
    questId: escort_ireena
    outcome: depends_on_choice
```
