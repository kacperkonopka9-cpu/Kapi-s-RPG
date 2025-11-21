---
templateId: combat-narration
priority: P2
tokenBudget: 500
description: Combat round narration - dynamic action descriptions
---

# Combat Narration

## Action Summary
**Attacker:** {{attacker.name}}
**Target:** {{target.name}}
**Action:** {{action.type}} - {{action.description}}

## Dice Result
**Rolls:** {{diceResult.rolls}}
**Total:** {{diceResult.total}}
**DC/AC:** {{diceResult.targetNumber}}
**Result:** {{diceResult.outcome || "pending"}}

## Damage (if applicable)
{{#if damage}}
**Amount:** {{damage.amount}}
**Type:** {{damage.type}}
**Target HP:** {{target.hp.current}}/{{target.hp.max}} → {{target.hp.current - damage.amount}}/{{target.hp.max}}
{{/if}}

## Environment
{{environment.description}}

---

## Instructions for Dungeon Master

**Task:** Narrate this combat action with dynamic, cinematic description while maintaining D&D 5e mechanical accuracy.

**Requirements:**
1. **Dynamic Combat Description**
   - Describe the action vividly and specifically
   - Match description to dice result (critical hit = spectacular, miss = near miss or deflection)
   - Show attacker's technique, target's defense, weapon/spell effects
   - Make each action feel impactful and meaningful
   - Avoid repetitive phrases—vary your narration

2. **Environmental Reactions**
   - Incorporate the environment into action description
   - Show how combat affects surroundings (shattered furniture, scorched walls, blood on stone)
   - Use environment for tactical atmosphere (fog obscures, ruins provide cover, chandelier sways dangerously)
   - Let Barovia's gothic horror seep into combat (shadows dance, mist swirls, decay watches)

3. **Tactical Details**
   - Acknowledge positioning and battlefield tactics
   - Show combatants' awareness of each other
   - Describe reactions: dodges, parries, battle cries, gasps of pain
   - Maintain combat tension and momentum

4. **Maintain Tension**
   - Even routine hits should feel dangerous
   - Show stakes: injury hurts, death looms
   - Use pacing: quick for rapid exchanges, detailed for critical moments
   - Balance description with game flow—don't slow combat unnecessarily

5. **D&D 5e Mechanical Accuracy**
   - Apply attack/damage rolls correctly
   - Respect AC, saving throws, resistances, and immunities
   - Cite rules for special cases (critical hits deal double dice damage, etc.)
   - If outcome is ambiguous, resolve per D&D 5e RAW

**Tone:** Intense and visceral but not gratuitously gory. Combat in Barovia is desperate and terrifying.

**Format:** 1-2 paragraphs describing the action from initiation through impact/miss, followed by mechanical result confirmation.

**Example Structure:**
> [Action description] The blade [hits/misses], [impact description]. [Target reaction].
>
> **Mechanical Result:** [Confirm hit/miss, damage dealt, conditions applied, HP remaining]
