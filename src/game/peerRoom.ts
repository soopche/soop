import Peer, { type DataConnection } from 'peerjs';
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

export const PEER_ROOM_PREFIX = 'vox-arcanum-net-';

// ============================================================================
// TWO-DIGIT ROOM CODE & SESSION PLAYER ID HELPERS
// ============================================================================
export function generateTwoDigitRoomCode(): string {
  return String(Math.floor(10 + Math.random() * 90));
}

export function parseTwoDigitRoomCode(raw: string): string | null {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 2);
  if (!/^\d{2}$/.test(digits)) return null;
  return digits;
}

export function toPeerRoomId(twoDigitCode: string): string {
  const parsed = parseTwoDigitRoomCode(twoDigitCode);
  if (!parsed) {
    throw new Error(`Invalid two-digit room code: "${twoDigitCode}"`);
  }
  return `${PEER_ROOM_PREFIX}${parsed}`;
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

// ============================================================================
// LOCAL CHARACTER PROFILE STORAGE & SANITIZATION (NO FIREBASE)
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
// REAL-TIME PEERJS (WEBRTC) MULTIPLAYER CONTROLLER
// ============================================================================
export type PeerRoomRole = 'host' | 'guest';

export interface PeerRoomConnectionOptions {
  role: PeerRoomRole;
  roomCode: string; // Strictly 2 digits ('10'..'99')
  playerId: string;
  playerName: string;
  maxHp: number;
  level: number;
  staffId: string;
  labyrinthMode: LabyrinthMultiplayerMode;
  stage: LabyrinthStageId;
  onRoomCodeResolved?: (resolvedTwoDigitCode: string) => void;
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

export interface PeerRoomController {
  roomCode: string;
  role: PeerRoomRole;
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

interface PlayerWireState extends RemotePlayerState {
  isDead: boolean;
  lastSeenMs: number;
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

type PeerMessage =
  | { type: 'hello'; player: PlayerWireState }
  | {
      type: 'init_state';
      roomCode: string;
      labyrinthMode: LabyrinthMultiplayerMode;
      labyrinthStage: number;
      stageEpoch: number;
      players: PlayerWireState[];
      enemies: EnemyWireState[];
      worldEvents: Array<{ eventId: string; payload: SharedWorldEventPayload }>;
    }
  | { type: 'players_sync'; players: PlayerWireState[] }
  | { type: 'move'; player: PlayerWireState }
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
  | { type: 'set_mode'; labyrinthMode: LabyrinthMultiplayerMode; stage: number }
  | {
      type: 'start_game';
      roomCode: string;
      stage: 1 | 2 | 3 | 4 | 5;
      hostId: string;
      stageEpoch: number;
    }
  | {
      type: 'stage_advance';
      stage: number;
      victory: boolean;
      reset: boolean;
      senderId: string;
      stageEpoch: number;
    }
  | { type: 'player_died'; playerId: string; stage: number }
  | { type: 'player_respawn'; playerId: string; maxHp: number }
  | { type: 'all_dead_reset'; stage: 1 | 2 | 3 | 4 | 5; stageEpoch: number }
  | { type: 'duel_reset' };

function toStageNum(n: unknown): 1 | 2 | 3 | 4 | 5 {
  return n === 2 ? 2 : n === 3 ? 3 : n === 4 ? 4 : n === 5 ? 5 : 1;
}

const PEER_ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function connectPeerRoom(opts: PeerRoomConnectionOptions): PeerRoomController {
  let activeCode = parseTwoDigitRoomCode(opts.roomCode) || generateTwoDigitRoomCode();
  const selfId = opts.playerId;

  let disposed = false;
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

  // Authoritative host state (also mirrors synced state on guest)
  const playersMap = new Map<string, PlayerWireState>();
  playersMap.set(selfId, selfPlayer);
  const enemiesMap = new Map<string, EnemyWireState>();
  const worldEventsHistory = new Map<string, { eventId: string; payload: SharedWorldEventPayload }>();
  const guestConnections = new Map<DataConnection, string | null>();
  let hostConnection: DataConnection | null = null;
  let peerInstance: Peer | null = null;
  let hostRetryCount = 0;
  const triedCodes = new Set<string>([activeCode]);

  const seenEventIds = new Set<string>();
  const seenDeadIds = new Set<string>();
  const lastPropSyncTimes = new Map<string, number>();
  let lastMoveSentAt = 0;
  let lastMoveSignature = '';
  let lastEnemySyncAt = 0;

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

  const emitPlayersSyncLocally = () => {
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

  const broadcastFromHost = (msg: PeerMessage, excludeConn?: DataConnection) => {
    for (const [conn] of guestConnections.entries()) {
      if (conn !== excludeConn && conn.open) {
        try {
          conn.send(msg);
        } catch {
          // Ignore broken pipe; close event cleans it up
        }
      }
    }
  };

  const sendToHostOrBroadcast = (msg: PeerMessage) => {
    if (disposed) return;
    if (opts.role === 'host') {
      broadcastFromHost(msg);
    } else if (hostConnection && hostConnection.open) {
      try {
        hostConnection.send(msg);
      } catch {
        // Ignore transient write errors
      }
    }
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

  const handleHostIncomingMessage = (msg: PeerMessage, fromConn: DataConnection) => {
    if (disposed) return;

    switch (msg.type) {
      case 'hello':
      case 'move': {
        const incoming = { ...msg.player, lastSeenMs: Date.now() };
        guestConnections.set(fromConn, incoming.id);
        playersMap.set(incoming.id, incoming);
        if (msg.type === 'hello') {
          if (fromConn.open) {
            fromConn.send({
              type: 'init_state',
              roomCode: activeCode,
              labyrinthMode: currentLabyrinthMode,
              labyrinthStage: currentLabyrinthStage,
              stageEpoch: currentStageEpoch,
              players: Array.from(playersMap.values()),
              enemies: Array.from(enemiesMap.values()),
              worldEvents: Array.from(worldEventsHistory.values()),
            } satisfies PeerMessage);
          }
        }
        emitPlayersSyncLocally();
        broadcastFromHost({
          type: 'players_sync',
          players: Array.from(playersMap.values()),
        });
        break;
      }

      case 'spell_cast': {
        if (rememberId(msg.eventId)) return;
        opts.onSpellSpawned({
          casterId: msg.casterId,
          spellId: msg.spellId,
          power: msg.power,
          accuracy: msg.accuracy,
          origin: msg.origin,
          direction: msg.direction,
          color: msg.color,
        });
        broadcastFromHost(msg, fromConn);
        break;
      }

      case 'player_hit': {
        if (rememberId(msg.eventId)) return;
        if (msg.targetId === selfId) {
          opts.onPlayerDamaged({
            targetId: msg.targetId,
            attackerId: msg.attackerId,
            attackerName: msg.attackerName,
            damage: msg.damage,
          });
        }
        broadcastFromHost(msg, fromConn);
        break;
      }

      case 'enemy_hit': {
        if (currentLabyrinthMode !== 'shared') return;
        if (msg.stageEpoch !== currentStageEpoch) return;
        if (rememberId(msg.hitId)) return;

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

        const damagedMsg: PeerMessage = {
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
        broadcastFromHost(damagedMsg);
        break;
      }

      case 'enemy_sync': {
        if (currentLabyrinthMode !== 'shared') return;
        if (msg.stageEpoch !== currentStageEpoch) return;
        for (const e of msg.enemies) {
          enemiesMap.set(e.id, e);
        }
        opts.onEnemySynced({
          stage: msg.stage,
          senderId: msg.senderId,
          enemies: msg.enemies,
        });
        broadcastFromHost(msg, fromConn);
        break;
      }

      case 'world_event': {
        if (currentLabyrinthMode !== 'shared') return;
        if (msg.stageEpoch !== currentStageEpoch) return;
        if (msg.payload.kind !== 'prop_sync' && rememberId(msg.eventId)) return;

        if (msg.payload.kind === 'wall_dismantle') {
          worldEventsHistory.delete(`wall_${msg.payload.targetId}`);
        } else if (msg.payload.kind !== 'prop_sync') {
          const key = `${msg.payload.kind}_${msg.payload.targetId}`;
          worldEventsHistory.set(key, { eventId: msg.eventId, payload: msg.payload });
        }
        opts.onWorldEvent(msg.payload);
        broadcastFromHost(msg, fromConn);
        break;
      }

      case 'set_mode': {
        currentLabyrinthMode = msg.labyrinthMode;
        currentLabyrinthStage = msg.stage;
        opts.onModeChanged(msg.labyrinthMode);
        broadcastFromHost(msg, fromConn);
        break;
      }

      case 'start_game': {
        currentLabyrinthMode = 'shared';
        currentLabyrinthStage = msg.stage;
        resetEpochState(currentStageEpoch + 1);
        const startMsg: PeerMessage = {
          type: 'start_game',
          roomCode: activeCode,
          stage: msg.stage,
          hostId: msg.hostId,
          stageEpoch: currentStageEpoch,
        };
        opts.onGameStarted({
          room: activeCode,
          labyrinthStage: msg.stage,
          hostId: msg.hostId,
        });
        broadcastFromHost(startMsg);
        break;
      }

      case 'stage_advance': {
        if (currentLabyrinthMode !== 'shared') return;
        currentLabyrinthStage = msg.stage;
        resetEpochState(currentStageEpoch + 1);
        const advMsg: PeerMessage = { ...msg, stageEpoch: currentStageEpoch };
        opts.onStageAdvanced({
          stage: msg.stage,
          victory: msg.victory,
          reset: msg.reset,
          senderId: msg.senderId,
        });
        broadcastFromHost(advMsg, fromConn);
        break;
      }

      case 'player_died': {
        const p = playersMap.get(msg.playerId);
        if (p) {
          p.isDead = true;
          p.hp = 0;
        }
        emitPlayersSyncLocally();
        broadcastFromHost({
          type: 'players_sync',
          players: Array.from(playersMap.values()),
        });

        const allDead =
          playersMap.size > 0 && Array.from(playersMap.values()).every((pl) => pl.isDead);
        if (allDead) {
          const resetStage = toStageNum(msg.stage);
          resetEpochState(currentStageEpoch + 1);
          const resetMsg: PeerMessage = {
            type: 'all_dead_reset',
            stage: resetStage,
            stageEpoch: currentStageEpoch,
          };
          opts.onAllDeadReset(resetStage);
          broadcastFromHost(resetMsg);
        }
        break;
      }

      case 'player_respawn': {
        const p = playersMap.get(msg.playerId);
        if (p) {
          p.isDead = false;
          p.hp = msg.maxHp;
        }
        emitPlayersSyncLocally();
        broadcastFromHost({
          type: 'players_sync',
          players: Array.from(playersMap.values()),
        });
        break;
      }

      case 'duel_reset': {
        for (const p of playersMap.values()) {
          p.isDead = false;
          p.hp = p.maxHp;
        }
        emitPlayersSyncLocally();
        opts.onDuelReset();
        broadcastFromHost({ type: 'duel_reset' });
        broadcastFromHost({
          type: 'players_sync',
          players: Array.from(playersMap.values()),
        });
        break;
      }

      default:
        break;
    }
  };

  const handleGuestIncomingMessage = (msg: PeerMessage) => {
    if (disposed) return;

    switch (msg.type) {
      case 'init_state': {
        currentLabyrinthMode = msg.labyrinthMode;
        currentLabyrinthStage = msg.labyrinthStage;
        currentStageEpoch = msg.stageEpoch;
        playersMap.clear();
        for (const p of msg.players) {
          playersMap.set(p.id, p);
        }
        playersMap.set(selfId, selfPlayer);
        emitPlayersSyncLocally();
        opts.onModeChanged(msg.labyrinthMode);
        if (msg.enemies.length > 0 && msg.labyrinthMode === 'shared') {
          opts.onEnemySynced({
            stage: msg.labyrinthStage,
            senderId: 'host',
            enemies: msg.enemies,
          });
        }
        for (const item of msg.worldEvents) {
          if (!rememberId(item.eventId)) {
            opts.onWorldEvent(item.payload);
          }
        }
        break;
      }

      case 'players_sync': {
        playersMap.clear();
        for (const p of msg.players) {
          playersMap.set(p.id, p);
        }
        if (!playersMap.has(selfId)) {
          playersMap.set(selfId, selfPlayer);
        }
        emitPlayersSyncLocally();
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

      case 'enemy_damaged': {
        if (currentLabyrinthMode !== 'shared') return;
        if (msg.stageEpoch !== currentStageEpoch) return;
        if (msg.attackerId === selfId || rememberId(msg.hitId)) return;
        opts.onEnemyDamaged(msg);
        break;
      }

      case 'enemy_sync': {
        if (currentLabyrinthMode !== 'shared') return;
        if (msg.stageEpoch !== currentStageEpoch) return;
        if (msg.senderId === selfId) return;
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
        opts.onWorldEvent(msg.payload);
        break;
      }

      case 'set_mode': {
        currentLabyrinthMode = msg.labyrinthMode;
        currentLabyrinthStage = msg.stage;
        opts.onModeChanged(msg.labyrinthMode);
        break;
      }

      case 'start_game': {
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
        currentLabyrinthStage = msg.stage;
        resetEpochState(msg.stageEpoch);
        if (msg.senderId !== selfId) {
          opts.onStageAdvanced({
            stage: msg.stage,
            victory: msg.victory,
            reset: msg.reset,
            senderId: msg.senderId,
          });
        }
        break;
      }

      case 'all_dead_reset': {
        resetEpochState(msg.stageEpoch);
        opts.onAllDeadReset(msg.stage);
        break;
      }

      case 'duel_reset': {
        selfPlayer.isDead = false;
        selfPlayer.hp = selfPlayer.maxHp;
        opts.onDuelReset();
        break;
      }

      default:
        break;
    }
  };

  const startHostPeer = (codeToClaim: string) => {
    if (disposed) return;
    activeCode = codeToClaim;
    const peer = new Peer(toPeerRoomId(codeToClaim), { config: PEER_ICE_CONFIG });
    peerInstance = peer;

    peer.on('open', () => {
      if (disposed) {
        peer.destroy();
        return;
      }
      opts.onRoomCodeResolved?.(activeCode);
      opts.onConnectedChange(true);
      emitPlayersSyncLocally();
    });

    peer.on('connection', (conn) => {
      if (disposed) {
        conn.close();
        return;
      }
      guestConnections.set(conn, null);

      conn.on('data', (raw) => {
        if (raw && typeof raw === 'object' && 'type' in raw) {
          handleHostIncomingMessage(raw as PeerMessage, conn);
        }
      });

      const handleDisconnect = () => {
        const mappedPlayerId = guestConnections.get(conn);
        guestConnections.delete(conn);
        if (mappedPlayerId && mappedPlayerId !== selfId) {
          playersMap.delete(mappedPlayerId);
          emitPlayersSyncLocally();
          broadcastFromHost({
            type: 'players_sync',
            players: Array.from(playersMap.values()),
          });
        }
      };

      conn.on('close', handleDisconnect);
      conn.on('error', handleDisconnect);
    });

    peer.on('error', (err) => {
      if (disposed) return;
      if (err.type === 'unavailable-id' && hostRetryCount < 6) {
        hostRetryCount++;
        try {
          peer.destroy();
        } catch {
          // Ignore
        }
        let nextCode = generateTwoDigitRoomCode();
        while (triedCodes.has(nextCode) && triedCodes.size < 80) {
          nextCode = generateTwoDigitRoomCode();
        }
        triedCodes.add(nextCode);
        startHostPeer(nextCode);
        return;
      }
      opts.onConnectedChange(false);
      opts.onConnectionError?.(`Ошибка комнаты ${activeCode}`);
    });
  };

  const startGuestPeer = (targetCode: string) => {
    if (disposed) return;
    activeCode = targetCode;
    const peer = new Peer({ config: PEER_ICE_CONFIG });
    peerInstance = peer;

    peer.on('open', () => {
      if (disposed) {
        peer.destroy();
        return;
      }
      const conn = peer.connect(toPeerRoomId(targetCode), { reliable: true });
      hostConnection = conn;

      conn.on('open', () => {
        if (disposed) {
          conn.close();
          return;
        }
        opts.onConnectedChange(true);
        conn.send({
          type: 'hello',
          player: { ...selfPlayer, lastSeenMs: Date.now() },
        } satisfies PeerMessage);
      });

      conn.on('data', (raw) => {
        if (raw && typeof raw === 'object' && 'type' in raw) {
          handleGuestIncomingMessage(raw as PeerMessage);
        }
      });

      conn.on('close', () => {
        if (!disposed) {
          opts.onConnectedChange(false);
        }
      });

      conn.on('error', () => {
        if (!disposed) {
          opts.onConnectedChange(false);
          opts.onConnectionError?.(`Не удалось подключиться к комнате ${targetCode}`);
        }
      });
    });

    peer.on('error', (err) => {
      if (disposed) return;
      opts.onConnectedChange(false);
      if (err.type === 'peer-unavailable') {
        opts.onConnectionError?.(`Комната ${targetCode} не найдена`);
      } else {
        opts.onConnectionError?.(`Ошибка подключения к комнате ${targetCode}`);
      }
    });
  };

  if (opts.role === 'host') {
    startHostPeer(activeCode);
  } else {
    startGuestPeer(activeCode);
  }

  // Heartbeat keep-alive every 4s & stale peer cleanup on Host
  const heartbeatTimer = window.setInterval(() => {
    if (disposed) return;
    const now = Date.now();
    selfPlayer.lastSeenMs = now;
    playersMap.set(selfId, selfPlayer);

    if (opts.role === 'host') {
      let pruned = false;
      for (const [pid, p] of playersMap.entries()) {
        if (pid !== selfId && now - p.lastSeenMs > 18000) {
          playersMap.delete(pid);
          pruned = true;
        }
      }
      if (pruned) {
        emitPlayersSyncLocally();
        broadcastFromHost({
          type: 'players_sync',
          players: Array.from(playersMap.values()),
        });
      }
    } else if (hostConnection && hostConnection.open) {
      hostConnection.send({
        type: 'move',
        player: { ...selfPlayer },
      } satisfies PeerMessage);
    }
  }, 4000);

  return {
    get roomCode() {
      return activeCode;
    },
    role: opts.role,

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
      const minInterval = hasPeers ? 65 : 1500;
      const sig = `${pos.x.toFixed(1)}_${pos.z.toFixed(1)}_${pos.rotY.toFixed(1)}_${pos.hp}_${pos.maxHp}_${pos.shieldActive}_${pos.staffId}_${pos.level}_${pos.name}`;
      if (sig === lastMoveSignature && now - lastMoveSentAt < 3000) return;
      if (now - lastMoveSentAt < minInterval) return;

      lastMoveSentAt = now;
      lastMoveSignature = sig;

      if (opts.role === 'host') {
        broadcastFromHost({
          type: 'players_sync',
          players: Array.from(playersMap.values()),
        });
      } else {
        sendToHostOrBroadcast({
          type: 'move',
          player: { ...selfPlayer },
        });
      }
    },

    sendSpellCast: (payload) => {
      if (disposed) return;
      const eventId = `sc_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      rememberId(eventId);
      sendToHostOrBroadcast({
        type: 'spell_cast',
        eventId,
        casterId: selfId,
        spellId: String(payload.spellId || 'incendio'),
        power: payload.power,
        accuracy: payload.accuracy,
        origin: payload.origin,
        direction: payload.direction,
        color: payload.color,
      });
    },

    sendPlayerHit: (targetId, damage, attackerName) => {
      if (disposed || !targetId) return;
      const eventId = `ph_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      rememberId(eventId);
      sendToHostOrBroadcast({
        type: 'player_hit',
        eventId,
        targetId,
        attackerId: selfId,
        attackerName,
        damage,
      });
    },

    sendEnemyHit: (payload) => {
      if (disposed || currentLabyrinthMode !== 'shared') return;
      const hitId =
        payload.hitId || `hit_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      if (opts.role === 'host') {
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

        broadcastFromHost({
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
        });
      } else {
        sendToHostOrBroadcast({
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
        });
      }
    },

    sendEnemySync: (payload) => {
      if (disposed || currentLabyrinthMode !== 'shared') return;
      const now = performance.now();
      if (now - lastEnemySyncAt < 350) return;

      // Only the host broadcasts periodic authoritative enemy snapshots
      if (opts.role !== 'host' && playersMap.size > 1) return;

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

      broadcastFromHost({
        type: 'enemy_sync',
        stage: payload.stage,
        stageEpoch: currentStageEpoch,
        senderId: selfId,
        enemies: normalized,
      });
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

      if (opts.role === 'host') {
        if (payload.kind === 'wall_dismantle') {
          worldEventsHistory.delete(`wall_${payload.targetId}`);
        } else if (payload.kind !== 'prop_sync') {
          worldEventsHistory.set(`${payload.kind}_${payload.targetId}`, { eventId, payload });
        }
      }

      sendToHostOrBroadcast({
        type: 'world_event',
        eventId,
        stageEpoch: currentStageEpoch,
        senderId: selfId,
        payload,
      });
    },

    sendSetMode: (nextMode, stage) => {
      if (disposed) return;
      currentLabyrinthMode = nextMode;
      currentLabyrinthStage = stage;
      sendToHostOrBroadcast({
        type: 'set_mode',
        labyrinthMode: nextMode,
        stage,
      });
    },

    sendStartGame: (stage) => {
      if (disposed) return;
      currentLabyrinthMode = 'shared';
      currentLabyrinthStage = stage;
      if (opts.role === 'host') {
        resetEpochState(currentStageEpoch + 1);
        broadcastFromHost({
          type: 'start_game',
          roomCode: activeCode,
          stage,
          hostId: selfId,
          stageEpoch: currentStageEpoch,
        });
      } else {
        sendToHostOrBroadcast({
          type: 'start_game',
          roomCode: activeCode,
          stage,
          hostId: selfId,
          stageEpoch: currentStageEpoch,
        });
      }
    },

    sendStageAdvance: (payload) => {
      if (disposed || currentLabyrinthMode !== 'shared') return;
      currentLabyrinthStage = payload.stage;
      if (opts.role === 'host') {
        resetEpochState(currentStageEpoch + 1);
      }
      sendToHostOrBroadcast({
        type: 'stage_advance',
        stage: payload.stage,
        victory: payload.victory,
        reset: payload.reset,
        senderId: selfId,
        stageEpoch: currentStageEpoch,
      });
    },

    sendPlayerDied: (stage) => {
      if (disposed || currentLabyrinthMode !== 'shared') return;
      selfPlayer.isDead = true;
      selfPlayer.hp = 0;
      playersMap.set(selfId, selfPlayer);

      if (opts.role === 'host') {
        emitPlayersSyncLocally();
        broadcastFromHost({
          type: 'players_sync',
          players: Array.from(playersMap.values()),
        });
        const allDead =
          playersMap.size > 0 && Array.from(playersMap.values()).every((p) => p.isDead);
        if (allDead) {
          const resetStage = toStageNum(stage);
          resetEpochState(currentStageEpoch + 1);
          opts.onAllDeadReset(resetStage);
          broadcastFromHost({
            type: 'all_dead_reset',
            stage: resetStage,
            stageEpoch: currentStageEpoch,
          });
        }
      } else {
        sendToHostOrBroadcast({
          type: 'player_died',
          playerId: selfId,
          stage,
        });
      }
    },

    sendPlayerRespawn: (maxHp) => {
      if (disposed) return;
      selfPlayer.isDead = false;
      selfPlayer.hp = Math.max(1, Math.round(maxHp || selfPlayer.maxHp));
      playersMap.set(selfId, selfPlayer);
      if (opts.role === 'host') {
        emitPlayersSyncLocally();
        broadcastFromHost({
          type: 'players_sync',
          players: Array.from(playersMap.values()),
        });
      } else {
        sendToHostOrBroadcast({
          type: 'player_respawn',
          playerId: selfId,
          maxHp: selfPlayer.hp,
        });
      }
    },

    sendDuelReset: () => {
      if (disposed) return;
      selfPlayer.isDead = false;
      selfPlayer.hp = selfPlayer.maxHp;
      playersMap.set(selfId, selfPlayer);
      if (opts.role === 'host') {
        for (const p of playersMap.values()) {
          p.isDead = false;
          p.hp = p.maxHp;
        }
        emitPlayersSyncLocally();
        broadcastFromHost({ type: 'duel_reset' });
        broadcastFromHost({
          type: 'players_sync',
          players: Array.from(playersMap.values()),
        });
      } else {
        sendToHostOrBroadcast({ type: 'duel_reset' });
      }
    },

    dispose: () => {
      disposed = true;
      window.clearInterval(heartbeatTimer);
      for (const conn of guestConnections.keys()) {
        try {
          conn.close();
        } catch {
          // Ignore
        }
      }
      guestConnections.clear();
      if (hostConnection) {
        try {
          hostConnection.close();
        } catch {
          // Ignore
        }
        hostConnection = null;
      }
      if (peerInstance) {
        try {
          peerInstance.destroy();
        } catch {
          // Ignore
        }
        peerInstance = null;
      }
      playersMap.clear();
      enemiesMap.clear();
      worldEventsHistory.clear();
    },
  };
}
