---
templateId: consistency-validation
priority: P3
tokenBudget: 300
description: Validate player actions against world state and D&D 5e rules
---

# Action Validation

## Player Action
{{playerAction}}

## World State

**Location:** {{worldState.location.name}} ({{worldState.location.state || "default state"}})

**NPCs Present:**
{{#if worldState.npcs}}
{{#each worldState.npcs}}
- {{this.name}} ({{this.status}}){{#if this.relationship}} - Relationship: {{this.relationship}}{{/if}}
{{/each}}
{{/if}}

**Calendar:** {{worldState.calendar.currentDate}}, {{worldState.calendar.currentTime}}

**Character Resources:**
- HP: {{worldState.character.hp.current}}/{{worldState.character.hp.max}}
- Spell Slots: {{worldState.character.spellSlots || "none"}}
- Conditions: {{worldState.character.conditions || "none"}}

## D&D 5e Rules Reference
{{rules || "Consult D&D 5e Player's Handbook and Dungeon Master's Guide as needed."}}

---

## Instructions for Dungeon Master

**Task:** Validate the player's proposed action against current world state and D&D 5e rules. Determine if the action is possible, legal, and narratively coherent.

**Requirements:**
1. **World State Validation**
   - Is the action physically possible given current location and environment?
   - Are required NPCs/objects present and accessible?
   - Does the action contradict established narrative facts?
   - Are there blocking conditions (restrained, unconscious, etc.)?

2. **D&D 5e Rules Validation**
   - Does the character have the required resources (spell slots, ki points, hit dice)?
   - Does the action require a check/save? What DC and which ability?
   - Are there class/level restrictions on this action?
   - Are components/tools/materials required and available?
   - **CRITICAL:** Cite specific D&D 5e rules when rejecting actions (e.g., "PHB p. 201: You cannot cast spells while silenced")

3. **Action Resolution Guidance**
   - If valid: Confirm action is possible and describe what happens next (including required rolls)
   - If invalid: Explain why clearly and cite D&D 5e rules
   - If problematic: Suggest alternative approaches that achieve similar goals
   - If ambiguous: Ask clarifying questions before proceeding

4. **Narrative Coherence**
   - Does the action make sense for this character and situation?
   - Are there logical consequences the player should be aware of?
   - Would this action trigger reactions from NPCs or environment?
   - Is timing/pacing appropriate (can't cast 10-minute ritual mid-combat)?

**Tone:** Supportive but rigorous. Goal is to enable player agency while maintaining world consistency and D&D 5e integrity.

**Output Format:**
1. **Validity:** [VALID / INVALID / CLARIFICATION NEEDED]
2. **Explanation:** [Brief explanation with rules citations if invalid]
3. **Next Steps:** [What happens next if valid, or alternative suggestions if invalid]

**Example (Invalid Action):**
> **Validity:** INVALID
>
> **Explanation:** You cannot cast *Misty Step* (2nd-level spell) because you have no 2nd-level spell slots remaining (used during earlier combat). PHB p. 201: "You must have an available spell slot of the spell's level or higher to cast a spell."
>
> **Next Steps:** Alternative options include: (1) Use your movement and action to Dash toward cover, (2) Hide behind the wagon using your action, or (3) Attack with your crossbow from current position.
