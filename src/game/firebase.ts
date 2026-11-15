import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  type CharacterProfileData,
  type DifficultyTier,
  type EquipmentId,
  type ArtifactId,
  type ArtifactSlot,
  type SpellId,
  type ReagentId,
  type TameableSpeciesId,
  type LabyrinthMultiplayerMode,
  type LabyrinthStageId,
  CHARACTER_ID_MAX_LENGTH,
  CHARACTER_NAME_MAX_LENGTH,
  createDefaultCharacterProfile,
} from './spells';
import type { RemotePlayerState, SharedWorldEventPayload } from './world3d';

// Initialize Firebase SDK from firebase-applet-config.json
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

// ============================================================================
// SAFE IDENTIFIER HELPERS (Matches firestore.rules ^[a-zA-Z0-9_\-]+$)
// ============================================================================
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

/**
 * Produces a deterministic, Firestore-safe profile key from any player name or code.
 */
export function normalizePlayerProfileKey(nameOrCode: string): string {
  const trimmed = (nameOrCode || '').trim();
  if (!trimmed) return 'prof_default';
  const normalized = trimmed.toLowerCase();
  const hash = fnv1aHex(normalized);
  const slug = toAsciiSlug(normalized).slice(0, 32);
  const combined = slug ? `prof_${hash}_${slug}` : `prof_${hash}`;
  return combined.slice(0, CHARACTER_ID_MAX_LENGTH);
}

/**
 * Normalizes a room code into a valid Firestore document ID (1..64, ^[a-zA-Z0-9_\-]+$).
 */
export function normalizeRoomId(rawRoom: string): string {
  const trimmed = (rawRoom || '').trim();
  if (!trimmed) return 'arcanum-1';
  if (/^[a-zA-Z0-9_\-]+$/.test(trimmed) && trimmed.length <= 64) {
    return trimmed;
  }
  const slug = toAsciiSlug(trimmed).slice(0, 32);
  const hash = fnv1aHex(trimmed.toLowerCase());
  return (slug ? `room_${hash}_${slug}` : `room_${hash}`).slice(0, 64);
}

export function sanitizeDocId(raw: string, fallback = 'item'): string {
  const cleaned = (raw || '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 64);
  return cleaned || fallback;
}

// ============================================================================
// LOCAL STORAGE FALLBACK & INSTANT CACHE
// ============================================================================
const LOCAL_CHARS_KEY_PREFIX = 'vox_arcanum_characters_v1_';
const LOCAL_ACTIVE_CHAR_KEY_PREFIX = 'vox_arcanum_active_char_v1_';
const LOCAL_GUEST_SEED_KEY = 'vox_arcanum_guest_device_id_v1';

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
// VOLUMETRIC & SCHEMA SANITIZATION (Matches firestore.rules 100%)
// ============================================================================
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

function buildCharacterMutableFields(sanitized: CharacterProfileData) {
  return {
    name: sanitized.name,
    playerLevel: sanitized.playerLevel,
    playerXp: sanitized.playerXp,
    gestureMasteryLevel: sanitized.gestureMasteryLevel,
    highestUnlockedStage: sanitized.highestUnlockedStage,
    highestUnlockedDifficulty: sanitized.highestUnlockedDifficulty,
    selectedDifficulty: sanitized.selectedDifficulty,
    unlockedStageD1: sanitized.unlockedStageD1,
    unlockedStageD2: sanitized.unlockedStageD2,
    equippedStaffId: sanitized.equippedStaffId,
    ownedEquipment: sanitized.ownedEquipment,
    ownedArtifacts: sanitized.ownedArtifacts,
    equippedArtifacts: sanitized.equippedArtifacts,
    spellLevels: sanitized.spellLevels,
    reagentInventory: sanitized.reagentInventory,
    tamedPetSpecies: sanitized.tamedPetSpecies,
    tamedPetLevel: sanitized.tamedPetLevel,
    tamedPetTrainingStep: sanitized.tamedPetTrainingStep,
    tamedPetXp: sanitized.tamedPetXp,
    claimedQuestIds: sanitized.claimedQuestIds,
  };
}

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================
export async function signInWithGooglePopup(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

// ============================================================================
// FIRESTORE CHARACTER PERSISTENCE (Google Auth Users)
// ============================================================================
export async function saveCharacterToFirestore(
  userId: string,
  profile: CharacterProfileData
): Promise<void> {
  const sanitized = sanitizeCharacterProfile({ ...profile, ownerId: userId }, userId);
  const path = `users/${userId}/characters/${sanitized.id}`;
  const charRef = doc(db, 'users', userId, 'characters', sanitized.id);
  const mutableFields = buildCharacterMutableFields(sanitized);

  try {
    const existingSnap = await getDoc(charRef);
    if (existingSnap.exists() && existingSnap.data()?.createdAt) {
      await updateDoc(charRef, {
        ...mutableFields,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(charRef, {
        id: sanitized.id,
        ownerId: userId,
        ...mutableFields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCharacterFromFirestore(
  userId: string,
  characterId: string
): Promise<void> {
  const path = `users/${userId}/characters/${characterId}`;
  const charRef = doc(db, 'users', userId, 'characters', characterId);
  try {
    await deleteDoc(charRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserCharacters(
  userId: string,
  onCharacters: (characters: CharacterProfileData[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/characters`;
  const colRef = collection(db, 'users', userId, 'characters');
  const charsQuery = query(colRef, where('ownerId', '==', userId));
  return onSnapshot(
    charsQuery,
    (snapshot) => {
      const list: CharacterProfileData[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const updatedAtMs =
          data.updatedAt && typeof data.updatedAt.toMillis === 'function'
            ? data.updatedAt.toMillis()
            : Date.now();
        list.push(
          sanitizeCharacterProfile(
            {
              ...data,
              id: docSnap.id,
              ownerId: userId,
              updatedAtMs,
            },
            userId
          )
        );
      });
      list.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onCharacters(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (handledErr) {
        if (onError && handledErr instanceof Error) {
          onError(handledErr);
        }
      }
    }
  );
}

// ============================================================================
// FIRESTORE PLAYER_PROFILES PERSISTENCE (By Player Name / Code, Reload-Safe)
// ============================================================================
export async function savePlayerProfileToFirestore(
  profile: CharacterProfileData
): Promise<void> {
  const sanitized = sanitizeCharacterProfile(profile, profile.ownerId || 'local_guest');
  const profileId = sanitizeDocId(sanitized.id, 'prof_default');
  const path = `player_profiles/${profileId}`;
  const profRef = doc(db, 'player_profiles', profileId);
  const mutableFields = buildCharacterMutableFields(sanitized);

  try {
    const existingSnap = await getDoc(profRef);
    if (existingSnap.exists() && existingSnap.data()?.createdAt) {
      await updateDoc(profRef, {
        ownerId: sanitized.ownerId,
        ...mutableFields,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(profRef, {
        id: profileId,
        profileKey: profileId,
        ownerId: sanitized.ownerId,
        ...mutableFields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadPlayerProfileFromFirestore(
  nameOrCode: string
): Promise<CharacterProfileData | null> {
  const trimmed = (nameOrCode || '').trim();
  if (!trimmed) return null;

  const candidateIds: string[] = [];
  if (/^[a-zA-Z0-9_\-]+$/.test(trimmed) && trimmed.length <= CHARACTER_ID_MAX_LENGTH) {
    candidateIds.push(trimmed);
  }
  const normalizedKey = normalizePlayerProfileKey(trimmed);
  if (!candidateIds.includes(normalizedKey)) {
    candidateIds.push(normalizedKey);
  }

  for (const id of candidateIds) {
    const path = `player_profiles/${id}`;
    try {
      const snap = await getDoc(doc(db, 'player_profiles', id));
      if (snap.exists()) {
        const data = snap.data();
        const updatedAtMs =
          data.updatedAt && typeof data.updatedAt.toMillis === 'function'
            ? data.updatedAt.toMillis()
            : Date.now();
        return sanitizeCharacterProfile(
          {
            ...data,
            id: snap.id,
            updatedAtMs,
          },
          typeof data.ownerId === 'string' ? data.ownerId : 'local_guest'
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }
  return null;
}

export async function deletePlayerProfileFromFirestore(profileId: string): Promise<void> {
  const safeId = sanitizeDocId(profileId, '');
  if (!safeId) return;
  const path = `player_profiles/${safeId}`;
  try {
    await deleteDoc(doc(db, 'player_profiles', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToPlayerProfile(
  profileId: string,
  onProfile: (profile: CharacterProfileData) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const safeId = sanitizeDocId(profileId, 'prof_default');
  const path = `player_profiles/${safeId}`;
  return onSnapshot(
    doc(db, 'player_profiles', safeId),
    (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      const updatedAtMs =
        data.updatedAt && typeof data.updatedAt.toMillis === 'function'
          ? data.updatedAt.toMillis()
          : Date.now();
      onProfile(
        sanitizeCharacterProfile(
          {
            ...data,
            id: docSnap.id,
            updatedAtMs,
          },
          typeof data.ownerId === 'string' ? data.ownerId : 'local_guest'
        )
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (handledErr) {
        if (onError && handledErr instanceof Error) {
          onError(handledErr);
        }
      }
    }
  );
}

// ============================================================================
// REAL-TIME CLOUD FIRESTORE MULTIPLAYER ROOM CONTROLLER
// ============================================================================
export interface FirestoreRoomConnectionOptions {
  roomName: string;
  playerId: string;
  playerName: string;
  maxHp: number;
  level: number;
  staffId: string;
  labyrinthMode: LabyrinthMultiplayerMode;
  stage: LabyrinthStageId;
  onConnectedChange: (connected: boolean) => void;
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

export interface FirestoreRoomController {
  roomId: string;
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

function clampNum(n: unknown, min: number, max: number, def = 0): number {
  const num = typeof n === 'number' && Number.isFinite(n) ? n : def;
  return Math.max(min, Math.min(max, num));
}

function toStageNum(n: unknown): 1 | 2 | 3 | 4 | 5 {
  return n === 2 ? 2 : n === 3 ? 3 : n === 4 ? 4 : n === 5 ? 5 : 1;
}

export function connectFirestoreRoom(
  opts: FirestoreRoomConnectionOptions
): FirestoreRoomController {
  const roomId = normalizeRoomId(opts.roomName);
  const selfId = sanitizeDocId(opts.playerId, 'wiz_player');
  const roomRef = doc(db, 'rooms', roomId);
  const selfPlayerRef = doc(db, 'rooms', roomId, 'players', selfId);

  let disposed = false;
  const joinedAtMs = Date.now();
  let currentStageEpoch = 1;
  let currentLabyrinthMode: LabyrinthMultiplayerMode = opts.labyrinthMode;
  let currentLabyrinthStage: number = opts.stage;
  let activePlayersCache: RemotePlayerState[] = [];
  let activeDeadIds = new Set<string>();
  let isSelfDead = false;

  let seenGameStartNonce = 0;
  let seenAllDeadNonce = 0;
  let seenStageAdvanceNonce = 0;
  let seenDuelResetNonce = 0;
  let initialRoomLoaded = false;

  const processedEventIds = new Set<string>();
  const processedHitIds = new Set<string>();
  const processedWorldEventIds = new Set<string>();
  const lastEnemySnapshotMap = new Map<string, string>();
  const lastPropSyncTimes = new Map<string, number>();

  let lastMoveSentAt = 0;
  let lastMoveSignature = '';
  let lastEnemySyncAt = 0;

  let selfStateCache = {
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
  };

  const rememberId = (set: Set<string>, id: string): boolean => {
    if (!id) return false;
    if (set.has(id)) return true;
    set.add(id);
    if (set.size > 1500) {
      const first = set.values().next().value;
      if (first) set.delete(first);
    }
    return false;
  };

  const writeSelfPlayerDoc = async () => {
    if (disposed) return;
    try {
      await setDoc(selfPlayerRef, {
        id: selfId,
        roomId,
        name: (selfStateCache.name || 'Арканист').trim().slice(0, 40) || 'Арканист',
        x: clampNum(selfStateCache.x, -2000, 2000, 0),
        y: clampNum(selfStateCache.y, -500, 500, 0),
        z: clampNum(selfStateCache.z, -2000, 2000, 92),
        rotY: clampNum(selfStateCache.rotY, -100, 100, 0),
        hp: Math.round(clampNum(selfStateCache.hp, 0, 50000, 100)),
        maxHp: Math.round(clampNum(selfStateCache.maxHp, 1, 50000, 100)),
        level: Math.round(clampNum(selfStateCache.level, 1, 99, 1)),
        staffId: (selfStateCache.staffId || 'wand_ollivander').slice(0, 40),
        shieldActive: Boolean(selfStateCache.shieldActive),
        wins: Math.round(clampNum(selfStateCache.wins, 0, 100000, 0)),
        isDead: isSelfDead,
        lastSeenMs: Date.now(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Keep gameplay resilient if offline or rules pending
    }
  };

  const clearRoomSubcollectionsForReset = async () => {
    try {
      const [enemiesSnap, worldEvSnap] = await Promise.all([
        getDocs(query(collection(db, 'rooms', roomId, 'enemies'), where('roomId', '==', roomId))),
        getDocs(
          query(collection(db, 'rooms', roomId, 'world_events'), where('roomId', '==', roomId))
        ),
      ]);
      const batch = writeBatch(db);
      let count = 0;
      enemiesSnap.forEach((d) => {
        if (count < 400) {
          batch.delete(d.ref);
          count++;
        }
      });
      worldEvSnap.forEach((d) => {
        if (count < 400) {
          batch.delete(d.ref);
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
      }
    } catch {
      // Ignore cleanup errors; stageEpoch already isolates new runs
    }
  };

  // Bootstrap Room Document + Self Player Document
  const initRoom = async () => {
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(roomRef);
        if (!snap.exists()) {
          tx.set(roomRef, {
            roomId,
            labyrinthMode: opts.labyrinthMode,
            labyrinthStage: clampNum(opts.stage, 0, 5, 1),
            stageEpoch: 1,
            gameStartNonce: 0,
            gameStartStage: 1,
            gameStartHostId: '',
            allDeadResetNonce: 0,
            allDeadResetStage: 1,
            stageAdvanceNonce: 0,
            stageAdvanceStage: 1,
            stageAdvanceVictory: false,
            stageAdvanceReset: false,
            stageAdvanceBy: '',
            duelResetNonce: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      });
      await writeSelfPlayerDoc();
      if (!disposed) {
        opts.onConnectedChange(true);
      }
    } catch {
      if (!disposed) {
        opts.onConnectedChange(false);
      }
    }
  };
  const initRoomPromise = initRoom();

  const unsubscribers: Unsubscribe[] = [];

  // 1. Room Document Listener (mode, game start, stage advance, all-dead reset, duel reset)
  unsubscribers.push(
    onSnapshot(
      roomRef,
      (snap) => {
        if (disposed || !snap.exists()) return;
        opts.onConnectedChange(true);
        const data = snap.data();

        const nextMode: LabyrinthMultiplayerMode =
          data.labyrinthMode === 'parallel' ? 'parallel' : 'shared';
        const nextEpoch = Math.max(1, Number(data.stageEpoch) || 1);
        const nextStage = clampNum(data.labyrinthStage, 0, 5, 1);

        if (nextEpoch !== currentStageEpoch) {
          currentStageEpoch = nextEpoch;
          processedWorldEventIds.clear();
          lastEnemySnapshotMap.clear();
        }
        currentLabyrinthStage = nextStage;

        if (!initialRoomLoaded) {
          initialRoomLoaded = true;
          seenGameStartNonce = Number(data.gameStartNonce) || 0;
          seenAllDeadNonce = Number(data.allDeadResetNonce) || 0;
          seenStageAdvanceNonce = Number(data.stageAdvanceNonce) || 0;
          seenDuelResetNonce = Number(data.duelResetNonce) || 0;
          currentLabyrinthMode = nextMode;
          opts.onModeChanged(nextMode);
          return;
        }

        if (nextMode !== currentLabyrinthMode) {
          currentLabyrinthMode = nextMode;
          opts.onModeChanged(nextMode);
        }

        const gStartNonce = Number(data.gameStartNonce) || 0;
        if (gStartNonce > seenGameStartNonce) {
          seenGameStartNonce = gStartNonce;
          isSelfDead = false;
          opts.onGameStarted({
            room: roomId,
            labyrinthStage: toStageNum(data.gameStartStage),
            hostId: String(data.gameStartHostId || ''),
          });
        }

        const allDeadNonce = Number(data.allDeadResetNonce) || 0;
        if (allDeadNonce > seenAllDeadNonce) {
          seenAllDeadNonce = allDeadNonce;
          isSelfDead = false;
          opts.onAllDeadReset(toStageNum(data.allDeadResetStage));
        }

        const stageAdvNonce = Number(data.stageAdvanceNonce) || 0;
        if (stageAdvNonce > seenStageAdvanceNonce) {
          seenStageAdvanceNonce = stageAdvNonce;
          const advBy = String(data.stageAdvanceBy || '');
          if (advBy !== selfId) {
            opts.onStageAdvanced({
              stage: Number(data.stageAdvanceStage) || 1,
              victory: Boolean(data.stageAdvanceVictory),
              reset: Boolean(data.stageAdvanceReset),
              senderId: advBy,
            });
          }
        }

        const duelNonce = Number(data.duelResetNonce) || 0;
        if (duelNonce > seenDuelResetNonce) {
          seenDuelResetNonce = duelNonce;
          opts.onDuelReset();
        }
      },
      () => {
        if (!disposed) opts.onConnectedChange(false);
      }
    )
  );

  // 2. Room Players Listener (positions, HP, shields, dead/downed state)
  const playersQuery = query(
    collection(db, 'rooms', roomId, 'players'),
    where('roomId', '==', roomId)
  );
  unsubscribers.push(
    onSnapshot(playersQuery, (snapshot) => {
      if (disposed) return;
      const now = Date.now();
      const list: RemotePlayerState[] = [];
      const nextDead = new Set<string>();

      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const lastSeen = Number(d.lastSeenMs) || 0;
        // Filter out stale disconnected peers (> 25s without heartbeat)
        if (docSnap.id !== selfId && now - lastSeen > 25000) {
          return;
        }
        const deadFlag = Boolean(d.isDead);
        if (deadFlag) {
          nextDead.add(docSnap.id);
          if (docSnap.id !== selfId && !activeDeadIds.has(docSnap.id)) {
            opts.onPlayerDowned(docSnap.id);
          }
        }
        list.push({
          id: docSnap.id,
          name: String(d.name || 'Арканист'),
          x: Number(d.x) || 0,
          y: Number(d.y) || 0,
          z: Number(d.z) || 0,
          rotY: Number(d.rotY) || 0,
          hp: Number(d.hp) ?? 100,
          maxHp: Number(d.maxHp) || 100,
          level: Number(d.level) || 1,
          staffId: String(d.staffId || 'wand_ollivander'),
          shieldActive: Boolean(d.shieldActive),
          wins: Number(d.wins) || 0,
        });
      });

      activePlayersCache = list;
      activeDeadIds = nextDead;
      opts.onPlayersSync(list);
    })
  );

  // 3. Shared Room Enemies Listener (hits + periodic enemy sync)
  const enemiesQuery = query(
    collection(db, 'rooms', roomId, 'enemies'),
    where('roomId', '==', roomId)
  );
  unsubscribers.push(
    onSnapshot(enemiesQuery, (snapshot) => {
      if (disposed || currentLabyrinthMode !== 'shared') return;

      const syncRecords: Array<{
        id: string;
        hp: number;
        maxHp: number;
        x: number;
        y: number;
        z: number;
        state: string;
        killed: boolean;
      }> = [];
      let syncStage = currentLabyrinthStage;

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') return;
        const d = change.doc.data();
        const docEpoch = Number(d.stageEpoch) || 1;
        if (docEpoch !== currentStageEpoch) return;

        const stage = Number(d.stage) || 1;
        const lastHitId = String(d.lastHitId || '');
        const lastAttackerId = String(d.lastAttackerId || '');
        if (
          lastHitId &&
          lastAttackerId &&
          lastAttackerId !== selfId &&
          !rememberId(processedHitIds, lastHitId)
        ) {
          opts.onEnemyDamaged({
            enemyId: String(d.id || change.doc.id),
            stage,
            hp: Number(d.hp) ?? 0,
            maxHp: Number(d.maxHp) || 100,
            damage: Number(d.lastDamage) || 0,
            attackerId: lastAttackerId,
            spellId: String(d.lastSpellId || 'incendio'),
            stunSec: Number(d.lastStunSec) || 0,
            freezeSec: Number(d.lastFreezeSec) || 0,
            killed: Boolean(d.killed),
            x: Number(d.x) || 0,
            z: Number(d.z) || 0,
          });
        }

        if (String(d.senderId || '') !== selfId) {
          const sig = `${d.hp}_${d.x}_${d.z}_${d.state}_${d.killed}`;
          if (lastEnemySnapshotMap.get(change.doc.id) !== sig) {
            lastEnemySnapshotMap.set(change.doc.id, sig);
            syncStage = stage;
            syncRecords.push({
              id: String(d.id || change.doc.id),
              hp: Number(d.hp) ?? 0,
              maxHp: Number(d.maxHp) || 100,
              x: Number(d.x) || 0,
              y: Number(d.y) || 0,
              z: Number(d.z) || 0,
              state: String(d.state || 'idle'),
              killed: Boolean(d.killed),
            });
          }
        }
      });

      if (syncRecords.length > 0) {
        opts.onEnemySynced({
          stage: syncStage,
          senderId: 'remote',
          enemies: syncRecords,
        });
      }
    })
  );

  // 4. Room Ephemeral Events Listener (spell_cast & player_hit)
  const eventsQuery = query(
    collection(db, 'rooms', roomId, 'events'),
    where('roomId', '==', roomId)
  );
  unsubscribers.push(
    onSnapshot(eventsQuery, (snapshot) => {
      if (disposed) return;
      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') return;
        const d = change.doc.data();
        const createdAtMs = Number(d.createdAtMs) || 0;
        if (createdAtMs < joinedAtMs - 2000) return;
        if (rememberId(processedEventIds, change.doc.id)) return;

        const senderId = String(d.senderId || '');
        if (d.kind === 'spell_cast' && senderId !== selfId) {
          opts.onSpellSpawned({
            casterId: senderId,
            spellId: String(d.spellId || 'incendio'),
            power: Number(d.power) || 25,
            accuracy: Number(d.accuracy) || 80,
            origin: {
              x: Number(d.originX) || 0,
              y: Number(d.originY) || 1.5,
              z: Number(d.originZ) || 0,
            },
            direction: {
              x: Number(d.dirX) || 0,
              y: Number(d.dirY) || 0,
              z: Number(d.dirZ) || -1,
            },
            color: String(d.color || '#f97316'),
          });
        } else if (d.kind === 'player_hit' && String(d.targetId || '') === selfId) {
          opts.onPlayerDamaged({
            targetId: selfId,
            attackerId: senderId,
            attackerName: String(d.senderName || 'Союзник'),
            damage: Number(d.damage) || 20,
          });
        }
      });
    })
  );

  // 5. Room Shared World Events Listener (walls, campfires, chests, traps, harvests, props)
  const worldEventsQuery = query(
    collection(db, 'rooms', roomId, 'world_events'),
    where('roomId', '==', roomId)
  );
  unsubscribers.push(
    onSnapshot(worldEventsQuery, (snapshot) => {
      if (disposed || currentLabyrinthMode !== 'shared') return;
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') return;
        const d = change.doc.data();
        const docEpoch = Number(d.stageEpoch) || 1;
        if (docEpoch !== currentStageEpoch) return;
        if (String(d.senderId || '') === selfId) return;

        const evId = String(d.eventId || change.doc.id);
        if (d.kind !== 'prop_sync' && rememberId(processedWorldEventIds, evId)) {
          return;
        }

        opts.onWorldEvent({
          kind: d.kind,
          stage: Number(d.stage) || 1,
          targetId: String(d.targetId || ''),
          x: Number(d.x),
          y: Number(d.y),
          z: Number(d.z),
          rotY: Number(d.rotY),
          vx: Number(d.vx),
          vy: Number(d.vy),
          vz: Number(d.vz),
          isHeld: Boolean(d.isHeld),
          isThrown: Boolean(d.isThrown),
          throwDamage: Number(d.throwDamage),
        });
      });
    })
  );

  // Heartbeat keep-alive every 6s so active peers stay visible even when idle
  const heartbeatInterval = window.setInterval(() => {
    if (!disposed) {
      void writeSelfPlayerDoc();
    }
  }, 6000);

  return {
    roomId,
    sendMove: (pos) => {
      if (disposed) return;
      selfStateCache = {
        ...selfStateCache,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        rotY: pos.rotY,
        hp: pos.hp,
        maxHp: pos.maxHp,
        shieldActive: pos.shieldActive,
        name: pos.name || selfStateCache.name,
        staffId: pos.staffId || selfStateCache.staffId,
        level: pos.level || selfStateCache.level,
      };
      const now = performance.now();
      const hasPeers = activePlayersCache.some((p) => p.id !== selfId);
      const minInterval = hasPeers ? 140 : 2000;
      const sig = `${pos.x.toFixed(1)}_${pos.z.toFixed(1)}_${pos.rotY.toFixed(1)}_${pos.hp}_${pos.maxHp}_${pos.shieldActive}_${pos.staffId}_${pos.level}_${pos.name}`;
      if (sig === lastMoveSignature && now - lastMoveSentAt < 5000) return;
      if (now - lastMoveSentAt < minInterval) return;

      lastMoveSentAt = now;
      lastMoveSignature = sig;
      void writeSelfPlayerDoc();
    },

    sendSpellCast: (payload) => {
      if (disposed) return;
      const eventId = sanitizeDocId(
        `sc_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      );
      const evRef = doc(db, 'rooms', roomId, 'events', eventId);
      void setDoc(evRef, {
        id: eventId,
        roomId,
        kind: 'spell_cast',
        senderId: selfId,
        senderName: (payload.casterName || selfStateCache.name).slice(0, 40) || 'Арканист',
        spellId: String(payload.spellId || 'incendio').slice(0, 32),
        spellName: String(payload.spellName || 'Инсендио').slice(0, 48),
        power: clampNum(payload.power, 0, 50000, 25),
        accuracy: clampNum(payload.accuracy, 0, 100, 80),
        originX: clampNum(payload.origin?.x, -2000, 2000, 0),
        originY: clampNum(payload.origin?.y, -500, 500, 1.5),
        originZ: clampNum(payload.origin?.z, -2000, 2000, 0),
        dirX: clampNum(payload.direction?.x, -10, 10, 0),
        dirY: clampNum(payload.direction?.y, -10, 10, 0),
        dirZ: clampNum(payload.direction?.z, -10, 10, -1),
        color: String(payload.color || '#f97316').slice(0, 24),
        targetId: '',
        damage: 0,
        createdAtMs: Date.now(),
        createdAt: serverTimestamp(),
      })
        .then(() => {
          window.setTimeout(() => {
            void deleteDoc(evRef).catch(() => {});
          }, 8000);
        })
        .catch(() => {});
    },

    sendPlayerHit: (targetId, damage, attackerName) => {
      if (disposed) return;
      const safeTarget = sanitizeDocId(targetId, '');
      if (!safeTarget) return;
      const eventId = sanitizeDocId(
        `ph_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      );
      const evRef = doc(db, 'rooms', roomId, 'events', eventId);
      void setDoc(evRef, {
        id: eventId,
        roomId,
        kind: 'player_hit',
        senderId: selfId,
        senderName: (attackerName || selfStateCache.name).slice(0, 40) || 'Союзник',
        spellId: '',
        spellName: '',
        power: 0,
        accuracy: 100,
        originX: 0,
        originY: 0,
        originZ: 0,
        dirX: 0,
        dirY: 0,
        dirZ: 0,
        color: '',
        targetId: safeTarget,
        damage: clampNum(damage, 1, 50000, 20),
        createdAtMs: Date.now(),
        createdAt: serverTimestamp(),
      })
        .then(() => {
          window.setTimeout(() => {
            void deleteDoc(evRef).catch(() => {});
          }, 8000);
        })
        .catch(() => {});
    },

    sendEnemyHit: (payload) => {
      if (disposed || currentLabyrinthMode !== 'shared') return;
      const enemyId = sanitizeDocId(payload.enemyId, '');
      if (!enemyId) return;
      const enemyRef = doc(db, 'rooms', roomId, 'enemies', enemyId);
      const safeHitId = sanitizeDocId(
        payload.hitId || `hit_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      );
      const maxHp = Math.max(1, Math.round(clampNum(payload.maxHp, 1, 500000, 100)));
      const damage = Math.max(1, Math.round(clampNum(payload.damage, 1, 50000, 10)));

      void runTransaction(db, async (tx) => {
        const snap = await tx.get(enemyRef);
        let nextHp = Math.max(0, maxHp - damage);
        if (snap.exists()) {
          const prev = snap.data();
          if ((Number(prev.stageEpoch) || 1) === currentStageEpoch) {
            if (prev.killed || (Number(prev.hp) || 0) <= 0) return;
            nextHp = Math.max(0, (Number(prev.hp) || maxHp) - damage);
          }
        }
        tx.set(enemyRef, {
          id: enemyId,
          roomId,
          stage: clampNum(payload.stage, 0, 5, 1),
          stageEpoch: currentStageEpoch,
          hp: nextHp,
          maxHp,
          x: clampNum(payload.x, -2000, 2000, 0),
          y: clampNum(payload.y, -500, 500, 0),
          z: clampNum(payload.z, -2000, 2000, 0),
          state: 'seek',
          killed: nextHp <= 0,
          lastHitId: safeHitId,
          lastAttackerId: selfId,
          lastDamage: damage,
          lastSpellId: String(payload.spellId || 'incendio').slice(0, 32),
          lastStunSec: clampNum(payload.stunSec, 0, 60, 0),
          lastFreezeSec: clampNum(payload.freezeSec, 0, 60, 0),
          senderId: selfId,
          updatedAt: serverTimestamp(),
        });
      }).catch(() => {});
    },

    sendEnemySync: (payload) => {
      if (disposed || currentLabyrinthMode !== 'shared') return;
      const now = performance.now();
      if (now - lastEnemySyncAt < 450) return;

      // Only the elected host (lexicographically lowest active player ID) broadcasts periodic enemy positions
      const activeIds = activePlayersCache.map((p) => p.id).sort();
      if (activeIds.length > 1 && activeIds[0] !== selfId) return;

      lastEnemySyncAt = now;
      const stage = clampNum(payload.stage, 0, 5, 1);

      for (const item of payload.enemies.slice(0, 12)) {
        const enemyId = sanitizeDocId(item.id, '');
        if (!enemyId) continue;
        const maxHp = Math.max(1, Math.round(clampNum(item.maxHp, 1, 500000, 100)));
        const hp = Math.max(0, Math.min(maxHp, Math.round(clampNum(item.hp, 0, 500000, maxHp))));
        const x = Number(clampNum(item.x, -2000, 2000, 0).toFixed(1));
        const z = Number(clampNum(item.z, -2000, 2000, 0).toFixed(1));
        const sig = `${hp}_${x}_${z}_${item.state}`;
        if (lastEnemySnapshotMap.get(enemyId) === sig) continue;
        lastEnemySnapshotMap.set(enemyId, sig);

        const enemyRef = doc(db, 'rooms', roomId, 'enemies', enemyId);
        void setDoc(enemyRef, {
          id: enemyId,
          roomId,
          stage,
          stageEpoch: currentStageEpoch,
          hp,
          maxHp,
          x,
          y: clampNum(item.y, -500, 500, 0),
          z,
          state: String(item.state || 'idle').slice(0, 24),
          killed: hp <= 0,
          lastHitId: '',
          lastAttackerId: '',
          lastDamage: 0,
          lastSpellId: '',
          lastStunSec: 0,
          lastFreezeSec: 0,
          senderId: selfId,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
    },

    sendWorldEvent: (payload) => {
      if (disposed || currentLabyrinthMode !== 'shared') return;
      const now = performance.now();
      if (payload.kind === 'prop_sync') {
        const prevT = lastPropSyncTimes.get(payload.targetId) || 0;
        if (now - prevT < 220) return;
        lastPropSyncTimes.set(payload.targetId, now);
      }

      const safeTarget = sanitizeDocId(payload.targetId, 'target');
      const eventKey =
        payload.kind === 'wall_place'
          ? sanitizeDocId(`wall_${safeTarget}`)
          : payload.kind === 'wall_dismantle'
          ? sanitizeDocId(`wdismantle_${safeTarget}`)
          : payload.kind === 'prop_sync'
          ? sanitizeDocId(`prop_${safeTarget}`)
          : sanitizeDocId(`${payload.kind}_${safeTarget}`);

      if (payload.kind === 'wall_dismantle') {
        void deleteDoc(doc(db, 'rooms', roomId, 'world_events', sanitizeDocId(`wall_${safeTarget}`))).catch(
          () => {}
        );
      }

      const eventId = sanitizeDocId(
        `wev_${selfId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      );
      const evRef = doc(db, 'rooms', roomId, 'world_events', eventKey);
      void setDoc(evRef, {
        eventKey,
        roomId,
        eventId,
        senderId: selfId,
        stage: clampNum(payload.stage, 0, 5, 1),
        stageEpoch: currentStageEpoch,
        kind: String(payload.kind).slice(0, 32),
        targetId: String(payload.targetId || safeTarget).slice(0, 64),
        x: clampNum(payload.x, -2000, 2000, 0),
        y: clampNum(payload.y, -500, 500, 0),
        z: clampNum(payload.z, -2000, 2000, 0),
        rotY: clampNum(payload.rotY, -100, 100, 0),
        vx: clampNum(payload.vx, -500, 500, 0),
        vy: clampNum(payload.vy, -500, 500, 0),
        vz: clampNum(payload.vz, -500, 500, 0),
        isHeld: Boolean(payload.isHeld),
        isThrown: Boolean(payload.isThrown),
        throwDamage: clampNum(payload.throwDamage, 0, 50000, 0),
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    },

    sendSetMode: (nextMode, stage) => {
      if (disposed) return;
      currentLabyrinthMode = nextMode;
      void initRoomPromise.then(() =>
        updateDoc(roomRef, {
          labyrinthMode: nextMode,
          labyrinthStage: clampNum(stage, 0, 5, 1),
          updatedAt: serverTimestamp(),
        })
      ).catch(() => {});
    },

    sendStartGame: (stage) => {
      if (disposed) return;
      currentLabyrinthMode = 'shared';
      isSelfDead = false;
      const nextEpoch = currentStageEpoch + 1;
      currentStageEpoch = nextEpoch;
      seenGameStartNonce = Date.now();
      void clearRoomSubcollectionsForReset();
      void initRoomPromise.then(() =>
        updateDoc(roomRef, {
          labyrinthMode: 'shared',
          labyrinthStage: stage,
          stageEpoch: nextEpoch,
          gameStartNonce: seenGameStartNonce,
          gameStartStage: stage,
          gameStartHostId: selfId,
          updatedAt: serverTimestamp(),
        })
      ).catch(() => {});
      void writeSelfPlayerDoc();
    },

    sendStageAdvance: (payload) => {
      if (disposed || currentLabyrinthMode !== 'shared') return;
      const nextEpoch = currentStageEpoch + 1;
      currentStageEpoch = nextEpoch;
      seenStageAdvanceNonce = Date.now();
      void clearRoomSubcollectionsForReset();
      void initRoomPromise.then(() =>
        updateDoc(roomRef, {
          labyrinthStage: clampNum(payload.stage, 0, 5, 1),
          stageEpoch: nextEpoch,
          stageAdvanceNonce: seenStageAdvanceNonce,
          stageAdvanceStage: clampNum(payload.stage, 0, 5, 1),
          stageAdvanceVictory: Boolean(payload.victory),
          stageAdvanceReset: Boolean(payload.reset),
          stageAdvanceBy: selfId,
          updatedAt: serverTimestamp(),
        })
      ).catch(() => {});
    },

    sendPlayerDied: (stage) => {
      if (disposed || currentLabyrinthMode !== 'shared') return;
      isSelfDead = true;
      selfStateCache.hp = 0;
      void writeSelfPlayerDoc();

      const activeIds = activePlayersCache.map((p) => p.id);
      if (!activeIds.includes(selfId)) activeIds.push(selfId);

      const allDead =
        activeIds.length > 0 &&
        activeIds.every((id) => id === selfId || activeDeadIds.has(id));

      if (allDead) {
        const nextEpoch = currentStageEpoch + 1;
        currentStageEpoch = nextEpoch;
        void clearRoomSubcollectionsForReset();
        void initRoomPromise.then(() =>
          updateDoc(roomRef, {
            allDeadResetNonce: Date.now(),
            allDeadResetStage: clampNum(stage, 0, 5, 1),
            stageEpoch: nextEpoch,
            updatedAt: serverTimestamp(),
          })
        ).catch(() => {});
      }
    },

    sendPlayerRespawn: (maxHp) => {
      if (disposed) return;
      isSelfDead = false;
      selfStateCache.hp = Math.max(1, Math.round(maxHp || selfStateCache.maxHp));
      void writeSelfPlayerDoc();
    },

    sendDuelReset: () => {
      if (disposed) return;
      isSelfDead = false;
      selfStateCache.hp = selfStateCache.maxHp;
      void writeSelfPlayerDoc();
      void initRoomPromise.then(() =>
        updateDoc(roomRef, {
          duelResetNonce: Date.now(),
          updatedAt: serverTimestamp(),
        })
      ).catch(() => {});
    },

    dispose: () => {
      disposed = true;
      window.clearInterval(heartbeatInterval);
      for (const unsub of unsubscribers) {
        unsub();
      }
      void deleteDoc(selfPlayerRef).catch(() => {});
    },
  };
}
