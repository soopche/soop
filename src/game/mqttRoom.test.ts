import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MQTT_BROKERS,
  MQTT_TOPIC_ROOT,
  PLAYER_HEARTBEAT_MS,
  PLAYER_INACTIVITY_TIMEOUT_MS,
  generateTwoDigitRoomCode,
  getOrCreateSessionPlayerId,
  getRoomEventsTopic,
  getRoomPlayerTopic,
  getRoomWildcardTopic,
  normalizePlayerProfileKey,
  parseTwoDigitRoomCode,
  pruneInactivePlayers,
  sanitizeCharacterProfile,
  type PlayerWireState,
} from './mqttRoom';

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

test('MQTT topics follow vox-arcanum-game-2026/room/XX schema and brokers include EMQX + HiveMQ', () => {
  assert.equal(MQTT_TOPIC_ROOT, 'vox-arcanum-game-2026/room');
  assert.equal(MQTT_BROKERS[0], 'wss://broker.emqx.io:8084/mqtt');
  assert.equal(MQTT_BROKERS[1], 'wss://broker.hivemq.com:8884/mqtt');
  assert.equal(PLAYER_HEARTBEAT_MS, 500);
  assert.equal(PLAYER_INACTIVITY_TIMEOUT_MS, 3000);

  assert.equal(getRoomWildcardTopic('42'), 'vox-arcanum-game-2026/room/42/#');
  assert.equal(
    getRoomPlayerTopic('42', 'wiz_abc123'),
    'vox-arcanum-game-2026/room/42/player/wiz_abc123'
  );
  assert.equal(getRoomEventsTopic('42'), 'vox-arcanum-game-2026/room/42/events');
  assert.throws(() => getRoomWildcardTopic('4'));
});

test('pruneInactivePlayers removes stale remote players after 3s timeout while keeping self', () => {
  const basePlayer = (id: string, lastSeenMs: number): PlayerWireState => ({
    id,
    name: id,
    x: 0,
    y: 0,
    z: 0,
    rotY: 0,
    hp: 100,
    maxHp: 100,
    level: 1,
    staffId: 'wand_ollivander',
    shieldActive: false,
    wins: 0,
    isDead: false,
    lastSeenMs,
  });

  const map = new Map<string, PlayerWireState>([
    ['self_1', basePlayer('self_1', 1000)],
    ['fresh_2', basePlayer('fresh_2', 9500)],
    ['stale_3', basePlayer('stale_3', 5000)],
  ]);

  const changed = pruneInactivePlayers(map, 'self_1', 10000, 3000);
  assert.equal(changed, true);
  assert.equal(map.has('self_1'), true);
  assert.equal(map.has('fresh_2'), true);
  assert.equal(map.has('stale_3'), false);
  assert.equal(pruneInactivePlayers(map, 'self_1', 10000, 3000), false);
});

test('getOrCreateSessionPlayerId persists per sessionStorage and isolates tabs/devices', () => {
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

test('normalizePlayerProfileKey and sanitizeCharacterProfile produce valid profiles', () => {
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
