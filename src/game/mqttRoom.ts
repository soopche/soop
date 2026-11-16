import mqtt, { type MqttClient } from 'mqtt';
import {
  CHARACTER_ID_MAX_LENGTH,
  CHARACTER_NAME_MAX_LENGTH,
  createDefaultCharacterProfile,
  type ArtifactId,
  type ArtifactSlot,
  type CharacterProfileData,
  type DifficultyTier,
  type EquipmentId,
  type LabyrinthMultiplayerMode,
  type LabyrinthStageId,
  type ReagentId,
  type SpellId,
  type TameableSpeciesId,
} from './spells';
import type { RemotePlayerState, SharedWorldEventPayload } from './world3d';

export const MQTT_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
] as const;

export const MQTT_TOPIC_ROOT = 'vox-arcanum-game-2026/room';
export const PLAYER_HEARTBEAT_MS = 500;
export const PLAYER_INACTIVITY_TIMEOUT_MS = 3000;

// ============================================================================
// TWO-DIGIT ROOM CODE, TOPIC & SESSION PLAYER ID HELPERS
// ============================================================================
export function generateTwoDigitRoomCode(): string {
  return String(Math.floor(10 + Math.random() * 90));
}

export function parseTwoDigitRoomCode(raw: string): string | null {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 2);
  if (!/^\d{2}$/.test(digits)) return null;
  return digits;
}

export function getRoomWildcardTopic(twoDigitCode: string): string {
  const parsed = parseTwoDigitRoomCode(twoDigitCode);
  if (!parsed) {
    throw new Error(`Invalid two-digit room code: "${twoDigitCode}"`);
  }
  return `${MQTT_TOPIC_ROOT}/${parsed}/#`;
}

export function getRoomPlayerTopic(twoDigitCode: string, playerId: string): string {
  const parsed = parseTwoDigitRoomCode(twoDigitCode);
  if (!parsed) {
    throw new Error(`Invalid two-digit room code: "${twoDigitCode}"`);
  }
  const safeId = (playerId || 'anon').replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 64) || 'anon';
  return `${MQTT_TOPIC_ROOT}/${parsed}/player/${safeId}`;
}

export function getRoomEventsTopic(twoDigitCode: string): string {
  const parsed = parseTwoDigitRoomCode(twoDigitCode);
  if (!parsed) {
    throw new Error(`Invalid two-digit room code: "${twoDigitCode}"`);
  }
  return `${MQTT_TOPIC_ROOT}/${parsed}/events`;
}

const SESSION_PLAYER_ID_KEY = 'vox_arcanum_session_player_id_v1';

export function getOrCreateSessionPlayerId(
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null
): string {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
      ? window.sessionStorage
      : null;

  const fallbackId = `wiz_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  if (!targetStorage) return fallbackId;

  try {
    let existing = targetStorage.getItem(SESSION_PLAYER_ID_KEY);
    if (!existing || !/^[a-zA-Z0-9_\-]+$/.test(existing)) {
      existing = fallbackId;
      targetStorage.setItem(SESSION_PLAYER_ID_KEY, existing);
    }
    return existing.slice(0, 64);
  } catch {
    return fallbackId;
  }
}

export interface PlayerWireState extends RemotePlayerState {
  isDead: boolean;
  lastSeenMs: number;
}

/**
 * Pure helper to prune players who have not sent a heartbeat within timeoutMs
 * (always preserving selfId).
 */
export function pruneInactivePlayers(
  players: Map<string, PlayerWireState>,
  selfId: string,
  nowMs: number,
  timeoutMs = PLAYER_INACTIVITY_TIMEOUT_MS
): boolean {
  let changed = false;
  for (const [pid, p] of players.entries()) {
    if (pid !== selfId && nowMs - p.lastSeenMs > timeoutMs) {
      players.delete(pid);
      changed = true;
    }
  }
  return changed;
}

// ============================================================================
// LOCAL CHARACTER PROFILE STORAGE & SANITIZATION
// ============================================================================
const LOCAL_CHARS_KEY_PREFIX = 'vox_arcanum_characters_v1_';
const LOCAL_ACTIVE_CHAR_KEY_PREFIX = 'vox_arcanum_active_char_v1_';
const LOCAL_GUEST_SEED_KEY = 'vox_arcanum_guest_device_id_v1';

function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const CYRILLIC_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

function toAsciiSlug(raw: string): string {
  let out = '';
  for (const ch of raw.toLowerCase()) {
    if (CYRILLIC_MAP[ch] !== undefined) {
      out += CYRILLIC_MAP[ch];
    } else if (/[a-z0-9_\-]/.test(ch)) {
      out += ch;
    } else if (/\s/.test(ch)) {
      out += '_';
    }
  }
  return out.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

export function normalizePlayerProfileKey(nameOrCode: string): string {
  const trimmed = (nameOrCode || '').trim();
  if (!trimmed) return 'prof_default';
  const normalized = trimmed.toLowerCase();
  const hash = fnv1aHex(normalized);
  const slug = toAsciiSlug(normalized).slice(0, 32);
  const combined = slug ? `prof_${hash}_${slug}` : `prof_${hash}`;
  return combined.slice(0, CHARACTER_ID_MAX_LENGTH);
}

export function getOrCreateGuestDeviceId(): string {
  if (typeof window === 'undefined') return 'char_1';
  try {
    let existing = window.localStorage.getItem(LOCAL_GUEST_SEED_KEY);
    if (!existing || !/^[a-zA-Z0-9_\-]+$/.test(existing)) {
      existing = `char_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      window.localStorage.setItem(LOCAL_GUEST_SEED_KEY, existing);
    }
    return existing.slice(0, CHARACTER_ID_MAX_LENGTH);
  } catch {
    return 'char_1';
  }
}

export function sanitizeCharacterProfile(
  raw: Partial<CharacterProfileData> | Record<string, unknown>,
  fallbackOwnerId = 'local_guest'
): CharacterProfileData {
  const base = createDefaultCharacterProfile(
    typeof raw.ownerId === 'string' && raw.ownerId.trim()
      ? raw.ownerId.trim()
      : fallbackOwnerId,
    typeof raw.name === 'string' ? raw.name : 'Магистр Арканума',
    typeof raw.id === 'string' ? raw.id : undefined
  );

  const clampInt = (val: unknown, min: number, max: number, def: number): number => {
    const n = typeof val === 'number' && Number.isFinite(val) ? Math.round(val) : def;
    return Math.max(min, Math.min(max, n));
  };

  const safeId =
    (typeof raw.id === 'string' ? raw.id : base.id)
      .replace(/[^a-zA-Z0-9_\-]/g, '')
      .slice(0, CHARACTER_ID_MAX_LENGTH) || base.id;

  const safeOwnerId =
    (typeof raw.ownerId === 'string' && raw.ownerId.trim()
      ? raw.ownerId.trim()
      : fallbackOwnerId
    )
      .replace(/[^a-zA-Z0-9_\-]/g, '')
      .slice(0, 128) || 'local_guest';

  const safeName =
    (typeof raw.name === 'string' ? raw.name.trim() : base.name).slice(
      0,
      CHARACTER_NAME_MAX_LENGTH
    ) || 'Магистр Арканума';

  const highestUnlockedDifficulty = clampInt(
    raw.highestUnlockedDifficulty,
    1,
    2,
    base.highestUnlockedDifficulty
  ) as DifficultyTier;

  const selectedDifficulty = clampInt(
    raw.selectedDifficulty,
    1,
    highestUnlockedDifficulty,
    1
  ) as DifficultyTier;

  const unlockedStageD1 = clampInt(
    raw.unlockedStageD1 ?? raw.highestUnlockedStage,
    1,
    5,
    1
  ) as 1 | 2 | 3 | 4 | 5;

  const unlockedStageD2 = clampInt(raw.unlockedStageD2, 1, 5, 1) as 1 | 2 | 3 | 4 | 5;

  const highestUnlockedStage = (
    selectedDifficulty === 2 ? unlockedStageD2 : unlockedStageD1
  ) as 1 | 2 | 3 | 4 | 5;

  const ownedEquipment: EquipmentId[] = Array.isArray(raw.ownedEquipment)
    ? (raw.ownedEquipment
        .filter((x): x is EquipmentId => typeof x === 'string' && x.length >= 1 && x.length <= 64)
        .slice(0, 10) as EquipmentId[])
    : base.ownedEquipment;
  if (ownedEquipment.length === 0) {
    ownedEquipment.push('wand_ollivander');
  }

  const ownedArtifacts: ArtifactId[] = Array.isArray(raw.ownedArtifacts)
    ? (raw.ownedArtifacts
        .filter((x): x is ArtifactId => typeof x === 'string' && x.length >= 1 && x.length <= 64)
        .slice(0, 60) as ArtifactId[])
    : [];

  const equippedArtifacts: Partial<Record<ArtifactSlot, ArtifactId>> = {};
  if (raw.equippedArtifacts && typeof raw.equippedArtifacts === 'object') {
    const validSlots: ArtifactSlot[] = ['robe', 'gloves', 'ring', 'boots'];
    for (const slot of validSlots) {
      const val = (raw.equippedArtifacts as Record<string, unknown>)[slot];
      if (typeof val === 'string' && val.length >= 1 && val.length <= 64) {
        equippedArtifacts[slot] = val as ArtifactId;
      }
    }
  }

  const spellLevels: Record<SpellId, number> = { ...base.spellLevels };
  if (raw.spellLevels && typeof raw.spellLevels === 'object') {
    for (const key of Object.keys(base.spellLevels) as SpellId[]) {
      const v = (raw.spellLevels as Record<string, unknown>)[key];
      spellLevels[key] = clampInt(v, 1, 6, 1);
    }
  }

  const reagentInventory: Record<ReagentId, number> = { ...base.reagentInventory };
  if (raw.reagentInventory && typeof raw.reagentInventory === 'object') {
    for (const key of Object.keys(base.reagentInventory) as ReagentId[]) {
      const v = (raw.reagentInventory as Record<string, unknown>)[key];
      reagentInventory[key] = clampInt(v, 0, 9999, base.reagentInventory[key]);
    }
  }

  const claimedQuestIds: string[] = Array.isArray(raw.claimedQuestIds)
    ? raw.claimedQuestIds
        .filter((x): x is string => typeof x === 'string' && x.length >= 1 && x.length <= 64)
        .slice(0, 50)
    : [];

  const equippedStaffId = (
    typeof raw.equippedStaffId === 'string' &&
    raw.equippedStaffId.length >= 1 &&
    raw.equippedStaffId.length <= 40
      ? raw.equippedStaffId
      : 'wand_ollivander'
  ) as EquipmentId;

  const tamedPetSpecies = (
    typeof raw.tamedPetSpecies === 'string' &&
    raw.tamedPetSpecies.length >= 1 &&
    raw.tamedPetSpecies.length <= 24
      ? raw.tamedPetSpecies
      : 'none'
  ) as TameableSpeciesId | 'none';

  return {
    id: safeId,
    ownerId: safeOwnerId,
    name: safeName,
    playerLevel: clampInt(raw.playerLevel, 1, 99, 1),
    playerXp: clampInt(raw.playerXp, 0, 10000000, 0),
    gestureMasteryLevel: clampInt(raw.gestureMasteryLevel, 1, 10, 1),
    highestUnlockedStage,
    highestUnlockedDifficulty,
    selectedDifficulty,
    unlockedStageD1,
    unlockedStageD2,
    equippedStaffId,
    ownedEquipment,
    ownedArtifacts,
    equippedArtifacts,
    spellLevels,
    reagentInventory,
    tamedPetSpecies,
    tamedPetLevel: clampInt(raw.tamedPetLevel, 1, 10, 1),
    tamedPetTrainingStep: clampInt(raw.tamedPetTrainingStep, 0, 5, 0),
    tamedPetXp: clampInt(raw.tamedPetXp, 0, 1000000, 0),
    claimedQuestIds,
    updatedAtMs:
      typeof raw.updatedAtMs === 'number' && Number.isFinite(raw.updatedAtMs)
        ? raw.updatedAtMs
        : Date.now(),
  };
}

function getStorageKeyForOwner(ownerId: string): string {
  return `${LOCAL_CHARS_KEY_PREFIX}${ownerId || 'local_guest'}`;
}

export function loadLocalCharacters(ownerId = 'local_guest'): CharacterProfileData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(getStorageKeyForOwner(ownerId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => sanitizeCharacterProfile(item, ownerId))
      .filter(Boolean) as CharacterProfileData[];
  } catch {
    return [];
  }
}

export function saveLocalCharacters(
  ownerId: string,
  characters: CharacterProfileData[]
): void {
  if (typeof window === 'undefined') return;
  try {
    const sanitized = characters.map((c) => sanitizeCharacterProfile(c, ownerId));
    window.localStorage.setItem(getStorageKeyForOwner(ownerId), JSON.stringify(sanitized));
  } catch {
    // Ignore storage quota errors
  }
}

export function getActiveCharacterIdFromStorage(ownerId = 'local_guest'): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(
      `${LOCAL_ACTIVE_CHAR_KEY_PREFIX}${ownerId || 'local_guest'}`
    );
  } catch {
    return null;
  }
}

export function setActiveCharacterIdInStorage(ownerId: string, characterId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `${LOCAL_ACTIVE_CHAR_KEY_PREFIX}${ownerId || 'local_guest'}`,
      characterId
    );
  } catch {
    // Ignore
  }
}

// ============================================================================
// REAL-TIME MQTT OVER WEBSOCKETS MULTIPLAYER CONTROLLER
// ============================================================================
export interface MqttRoomConnectionOptions {
  roomCode: string; // Strictly 2 digits ('10'..'99')
  playerId: string;
  playerName: string;
  maxHp: number;
  level: number;
  staffId: string;
  labyrinthMode: LabyrinthMultiplayerMode;
  stage: LabyrinthStageId;
  onConnectedChange: (connected: boolean) => void;
  onConnectionError?: (message: string) => void;
  onPlayersSync: (players: RemotePlayerState[]) => void;
  onModeChanged: (mode: LabyrinthMultiplayerMode) => void;
  onGameStarted: (data: {
    room: string;
    labyrinthStage: 1 | 2 | 3 | 4 | 5;
    hostId: string;
  }) => void;
  onAllDeadReset: (stage: 1 | 2 | 3 | 4 | 5) => void;
  onPlayerDowned: (playerId: string) => void;
  onSpellSpawned: (data: {
    casterId: string;
    spellId: string;
    power: number;
    accuracy: number;
    origin: { x: number; y: number; z: number };
    direction: { x: number; y: number; z: number };
    color: string;
  }) => void;
  onEnemyDamaged: (data: {
    enemyId: string;
    stage: number;
    hp: number;
    maxHp: number;
    damage: number;
    attackerId: string;
    spellId: string;
    stunSec: number;
    freezeSec: number;
    killed: boolean;
    x: number;
    z: number;
  }) => void;
  onEnemySynced: (data: {
    stage: number;
    senderId: string;
    enemies: Array<{
      id: string;
      hp: number;
      maxHp: number;
      x: number;
      y: number;
      z: number;
      state: string;
      killed: boolean;
    }>;
  }) => void;
  onWorldEvent: (ev: SharedWorldEventPayload) => void;
  onStageAdvanced: (data: {
    stage: number;
    victory: boolean;
    reset: boolean;
    senderId: string;
  }) => void;
  onPlayerDamaged: (data: {
    targetId: string;
    attackerId: string;
    attackerName: string;
    damage: number;
  }) => void;
  onDuelReset: () => void;
}

export interface MqttRoomController {
  roomCode: string;
  brokerUrl: string;
  sendMove: (pos: {
    x: number;
    y: number;
    z: number;
    rotY: number;
    hp: number;
    maxHp: number;
    shieldActive: boolean;
    name: string;
    staffId: string;
    level: number;
  }) => void;
  sendSpellCast: (payload: {
    spellId: string;
    spellName: string;
    casterName: string;
    power: number;
    accuracy: number;
    origin: { x: number; y: number; z: number };
    direction: { x: number; y: number; z: number };
    color: string;
  }) => void;
  sendPlayerHit: (targetId: string, damage: number, attackerName: string) => void;
  sendEnemyHit: (payload: {
    hitId: string;
    enemyId: string;
    stage: number;
    damage: number;
    maxHp: number;
    x: number;
    y: number;
    z: number;
    spellId: string;
    stunSec: number;
    freezeSec: number;
  }) => void;
  sendEnemySync: (payload: {
    stage: number;
    enemies: Array<{
      id: string;
      hp: number;
      maxHp: number;
      x: number;
      y: number;
      z: number;
      state: string;
    }>;
  }) => void;
  sendWorldEvent: (payload: SharedWorldEventPayload) => void;
  sendSetMode: (nextMode: LabyrinthMultiplayerMode, stage: LabyrinthStageId) => void;
  sendStartGame: (stage: 1 | 2 | 3 | 4 | 5) => void;
  sendStageAdvance: (payload: {
    stage: LabyrinthStageId;
    victory: boolean;
    reset: boolean;
  }) => void;
  sendPlayerDied: (stage: LabyrinthStageId) => void;
  sendPlayerRespawn: (maxHp: number) => void;
  sendDuelReset: () => void;
  dispose: () => void;
}

interface EnemyWireState {
  id: string;
  stage: number;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  z: number;
  state: string;
  killed: boolean;
}

type PlayerTopicPayload =
  | {
      type: 'state';
      join?: boolean;
      player: RemotePlayerState & { isDead: boolean };
    }
  | {
      type: 'leave';
      playerId: string;
    };

type RoomEventMessage =
  | {
      type: 'init_state';
      eventId: string;
      targetId: string;
      senderId: string;
      labyrinthMode: LabyrinthMultiplayerMode;
      labyrinthStage: number;
      stageEpoch: number;
      enemies: EnemyWireState[];
      worldEvents: Array<{ eventId: string; payload: SharedWorldEventPayload }>;
    }
  | {
      type: 'spell_cast';
      eventId: string;
      casterId: string;
      spellId: string;
      power: number;
      accuracy: number;
      origin: { x: number; y: number; z: number };
      direction: { x: number; y: number; z: number };
      color: string;
    }
  | {
      type: 'player_hit';
      eventId: string;
      targetId: string;
      attackerId: string;
      attackerName: string;
      damage: number;
    }
  | {
      type: 'enemy_hit';
      hitId: string;
      enemyId: string;
      stage: number;
      stageEpoch: number;
      damage: number;
      maxHp: number;
      x: number;
      y: number;
      z: number;
      spellId: string;
      stunSec: number;
      freezeSec: number;
      attackerId: string;
    }
  | {
      type: 'enemy_damaged';
      hitId: string;
      enemyId: string;
      stage: number;
      stageEpoch: number;
      hp: number;
      maxHp: number;
      damage: number;
      attackerId: string;
      spellId: string;
      stunSec: number;
      freezeSec: number;
      killed: boolean;
      x: number;
      z: number;
    }
  | {
      type: 'enemy_sync';
      stage: number;
      stageEpoch: number;
      senderId: string;
      enemies: EnemyWireState[];
    }
  | {
      type: 'world_event';
      eventId: string;
      stageEpoch: number;
      senderId: string;
      payload: SharedWorldEventPayload;
    }
  | {
      type: 'set_mode';
      eventId: string;
      senderId: string;
      labyrinthMode: LabyrinthMultiplayerMode;
      stage: number;
    }
  | {
      type: 'start_game';
      eventId: string;
      roomCode: string;
      stage: 1 | 2 | 3 | 4 | 5;
      hostId: string;
      stageEpoch: number;
    }
  | {
      type: 'stage_advance';
      eventId: string;
      stage: number;
      victory: boolean;
      reset: boolean;
      senderId: string;
      stageEpoch: number;
    }
  | {
      type: 'player_died';
      eventId: string;
      playerId: string;
      stage: number;
    }
  | {
      type: 'player_respawn';
      eventId: string;
      playerId: string;
      maxHp: number;
    }
  | {
      type: 'all_dead_reset';
      eventId: string;
      stage: 1 | 2 | 3 | 4 | 5;
      stageEpoch: number;
    }
  | {
      type: 'duel_reset';
      eventId: string;
      senderId: string;
    };

function toStageNum(n: unknown): 1 | 2 | 3 | 4 | 5 {
  return n === 2 ? 2 : n === 3 ? 3 : n === 4 ? 4 : n === 5 ? 5 : 1;
}

export function connectMqttRoom(opts: MqttRoomConnectionOptions): MqttRoomController {
  const activeCode = parseTwoDigitRoomCode(opts.roomCode) || generateTwoDigitRoomCode();
  const selfId = opts.playerId;

  const wildcardTopic = getRoomWildcardTopic(activeCode);
  const selfPlayerTopic = getRoomPlayerTopic(activeCode, selfId);
  const eventsTopic = getRoomEventsTopic(activeCode);
  const playerTopicPrefix = `${MQTT_TOPIC_ROOT}/${activeCode}/player/`;

  let disposed = false;
  let brokerIndex = 0;
  let currentBrokerUrl: string = MQTT_BROKERS[0];
  let client: MqttClient | null = null;
  let connectWatchdogTimer: number | null = null;
  let isConnected = false;

  let currentLabyrinthMode: LabyrinthMultiplayerMode = opts.labyrinthMode;
  let currentLabyrinthStage: number = opts.stage;
  let currentStageEpoch = 1;

  let selfPlayer: PlayerWireState = {
    id: selfId,
    name: (opts.playerName || 'Арканист').trim().slice(0, 40) || 'Арканист',
    x: 0,
    y: 0,
    z: 92,
    rotY: 0,
    hp: Math.max(0, Math.round(opts.maxHp || 100)),
    maxHp: Math.max(1, Math.round(opts.maxHp || 100)),
    level: Math.max(1, Math.round(opts.level || 1)),
    staffId: (opts.staffId || 'wand_ollivander').slice(0, 40),
    shieldActive: false,
    wins: 0,
    isDead: false,
    lastSeenMs: Date.now(),
  };

  const playersMap = new Map<string, PlayerWireState>();
  playersMap.set(selfId, selfPlayer);
  const enemiesMap = new Map<string, EnemyWireState>();
  const worldEventsHistory = new Map<string, { eventId: string; payload: SharedWorldEventPayload }>();

  const seenEventIds = new Set<string>();
  const seenDeadIds = new Set<string>();
  const lastPropSyncTimes = new Map<string, number>();
  let lastMovePublishedAt = 0;
  let lastMoveSignature = '';
  let lastEnemySyncAt = 0;
  let lastHeartbeatPublishedAt = 0;

  const rememberId = (id: string): boolean => {
    if (!id) return false;
    if (seenEventIds.has(id)) return true;
    seenEventIds.add(id);
    if (seenEventIds.size > 1500) {
      const first = seenEventIds.values().next().value;
      if (first) seenEventIds.delete(first);
    }
    return false;
  };

  const isCoordinator = (): boolean => {
    const ids = Array.from(playersMap.keys()).sort();
    return ids.length === 0 || ids[0] === selfId;
  };

  const emitPlayersSync = () => {
    if (disposed) return;
    const list = Array.from(playersMap.values());
    const nextDead = new Set<string>();
    for (const p of list) {
      if (p.isDead) {
        nextDead.add(p.id);
        if (p.id !== selfId && !seenDeadIds.has(p.id)) {
          opts.onPlayerDowned(p.id);
        }
      }
    }
    seenDeadIds.clear();
    for (const d of nextDead) seenDeadIds.add(d);

    opts.onPlayersSync(
      list.map(({ isDead: _d, lastSeenMs: _l, ...remote }) => remote)
    );
  };

  const publishJson = (topic: string, data: unknown) => {
    if (disposed || !client || !client.connected) return;
    try {
      client.publish(topic, JSON.stringify(data), { qos: 0, retain: false });
    } catch {
      // Ignore transient publish failure while reconnecting
    }
  };

  const publishSelfState = (isJoin = false) => {
    const now = Date.now();
    selfPlayer.lastSeenMs = now;
    playersMap.set(selfId, selfPlayer);
    lastHeartbeatPublishedAt = now;
    const { lastSeenMs: _omit, ...wirePlayer } = selfPlayer;
    const payload: PlayerTopicPayload = {
      type: 'state',
      ...(isJoin ? { join: true } : {}),
      player: wirePlayer,
    };
    publishJson(selfPlayerTopic, payload);
  };

  const resetEpochState = (nextEpoch: number) => {
    currentStageEpoch = nextEpoch;
    enemiesMap.clear();
    worldEventsHistory.clear();
    for (const p of playersMap.values()) {
      p.isDead = false;
    }
    selfPlayer.isDead = false;
    seenDeadIds.clear();
  };

  const handlePlayerTopicMessage = (topicPlayerId: string, raw: unknown) => {
    if (!raw || typeof raw !== 'object' || !('type' in raw)) return;
    const msg = raw as PlayerTopicPayload;

    if (msg.type === 'leave') {
      const leaverId = msg.playerId || topicPlayerId;
      if (!leaverId || leaverId === selfId) return;
      if (playersMap.delete(leaverId)) {
        emitPlayersSync();
      }
      return;
    }

    if (msg.type === 'state' && msg.player) {
      const incomingId = msg.player.id || topicPlayerId;
      if (!incomingId || incomingId === selfId) return;
      const wasKnown = playersMap.has(incomingId);
      const nextPlayer: PlayerWireState = {
        ...msg.player,
        id: incomingId,
        lastSeenMs: Date.now(),
      };
      playersMap.set(incomingId, nextPlayer);
      emitPlayersSync();

      // When a new player joins, publish our own state immediately so they see us without waiting 500ms,
      // and coordinator sends current world/enemy snapshot.
      if (!wasKnown || msg.join) {
        publishSelfState(false);
        if (isCoordinator() && (enemiesMap.size > 0 || worldEventsHistory.size > 0 || currentLabyrinthStage > 1 || currentLabyrinthMode !== 'shared')) {
          publishJson(eventsTopic, {
            type: 'init_state',
            eventId: `init_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            targetId: incomingId,
            senderId: selfId,
            labyrinthMode: currentLabyrinthMode,
            labyrinthStage: currentLabyrinthStage,
            stageEpoch: currentStageEpoch,
            enemies: Array.from(enemiesMap.values()),
            worldEvents: Array.from(worldEventsHistory.values()),
          } satisfies RoomEventMessage);
        }
      }
    }
  };

  const handleEventTopicMessage = (raw: unknown) => {
    if (!raw || typeof raw !== 'object' || !('type' in raw)) return;
    const msg = raw as RoomEventMessage;

    switch (msg.type) {
      case 'init_state': {
        if (msg.senderId === selfId || rememberId(msg.eventId)) return;
        if (msg.targetId !== selfId) return;
        currentLabyrinthMode = msg.labyrinthMode;
        currentLabyrinthStage = msg.labyrinthStage;
        currentStageEpoch = msg.stageEpoch;
        opts.onModeChanged(msg.labyrinthMode);
        if (msg.enemies.length > 0 && msg.labyrinthMode === 'shared') {
          for (const e of msg.enemies) {
            enemiesMap.set(e.id, e);
          }
          opts.onEnemySynced({
            stage: msg.labyrinthStage,
            senderId: msg.senderId,
            enemies: msg.enemies,
          });
        }
        for (const item of msg.worldEvents) {
          if (!rememberId(item.eventId)) {
            worldEventsHistory.set(`${item.payload.kind}_${item.payload.targetId}`, item);
            opts.onWorldEvent(item.payload);
          }
        }
        break;
      }

      case 'spell_cast': {
        if (msg.casterId === selfId || rememberId(msg.eventId)) return;
        opts.onSpellSpawned({
          casterId: msg.casterId,
          spellId: msg.spellId,
          power: msg.power,
          accuracy: msg.accuracy,
          origin: msg.origin,
          direction: msg.direction,
          color: msg.color,
        });
        break;
      }

      case 'player_hit': {
        if (msg.targetId !== selfId || rememberId(msg.eventId)) return;
        opts.onPlayerDamaged({
          targetId: msg.targetId,
          attackerId: msg.attackerId,
          attackerName: msg.attackerName,
          damage: msg.damage,
        });
        break;
      }

      case 'enemy_hit': {
        if (currentLabyrinthMode !== 'shared') return;
        if (msg.stageEpoch !== currentStageEpoch) return;
        if (msg.attackerId === selfId) return;

        // Coordinator resolves authoritative damage; if we are not coordinator we still wait for enemy_damaged
        if (!isCoordinator()) return;
        if (rememberId(`resolve_${msg.hitId}`)) return;

        const existing = enemiesMap.get(msg.enemyId);
        if (existing && (existing.killed || existing.hp <= 0)) return;
        const prevHp = existing ? existing.hp : msg.maxHp;
        const nextHp = Math.max(0, prevHp - msg.damage);
        const killed = nextHp <= 0;

        enemiesMap.set(msg.enemyId, {
          id: msg.enemyId,
          stage: msg.stage,
          hp: nextHp,
          maxHp: msg.maxHp,
          x: msg.x,
          y: msg.y,
          z: msg.z,
          state: killed ? 'ko' : 'seek',
          killed,
        });

        const damagedMsg: RoomEventMessage = {
          type: 'enemy_damaged',
          hitId: msg.hitId,
          enemyId: msg.enemyId,
          stage: msg.stage,
          stageEpoch: currentStageEpoch,
          hp: nextHp,
          maxHp: msg.maxHp,
          damage: msg.damage,
          attackerId: msg.attackerId,
          spellId: msg.spellId,
          stunSec: msg.stunSec,
          freezeSec: msg.freezeSec,
          killed,
          x: msg.x,
          z: msg.z,
        };
        opts.onEnemyDamaged(damagedMsg);
        publishJson(eventsTopic, damagedMsg);
        break;
      }

      case 'enemy_damaged': {
        if (currentLabyrinthMode !== 'shared') return;
        if (msg.stageEpoch !== currentStageEpoch) return;
        if (rememberId(msg.hitId)) return;

        enemiesMap.set(msg.enemyId, {
          id: msg.enemyId,
          stage: msg.stage,
          hp: msg.hp,
          maxHp: msg.maxHp,
          x: msg.x,
          y: 0,
          z: msg.z,
          state: msg.killed ? 'ko' : 'seek',
          killed: msg.killed,
        });
        if (msg.attackerId !== selfId) {
          opts.onEnemyDamaged(msg);
        }
        break;
      }

      case 'enemy_sync': {
        if (currentLabyrinthMode !== 'shared') return;
        if (msg.stageEpoch !== currentStageEpoch) return;
        if (msg.senderId === selfId) return;
        for (const e of msg.enemies) {
          enemiesMap.set(e.id, e);
        }
        opts.onEnemySynced({
          stage: msg.stage,
          senderId: msg.senderId,
          enemies: msg.enemies,
        });
        break;
      }

      case 'world_event': {
        if (currentLabyrinthMode !== 'shared') return;
        if (msg.stageEpoch !== currentStageEpoch) return;
        if (msg.senderId === selfId) return;
        if (msg.payload.kind !== 'prop_sync' && rememberId(msg.eventId)) return;

        if (msg.payload.kind === 'wall_dismantle') {
          worldEventsHistory.delete(`wall_${msg.payload.targetId}`);
        } else if (msg.payload.kind !== 'prop_sync') {
          worldEventsHistory.set(`${msg.payload.kind}_${msg.payload.targetId}`, {
            eventId: msg.eventId,
            payload: msg.payload,
          });
        }
        opts.onWorldEvent(msg.payload);
        break;
      }

      case 'set_mode': {
        if (msg.senderId === selfId || rememberId(msg.eventId)) return;
        currentLabyrinthMode = msg.labyrinthMode;
        currentLabyrinthStage = msg.stage;
        opts.onModeChanged(msg.labyrinthMode);
        break;
      }

      case 'start_game': {
        if (msg.hostId === selfId || rememberId(msg.eventId)) return;
        currentLabyrinthMode = 'shared';
        currentLabyrinthStage = msg.stage;
        resetEpochState(msg.stageEpoch);
        opts.onGameStarted({
          room: msg.roomCode,
          labyrinthStage: msg.stage,
          hostId: msg.hostId,
        });
        break;
      }

      case 'stage_advance': {
        if (currentLabyrinthMode !== 'shared') return;
        if (msg.senderId === selfId || rememberId(msg.eventId)) return;
        currentLabyrinthStage = msg.stage;
        resetEpochState(msg.stageEpoch);
        opts.onStageAdvanced({
          stage: msg.stage,
          victory: msg.victory,
          reset: msg.reset,
          senderId: msg.senderId,
        });
        break;
      }

      case 'player_died': {
        if (rememberId(msg.eventId)) return;
        const p = playersMap.get(msg.playerId);
        if (p) {
          p.isDead = true;
          p.hp = 0;
        }
        emitPlayersSync();
        if (isCoordinator()) {
          const allDead =
            playersMap.size > 0 && Array.from(playersMap.values()).every((pl) => pl.isDead);
          if (allDead) {
            const resetStage = toStageNum(msg.stage);
            resetEpochState(currentStageEpoch + 1);
            const resetMsg: RoomEventMessage = {
              type: 'all_dead_reset',
              eventId: `adr_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              stage: resetStage,
              stageEpoch: currentStageEpoch,
            };
            rememberId(resetMsg.eventId);
            opts.onAllDeadReset(resetStage);
            publishJson(eventsTopic, resetMsg);
          }
        }
        break;
      }

      case 'player_respawn': {
        if (rememberId(msg.eventId)) return;
        const p = playersMap.get(msg.playerId);
        if (p) {
          p.isDead = false;
          p.hp = msg.maxHp;
        }
        emitPlayersSync();
        break;
      }

      case 'all_dead_reset': {
        if (rememberId(msg.eventId)) return;
        resetEpochState(msg.stageEpoch);
        opts.onAllDeadReset(msg.stage);
        break;
      }

      case 'duel_reset': {
        if (msg.senderId === selfId || rememberId(msg.eventId)) return;
        for (const p of playersMap.values()) {
          p.isDead = false;
          p.hp = p.maxHp;
        }
        selfPlayer.isDead = false;
        selfPlayer.hp = selfPlayer.maxHp;
        emitPlayersSync();
        opts.onDuelReset();
        break;
      }

      default:
        break;
    }
  };

  const clearWatchdog = () => {
    if (connectWatchdogTimer !== null) {
      window.clearTimeout(connectWatchdogTimer);
      connectWatchdogTimer = null;
    }
  };

  const connectToBroker = (index: number) => {
    if (disposed) return;
    brokerIndex = index;
    currentBrokerUrl = MQTT_BROKERS[index] || MQTT_BROKERS[0];

    if (client) {
      try {
        client.removeAllListeners();
        client.end(true);
      } catch {
        // Ignore cleanup errors
      }
      client = null;
    }

    const willPayload = JSON.stringify({
      type: 'leave',
      playerId: selfId,
    } satisfies PlayerTopicPayload);

    const clientId = `va_${activeCode}_${selfId}_${Math.random().toString(36).slice(2, 6)}`.slice(
      0,
      64
    );

    const nextClient = mqtt.connect(currentBrokerUrl, {
      clientId,
      clean: true,
      connectTimeout: 6000,
      reconnectPeriod: 2500,
      keepalive: 15,
      will: {
        topic: selfPlayerTopic,
        payload: willPayload,
        qos: 0,
        retain: false,
      },
    });
    client = nextClient;

    let failedOver = false;
    const triggerFallback = () => {
      if (disposed || isConnected || failedOver) return;
      failedOver = true;
      clearWatchdog();
      if (brokerIndex + 1 < MQTT_BROKERS.length) {
        connectToBroker(brokerIndex + 1);
      } else {
        opts.onConnectedChange(false);
        opts.onConnectionError?.(`Не удалось подключиться к комнате ${activeCode}`);
      }
    };

    clearWatchdog();
    connectWatchdogTimer = window.setTimeout(() => {
      if (!disposed && !isConnected) {
        triggerFallback();
      }
    }, 5500);

    nextClient.on('connect', () => {
      if (disposed || client !== nextClient) return;
      clearWatchdog();
      isConnected = true;
      opts.onConnectedChange(true);

      nextClient.subscribe(wildcardTopic, { qos: 0 }, (err) => {
        if (disposed || client !== nextClient) return;
        if (err) {
          opts.onConnectionError?.(`Ошибка подписки комнаты ${activeCode}`);
          return;
        }
        publishSelfState(true);
        emitPlayersSync();
      });
    });

    nextClient.on('message', (topic, messageBuffer) => {
      if (disposed || client !== nextClient) return;
      let parsed: unknown;
      try {
        const text =
          typeof messageBuffer === 'string'
            ? messageBuffer
            : new TextDecoder().decode(messageBuffer);
        parsed = JSON.parse(text);
      } catch {
        return;
      }

      if (topic === eventsTopic) {
        handleEventTopicMessage(parsed);
      } else if (topic.startsWith(playerTopicPrefix)) {
        const topicPlayerId = topic.slice(playerTopicPrefix.length);
        handlePlayerTopicMessage(topicPlayerId, parsed);
      }
    });

    nextClient.on('offline', () => {
      if (disposed || client !== nextClient) return;
      isConnected = false;
      opts.onConnectedChange(false);
    });

    nextClient.on('close', () => {
      if (disposed || client !== nextClient) return;
      const wasConnected = isConnected;
      isConnected = false;
      opts.onConnectedChange(false);
      if (!wasConnected) {
        triggerFallback();
      }
    });

    nextClient.on('error', () => {
      if (disposed || client !== nextClient) return;
      if (!isConnected) {
        triggerFallback();
      }
    });
  };

  connectToBroker(0);
  emitPlayersSync();

  // Publish player state every 500ms and prune inactive players after 3s
  const heartbeatTimer = window.setInterval(() => {
    if (disposed) return;
    const now = Date.now();
    if (client && client.connected && now - lastHeartbeatPublishedAt >= PLAYER_HEARTBEAT_MS - 30) {
      publishSelfState(false);
    }
    if (pruneInactivePlayers(playersMap, selfId, now, PLAYER_INACTIVITY_TIMEOUT_MS)) {
      emitPlayersSync();
    }
  }, PLAYER_HEARTBEAT_MS);

  return {
    roomCode: activeCode,
    get brokerUrl() {
      return currentBrokerUrl;
    },

    sendMove: (pos) => {
      if (disposed) return;
      selfPlayer = {
        ...selfPlayer,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        rotY: pos.rotY,
        hp: Math.max(0, Math.round(pos.hp)),
        maxHp: Math.max(1, Math.round(pos.maxHp)),
        shieldActive: pos.shieldActive,
        name: (pos.name || selfPlayer.name).trim().slice(0, 40) || 'Арканист',
        staffId: (pos.staffId || selfPlayer.staffId).slice(0, 40),
        level: Math.max(1, Math.round(pos.level || selfPlayer.level)),
        lastSeenMs: Date.now(),
      };
      playersMap.set(selfId, selfPlayer);

      const now = performance.now();
      const hasPeers = playersMap.size > 1;
      const minInterval = hasPeers ? 75 : 500;
      const sig = `${pos.x.toFixed(1)}_${pos.z.toFixed(1)}_${pos.rotY.toFixed(1)}_${pos.hp}_${pos.maxHp}_${pos.shieldActive}_${pos.staffId}_${pos.level}_${pos.name}`;
      if (sig === lastMoveSignature && now - lastMovePublishedAt < PLAYER_HEARTBEAT_MS) return;
      if (now - lastMovePublishedAt < minInterval) return;

      lastMovePublishedAt = now;
      lastMoveSignature = sig;
      publishSelfState(false);
    },

    sendSpellCast: (payload) => {
      if (disposed) return;
      const eventId = `sc_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      rememberId(eventId);
      publishJson(eventsTopic, {
        type: 'spell_cast',
        eventId,
        casterId: selfId,
        spellId: String(payload.spellId || 'incendio'),
        power: payload.power,
        accuracy: payload.accuracy,
        origin: payload.origin,
        direction: payload.direction,
        color: payload.color,
      } satisfies RoomEventMessage);
    },

    sendPlayerHit: (targetId, damage, attackerName) => {
      if (disposed || !targetId) return;
      const eventId = `ph_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      rememberId(eventId);
      publishJson(eventsTopic, {
        type: 'player_hit',
        eventId,
        targetId,
        attackerId: selfId,
        attackerName,
        damage,
      } satisfies RoomEventMessage);
    },

    sendEnemyHit: (payload) => {
      if (disposed || currentLabyrinthMode !== 'shared') return;
      const hitId =
        payload.hitId || `hit_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      if (isCoordinator()) {
        if (rememberId(hitId)) return;
        const existing = enemiesMap.get(payload.enemyId);
        if (existing && (existing.killed || existing.hp <= 0)) return;
        const prevHp = existing ? existing.hp : payload.maxHp;
        const nextHp = Math.max(0, prevHp - payload.damage);
        const killed = nextHp <= 0;

        enemiesMap.set(payload.enemyId, {
          id: payload.enemyId,
          stage: payload.stage,
          hp: nextHp,
          maxHp: payload.maxHp,
          x: payload.x,
          y: payload.y,
          z: payload.z,
          state: killed ? 'ko' : 'seek',
          killed,
        });

        publishJson(eventsTopic, {
          type: 'enemy_damaged',
          hitId,
          enemyId: payload.enemyId,
          stage: payload.stage,
          stageEpoch: currentStageEpoch,
          hp: nextHp,
          maxHp: payload.maxHp,
          damage: payload.damage,
          attackerId: selfId,
          spellId: payload.spellId,
          stunSec: payload.stunSec,
          freezeSec: payload.freezeSec,
          killed,
          x: payload.x,
          z: payload.z,
        } satisfies RoomEventMessage);
      } else {
        publishJson(eventsTopic, {
          type: 'enemy_hit',
          hitId,
          enemyId: payload.enemyId,
          stage: payload.stage,
          stageEpoch: currentStageEpoch,
          damage: payload.damage,
          maxHp: payload.maxHp,
          x: payload.x,
          y: payload.y,
          z: payload.z,
          spellId: payload.spellId,
          stunSec: payload.stunSec,
          freezeSec: payload.freezeSec,
          attackerId: selfId,
        } satisfies RoomEventMessage);
      }
    },

    sendEnemySync: (payload) => {
      if (disposed || currentLabyrinthMode !== 'shared') return;
      const now = performance.now();
      if (now - lastEnemySyncAt < 350) return;
      if (!isCoordinator() && playersMap.size > 1) return;

      lastEnemySyncAt = now;
      const normalized: EnemyWireState[] = payload.enemies.slice(0, 14).map((e) => ({
        id: e.id,
        stage: payload.stage,
        hp: Math.max(0, Math.round(e.hp)),
        maxHp: Math.max(1, Math.round(e.maxHp)),
        x: Number(e.x.toFixed(1)),
        y: Number(e.y.toFixed(1)),
        z: Number(e.z.toFixed(1)),
        state: e.state,
        killed: e.hp <= 0,
      }));
      for (const e of normalized) {
        enemiesMap.set(e.id, e);
      }

      publishJson(eventsTopic, {
        type: 'enemy_sync',
        stage: payload.stage,
        stageEpoch: currentStageEpoch,
        senderId: selfId,
        enemies: normalized,
      } satisfies RoomEventMessage);
    },

    sendWorldEvent: (payload) => {
      if (disposed || currentLabyrinthMode !== 'shared') return;
      const now = performance.now();
      if (payload.kind === 'prop_sync') {
        const prevT = lastPropSyncTimes.get(payload.targetId) || 0;
        if (now - prevT < 160) return;
        lastPropSyncTimes.set(payload.targetId, now);
      }
      const eventId = `wev_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      rememberId(eventId);

      if (payload.kind === 'wall_dismantle') {
        worldEventsHistory.delete(`wall_${payload.targetId}`);
      } else if (payload.kind !== 'prop_sync') {
        worldEventsHistory.set(`${payload.kind}_${payload.targetId}`, { eventId, payload });
      }

      publishJson(eventsTopic, {
        type: 'world_event',
        eventId,
        stageEpoch: currentStageEpoch,
        senderId: selfId,
        payload,
      } satisfies RoomEventMessage);
    },

    sendSetMode: (nextMode, stage) => {
      if (disposed) return;
      currentLabyrinthMode = nextMode;
      currentLabyrinthStage = stage;
      const eventId = `mode_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      rememberId(eventId);
      publishJson(eventsTopic, {
        type: 'set_mode',
        eventId,
        senderId: selfId,
        labyrinthMode: nextMode,
        stage,
      } satisfies RoomEventMessage);
    },

    sendStartGame: (stage) => {
      if (disposed) return;
      currentLabyrinthMode = 'shared';
      currentLabyrinthStage = stage;
      resetEpochState(currentStageEpoch + 1);
      const eventId = `start_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      rememberId(eventId);
      publishJson(eventsTopic, {
        type: 'start_game',
        eventId,
        roomCode: activeCode,
        stage,
        hostId: selfId,
        stageEpoch: currentStageEpoch,
      } satisfies RoomEventMessage);
    },

    sendStageAdvance: (payload) => {
      if (disposed || currentLabyrinthMode !== 'shared') return;
      currentLabyrinthStage = payload.stage;
      resetEpochState(currentStageEpoch + 1);
      const eventId = `adv_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      rememberId(eventId);
      publishJson(eventsTopic, {
        type: 'stage_advance',
        eventId,
        stage: payload.stage,
        victory: payload.victory,
        reset: payload.reset,
        senderId: selfId,
        stageEpoch: currentStageEpoch,
      } satisfies RoomEventMessage);
    },

    sendPlayerDied: (stage) => {
      if (disposed || currentLabyrinthMode !== 'shared') return;
      selfPlayer.isDead = true;
      selfPlayer.hp = 0;
      playersMap.set(selfId, selfPlayer);
      publishSelfState(false);

      const eventId = `died_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      rememberId(eventId);
      publishJson(eventsTopic, {
        type: 'player_died',
        eventId,
        playerId: selfId,
        stage,
      } satisfies RoomEventMessage);

      emitPlayersSync();
      if (isCoordinator()) {
        const allDead =
          playersMap.size > 0 && Array.from(playersMap.values()).every((p) => p.isDead);
        if (allDead) {
          const resetStage = toStageNum(stage);
          resetEpochState(currentStageEpoch + 1);
          const resetId = `adr_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          rememberId(resetId);
          opts.onAllDeadReset(resetStage);
          publishJson(eventsTopic, {
            type: 'all_dead_reset',
            eventId: resetId,
            stage: resetStage,
            stageEpoch: currentStageEpoch,
          } satisfies RoomEventMessage);
        }
      }
    },

    sendPlayerRespawn: (maxHp) => {
      if (disposed) return;
      selfPlayer.isDead = false;
      selfPlayer.hp = Math.max(1, Math.round(maxHp || selfPlayer.maxHp));
      playersMap.set(selfId, selfPlayer);
      publishSelfState(false);
      const eventId = `resp_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      rememberId(eventId);
      publishJson(eventsTopic, {
        type: 'player_respawn',
        eventId,
        playerId: selfId,
        maxHp: selfPlayer.hp,
      } satisfies RoomEventMessage);
      emitPlayersSync();
    },

    sendDuelReset: () => {
      if (disposed) return;
      for (const p of playersMap.values()) {
        p.isDead = false;
        p.hp = p.maxHp;
      }
      selfPlayer.isDead = false;
      selfPlayer.hp = selfPlayer.maxHp;
      playersMap.set(selfId, selfPlayer);
      publishSelfState(false);
      const eventId = `duel_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      rememberId(eventId);
      publishJson(eventsTopic, {
        type: 'duel_reset',
        eventId,
        senderId: selfId,
      } satisfies RoomEventMessage);
      emitPlayersSync();
    },

    dispose: () => {
      if (disposed) return;
      clearWatchdog();
      window.clearInterval(heartbeatTimer);

      if (client && client.connected) {
        try {
          client.publish(
            selfPlayerTopic,
            JSON.stringify({
              type: 'leave',
              playerId: selfId,
            } satisfies PlayerTopicPayload),
            { qos: 0, retain: false }
          );
        } catch {
          // Ignore
        }
      }

      disposed = true;
      isConnected = false;

      if (client) {
        try {
          client.removeAllListeners();
          client.end(true);
        } catch {
          // Ignore
        }
        client = null;
      }

      playersMap.clear();
      enemiesMap.clear();
      worldEventsHistory.clear();
    },
  };
}
