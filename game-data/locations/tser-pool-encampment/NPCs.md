# NPCs in Tser Pool Encampment

## Madam Eva

- **Type:** Human (Vistani) Seer
- **Age:** Unknown (appears 70s, but far older)
- **Location:** Fortune-teller's tent at camp center
- **Status:** Alive, mystically empowered, all-knowing
- **Relationship to Player:** Neutral initially, becomes ally after reading
- **Quest Connection:** Tarokka Reading (quest-critical for entire campaign)
- **Full Profile:** game-data/npcs/madam_eva.yaml

### Description

Madam Eva is an ancient Vistana whose age defies mortal reckoning. She appears as a weathered crone with penetrating dark eyes that seem to see through time itself. Silver hair falls in loose braids over her shoulders. She wears layers of colorful shawls, skirts, and scarves adorned with coins, charms, and mystical symbols. Her hands, though wrinkled and spotted with age, move with grace when handling her Tarokka deck.

Her voice carries the weight of centuries, yet remains strong and clear. She speaks in riddles and prophecies, revealing truths wrapped in mystery. Despite her frail appearance, she radiates power—a presence that commands respect even from Strahd himself.

### Dialogue

- **Initial Greeting:** "Welcome, travelers. I have been expecting you. The cards spoke of your coming many moons ago. Sit. Let us see what fate the Tarokka reveals about your path through this cursed land."

- **Quest Hook:** "You seek to understand Barovia, to perhaps find escape or even challenge its master. The cards will show you three things: items of power that can aid you, allies who will stand with you, and the place where Strahd von Zarovich can be faced. But heed this warning—knowing your fate and surviving it are very different things."

- **After Reading:** "The cards have spoken, and their message is clear. Seek these relics, find these allies, and when the time comes, face your destiny in the place revealed. Go now, with the knowledge that every choice you make brings you closer to that final confrontation."

- **If Player Returns:** "You return, changed by your journey. The cards already knew this would be so. Ask your questions, but know that some answers can only be found by living them."

### Stats

- **AC:** 10
- **HP:** 88 (16d8+16)
- **Abilities:** STR 8, DEX 10, CON 12, INT 17, WIS 20, CHA 18

### AI Behavior Notes

- Madam Eva is completely neutral in the conflict between Strahd and the party—she serves fate, not sides
- She performs the Tarokka reading automatically for first-time visitors who show respect
- She knows far more than she reveals, speaking in prophecies and riddles
- Will not directly aid party in combat or confrontations, but provides information and guidance
- Has protective wards around her tent—hostile actions result in confusion/banishment effects
- Strahd respects her neutrality and sometimes visits for his own readings
- She cannot lie but often speaks in ways that truth is revealed only in hindsight
- Will refuse to read for those who show disrespect or approach with violence

---

## Luvash

- **Type:** Human (Vistani) Warrior, Camp Leader
- **Age:** 42
- **Location:** Central bonfire area or near Madam Eva's tent
- **Status:** Alive, troubled (daughter missing if timeline progressed)
- **Relationship to Player:** Neutral to suspicious, can become hostile or grateful
- **Quest Connection:** "Find Arabelle" (if daughter is missing)

### Description

Luvash is a broad-shouldered Vistani warrior with a thick black beard and intense dark eyes. He wears practical traveling clothes beneath a colorful vest, with a curved saber at his hip and daggers visible in his belt. Tattoos of Vistani symbols mark his forearms. He moves with the confidence of a leader used to being obeyed.

When sober, he is shrewd and protective of his people. When drunk (which happens more frequently if his daughter Arabelle goes missing), he becomes unpredictable—quick to anger, suspicious of outsiders, and prone to making rash decisions.

### Dialogue

- **Initial Greeting:** "You're not Vistani. What brings outsiders to our camp? Speak plainly—Madam Eva may tolerate mystery, but I prefer direct answers."

- **If Arabelle is Missing:** "My daughter... Arabelle... she's gone. Vanished two days ago. The lake, maybe, or kidnapped by those damned dusk elves... If you find her, bring her back safely, and I'll reward you well. But if I discover you had anything to do with her disappearance..." [Hand moves to sword hilt]

- **If Arabelle is Rescued:** "You brought my daughter back alive! There are no words sufficient. You have the eternal friendship of the Vistani. Anything we have is yours to share. Tell me how I can repay this debt."

### Stats

- **AC:** 14 (leather armor)
- **HP:** 65 (10d8+20)
- **Abilities:** STR 16, DEX 14, CON 14, INT 11, WIS 10, CHA 13

### AI Behavior Notes

- Protective of camp and people, especially children
- Distrustful of outsiders initially but respects those who show honor
- If Arabelle goes missing, becomes increasingly desperate and irrational
- Grateful to the point of sworn loyalty if daughter is rescued
- Skilled fighter who will defend camp against threats
- Has complicated relationship with Madam Eva (respects her but finds prophecies frustrating)
- Maintains alliance with Strahd but doesn't particularly like it

---

## Arrigal

- **Type:** Human (Vistani) Scout/Spy
- **Age:** 35
- **Location:** Usually at camp perimeter or traveling
- **Status:** Alive, secretly Strahd's spy
- **Relationship to Player:** Friendly facade, secretly hostile (Strahd's agent)
- **Quest Connection:** Potential betrayer if party trusts him

### Description

Arrigal is Luvash's younger brother, lean and handsome with a roguish smile and easy manner. He dresses in dark traveling clothes suitable for scouting, with a rapier at his side. His dark hair is pulled back in a ponytail, and his eyes constantly assess and calculate.

He appears friendly and helpful, offering advice about Barovia's dangers and safe travel routes. However, this is a careful act—Arrigal secretly serves Strahd, reporting on travelers and occasionally guiding them into traps.

### Dialogue

- **Initial Greeting:** "Welcome, friends! Any ally of Madam Eva is welcome here. I'm Arrigal, scout and guide. If you need to know about Barovia's roads and dangers, I'm your man."

- **Offering Help:** "You're headed to Vallaki? Treacherous road, but I know it well. I could guide you... for a small fee, of course. Or at least let me mark your map with safe campsites and areas to avoid."

- **Subtle Betrayal:** "That shortcut I mentioned? Should save you hours. Just head through the ravine when you see the black carriage..." [This leads to ambush or danger]

### Stats

- **AC:** 13 (leather armor)
- **HP:** 44 (8d8+8)
- **Abilities:** STR 12, DEX 16, CON 12, INT 13, WIS 11, CHA 14

### AI Behavior Notes

- Presents as helpful guide and friendly Vistani
- Actually reports to Strahd about party's movements, capabilities, and plans
- Will attempt to gain party's trust and learn their secrets
- May guide party into ambushes or dangerous situations under guise of "shortcuts"
- Careful never to expose himself—prefers indirect manipulation
- If discovered as traitor, will flee rather than fight
- Brother relationship with Luvash is genuine, though Luvash doesn't know about Strahd alliance

---

## Vistani Guards (4 total)

- **Type:** Human (Vistani) Warriors
- **Age:** Various (25-45)
- **Location:** Camp perimeter, wagon entrances, Madam Eva's tent
- **Status:** Alive, vigilant
- **Relationship to Player:** Neutral, professional
- **Quest Connection:** None (camp security)

### Description

Four Vistani warriors serve as the camp's guard rotation. They wear practical armor beneath colorful scarves and cloaks, carrying curved sabers and short bows. They patrol the camp's perimeter, watch the road approaches, and stand ceremonial guard at Madam Eva's tent. Professional and alert, they serve Luvash's commands and protect the camp from threats.

### Stats (Per Guard)

- **AC:** 12 (leather armor)
- **HP:** 22 (4d8+4)
- **Abilities:** STR 14, DEX 13, CON 12, INT 10, WIS 11, CHA 10

### AI Behavior Notes

- Professional guards, not looking for trouble but prepared for it
- Will challenge armed strangers approaching camp
- Defer to Luvash for decisions about outsiders
- Loyal to camp and Vistani people
- Not particularly loyal to Strahd, though they tolerate his visits

---

## Vistani Traders (2 total)

- **Type:** Human (Vistani) Merchants
- **Age:** 38 and 52
- **Location:** Trading wagons on camp's east side
- **Status:** Alive, eager to trade
- **Relationship to Player:** Neutral, business-focused
- **Quest Connection:** None (merchant services)

### Description

Two Vistani run the camp's trading operations, selling supplies, weapons, and mysterious charms from their wagon shops. They're shrewd businesspeople who drive hard bargains but deal honestly. They have access to goods not normally found in Barovia—items brought from outside the mists or traded from various settlements.

### AI Behavior Notes

- Business-focused, interested in profit but fair dealers
- Will trade with anyone who has coin and doesn't threaten camp
- Have heard many rumors from travelers—potential information source
- Know value of items, difficult to haggle with (DC 18 Persuasion for 10% discount)
- May have special items that become available after party earns Vistani trust

---

## Vistani Performers (3 total)

- **Type:** Human (Vistani) Musicians/Entertainers
- **Age:** Various (20-55)
- **Location:** Central bonfire area, especially at night
- **Status:** Alive, creating atmosphere
- **Relationship to Player:** Friendly, welcoming
- **Quest Connection:** None (atmosphere and culture)

### Description

Three Vistani perform regularly at the central bonfire—a violinist, a dancer, and a storyteller/singer. They embody the Vistani culture of music, dance, and oral tradition, keeping spirits high despite Barovia's gloom. At night, their performances attract the entire camp and any visitors, creating an atmosphere of magic and ancient mystery.

### AI Behavior Notes

- Provide cultural flavor and atmosphere
- Friendly to visitors who appreciate their art
- Stories and songs contain hints about Barovia's history
- Will perform for donations or simply for the joy of it
- Represent the Vistani's resistance to Barovia's despair
