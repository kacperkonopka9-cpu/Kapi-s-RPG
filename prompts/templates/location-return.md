---
templateId: location-return
priority: P1
tokenBudget: 600
description: Returning to a previously visited location - highlight changes
---

# Returning to: {{location.name}}

**Current Date/Time:** {{calendar.currentDate}}, {{calendar.currentTime}} ({{location.timeOfDay || "unknown time"}})
**Weather:** {{calendar.weather}}

## Character Status
**{{character.name}}** (Level {{character.level}} {{character.class}}) - HP: {{character.hp.current}}/{{character.hp.max}}

## What's Changed

{{location.stateChanges || "The location appears much as you remember it, though time has passed since your last visit."}}

## NPCs Present

{{#each npcs}}
- **{{this.name}}** ({{this.status || "present"}}){{#if this.relationship}} - Relationship: {{this.relationship}}{{/if}}
{{/each}}

---

## Instructions for Dungeon Master

**Task:** Narrate the player's return to {{location.name}}.

**Requirements:**
1. **Brief Location Reminder (1 paragraph)**
   - Refresh player's memory with key sensory details
   - Acknowledge their familiarity with this place
   - Note any immediate changes visible upon arrival

2. **Highlight Changes**
   - Emphasize what's different since last visit
   - Show consequences of previous actions or passage of time
   - Reflect NPC reactions based on prior interactions
   - Maintain continuity with established narrative

3. **NPC Recognition**
   - NPCs remember the player character
   - Adjust dialogue and behavior based on relationship history
   - Show emotional responses appropriate to past events
   - Make the world feel reactive and alive

4. **Efficient Narration**
   - Be concise—this is a return visit, not initial discovery
   - Focus on what matters: changes, consequences, NPCs
   - Don't re-describe static elements in detail
   - Move the story forward

**Tone:** Acknowledge familiarity while maintaining gothic horror atmosphere. Changes should feel inevitable and often ominous.

**Prompt:** End with a clear invitation for player action based on the current situation.
