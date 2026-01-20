/**
 * TarokkaReader Module - Epic 4 Story 4-16
 * Implements Curse of Strahd Tarokka card reading system
 *
 * Performs fortune-telling readings using a 54-card Tarokka deck to determine:
 * - Locations of three legendary artifacts (Sunsword, Holy Symbol of Ravenkind, Tome of Strahd)
 * - Identity of the destined ally
 * - Location of final confrontation with Strahd
 *
 * Uses deterministic seeded RNG for save/load compatibility
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class TarokkaReader {
  /**
   * @param {Object} deps - Injectable dependencies for testing
   * @param {Object} deps.fs - File system module (defaults to fs.promises)
   * @param {Object} deps.path - Path module (defaults to path)
   * @param {Object} deps.yaml - YAML parser (defaults to js-yaml)
   * @param {string} deps.dataDir - Base data directory (defaults to game-data/tarokka)
   */
  constructor(deps = {}) {
    this.fs = deps.fs || fs;
    this.path = deps.path || path;
    this.yaml = deps.yaml || yaml;
    this.dataDir = deps.dataDir || path.join(process.cwd(), 'game-data', 'tarokka');

    // Cache for loaded data
    this._deck = null;
    this._config = null;
  }

  /**
   * Load the Tarokka deck from YAML file
   * @returns {Promise<Object>} Result object with success/data/error
   */
  async loadDeck() {
    if (this._deck) {
      return { success: true, data: this._deck };
    }

    try {
      const deckPath = this.path.join(this.dataDir, 'tarokka-deck.yaml');
      const deckYaml = await this.fs.readFile(deckPath, 'utf-8');
      const deckData = this.yaml.load(deckYaml);

      // Flatten all cards into single array
      const allCards = [
        ...(deckData.highDeck || []),
        ...(deckData.swords || []),
        ...(deckData.coins || []),
        ...(deckData.glyphs || []),
        ...(deckData.stars || [])
      ];

      if (allCards.length !== 54) {
        return {
          success: false,
          error: `Invalid deck size: expected 54 cards, got ${allCards.length}`
        };
      }

      this._deck = allCards;
      return { success: true, data: allCards };
    } catch (error) {
      return { success: false, error: `Failed to load Tarokka deck: ${error.message}` };
    }
  }

  /**
   * Load the reading configuration from YAML file
   * @returns {Promise<Object>} Result object with success/data/error
   */
  async loadConfig() {
    if (this._config) {
      return { success: true, data: this._config };
    }

    try {
      const configPath = this.path.join(this.dataDir, 'reading-config.yaml');
      const configYaml = await this.fs.readFile(configPath, 'utf-8');
      const configData = this.yaml.load(configYaml);

      this._config = configData;
      return { success: true, data: configData };
    } catch (error) {
      return { success: false, error: `Failed to load reading config: ${error.message}` };
    }
  }

  /**
   * Seeded Random Number Generator using Linear Congruential Generator (LCG)
   * Provides deterministic randomness for save/load compatibility
   *
   * @param {number} seed - Integer seed value
   * @returns {Function} RNG function that returns values between 0 and 1
   */
  _createSeededRNG(seed) {
    let state = seed || Date.now();

    // LCG parameters (from Numerical Recipes)
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);

    return function() {
      state = (a * state + c) % m;
      return state / m;
    };
  }

  /**
   * Shuffle deck using Fisher-Yates algorithm with seeded RNG
   * @param {Array} deck - Array of cards to shuffle
   * @param {number} seed - Seed for deterministic shuffle
   * @returns {Array} Shuffled deck (new array, does not modify original)
   */
  shuffleDeck(deck, seed) {
    const shuffled = [...deck]; // Create copy
    const rng = this._createSeededRNG(seed);

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  /**
   * Draw a card from the deck
   * @param {Array} deck - Array of cards
   * @param {number} index - Index to draw from (0-based)
   * @returns {Object|null} The drawn card or null if invalid index
   */
  drawCard(deck, index) {
    if (index < 0 || index >= deck.length) {
      return null;
    }
    return deck[index];
  }

  /**
   * Get artifact location based on card drawn
   * @param {string} cardId - ID of the card drawn
   * @param {string} artifact - Artifact type ('sunsword', 'holySymbol', 'tome')
   * @param {Object} config - Reading configuration
   * @returns {Object} Location mapping or fallback default
   */
  getArtifactLocation(cardId, artifact, config) {
    const artifactReading = config.artifactReadings[artifact];
    if (!artifactReading) {
      return { error: `Unknown artifact: ${artifact}` };
    }

    // Find matching card in possible locations
    const location = artifactReading.possibleLocations.find(loc => loc.cardId === cardId);

    if (location) {
      return {
        artifact: artifactReading.name,
        cardId: cardId,
        locationId: location.locationId,
        locationName: location.locationName,
        description: location.description,
        dmGuidance: location.dmGuidance
      };
    }

    // Fallback to default
    const fallback = config.fallbackDefaults[artifact];
    return {
      artifact: artifactReading.name,
      cardId: cardId,
      locationId: fallback.locationId,
      locationName: 'Unknown Location',
      description: fallback.reason,
      dmGuidance: 'Card not mapped - using default location',
      isFallback: true
    };
  }

  /**
   * Get ally based on card drawn
   * @param {string} cardId - ID of the card drawn
   * @param {Object} config - Reading configuration
   * @returns {Object} Ally mapping or fallback default
   */
  getAlly(cardId, config) {
    const allyReading = config.allyReading;

    // Find matching card in possible allies
    const ally = allyReading.possibleAllies.find(a => a.cardId === cardId);

    if (ally) {
      return {
        cardId: cardId,
        allyId: ally.allyId,
        allyName: ally.allyName,
        description: ally.description,
        mechanicalBenefit: ally.mechanicalBenefit,
        dmGuidance: ally.dmGuidance,
        whenTheyAppear: ally.whenTheyAppear
      };
    }

    // Fallback to default
    const fallback = config.fallbackDefaults.ally;
    return {
      cardId: cardId,
      allyId: fallback.allyId,
      allyName: 'Unknown Ally',
      description: fallback.reason,
      dmGuidance: 'Card not mapped - using default ally',
      isFallback: true
    };
  }

  /**
   * Get enemy location (final battle location) based on card drawn
   * @param {string} cardId - ID of the card drawn
   * @param {Object} config - Reading configuration
   * @returns {Object} Enemy location mapping or fallback default
   */
  getEnemyLocation(cardId, config) {
    const enemyReading = config.enemyReading;

    // Find matching card in possible locations
    const location = enemyReading.possibleLocations.find(loc => loc.cardId === cardId);

    if (location) {
      return {
        cardId: cardId,
        locationId: location.locationId,
        locationName: location.locationName,
        description: location.description,
        tacticalNotes: location.tacticalNotes,
        lairActions: location.lairActions,
        dmGuidance: location.dmGuidance
      };
    }

    // Fallback to default
    const fallback = config.fallbackDefaults.enemy;
    return {
      cardId: cardId,
      locationId: fallback.locationId,
      locationName: 'Unknown Location',
      description: fallback.reason,
      dmGuidance: 'Card not mapped - using default location',
      isFallback: true
    };
  }

  /**
   * Perform a complete Tarokka reading
   * Draws 5 cards to determine:
   * - Sunsword location (card 1)
   * - Holy Symbol location (card 2)
   * - Tome location (card 3)
   * - Destined ally (card 4)
   * - Enemy location/final battle (card 5)
   *
   * @param {number} seed - Seed for deterministic shuffle (optional, defaults to timestamp)
   * @returns {Promise<Object>} Result object with complete reading or error
   */
  async performFullReading(seed = null) {
    // Use timestamp if no seed provided
    const actualSeed = seed !== null ? seed : Date.now();

    // Load deck and config
    const deckResult = await this.loadDeck();
    if (!deckResult.success) {
      return { success: false, error: deckResult.error };
    }

    const configResult = await this.loadConfig();
    if (!configResult.success) {
      return { success: false, error: configResult.error };
    }

    const deck = deckResult.data;
    const config = configResult.data;

    // Shuffle deck with seed
    const shuffledDeck = this.shuffleDeck(deck, actualSeed);

    // Draw 5 cards
    const sunswordCard = this.drawCard(shuffledDeck, 0);
    const holySymbolCard = this.drawCard(shuffledDeck, 1);
    const tomeCard = this.drawCard(shuffledDeck, 2);
    const allyCard = this.drawCard(shuffledDeck, 3);
    const enemyCard = this.drawCard(shuffledDeck, 4);

    // Map cards to readings
    const reading = {
      seed: actualSeed,
      timestamp: new Date().toISOString(),
      cards: {
        sunsword: {
          card: {
            id: sunswordCard.id,
            name: sunswordCard.name,
            suit: sunswordCard.suit,
            description: sunswordCard.description,
            fortuneTelling: sunswordCard.fortuneTelling
          },
          location: this.getArtifactLocation(sunswordCard.id, 'sunsword', config)
        },
        holySymbol: {
          card: {
            id: holySymbolCard.id,
            name: holySymbolCard.name,
            suit: holySymbolCard.suit,
            description: holySymbolCard.description,
            fortuneTelling: holySymbolCard.fortuneTelling
          },
          location: this.getArtifactLocation(holySymbolCard.id, 'holySymbol', config)
        },
        tome: {
          card: {
            id: tomeCard.id,
            name: tomeCard.name,
            suit: tomeCard.suit,
            description: holySymbolCard.description,
            fortuneTelling: tomeCard.fortuneTelling
          },
          location: this.getArtifactLocation(tomeCard.id, 'tome', config)
        },
        ally: {
          card: {
            id: allyCard.id,
            name: allyCard.name,
            suit: allyCard.suit,
            description: allyCard.description,
            fortuneTelling: allyCard.fortuneTelling
          },
          ally: this.getAlly(allyCard.id, config)
        },
        enemy: {
          card: {
            id: enemyCard.id,
            name: enemyCard.name,
            suit: enemyCard.suit,
            description: enemyCard.description,
            fortuneTelling: enemyCard.fortuneTelling
          },
          location: this.getEnemyLocation(enemyCard.id, config)
        }
      }
    };

    return { success: true, data: reading };
  }

  /**
   * Get a specific card by ID from the deck
   * Useful for testing or manual card selection
   *
   * @param {string} cardId - ID of the card to retrieve
   * @returns {Promise<Object>} Result object with card data or error
   */
  async getCardById(cardId) {
    const deckResult = await this.loadDeck();
    if (!deckResult.success) {
      return { success: false, error: deckResult.error };
    }

    const card = deckResult.data.find(c => c.id === cardId);
    if (!card) {
      return { success: false, error: `Card not found: ${cardId}` };
    }

    return { success: true, data: card };
  }
}

module.exports = TarokkaReader;
