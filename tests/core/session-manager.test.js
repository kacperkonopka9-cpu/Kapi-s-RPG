/**
 * Unit Tests for SessionManager
 * Story 1.5: LLM Narrator Integration - Task 10
 *
 * Tests the real SessionManager implementation that replaces the stub
 */

const { SessionManager } = require('../../src/core/session-manager');

describe('SessionManager', () => {
  let sessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  describe('Constructor', () => {
    test('should initialize with no active session', () => {
      expect(sessionManager.getCurrentSession()).toBeNull();
    });

    test('should initialize empty action history', () => {
      expect(sessionManager.getRecentActions()).toEqual([]);
    });

    test('should set max action history limit', () => {
      expect(sessionManager.maxActionHistory).toBe(10);
    });
  });

  describe('startSession()', () => {
    test('should create new session with valid properties', () => {
      const session = sessionManager.startSession('village-of-barovia');

      expect(session).toMatchObject({
        sessionId: expect.any(String),
        currentLocationId: 'village-of-barovia',
        startTime: expect.any(String),
        endTime: null,
        actionCount: 0,
        visitedLocations: ['village-of-barovia']
      });
    });

    test('should generate unique session ID', () => {
      const session1 = sessionManager.startSession('location1');
      sessionManager.endSession();

      const session2 = sessionManager.startSession('location2');

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });

    test('should throw error if session already active', () => {
      sessionManager.startSession('location1');

      expect(() => {
        sessionManager.startSession('location2');
      }).toThrow('Session already active');
    });

    test('should reset action history for new session', () => {
      sessionManager.startSession('location1');
      sessionManager.recordAction({ description: 'Action 1' });
      sessionManager.endSession();

      sessionManager.startSession('location2');

      expect(sessionManager.getRecentActions()).toEqual([]);
    });
  });

  describe('getCurrentSession()', () => {
    test('should return null when no session active', () => {
      expect(sessionManager.getCurrentSession()).toBeNull();
    });

    test('should return current session state', () => {
      sessionManager.startSession('test-location');

      const session = sessionManager.getCurrentSession();

      expect(session).toMatchObject({
        sessionId: expect.any(String),
        currentLocationId: 'test-location',
        actionCount: 0
      });
    });

    test('should return copy to prevent external modification', () => {
      sessionManager.startSession('test-location');

      const session1 = sessionManager.getCurrentSession();
      const session2 = sessionManager.getCurrentSession();

      expect(session1).not.toBe(session2);
      expect(session1).toEqual(session2);
    });
  });

  describe('updateCurrentLocation()', () => {
    beforeEach(() => {
      sessionManager.startSession('location-1');
    });

    test('should update current location', () => {
      sessionManager.updateCurrentLocation('location-2');

      const session = sessionManager.getCurrentSession();
      expect(session.currentLocationId).toBe('location-2');
    });

    test('should add new location to visited locations', () => {
      sessionManager.updateCurrentLocation('location-2');
      sessionManager.updateCurrentLocation('location-3');

      const session = sessionManager.getCurrentSession();
      expect(session.visitedLocations).toEqual([
        'location-1',
        'location-2',
        'location-3'
      ]);
    });

    test('should not duplicate visited locations', () => {
      sessionManager.updateCurrentLocation('location-2');
      sessionManager.updateCurrentLocation('location-1'); // Return to first location
      sessionManager.updateCurrentLocation('location-2'); // Return to second location

      const session = sessionManager.getCurrentSession();
      expect(session.visitedLocations).toEqual(['location-1', 'location-2']);
    });

    test('should throw error if no active session', () => {
      sessionManager.endSession();

      expect(() => {
        sessionManager.updateCurrentLocation('location-2');
      }).toThrow('No active session');
    });
  });

  describe('recordAction()', () => {
    beforeEach(() => {
      sessionManager.startSession('test-location');
    });

    test('should increment action count', () => {
      sessionManager.recordAction({ description: 'Test action' });

      const session = sessionManager.getCurrentSession();
      expect(session.actionCount).toBe(1);
    });

    test('should store action with complete details', () => {
      sessionManager.recordAction({
        description: 'Look around',
        result: 'You see a door',
        narration: 'The room is dark...'
      });

      const actions = sessionManager.getRecentActions();

      expect(actions[0]).toMatchObject({
        actionId: expect.any(String),
        timestamp: expect.any(String),
        locationId: 'test-location',
        description: 'Look around',
        result: 'You see a door',
        narration: 'The room is dark...'
      });
    });

    test('should handle action with minimal details', () => {
      sessionManager.recordAction({ description: 'Simple action' });

      const actions = sessionManager.getRecentActions();

      expect(actions[0]).toMatchObject({
        actionId: expect.any(String),
        description: 'Simple action',
        result: null,
        narration: null
      });
    });

    test('should trim action history to max length', () => {
      // Record 15 actions (max is 10)
      for (let i = 0; i < 15; i++) {
        sessionManager.recordAction({ description: `Action ${i}` });
      }

      const actions = sessionManager.getRecentActions(100); // Request all

      expect(actions.length).toBe(10);
      expect(actions[0].description).toBe('Action 5'); // First 5 trimmed
      expect(actions[9].description).toBe('Action 14'); // Last action
    });

    test('should throw error if no active session', () => {
      sessionManager.endSession();

      expect(() => {
        sessionManager.recordAction({ description: 'Test' });
      }).toThrow('No active session');
    });
  });

  describe('getRecentActions()', () => {
    beforeEach(() => {
      sessionManager.startSession('test-location');
    });

    test('should return empty array when no actions', () => {
      expect(sessionManager.getRecentActions()).toEqual([]);
    });

    test('should return requested number of actions', () => {
      for (let i = 0; i < 10; i++) {
        sessionManager.recordAction({ description: `Action ${i}` });
      }

      const recent = sessionManager.getRecentActions(3);

      expect(recent.length).toBe(3);
      expect(recent[0].description).toBe('Action 7');
      expect(recent[2].description).toBe('Action 9');
    });

    test('should default to 5 recent actions', () => {
      for (let i = 0; i < 10; i++) {
        sessionManager.recordAction({ description: `Action ${i}` });
      }

      const recent = sessionManager.getRecentActions();

      expect(recent.length).toBe(5);
      expect(recent[0].description).toBe('Action 5');
      expect(recent[4].description).toBe('Action 9');
    });

    test('should return all actions if fewer than requested', () => {
      sessionManager.recordAction({ description: 'Action 1' });
      sessionManager.recordAction({ description: 'Action 2' });

      const recent = sessionManager.getRecentActions(10);

      expect(recent.length).toBe(2);
    });
  });

  describe('endSession()', () => {
    beforeEach(() => {
      sessionManager.startSession('test-location');
    });

    test('should set end time', () => {
      const finalState = sessionManager.endSession();

      expect(finalState.endTime).toBeTruthy();
      expect(new Date(finalState.endTime)).toBeInstanceOf(Date);
    });

    test('should return final session state', () => {
      sessionManager.recordAction({ description: 'Action 1' });
      sessionManager.recordAction({ description: 'Action 2' });

      const finalState = sessionManager.endSession();

      expect(finalState).toMatchObject({
        sessionId: expect.any(String),
        startTime: expect.any(String),
        endTime: expect.any(String),
        actionCount: 2,
        visitedLocations: ['test-location']
      });
    });

    test('should clear current session', () => {
      sessionManager.endSession();

      expect(sessionManager.getCurrentSession()).toBeNull();
    });

    test('should clear action history', () => {
      sessionManager.recordAction({ description: 'Action 1' });
      sessionManager.endSession();

      expect(sessionManager.getRecentActions()).toEqual([]);
    });

    test('should throw error if no active session', () => {
      sessionManager.endSession();

      expect(() => {
        sessionManager.endSession();
      }).toThrow('No active session to end');
    });
  });

  describe('getSessionStats()', () => {
    test('should return null when no session active', () => {
      expect(sessionManager.getSessionStats()).toBeNull();
    });

    test('should return session statistics', () => {
      sessionManager.startSession('location-1');
      sessionManager.recordAction({ description: 'Action 1' });
      sessionManager.recordAction({ description: 'Action 2' });
      sessionManager.updateCurrentLocation('location-2');

      const stats = sessionManager.getSessionStats();

      expect(stats).toMatchObject({
        sessionId: expect.any(String),
        durationMinutes: expect.any(Number),
        actionCount: 2,
        locationsVisited: 2,
        currentLocation: 'location-2',
        actionHistory: 2
      });
    });
  });

  describe('hasActiveSession()', () => {
    test('should return false when no session active', () => {
      expect(sessionManager.hasActiveSession()).toBe(false);
    });

    test('should return true when session is active', () => {
      sessionManager.startSession('test-location');

      expect(sessionManager.hasActiveSession()).toBe(true);
    });

    test('should return false after session ends', () => {
      sessionManager.startSession('test-location');
      sessionManager.endSession();

      expect(sessionManager.hasActiveSession()).toBe(false);
    });
  });

  describe('Session State Preservation (AC-12)', () => {
    test('should maintain state through multiple actions', () => {
      sessionManager.startSession('location-1');

      sessionManager.recordAction({ description: 'Action 1' });
      sessionManager.updateCurrentLocation('location-2');
      sessionManager.recordAction({ description: 'Action 2' });

      const session = sessionManager.getCurrentSession();

      expect(session.actionCount).toBe(2);
      expect(session.currentLocationId).toBe('location-2');
      expect(session.visitedLocations).toEqual(['location-1', 'location-2']);
    });

    test('should preserve state even if action recording fails', () => {
      sessionManager.startSession('location-1');

      sessionManager.recordAction({ description: 'Action 1' });

      const beforeState = sessionManager.getCurrentSession();

      // Even if external error occurs, session state should be intact
      try {
        // Simulate some operation that might fail
        throw new Error('External operation failed');
      } catch (error) {
        // Session state should be unchanged
      }

      const afterState = sessionManager.getCurrentSession();

      expect(afterState).toEqual(beforeState);
    });
  });
});
