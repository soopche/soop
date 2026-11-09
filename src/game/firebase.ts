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
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
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
  CHARACTER_ID_MAX_LENGTH,
  CHARACTER_NAME_MAX_LENGTH,
  createDefaultCharacterProfile,
} from './spells';

// Initialize Firebase SDK
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

// Validate connection to Firestore on boot as required by firebase-integration-rpc
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
    // Skip logging other errors, as this is simply a connection test.
  }
}
void testConnection();

// ============================================================================
// LOCAL STORAGE FALLBACK & INSTANT CACHE
// ============================================================================
const LOCAL_CHARS_KEY_PREFIX = 'vox_arcanum_characters_v1_';
const LOCAL_ACTIVE_CHAR_KEY_PREFIX = 'vox_arcanum_active_char_v1_';

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
    window.localStorage.setItem(
      getStorageKeyForOwner(ownerId),
      JSON.stringify(sanitized)
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function getActiveCharacterIdFromStorage(ownerId = 'local_guest'): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(`${LOCAL_ACTIVE_CHAR_KEY_PREFIX}${ownerId || 'local_guest'}`);
  } catch {
    return null;
  }
}

export function setActiveCharacterIdInStorage(
  ownerId: string,
  characterId: string
): void {
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

  const unlockedStageD2 = clampInt(
    raw.unlockedStageD2,
    1,
    5,
    1
  ) as 1 | 2 | 3 | 4 | 5;

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

export function subscribeToAuthChanges(
  callback: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

// ============================================================================
// FIRESTORE CHARACTER PERSISTENCE
// ============================================================================
export async function saveCharacterToFirestore(
  userId: string,
  profile: CharacterProfileData
): Promise<void> {
  const sanitized = sanitizeCharacterProfile(
    { ...profile, ownerId: userId },
    userId
  );
  const path = `users/${userId}/characters/${sanitized.id}`;
  const charRef = doc(db, 'users', userId, 'characters', sanitized.id);

  const mutableFields = {
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
