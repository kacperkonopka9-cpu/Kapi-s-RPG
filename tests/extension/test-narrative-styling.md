# Curse of Strahd - Test Document

This document tests all the markdown styling features for Story 5-11.

---

## Typography Test (AC-2)

This paragraph uses **serif font** for narrative text. The line height should be 1.6-1.7 for comfortable reading. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.

### Header Scaling Test

Headers should scale: H1 (2em), H2 (1.5em), H3 (1.25em).

#### H4 Header (1.1em)

##### H5 Header (1em)

---

## NPC References (AC-3, AC-6)

The party encountered **Ireena Kolyana** at the Burgomaster's mansion. She was accompanied by **Ismark Kolyanovich**, her brother.

Later, they met **Strahd von Zarovich** himself, the dark lord of Barovia.

Other NPCs include:
- **Father Donavich** at the village church
- **Madam Eva** at Tser Pool
- **Rictavio** (secretly **Van Richten**)

---

## Item References (AC-3, AC-6)

The party discovered several magical items:
- _Sunsword_ - A legendary weapon against undead
- _Holy Symbol of Ravenkind_ - Protects against vampires
- _Tome of Strahd_ - Contains dark secrets

Mundane items: _Crossbow_, _Rope_, _Torch_

---

## Location References (AC-3)

The party traveled from [Village of Barovia] to [Castle Ravenloft].

Other locations visited:
- [Vallaki]
- [Krezk]
- [Old Bonegrinder]
- [Tser Pool Encampment]

---

## Code and Mechanics (AC-2, AC-6)

### Dice Rolls

Roll for initiative: `1d20+3`

Attack roll: `1d20+5` to hit, dealing `2d6+3` slashing damage.

Saving throw: DC 15 Constitution save or take `3d6` poison damage.

### Stat Block

```statblock
VAMPIRE SPAWN
Medium undead, neutral evil

Armor Class: 15 (natural armor)
Hit Points: 82 (11d8 + 33)
Speed: 30 ft.

STR: 16 (+3) | DEX: 16 (+3) | CON: 16 (+3)
INT: 11 (+0) | WIS: 10 (+0) | CHA: 12 (+1)

Saving Throws: Dex +6, Wis +3
Skills: Perception +3, Stealth +6
Damage Resistances: necrotic; bludgeoning, piercing, and slashing from nonmagical attacks
Senses: darkvision 60 ft., passive Perception 13
Languages: the languages it knew in life
Challenge: 5 (1,800 XP)
```

### YAML Data Block

```yaml
npc:
  name: Ireena Kolyana
  race: Human
  class: Noble
  alignment: Lawful Good
  hit_points: 14
  armor_class: 10
```

---

## Conditions (AC-6)

The fighter is **Frightened** after failing the save.

Multiple conditions: **Poisoned**, **Exhaustion** (level 2), **Restrained**

Other conditions: **Charmed**, **Paralyzed**, **Stunned**, **Blinded**

---

## Blockquotes - NPC Dialogue (AC-6)

> "Welcome to Barovia, traveler. You will find no escape from this land of mists and shadows."
>
> — **Strahd von Zarovich**

Nested quote:

> The burgomaster spoke gravely:
>
> > "My daughter is in grave danger. Strahd has visited her twice already."
>
> He paused, overcome with grief.

---

## Tables (AC-1)

| Item | Cost | Weight |
|------|------|--------|
| Longsword | 15 gp | 3 lb. |
| Leather Armor | 10 gp | 10 lb. |
| Healing Potion | 50 gp | 0.5 lb. |

---

## Lists (AC-1)

### Unordered List
- First item
- Second item
  - Nested item
  - Another nested
- Third item

### Ordered List
1. First step
2. Second step
3. Third step

### Task List
- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task

---

## Links (AC-1, AC-3)

Standard link: [VS Code Documentation](https://code.visualstudio.com/docs)

Entity links should highlight differently when they match game data.

---

## Emphasis and Highlighting (AC-6)

- **Bold text** for important terms
- *Italic text* for emphasis
- ***Bold and italic*** for critical information
- `Inline code` for mechanics
- ~~Strikethrough~~ for removed content

---

## Horizontal Rules (AC-1)

Above and below should be decorative section breaks:

---

## Contrast Test (AC-4)

This text should meet WCAG AA contrast requirements (4.5:1 ratio minimum).

The warm parchment color (#d4c4a8) on dark background (#1a1a1a) provides approximately 8.5:1 contrast ratio, well above the 4.5:1 requirement.

---

*End of test document*
