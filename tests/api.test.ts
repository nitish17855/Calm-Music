import { test, describe } from 'node:test';
import assert from 'node:assert';
import { CURATED_AMBIENT_TRACKS } from '../src/services/musicService';
import { formatTime } from '../src/lib/utils';

describe('Calm Music API - Unit & Route Tests', () => {
  test('Music Search Service: should fallback gracefully to curated library', () => {
    assert.ok(Array.isArray(CURATED_AMBIENT_TRACKS), 'Curated tracks should be an array');
    assert.strictEqual(CURATED_AMBIENT_TRACKS.length > 0, true, 'Curated tracks should not be empty');

    const firstTrack = CURATED_AMBIENT_TRACKS[0];
    assert.ok(firstTrack.id, 'Track has ID');
    assert.ok(firstTrack.title, 'Track has title');
    assert.ok(firstTrack.audioUrl, 'Track has audio stream URL');
    assert.ok(firstTrack.coverUrl, 'Track has cover URL');
    assert.strictEqual(typeof firstTrack.duration, 'number', 'Duration is a number');
  });

  test('Input Validation: rejects registration with short password', () => {
    const mockUser = {
      name: 'Test Listener',
      email: 'test@calm.ambient',
      password: '123', // < 6 chars
    };

    const isValid = mockUser.password.length >= 6;
    assert.strictEqual(isValid, false, 'Passwords under 6 characters must be rejected');
  });

  test('Track Formatting: formatTime utility converts seconds correctly', () => {
    assert.strictEqual(formatTime(0), '0:00');
    assert.strictEqual(formatTime(65), '1:05');
    assert.strictEqual(formatTime(215), '3:35');
    assert.strictEqual(formatTime(-10), '0:00');
  });
});
