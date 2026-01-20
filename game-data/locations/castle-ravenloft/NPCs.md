# NPCs in Castle Ravenloft

## Count Strahd von Zarovich
- **Type:** Vampire (Legendary Creature)
- **CR:** 15
- **Age:** 400+ years (appears mid-30s)
- **Location:** Anywhere in Castle (mobile)
- **Status:** Alive (Undead), Master of Castle Ravenloft
- **Relationship to Player:** Hostile (but may engage in conversation, psychological warfare)
- **Quest Connection:** Main Quest - Final Boss, Destroy Strahd

### Description
Count Strahd von Zarovich is a tall, imposing figure with aristocratic features frozen in eternal youth. He has pale skin, dark hair, and penetrating eyes that seem to see into your very soul. He dresses in elegant black noble's attire from a bygone era—high-collared cloak, fine embroidered doublet, polished boots. Despite his refined appearance, there is something profoundly wrong about him: his movements are too fluid, too quick; his smile reveals elongated canines; and his presence emanates an aura of predatory menace that makes mortals instinctively want to flee.

### Dialogue
- **Initial Greeting:** "Welcome to my home. You have traveled far and endured much to reach me. I am Count Strahd von Zarovich, lord of Barovia, and you are my guests. I trust you will enjoy your stay... however long it lasts."
- **Observing Players:** "You remind me of adventurers who came before you. They were brave, too. Their remains decorate my catacombs. Will you join them, I wonder?"
- **About Ireena/Tatyana:** "She is mine. She has always been mine. Death took her from me once, twice, a dozen times—but death is merely an inconvenience to one such as I. She will be mine again, and no force in this realm or any other will prevent it."
- **Combat Taunts:** "You fight well, but you cannot win. I have had centuries to perfect the art of war. You have had merely years." / "Every wound you inflict heals within moments. Every drop of blood you spill makes me stronger. Surrender, and I will make your end swift."
- **If Severely Wounded:** "Impressive. You have actually wounded me. It has been... a very long time since anyone managed that. But now you have angered me, and I will show you why kings and warriors alike have learned to fear my name."

### Stats (Full profile at game-data/npcs/strahd-von-zarovich.yaml)
- **AC:** 16
- **HP:** 144 (17d8+68)
- **Speed:** 30 ft.
- **Abilities:** STR 18, DEX 18, CON 18, INT 20, WIS 15, CHA 18
- **Legendary Actions:** 3 per round (Move, Unarmed Strike, Bite)

### AI Behavior Notes
- **Combat Phases:** Strahd engages in 5 escalating phases: (1) Observation, (2) Testing party strength, (3) Psychological warfare, (4) Full engagement, (5) Tactical retreat if outmatched
- **Lair Actions:** On initiative count 20, Strahd can manipulate the castle (walls become doors, doors become walls, shadows grasp at enemies)
- **Heart of Sorrow:** As long as the crystal heart in K20 is intact, Strahd absorbs the first 50 damage dealt to him each round
- **Tactical Intelligence:** Uses Charm Person to turn party members, summons wolves/bats as reinforcements, uses Misty Escape to avoid death, shapeshifts to bat/wolf/mist to reposition
- **Personality:** Arrogant yet sophisticated, cruel yet charming, obsessed with Ireena/Tatyana, views mortals as playthings, enjoys psychological torment as much as physical combat

---

## Rahadin
- **Type:** Dusk Elf (Humanoid)
- **CR:** 10
- **Age:** 500+
- **Location:** Audience Hall, serving Strahd
- **Status:** Alive, Loyal Chamberlain
- **Relationship to Player:** Hostile (utterly devoted to Strahd)
- **Quest Connection:** Major Encounter - Rahadin may fight alongside or in place of Strahd

### Description
Rahadin is a dusk elf of striking, angular features with dark hair streaked with silver and eyes like chips of obsidian. He wears the formal attire of a chamberlain—black and crimson livery with the Zarovich crest—and moves with the fluid grace of a trained assassin. Twin scimitars hang at his waist, their hilts worn smooth from centuries of use. An aura of screaming souls surrounds him (the death cries of thousands he has slain), audible to those with keen ears.

### Dialogue
- **Initial Greeting:** "I am Rahadin, chamberlain to Count Strahd von Zarovich. State your business, and be brief. My master's time is valuable."
- **Warning:** "You would be wise to show proper respect in this place. Lord Strahd is merciful to those who know their place. The arrogant... they decorate the walls."
- **If Threatened:** "I have served the Zarovich family for five centuries and slain thousands who dared threaten them. You will be simply another tally in a very, very long count."
- **About His Loyalty:** "Strahd gave me purpose when my own people cast me out. He gave me power when I was weak. He gave me vengeance when I thirsted for blood. My loyalty is absolute."

### Stats (Full profile at game-data/npcs/rahadin.yaml)
- **AC:** 18 (studded leather armor)
- **HP:** 135
- **Speed:** 35 ft.

### AI Behavior Notes
- Absolutely loyal to Strahd, will die defending him
- Prefers ambush and assassination to direct combat
- Deathly Choir aura: screaming souls damage nearby enemies
- Dual scimitar fighting style with extra attack
- Will hunt down anyone who insults or threatens Strahd

---

## Escher
- **Type:** Vampire Spawn
- **CR:** 5
- **Age:** 18 (died), 30+ years as spawn
- **Location:** Tower of Strahd, Overlook
- **Status:** Undead (Vampire Spawn), Strahd's Consort
- **Relationship to Player:** Neutral initially (may warn party)
- **Quest Connection:** Optional NPC - May provide information about castle

### Description
Escher appears as a beautiful young man with pale skin, dark curling hair, and haunted eyes. He dresses in fine but slightly disheveled clothes—an open silk shirt, tight breeches, bare feet. Despite being undead, he retains a youthful, almost innocent beauty that makes his predatory nature all the more unsettling. He often lounges on balconies or windowsills, gazing out at Barovia with an expression of deep melancholy.

### Dialogue
- **Initial Greeting:** "More visitors to the castle? How... unusual. And how tragic. Do you know what you've walked into? Do you understand what he will do to you?"
- **About Strahd:** "He is brilliant, powerful, beautiful, and utterly without mercy. I love him. I hate him. I fear him. I would die for him again, and again, and again. That is what it means to be his."
- **Warning:** "Leave while you can. The master is toying with you. He already knows how this ends. I have seen it a hundred times before—brave adventurers come, fight, die, and are forgotten. Please... do not become another name I must remember."
- **If Pressed for Help:** "Help you? Against him? You are mad. I am bound to him in ways you cannot imagine. Even if I wanted to betray him—and I do not, cannot, will not—the compulsion would destroy me before I spoke a word."

### Stats (Full profile at game-data/npcs/escher.yaml)
- **AC:** 15
- **HP:** 82

### AI Behavior Notes
- Conflicted but ultimately loyal to Strahd (compelled obedience)
- May provide cryptic warnings or hints
- Will not directly betray Strahd but might fail to report party movements
- If forced to fight, does so with resignation rather than enthusiasm
- Prefers charm and manipulation to direct combat

---

## Helga Ruvak
- **Type:** Vampire Spawn
- **CR:** 5
- **Location:** Castle Crypts, Larders
- **Status:** Undead (Vampire Spawn), Chambermaid/Guard

### Description
Helga appears as a stern middle-aged woman with severe features and cold, dead eyes. She wears a simple black dress (her chambermaid uniform) now stained and tattered from centuries of undeath. Her movements are jerky and unnatural, and she speaks in a flat, emotionless monotone.

### Dialogue
- "The master's chambers are not to be disturbed."
- "You do not belong here. Leave or be removed."

### AI Behavior Notes
- Completely subservient to Strahd, no personality remains
- Guards specific areas of the castle
- Attacks intruders on sight
- No negotiation possible

---

## Cyrus Belview
- **Type:** Mongrelfolk (Humanoid)
- **Location:** Larders, Service Areas
- **Status:** Alive, Servant
- **Relationship to Player:** Fearful, Subservient

### Description
Cyrus is a mongrelfolk—a pitiful creature with mismatched features: one eye higher than the other, a hunched back, limbs of different lengths. He wears simple servant's garb and carries cleaning implements.

### Dialogue
- "Cyrus serves. Cyrus cleans. Cyrus no trouble."
- "Master Strahd good to Cyrus. Cyrus grateful."

### AI Behavior Notes
- Terrified of Strahd but dependent on him for protection
- Will not fight unless cornered
- May provide information if treated kindly (very rare for him)
- Knows secret passages and hidden routes through castle

---

## Additional Castle Inhabitants

**Referenced in specific sub-locations:**
- **Brides of Strahd** (Ludmilla Vilisevic, Anastrasya Karelova, Volenta Popofsky) - Vampire spawn consorts, found in various chambers
- **Pidlwick II** - Haunted animated doll, found in guest quarters
- **Gertruda** - Mad Mary's daughter, prisoner in castle (if rescued by Strahd)
- **Various Vampire Spawn** - Unnamed guards and servants throughout castle
- **Animated Armor** - Magical guardians in hallways
- **Wraiths & Specters** - Undead bound to specific rooms
- **Mongrelfolk Servants** - Deformed humanoids in service areas

Full NPC profiles for major characters available at:
- game-data/npcs/strahd-von-zarovich.yaml (Story 4-7)
- game-data/npcs/rahadin.yaml (Story 4-9)
- game-data/npcs/escher.yaml (Story 4-9)
