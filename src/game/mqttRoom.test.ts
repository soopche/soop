import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MQTT_BROKERS,
  MQTT_TOPIC_ROOT,
  PLAYER_HEARTBEAT_MS,
  PLAYER_INACTIVITY_TIMEOUT_MS,
  electCoordinatorId,
  generateTwoDigitRoomCode,
  getOrCreateSessionPlayerId,
  getRoomEventsTopic,
  getRoomPlayerTopic,
  getRoomWildcardTopic,
  normalizePlayerProfileKey,
  parseTwoDigitRoomCode,
  pruneInactivePlayers,
  recordWorldEventHistory,
  sanitizeCharacterProfile,
  selectPrioritizedEnemiesForSync,
  encodeCharacterCode,
  decodeCharacterCode,
  type PlayerWireState,
} from './mqttRoom';
import type { SharedWorldEventPayload } from './world3d';

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
    joinedAtMs: 1000,
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

test('electCoordinatorId chooses earliest joinedAtMs and breaks ties by id', () => {
  assert.equal(
    electCoordinatorId([
      { id: 'wiz_a', joinedAtMs: 5000 },
      { id: 'wiz_z', joinedAtMs: 1000 },
    ]),
    'wiz_z'
  );

  assert.equal(
    electCoordinatorId([
      { id: 'wiz_b', joinedAtMs: 2000 },
      { id: 'wiz_a', joinedAtMs: 2000 },
    ]),
    'wiz_a'
  );

  assert.equal(electCoordinatorId([]), null);
});

test('recordWorldEventHistory deletes wall_place_* on wall_dismantle and clears older campfire entries', () => {
  const history = new Map<string, { eventId: string; payload: SharedWorldEventPayload }>();

  recordWorldEventHistory(history, 'e1', {
    kind: 'wall_place',
    stage: 1,
    targetId: 'wall_42',
    x: 1,
    y: 0,
    z: 2,
  });
  recordWorldEventHistory(history, 'e2', {
    kind: 'campfire_place',
    stage: 1,
    targetId: 'cf_1',
    x: 5,
    y: 0,
    z: 5,
  });
  recordWorldEventHistory(history, 'e3', {
    kind: 'campfire_light',
    stage: 1,
    targetId: 'cf_1',
  });
  assert.equal(history.has('wall_place_wall_42'), true);
  assert.equal(history.has('campfire_place_cf_1'), true);
  assert.equal(history.has('campfire_light_cf_1'), true);

  recordWorldEventHistory(history, 'e4', {
    kind: 'wall_dismantle',
    stage: 1,
    targetId: 'wall_42',
  });
  assert.equal(history.has('wall_place_wall_42'), false);

  recordWorldEventHistory(history, 'e5', {
    kind: 'campfire_place',
    stage: 1,
    targetId: 'cf_2',
    x: 10,
    y: 0,
    z: 10,
  });
  assert.equal(history.has('campfire_place_cf_1'), false);
  assert.equal(history.has('campfire_light_cf_1'), false);
  assert.equal(history.has('campfire_place_cf_2'), true);

  recordWorldEventHistory(history, 'e6', {
    kind: 'prop_sync',
    stage: 1,
    targetId: 'crate_1',
    x: 0,
    y: 0,
    z: 0,
  });
  assert.equal(history.has('prop_sync_crate_1'), false);
});

test('selectPrioritizedEnemiesForSync sorts damaged enemies first and caps at 40', () => {
  const enemies = Array.from({ length: 55 }, (_, idx) => ({
    id: `enemy_${idx}`,
    hp: idx >= 45 ? 30 : 100,
    maxHp: 100,
  }));

  const selected = selectPrioritizedEnemiesForSync(enemies);
  assert.equal(selected.length, 40);
  // First 10 items must be the damaged enemies (indices 45..54)
  for (let i = 0; i < 10; i++) {
    assert.ok(selected[i].hp < selected[i].maxHp, `Expected damaged enemy at index ${i}`);
  }
  assert.equal(selected[0].id, 'enemy_45');
  assert.equal(selected[10].id, 'enemy_0');
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
      craftedPotions: [
        { id: 'pot_1', kind: 'health', name: 'Зелье ОЗ', restoreAmount: 35, accuracyPercent: 68 },
      ],
      cookedFoods: [
        {
          id: 'food_1',
          name: 'Жаркое',
          bonusMaxHp: 40,
          hpRegenPerSec: 0.4,
          durationSec: 200,
          accuracyPercent: 75,
        },
      ],
      cookedBatFoods: [
        {
          id: 'bat_1',
          name: 'Мышь + Вода',
          bonusMaxMp: 50,
          mpRegenPerSec: 0.6,
          durationSec: 240,
          accuracyPercent: 80,
        },
      ],
    },
    'local_guest'
  );

  assert.equal(sanitized.name, 'Волшебник');
  assert.equal(sanitized.playerLevel, 99);
  assert.equal(sanitized.selectedDifficulty, 2);
  assert.equal(sanitized.unlockedStageD1, 5);
  assert.equal(sanitized.craftedPotions.length, 1);
  assert.equal(sanitized.craftedPotions[0].restoreAmount, 35);
  assert.equal(sanitized.cookedFoods.length, 1);
  assert.equal(sanitized.cookedFoods[0].bonusMaxHp, 40);
  assert.equal(sanitized.cookedBatFoods.length, 1);
  assert.equal(sanitized.cookedBatFoods[0].bonusMaxMp, 50);
});

test('encodeCharacterCode and decodeCharacterCode round-trip Cyrillic character profiles safely', () => {
  const original = sanitizeCharacterProfile(
    {
      id: 'char_archmage',
      name: 'Архимаг Вокс',
      playerLevel: 7,
      playerXp: 240,
      unlockedStageD1: 4,
      craftedPotions: [
        { id: 'p1', kind: 'mana', name: 'Зелье Маны', restoreAmount: 60, accuracyPercent: 88 },
      ],
    },
    'local_guest'
  );

  const code = encodeCharacterCode(original);
  assert.ok(code.length > 40);

  const decoded = decodeCharacterCode(code, 'local_guest');
  assert.ok(decoded);
  assert.equal(decoded.name, 'Архимаг Вокс');
  assert.equal(decoded.playerLevel, 7);
  assert.equal(decoded.playerXp, 240);
  assert.equal(decoded.unlockedStageD1, 4);
  assert.equal(decoded.craftedPotions.length, 1);
  assert.equal(decoded.craftedPotions[0].kind, 'mana');

  assert.equal(decodeCharacterCode(''), null);
  assert.equal(decodeCharacterCode('not-valid-base64!!!'), null);
});

