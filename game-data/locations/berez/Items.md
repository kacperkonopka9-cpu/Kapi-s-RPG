# Berez - Items

## Quest Items

### Winery Magic Gem (Champagne du Stompe)
```yaml
itemId: winery_gem_champagne
name: "Magic Gem of Champagne du Stompe"
category: quest_item
location: baba_lysaga_hut_interior
value: priceless_to_martikovs
hidden: false
requires: defeat_baba_lysaga_or_destroy_hut
```

**Properties**: Third and final winery gem. Powers Baba Lysaga's hut. Extracting requires defeating her or destroying hut.

**Quest**: Returning to Davian Martikov completes gem recovery arc, restores full winery production, earns massive gratitude and reward (1,000 gp + permanent alliance).

---

## Treasure

### Marina's Monument Interior
```yaml
itemId: monument_treasure
name: "Hoarded Treasures"
category: treasure_cache
location: monument_hollow_interior
value: 2500 gp
hidden: true
dc_to_find: 15
```

**Contents**: 1,500 gp, 10 gems (100 gp each), *+1 Dagger*, *Potion of Greater Healing* (×3).

---

### Burgomaster's Journal
```yaml
itemId: burgomaster_journal
name: "Last Journal of Berez's Burgomaster"
category: lore_document
location: burgomaster_mansion_ruins
value: lore
hidden: true
dc_to_find: 16
```

**Contents**: Details hiding Marina from Strahd, the vampire's terrible wrath, the drowning of Berez, and the burgomaster's final curse against Strahd.

---

### Baba Lysaga's Grimoire
```yaml
itemId: baba_lysaga_spellbook
name: "Baba Lysaga's Grimoire"
category: spellbook
location: hut_interior
value: 1500 gp
requires: defeat_baba_lysaga
```

**Contents**: Spellbook containing all her prepared spells plus dark rituals for creating scarecrows and animating huts.

---

## Notes

The winery gem is primary objective (phase 3 of winery quest chain). Monument treasure is substantial but hard to find. Grimoire is valuable to wizard characters.
