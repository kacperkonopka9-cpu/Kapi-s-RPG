# Dice Rolling Library Decision

**Date:** 2025-11-09
**Epic:** 3 - D&D 5e Mechanics Integration
**Story:** 3-1 - Dice Rolling Module
**Decision Required:** Custom implementation vs. npm package

---

## Options Evaluated

### Option 1: Custom Implementation (RECOMMENDED)

**Description:** Build a lightweight custom dice roller using regex and `crypto.randomInt()`.

**Pros:**
- ✅ **Zero dependencies** - No external packages required
- ✅ **Full control** - Customize exactly to our needs
- ✅ **Lightweight** - ~100 lines of code max
- ✅ **Performance** - Direct implementation, no overhead
- ✅ **Security** - Use crypto.randomInt() for cryptographically secure randomness
- ✅ **Simplicity** - Easy to understand, maintain, and debug
- ✅ **Integration** - Designed specifically for D&D 5e notation

**Cons:**
- ❌ Need to write and test dice parsing logic
- ❌ Need to handle edge cases manually
- ❌ Need to implement advantage/disadvantage ourselves

**Implementation Complexity:** Low (2-3 hours for full implementation + tests)

**Code Example:**
```javascript
class DiceRoller {
  roll(notation, options = {}) {
    // Parse "2d6+3" -> {count: 2, sides: 6, modifier: 3}
    const pattern = /^(\d+)d(\d+)([+-]\d+)?$/i;
    const match = notation.match(pattern);

    if (!match) {
      return {success: false, error: 'Invalid dice notation'};
    }

    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;

    // Roll dice
    const rolls = [];
    for (let i = 0; i < count; i++) {
      rolls.push(crypto.randomInt(1, sides + 1));
    }

    // Handle advantage/disadvantage
    if (options.advantage || options.disadvantage) {
      // Roll second set, take higher/lower
    }

    const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;

    return {
      success: true,
      data: {
        notation,
        rolls,
        modifier,
        total,
        breakdown: `${count}d${sides}(${rolls.join('+')}) ${modifier >= 0 ? '+' : ''}${modifier} = ${total}`
      }
    };
  }
}
```

**Test Coverage:** Easy to achieve 100% coverage with unit tests

---

### Option 2: dice-roller npm package

**Description:** Use the `dice-roller` package (https://www.npmjs.com/package/@dice-roller/rpg-dice-roller)

**Pros:**
- ✅ Feature-rich (complex notation, exploding dice, modifiers)
- ✅ Well-maintained (actively developed)
- ✅ Battle-tested (used by many projects)
- ✅ Comprehensive notation support (d%, fudge dice, etc.)

**Cons:**
- ❌ **External dependency** (adds ~100KB to project)
- ❌ **Overkill** - More features than we need for D&D 5e
- ❌ **Learning curve** - Need to understand their API
- ❌ **Dependency risk** - Vulnerable to package updates/deprecation
- ❌ **Not optimized for our use case** - Generic, not D&D-specific

**Implementation Complexity:** Low (1 hour for integration)

**Package Size:** ~100KB

**Code Example:**
```javascript
import { DiceRoll } from '@dice-roller/rpg-dice-roller';

const roll = new DiceRoll('2d6+3');
console.log(roll.total); // 11
console.log(roll.output); // "2d6+3: [4, 6]+3 = 13"
```

---

### Option 3: d20 npm package

**Description:** Use the `d20` package (https://www.npmjs.com/package/d20)

**Pros:**
- ✅ Lightweight (~10KB)
- ✅ Simple API
- ✅ Supports standard notation

**Cons:**
- ❌ **Not actively maintained** (last update 6+ years ago)
- ❌ **Limited features** (no advantage/disadvantage built-in)
- ❌ **Still an external dependency**
- ❌ **Randomness quality unclear** (uses Math.random(), not crypto)

**Implementation Complexity:** Low (1 hour)

**Package Size:** ~10KB

**Code Example:**
```javascript
const d20 = require('d20');

const result = d20.roll('2d6+3');
console.log(result); // 11
```

---

## Decision Matrix

| Criteria | Custom | dice-roller | d20 |
|----------|--------|-------------|-----|
| **Zero Dependencies** | ✅ Yes | ❌ No | ❌ No |
| **Lightweight** | ✅ ~100 lines | ⚠️ 100KB | ✅ 10KB |
| **Performance** | ✅ Optimized | ⚠️ Good | ✅ Good |
| **Security** | ✅ crypto.randomInt | ⚠️ Math.random | ❌ Math.random |
| **Maintenance** | ✅ In our control | ✅ Active | ❌ Abandoned |
| **D&D 5e Focus** | ✅ Tailored | ❌ Generic | ❌ Generic |
| **Advantage/Disadvantage** | ✅ Custom | ⚠️ Workaround | ❌ Manual |
| **Implementation Time** | ⚠️ 2-3 hours | ✅ 1 hour | ✅ 1 hour |
| **Test Coverage** | ✅ Easy 100% | ⚠️ Depends on lib | ⚠️ Depends on lib |

---

## Recommendation: Custom Implementation

### Rationale

**1. Architectural Consistency**
- Kapi-s-RPG follows a **zero-dependency** philosophy where possible
- Epic 1 and Epic 2 used minimal dependencies (js-yaml, lodash only)
- Adding a dice rolling library contradicts this pattern

**2. D&D 5e-Specific Needs**
- D&D 5e has simple dice notation (`1d20`, `2d6+3`)
- Advantage/disadvantage is a D&D-specific mechanic
- Custom implementation can be optimized for exactly what we need

**3. Security**
- Using `crypto.randomInt()` provides cryptographically secure randomness
- Better than Math.random() for "fair" dice rolls
- Prevents predictable/exploitable dice patterns

**4. Performance**
- Custom implementation has zero overhead
- Target: <10ms per roll (easily achievable)
- No need to parse complex notation or handle edge cases we don't use

**5. Simplicity**
- ~100 lines of well-tested code is easier to maintain than an external package
- No risk of breaking changes from package updates
- Full visibility into dice rolling logic for debugging

**6. Educational Value**
- Writing a dice roller is a straightforward exercise
- Good learning opportunity for regex and randomness
- Demonstrates understanding of core game mechanics

### Implementation Plan

**File:** `src/mechanics/dice-roller.js`

**Features to Implement:**
1. Parse standard notation: `1d20`, `2d6+3`, `3d8-2`
2. Support advantage (roll 2d20, take higher)
3. Support disadvantage (roll 2d20, take lower)
4. Return detailed result (rolls, modifier, total, breakdown)
5. Validate notation (prevent invalid input like `99d999`)
6. Use `crypto.randomInt()` for secure randomness

**Testing:**
- Unit tests for notation parsing
- Statistical distribution test (1000+ rolls, verify randomness)
- Edge cases (max values, negative modifiers, advantage/disadvantage)
- Performance test (<10ms target)

**Estimated Effort:** 2-3 hours (implementation + comprehensive testing)

---

## Example Implementation Spec

```javascript
/**
 * DiceRoller - Custom dice rolling implementation for D&D 5e
 * @module src/mechanics/dice-roller
 */

class DiceRoller {
  /**
   * Roll dice using D&D notation
   * @param {string} notation - Dice notation (e.g., "2d6+3", "1d20")
   * @param {Object} options - Roll options
   * @param {boolean} options.advantage - Roll twice, take higher (for d20 only)
   * @param {boolean} options.disadvantage - Roll twice, take lower (for d20 only)
   * @returns {Promise<ResultObject>} Roll result
   */
  async roll(notation, options = {}) {
    // Implementation
  }

  /**
   * Validate dice notation
   * @param {string} notation - Notation to validate
   * @returns {boolean} True if valid
   */
  validateNotation(notation) {
    // Regex: /^(\d{1,2})d(\d{1,3})([+-]\d{1,3})?$/i
    // Max 20 dice, max d100, max ±999 modifier
  }

  /**
   * Roll single die
   * @private
   * @param {number} sides - Number of sides (4, 6, 8, 10, 12, 20, 100)
   * @returns {number} Roll result (1 to sides)
   */
  _rollDie(sides) {
    return crypto.randomInt(1, sides + 1);
  }

  /**
   * Handle advantage/disadvantage
   * @private
   * @param {number} sides - Die sides
   * @param {string} type - "advantage" or "disadvantage"
   * @returns {Object} {roll, discarded}
   */
  _rollWithAdvantage(sides, type) {
    const roll1 = this._rollDie(sides);
    const roll2 = this._rollDie(sides);

    if (type === 'advantage') {
      return {
        roll: Math.max(roll1, roll2),
        discarded: Math.min(roll1, roll2)
      };
    } else {
      return {
        roll: Math.min(roll1, roll2),
        discarded: Math.max(roll1, roll2)
      };
    }
  }
}
```

**Return Format:**
```javascript
{
  success: true,
  data: {
    notation: "2d6+3",
    rolls: [4, 6],
    modifier: 3,
    total: 13,
    breakdown: "2d6(4+6) + 3 = 13",
    advantage: false,
    disadvantage: false
  }
}
```

---

## Alternative: Fallback to Physical Dice

If custom implementation proves insufficient or buggy, provide a fallback:

```
Dice roller unavailable. Please roll physical dice:
- Roll 2d6+3
- Enter result: __

(This maintains gameplay continuity even if dice roller fails)
```

---

## Decision

**Selected Option:** **Custom Implementation**

**Justification:**
- Aligns with project architecture (minimal dependencies)
- Optimized for D&D 5e-specific needs
- Secure randomness via `crypto.randomInt()`
- Full control and transparency
- Simple enough to implement in 2-3 hours
- Easy to achieve 100% test coverage

**Implementation:** Story 3-1 (Dice Rolling Module)

**Owner:** Developer Agent

**Timeline:** Part of Epic 3 Story 3-1 implementation

---

**Decision Made:** 2025-11-09
**Approved By:** Architect Agent
**Status:** Final
