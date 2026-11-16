import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PEER_ROOM_PREFIX,
  generateTwoDigitRoomCode,
  getOrCreateSessionPlayerId,
  normalizePlayerProfileKey,
  parseTwoDigitRoomCode,
  sanitizeCharacterProfile,
  toPeerRoomId,
} from './peerRoom';

test('generateTwoDigitRoomCode always returns strictly 2 digits from 10 to 99', () => {
  for (let i = 0; i < 150; i++) {
    const code = generateTwoDigitRoomCode();
    assert.match(code, /^[1-9]\d$/);
    const num = Number(code);
    assert.ok(num >= 10 && num <= 99, `Expected 10..99, got ${code}`);
  }
});

test('parseTwoDigitRoomCode extracts valid 2-digit codes and rejects invalid input', () => {
  assert.equal(parseTwoDigitRoomCode('42'), '42');
  assert.equal(parseTwoDigitRoomCode(' 75 '), '75');
  assert.equal(parseTwoDigitRoomCode('ab99cd'), '99');
  assert.equal(parseTwoDigitRoomCode('05'), '05');
  assert.equal(parseTwoDigitRoomCode('7'), null);
  assert.equal(parseTwoDigitRoomCode(''), null);
  assert.equal(parseTwoDigitRoomCode('room'), null);
});

test('toPeerRoomId prefixes 2-digit room codes with vox-arcanum-net-', () => {
  assert.equal(PEER_ROOM_PREFIX, 'vox-arcanum-net-');
  assert.equal(toPeerRoomId('42'), 'vox-arcanum-net-42');
  assert.equal(toPeerRoomId('75'), 'vox-arcanum-net-75');
  assert.throws(() => toPeerRoomId('4'));
});

test('getOrCreateSessionPlayerId persists per sessionStorage and isolates tabs', () => {
  const createMockStorage = () => {
    const map = new Map<string, string>();
    return {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        map.set(k, v);
      },
    };
  };

  const tabA = createMockStorage();
  const tabB = createMockStorage();

  const idA1 = getOrCreateSessionPlayerId(tabA);
  const idA2 = getOrCreateSessionPlayerId(tabA);
  const idB1 = getOrCreateSessionPlayerId(tabB);

  assert.equal(idA1, idA2);
  assert.match(idA1, /^wiz_[a-zA-Z0-9_\-]+$/);
  assert.match(idB1, /^wiz_[a-zA-Z0-9_\-]+$/);
});

test('normalizePlayerProfileKey produces stable safe IDs and sanitizeCharacterProfile clamps fields', () => {
  const key1 = normalizePlayerProfileKey('Архимаг Вокс');
  const key2 = normalizePlayerProfileKey('  архимаг вокс ');
  assert.equal(key1, key2);
  assert.match(key1, /^prof_/);

  const sanitized = sanitizeCharacterProfile(
    {
      name: '  Волшебник  ',
      playerLevel: 200,
      highestUnlockedDifficulty: 2,
      selectedDifficulty: 5 as unknown as 1,
      unlockedStageD1: 9 as unknown as 1,
    },
    'local_guest'
  );

  assert.equal(sanitized.name, 'Волшебник');
  assert.equal(sanitized.playerLevel, 99);
  assert.equal(sanitized.selectedDifficulty, 2);
  assert.equal(sanitized.unlockedStageD1, 5);
});
