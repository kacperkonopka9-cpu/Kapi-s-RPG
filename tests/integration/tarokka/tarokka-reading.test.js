/**
 * Integration Tests for Tarokka Reading System (Story 4-16)
 * Tests the complete Tarokka reading workflow including:
 * - Deck and configuration validation
 * - TarokkaReader module functionality
 * - Deterministic shuffle and seeding
 * - Full 5-card reading execution
 * - Card-to-location/NPC mappings
 * - Epic 2 Event integration
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const TarokkaReader = require('../../../src/tarokka/tarokka-reader');

describe('Tarokka Reading System Integration Tests', () => {
  let tarokkaReader;
  const dataDir = path.join(process.cwd(), 'game-data', 'tarokka');

  beforeEach(() => {
    tarokkaReader = new TarokkaReader();
  });

  // ============================================================================
  // TEST SUITE 1: Tarokka Deck Validation (AC-1)
  // ============================================================================
  describe('Suite 1: Tarokka Deck Validation', () => {
    let deckData;

    beforeAll(async () => {
      const deckPath = path.join(dataDir, 'tarokka-deck.yaml');
      const deckYaml = await fs.readFile(deckPath, 'utf-8');
      deckData = yaml.load(deckYaml);
    });

    test('Should have exactly 54 cards in the deck', async () => {
      const result = await tarokkaReader.loadDeck();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(54);
    });

    test('Should have 14 High Deck cards', () => {
      expect(deckData.highDeck).toHaveLength(14);
    });

    test('Should have 10 cards in each Common Deck suit', () => {
      expect(deckData.swords).toHaveLength(10);
      expect(deckData.coins).toHaveLength(10);
      expect(deckData.glyphs).toHaveLength(10);
      expect(deckData.stars).toHaveLength(10);
    });

    test('All cards should have required fields', async () => {
      const result = await tarokkaReader.loadDeck();
      const deck = result.data;

      const requiredFields = ['id', 'suit', 'name', 'rank', 'category', 'description', 'fortuneTelling'];

      deck.forEach(card => {
        requiredFields.forEach(field => {
          expect(card).toHaveProperty(field);
          expect(card[field]).toBeDefined();
        });
      });
    });

    test('All card IDs should be unique', async () => {
      const result = await tarokkaReader.loadDeck();
      const deck = result.data;

      const ids = deck.map(card => card.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(54);
    });

    test('High Deck cards should be category "major"', () => {
      deckData.highDeck.forEach(card => {
        expect(card.category).toBe('major');
        expect(card.suit).toBe('high_deck');
      });
    });

    test('Common Deck cards should be category "minor"', () => {
      const commonCards = [
        ...deckData.swords,
        ...deckData.coins,
        ...deckData.glyphs,
        ...deckData.stars
      ];

      commonCards.forEach(card => {
        expect(card.category).toBe('minor');
      });
    });

    test('All cards should have fortuneTelling with required subfields', async () => {
      const result = await tarokkaReader.loadDeck();
      const deck = result.data;

      deck.forEach(card => {
        expect(card.fortuneTelling).toHaveProperty('general');
        expect(card.fortuneTelling).toHaveProperty('light');
        expect(card.fortuneTelling).toHaveProperty('dark');
        expect(card.fortuneTelling).toHaveProperty('advice');
      });
    });
  });

  // ============================================================================
  // TEST SUITE 2: Reading Configuration Validation (AC-2)
  // ============================================================================
  describe('Suite 2: Reading Configuration Validation', () => {
    let configData;

    beforeAll(async () => {
      const configPath = path.join(dataDir, 'reading-config.yaml');
      const configYaml = await fs.readFile(configPath, 'utf-8');
      configData = yaml.load(configYaml);
    });

    test('Should have artifact readings for all three artifacts', () => {
      expect(configData.artifactReadings).toHaveProperty('sunsword');
      expect(configData.artifactReadings).toHaveProperty('holySymbol');
      expect(configData.artifactReadings).toHaveProperty('tome');
    });

    test('Each artifact should have 10 possible locations', () => {
      expect(configData.artifactReadings.sunsword.possibleLocations).toHaveLength(10);
      expect(configData.artifactReadings.holySymbol.possibleLocations).toHaveLength(10);
      expect(configData.artifactReadings.tome.possibleLocations).toHaveLength(10);
    });

    test('Ally reading should have 14 possible allies', () => {
      expect(configData.allyReading.possibleAllies).toHaveLength(14);
    });

    test('Enemy reading should have 13 possible locations', () => {
      expect(configData.enemyReading.possibleLocations).toHaveLength(13);
    });

    test('All artifact locations should have required fields', () => {
      const artifacts = ['sunsword', 'holySymbol', 'tome'];

      artifacts.forEach(artifact => {
        configData.artifactReadings[artifact].possibleLocations.forEach(loc => {
          expect(loc).toHaveProperty('cardId');
          expect(loc).toHaveProperty('locationId');
          expect(loc).toHaveProperty('locationName');
          expect(loc).toHaveProperty('description');
          expect(loc).toHaveProperty('dmGuidance');
        });
      });
    });

    test('All allies should have required fields', () => {
      configData.allyReading.possibleAllies.forEach(ally => {
        expect(ally).toHaveProperty('cardId');
        expect(ally).toHaveProperty('allyId');
        expect(ally).toHaveProperty('allyName');
        expect(ally).toHaveProperty('description');
        expect(ally).toHaveProperty('mechanicalBenefit');
        expect(ally).toHaveProperty('dmGuidance');
        expect(ally).toHaveProperty('whenTheyAppear');
      });
    });

    test('All enemy locations should have required fields', () => {
      configData.enemyReading.possibleLocations.forEach(loc => {
        expect(loc).toHaveProperty('cardId');
        expect(loc).toHaveProperty('locationId');
        expect(loc).toHaveProperty('locationName');
        expect(loc).toHaveProperty('description');
        expect(loc).toHaveProperty('tacticalNotes');
        expect(loc).toHaveProperty('lairActions');
        expect(loc).toHaveProperty('dmGuidance');
      });
    });

    test('Should have fallback defaults for all reading types', () => {
      expect(configData.fallbackDefaults).toHaveProperty('sunsword');
      expect(configData.fallbackDefaults).toHaveProperty('holySymbol');
      expect(configData.fallbackDefaults).toHaveProperty('tome');
      expect(configData.fallbackDefaults).toHaveProperty('ally');
      expect(configData.fallbackDefaults).toHaveProperty('enemy');
    });
  });

  // ============================================================================
  // TEST SUITE 3: TarokkaReader Module Functionality (AC-3)
  // ============================================================================
  describe('Suite 3: TarokkaReader Module Functionality', () => {
    test('Should successfully load deck', async () => {
      const result = await tarokkaReader.loadDeck();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(54);
    });

    test('Should cache loaded deck for performance', async () => {
      const result1 = await tarokkaReader.loadDeck();
      const result2 = await tarokkaReader.loadDeck();

      expect(result1.data).toBe(result2.data); // Same reference = cached
    });

    test('Should successfully load reading configuration', async () => {
      const result = await tarokkaReader.loadConfig();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('artifactReadings');
      expect(result.data).toHaveProperty('allyReading');
      expect(result.data).toHaveProperty('enemyReading');
    });

    test('Should cache loaded config for performance', async () => {
      const result1 = await tarokkaReader.loadConfig();
      const result2 = await tarokkaReader.loadConfig();

      expect(result1.data).toBe(result2.data); // Same reference = cached
    });

    test('Should shuffle deck without modifying original', async () => {
      const deckResult = await tarokkaReader.loadDeck();
      const originalDeck = deckResult.data;
      const originalFirstCard = originalDeck[0].id;

      const shuffled = tarokkaReader.shuffleDeck(originalDeck, 12345);

      expect(originalDeck[0].id).toBe(originalFirstCard); // Original unchanged
      expect(shuffled).toHaveLength(54);
      expect(shuffled[0].id).not.toBe(originalFirstCard); // Shuffled is different
    });

    test('Should draw card at valid index', async () => {
      const deckResult = await tarokkaReader.loadDeck();
      const deck = deckResult.data;

      const card = tarokkaReader.drawCard(deck, 5);

      expect(card).toBeDefined();
      expect(card).toBe(deck[5]);
    });

    test('Should return null for invalid draw index', async () => {
      const deckResult = await tarokkaReader.loadDeck();
      const deck = deckResult.data;

      expect(tarokkaReader.drawCard(deck, -1)).toBeNull();
      expect(tarokkaReader.drawCard(deck, 100)).toBeNull();
    });

    test('Should get card by ID', async () => {
      const result = await tarokkaReader.getCardById('high_deck_master');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('high_deck_master');
      expect(result.data.name).toBe('The Master');
    });

    test('Should return error for invalid card ID', async () => {
      const result = await tarokkaReader.getCardById('invalid_card');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Card not found');
    });
  });

  // ============================================================================
  // TEST SUITE 4: Deterministic Shuffle Testing (AC-4)
  // ============================================================================
  describe('Suite 4: Deterministic Shuffle Testing', () => {
    test('Same seed should produce identical shuffle', async () => {
      const deckResult = await tarokkaReader.loadDeck();
      const deck = deckResult.data;

      const seed = 12345;
      const shuffle1 = tarokkaReader.shuffleDeck(deck, seed);
      const shuffle2 = tarokkaReader.shuffleDeck(deck, seed);

      expect(shuffle1.map(c => c.id)).toEqual(shuffle2.map(c => c.id));
    });

    test('Different seeds should produce different shuffles', async () => {
      const deckResult = await tarokkaReader.loadDeck();
      const deck = deckResult.data;

      const shuffle1 = tarokkaReader.shuffleDeck(deck, 11111);
      const shuffle2 = tarokkaReader.shuffleDeck(deck, 22222);

      expect(shuffle1.map(c => c.id)).not.toEqual(shuffle2.map(c => c.id));
    });

    test('Shuffle should contain all original cards', async () => {
      const deckResult = await tarokkaReader.loadDeck();
      const deck = deckResult.data;

      const shuffled = tarokkaReader.shuffleDeck(deck, 99999);
      const originalIds = deck.map(c => c.id).sort();
      const shuffledIds = shuffled.map(c => c.id).sort();

      expect(shuffledIds).toEqual(originalIds);
    });

    test('Seeded RNG should be deterministic across multiple calls', () => {
      const rng1 = tarokkaReader._createSeededRNG(42);
      const rng2 = tarokkaReader._createSeededRNG(42);

      const sequence1 = Array(10).fill(0).map(() => rng1());
      const sequence2 = Array(10).fill(0).map(() => rng2());

      expect(sequence1).toEqual(sequence2);
    });
  });

  // ============================================================================
  // TEST SUITE 5: Full Reading Execution (AC-5)
  // ============================================================================
  describe('Suite 5: Full Reading Execution', () => {
    test('Should perform complete reading with seed', async () => {
      const result = await tarokkaReader.performFullReading(54321);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('seed', 54321);
      expect(result.data).toHaveProperty('timestamp');
      expect(result.data).toHaveProperty('cards');
    });

    test('Reading should draw 5 cards', async () => {
      const result = await tarokkaReader.performFullReading(11111);
      const cards = result.data.cards;

      expect(cards).toHaveProperty('sunsword');
      expect(cards).toHaveProperty('holySymbol');
      expect(cards).toHaveProperty('tome');
      expect(cards).toHaveProperty('ally');
      expect(cards).toHaveProperty('enemy');
    });

    test('All drawn cards should have card info and mapping', async () => {
      const result = await tarokkaReader.performFullReading(22222);
      const cards = result.data.cards;

      ['sunsword', 'holySymbol', 'tome'].forEach(artifact => {
        expect(cards[artifact]).toHaveProperty('card');
        expect(cards[artifact]).toHaveProperty('location');
        expect(cards[artifact].card).toHaveProperty('id');
        expect(cards[artifact].card).toHaveProperty('name');
        expect(cards[artifact].card).toHaveProperty('fortuneTelling');
      });

      expect(cards.ally).toHaveProperty('card');
      expect(cards.ally).toHaveProperty('ally');

      expect(cards.enemy).toHaveProperty('card');
      expect(cards.enemy).toHaveProperty('location');
    });

    test('Same seed should produce identical readings', async () => {
      const reading1 = await tarokkaReader.performFullReading(33333);
      const reading2 = await tarokkaReader.performFullReading(33333);

      expect(reading1.data.cards.sunsword.card.id).toBe(reading2.data.cards.sunsword.card.id);
      expect(reading1.data.cards.holySymbol.card.id).toBe(reading2.data.cards.holySymbol.card.id);
      expect(reading1.data.cards.tome.card.id).toBe(reading2.data.cards.tome.card.id);
      expect(reading1.data.cards.ally.card.id).toBe(reading2.data.cards.ally.card.id);
      expect(reading1.data.cards.enemy.card.id).toBe(reading2.data.cards.enemy.card.id);
    });

    test('Should use timestamp as seed if no seed provided', async () => {
      const result1 = await tarokkaReader.performFullReading();
      const result2 = await tarokkaReader.performFullReading();

      expect(result1.data.seed).toBeDefined();
      expect(result2.data.seed).toBeDefined();
      // Seeds should be different (different timestamps)
      expect(result1.data.seed).not.toBe(result2.data.seed);
    });

    test('Should include timestamp in ISO format', async () => {
      const result = await tarokkaReader.performFullReading(44444);

      expect(result.data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  // ============================================================================
  // TEST SUITE 6: Artifact Location Mapping (AC-6)
  // ============================================================================
  describe('Suite 6: Artifact Location Mapping', () => {
    let configData;

    beforeAll(async () => {
      const result = await tarokkaReader.loadConfig();
      configData = result.data;
    });

    test('Should map Sunsword card to location', () => {
      const cardId = 'high_deck_master';
      const location = tarokkaReader.getArtifactLocation(cardId, 'sunsword', configData);

      expect(location).toHaveProperty('locationId');
      expect(location).toHaveProperty('locationName');
      expect(location).toHaveProperty('description');
      expect(location).toHaveProperty('dmGuidance');
    });

    test('Should map Holy Symbol card to location', () => {
      const cardId = 'high_deck_innocent';
      const location = tarokkaReader.getArtifactLocation(cardId, 'holySymbol', configData);

      expect(location).toHaveProperty('locationId');
      expect(location.locationId).toBeDefined();
    });

    test('Should map Tome card to location', () => {
      const cardId = 'high_deck_darklord';
      const location = tarokkaReader.getArtifactLocation(cardId, 'tome', configData);

      expect(location).toHaveProperty('locationId');
      expect(location.locationId).toBeDefined();
    });

    test('Should use fallback for unmapped card', () => {
      const cardId = 'some_unmapped_card';
      const location = tarokkaReader.getArtifactLocation(cardId, 'sunsword', configData);

      expect(location).toHaveProperty('isFallback', true);
      expect(location.locationId).toBe(configData.fallbackDefaults.sunsword.locationId);
    });

    test('Should return error for invalid artifact type', () => {
      const cardId = 'high_deck_master';
      const location = tarokkaReader.getArtifactLocation(cardId, 'invalid_artifact', configData);

      expect(location).toHaveProperty('error');
    });
  });

  // ============================================================================
  // TEST SUITE 7: Ally NPC Mapping (AC-7)
  // ============================================================================
  describe('Suite 7: Ally NPC Mapping', () => {
    let configData;

    beforeAll(async () => {
      const result = await tarokkaReader.loadConfig();
      configData = result.data;
    });

    test('Should map card to ally NPC', () => {
      const cardId = 'high_deck_innocent';
      const ally = tarokkaReader.getAlly(cardId, configData);

      expect(ally).toHaveProperty('allyId');
      expect(ally).toHaveProperty('allyName');
      expect(ally).toHaveProperty('mechanicalBenefit');
      expect(ally).toHaveProperty('dmGuidance');
    });

    test('Should include all ally metadata', () => {
      const cardId = 'high_deck_innocent';
      const ally = tarokkaReader.getAlly(cardId, configData);

      expect(ally).toHaveProperty('description');
      expect(ally).toHaveProperty('whenTheyAppear');
    });

    test('Should use fallback for unmapped card', () => {
      const cardId = 'unmapped_card';
      const ally = tarokkaReader.getAlly(cardId, configData);

      expect(ally).toHaveProperty('isFallback', true);
      expect(ally.allyId).toBe(configData.fallbackDefaults.ally.allyId);
    });
  });

  // ============================================================================
  // TEST SUITE 8: Enemy Location Mapping (AC-8)
  // ============================================================================
  describe('Suite 8: Enemy Location Mapping', () => {
    let configData;

    beforeAll(async () => {
      const result = await tarokkaReader.loadConfig();
      configData = result.data;
    });

    test('Should map card to enemy location', () => {
      const cardId = 'high_deck_master';
      const enemyLoc = tarokkaReader.getEnemyLocation(cardId, configData);

      expect(enemyLoc).toHaveProperty('locationId');
      expect(enemyLoc).toHaveProperty('locationName');
      expect(enemyLoc).toHaveProperty('tacticalNotes');
      expect(enemyLoc).toHaveProperty('lairActions');
    });

    test('Should include DM guidance for enemy location', () => {
      const cardId = 'high_deck_master';
      const enemyLoc = tarokkaReader.getEnemyLocation(cardId, configData);

      expect(enemyLoc).toHaveProperty('dmGuidance');
      expect(enemyLoc.dmGuidance).toBeDefined();
    });

    test('Should use fallback for unmapped card', () => {
      const cardId = 'unmapped_card';
      const enemyLoc = tarokkaReader.getEnemyLocation(cardId, configData);

      expect(enemyLoc).toHaveProperty('isFallback', true);
      expect(enemyLoc.locationId).toBe(configData.fallbackDefaults.enemy.locationId);
    });
  });

  // ============================================================================
  // TEST SUITE 9: State Persistence (AC-9)
  // ============================================================================
  describe('Suite 9: State Persistence', () => {
    const stateDir = path.join(process.cwd(), 'game-data', 'state');
    const readingFilePath = path.join(stateDir, 'tarokka-reading.yaml');

    test('State directory should exist', async () => {
      await expect(fs.access(stateDir)).resolves.not.toThrow();
    });

    test('Should be able to save reading result to YAML', async () => {
      const reading = await tarokkaReader.performFullReading(99999);

      const yamlContent = yaml.dump(reading.data);
      await fs.writeFile(readingFilePath, yamlContent, 'utf-8');

      await expect(fs.access(readingFilePath)).resolves.not.toThrow();
    });

    test('Should be able to load saved reading result', async () => {
      const originalReading = await tarokkaReader.performFullReading(88888);
      const yamlContent = yaml.dump(originalReading.data);
      await fs.writeFile(readingFilePath, yamlContent, 'utf-8');

      const loadedYaml = await fs.readFile(readingFilePath, 'utf-8');
      const loadedReading = yaml.load(loadedYaml);

      expect(loadedReading.seed).toBe(88888);
      expect(loadedReading.cards.sunsword.card.id).toBe(originalReading.data.cards.sunsword.card.id);
    });

    test('Saved reading should preserve all data', async () => {
      const reading = await tarokkaReader.performFullReading(77777);
      const yamlContent = yaml.dump(reading.data);
      await fs.writeFile(readingFilePath, yamlContent, 'utf-8');

      const loadedYaml = await fs.readFile(readingFilePath, 'utf-8');
      const loadedReading = yaml.load(loadedYaml);

      expect(loadedReading).toHaveProperty('seed');
      expect(loadedReading).toHaveProperty('timestamp');
      expect(loadedReading.cards).toHaveProperty('sunsword');
      expect(loadedReading.cards).toHaveProperty('holySymbol');
      expect(loadedReading.cards).toHaveProperty('tome');
      expect(loadedReading.cards).toHaveProperty('ally');
      expect(loadedReading.cards).toHaveProperty('enemy');
    });

    afterAll(async () => {
      // Cleanup test file
      try {
        await fs.unlink(readingFilePath);
      } catch (err) {
        // Ignore if file doesn't exist
      }
    });
  });

  // ============================================================================
  // TEST SUITE 10: Integration with Artifact Items (AC-9)
  // ============================================================================
  describe('Suite 10: Integration with Artifact Items', () => {
    const itemsDir = path.join(process.cwd(), 'game-data', 'items');

    test('Sunsword item should have tarokkaReading section', async () => {
      const sunswordPath = path.join(itemsDir, 'sunsword.yaml');
      const sunswordYaml = await fs.readFile(sunswordPath, 'utf-8');
      const sunsword = yaml.load(sunswordYaml);

      expect(sunsword).toHaveProperty('tarokkaReading');
      expect(sunsword.tarokkaReading).toHaveProperty('currentLocationId');
      expect(sunsword.tarokkaReading).toHaveProperty('possibleLocations');
    });

    test('Holy Symbol item should have tarokkaReading section', async () => {
      const symbolPath = path.join(itemsDir, 'holy-symbol-of-ravenkind.yaml');
      const symbolYaml = await fs.readFile(symbolPath, 'utf-8');
      const symbol = yaml.load(symbolYaml);

      expect(symbol).toHaveProperty('tarokkaReading');
      expect(symbol.tarokkaReading).toHaveProperty('currentLocationId');
      expect(symbol.tarokkaReading).toHaveProperty('possibleLocations');
    });

    test('Tome item should have tarokkaReading section', async () => {
      const tomePath = path.join(itemsDir, 'tome-of-strahd.yaml');
      const tomeYaml = await fs.readFile(tomePath, 'utf-8');
      const tome = yaml.load(tomeYaml);

      expect(tome).toHaveProperty('tarokkaReading');
      expect(tome.tarokkaReading).toHaveProperty('currentLocationId');
      expect(tome.tarokkaReading).toHaveProperty('possibleLocations');
    });

    test('All artifact items should have 10 possible locations', async () => {
      const artifacts = ['sunsword', 'holy-symbol-of-ravenkind', 'tome-of-strahd'];

      for (const artifact of artifacts) {
        const artifactPath = path.join(itemsDir, `${artifact}.yaml`);
        const artifactYaml = await fs.readFile(artifactPath, 'utf-8');
        const artifactData = yaml.load(artifactYaml);

        expect(artifactData.tarokkaReading.possibleLocations).toHaveLength(10);
      }
    });
  });

  // ============================================================================
  // TEST SUITE 11: Event Integration Readiness (AC-10)
  // ============================================================================
  describe('Suite 11: Event Integration Readiness', () => {
    const eventsPath = path.join(process.cwd(), 'game-data', 'locations', 'tser-pool-encampment', 'Events.md');

    test('Tser Pool Events.md should exist', async () => {
      await expect(fs.access(eventsPath)).resolves.not.toThrow();
    });

    test('Events.md should contain Tarokka reading event', async () => {
      const eventsContent = await fs.readFile(eventsPath, 'utf-8');

      expect(eventsContent).toContain('madam_eva_tarokka_reading');
      expect(eventsContent).toContain('tarokka_reading');
      expect(eventsContent).toContain('TarokkaReader');
    });

    test('Tarokka event should reference TarokkaReader module', async () => {
      const eventsContent = await fs.readFile(eventsPath, 'utf-8');

      expect(eventsContent).toContain('src/tarokka/tarokka-reader.js');
      expect(eventsContent).toContain('performFullReading');
    });

    test('Madam Eva NPC should have Tarokka reading dialogue', async () => {
      const madamEvaPath = path.join(process.cwd(), 'game-data', 'npcs', 'madam_eva.yaml');
      const madamEvaYaml = await fs.readFile(madamEvaPath, 'utf-8');
      const madamEva = yaml.load(madamEvaYaml);

      expect(madamEva.dialogue).toHaveProperty('tarokkaReading');
      expect(madamEva.dialogue.tarokkaReading).toHaveProperty('opening');
      expect(madamEva.dialogue.tarokkaReading).toHaveProperty('closing');
    });
  });
});
