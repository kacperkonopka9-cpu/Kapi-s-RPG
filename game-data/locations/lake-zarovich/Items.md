# Lake Zarovich - Items

## Quest Items

### None
Lake Zarovich contains no specific quest items. Arabelle herself is the "quest objective" rather than a physical item.

---

## Treasure

### Submerged Ruins Treasure
```yaml
itemId: underwater_ruins_treasure
name: "Sunken Treasures"
category: treasure_cache
location: submerged_ruins
value: 500 gp
hidden: true
requires: diving_or_water_breathing

description: "Ancient ruins beneath the lake contain treasure from pre-Strahd civilization."
```

**Contents**: 300 gp in waterlogged coins, 4 gems (50 gp each), *+1 Dagger* (corroded but functional).

**Retrieval**: Requires water breathing magic or successful diving (DC 15 Athletics checks, risk of drowning).

---

### Bluto's Meager Possessions
```yaml
itemId: bluto_belongings
name: "Fisherman's Equipment"
category: mundane_items
location: bluto_boat
value: 10 gp
```

**Contents**: Fishing net, tackle, rope, gutting knife, 3 sp. Nothing valuable—Bluto is desperately poor, hence his madness.

---

### Fishing Catches (Optional)
```yaml
itemId: lake_fish
name: "Lake Fish"
category: consumable
location: lake_waters
value: 1 gp_per_fish
quantity: variable

description: "Fish can be caught with proper equipment and time. Provide food but sell poorly."
```

**Properties**: Characters can fish (DC 12 Survival check, 1 hour) to catch 1d4 fish. Provides food but minimal monetary value.

---

## Notes

Lake Zarovich is low-treasure location. Primary reward is Arabelle's rescue (Vistani alliance). Submerged ruins provide optional treasure for parties with water-breathing capabilities. Mostly a quest-focused location rather than loot dungeon.
