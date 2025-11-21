---
templateId: npc-dialogue
priority: P2
tokenBudget: 400
description: NPC conversation template - personality-driven dialogue
---

# NPC Conversation: {{npc.name}}

## NPC Profile
**Name:** {{npc.name}}
**Personality:** {{npc.personality}}
**Current Status:** {{npc.status}}
**Relationship with {{character.name}}:** {{npc.relationship || "neutral"}}

## Dialogue Context
{{npc.dialogueContext}}

## Scene Context
**Location:** {{location.name}}
**Time:** {{calendar.currentDate}}, {{calendar.currentTime}}
**Mood:** {{npc.mood || "guarded"}}

---

## Instructions for Dungeon Master

**Task:** Roleplay {{npc.name}} in conversation with {{character.name}}.

**Requirements:**
1. **Personality-Driven Dialogue**
   - Speak in the NPC's distinct voice
   - Reflect their personality traits, background, and current emotional state
   - Show trauma, hope, fear, or determination appropriate to their circumstances
   - Remember: Barovia's residents are shaped by long suffering

2. **Relationship-Aware Responses**
   - Adjust tone and content based on relationship with {{character.name}}
   - Allies speak with trust (or desperate hope)
   - Enemies speak with veiled threat or open hostility
   - Strangers speak with suspicion or desperate curiosity
   - React to player's past actions if relevant

3. **Advance Plot Naturally**
   - Share information that serves the narrative
   - Offer hooks for quests or investigations
   - Reveal character motivations and goals
   - Create opportunities for meaningful player choices
   - Don't info-dump—let conversation flow organically

4. **Show, Don't Tell**
   - Use body language, tone, and environment to convey emotion
   - Let NPC vulnerability or strength emerge through interaction
   - Create moments of connection or tension
   - Make the NPC memorable and human (even if not human)

**Tone:** Match the NPC's personality and current emotional state. Barovia's residents carry deep wounds—show their humanity amid horror.

**D&D 5e Note:** If NPC offers mechanical information (spell effects, item properties, rules clarifications), cite D&D 5e RAW accurately.

**Dialogue Format:** Write NPC speech in quotations with narrative description of actions and environment interwoven naturally.
