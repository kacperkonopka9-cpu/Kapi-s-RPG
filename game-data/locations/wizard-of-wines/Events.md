# Wizard of Wines Winery - Events

## Crisis Events

### Event: Druid Siege Begins
```yaml
eventId: winery_siege_start
name: "Druids and Blights Attack the Winery"
trigger_type: date_time
trigger_conditions:
  - type: calendar_date
    date: "735-10-2"
    time: "06:00"
effects:
  - type: state_update
    locationId: wizard-of-wines
    stateChanges:
      under_siege: true
      druids_present: 3
      twig_blights: 20
      needle_blights: 12
      vineyard_damage: 30_percent
      martikovs_trapped: true
  - type: npc_location_change
    npcIds:
      - davian_martikov
      - elvir_martikov
      - stefania_martikov
    status: barricaded_inside_winery
  - type: custom
    description: "Druids from Yester Hill lead a coordinated assault on the Wizard of Wines, commanding dozens of blights to destroy the vineyard and steal the magic gems. The Martikov family barricades themselves inside the main building as the siege intensifies."
```

**Consequences**:
- Winery operations cease immediately
- Wine shipments to Vallaki, Krezk, and Village of Barovia stop
- Vineyard suffers increasing damage each day siege continues
- Martikovs running out of supplies after 3 days
- Two magic gems stolen (taken to Yester Hill and Berez)
- Creates time-sensitive rescue quest

---

### Event: Wine Shortage Crisis
```yaml
eventId: wine_shortage_begins
name: "Barovia's Wine Supply Fails"
trigger_type: conditional
trigger_conditions:
  - type: time_elapsed
    days_since_siege: 7
  - type: winery_not_rescued
    value: true
effects:
  - type: state_update
    locationId: vallaki
    stateChanges:
      wine_shortage: true
      morale: -2
      blue_water_inn_inventory: empty
  - type: state_update
    locationId: krezk
    stateChanges:
      wine_shortage: critical
      religious_ceremonies_impacted: true
      village_morale: very_low
  - type: state_update
    locationId: village-of-barovia
    stateChanges:
      wine_shortage: true
      blood_of_vine_tavern: closed
      pastry_addiction_worsening: true
  - type: custom
    description: "With no wine deliveries, Barovia's settlements suffer. Morale plummets, religious ceremonies can't be performed, and desperate citizens turn to dream pastries or other vices. The quality of life declines sharply."
```

**Consequences**:
- Settlement morale drops across Barovia
- Krezk refuses entry without wine delivery
- Increased desperation and crime
- Dream pastry addiction spreads (benefits hags at Old Bonegrinder)
- Party faces pressure from multiple sources to help

---

## Combat Events

### Event: Retake the Winery
```yaml
eventId: winery_battle
name: "Battle to Reclaim the Wizard of Wines"
trigger_type: conditional
trigger_conditions:
  - type: player_arrives_at_location
    locationId: wizard-of-wines
  - type: siege_active
    value: true
effects:
  - type: combat_encounter
    locationId: wizard-of-wines
    encounterDetails:
      name: "Siege of the Winery"
      enemies:
        - type: druid_cultist
          cr: 2
          count: 3
        - type: needle_blight
          cr: 0.25
          count: 12
        - type: twig_blight
          cr: 0.125
          count: 20
      environment: vineyard_complex
      difficulty: deadly
      waves: true
      special_mechanics:
        - blights_vulnerable_to_fire
        - druids_command_blights
        - multiple_combat_zones
        - martikovs_can_assist_if_freed
  - type: state_update
    locationId: wizard-of-wines
    stateChanges:
      combat_initiated: true
```

**Consequences**:
- Large-scale combat with multiple enemy types
- Fire-based tactics extremely effective (blights vulnerable)
- Druids control blights—defeating druids weakens coordination
- Martikov family can assist if freed from main building
- Wereraven scouts may provide aid
- Vineyard terrain provides cover and tactical options

**Tactical Notes**:
- Blights swarm in numbers—area damage crucial
- Needle blights use ranged attacks—take cover
- Druids cast Entangle, Thunderwave, and control battlefield
- Multiple combat zones: loading yard, vineyard rows, buildings
- Can be fought in sections rather than all at once

---

### Event: Winery Successfully Defended
```yaml
eventId: winery_reclaimed
name: "The Wizard of Wines is Saved"
trigger_type: conditional
trigger_conditions:
  - type: all_druids_defeated
    value: true
  - type: blights_routed
    percentage: 75
effects:
  - type: quest_resolution
    questId: reclaim_winery
    outcome: success
    rewards:
      - xp: 1200
      - wine_reward: barrel_of_purple_grapemash
  - type: state_update
    locationId: wizard-of-wines
    stateChanges:
      under_siege: false
      druids_defeated: true
      martikovs_freed: true
      winery_operational: partial
      vineyard_damage: assess_and_repair
  - type: npc_status
    npcId: davian_martikov
    status: grateful
    disposition_to_party: devoted_ally
  - type: custom
    description: "With druids defeated and blights routed, the Martikov family emerges from the winery. Davian embraces the party with tears of gratitude. The winery is saved, though repairs will take time. The family reveals their wereraven nature and offers alliance with the Keepers of the Feather."
```

**Consequences**:
- Winery operations can resume (limited capacity without all gems)
- Martikov family becomes loyal allies
- Keepers of the Feather alliance unlocked
- Access to winery as safe house
- Wine deliveries can restart
- Party earns reputation as saviors
- Davian reveals magic gem quest—gems must be recovered for full production

---

## Quest Events

### Event: Gem Recovery Quest - Yester Hill
```yaml
eventId: gem_quest_yester_hill
name: "Recover the Gem from Yester Hill"
trigger_type: conditional
trigger_conditions:
  - type: winery_reclaimed
    value: true
  - type: davian_explains_gems
    value: true
effects:
  - type: quest_trigger
    questId: recover_yester_hill_gem
    questStatus: started
    location: yester-hill
  - type: custom
    description: "Davian explains that one magic gem was taken to Yester Hill, embedded in the gulthias tree by the druids. Recovering it requires assaulting their stronghold—a dangerous mission involving more druids, blights, and possibly a massive tree construct."
```

**Consequences**:
- Opens Yester Hill location for exploration
- Difficult mid-level dungeon with CR 2-3 enemies
- Gem recovery restores Red Dragon Crush vine productivity
- Connects to broader druid/Strahd cultist storyline

---

### Event: Gem Recovery Quest - Berez
```yaml
eventId: gem_quest_berez
name: "Recover the Gem from Baba Lysaga"
trigger_type: conditional
trigger_conditions:
  - type: winery_reclaimed
    value: true
  - type: davian_explains_gems
    value: true
effects:
  - type: quest_trigger
    questId: recover_berez_gem
    questStatus: started
    location: berez-ruins
  - type: custom
    description: "The third gem was stolen by Baba Lysaga, Strahd's ancient servant, and taken to the ruins of Berez. Recovering it means confronting one of Barovia's most powerful witches—a CR 11 encounter recommended for high-level parties only."
```

**Consequences**:
- Opens Berez ruins location
- Very difficult high-level encounter (CR 11 Baba Lysaga)
- Gem recovery restores Champagne du Stompe productivity (rarest wine)
- Final gem completes set, winery returns to full operation
- Major reputation boost, Martikov eternal gratitude

---

## Wereraven Events

### Event: Keepers of the Feather Revelation
```yaml
eventId: keepers_revelation
name: "The Martikov Secret is Revealed"
trigger_type: conditional
trigger_conditions:
  - type: winery_reclaimed
    value: true
  - type: party_earned_trust
    value: true
effects:
  - type: custom
    description: "Davian takes the party aside and reveals the family secret: they are wereravens, members of a secret society called the Keepers of the Feather. For generations, they've opposed Strahd's tyranny from the shadows, using the winery as cover. The party has proven trustworthy and is invited to ally with the Keepers."
  - type: faction_alliance
    faction: keepers_of_the_feather
    status: allied
  - type: state_update
    locationId: wizard-of-wines
    stateChanges:
      keeper_alliance: true
      wereraven_identity_revealed: true
      safe_house_access: granted
```

**Consequences**:
- Party gains powerful faction ally
- Access to Keeper safe houses throughout Barovia
- Intelligence network for tracking Strahd and threats
- Wereravens will assist in future major encounters
- Connection to other Keeper locations (Blue Water Inn, Krezk lookouts)
- Davian can provide historical information about Barovia

---

## Recurring Events

### Event: Wine Production Resumes
```yaml
eventId: winery_production
name: "Wine Production Continues"
trigger_type: recurring
recurrence: monthly
times: ["01:00"]
effects:
  - type: custom
    description: "The Martikov family produces a monthly batch of wine based on how many magic gems have been recovered. Production determines how much wine is available for settlements and party rewards."
  - type: state_update
    locationId: wizard-of-wines
    stateChanges:
      monthly_production: calculated_by_gems
      inventory: updated
```

**Production Levels:**
- 0 gems: 5 barrels/month (declining to zero)
- 1 gem: 15 barrels/month (sustainable but limited)
- 2 gems: 30 barrels/month (good production)
- 3 gems: 50 barrels/month (full capacity)

---

### Event: Wine Delivery to Settlements
```yaml
eventId: wine_deliveries
name: "Martikov Wine Deliveries"
trigger_type: recurring
recurrence: weekly
times: ["08:00"]
effects:
  - type: custom
    description: "Martikov family members deliver wine to Vallaki, Krezk, and Village of Barovia. These deliveries maintain morale and provide income. Party can escort deliveries for payment or assist with logistics."
```

**Consequences**:
- Maintains settlement morale
- Generates income for Martikovs
- Party can earn delivery commissions
- Deliveries may be attacked by Strahd's forces or bandits
- Creates escort quest opportunities

---

## Environmental Events

### Event: Vineyard Restoration Progress
```yaml
eventId: vineyard_repairs
name: "Repairing Siege Damage"
trigger_type: conditional
trigger_conditions:
  - type: winery_reclaimed
    value: true
  - type: time_elapsed
    days: 1
effects:
  - type: custom
    description: "The Martikov family works tirelessly to repair siege damage. Each day, they restore sections of vineyard, replant destroyed vines, and rebuild trellises. Progress depends on number of gems recovered—more magic means faster recovery."
  - type: state_update
    locationId: wizard-of-wines
    stateChanges:
      vineyard_damage: -5_percent_per_day
      restoration_progress: increasing
```

**Recovery Timeline:**
- With 0-1 gems: 30+ days to full recovery
- With 2 gems: 15 days to full recovery
- With 3 gems: 7 days to full recovery

---

## Notes for Epic 2 Integration

All events conform to EventScheduler schema (Epic 2):
- `eventId`: Unique identifier
- `name`: Display name
- `trigger_type`: date_time, conditional, recurring
- `trigger_conditions`: Array of conditions
- `effects`: Array of effects (npc_status, state_update, combat_encounter, quest_trigger, custom)

The Wizard of Wines represents:
1. Major combat scenario with tactical complexity
2. Faction alliance opportunity (Keepers of the Feather)
3. Multi-stage quest (reclaim winery → recover gems → full restoration)
4. Economic impact on Barovia (wine shortage affects all settlements)
5. Connection point to multiple other locations (Yester Hill, Berez, Vallaki)

EventExecutor applies effects to appropriate State.md files via StateManager.
