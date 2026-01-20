# Town of Vallaki - NPCs

## Major Town Residents

### Baron Vargas Vallakovich
**NPC ID:** `baron_vargas_vallakovich`
**Type:** Human Noble
**CR:** 2
**Role:** Burgomaster of Vallaki

**Description:** A middle-aged man with wild eyes and an unnaturally wide smile. Wears expensive but garish clothing in bright colors. His manic energy and festival obsession dominate every interaction.

**Personality:** Tyrannical, delusional, paranoid. Genuinely believes his weekly festivals will break Strahd's curse. Cannot tolerate any expression of sadness or doubt. Punishes "malcontents" severely.

**Dialogue Snippets:**
- "Another festival! Another triumph! Surely THIS will be the one that brings true happiness to Vallaki!"
- "Malcontents! Everywhere I look, malcontents! Don't they understand we must ALL be happy if we're to defeat the devil Strahd?"
- "Izek, deal with that frown. I won't have negativity ruining our celebration!"

**Quest Involvement:** Festival of the Blazing Sun (main quest), Political intrigue with Lady Fiona Wachter

**AI Behavior Notes:** Baron becomes increasingly manic as festivals fail. Will sacrifice anything—including townspeople—to maintain his delusion. Treats dissent as treason. Relies heavily on Izek for enforcement.

**Location:** Primarily in burgomaster-mansion, occasionally in town-square during festivals

**Full Profile:** `game-data/npcs/baron_vargas_vallakovich.yaml` (Story 4-10)

---

### Father Lucian Petrovich
**NPC ID:** `father_lucian_petrovich`
**Type:** Human Priest
**CR:** 2
**Role:** Priest of the Morninglord, guardian of St. Andral's bones
**Full Profile:** game-data/npcs/father_lucian_petrovich.yaml

**Description:** An older man in simple priest's robes, face lined with worry and exhaustion. Carries himself with quiet dignity despite the Baron's madness surrounding him.

**Personality:** Compassionate, weary, deeply concerned. Knows the bones protect Vallaki but fears they've been stolen. Tries to maintain faith while watching the town descend into enforced insanity.

**Dialogue Snippets:**
- "The Morninglord's light shines on us all, even here in the darkness. We must have faith."
- "The Baron means well, but... forcing happiness is not the same as finding it."
- "I fear something terrible approaches. The bones... they should be here. They've always been here."

**Quest Involvement:** St. Andral's Feast (critical quest), Church sanctuary for Ireena

**AI Behavior Notes:** Father Lucian is reluctant to admit the bones are missing. Will eventually confide in trustworthy players. Genuinely wants to help but fears the consequences of failure.

**Location:** Primarily in church-of-st-andral

---

### Urwin Martikov
**NPC ID:** `urwin_martikov`
**Type:** Human (Wereraven)
**CR:** 2
**Role:** Proprietor of the Blue Water Inn, secret Keeper of the Feather

**Description:** A friendly middle-aged man with laugh lines and warm eyes. Moves with surprising grace. Always seems to know more than he lets on.

**Personality:** Welcoming, perceptive, secretly heroic. Balances running a successful inn with his secret role fighting Strahd. Protects his family fiercely while helping adventurers discreetly.

**Dialogue Snippets:**
- "Welcome to the Blue Water Inn! Any friend of Barovia is a friend of mine—and believe me, Barovia needs friends."
- "The Baron's festivals? We humor him. What else can we do? At least it keeps people's spirits up... for a little while."
- "You didn't hear this from me, but if you're looking for real help against the darkness, there are... others... who share your goals."

**Quest Involvement:** Quest hub for multiple side quests, Keeper of the Feather faction, Wine delivery quest

**AI Behavior Notes:** Urwin observes players carefully before revealing his wereraven nature or Keeper connections. Will offer subtle aid initially, more direct support once trust is established. Never compromises his family's safety.

**Location:** Primarily in blue-water-inn

**Full Profile:** `game-data/npcs/urwin-martikov.yaml` (Story 4-9)

---

### Rictavio (Rudolph van Richten)
**NPC ID:** `rictavio`
**Type:** Human (disguised)
**CR:** 8 (if true identity revealed)
**Role:** Half-elf carnival master, secretly the legendary vampire hunter Rudolph van Richten

**Description:** A colorful figure in flamboyant carnival attire with a wide-brimmed hat. Speaks with theatrical flair and exaggerated gestures. Keeps a mysterious wagon locked at all times.

**Personality:** As Rictavio: Cheerful, theatrical, evasive about his past. As Van Richten: Grim, experienced, haunted by past failures. Obsessed with destroying Strahd.

**Dialogue Snippets:**
- "Rictavio the Great, at your service! Come see my carnival wagon—well, from the outside only. A magician never reveals his secrets!"
- "Strahd? Oh, dreadful business, dreadful. Best not to speak his name too loudly, my friends."
- [If identity revealed] "I've spent a lifetime hunting monsters. Strahd... Strahd is why I came to Barovia. And why I may never leave."

**Quest Involvement:** Potential ally against Strahd, Sabretooth tiger in wagon, Identity revelation quest

**AI Behavior Notes:** Rictavio maintains his cover carefully. Observes players for signs they're capable allies. Will reveal true identity only if convinced players can help defeat Strahd. His tiger, kept in the wagon, is both weapon and liability.

**Location:** Primarily in blue-water-inn (guest room), occasionally in town-square

**Full Profile:** `game-data/npcs/rictavio.yaml` (Story 4-10)
**True Identity:** See `game-data/npcs/rudolph_van_richten.yaml` (Story 4-10)

---

### Izek Strazni
**NPC ID:** `izek_strazni`
**Type:** Human (fiendish origin)
**CR:** 5
**Role:** Baron's brutish enforcer, Ireena's lost brother

**Description:** A tall, muscular man with a deformed, fiendish right arm ending in claw-like fingers. Face scarred and cruel. Wears guard captain's uniform but clearly holds authority beyond any normal guard.

**Personality:** Cruel, obsessive, devoted to the Baron. Haunted by dreams of a woman he's never met (Ireena). Enforces the Baron's happiness edicts with brutal efficiency.

**Dialogue Snippets:**
- "The Baron says smile. So SMILE."
- "Malcontents get the stocks. Continued malcontentedness gets worse. Your choice."
- "I've seen her in my dreams... a woman with dark hair. I WILL find her."

**Quest Involvement:** Enforcer of Baron's will, Ireena's past connection, Potential combat encounter

**AI Behavior Notes:** Izek is utterly loyal to the Baron but his obsession with finding Ireena (whom he doesn't recognize as his sister) creates vulnerabilities. Will become hostile if Ireena is present and players try to keep her from him. Fights savagely with his fiendish arm.

**Location:** Primarily in burgomaster-mansion, also patrols town-square and town-gates

**Full Profile:** `game-data/npcs/izek-strazni.yaml` (Story 4-9)

---

## Additional Notable NPCs

These NPCs are referenced in sub-location files with full details:

- **Milivoj** (church altar boy, desperate for money) - church-of-st-andral/NPCs.md
- **Henrik van der Voort** (coffin maker, hiding vampire spawn) - coffin-maker-shop/NPCs.md
- **Town Guards** (various) - town-gates/NPCs.md, town-square/NPCs.md
- **Lady Fiona Wachter** (noblewoman, secret Strahd cultist) - Referenced but not yet implemented
- **Danika Dorakova** (Urwin's wife, wereraven) - blue-water-inn/NPCs.md
