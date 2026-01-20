# Abbey of St. Markovia - Items

## Religious Artifacts

### Holy Symbol of St. Markovia
- **itemId**: `holy_symbol_st_markovia`
- **Name**: Holy Symbol of St. Markovia
- **Location**: Main hall altar or Abbot's quarters
- **Description**: Silver sunburst pendant worn by the order's founder. Still radiates faint divine energy despite the abbey's corruption.
- **Category**: equipment
- **Properties**: Functions as holy symbol for clerics/paladins, grants +1 to saving throws vs undead while worn
- **Value**: 150 gp
- **Hidden**: false

---

### Religious Texts Collection
- **itemId**: `abbey_religious_texts`
- **Name**: Collection of Holy Texts
- **Location**: Abbot's quarters, scattered throughout
- **Description**: Books on theology, divine magic, healing arts. Some pages marked with the Abbot's notes showing his descent into madness—early entries are orthodox, later entries justify his experiments as "divine mercy."
- **Category**: treasure
- **Value**: 200 gp as collection
- **Hidden**: false
- **Lore Value**: Reading these provides insight into Abbot's fall

---

## Surgical and Experimental Equipment

### Abbot's Surgical Tools
- **itemId**: `abbot_surgical_tools`
- **Name**: Set of Surgical Instruments
- **Location**: South wing workroom
- **Description**: Scalpels, bone saws, needles, thread—all of exceptional quality. Some tools glow with faint divine magic, allowing fleshcrafting that defies natural law.
- **Category**: equipment
- **Properties**: Required for creating flesh golems (requires divine magic + Medicine proficiency DC 20)
- **Value**: 500 gp to right buyer (necromancer, mad surgeon)
- **Hidden**: false
- **Cursed**: Using these tools risks corruption (DM discretion)

---

### Preserved Organs and Body Parts
- **itemId**: `preserved_organs`
- **Name**: Jars of Preserved Specimens
- **Location**: South wing, storage rooms
- **Description**: Glass jars containing human organs, limbs, eyes—all perfectly preserved in alchemical fluid. Labels indicate which deceased villager each came from.
- **Category**: quest_item (evidence of Abbot's crimes)
- **Value**: Horrifying, not valuable except as evidence
- **Hidden**: false
- **Note**: Discovering these may trigger horror checks or alignment consequences

---

### Wedding Dress for Vasilka
- **itemId**: `vasilka_wedding_dress`
- **Name**: Exquisite Wedding Gown
- **Location**: Vasilka's room or Abbot's quest objective
- **Description**: Beautiful white dress, ornate lace, clearly expensive. If party hasn't retrieved it yet, Abbot may send them to Vallaki (Baroness Lydia Petrovna's dress) to fetch it.
- **Category**: quest_item
- **Value**: 750 gp
- **Hidden**: false if already at abbey, quest objective if not
- **Quest**: "Fetch the Perfect Wedding Dress" (if Abbot requests it)

---

## Treasure and Valuables

### Abbey Treasury
- **itemId**: `abbey_treasury`
- **Name**: Monastery Treasury
- **Location**: Abbot's quarters or catacombs (hidden)
- **Description**: Donations and wealth accumulated by the Order of St. Markovia over centuries. Contains coinage, gems, and minor magic items.
- **Contents**:
  - 800 gp, 400 sp, 300 cp
  - 10 gems (50 gp each)
  - Potion of Greater Healing x3
  - +1 Mace (holy symbol engraved)
  - Spell scroll (Lesser Restoration)
- **Category**: treasure
- **Hidden**: true
- **DC**: 15 Investigation to find hidden compartment

---

### Saint's Bones
- **itemId**: `st_markovia_bones`
- **Name**: Bones of St. Markovia
- **Location**: Catacombs (sarcophagus)
- **Description**: Skeletal remains of the order's founder, St. Markovia. Radiate gentle divine presence. Can be used as relic for divine spells or returned to proper burial.
- **Category**: quest_item / treasure
- **Properties**: While carrying, grant resistance to necrotic damage
- **Hidden**: false (in marked sarcophagus)
- **Respect**: Desecrating these is evil act, may have consequences

---

## Mongrelfolk Possessions

### Otto's Treasures
- **itemId**: `otto_treasures`
- **Name**: Otto's Hidden Collection
- **Location**: North wing, Otto's cell (under floorboard)
- **Description**: Sad collection of "treasures" Otto has scavenged—shiny buttons, smooth stones, a cracked mirror, and one gold coin he's never spent.
- **Value**: <1 gp sentimental only
- **Hidden**: true
- **DC**: 12 Investigation
- **Note**: Taking this from Otto is cruel; he has so little

---

### Mongrelfolk Crafts
- **itemId**: `mongrelfolk_crafts`
- **Name**: Simple Handicrafts
- **Location**: North wing common areas
- **Description**: Crude dolls, woven baskets, carved wooden figures—made by mongrelfolk during what little free time they have. Evidence of humanity persisting despite their forms.
- **Value**: Negligible
- **Hidden**: false
- **Emotional Impact**: Reinforces tragedy of mongrelfolk's condition

---

## Potential Legendary Artifact

### Tarokka Reading Dependent
- **Notes**: If Tarokka reading places a legendary artifact (Sunsword, Holy Symbol of Ravenkind, Tome of Strahd) at the Abbey, possible locations:
  - **Abbot's quarters** (locked chest)
  - **Catacombs** (hidden with St. Markovia's remains)
  - **Bell tower** (concealed in bell housing)
  - **Vasilka's possession** (the Abbot gave it to her as part of bride preparation)

**Implementation**: Add specific artifact entry if Tarokka reading determines Abbey as location (Story 4-16).

---

## Consumables

### Healing Draughts
- **itemId**: `abbey_healing_draughts`
- **Name**: Monastery Healing Potions
- **Location**: Storage rooms, Abbot's quarters
- **Count**: 5 potions of healing
- **Description**: Traditional healing potions made by the order in better days. Still potent.
- **Category**: consumable
- **Value**: 50 gp each

---

### Alchemical Supplies
- **itemId**: `abbey_alchemy_supplies`
- **Name**: Alchemical Equipment and Reagents
- **Location**: South wing workroom
- **Description**: Beakers, burners, vials of chemicals and reagents used in preservation and experimentation.
- **Category**: equipment
- **Value**: 150 gp as lot
- **Uses**: Can be used for crafting potions or alchemical items (requires proficiency)

---

## Notes

- Many items here have ethical weight—using Abbot's surgical tools, taking mongrelfolk possessions, desecrating saint's bones
- Party's choices regarding these items reflect character alignment and may have consequences
- Abbot may offer items as rewards for tasks
- Treasure is modest—abbey's real "wealth" is in knowledge and the Abbot's abilities
