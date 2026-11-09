import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ActiveFoodBuffState,
  AimSurfaceTarget,
  ARCANE_SWORD_COOLDOWN_SEC,
  ARCANE_SWORD_LV6_SWING_COOLDOWN_SEC,
  ARCANE_SWORD_RANGE,
  ARCANE_SWORD_SWING_COOLDOWN_SEC,
  shouldTriggerArcaneSwordExpiringSound,
  ArtifactId,
  ArtifactSlot,
  BARREL_RESPAWN_SEC,
  BEAR_CLEAVE_RADIUS,
  BEAR_FEAR_DURATION_SEC,
  BEAR_FEAR_RADIUS,
  BOAR_SLOW_DURATION_SEC,
  BOAR_SLOW_FACTOR,
  BOAR_SLOW_PERCENT,
  CAMPFIRE_HEAL_RADIUS,
  CAMPFIRE_HP_REGEN_PER_SEC,
  CAMPFIRE_MP_REGEN_MULTIPLIER,
  CAMPFIRE_TELEPORT_COOLDOWN_SEC,
  calculateElementalAllyStats,
  calculateExplosiveBarrelDamage,
  countWallsSurroundingCampfire,
  findAimedWoodenWall,
  getCampfireEffectiveRegen,
  isCampfireShelteredByWalls,
  MAX_BUILT_WALLS,
  WALL_BUILD_DURATION_SEC,
  CookedBatFoodItem,
  CookedBearFoodItem,
  CookedBoarFoodItem,
  CookedRatFoodItem,
  CraftedPotionItem,
  DifficultyTier,
  ElementalAllyKind,
  ENGORGIO_BUFF_DURATION_SEC,
  EquipmentId,
  EQUIPMENT_CATALOG,
  evaluateEnemyBaseMaxHp,
  evaluateEnemyKillXp,
  evaluateSpikeLineWaveState,
  FLOOR_TRAP_DAMAGE,
  FLOOR_TRAP_SCALE_MULTIPLIER,
  FLOOR_TRAP_TRIGGER_RADIUS,
  FloorTrapSpec,
  FROST_WIND_COOLDOWN_SEC,
  FROST_WIND_DURATION_SEC,
  FROST_WIND_PULL_SPEED,
  FROST_WIND_RADIUS,
  FROST_WIND_TELEGRAPH_SEC,
  applyCooldownResetToSpellCooldowns,
  COOLDOWN_RESET_BASE_COOLDOWN_SEC,
  getCombinedArtifactBonuses,
  getDeterministicEnemyId,
  getDiabloDifficultyMultipliers,
  getLabyrinthChests,
  getLabyrinthFloorTraps,
  getLabyrinthLaserTraps,
  getLabyrinthRuneGates,
  getLabyrinthSpikeTrapZones,
  getLabyrinthStageLayout,
  getLabyrinthWaterLakes,
  getScaledEnemyStatsForMode,
  getStage5SpawnSpecs,
  getWormBossSplitChildren,
  GLACIUS_SLOW_DURATION_SEC,
  GLACIUS_SLOW_FACTOR,
  HARVEST_NODE_RESPAWN_SEC,
  isPlayerTouchingSpikeLine,
  isStage5WormBossArchetype,
  isStageBossDefeated,
  LabyrinthChestSpec,
  LabyrinthMultiplayerMode,
  LabyrinthRuneButtonSpec,
  LabyrinthRuneGateSpec,
  LaserBeamTrapSpec,
  MUD_BALL_SCALE_MULTIPLIER,
  MUD_BALL_SLOW_DURATION_SEC,
  MUD_BALL_SLOW_FACTOR,
  MUD_PUDDLE_DURATION_SEC,
  MUD_PUDDLE_RADIUS,
  MUD_PUDDLE_SLOW_FACTOR,
  PET_CATALOG,
  QuestEventType,
  ReagentId,
  REAGENTS,
  reconcileSharedEnemyDamage,
  rollChestLoot,
  RUNE_BUTTON_SCALE,
  segmentHitsWall,
  selectEnemyAggroTarget,
  SHIELD_BASE_DAMAGE_MULTIPLIER,
  SKELETON_ARROW_SPEED,
  SKELETON_VOLLEY_ARROW_SPEED,
  SKELETON_EARTHQUAKE_LENGTH,
  SKELETON_EARTHQUAKE_WIDTH,
  SKELETON_SHIELD_DAMAGE_MULTIPLIER,
  SPECIAL_COOLDOWN_SEC,
  SpellId,
  SPELLS,
  SPELL_COOLDOWN_SEC,
  SpikeTrapZoneSpec,
  Stage5WormBossArchetype,
  TameableSpeciesId,
  TELEPORT_BASE_COOLDOWN_SEC,
  TELEPORT_BLAST_RADIUS,
  WallBox,
  WaterLakeSpec,
  WORM_BURROW_DURATION_SEC,
  WORM_EMERGE_DAMAGE,
  WORM_EMERGE_RADIUS,
  WORM_EMERGE_STUN_SEC,
  WORM_FIRE_POOL_BURN_SEC,
  WORM_FIRE_POOL_DURATION_SEC,
  WORM_FIRE_POOL_RADIUS,
  WORM_LEECH_ATTACH_DURATION_SEC,
  WORM_LEECH_BITE_DAMAGE,
  WORM_LEECH_GLOW_DURATION_SEC,
  WORM_LEECH_HEAL_AMOUNT,
  WORM_LEECH_HEAL_PER_TICK,
  WORM_LEECH_JUMP_COOLDOWN_SEC,
  WORM_LEECH_LAND_RADIUS,
  WORM_LEECH_LATCH_DURATION_SEC,
  WORM_LEECH_RED_TELEGRAPH_SEC,
  WORM_MELEE_FIGHT_DURATION_SEC,
  WORM_MELEE_SURFACE_DURATION_SEC,
  WORM_PHASE1_MAX_HP,
  WORM_PHASE2_MAX_HP,
  WORM_PHASE3_MAX_HP,
  WORM_RANGED_SURFACE_DURATION_SEC,
  WORM_SPLIT_HP_RATIO,
} from './spells';
import { audioEngine } from './audio';

// Reusable scratch vectors to guarantee Zero GC inside the 60fps loop
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();
const _color = new THREE.Color();

export type GameMapMode = 'arena' | 'labyrinth';

export interface HudSnapshot {
  mapMode: GameMapMode;
  labyrinthMultiplayerMode: LabyrinthMultiplayerMode;
  labyrinthStage: number;
  difficultyTier: DifficultyTier;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  score: number;
  bestScore: number;
  wave: number;
  enemiesAlive: number;
  labyrinthProgressPercent: number;
  distanceToGoal: number;
  bossInfo: {
    name: string;
    hp: number;
    maxHp: number;
    totemsAlive: number;
    enraged?: boolean;
  } | null;
  heldObjectName: string | null;
  tamedPet: {
    species: TameableSpeciesId;
    name: string;
    title: string;
    level: number;
    trainingStep: number;
    petXp: number;
    petNextXp: number;
    scale: number;
    attackDamage: number;
    engorgioTimeLeft: number;
    passiveBonus: string;
  } | null;
  transfiguredPetName: string | null;
  nearbyInteractPrompt: string | null;
  campfireStatus: 'none' | 'unlit_nearby' | 'lit_in_aura' | 'lit_nearby';
  campfireWallsCount?: number;
  campfireSheltered?: boolean;
  builtWallsCount?: number;
  maxBuiltWalls?: number;
  aimedWallId?: string | null;
  activeWallBuildCast?: {
    remainingSec: number;
    totalSec: number;
  } | null;
  activeFoodBuff: ActiveFoodBuffState | null;
  activeBatFoodBuff: ActiveFoodBuffState | null;
  aimSurfaceTarget: AimSurfaceTarget;
  activeElementalAlly: {
    kind: ElementalAllyKind;
    name: string;
    remainingSec: number;
    totalDurationSec: number;
    attackDamage: number;
  } | null;
  activeArcaneSword: {
    remainingSec: number;
    totalDurationSec: number;
    damage: number;
    slashDamage: number;
    level: number;
    swingCooldown: number;
    ignites: boolean;
    ignitesOnHit: boolean;
    stuns: boolean;
    stunsOnHitSec: number;
  } | null;
  playerFearTimeLeft: number;
  testInvulnerable?: boolean;
  spellCooldowns: Record<SpellId, number>;
  openChestPreview: {
    chestId: string;
    label: string;
    reagents: Array<{ id: ReagentId; count: number }>;
    artifactId: ArtifactId | null;
  } | null;
  campfireTeleportCast: {
    active: boolean;
    remainingSec: number;
    totalSec: number;
    qualityPercent: number;
  } | null;
  lastCastBanner: {
    spellName: string;
    qualityPercent: number;
    damage: number;
    detail: string;
    color: string;
    timestamp: number;
  } | null;
}

export interface RemotePlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  hp: number;
  maxHp: number;
  level: number;
  staffId: string;
  shieldActive: boolean;
  wins: number;
}

export interface WorldCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onLootCollected: (reagentId: ReagentId, count: number, reason: string) => void;
  onChestOpened?: (chest: LabyrinthChestSpec) => void;
  onChestLooted?: (
    chest: LabyrinthChestSpec,
    contents: { reagents: Array<{ id: ReagentId; count: number }>; artifactId: ArtifactId | null }
  ) => void;
  onQuestEvent: (eventType: QuestEventType, amount?: number) => void;
  onXpGain: (xp: number) => void;
  onPetTamedOrUpgraded: (species: TameableSpeciesId, level: number) => void;
  onOpenCampfireCraft?: () => void;
  onStageUnlocked?: (nextStage: 1 | 2 | 3 | 4 | 5) => void;
  onWormBossDefeated?: () => void;
  onGameOver: (victory: boolean, stats: { score: number; wave: number; enemiesDefeated: number }) => void;
  onMultiplayerMove?: (pos: {
    x: number;
    y: number;
    z: number;
    rotY: number;
    hp: number;
    maxHp: number;
    shieldActive: boolean;
  }) => void;
  onMultiplayerHit?: (targetId: string, damage: number) => void;
  onMultiplayerEnemyHit?: (payload: {
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
  onMultiplayerEnemySync?: (payload: {
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
  onMultiplayerStageAdvance?: (payload: {
    stage: 1 | 2 | 3 | 4 | 5;
    victory: boolean;
    reset: boolean;
  }) => void;
  onMultiplayerWorldEvent?: (payload: SharedWorldEventPayload) => void;
}

export interface SharedWorldEventPayload {
  kind:
    | 'harvest'
    | 'floor_trap'
    | 'laser_trap'
    | 'barrel_explode'
    | 'prop_sync'
    | 'campfire_place'
    | 'campfire_light'
    | 'wall_place'
    | 'wall_dismantle'
    | 'rune_button'
    | 'chest_open';
  stage: number;
  targetId: string;
  x?: number;
  y?: number;
  z?: number;
  rotY?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  isHeld?: boolean;
  isThrown?: boolean;
  throwDamage?: number;
}

export type GraphicsQuality = 'high' | 'medium' | 'ultralow';

interface PhysicsProp {
  id: string;
  name: string;
  kind: 'crate' | 'boulder' | 'shield' | 'barrel';
  mesh: THREE.Group;
  homePosition: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
  isHeld: boolean;
  isThrown: boolean;
  throwDamage: number;
  explodedTimer: number;
  isPet: boolean;
  petScale: number;
  petAttackTimer: number;
  petDuration: number;
}

export interface CampfireActor {
  id: string;
  mesh: THREE.Group;
  flameGroup: THREE.Group;
  fireLight: THREE.PointLight;
  auraRing: THREE.Mesh;
  position: THREE.Vector3;
  isLit: boolean;
  animPhase: number;
}

export interface BuiltWallActor {
  id: string;
  mesh: THREE.Group;
  bodyGroup: THREE.Group;
  position: THREE.Vector3;
  x: number;
  z: number;
  rotY: number;
  wallBox: WallBox;
  buildRemainingSec: number;
  totalBuildSec: number;
  isBuilt: boolean;
}

interface TameableAnimalActor {
  id: string;
  species: TameableSpeciesId;
  name: string;
  title: string;
  mesh: THREE.Group;
  tailOrWingPart: THREE.Object3D | null;
  badgeSprite: THREE.Sprite;
  homePosition: THREE.Vector3;
  position: THREE.Vector3;
  isTamed: boolean;
  level: number;
  trainingStep: number; // 0..2 (3 steps in Settings required per level)
  petXp: number;
  baseScale: number;
  scaleMultiplier: number;
  targetScale: number;
  baseAttack: number;
  attackPower: number;
  engorgioTimer: number;
  engorgioScaleMult: number;
  engorgioDamageMult: number;
  attackCooldown: number;
  animPhase: number;
}

interface EnemyAnimParts {
  leftWing?: THREE.Object3D;
  rightWing?: THREE.Object3D;
  weaponOrTail?: THREE.Object3D;
  haloOrCore?: THREE.Object3D;
}

interface EnemyActor {
  id: string;
  name: string;
  archetype:
    | 'rat_swarmer'
    | 'wild_boar'
    | 'dark_kiter'
    | 'frost_charger'
    | 'sky_dive_gargoyle'
    | 'storm_harpy_shooter'
    | 'fire_demon'
    | 'water_monster'
    | 'stone_crusher'
    | 'mud_monster'
    | 'cave_bear'
    | 'skeleton_archer'
    | 'skeleton_hammer_shield'
    | 'boss_mage_1'
    | 'boss_mage_2'
    | 'boss_mage_3'
    | 'boss_elemental_4'
    | Stage5WormBossArchetype
    | 'boss_totem';
  isFlying: boolean;
  flyHeight: number;
  animPhase: number;
  animParts: EnemyAnimParts;
  lootId: ReagentId;
  mesh: THREE.Group;
  telegraphMesh: THREE.Mesh;
  hpBarCanvas: HTMLCanvasElement;
  hpBarTexture: THREE.CanvasTexture;
  baseMaxHp: number;
  hp: number;
  maxHp: number;
  speed: number;
  homePosition: THREE.Vector3;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  state: 'idle' | 'seek' | 'windup' | 'attack' | 'stunned' | 'ko';
  stateTimer: number;
  stunTimer: number;
  freezeTimer: number;
  burnTimer: number;
  burnTickAccum: number;
  hitFlashTimer: number;
  koTimer: number;
  strafeDir: number;
  teleportTimer: number;
  chargeCooldown: number;
  chargeWindupTimer: number;
  chargeActiveTimer: number;
  chargeDir: THREE.Vector3;
  chargeHitPlayer: boolean;
  chargeTrajectoryLine?: THREE.Mesh;
  enragedPhase2: boolean;
  attackCycle: number;
  hasSplit?: boolean;
  hasSplitWorm?: boolean;
  burrowTimer?: number;
  surfaceTimer?: number;
  surfaceFightTimer?: number;
  burrowCooldown?: number;
  burrowTargetPos?: THREE.Vector3;
  emergeTargetPos?: THREE.Vector3;
  burrowWarningCircle?: THREE.Group;
  burrowWarningRing?: THREE.Mesh;
  shieldGuardActive?: boolean;
  shieldGuardTimer?: number;
  leechTelegraphTimer?: number;
  leechGlowTimer?: number;
  leechJumpCooldown?: number;
  leechJumpStartPos?: THREE.Vector3;
  leechJumpTargetPos?: THREE.Vector3;
  leechAttachedTimer?: number;
  leechLatchTimer?: number;
  leechTickAccum?: number;
  frostWindCooldown?: number;
}

interface SpellProjectile {
  active: boolean;
  spellId: SpellId;
  casterId: string;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  qualityPercent: number;
  animalScale: number;
  petDuration: number;
  life: number;
  color: THREE.Color;
  isFireWall?: boolean;
  isMudBall?: boolean;
  isArrow?: boolean;
  spellLevel?: number;
  isPetAttack?: boolean;
}

interface MudPuddleActor {
  id: string;
  position: THREE.Vector3;
  radius: number;
  remainingSec: number;
  group: THREE.Group;
}

interface FirePoolActor {
  id: string;
  position: THREE.Vector3;
  radius: number;
  remainingSec: number;
  tickAccum: number;
  damagePerTick: number;
  group: THREE.Group;
}

interface EarthquakeLineActor {
  id: string;
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  length: number;
  width: number;
  remainingSec: number;
  damage: number;
  hasHitPlayer: boolean;
  group: THREE.Group;
}

interface IceRainZoneActor {
  id: string;
  position: THREE.Vector3;
  radius: number;
  telegraphTimer: number;
  activeTimer: number;
  tickAccum: number;
  damagePerTick: number;
  group: THREE.Group;
  warningRing: THREE.Mesh;
  fillDisc: THREE.Mesh;
  rainGroup: THREE.Group;
}

interface FrostWindZoneActor {
  id: string;
  position: THREE.Vector3;
  casterEnemyId: string;
  casterPos: THREE.Vector3;
  radius: number;
  telegraphTimer: number;
  activeTimer: number;
  bannerCooldown: number;
  group: THREE.Group;
  blueRing: THREE.Mesh;
  fillDisc: THREE.Mesh;
  windStreamGroup: THREE.Group;
}

interface HarvestNode {
  id: string;
  name: string;
  reagentId: ReagentId;
  mesh: THREE.Group;
  position: THREE.Vector3;
  cooldown: number;
}

interface LootDrop {
  id: string;
  reagentId: ReagentId;
  mesh: THREE.Group;
  position: THREE.Vector3;
  age: number;
}

export interface FloorTrapActor {
  id: string;
  mesh: THREE.Group;
  armedGroup: THREE.Group;
  runeRing: THREE.Mesh;
  coreCrystal: THREE.Mesh;
  shockwaveMesh: THREE.Mesh;
  position: THREE.Vector3;
  radius: number;
  damage: number;
  triggered: boolean;
  explosionTimer: number;
  animPhase: number;
}

export interface LaserBeamTrapActor {
  id: string;
  spec: LaserBeamTrapSpec;
  mesh: THREE.Group;
  beamGroup: THREE.Group;
  position: THREE.Vector3;
  cooldown: number;
  animPhase: number;
}

export interface SpikeTrapZoneActor {
  id: string;
  spec: SpikeTrapZoneSpec;
  mesh: THREE.Group;
  lineGroups: THREE.Group[];
  lineWarnStrips: THREE.Mesh[];
  hitCooldown: number;
  elapsedTime: number;
}

export interface TreasureChestActor {
  id: string;
  spec: LabyrinthChestSpec;
  mesh: THREE.Group;
  lidPivot: THREE.Group;
  glowRing: THREE.Mesh;
  badgeSprite: THREE.Sprite;
  position: THREE.Vector3;
  opened: boolean;
  looted: boolean;
  contents: {
    reagents: Array<{ id: ReagentId; count: number }>;
    artifactId: ArtifactId | null;
  } | null;
  openAnimProgress: number;
  animPhase: number;
}

export interface RuneButtonActor {
  id: string;
  spec: LabyrinthRuneButtonSpec;
  mesh: THREE.Group;
  crystalMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  badgeSprite: THREE.Sprite;
  position: THREE.Vector3;
  activated: boolean;
  animPhase: number;
}

export interface RuneGateActor {
  id: string;
  spec: LabyrinthRuneGateSpec;
  mesh: THREE.Group;
  leftDoor: THREE.Group;
  rightDoor: THREE.Group;
  badgeSprite: THREE.Sprite;
  wallBox: WallBox;
  isOpen: boolean;
  openingProgress: number;
  buttonsActivated: number;
  totalButtons: number;
}

export interface WaterLakeActor {
  id: string;
  spec: WaterLakeSpec;
  mesh: THREE.Group;
  waterSurface: THREE.Mesh;
  rippleRing1: THREE.Mesh;
  rippleRing2: THREE.Mesh;
  position: THREE.Vector3;
  animPhase: number;
}

export interface SnowPatchActor {
  id: string;
  mesh: THREE.Group;
  position: THREE.Vector3;
  radius: number;
  animPhase: number;
}

export interface ElementalAllyActor {
  id: string;
  kind: ElementalAllyKind;
  name: string;
  mesh: THREE.Group;
  position: THREE.Vector3;
  remainingSec: number;
  totalDurationSec: number;
  attackDamage: number;
  attackInterval: number;
  attackCooldown: number;
  projectileSpeed: number;
  animPhase: number;
}

export class ArcaneWorldEngine {
  private container: HTMLElement;
  private callbacks: WorldCallbacks;
  public readonly isSoftwareGl: boolean;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private worldContentGroup!: THREE.Group;
  private frameId = 0;
  private disposed = false;

  // Game & Map state
  private mode: 'title' | 'playing' | 'paused' | 'gameover' = 'title';
  public mapMode: GameMapMode = 'labyrinth';
  public labyrinthMultiplayerMode: LabyrinthMultiplayerMode = 'shared';
  public labyrinthStage: 1 | 2 | 3 | 4 | 5 = 1;
  public difficultyTier: DifficultyTier = 1;
  private savedCharacterPet: {
    species: TameableSpeciesId;
    level: number;
    trainingStep: number;
    petXp: number;
  } | null = null;
  private titlePanTime = 0;
  private hitstopTimer = 0;
  private cameraTrauma = 0;
  private hudSyncAccum = 0;
  private netSyncAccum = 0;
  private enemySyncAccum = 0;

  // Player state
  public playerPos = new THREE.Vector3(0, 0, 18);
  private playerVel = new THREE.Vector3();
  public yaw = 0;
  public pitch = 0;
  private walkDistance = 0;
  public hp = 100;
  public maxHp = 100;
  public mp = 100;
  public maxMp = 100;
  private playerBaseLevel = 1;
  public score = 0;
  public bestScore = 0;
  public wave = 1;
  public enemiesDefeated = 0;
  private waveSpawnTimer = 0;

  // Labyrinth Goal & Walls
  private labyrinthStartX = -40;
  private labyrinthStartZ = 92;
  private labyrinthHalfWidth = 56;
  private labyrinthHalfLength = 108;
  private labyrinthGoalPos = new THREE.Vector3(0, 0, -96);
  private labyrinthWalls: WallBox[] = [];
  private finishPortalGroup: THREE.Group | null = null;

  // Per-Spell Cooldowns
  public spellCooldowns: Record<SpellId, number> = {
    incendio: 0,
    wingardium: 0,
    expelliarmus: 0,
    stupefy: 0,
    vera_verto: 0,
    engorgio: 0,
    glacius: 0,
    arcane_sword: 0,
    teleport: 0,
    campfire_teleport: 0,
    cooldown_reset: 0,
  };
  private campfireTeleportChannel: {
    remainingSec: number;
    totalSec: number;
    qualityPercent: number;
    cdToApply: number;
  } | null = null;

  // First-person rig (Hands + Wand/Staff + Summoned Arcane Sword)
  private fpRig!: THREE.Group;
  private leftHandGroup!: THREE.Group;
  private leftOpenHandMesh!: THREE.Group;
  private leftGripHandMesh!: THREE.Group;
  private rightHandGroup!: THREE.Group;
  private wandMountGroup!: THREE.Group;
  private arcaneSwordGroup!: THREE.Group;
  private leftArcaneSwordGroup!: THREE.Group;
  private wandTipLight!: THREE.PointLight;
  private castRecoil = 0;
  private gestureAimOffset = new THREE.Vector2(0, 0);
  private equippedStaffId: EquipmentId = 'wand_ollivander';
  private equippedArtifacts: Partial<Record<ArtifactSlot, ArtifactId>> = {};
  public testInvulnerable = false;
  public simplifiedGraphics = false;
  public graphicsQuality: GraphicsQuality = 'high';
  public tookDamageThisStage = false;
  private keyLightRef: THREE.DirectionalLight | null = null;

  public activeArcaneSword: {
    remainingSec: number;
    totalDurationSec: number;
    totalSec: number;
    damage: number;
    slashDamage: number;
    level: number;
    swingCooldown: number;
    swingCooldownSec: number;
    ignites: boolean;
    ignitesOnHit: boolean;
    stuns: boolean;
    stunsOnHit: boolean;
    stunsOnHitSec: number;
    dualWield: boolean;
    swingAnimTimer: number;
    swingDir: -1 | 1;
    swingHand: 'left' | 'right';
    warningSoundPlayed?: boolean;
  } | null = null;

  // Input tracking
  private keysHeld = new Set<string>();
  private keysJustPressed = new Set<string>();

  // World entities
  private props: PhysicsProp[] = [];
  private heldProp: PhysicsProp | null = null;
  private animals: TameableAnimalActor[] = [];
  private activeTamedPet: TameableAnimalActor | null = null;
  private enemies: EnemyActor[] = [];
  private projectiles: SpellProjectile[] = [];
  private harvestNodes: HarvestNode[] = [];
  private lootDrops: LootDrop[] = [];
  public floorTraps: FloorTrapActor[] = [];
  public laserTraps: LaserBeamTrapActor[] = [];
  public spikeTrapZones: SpikeTrapZoneActor[] = [];
  public chests: TreasureChestActor[] = [];
  public runeGates: RuneGateActor[] = [];
  public runeButtons: RuneButtonActor[] = [];
  public campfires: CampfireActor[] = [];
  public builtWalls: BuiltWallActor[] = [];
  public waterLakes: WaterLakeActor[] = [];
  public snowPatches: SnowPatchActor[] = [];
  public activeElementalAlly: ElementalAllyActor | null = null;
  public activeFoodBuff: ActiveFoodBuffState | null = null;
  public activeBatFoodBuff: ActiveFoodBuffState | null = null;
  private iceRainZones: IceRainZoneActor[] = [];
  private frostWindZones: FrostWindZoneActor[] = [];
  private mudPuddles: MudPuddleActor[] = [];
  private firePools: FirePoolActor[] = [];
  private earthquakeLines: EarthquakeLineActor[] = [];
  private playerCombatEngageTimer = 0;
  private playerBurnTimer = 0;
  private playerBurnTickAccum = 0;
  private playerStunTimer = 0;
  private playerRegenTimer = 0;
  private playerSpeedBuffTimer = 0;
  private playerSlowTimer = 0;
  private playerMudBallSlowTimer = 0;
  private playerFearTimer = 0;
  private activeWingardiumLevel = 1;
  private remoteMeshes = new Map<
    string,
    {
      group: THREE.Group;
      shield: THREE.Mesh;
      hpBarCanvas: HTMLCanvasElement;
      hpBarTexture: THREE.CanvasTexture;
      data: RemotePlayerState;
    }
  >();

  // Pooled particle ring buffer (InstancedMesh)
  private readonly maxParticles = 160;
  private particleMesh!: THREE.InstancedMesh;
  private particleCursor = 0;
  private particlePos = new Float32Array(160 * 3);
  private particleVel = new Float32Array(160 * 3);
  private particleLife = new Float32Array(160);
  private particleMaxLife = new Float32Array(160);
  private particleScale = new Float32Array(160);

  private lastCastBanner: HudSnapshot['lastCastBanner'] = null;
  private clock = new THREE.Clock();

  constructor(container: HTMLElement, callbacks: WorldCallbacks, initialMapMode: GameMapMode = 'labyrinth') {
    this.container = container;
    this.callbacks = callbacks;
    this.mapMode = initialMapMode;

    this.isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.initScene();
    this.buildFirstPersonHandsAndWand();
    this.initParticlePool();
    this.loadMapMode(this.mapMode);
    this.bindEvents();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.clock.start();
    this.tick();
  }

  private initScene() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const skyColor = new THREE.Color(0x0d1326);
    this.scene.background = skyColor;
    this.scene.fog = new THREE.FogExp2(0x0d1326, 0.011);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    this.camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 260);
    this.camera.position.set(0, 1.72, 18);
    this.scene.add(this.camera);

    this.worldContentGroup = new THREE.Group();
    this.scene.add(this.worldContentGroup);

    const hemiLight = new THREE.HemisphereLight(0x6c92d6, 0x261e18, 0.9);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffe2b0, 1.65);
    keyLight.position.set(30, 52, 24);
    if (!this.isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      const d = 60;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 150;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.keyLightRef = keyLight;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
    rimLight.position.set(-28, 22, -30);
    this.scene.add(rimLight);
  }

  public setSimplifiedGraphics(enabled: boolean) {
    this.setGraphicsQuality(enabled ? 'medium' : 'high');
  }

  public setGraphicsQuality(quality: GraphicsQuality) {
    this.graphicsQuality = quality;
    this.simplifiedGraphics = quality !== 'high';
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    if (quality === 'high') {
      this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(dpr, 2));
      this.renderer.domElement.style.imageRendering = 'auto';
      this.renderer.shadowMap.enabled = !this.isSoftwareGl;
      if (this.keyLightRef) {
        this.keyLightRef.castShadow = !this.isSoftwareGl;
      }
      this.camera.far = 160;
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.density = 0.015;
      }
    } else if (quality === 'medium') {
      this.renderer.setPixelRatio(Math.min(dpr, 0.85));
      this.renderer.domElement.style.imageRendering = 'auto';
      this.renderer.shadowMap.enabled = false;
      if (this.keyLightRef) {
        this.keyLightRef.castShadow = false;
      }
      this.camera.far = 78;
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.density = 0.022;
      }
    } else {
      // 'ultralow' — maximum FPS mode: 0.5x internal resolution, pixelated upscale, zero shadows, aggressive frustum/fog culling
      this.renderer.setPixelRatio(0.5);
      this.renderer.domElement.style.imageRendering = 'pixelated';
      this.renderer.shadowMap.enabled = false;
      if (this.keyLightRef) {
        this.keyLightRef.castShadow = false;
      }
      this.camera.far = 44;
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.density = 0.036;
      }
    }
    this.camera.updateProjectionMatrix();
    this.renderer.shadowMap.needsUpdate = true;
  }

  private createCobblestoneTextures(repeatCount = 45): {
    map: THREE.CanvasTexture;
    bumpMap: THREE.CanvasTexture;
  } {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1b2130';
    ctx.fillRect(0, 0, 256, 256);

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 256;
    bumpCanvas.height = 256;
    const bCtx = bumpCanvas.getContext('2d')!;
    bCtx.fillStyle = '#222222';
    bCtx.fillRect(0, 0, 256, 256);

    const rows = 8;
    const cols = 8;
    const w = 256 / cols;
    const h = 256 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const offsetX = (r % 2) * (w * 0.5);
        const x = (c * w + offsetX) % 256;
        const y = r * h;
        const shade = 36 + ((r * 7 + c * 13) % 18);
        ctx.fillStyle = `rgb(${shade}, ${shade + 5}, ${shade + 14})`;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 5);
        ctx.fill();

        bCtx.fillStyle = '#c8c8c8';
        bCtx.beginPath();
        bCtx.roundRect(x + 2, y + 2, w - 4, h - 4, 5);
        bCtx.fill();
      }
    }

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(repeatCount, repeatCount);
    map.anisotropy = maxAniso;

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(repeatCount, repeatCount);
    bumpMap.anisotropy = maxAniso;

    return { map, bumpMap };
  }

  /**
   * Switches between Mode 1 ('arena' — PvP & Endless Polygon) and Mode 2 ('labyrinth' — 10x Larger Multi-Stage Maze).
   * When preserveChosenPet is true (entering Stage 1 -> Stage 2 -> Stage 3), the player's chosen pet is carried over
   * with all its stats, and wild pet sanctuaries are not re-spawned.
   */
  public setDifficultyTier(tier: DifficultyTier) {
    this.difficultyTier = tier === 2 ? 2 : 1;
    this.pushHudSnapshot();
  }

  public getDifficultyTier(): DifficultyTier {
    return this.difficultyTier;
  }

  public restoreCharacterPet(
    species: TameableSpeciesId | 'none',
    level: number,
    trainingStep: number,
    petXp: number
  ) {
    if (species === 'none') {
      this.savedCharacterPet = null;
      return;
    }
    this.savedCharacterPet = {
      species,
      level: Math.max(1, Math.min(10, Math.round(level))),
      trainingStep: Math.max(0, Math.min(5, Math.round(trainingStep))),
      petXp: Math.max(0, Math.round(petXp)),
    };
    if (this.activeTamedPet && this.activeTamedPet.species === species) {
      this.activeTamedPet.level = this.savedCharacterPet.level;
      this.activeTamedPet.trainingStep = this.savedCharacterPet.trainingStep;
      this.activeTamedPet.petXp = this.savedCharacterPet.petXp;
      this.activeTamedPet.baseScale = Number(
        (1.0 + (this.activeTamedPet.level - 1) * 0.14).toFixed(2)
      );
      this.activeTamedPet.targetScale = this.activeTamedPet.baseScale;
      this.activeTamedPet.scaleMultiplier = this.activeTamedPet.baseScale;
      this.activeTamedPet.mesh.scale.setScalar(this.activeTamedPet.baseScale);
      const def = PET_CATALOG[this.activeTamedPet.species];
      this.activeTamedPet.baseAttack =
        def.baseAttack +
        (this.activeTamedPet.level - 1) * 2 +
        this.activeTamedPet.trainingStep;
      this.activeTamedPet.attackPower = this.activeTamedPet.baseAttack;
      this.updatePetBadge(this.activeTamedPet);
      this.pushHudSnapshot();
    }
  }

  public loadMapMode(targetMode: GameMapMode, stage: 1 | 2 | 3 | 4 | 5 = 1, preserveChosenPet = false) {
    this.mapMode = targetMode;
    this.labyrinthStage = stage;

    const savedPetState =
      preserveChosenPet && this.activeTamedPet
        ? {
            species: this.activeTamedPet.species,
            level: this.activeTamedPet.level,
            trainingStep: this.activeTamedPet.trainingStep,
            petXp: this.activeTamedPet.petXp,
          }
        : this.savedCharacterPet
        ? { ...this.savedCharacterPet }
        : null;

    // Clear previous world entities
    while (this.worldContentGroup.children.length > 0) {
      this.worldContentGroup.remove(this.worldContentGroup.children[0]);
    }
    this.props = [];
    this.heldProp = null;
    this.animals = [];
    this.activeTamedPet = null;
    this.enemies = [];
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
    }
    this.projectiles = [];
    this.iceRainZones = [];
    this.frostWindZones = [];
    this.mudPuddles = [];
    this.firePools = [];
    this.earthquakeLines = [];
    this.harvestNodes = [];
    this.lootDrops = [];
    this.floorTraps = [];
    this.laserTraps = [];
    this.spikeTrapZones = [];
    this.chests = [];
    this.runeGates = [];
    this.runeButtons = [];
    this.campfires = [];
    this.builtWalls = [];
    this.waterLakes = [];
    this.snowPatches = [];
    this.activeElementalAlly = null;
    this.playerCombatEngageTimer = 0;
    this.playerBurnTimer = 0;
    this.playerBurnTickAccum = 0;
    this.playerStunTimer = 0;
    this.playerRegenTimer = 0;
    this.playerSpeedBuffTimer = 0;
    this.playerSlowTimer = 0;
    this.playerMudBallSlowTimer = 0;
    this.playerFearTimer = 0;
    this.tookDamageThisStage = false;
    this.labyrinthWalls = [];
    this.finishPortalGroup = null;
    if (this.activeArcaneSword) {
      this.dismissArcaneSword();
    }

    if (!preserveChosenPet) {
      this.activeFoodBuff = null;
      this.activeBatFoodBuff = null;
      this.recomputeMaxVitals();
      for (const k of Object.keys(this.spellCooldowns) as SpellId[]) {
        this.spellCooldowns[k] = 0;
      }
      this.hp = this.maxHp;
      this.mp = this.maxMp;
    } else {
      this.recomputeMaxVitals();
      // Entering next Stage Portal restores a bit of HP/MP for the harder floor
      this.hp = Math.min(this.maxHp, this.hp + 35);
      this.mp = Math.min(this.maxMp, this.mp + 35);
    }

    this.yaw = 0;
    this.pitch = 0;

    if (targetMode === 'arena') {
      this.playerPos.set(0, 0, 18);
      this.buildArenaEnvironment();
      this.spawnArenaEntities();
    } else {
      this.buildLabyrinthEnvironment();
      // Spawn at the safe beginning of the first Labyrinth corridor facing East (+X) along the hall
      this.playerPos.set(this.labyrinthStartX, 0, this.labyrinthStartZ);
      this.yaw = -Math.PI / 2;
      this.spawnLabyrinthEntities(savedPetState);
    }
    this.pushHudSnapshot();
  }

  private buildArenaEnvironment() {
    const { map, bumpMap } = this.createCobblestoneTextures(24);

    const groundGeo = new THREE.CircleGeometry(95, 48);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map,
      bumpMap,
      bumpScale: 0.08,
      roughness: 0.82,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = !this.isSoftwareGl;
    this.worldContentGroup.add(ground);

    const ringGroup = new THREE.Group();
    ringGroup.position.y = 0.02;
    const outerRingGeo = new THREE.RingGeometry(11.2, 12.0, 48);
    outerRingGeo.rotateX(-Math.PI / 2);
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.75,
      roughness: 0.3,
      metalness: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    ringGroup.add(new THREE.Mesh(outerRingGeo, runeMat));
    this.worldContentGroup.add(ringGroup);

    // Natural outdoor craggy rock boundary cliffs
    const rockCount = 36;
    const rockGeo = new THREE.DodecahedronGeometry(3.2, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x3b4252, roughness: 0.9, metalness: 0.08 });
    const rockInstanced = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    for (let i = 0; i < rockCount; i++) {
      const a = (i / rockCount) * Math.PI * 2;
      const r = 42 + (i % 3) * 4;
      const s = 0.85 + (i % 5) * 0.28;
      _dummyObj.position.set(Math.cos(a) * r, s * 1.4, Math.sin(a) * r);
      _dummyObj.rotation.set(i * 0.4, a, i * 0.2);
      _dummyObj.scale.set(s * 1.3, s * (0.9 + (i % 4) * 0.35), s);
      _dummyObj.updateMatrix();
      rockInstanced.setMatrixAt(i, _dummyObj.matrix);
    }
    rockInstanced.instanceMatrix.needsUpdate = true;
    rockInstanced.computeBoundingSphere();
    this.worldContentGroup.add(rockInstanced);

    // Shallow water lake in Arena mode so Water -> Snow -> Water Helper / Snowman works in Arena too!
    this.spawnWaterLake({
      id: 'lake_arena',
      x: -14,
      z: 2,
      radiusX: 8.2,
      radiusZ: 5.4,
      label: 'Озеро Дуэльной Арены',
    });
  }

  private createSanctuaryArchMesh(): THREE.Group {
    // Pure glowing golden-cyan arcane portal ring (grey stone towers removed as requested!)
    const archGroup = new THREE.Group();
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0xb45309,
      emissiveIntensity: 0.6,
      roughness: 0.25,
      metalness: 0.85,
    });
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.4,
      roughness: 0.15,
      metalness: 0.2,
    });

    const portalRing = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.28, 12, 32), trimMat);
    portalRing.position.set(0, 4.4, 0);
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.14, 10, 28), crystalMat);
    innerRing.position.set(0, 4.4, 0);
    const spireCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), crystalMat);
    spireCrystal.position.set(0, 9.5, 0);

    archGroup.add(portalRing, innerRing, spireCrystal);
    return archGroup;
  }

  /**
  /**
   * Builds the Ancient Arcane Hedge & Stone Labyrinth for Stages 1, 2, and 3 using verified traversable layouts.
   */
  private buildLabyrinthEnvironment() {
    const layout = getLabyrinthStageLayout(this.labyrinthStage);
    this.labyrinthStartX = layout.startX;
    this.labyrinthStartZ = layout.startZ;
    this.labyrinthHalfWidth = layout.halfWidth;
    this.labyrinthHalfLength = layout.halfLength;
    this.labyrinthGoalPos.set(0, 0, layout.goalZ);

    const { map, bumpMap } = this.createCobblestoneTextures(
      this.labyrinthStage === 5
        ? 112
        : this.labyrinthStage === 4
        ? 96
        : this.labyrinthStage === 3
        ? 80
        : 64
    );

    const groundW = layout.halfWidth * 2 + 44;
    const groundD = layout.halfLength * 2 + 44;
    const groundGeo = new THREE.PlaneGeometry(groundW, groundD);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map,
      bumpMap,
      bumpScale: 0.08,
      roughness: 0.84,
      metalness: 0.08,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = !this.isSoftwareGl;
    this.worldContentGroup.add(ground);

    const stoneWallMat = new THREE.MeshStandardMaterial({
      color: 0x293242,
      roughness: 0.85,
      metalness: 0.15,
    });
    const hedgeMat = new THREE.MeshStandardMaterial({
      color:
        this.labyrinthStage === 5
          ? 0x311042
          : this.labyrinthStage === 4
          ? 0x3b0764
          : this.labyrinthStage === 3
          ? 0x1e1b4b
          : 0x134e3a,
      roughness: 0.72,
      metalness: 0.08,
    });
    const capGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.32,
      metalness: 0.82,
    });

    for (const ws of layout.wallSpecs) {
      const wallGroup = new THREE.Group();
      wallGroup.position.set(ws.x, 0, ws.z);

      const stoneBase = new THREE.Mesh(new THREE.BoxGeometry(ws.w, 1.8, ws.d), stoneWallMat);
      stoneBase.position.y = 0.9;
      const hedgeBody = new THREE.Mesh(
        new THREE.BoxGeometry(ws.w * 0.96, 3.4, ws.d * 0.96),
        hedgeMat
      );
      hedgeBody.position.y = 3.5;
      const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(ws.w, 0.25, ws.d), capGoldMat);
      goldTrim.position.y = 1.85;

      wallGroup.add(stoneBase, hedgeBody, goldTrim);
      this.worldContentGroup.add(wallGroup);
    }

    this.labyrinthWalls = layout.wallBoxes;

    // Glowing Waypoint Braziers & Guiding Floor Runes along the winding path from Start to Finish
    const waypoints =
      this.labyrinthStage === 3
        ? [
            new THREE.Vector3(0, 0, 132),
            new THREE.Vector3(44, 0, 118),
            new THREE.Vector3(44, 0, 90),
            new THREE.Vector3(-44, 0, 88),
            new THREE.Vector3(-44, 0, 62),
            new THREE.Vector3(44, 0, 60),
            new THREE.Vector3(44, 0, 34),
            new THREE.Vector3(-44, 0, 32),
            new THREE.Vector3(-44, 0, 6),
            new THREE.Vector3(44, 0, 4),
            new THREE.Vector3(44, 0, -22),
            new THREE.Vector3(-44, 0, -24),
            new THREE.Vector3(-44, 0, -50),
            new THREE.Vector3(44, 0, -52),
            new THREE.Vector3(44, 0, -78),
            new THREE.Vector3(-44, 0, -80),
            new THREE.Vector3(-44, 0, -106),
            new THREE.Vector3(0, 0, -124),
          ]
        : [
            new THREE.Vector3(0, 0, 86),
            new THREE.Vector3(34, 0, 82),
            new THREE.Vector3(36, 0, 48),
            new THREE.Vector3(-34, 0, 46),
            new THREE.Vector3(-36, 0, 8),
            new THREE.Vector3(34, 0, 8),
            new THREE.Vector3(36, 0, -32),
            new THREE.Vector3(-34, 0, -32),
            new THREE.Vector3(-34, 0, -72),
            new THREE.Vector3(0, 0, -82),
          ];

    // Grey waypoint towers/pedestals removed as requested ("давай уберем вообще эти серые башни видимо они ничего не делают")

    // Grand Finish Portal at the Heart of the Labyrinth
    this.finishPortalGroup = this.createSanctuaryArchMesh();
    this.finishPortalGroup.position.copy(this.labyrinthGoalPos);

    const portalVortexGeo = new THREE.CircleGeometry(4.4, 32);
    const portalVortexMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const vortex = new THREE.Mesh(portalVortexGeo, portalVortexMat);
    vortex.position.set(0, 5.5, 0);
    this.finishPortalGroup.add(vortex);
    this.worldContentGroup.add(this.finishPortalGroup);

    // Spawn the Stage-Specific Shallow Water Lakes (Stage 5 has 2 water lakes in two places!):
    const stageLakes = getLabyrinthWaterLakes(this.labyrinthStage);
    for (const lakeSpec of stageLakes) {
      this.spawnWaterLake(lakeSpec);
    }
  }

  private spawnWaterLake(spec: WaterLakeSpec) {
    const group = new THREE.Group();
    group.position.set(spec.x, 0.015, spec.z);

    // Shallow sandy/pebble shoreline rim
    const shoreMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
      metalness: 0.1,
    });
    const shoreGeo = new THREE.CircleGeometry(1.0, 36);
    shoreGeo.rotateX(-Math.PI / 2);
    const shoreDisc = new THREE.Mesh(shoreGeo, shoreMat);
    shoreDisc.scale.set(spec.radiusX + 0.85, 1, spec.radiusZ + 0.85);
    shoreDisc.position.y = 0.005;
    group.add(shoreDisc);

    // Glowing translucent shallow water surface
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0369a1,
      emissiveIntensity: 0.55,
      roughness: 0.12,
      metalness: 0.35,
      transparent: true,
      opacity: 0.82,
    });
    const waterGeo = new THREE.CircleGeometry(1.0, 40);
    waterGeo.rotateX(-Math.PI / 2);
    const waterSurface = new THREE.Mesh(waterGeo, waterMat);
    waterSurface.scale.set(spec.radiusX, 1, spec.radiusZ);
    waterSurface.position.y = 0.022;
    group.add(waterSurface);

    // Animated water ripple rings
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const rGeo1 = new THREE.RingGeometry(0.45, 0.5, 32);
    rGeo1.rotateX(-Math.PI / 2);
    const rippleRing1 = new THREE.Mesh(rGeo1, rippleMat);
    rippleRing1.scale.set(spec.radiusX, 1, spec.radiusZ);
    rippleRing1.position.y = 0.032;

    const rGeo2 = new THREE.RingGeometry(0.75, 0.79, 32);
    rGeo2.rotateX(-Math.PI / 2);
    const rippleRing2 = new THREE.Mesh(rGeo2, rippleMat);
    rippleRing2.scale.set(spec.radiusX, 1, spec.radiusZ);
    rippleRing2.position.y = 0.032;
    group.add(rippleRing1, rippleRing2);

    // Decorative shoreline stones
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.85,
      flatShading: true,
    });
    const rockSteps = 14;
    for (let i = 0; i < rockSteps; i++) {
      const a = (i / rockSteps) * Math.PI * 2;
      const rx = Math.cos(a) * (spec.radiusX + 0.35);
      const rz = Math.sin(a) * (spec.radiusZ + 0.35);
      const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38 + (i % 3) * 0.14, 0), stoneMat);
      pebble.position.set(rx, 0.14, rz);
      pebble.scale.set(1.2, 0.55, 1.0);
      group.add(pebble);
    }

    this.worldContentGroup.add(group);
    this.waterLakes.push({
      id: spec.id,
      spec,
      mesh: group,
      waterSurface,
      rippleRing1,
      rippleRing2,
      position: new THREE.Vector3(spec.x, 0, spec.z),
      animPhase: 0,
    });
  }

  /**
   * Freezes part of a shallow water lake into a 3D Snow Patch (`Снег`) when hit by Ice Magic (`Лед` [2]).
   */
  public freezeWaterIntoSnowPatch(targetPoint: THREE.Vector3): SnowPatchActor {
    // If a snow patch already exists very close to targetPoint, refresh/return it
    for (const existing of this.snowPatches) {
      if (Math.hypot(existing.position.x - targetPoint.x, existing.position.z - targetPoint.z) < 2.6) {
        this.spawnParticles(_v1.copy(existing.position).setY(0.4), 0xe0f2fe, 24, 5.5);
        return existing;
      }
    }

    const pos = new THREE.Vector3(targetPoint.x, 0.04, targetPoint.z);
    const radius = 3.5;
    const group = new THREE.Group();
    group.position.copy(pos);

    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0xbae6fd,
      emissiveIntensity: 0.32,
      roughness: 0.65,
      metalness: 0.05,
      flatShading: true,
    });
    const iceRimMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.35,
      flatShading: true,
    });

    const baseDiscGeo = new THREE.CylinderGeometry(radius, radius + 0.35, 0.14, 20);
    const baseDisc = new THREE.Mesh(baseDiscGeo, snowMat);
    baseDisc.position.y = 0.07;
    group.add(baseDisc);

    // Layered snow mounds on the frozen patch
    const moundOffsets = [
      { x: -1.1, z: -0.6, r: 1.15, h: 0.35 },
      { x: 1.0, z: 0.5, r: 1.05, h: 0.32 },
      { x: 0.1, z: -0.9, r: 0.95, h: 0.28 },
      { x: -0.4, z: 0.9, r: 1.1, h: 0.3 },
    ];
    for (const m of moundOffsets) {
      const mound = new THREE.Mesh(new THREE.SphereGeometry(m.r, 12, 8), snowMat);
      mound.scale.set(1, m.h / m.r, 1);
      mound.position.set(m.x, 0.12, m.z);
      group.add(mound);
    }

    // Frost crystals around the edge
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const shard = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 5), iceRimMat);
      shard.position.set(Math.cos(a) * (radius - 0.35), 0.26, Math.sin(a) * (radius - 0.35));
      shard.rotation.z = -Math.cos(a) * 0.25;
      shard.rotation.x = Math.sin(a) * 0.25;
      group.add(shard);
    }

    this.worldContentGroup.add(group);
    const patch: SnowPatchActor = {
      id: `snow_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      mesh: group,
      position: new THREE.Vector3(pos.x, 0, pos.z),
      radius,
      animPhase: 0,
    };
    this.snowPatches.push(patch);
    this.spawnParticles(_v1.copy(pos).setY(0.5), 0xe0f2fe, 32, 6.5);
    audioEngine.playPickupChime();
    return patch;
  }

  /**
   * Determines whether the player's crosshair is currently aimed at a Snow patch (`'snow'`),
   * a Shallow Water lake (`'water'`), or neither (`'none'`).
   */
  public getAimedSurfaceInfo(): {
    target: AimSurfaceTarget;
    point: THREE.Vector3 | null;
    lake: WaterLakeActor | null;
    snowPatch: SnowPatchActor | null;
  } {
    if (!this.camera) {
      return { target: 'none', point: null, lake: null, snowPatch: null };
    }

    // Use un-bobbed eye position and un-shaken yaw/pitch so walking never causes aimSurfaceTarget to flicker!
    const eyeX = this.playerPos.x;
    const eyeY = 1.72;
    const eyeZ = this.playerPos.z;
    const cosPitch = Math.cos(this.pitch);
    const dir = new THREE.Vector3(
      -Math.sin(this.yaw) * cosPitch,
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * cosPitch
    ).normalize();

    const flatFwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const candidatePoints: THREE.Vector3[] = [];

    // 1. Exact camera ray intersection with ground plane y = 0.03
    if (dir.y < -0.015) {
      const t = (0.03 - eyeY) / dir.y;
      if (t > 0.5 && t <= 34) {
        candidatePoints.push(
          new THREE.Vector3(eyeX + dir.x * t, 0, eyeZ + dir.z * t)
        );
      }
    }

    // 2. Also sample forward ground look points (5m, 8.5m, 12.5m ahead) when looking horizontally toward a lake/snow patch
    if (dir.y >= -0.35 && dir.y <= 0.32) {
      for (const dist of [4.8, 8.2, 12.0, 16.0]) {
        candidatePoints.push(
          new THREE.Vector3(
            this.playerPos.x + flatFwd.x * dist,
            0,
            this.playerPos.z + flatFwd.z * dist
          )
        );
      }
    }

    // First check Snow patches (since Snow patches sit on top of Water lakes!)
    for (const pt of candidatePoints) {
      for (const patch of this.snowPatches) {
        const d = Math.hypot(pt.x - patch.position.x, pt.z - patch.position.z);
        if (d <= patch.radius + 1.1) {
          if (
            this.mapMode === 'labyrinth' &&
            segmentHitsWall(
              this.playerPos.x,
              this.playerPos.z,
              patch.position.x,
              patch.position.z,
              this.labyrinthWalls,
              0.15
            )
          ) {
            continue;
          }
          return {
            target: 'snow',
            point: patch.position.clone(),
            lake: null,
            snowPatch: patch,
          };
        }
      }
    }

    // Next check Water lakes
    for (const pt of candidatePoints) {
      for (const lake of this.waterLakes) {
        const nx = (pt.x - lake.position.x) / (lake.spec.radiusX + 1.0);
        const nz = (pt.z - lake.position.z) / (lake.spec.radiusZ + 1.0);
        if (nx * nx + nz * nz <= 1.0) {
          if (
            this.mapMode === 'labyrinth' &&
            segmentHitsWall(
              this.playerPos.x,
              this.playerPos.z,
              pt.x,
              pt.z,
              this.labyrinthWalls,
              0.15
            )
          ) {
            continue;
          }
          // Clamp point inside lake ellipse
          const distScale = Math.hypot(
            (pt.x - lake.position.x) / lake.spec.radiusX,
            (pt.z - lake.position.z) / lake.spec.radiusZ
          );
          const clampedPt = pt.clone();
          if (distScale > 0.78) {
            clampedPt.x =
              lake.position.x + ((pt.x - lake.position.x) / distScale) * 0.78;
            clampedPt.z =
              lake.position.z + ((pt.z - lake.position.z) / distScale) * 0.78;
          }
          return {
            target: 'water',
            point: clampedPt,
            lake,
            snowPatch: null,
          };
        }
      }
    }

    return { target: 'none', point: null, lake: null, snowPatch: null };
  }

  /**
   * Builds 3D mesh for either:
   * - `'water_spirit'` (`Водяной Помощник` — 2 stacked water spheres, larger bottom, smaller top)
   * - `'snowman'` (`Боевой Снеговик` — 3 stacked white snow spheres, carrot nose, coal eyes, twig arms)
   */
  private createElementalAllyMesh(kind: ElementalAllyKind): THREE.Group {
    const group = new THREE.Group();
    this.addContactShadow(group, 0.85);

    if (kind === 'water_spirit') {
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        emissive: 0x0284c7,
        emissiveIntensity: 0.75,
        roughness: 0.12,
        metalness: 0.25,
        transparent: true,
        opacity: 0.88,
      });
      const coreGlowMat = new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        emissive: 0x38bdf8,
        emissiveIntensity: 1.4,
        roughness: 0.1,
      });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });

      // Sphere 1 (Larger bottom water sphere)
      const bottomSphere = new THREE.Mesh(new THREE.SphereGeometry(0.56, 18, 14), waterMat);
      bottomSphere.position.set(0, 0.58, 0);
      // Sphere 2 (Smaller top water sphere)
      const topSphere = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 12), waterMat);
      topSphere.position.set(0, 1.32, 0);

      // Glowing eyes on top sphere
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), eyeMat);
      eyeL.position.set(-0.12, 1.38, -0.32);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.12;

      // Orbiting water droplets
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), coreGlowMat);
        drop.position.set(Math.cos(a) * 0.72, 0.85 + i * 0.18, Math.sin(a) * 0.72);
        group.add(drop);
      }

      group.add(bottomSphere, topSphere, eyeL, eyeR);
    } else {
      // 'snowman' — Three stacked snow spheres (3 кружка)
      const snowMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        emissive: 0xe0f2fe,
        emissiveIntensity: 0.25,
        roughness: 0.7,
        metalness: 0.05,
      });
      const coalMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
      const carrotMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 0.4,
        roughness: 0.5,
      });
      const twigMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.85 });

      const sphere1 = new THREE.Mesh(new THREE.SphereGeometry(0.56, 16, 14), snowMat);
      sphere1.position.set(0, 0.54, 0);
      const sphere2 = new THREE.Mesh(new THREE.SphereGeometry(0.41, 16, 12), snowMat);
      sphere2.position.set(0, 1.28, 0);
      const sphere3 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), snowMat);
      sphere3.position.set(0, 1.84, 0);

      // Carrot nose & coal eyes + coal buttons
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.28, 8), carrotMat);
      nose.rotation.x = -Math.PI / 2;
      nose.position.set(0, 1.84, -0.36);

      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), coalMat);
      eyeL.position.set(-0.09, 1.9, -0.25);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.09;

      const btn1 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), coalMat);
      btn1.position.set(0, 1.4, -0.39);
      const btn2 = btn1.clone();
      btn2.position.set(0, 1.2, -0.4);

      const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.65, 6), twigMat);
      armL.position.set(-0.58, 1.35, 0);
      armL.rotation.z = 0.95;
      const armR = armL.clone();
      armR.position.x = 0.58;
      armR.rotation.z = -0.95;

      group.add(sphere1, sphere2, sphere3, nose, eyeL, eyeR, btn1, btn2, armL, armR);
    }

    return group;
  }

  /**
   * Summons or replaces the player's single active Elemental Ally (`Водяной Помощник` or `Боевой Снеговик`).
   * Duration is 60 to 180 seconds (1 to 3 minutes) based on drawing accuracy (`castQualityPercent`).
   */
  public summonElementalAlly(
    kind: ElementalAllyKind,
    castQualityPercent: number,
    spellLevel = 1,
    spawnOrigin?: THREE.Vector3
  ): ElementalAllyActor {
    if (this.activeElementalAlly) {
      this.worldContentGroup.remove(this.activeElementalAlly.mesh);
      this.activeElementalAlly = null;
    }

    const stats = calculateElementalAllyStats(kind, castQualityPercent, spellLevel);
    const mesh = this.createElementalAllyMesh(kind);

    _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
    // Position Elemental Ally in front and to the LEFT of the player (mirroring the Cat on the right!)
    const defaultPos = this.playerPos
      .clone()
      .addScaledVector(_forward, 3.4)
      .addScaledVector(_right, -2.25);
    defaultPos.y = 0;

    const pos = spawnOrigin ? new THREE.Vector3(spawnOrigin.x, 0, spawnOrigin.z) : defaultPos;
    mesh.position.copy(pos);
    this.worldContentGroup.add(mesh);

    const actor: ElementalAllyActor = {
      id: `elem_${kind}_${Date.now()}`,
      kind,
      name: stats.name,
      mesh,
      position: pos,
      remainingSec: stats.durationSec,
      totalDurationSec: stats.durationSec,
      attackDamage: stats.attackDamage,
      attackInterval: stats.attackInterval,
      attackCooldown: 0.5,
      projectileSpeed: stats.projectileSpeed,
      animPhase: 0,
    };
    this.activeElementalAlly = actor;
    this.spawnParticles(
      _v1.copy(pos).setY(1.0),
      kind === 'water_spirit' ? 0x0ea5e9 : 0xe0f2fe,
      30,
      6.5
    );
    audioEngine.playVictoryFanfare();
    this.pushHudSnapshot();
    return actor;
  }

  /**
   * Builds detailed low-poly faceted First-Person Mage Hands & Bracers per Reference Image 1:
   * - Faceted indigo-violet wizard sleeves with golden embroidered cuff trim
   * - Steel-grey wrist armor plates & fingerless dark arcane gloves
   * - 5 articulated low-poly fingers with silver rings and glowing cyan crystals
   */
  private buildFirstPersonHandsAndWand() {
    this.fpRig = new THREE.Group();
    this.camera.add(this.fpRig);

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xe5b899,
      roughness: 0.62,
      metalness: 0.05,
      flatShading: true,
    });
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x312e81,
      roughness: 0.72,
      metalness: 0.15,
      flatShading: true,
    });
    const sleeveFoldMat = new THREE.MeshStandardMaterial({
      color: 0x3730a3,
      roughness: 0.68,
      metalness: 0.15,
      flatShading: true,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.88,
      flatShading: true,
    });
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.75,
      metalness: 0.2,
      flatShading: true,
    });
    const steelGuardMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.28,
      metalness: 0.85,
      flatShading: true,
    });
    const ringGemMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.65,
      roughness: 0.1,
      metalness: 0.2,
      flatShading: true,
    });

    const buildArticulatedHand = (isLeft: boolean): THREE.Group => {
      const handGroup = new THREE.Group();
      const side = isLeft ? 1 : -1;

      // 1. Flared faceted wizard robe sleeve + gold embroidered cuff border
      const sleeveOuter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.072, 0.105, 0.34, 8, 2),
        sleeveMat
      );
      sleeveOuter.rotation.x = Math.PI / 2.25;
      sleeveOuter.position.set(isLeft ? -0.035 : 0.035, -0.105, 0.21);
      handGroup.add(sleeveOuter);

      const sleeveCuffBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.074, 0.078, 0.048, 8),
        sleeveFoldMat
      );
      sleeveCuffBand.rotation.x = Math.PI / 2.25;
      sleeveCuffBand.position.set(isLeft ? -0.012 : 0.012, -0.032, 0.062);
      handGroup.add(sleeveCuffBand);

      const goldCuffRing1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.075, 0.006, 6, 12),
        goldTrimMat
      );
      goldCuffRing1.position.set(isLeft ? -0.01 : 0.01, -0.022, 0.044);
      const goldCuffRing2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.078, 0.005, 6, 12),
        goldTrimMat
      );
      goldCuffRing2.position.set(isLeft ? -0.015 : 0.015, -0.04, 0.08);
      handGroup.add(goldCuffRing1, goldCuffRing2);

      // Gold embroidery scroll accents around the cuff
      for (let e = 0; e < 6; e++) {
        const ang = (e / 6) * Math.PI * 2;
        const emb = new THREE.Mesh(new THREE.OctahedronGeometry(0.011, 0), goldTrimMat);
        emb.position.set(
          (isLeft ? -0.012 : 0.012) + Math.cos(ang) * 0.074,
          -0.03 + Math.sin(ang) * 0.074 * 0.4,
          0.062 - Math.sin(ang) * 0.025
        );
        emb.scale.set(1.4, 0.6, 0.9);
        handGroup.add(emb);
      }

      // 2. Metallic steel wrist armor guard + diamond crest
      const wristPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.082, 0.022, 0.075),
        steelGuardMat
      );
      wristPlate.position.set(0, 0.018, 0.015);
      wristPlate.rotation.x = 0.15;
      const wristDiamond = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.018, 0),
        goldTrimMat
      );
      wristDiamond.scale.set(1.0, 0.35, 1.35);
      wristDiamond.position.set(0, 0.031, 0.015);
      handGroup.add(wristPlate, wristDiamond);

      // 3. Dark fingerless arcane glove wrapping the palm
      const glovePalm = new THREE.Mesh(
        new THREE.BoxGeometry(0.092, 0.04, 0.098),
        gloveMat
      );
      glovePalm.position.set(0, -0.002, -0.035);
      handGroup.add(glovePalm);

      // Exposed skin at upper palm knuckle line
      const knuckleBridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.088, 0.034, 0.028),
        skinMat
      );
      knuckleBridge.position.set(0, -0.002, -0.086);
      handGroup.add(knuckleBridge);

      // 4. Thumb (with silver band at knuckle)
      const thumbGroup = new THREE.Group();
      if (isLeft) {
        thumbGroup.position.set(side * 0.052, -0.008, -0.035);
        thumbGroup.rotation.set(0.25, side * -0.45, side * -0.55);
      } else {
        // Right hand is rolled (-Z) so -X is on the upper-left side of the grip; thumb wraps over & around the wand shaft
        thumbGroup.position.set(-0.046, -0.008, -0.044);
        thumbGroup.rotation.set(-0.48, -0.32, -0.45);
      }

      const thumbRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.016, 0.0035, 6, 10),
        steelGuardMat
      );
      thumbRing.rotation.x = Math.PI / 2;
      const thumbSeg1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.013, 0.015, 0.042, 6),
        skinMat
      );
      thumbSeg1.rotation.x = Math.PI / 2;
      thumbSeg1.position.set(0, 0, -0.022);

      const thumbSeg2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.013, 0.036, 6),
        skinMat
      );
      thumbSeg2.rotation.x = Math.PI / 2 + (isLeft ? 0.25 : -0.58);
      thumbSeg2.position.set(0, isLeft ? -0.005 : -0.014, -0.052);
      thumbGroup.add(thumbRing, thumbSeg1, thumbSeg2);
      handGroup.add(thumbGroup);

      // 5. Four Articulated Fingers (Index, Middle, Ring, Pinky) + Glowing Cyan Ring Gems
      const fingerSpecs = [
        { x: side * 0.033, len1: 0.046, len2: 0.038, r: 0.012, hasGem: true },
        { x: side * 0.011, len1: 0.052, len2: 0.042, r: 0.0125, hasGem: false },
        { x: side * -0.011, len1: 0.048, len2: 0.038, r: 0.012, hasGem: isLeft },
        { x: side * -0.032, len1: 0.039, len2: 0.032, r: 0.0105, hasGem: false },
      ];

      fingerSpecs.forEach((f, idx) => {
        const fGroup = new THREE.Group();
        fGroup.position.set(f.x, isLeft ? 0.002 : -0.004, -0.095);
        // Left hand open spellcasting pose (+rotation.x);
        // Right hand palm faces inward/downward (-Y) so fingers curl into the palm (-rotation.x) around the wand shaft!
        const curl1 = isLeft ? 0.22 + idx * 0.08 : -(0.68 + idx * 0.08);
        const curl2 = isLeft ? 0.35 + idx * 0.1 : -(1.12 + idx * 0.06);
        fGroup.rotation.x = curl1;
        fGroup.rotation.y = isLeft ? (1.5 - idx) * 0.06 : (1.5 - idx) * 0.04;

        const seg1 = new THREE.Mesh(
          new THREE.CylinderGeometry(f.r * 0.9, f.r, f.len1, 6),
          skinMat
        );
        seg1.rotation.x = Math.PI / 2;
        seg1.position.set(0, 0, -f.len1 * 0.5);
        fGroup.add(seg1);

        if (f.hasGem) {
          const band = new THREE.Mesh(
            new THREE.TorusGeometry(f.r * 1.05, 0.0032, 6, 10),
            steelGuardMat
          );
          band.position.set(0, 0, -f.len1 * 0.38);
          const gem = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.011, 0),
            ringGemMat
          );
          gem.position.set(0, f.r * 1.25, -f.len1 * 0.38);
          fGroup.add(band, gem);
        }

        const knuckle = new THREE.Group();
        knuckle.position.set(0, 0, -f.len1);
        knuckle.rotation.x = curl2;
        const seg2 = new THREE.Mesh(
          new THREE.CylinderGeometry(f.r * 0.72, f.r * 0.88, f.len2, 6),
          skinMat
        );
        seg2.rotation.x = Math.PI / 2;
        seg2.position.set(0, 0, -f.len2 * 0.5);
        knuckle.add(seg2);
        fGroup.add(knuckle);

        handGroup.add(fGroup);
      });

      return handGroup;
    };

    // Left Spellweaving Hand (open pose by default, switches to mirrored clenched grip when dual-wielding Lv6 Arcane Sword)
    this.leftHandGroup = new THREE.Group();
    this.leftOpenHandMesh = buildArticulatedHand(true);
    this.leftHandGroup.add(this.leftOpenHandMesh);
    this.leftHandGroup.position.set(-0.39, -0.19, -0.52);
    this.leftHandGroup.rotation.set(0.42, 0.42, -0.46);
    this.fpRig.add(this.leftHandGroup);

    // Wand/Sword Gripping Hand (supports right hand and mirrored left hand for Lv6 Dual-Wield Arcane Sword):
    // Built in a natural diagonal sword/wand grip matching Reference Image 1 (image_9dcda095.png):
    // - Back of the purple fingerless glove & steel diamond wrist guard on the outer side
    // - Index finger (with glowing cyan gem ring) arching OVER the top of the shaft
    // - Thumb, Middle, Ring, and Pinky fingers wrapping around the shaft
    const buildRightWandGrippingHand = (isLeft = false): THREE.Group => {
      const sx = isLeft ? -1 : 1;
      const handGroup = new THREE.Group();

      // 1. Wide flared wizard robe cuff with golden trim & filigree
      const cuffGroup = new THREE.Group();
      cuffGroup.position.set(sx * 0.022, -0.045, 0.115);
      cuffGroup.rotation.set(-0.22, sx * -0.12, sx * 0.28);

      const sleeveCuff = new THREE.Mesh(
        new THREE.CylinderGeometry(0.068, 0.115, 0.24, 8),
        sleeveMat
      );
      sleeveCuff.rotation.x = Math.PI / 2;
      cuffGroup.add(sleeveCuff);

      const cuffTrimRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.072, 0.008, 6, 12),
        goldTrimMat
      );
      cuffTrimRing.position.set(0, 0, -0.11);
      cuffGroup.add(cuffTrimRing);

      for (let i = 0; i < 5; i++) {
        const ang = (i / 4 - 0.5) * 1.5;
        const emb = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.009, 0),
          goldTrimMat
        );
        emb.position.set(
          Math.cos(ang) * 0.072,
          Math.sin(ang) * 0.072 * 0.5,
          -0.085
        );
        emb.scale.set(1.4, 0.6, 0.9);
        cuffGroup.add(emb);
      }
      handGroup.add(cuffGroup);

      // 2. Metallic steel wrist armor guard + gold diamond crest on outer top of wrist
      const wristGuardGroup = new THREE.Group();
      wristGuardGroup.position.set(sx * 0.028, 0.006, 0.012);
      wristGuardGroup.rotation.set(0.18, sx * -0.15, sx * -0.48);

      const wristPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.082, 0.022, 0.078),
        steelGuardMat
      );
      const wristDiamond = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.018, 0),
        goldTrimMat
      );
      wristDiamond.scale.set(1.0, 0.35, 1.35);
      wristDiamond.position.set(0, 0.014, 0);
      wristGuardGroup.add(wristPlate, wristDiamond);
      handGroup.add(wristGuardGroup);

      // 3. Grip Group aligned with the diagonal Wand/Sword Shaft (-Math.PI / 2.85, sx * 0.08, sx * 0.24)
      const gripOrigin = new THREE.Group();
      gripOrigin.position.set(sx * -0.015, 0.008, -0.055);
      gripOrigin.rotation.set(-Math.PI / 2.85, sx * 0.08, sx * 0.24);

      // Dorsal purple fingerless glove wrapping the back of the hand along the shaft
      const dorsalGlove = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.042, 0.135, 7),
        gloveMat
      );
      dorsalGlove.position.set(sx * 0.024, -0.022, 0.012);
      dorsalGlove.rotation.z = sx * -0.18;
      gripOrigin.add(dorsalGlove);

      const gloveArch = new THREE.Mesh(
        new THREE.BoxGeometry(0.052, 0.115, 0.044),
        gloveMat
      );
      gloveArch.position.set(sx * 0.014, -0.018, 0.018);
      gloveArch.rotation.y = sx * 0.25;
      gripOrigin.add(gloveArch);

      // Exposed pale skin at upper knuckle ridge on the back of the glove
      const knuckleSkin = new THREE.Mesh(
        new THREE.BoxGeometry(0.044, 0.098, 0.034),
        skinMat
      );
      knuckleSkin.position.set(sx * 0.004, -0.012, 0.022);
      gripOrigin.add(knuckleSkin);

      // 4. Index Finger at top of grip (y = +0.036): arches OVER the top of the shaft with glowing cyan ring!
      const indexGroup = new THREE.Group();
      indexGroup.position.set(sx * 0.018, 0.036, 0.016);

      const idxSeg1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0125, 0.014, 0.048, 6),
        skinMat
      );
      idxSeg1.rotation.z = Math.PI / 2;
      idxSeg1.position.set(sx * -0.016, 0.008, 0.006);
      idxSeg1.rotation.y = sx * -0.25;
      indexGroup.add(idxSeg1);

      // Glowing cyan crystal ring on top of Index Finger
      const idxRingBand = new THREE.Mesh(
        new THREE.TorusGeometry(0.0145, 0.0035, 6, 10),
        steelGuardMat
      );
      idxRingBand.rotation.y = Math.PI / 2;
      idxRingBand.position.set(sx * -0.006, 0.008, 0.008);
      const idxGem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.013, 0),
        ringGemMat
      );
      idxGem.position.set(sx * -0.006, 0.022, 0.014);
      indexGroup.add(idxRingBand, idxGem);

      const idxSeg2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0105, 0.0125, 0.042, 6),
        skinMat
      );
      idxSeg2.position.set(sx * -0.038, -0.002, -0.008);
      idxSeg2.rotation.set(0.45, sx * 0.2, sx * 0.85);
      indexGroup.add(idxSeg2);
      gripOrigin.add(indexGroup);

      // 5. Thumb (y = +0.006): wraps across the front of the shaft with silver ring
      const thumbWrap = new THREE.Group();
      thumbWrap.position.set(sx * 0.016, 0.006, 0.028);

      const thumbBand = new THREE.Mesh(
        new THREE.TorusGeometry(0.015, 0.0035, 6, 10),
        steelGuardMat
      );
      thumbBand.rotation.y = Math.PI / 2;
      thumbBand.position.set(sx * -0.012, 0, 0);

      const tSeg1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.013, 0.015, 0.046, 6),
        skinMat
      );
      tSeg1.rotation.z = Math.PI / 2;
      tSeg1.position.set(sx * -0.018, 0.004, -0.004);
      tSeg1.rotation.y = sx * 0.28;

      const tSeg2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.013, 0.038, 6),
        skinMat
      );
      tSeg2.rotation.z = Math.PI / 2;
      tSeg2.position.set(sx * -0.044, 0.012, -0.016);
      tSeg2.rotation.y = sx * 0.75;

      thumbWrap.add(thumbBand, tSeg1, tSeg2);
      gripOrigin.add(thumbWrap);

      // 6. Middle, Ring, and Pinky Fingers wrapping visibly around the inner side of the shaft!
      const gripFingers = [
        { y: -0.018, r: 0.0125, len1: 0.048, len2: 0.038, hasBand: true },
        { y: -0.044, r: 0.012, len1: 0.045, len2: 0.036, hasBand: false },
        { y: -0.068, r: 0.0105, len1: 0.038, len2: 0.032, hasBand: false },
      ];

      gripFingers.forEach((gf) => {
        const fg = new THREE.Group();
        fg.position.set(0, gf.y, 0);

        // Proximal segment wrapping around the inner side of the shaft
        const s1 = new THREE.Mesh(
          new THREE.CylinderGeometry(gf.r * 0.92, gf.r, gf.len1, 6),
          skinMat
        );
        s1.rotation.z = Math.PI / 2;
        s1.position.set(sx * -0.016, 0, -0.014);
        s1.rotation.y = sx * -0.35;
        fg.add(s1);

        // Distal segment curling around the inner side toward the front (+Z) of the shaft
        const s2 = new THREE.Mesh(
          new THREE.CylinderGeometry(gf.r * 0.78, gf.r * 0.92, gf.len2, 6),
          skinMat
        );
        s2.position.set(sx * -0.028, 0.002, 0.008);
        s2.rotation.set(Math.PI / 2 - 0.25, sx * 0.35, sx * -0.25);
        fg.add(s2);

        if (gf.hasBand) {
          const fBand = new THREE.Mesh(
            new THREE.TorusGeometry(gf.r * 1.08, 0.0032, 6, 10),
            steelGuardMat
          );
          fBand.position.set(sx * -0.025, 0.002, 0.012);
          fBand.rotation.x = Math.PI / 2;
          fg.add(fBand);
        }

        gripOrigin.add(fg);
      });

      handGroup.add(gripOrigin);
      return handGroup;
    };

    this.leftGripHandMesh = buildRightWandGrippingHand(true);
    this.leftGripHandMesh.visible = false;
    this.leftHandGroup.add(this.leftGripHandMesh);

    this.rightHandGroup = buildRightWandGrippingHand(false);
    this.rightHandGroup.position.set(0.38, -0.175, -0.50);
    this.rightHandGroup.rotation.set(0.26, -0.34, 0.28);

    this.wandMountGroup = new THREE.Group();
    this.rightHandGroup.add(this.wandMountGroup);

    this.wandTipLight = new THREE.PointLight(0x38bdf8, 1.8, 6.0);
    this.wandTipLight.position.set(-0.08, 0.24, -0.52);
    this.rightHandGroup.add(this.wandTipLight);

    this.arcaneSwordGroup = this.buildArcaneSwordMesh(false);
    this.arcaneSwordGroup.visible = false;
    this.rightHandGroup.add(this.arcaneSwordGroup);

    this.leftArcaneSwordGroup = this.buildArcaneSwordMesh(true);
    this.leftArcaneSwordGroup.visible = false;
    this.leftHandGroup.add(this.leftArcaneSwordGroup);

    this.fpRig.add(this.rightHandGroup);
    this.rebuildWandMesh(this.equippedStaffId);
  }

  private buildArcaneSwordMesh(isLeft = false): THREE.Group {
    const sx = isLeft ? -1 : 1;
    const swordGroup = new THREE.Group();
    const swordPivot = new THREE.Group();
    // Matches gripOrigin in buildRightWandGrippingHand(isLeft) so the fingers wrap directly around the sword hilt on both hands!
    swordPivot.position.set(sx * -0.015, 0.008, -0.055);
    swordPivot.rotation.set(-Math.PI / 2.85, sx * 0.08, sx * 0.24);
    swordGroup.add(swordPivot);

    const goldGuardMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.48,
      roughness: 0.22,
      metalness: 0.9,
      flatShading: true,
    });
    const bladeCoreMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.15,
      roughness: 0.08,
      metalness: 0.35,
      flatShading: true,
    });
    const bladeAuraMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
    });

    // Hilt & Golden Pommel wrapped by the right hand fingers
    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.025, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.45, metalness: 0.35 })
    );
    grip.position.set(0, 0.02, 0);

    const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.036, 0), goldGuardMat);
    pommel.position.set(0, -0.10, 0);

    // Ornate Golden Crossguard with Glowing Cyan Gem right above the hand grip
    const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.042, 0.052), goldGuardMat);
    crossguard.position.set(0, 0.14, 0);
    const guardWingL = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.09, 4), goldGuardMat);
    guardWingL.position.set(-0.15, 0.16, 0);
    guardWingL.rotation.z = 0.45;
    const guardWingR = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.09, 4), goldGuardMat);
    guardWingR.position.set(0.15, 0.16, 0);
    guardWingR.rotation.z = -0.45;
    const guardGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.038, 0), bladeCoreMat);
    guardGem.position.set(0, 0.145, 0.022);

    // Long Radiant Arcane Broadsword Blade extending upward along +Y
    const bladeLength = 0.72;
    const bladeGeo = new THREE.BoxGeometry(0.068, bladeLength, 0.018);
    const blade = new THREE.Mesh(bladeGeo, bladeCoreMat);
    blade.position.set(0, 0.16 + bladeLength * 0.5, 0);

    const fullerGeo = new THREE.BoxGeometry(0.024, bladeLength * 0.86, 0.024);
    const fuller = new THREE.Mesh(fullerGeo, goldGuardMat);
    fuller.position.set(0, 0.16 + bladeLength * 0.45, 0);

    const tipGeo = new THREE.ConeGeometry(0.048, 0.18, 4);
    tipGeo.rotateY(Math.PI / 4);
    const bladeTip = new THREE.Mesh(tipGeo, bladeCoreMat);
    bladeTip.position.set(0, 0.16 + bladeLength + 0.08, 0);
    bladeTip.scale.set(1.0, 1.0, 0.35);

    const auraBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.098, bladeLength + 0.08, 0.028),
      bladeAuraMat
    );
    auraBlade.position.set(0, 0.16 + bladeLength * 0.52, 0);

    swordPivot.add(
      grip,
      pommel,
      crossguard,
      guardWingL,
      guardWingR,
      guardGem,
      blade,
      fuller,
      bladeTip,
      auraBlade
    );
    return swordGroup;
  }

  public hasActiveArcaneSword(): boolean {
    return Boolean(this.activeArcaneSword && this.activeArcaneSword.remainingSec > 0);
  }

  public summonArcaneSword(opts: {
    durationSec: number;
    slashDamage: number;
    level: number;
    ignitesOnHit: boolean;
    stunsOnHit?: boolean;
    qualityPercent: number;
  }) {
    const dualWield = opts.level >= 6;
    const swingCooldownSec = dualWield
      ? ARCANE_SWORD_LV6_SWING_COOLDOWN_SEC
      : ARCANE_SWORD_SWING_COOLDOWN_SEC;

    audioEngine.stopArcaneSwordExpiringSound();

    this.activeArcaneSword = {
      remainingSec: opts.durationSec,
      totalDurationSec: opts.durationSec,
      totalSec: opts.durationSec,
      damage: opts.slashDamage,
      slashDamage: opts.slashDamage,
      level: opts.level,
      ignites: opts.ignitesOnHit,
      ignitesOnHit: opts.ignitesOnHit,
      stuns: false,
      stunsOnHit: false,
      stunsOnHitSec: 0,
      dualWield,
      swingCooldown: 0,
      swingCooldownSec,
      swingAnimTimer: 0,
      swingDir: 1,
      swingHand: 'right',
      warningSoundPlayed: false,
    };
    this.wandMountGroup.visible = false;
    this.arcaneSwordGroup.visible = true;
    if (this.leftArcaneSwordGroup) {
      this.leftArcaneSwordGroup.visible = dualWield;
    }
    if (this.leftOpenHandMesh) {
      this.leftOpenHandMesh.visible = !dualWield;
    }
    if (this.leftGripHandMesh) {
      this.leftGripHandMesh.visible = dualWield;
    }
    this.wandTipLight.color.setHex(0x38bdf8);
    this.wandTipLight.intensity = 2.6;
    this.spawnParticles(_v1.copy(this.playerPos).setY(1.3), 0x38bdf8, 28, 6.5);
    this.lastCastBanner = {
      spellName: dualWield
        ? `⚔️⚔️ Два Магических Меча призваны (${opts.durationSec.toFixed(1)}с · урон ${opts.slashDamage} · удар раз в 0.7с · Вправо [ПКМ] — правая рука, Влево [ПКМ] — левая рука)!`
        : `🗡️ Магический Меч призван (${opts.durationSec.toFixed(1)}с · урон ${opts.slashDamage}${
            opts.ignitesOnHit ? ' · Поджог' : ''
          })! Зажмите [ПКМ] и ведите влево/вправо!`,
      qualityPercent: opts.qualityPercent,
      damage: opts.slashDamage,
      detail: '',
      color: '#38bdf8',
      timestamp: performance.now(),
    };
    this.pushHudSnapshot();
  }

  public dismissArcaneSword(reason?: string) {
    if (!this.activeArcaneSword) return;
    this.activeArcaneSword = null;
    audioEngine.stopArcaneSwordExpiringSound();
    if (this.arcaneSwordGroup) {
      this.arcaneSwordGroup.visible = false;
      this.arcaneSwordGroup.rotation.set(0, 0, 0);
      this.arcaneSwordGroup.position.set(0, 0, 0);
    }
    if (this.leftArcaneSwordGroup) {
      this.leftArcaneSwordGroup.visible = false;
      this.leftArcaneSwordGroup.rotation.set(0, 0, 0);
      this.leftArcaneSwordGroup.position.set(0, 0, 0);
    }
    if (this.leftOpenHandMesh) {
      this.leftOpenHandMesh.visible = true;
    }
    if (this.leftGripHandMesh) {
      this.leftGripHandMesh.visible = false;
    }
    if (this.wandMountGroup) {
      this.wandMountGroup.visible = true;
    }
    if (reason) {
      this.lastCastBanner = {
        spellName: reason,
        qualityPercent: 100,
        damage: 0,
        detail: '',
        color: '#94a3b8',
        timestamp: performance.now(),
      };
    }
    this.pushHudSnapshot();
  }

  /**
   * Swings the summoned Arcane Sword left (`dir = -1`) or right (`dir = 1`) when dragging RMB!
   * - At Levels 1..5: swings the right-hand sword once every 1.0s (`ARCANE_SWORD_SWING_COOLDOWN_SEC = 1.0`).
   * - At Level 6 (`dualWield`): holds a second sword in the left hand; swiping right (`dir = 1`) strikes with the right hand,
   *   swiping left (`dir = -1`) strikes with the left hand, and deals damage every 0.7s (`ARCANE_SWORD_LV6_SWING_COOLDOWN_SEC = 0.7`)!
   */
  public swingArcaneSword(dir: -1 | 1): boolean {
    if (!this.activeArcaneSword || this.activeArcaneSword.remainingSec <= 0) {
      return false;
    }
    const isDual = this.activeArcaneSword.dualWield;
    const activeHand: 'left' | 'right' = isDual && dir < 0 ? 'left' : 'right';
    this.activeArcaneSword.swingDir = dir;
    this.activeArcaneSword.swingHand = activeHand;
    this.activeArcaneSword.swingAnimTimer = 0.28;

    if (this.activeArcaneSword.swingCooldown > 0) {
      return false;
    }
    this.activeArcaneSword.swingCooldown = this.activeArcaneSword.swingCooldownSec;
    this.castRecoil = 0.85;
    this.playerCombatEngageTimer = 10.0;
    audioEngine.playSpellCast('arcane_sword', 95);

    this.camera.getWorldDirection(_forward);
    _forward.normalize();
    const flatFwd = _v2.copy(_forward).setY(0);
    if (flatFwd.lengthSq() < 0.001) flatFwd.set(0, 0, -1);
    flatFwd.normalize();

    const slashPos = _v1.copy(this.camera.position).addScaledVector(_forward, 1.85);
    this.spawnParticles(slashPos, 0x38bdf8, 22, 6.5);
    if (this.activeArcaneSword.ignitesOnHit) {
      this.spawnParticles(slashPos, 0xf97316, 14, 5.5);
    }

    let hitCount = 0;
    const dmg = this.activeArcaneSword.slashDamage;
    for (const enemy of this.enemies) {
      if (enemy.state === 'ko') continue;
      if (enemy.burrowTimer && enemy.burrowTimer > 0) continue;
      const dx = enemy.position.x - this.playerPos.x;
      const dz = enemy.position.z - this.playerPos.z;
      const dist = Math.hypot(dx, dz);
      if (dist <= ARCANE_SWORD_RANGE) {
        const toEnemy = _v3.set(dx, 0, dz).normalize();
        const dot = toEnemy.dot(flatFwd);
        if (dot >= 0.25 || dist <= 2.4) {
          const knock = toEnemy.clone().multiplyScalar(9.5);
          if (this.activeArcaneSword.ignitesOnHit) {
            enemy.burnTimer = Math.max(enemy.burnTimer, 3.0);
          }
          this.damageEnemy(enemy, dmg, knock, 0x38bdf8, false, 'arcane_sword');
          hitCount++;
        }
      }
    }

    // Check Elemental Rune Buttons in melee range too
    for (const btn of this.runeButtons) {
      if (btn.activated) continue;
      if (
        btn.position.distanceTo(slashPos) < 2.2 &&
        this.activeArcaneSword.ignitesOnHit &&
        btn.spec.requiredSpellId === 'incendio'
      ) {
        this.activateRuneButton(btn.id, false);
      }
    }

    if (hitCount > 0) {
      const handLabel = isDual
        ? activeHand === 'right'
          ? 'Правый меч →'
          : '← Левый меч'
        : dir > 0
        ? 'вправо →'
        : '← влево';
      this.lastCastBanner = {
        spellName: `🗡️ Удар Магическим Мечом (${handLabel}): ${dmg} ур.${
          this.activeArcaneSword.ignitesOnHit ? ' + Поджог!' : ''
        }`,
        qualityPercent: 100,
        damage: dmg,
        detail: '',
        color: '#38bdf8',
        timestamp: performance.now(),
      };
    }
    this.pushHudSnapshot();
    return true;
  }

  public setEquippedStaff(staffId: EquipmentId) {
    this.equippedStaffId = staffId;
    this.rebuildWandMesh(staffId);
  }

  public setEquippedArtifacts(equipped: Partial<Record<ArtifactSlot, ArtifactId>>) {
    this.equippedArtifacts = { ...equipped };
    this.recomputeMaxVitals();
    this.pushHudSnapshot();
  }

  public toggleTestInvulnerability(): boolean {
    this.testInvulnerable = !this.testInvulnerable;
    if (this.testInvulnerable) {
      this.hp = this.maxHp;
      this.playerSlowTimer = 0;
      this.playerFearTimer = 0;
      this.playerBurnTimer = 0;
      this.playerStunTimer = 0;
    }
    this.lastCastBanner = {
      spellName: this.testInvulnerable
        ? '🛡️ ТЕСТ: Полная неуязвимость ВКЛЮЧЕНА [O / Щ]'
        : '🛡️ ТЕСТ: Полная неуязвимость ВЫКЛЮЧЕНА [O / Щ]',
      qualityPercent: 100,
      damage: 0,
      detail: '',
      color: this.testInvulnerable ? '#4ade80' : '#94a3b8',
      timestamp: performance.now(),
    };
    this.pushHudSnapshot();
    return this.testInvulnerable;
  }

  public setPlayerBaseLevel(level: number, fullRestore = false) {
    this.playerBaseLevel = Math.max(1, Math.floor(level || 1));
    this.recomputeMaxVitals(false);
    if (fullRestore) {
      this.hp = this.maxHp;
      this.mp = this.maxMp;
    }
    this.pushHudSnapshot();
  }

  private recomputeMaxVitals(grantPositiveDelta = true) {
    const artBonuses = getCombinedArtifactBonuses(this.equippedArtifacts);
    const foodHp = this.activeFoodBuff ? this.activeFoodBuff.bonusMaxHp : 0;
    const foodMp = this.activeBatFoodBuff ? this.activeBatFoodBuff.bonusMaxMp || 0 : 0;
    const levelHpBonus = Math.max(0, this.playerBaseLevel - 1) * 15;
    const levelMpBonus = Math.max(0, this.playerBaseLevel - 1) * 10;
    const nextMaxHp = 100 + levelHpBonus + artBonuses.bonusMaxHp + foodHp;
    const nextMaxMp = 100 + levelMpBonus + artBonuses.bonusMaxMp + foodMp;
    const hpDelta = nextMaxHp - this.maxHp;
    const mpDelta = nextMaxMp - this.maxMp;
    this.maxHp = nextMaxHp;
    this.maxMp = nextMaxMp;
    if (grantPositiveDelta && hpDelta > 0) {
      this.hp = Math.min(this.maxHp, this.hp + hpDelta);
    } else {
      this.hp = Math.min(this.hp, this.maxHp);
    }
    if (grantPositiveDelta && mpDelta > 0) {
      this.mp = Math.min(this.maxMp, this.mp + mpDelta);
    } else {
      this.mp = Math.min(this.mp, this.maxMp);
    }
  }

  /**
   * Builds all 4 Wands/Staffs in the ornate crystal-tipped Reference Image 1 style:
   * - Spiral-carved dark wood shaft with gold pommel and mid-grip collar
   * - Golden filigree bands & 4-pronged crown socket
   * - Large multi-faceted glowing crystal spearhead + floating arcane sparkles
   */
  private rebuildWandMesh(staffId: EquipmentId) {
    while (this.wandMountGroup.children.length > 0) {
      this.wandMountGroup.remove(this.wandMountGroup.children[0]);
    }

    const def = EQUIPMENT_CATALOG[staffId] || EQUIPMENT_CATALOG.wand_ollivander;
    // Use radiant ice-cyan crystal glow for Ollivander & Frost Dragon per Reference Image 1, emerald for Yew, violet for Coven
    const crystalHex =
      staffId === 'wand_ollivander' || staffId === 'staff_frost_dragon'
        ? '#38bdf8'
        : def.gemColor;

    const woodMat = new THREE.MeshStandardMaterial({
      color: def.primaryColor,
      roughness: 0.48,
      metalness: 0.18,
      flatShading: true,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.38,
      roughness: 0.22,
      metalness: 0.9,
      flatShading: true,
    });
    const gemMat = new THREE.MeshStandardMaterial({
      color: crystalHex,
      emissive: crystalHex,
      emissiveIntensity: 1.75,
      roughness: 0.08,
      metalness: 0.2,
      transparent: true,
      opacity: 0.94,
      flatShading: true,
    });
    const coreGemMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
    });

    const isStaff = def.type === 'staff';
    const wandPivot = new THREE.Group();
    // Matches gripOrigin in buildRightWandGrippingHand so the fingers wrap directly around the wand shaft!
    wandPivot.position.set(-0.015, 0.008, -0.055);
    wandPivot.rotation.set(-Math.PI / 2.85, 0.08, 0.24);
    this.wandMountGroup.add(wandPivot);

    const length = isStaff ? 0.58 : 0.48;
    const radiusTop = isStaff ? 0.019 : 0.015;
    const radiusBottom = isStaff ? 0.025 : 0.020;

    // 1. Faceted carved wood shaft
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 7, 6),
      woodMat
    );
    shaft.position.y = length * 0.34;
    wandPivot.add(shaft);

    // 2. Golden pommel cap at bottom of handle
    const pommelRing = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusBottom * 1.18, radiusBottom * 1.05, 0.028, 8),
      goldMat
    );
    pommelRing.position.y = -length * 0.16;
    const pommelGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(radiusBottom * 0.95, 0),
      goldMat
    );
    pommelGem.position.y = -length * 0.19;
    wandPivot.add(pommelRing, pommelGem);

    // 3. Mid-shaft golden grip collar (right above the hand grip)
    const gripCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusBottom * 1.15, radiusBottom * 1.15, 0.026, 8),
      goldMat
    );
    gripCollar.position.y = length * 0.14;
    wandPivot.add(gripCollar);

    // 4. Spiral golden filigree vines wrapping up the shaft
    const spiralSteps = 12;
    for (let s = 0; s < spiralSteps; s++) {
      const t = s / (spiralSteps - 1);
      const y = length * (0.18 + t * 0.62);
      const r = THREE.MathUtils.lerp(radiusBottom, radiusTop, t) * 1.06;
      const angle = t * Math.PI * 3.4;
      for (const offset of [0, Math.PI]) {
        const bead = new THREE.Mesh(new THREE.OctahedronGeometry(0.0058, 0), goldMat);
        bead.position.set(Math.cos(angle + offset) * r, y, Math.sin(angle + offset) * r);
        bead.scale.set(1, 1.85, 1);
        wandPivot.add(bead);
      }
    }

    // 5. Golden Crown Socket & 4 Curved Golden Prongs holding the Crystal
    const crownY = length * 0.84;
    const crownCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop * 1.65, radiusTop * 1.2, 0.04, 8),
      goldMat
    );
    crownCollar.position.y = crownY;
    wandPivot.add(crownCollar);

    const prongCount = isStaff ? 6 : 4;
    for (let p = 0; p < prongCount; p++) {
      const a = (p / prongCount) * Math.PI * 2 + Math.PI / 4;
      const prong = new THREE.Mesh(
        new THREE.ConeGeometry(0.008, isStaff ? 0.082 : 0.068, 4),
        goldMat
      );
      const pr = radiusTop * 1.48;
      prong.position.set(Math.cos(a) * pr, crownY + 0.04, Math.sin(a) * pr);
      prong.rotation.z = -Math.cos(a) * 0.18;
      prong.rotation.x = Math.sin(a) * 0.18;
      wandPivot.add(prong);
    }

    // 6. Large Faceted Glowing Crystal Spearhead Tip (matching Reference Image 1)
    const crystalRadius = isStaff ? 0.042 : 0.034;
    const crystalHeight = isStaff ? 0.165 : 0.135;
    const tipCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(crystalRadius, 0),
      gemMat
    );
    tipCrystal.scale.set(1.0, crystalHeight / (crystalRadius * 1.8), 0.88);
    tipCrystal.position.y = crownY + crystalHeight * 0.56;
    wandPivot.add(tipCrystal);

    const innerCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(crystalRadius * 0.58, 0),
      coreGemMat
    );
    innerCore.scale.copy(tipCrystal.scale);
    innerCore.position.copy(tipCrystal.position);
    wandPivot.add(innerCore);

    // 7. Floating Arcane Sparkle Motes around the Crystal Tip
    const moteOffsets = [
      { x: -0.048, y: 0.025, z: 0.022, s: 0.0065 },
      { x: 0.044, y: 0.05, z: -0.02, s: 0.0055 },
      { x: -0.03, y: 0.08, z: -0.03, s: 0.005 },
      { x: 0.038, y: -0.015, z: 0.032, s: 0.006 },
      { x: 0.0, y: 0.095, z: 0.024, s: 0.0052 },
    ];
    for (const m of moteOffsets) {
      const mote = new THREE.Mesh(new THREE.OctahedronGeometry(m.s, 0), coreGemMat);
      mote.position.set(m.x, tipCrystal.position.y + m.y, m.z);
      wandPivot.add(mote);
    }

    this.wandTipLight.color.set(crystalHex);
  }

  private initParticlePool() {
    const geo = new THREE.OctahedronGeometry(0.11, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.particleMesh = new THREE.InstancedMesh(geo, mat, this.maxParticles);
    this.particleMesh.frustumCulled = false;

    for (let i = 0; i < this.maxParticles; i++) {
      _dummyObj.position.set(0, -100, 0);
      _dummyObj.scale.setScalar(0.001);
      _dummyObj.updateMatrix();
      this.particleMesh.setMatrixAt(i, _dummyObj.matrix);
      this.particleMesh.setColorAt(i, _color.setHex(0xffffff));
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.particleMesh);
  }

  public spawnParticles(origin: THREE.Vector3, colorHex: string | number, count = 14, speed = 5) {
    _color.set(colorHex);
    const actualCount =
      this.graphicsQuality === 'ultralow'
        ? Math.max(2, Math.round(count * 0.12))
        : this.graphicsQuality === 'medium'
        ? Math.max(4, Math.round(count * 0.38))
        : count;
    for (let i = 0; i < actualCount; i++) {
      const idx = this.particleCursor;
      this.particleCursor = (this.particleCursor + 1) % this.maxParticles;

      const i3 = idx * 3;
      this.particlePos[i3] = origin.x + (Math.random() - 0.5) * 0.3;
      this.particlePos[i3 + 1] = origin.y + (Math.random() - 0.5) * 0.3;
      this.particlePos[i3 + 2] = origin.z + (Math.random() - 0.5) * 0.3;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const spd = speed * (0.4 + Math.random() * 0.8);
      this.particleVel[i3] = Math.sin(phi) * Math.cos(theta) * spd;
      this.particleVel[i3 + 1] = Math.cos(phi) * spd + 1.8;
      this.particleVel[i3 + 2] = Math.sin(phi) * Math.sin(theta) * spd;

      this.particleMaxLife[idx] = 0.35 + Math.random() * 0.35;
      this.particleLife[idx] = this.particleMaxLife[idx];
      this.particleScale[idx] = 0.7 + Math.random() * 1.1;

      this.particleMesh.setColorAt(idx, _color);
    }
    if (this.particleMesh.instanceColor) {
      this.particleMesh.instanceColor.needsUpdate = true;
    }
  }

  private addContactShadow(parent: THREE.Group, radius = 0.8) {
    const shadowGeo = new THREE.CircleGeometry(radius, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const disc = new THREE.Mesh(shadowGeo, shadowMat);
    disc.position.y = 0.015;
    parent.add(disc);
  }

  private createBillboardBadge(text: string, borderColor: string, subText = ''): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 72;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(12, 10, 20, 0.86)';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 64, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, subText ? 32 : 44);

    if (subText) {
      ctx.fillStyle = borderColor;
      ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(subText, 128, 54);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2.4, 0.68, 1);
    return sprite;
  }

  /**
   * Builds the high-detail faceted low-poly Pine Tree per Reference Image 2 (`/public/assets/aistudio/image_eb76dffa.png`):
   * - Tapered 9-sided warm brown trunk
   * - 3 stacked beveled conical green foliage tiers (`ConeGeometry` + underside bevel frustum)
   */
  private spawnTreeNode(pos: THREE.Vector3, idx: number) {
    const group = new THREE.Group();
    group.position.copy(pos);
    this.addContactShadow(group, 1.85);

    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x7c4d2b,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    });
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x5ca92c,
      emissive: 0x14532d,
      emissiveIntensity: 0.18,
      roughness: 0.58,
      metalness: 0.06,
      flatShading: true,
    });
    const foliageUnderMat = new THREE.MeshStandardMaterial({
      color: 0x3f7d20,
      roughness: 0.68,
      metalness: 0.05,
      flatShading: true,
    });

    // Tapered faceted trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.66, 2.35, 9),
      trunkMat
    );
    trunk.position.y = 1.175;
    group.add(trunk);

    // 3 stacked beveled conical foliage tiers matching Reference Image 2
    const tiers = [
      { y: 2.85, rTop: 1.32, rMid: 2.18, rBot: 1.86, coneH: 1.55, lipH: 0.34 },
      { y: 4.15, rTop: 0.92, rMid: 1.78, rBot: 1.5, coneH: 1.45, lipH: 0.3 },
      { y: 5.45, rTop: 0.0, rMid: 1.32, rBot: 1.1, coneH: 1.65, lipH: 0.26 },
    ];

    for (const t of tiers) {
      // Lower beveled lip frustum
      const lip = new THREE.Mesh(
        new THREE.CylinderGeometry(t.rMid, t.rBot, t.lipH, 10),
        foliageUnderMat
      );
      lip.position.y = t.y - t.coneH * 0.5 - t.lipH * 0.5;
      // Upper faceted slope/cone
      const slope = new THREE.Mesh(
        t.rTop > 0.01
          ? new THREE.CylinderGeometry(t.rTop, t.rMid, t.coneH, 10)
          : new THREE.ConeGeometry(t.rMid, t.coneH, 10),
        foliageMat
      );
      slope.position.y = t.y;
      group.add(lip, slope);
    }

    this.worldContentGroup.add(group);

    this.harvestNodes.push({
      id:
        this.mapMode === 'labyrinth'
          ? `tree_s${this.labyrinthStage}_${idx}`
          : `tree_arena_${idx}`,
      name: 'Древний Тис',
      reagentId: 'ancient_wood',
      mesh: group,
      position: pos.clone(),
      cooldown: 0,
    });
  }

  /**
   * Builds the Potted Mandrake Creature (`Корень мандрагоры`) per Reference Image 2 (`/public/assets/aistudio/image_eb76dffa.png`):
   * - Weathered terracotta pot with thick rim and dark soil mound
   * - Grumpy root-humanoid Mandrake (stubby legs, plump root body, outstretched arms, brow/eyes/mouth)
   * - Crown of 6 serrated faceted green leaves sprouting from the head
   */
  private spawnHerbNode(pos: THREE.Vector3, idx: number) {
    const group = new THREE.Group();
    group.position.copy(pos);
    // Face the Mandrake toward the approaching player along the corridor (`-X` / center)
    group.rotation.y = Math.PI / 2 + (idx % 2 === 0 ? -0.25 : 0.25);
    group.scale.setScalar(1.24);
    this.addContactShadow(group, 0.85);

    const potMat = new THREE.MeshStandardMaterial({
      color: 0xb86b43,
      roughness: 0.82,
      metalness: 0.06,
      flatShading: true,
    });
    const potRimMat = new THREE.MeshStandardMaterial({
      color: 0xc87d55,
      roughness: 0.78,
      metalness: 0.06,
      flatShading: true,
    });
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x3b2f2f,
      roughness: 0.92,
      metalness: 0.02,
      flatShading: true,
    });
    const mandrakeMat = new THREE.MeshStandardMaterial({
      color: 0x6e4e37,
      roughness: 0.8,
      metalness: 0.05,
      flatShading: true,
    });
    const darkFeatureMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.9,
      flatShading: true,
    });
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x4d8c32,
      emissive: 0x15803d,
      emissiveIntensity: 0.25,
      roughness: 0.48,
      metalness: 0.05,
      flatShading: true,
    });

    // 1. Terracotta Pot + Beveled Rim + Dark Soil Mound
    const potBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.34, 0.36, 10),
      potMat
    );
    potBody.position.y = 0.18;
    const potRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.51, 0.48, 0.08, 10),
      potRimMat
    );
    potRim.position.y = 0.38;
    const soilMound = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 10, 6),
      soilMat
    );
    soilMound.scale.set(1.0, 0.32, 1.0);
    soilMound.position.y = 0.39;
    group.add(potBody, potRim, soilMound);

    // 2. Sculpted Mandrake Root Creature standing in the pot
    const legL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.052, 0.22, 7),
      mandrakeMat
    );
    legL.position.set(-0.085, 0.54, 0);
    const legR = legL.clone();
    legR.position.x = 0.085;

    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.165, 0.155, 0.36, 9, 2),
      mandrakeMat
    );
    torso.position.y = 0.78;

    const head = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.185, 1),
      mandrakeMat
    );
    head.scale.set(0.95, 1.12, 0.92);
    head.position.y = 1.04;

    // Grumpy brow ridge, dark sunken eyes, and grumpy mouth
    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.036, 0.06),
      mandrakeMat
    );
    brow.position.set(0, 1.09, -0.155);
    const eyeL = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 6, 6),
      darkFeatureMat
    );
    eyeL.position.set(-0.062, 1.055, -0.165);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.062;
    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.026, 0.04),
      darkFeatureMat
    );
    mouth.position.set(0, 0.975, -0.168);

    // Outstretched root arms with twiggy rootlets
    const armL = new THREE.Mesh(
      new THREE.ConeGeometry(0.048, 0.28, 6),
      mandrakeMat
    );
    armL.position.set(-0.22, 0.78, 0);
    armL.rotation.z = 1.05;
    const armR = new THREE.Mesh(
      new THREE.ConeGeometry(0.048, 0.28, 6),
      mandrakeMat
    );
    armR.position.set(0.22, 0.78, 0);
    armR.rotation.z = -1.05;

    group.add(legL, legR, torso, head, brow, eyeL, eyeR, mouth, armL, armR);

    // 3. Crown of 6 Serrated Faceted Green Leaves sprouting from the head
    const leafCount = 6;
    for (let l = 0; l < leafCount; l++) {
      const a = (l / leafCount) * Math.PI * 2 + 0.25;
      const leafGroup = new THREE.Group();
      leafGroup.position.set(Math.cos(a) * 0.05, 1.2, Math.sin(a) * 0.05);
      leafGroup.rotation.y = -a + Math.PI / 2;
      leafGroup.rotation.x = 0.52 + (l % 2) * 0.14;

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.024, 0.16, 5),
        mandrakeMat
      );
      stem.position.set(0, 0.06, 0);

      // Serrated leaf blade (3 overlapping diamond segments)
      for (let s = 0; s < 3; s++) {
        const w = 0.11 - s * 0.018;
        const seg = new THREE.Mesh(new THREE.OctahedronGeometry(w, 0), leafMat);
        seg.scale.set(1.15, 1.55, 0.22);
        seg.position.set(0, 0.18 + s * 0.13, 0);
        leafGroup.add(seg);
      }

      leafGroup.add(stem);
      group.add(leafGroup);
    }

    this.worldContentGroup.add(group);
    this.harvestNodes.push({
      id:
        this.mapMode === 'labyrinth'
          ? `herb_s${this.labyrinthStage}_${idx}`
          : `herb_arena_${idx}`,
      name: 'Корень Мандрагоры',
      reagentId: 'mandrake_root',
      mesh: group,
      position: pos.clone(),
      cooldown: 0,
    });
  }

  private spawnTameableAnimal(species: TameableSpeciesId, pos: THREE.Vector3, idx: number) {
    const def = PET_CATALOG[species];
    const { group, tailOrWingPart } = this.createDetailedTameablePetMesh(species);
    group.position.copy(pos);

    const badge = this.createBillboardBadge(
      `${def.name}`,
      def.primaryColor,
      '[E] Приручить питомца'
    );
    badge.position.set(0, 1.85, 0);
    group.add(badge);

    this.worldContentGroup.add(group);

    this.animals.push({
      id: `pet_${species}_${idx}`,
      species,
      name: def.name,
      title: def.title,
      mesh: group,
      tailOrWingPart,
      badgeSprite: badge,
      homePosition: pos.clone(),
      position: pos.clone(),
      isTamed: false,
      level: 1,
      trainingStep: 0,
      petXp: 0,
      baseScale: 1.0,
      scaleMultiplier: 1.0,
      targetScale: 1.0,
      baseAttack: def.baseAttack,
      attackPower: def.baseAttack,
      engorgioTimer: 0,
      engorgioScaleMult: 1.0,
      engorgioDamageMult: 1.0,
      attackCooldown: def.attackInterval,
      animPhase: idx * 1.7,
    });
  }

  private spawnArenaEntities() {
    [
      new THREE.Vector3(-14, 0, 8),
      new THREE.Vector3(14, 0, 9),
      new THREE.Vector3(-16, 0, -9),
      new THREE.Vector3(16, 0, -8),
    ].forEach((pos, idx) => this.spawnTreeNode(pos, idx));

    [
      new THREE.Vector3(-8, 0, 12),
      new THREE.Vector3(8, 0, 12),
      new THREE.Vector3(-11, 0, -2),
      new THREE.Vector3(11, 0, -2),
    ].forEach((pos, idx) => this.spawnHerbNode(pos, idx));

    const propSpecs: Array<{ pos: THREE.Vector3; kind: PhysicsProp['kind']; name: string }> = [
      { pos: new THREE.Vector3(-4.5, 0, 9), kind: 'crate', name: 'Окованный сундук' },
      { pos: new THREE.Vector3(4.5, 0, 9), kind: 'shield', name: 'Рунный щит стража' },
      { pos: new THREE.Vector3(-6.5, 0, 4), kind: 'barrel', name: 'Красная взрывная бочка' },
      { pos: new THREE.Vector3(6.5, 0, 4), kind: 'barrel', name: 'Красная взрывная бочка' },
    ];
    propSpecs.forEach((spec, idx) => this.spawnPhysicsProp(spec.pos, spec.kind, spec.name, idx));

    // Spawn the 4 tameable animals around the safe southern rim
    this.spawnTameableAnimal('cat', new THREE.Vector3(-3.2, 0, 14.2), 0);
    this.spawnTameableAnimal('fox', new THREE.Vector3(3.2, 0, 14.2), 1);
    this.spawnTameableAnimal('owl', new THREE.Vector3(-7.0, 0, 14.8), 2);
    this.spawnTameableAnimal('salamander', new THREE.Vector3(7.0, 0, 14.8), 3);

    // Spawn 10 explosive floor traps in Arena mode (+4 traps, +20% larger size)
    const arenaTrapCoords = [
      { x: -18, z: -6 },
      { x: 18, z: -6 },
      { x: -14, z: -18 },
      { x: 14, z: -18 },
      { x: 0, z: -22 },
      { x: -22, z: 6 },
      { x: 22, z: 6 },
      { x: -10, z: -12 },
      { x: 10, z: -12 },
      { x: 0, z: -15 },
    ];
    arenaTrapCoords.forEach((pt, idx) => {
      this.spawnFloorTrap(
        {
          id: `trap_arena_${idx}`,
          x: pt.x,
          z: pt.z,
          radius: FLOOR_TRAP_TRIGGER_RADIUS,
          damage: FLOOR_TRAP_DAMAGE,
        },
        idx
      );
    });

    this.spawnEnemyWave(1);
  }

  private spawnLabyrinthEntities(
    savedPetState: {
      species: TameableSpeciesId;
      level: number;
      trainingStep: number;
      petXp: number;
    } | null = null
  ) {
    // 1. Tameable Pets:
    // On Stage 1: Cat Mursik is placed further into the labyrinth (Z = +44, after the first corridor & initial enemies)
    // so the player fights solo for the first stretch before discovering Mursik!
    // On Stage 2 (after entering the Portal): Do NOT spawn wild pet sanctuaries! Keep ONLY the pet chosen on Stage 1!
    if (this.labyrinthStage === 1 && !savedPetState) {
      this.spawnTameableAnimal('cat', new THREE.Vector3(-18, 0, 44), 0);
      this.spawnTameableAnimal('fox', new THREE.Vector3(24, 0, 14), 1);
      this.spawnTameableAnimal('owl', new THREE.Vector3(-24, 0, -18), 2);
      this.spawnTameableAnimal('salamander', new THREE.Vector3(34, 0, -44), 3);
    } else if (savedPetState) {
      // Carry over the exact chosen pet from Stage 1 onto Stage 2 / Stage 3 right in front-right of the player!
      const startPetPos = new THREE.Vector3(this.labyrinthStartX + 3.4, 0, this.labyrinthStartZ + 2.25);
      this.spawnTameableAnimal(savedPetState.species, startPetPos, 0);
      const carriedPet = this.animals[0];
      if (carriedPet) {
        carriedPet.isTamed = true;
        carriedPet.level = savedPetState.level;
        carriedPet.trainingStep = savedPetState.trainingStep;
        carriedPet.petXp = savedPetState.petXp;
        carriedPet.baseScale = Number((1.0 + (carriedPet.level - 1) * 0.14).toFixed(2));
        carriedPet.targetScale = carriedPet.baseScale;
        carriedPet.scaleMultiplier = carriedPet.baseScale;
        carriedPet.mesh.scale.setScalar(carriedPet.baseScale);
        const def = PET_CATALOG[carriedPet.species];
        carriedPet.baseAttack =
          def.baseAttack + (carriedPet.level - 1) * 2 + carriedPet.trainingStep;
        carriedPet.attackPower = carriedPet.baseAttack;
        this.activeTamedPet = carriedPet;
        this.updatePetBadge(carriedPet);
      }
    }

    // 2. Harvestable Trees & Mandrake Flowers:
    // Include several Trees and Mandrake Flowers right in the safe starting zone before any enemies!
    const stage5Specs = this.labyrinthStage === 5 ? getStage5SpawnSpecs() : null;
    const treeSpots =
      this.labyrinthStage === 5 && stage5Specs
        ? stage5Specs.trees.map((pt) => new THREE.Vector3(pt.x, 0, pt.z))
        : this.labyrinthStage === 4
        ? [
            // Safe start grove right ahead of Stage 4 spawn (-62, 166) before any enemies
            new THREE.Vector3(-48, 0, 172),
            new THREE.Vector3(-36, 0, 160),
            new THREE.Vector3(-22, 0, 172),
            new THREE.Vector3(14, 0, 166),
            new THREE.Vector3(52, 0, 131),
            new THREE.Vector3(-52, 0, 97),
            new THREE.Vector3(52, 0, 63),
            new THREE.Vector3(-10, 0, 29),
            new THREE.Vector3(-52, 0, -5),
            new THREE.Vector3(52, 0, -39),
            new THREE.Vector3(-52, 0, -73),
            new THREE.Vector3(52, 0, -107),
            new THREE.Vector3(-52, 0, -138),
          ]
        : this.labyrinthStage === 3
        ? [
            // Safe start grove right ahead of spawn (-48, 138) before any enemies (strictly on open maze floors!)
            new THREE.Vector3(-34, 0, 142),
            new THREE.Vector3(-24, 0, 130),
            new THREE.Vector3(-12, 0, 142),
            new THREE.Vector3(16, 0, 134),
            new THREE.Vector3(52, 0, 84),
            new THREE.Vector3(-28, 0, 84),
            new THREE.Vector3(-54, 0, 56),
            new THREE.Vector3(32, 0, 56),
            new THREE.Vector3(-44, 0, 14),
            new THREE.Vector3(32, 0, 26),
            new THREE.Vector3(48, 0, -24),
            new THREE.Vector3(-36, 0, -24),
            new THREE.Vector3(44, 0, -72),
          ]
        : this.labyrinthStage === 2
        ? [
            // Safe start grove right ahead of spawn (-44, 106) before any enemies (strictly on open 20m maze floors!)
            new THREE.Vector3(-31, 0, 110),
            new THREE.Vector3(-21, 0, 98),
            new THREE.Vector3(-9, 0, 110),
            new THREE.Vector3(24, 0, 108),
            new THREE.Vector3(48, 0, 72),
            new THREE.Vector3(0, 0, 76),
            new THREE.Vector3(-36, 0, 66),
            new THREE.Vector3(48, 0, 44),
            new THREE.Vector3(24, 0, 22),
            new THREE.Vector3(0, 0, -6),
            new THREE.Vector3(-28, 0, -56),
            new THREE.Vector3(-36, 0, -78),
          ]
        : [
            // Safe start grove right ahead of spawn (-40, 92) before any enemies (outside secret rooms)
            new THREE.Vector3(-28, 0, 96),
            new THREE.Vector3(-18, 0, 85),
            new THREE.Vector3(-6, 0, 95),
            new THREE.Vector3(14, 0, 88),
            new THREE.Vector3(44, 0, 74),
            new THREE.Vector3(12, 0, 48),
            new THREE.Vector3(-24, 0, 38),
            new THREE.Vector3(-12, 0, 8),
            new THREE.Vector3(44, 0, -4),
            new THREE.Vector3(-12, 0, -32),
            new THREE.Vector3(-44, 0, -64),
          ];
    treeSpots.forEach((p, i) => this.spawnTreeNode(p, i));

    const herbSpots =
      this.labyrinthStage === 5 && stage5Specs
        ? stage5Specs.herbs.map((pt) => new THREE.Vector3(pt.x, 0, pt.z))
        : this.labyrinthStage === 4
        ? [
            new THREE.Vector3(-44, 0, 162),
            new THREE.Vector3(-30, 0, 171),
            new THREE.Vector3(-16, 0, 162),
            new THREE.Vector3(4, 0, 168),
            new THREE.Vector3(40, 0, 131),
            new THREE.Vector3(-44, 0, 97),
            new THREE.Vector3(40, 0, 63),
            new THREE.Vector3(4, 0, 29),
            new THREE.Vector3(-40, 0, -5),
            new THREE.Vector3(42, 0, -39),
            new THREE.Vector3(-40, 0, -73),
            new THREE.Vector3(4, 0, -107),
            new THREE.Vector3(-36, 0, -138),
          ]
        : this.labyrinthStage === 3
        ? [
            // Safe start Mandrake flowers right ahead of spawn (-48, 138)
            new THREE.Vector3(-37, 0, 132),
            new THREE.Vector3(-28, 0, 142),
            new THREE.Vector3(-16, 0, 133),
            new THREE.Vector3(4, 0, 136),
            new THREE.Vector3(48, 0, 96),
            new THREE.Vector3(-44, 0, 84),
            new THREE.Vector3(0, 0, 56),
            new THREE.Vector3(-54, 0, 48),
            new THREE.Vector3(24, 0, 28),
            new THREE.Vector3(48, 0, 2),
            new THREE.Vector3(-28, 0, -36),
            new THREE.Vector3(32, 0, -82),
          ]
        : this.labyrinthStage === 2
        ? [
            // Safe start Mandrake flowers right ahead of spawn (-44, 106)
            new THREE.Vector3(-34, 0, 100),
            new THREE.Vector3(-25, 0, 110),
            new THREE.Vector3(-14, 0, 102),
            new THREE.Vector3(28, 0, 98),
            new THREE.Vector3(34, 0, 66),
            new THREE.Vector3(-4, 0, 64),
            new THREE.Vector3(28, 0, 44),
            new THREE.Vector3(48, 0, 22),
            new THREE.Vector3(28, 0, -6),
            new THREE.Vector3(-28, 0, -42),
            new THREE.Vector3(24, 0, -78),
          ]
        : [
            // Safe start Mandrake flowers right ahead of spawn (-40, 92)
            new THREE.Vector3(-31, 0, 87),
            new THREE.Vector3(-22, 0, 94),
            new THREE.Vector3(-11, 0, 88),
            new THREE.Vector3(6, 0, 90),
            new THREE.Vector3(28, 0, 78),
            new THREE.Vector3(-18, 0, 48),
            new THREE.Vector3(-28, 0, 14),
            new THREE.Vector3(24, 0, 8),
            new THREE.Vector3(24, 0, -32),
            new THREE.Vector3(-28, 0, -44),
            new THREE.Vector3(-14, 0, -78),
          ];
    herbSpots.forEach((p, i) => this.spawnHerbNode(p, i));

    // 3. Physics props for Telekinesis shields & Explosive Red Barrels along the Labyrinth (no grey obelisk towers!)
    const propSpots: Array<{ pos: THREE.Vector3; kind: PhysicsProp['kind']; name: string }> =
      this.labyrinthStage === 5 && stage5Specs
        ? stage5Specs.props.map((p) => ({
            pos: new THREE.Vector3(p.x, 0, p.z),
            kind: p.kind,
            name: p.name,
          }))
        : this.labyrinthStage === 4
        ? [
            { pos: new THREE.Vector3(-18, 0, 163), kind: 'shield', name: 'Рунный щит стража' },
            { pos: new THREE.Vector3(38, 0, 131), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(12, 0, 102), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(-42, 0, 63), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(0, 0, 29), kind: 'shield', name: 'Щит Древних' },
            { pos: new THREE.Vector3(-28, 0, -5), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(8, 0, -39), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(-26, 0, -73), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(8, 0, -107), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(-8, 0, -158), kind: 'shield', name: 'Щит Против Босса' },
            { pos: new THREE.Vector3(8, 0, -158), kind: 'barrel', name: 'Красная взрывная бочка' },
          ]
        : this.labyrinthStage === 3
        ? [
            { pos: new THREE.Vector3(-15, 0, this.labyrinthStartZ - 3), kind: 'shield', name: 'Рунный щит стража' },
            { pos: new THREE.Vector3(24, 0, 82), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(0, 0, 54), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(-44, 0, 18), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(16, 0, 2), kind: 'shield', name: 'Щит Древних' },
            { pos: new THREE.Vector3(44, 0, -28), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(0, 0, -82), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(-6, 0, -128), kind: 'shield', name: 'Щит Против Босса' },
            { pos: new THREE.Vector3(6, 0, -128), kind: 'barrel', name: 'Красная взрывная бочка' },
          ]
        : this.labyrinthStage === 2
        ? [
            { pos: new THREE.Vector3(-15, 0, this.labyrinthStartZ - 3), kind: 'shield', name: 'Рунный щит стража' },
            { pos: new THREE.Vector3(34, 0, 76), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(4, 0, 66), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(46, 0, 38), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(0, 0, -4), kind: 'shield', name: 'Щит Древних' },
            { pos: new THREE.Vector3(-28, 0, -46), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(28, 0, -76), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(-6, 0, -98), kind: 'shield', name: 'Щит Против Босса' },
            { pos: new THREE.Vector3(6, 0, -98), kind: 'barrel', name: 'Красная взрывная бочка' },
          ]
        : [
            { pos: new THREE.Vector3(-15, 0, this.labyrinthStartZ - 3), kind: 'shield', name: 'Рунный щит стража' },
            { pos: new THREE.Vector3(24, 0, 82), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(28, 0, 48), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(-22, 0, 40), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(0, 0, 8), kind: 'shield', name: 'Щит Древних' },
            { pos: new THREE.Vector3(28, 0, -28), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(-24, 0, -68), kind: 'barrel', name: 'Красная взрывная бочка' },
            { pos: new THREE.Vector3(-6, 0, this.labyrinthGoalPos.z + 26), kind: 'shield', name: 'Щит Против Босса' },
            { pos: new THREE.Vector3(6, 0, this.labyrinthGoalPos.z + 26), kind: 'barrel', name: 'Красная взрывная бочка' },
          ];
    propSpots.forEach((s, i) => this.spawnPhysicsProp(s.pos, s.kind, s.name, i));

    // 4. Enemies across the Labyrinth (pushed past the safe starting grove so zero enemies attack at spawn!)
    if (this.labyrinthStage === 1) {
      const stage1Enemies: Array<{ pos: THREE.Vector3; arch: EnemyActor['archetype'] }> = [
        // First enemies placed near the East turn (X >= 28, Z <= 78), well beyond the safe starting grove!
        { pos: new THREE.Vector3(28, 0, 78), arch: 'rat_swarmer' },
        { pos: new THREE.Vector3(38, 0, 72), arch: 'rat_swarmer' },
        { pos: new THREE.Vector3(36, 0, 58), arch: 'sky_dive_gargoyle' },
        { pos: new THREE.Vector3(26, 0, 50), arch: 'dark_kiter' },
        { pos: new THREE.Vector3(6, 0, 48), arch: 'rat_swarmer' },
        // Mid-labyrinth corridors after Cat Mursik sanctuary (strictly outside the 3 Secret Rooms!)
        { pos: new THREE.Vector3(-24, 0, 34), arch: 'sky_dive_gargoyle' },
        { pos: new THREE.Vector3(-36, 0, 14), arch: 'rat_swarmer' },
        { pos: new THREE.Vector3(-22, 0, 10), arch: 'rat_swarmer' },
        { pos: new THREE.Vector3(-8, 0, 8), arch: 'frost_charger' },
        { pos: new THREE.Vector3(18, 0, 8), arch: 'storm_harpy_shooter' },
        { pos: new THREE.Vector3(26, 0, -4), arch: 'dark_kiter' },
        { pos: new THREE.Vector3(34, 0, -26), arch: 'sky_dive_gargoyle' },
        { pos: new THREE.Vector3(14, 0, -30), arch: 'rat_swarmer' },
        { pos: new THREE.Vector3(0, 0, -32), arch: 'frost_charger' },
        { pos: new THREE.Vector3(-22, 0, -38), arch: 'dark_kiter' },
        { pos: new THREE.Vector3(-34, 0, -58), arch: 'storm_harpy_shooter' },
        { pos: new THREE.Vector3(-12, 0, -68), arch: 'sky_dive_gargoyle' },
        // END OF STAGE 1 BOSS guarding the Portal at Z = -82!
        { pos: new THREE.Vector3(0, 0, -82), arch: 'boss_mage_1' },
      ];
      stage1Enemies.forEach((spec, idx) => {
        this.spawnSingleEnemy(spec.arch, spec.pos, idx, 1);
      });
    } else if (this.labyrinthStage === 2) {
      // STAGE 2: Placed strictly inside open 20m maze corridors & chambers (away from walls & spike zones!)
      const stage2Enemies: Array<{ pos: THREE.Vector3; arch: EnemyActor['archetype'] }> = [
        { pos: new THREE.Vector3(36, 0, 96), arch: 'rat_swarmer' },
        { pos: new THREE.Vector3(48, 0, 74), arch: 'sky_dive_gargoyle' },
        { pos: new THREE.Vector3(32, 0, 64), arch: 'frost_charger' },
        { pos: new THREE.Vector3(0, 0, 66), arch: 'storm_harpy_shooter' },
        { pos: new THREE.Vector3(-34, 0, 68), arch: 'dark_kiter' },
        { pos: new THREE.Vector3(-28, 0, 22), arch: 'sky_dive_gargoyle' },
        { pos: new THREE.Vector3(6, 0, 22), arch: 'rat_swarmer' },
        { pos: new THREE.Vector3(48, 0, 26), arch: 'dark_kiter' },
        { pos: new THREE.Vector3(26, 0, 46), arch: 'frost_charger' },
        { pos: new THREE.Vector3(28, 0, -4), arch: 'storm_harpy_shooter' },
        { pos: new THREE.Vector3(0, 0, -4), arch: 'sky_dive_gargoyle' },
        { pos: new THREE.Vector3(-28, 0, -4), arch: 'frost_charger' },
        { pos: new THREE.Vector3(-28, 0, -28), arch: 'dark_kiter' },
        { pos: new THREE.Vector3(-28, 0, -56), arch: 'sky_dive_gargoyle' },
        { pos: new THREE.Vector3(4, 0, -52), arch: 'storm_harpy_shooter' },
        { pos: new THREE.Vector3(28, 0, -28), arch: 'dark_kiter' },
        { pos: new THREE.Vector3(28, 0, -78), arch: 'frost_charger' },
        { pos: new THREE.Vector3(-24, 0, -80), arch: 'sky_dive_gargoyle' },
        // END OF STAGE 2 BOSS + 2 ALLIED SHOOTING TOTEMS inside the Stage 2 Boss Arena (Z in [-120..-94])!
        { pos: new THREE.Vector3(-9.5, 0, -102), arch: 'boss_totem' },
        { pos: new THREE.Vector3(9.5, 0, -102), arch: 'boss_totem' },
        { pos: new THREE.Vector3(0, 0, -106), arch: 'boss_mage_2' },
      ];
      stage2Enemies.forEach((spec, idx) => {
        this.spawnSingleEnemy(spec.arch, spec.pos, idx, 2);
      });
    } else if (this.labyrinthStage === 3) {
      // STAGE 3: Fewer rats (`Крыс меньше с 3 уровня`) and fast Wild Boars (`wild_boar`) along the open 24m maze corridors!
      const stage3Enemies: Array<{ pos: THREE.Vector3; arch: EnemyActor['archetype'] }> = [
        { pos: new THREE.Vector3(32, 0, 134), arch: 'sky_dive_gargoyle' },
        { pos: new THREE.Vector3(50, 0, 92), arch: 'dark_kiter' },
        { pos: new THREE.Vector3(24, 0, 80), arch: 'wild_boar' },
        { pos: new THREE.Vector3(-6, 0, 84), arch: 'storm_harpy_shooter' },
        { pos: new THREE.Vector3(-36, 0, 84), arch: 'wild_boar' },
        { pos: new THREE.Vector3(-28, 0, 108), arch: 'sky_dive_gargoyle' },
        { pos: new THREE.Vector3(-28, 0, 56), arch: 'dark_kiter' },
        { pos: new THREE.Vector3(0, 0, 56), arch: 'frost_charger' },
        { pos: new THREE.Vector3(36, 0, 52), arch: 'storm_harpy_shooter' },
        { pos: new THREE.Vector3(-12, 0, 2), arch: 'wild_boar' },
        { pos: new THREE.Vector3(-44, 0, 18), arch: 'frost_charger' },
        { pos: new THREE.Vector3(24, 0, 26), arch: 'dark_kiter' },
        { pos: new THREE.Vector3(14, 0, 2), arch: 'sky_dive_gargoyle' },
        { pos: new THREE.Vector3(48, 0, 2), arch: 'storm_harpy_shooter' },
        { pos: new THREE.Vector3(52, 0, -22), arch: 'wild_boar' },
        { pos: new THREE.Vector3(38, 0, -38), arch: 'sky_dive_gargoyle' },
        { pos: new THREE.Vector3(6, 0, -34), arch: 'dark_kiter' },
        { pos: new THREE.Vector3(-28, 0, -22), arch: 'frost_charger' },
        { pos: new THREE.Vector3(-38, 0, -36), arch: 'storm_harpy_shooter' },
        { pos: new THREE.Vector3(-38, 0, -84), arch: 'wild_boar' },
        { pos: new THREE.Vector3(-6, 0, -82), arch: 'dark_kiter' },
        { pos: new THREE.Vector3(0, 0, -68), arch: 'frost_charger' },
        { pos: new THREE.Vector3(38, 0, -64), arch: 'storm_harpy_shooter' },
        { pos: new THREE.Vector3(48, 0, -82), arch: 'wild_boar' },
        { pos: new THREE.Vector3(28, 0, -106), arch: 'dark_kiter' },
        // END OF STAGE 3 TELEPORTING BOSS + 2 ALLIED TOTEMS inside the Stage 3 Boss Arena (Z in [-152..-122])!
        { pos: new THREE.Vector3(-11, 0, -130), arch: 'boss_totem' },
        { pos: new THREE.Vector3(11, 0, -130), arch: 'boss_totem' },
        { pos: new THREE.Vector3(0, 0, -134), arch: 'boss_mage_3' },
      ];
      stage3Enemies.forEach((spec, idx) => {
        this.spawnSingleEnemy(spec.arch, spec.pos, idx, 4);
      });
    } else if (this.labyrinthStage === 4) {
      // STAGE 4 TRUE MAZE: Strengthened Fire Demons (`fire_demon`), Water Monsters (`water_monster`),
      // Stone Crushers (`stone_crusher`), Wild Boars (`wild_boar`), plus Tri-Elemental Boss (`boss_elemental_4`)!
      const stage4Enemies: Array<{ pos: THREE.Vector3; arch: EnemyActor['archetype'] }> = [
        { pos: new THREE.Vector3(46, 0, 166), arch: 'fire_demon' },
        { pos: new THREE.Vector3(62, 0, 131), arch: 'stone_crusher' },
        { pos: new THREE.Vector3(38, 0, 131), arch: 'water_monster' },
        { pos: new THREE.Vector3(-24, 0, 131), arch: 'wild_boar' },
        { pos: new THREE.Vector3(-56, 0, 131), arch: 'dark_kiter' },
        { pos: new THREE.Vector3(-60, 0, 97), arch: 'stone_crusher' },
        { pos: new THREE.Vector3(-4, 0, 102), arch: 'water_monster' },
        { pos: new THREE.Vector3(18, 0, 102), arch: 'fire_demon' },
        { pos: new THREE.Vector3(62, 0, 97), arch: 'sky_dive_gargoyle' },
        { pos: new THREE.Vector3(60, 0, 63), arch: 'water_monster' },
        { pos: new THREE.Vector3(26, 0, 63), arch: 'wild_boar' },
        { pos: new THREE.Vector3(-28, 0, 63), arch: 'fire_demon' },
        { pos: new THREE.Vector3(-62, 0, 63), arch: 'dark_kiter' },
        { pos: new THREE.Vector3(-62, 0, 29), arch: 'water_monster' },
        { pos: new THREE.Vector3(-10, 0, 29), arch: 'stone_crusher' },
        { pos: new THREE.Vector3(12, 0, 29), arch: 'wild_boar' },
        { pos: new THREE.Vector3(58, 0, 29), arch: 'storm_harpy_shooter' },
        { pos: new THREE.Vector3(66, 0, 2), arch: 'water_monster' },
        { pos: new THREE.Vector3(6, 0, -5), arch: 'fire_demon' },
        { pos: new THREE.Vector3(-38, 0, -5), arch: 'stone_crusher' },
        { pos: new THREE.Vector3(-64, 0, -5), arch: 'dark_kiter' },
        { pos: new THREE.Vector3(-60, 0, -34), arch: 'fire_demon' },
        { pos: new THREE.Vector3(-8, 0, -34), arch: 'water_monster' },
        { pos: new THREE.Vector3(28, 0, -34), arch: 'wild_boar' },
        { pos: new THREE.Vector3(66, 0, -34), arch: 'stone_crusher' },
        { pos: new THREE.Vector3(56, 0, -73), arch: 'fire_demon' },
        { pos: new THREE.Vector3(-16, 0, -73), arch: 'water_monster' },
        { pos: new THREE.Vector3(-56, 0, -73), arch: 'stone_crusher' },
        { pos: new THREE.Vector3(-64, 0, -125), arch: 'water_monster' },
        { pos: new THREE.Vector3(-24, 0, -107), arch: 'wild_boar' },
        { pos: new THREE.Vector3(6, 0, -107), arch: 'stone_crusher' },
        { pos: new THREE.Vector3(58, 0, -107), arch: 'fire_demon' },
        { pos: new THREE.Vector3(38, 0, -138), arch: 'stone_crusher' },
        { pos: new THREE.Vector3(-38, 0, -138), arch: 'fire_demon' },
        // END OF STAGE 4 TRI-ELEMENTAL BOSS + 2 ALLIED TOTEMS guarding the Portal at Z = -172!
        { pos: new THREE.Vector3(-14, 0, -158), arch: 'boss_totem' },
        { pos: new THREE.Vector3(14, 0, -158), arch: 'boss_totem' },
        { pos: new THREE.Vector3(0, 0, -163), arch: 'boss_elemental_4' },
      ];
      stage4Enemies.forEach((spec, idx) => {
        this.spawnSingleEnemy(spec.arch, spec.pos, idx, 6);
      });
    } else if (this.labyrinthStage === 5 && stage5Specs) {
      // STAGE 5 ("Великие Катакомбы Древних"):
      // Populated with Mud Monsters (`mud_monster`), Cave Bears (`cave_bear`), Skeleton Archers (`skeleton_archer`),
      // Skeleton Hammer-Shield Warriors (`skeleton_hammer_shield`), and the Giant 3-Phase Splitting Worm Boss (`boss_worm_5_p1`)!
      stage5Specs.enemies.forEach((spec, idx) => {
        this.spawnSingleEnemy(spec.arch, new THREE.Vector3(spec.x, 0, spec.z), idx, 8);
      });
    }

    // 5. Explosive Floor Traps (14 on Stage 1, 18 on Stage 2, 24 on Stage 3, 28 on Stage 4)
    const stageTraps = getLabyrinthFloorTraps(this.labyrinthStage);
    stageTraps.forEach((trapSpec, idx) => {
      this.spawnFloorTrap(trapSpec, idx);
    });

    // 6. Full-Width Blue Laser Beam Traps (5 on Stage 2, 6 horizontal on Stage 3, 8 on Stage 4)
    const stageLaserTraps = getLabyrinthLaserTraps(this.labyrinthStage);
    stageLaserTraps.forEach((laserSpec, idx) => {
      this.spawnLaserBeamTrap(laserSpec, idx);
    });

    // 7. Sequential Wave Spike Trap Zones (`Ловушка Шипы`, Enshrouded-style wave timing: Stage 2 [3,3], Stage 3 [4,4,4], Stage 4 [3,4,5])
    const stageSpikeZones = getLabyrinthSpikeTrapZones(this.labyrinthStage);
    stageSpikeZones.forEach((spikeSpec, idx) => {
      this.spawnSpikeTrapZone(spikeSpec, idx);
    });

    // 8. Treasure Chests (`Сундуки с ресурсами и артефактами`: Stage 1: 4, Stage 2: 5, Stage 3: 6, Stage 4: 6)
    const stageChests = getLabyrinthChests(this.labyrinthStage);
    stageChests.forEach((chestSpec, idx) => {
      this.spawnTreasureChest(chestSpec, idx);
    });

    // 9. Solid Sliding Rune Gates & Secret Room Doors + Elemental Magic Buttons (Floor & Wall)
    const stageRuneGates = getLabyrinthRuneGates(this.labyrinthStage);
    stageRuneGates.forEach((gateSpec, idx) => {
      this.spawnRuneGateAndButtons(gateSpec, idx);
    });
  }

  private spawnSpikeTrapZone(spec: SpikeTrapZoneSpec, idx: number) {
    const zoneGroup = new THREE.Group();
    zoneGroup.position.set(spec.x, 0, spec.z);

    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.72,
      metalness: 0.65,
    });
    const slotMat = new THREE.MeshBasicMaterial({
      color: 0x090d16,
    });
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      emissive: 0x991b1b,
      emissiveIntensity: 0.35,
      roughness: 0.22,
      metalness: 0.92,
    });

    const lineGroups: THREE.Group[] = [];
    const lineWarnStrips: THREE.Mesh[] = [];

    for (let i = 0; i < spec.lines.length; i++) {
      const line = spec.lines[i];
      const localZ = line.centerZ - spec.z;

      // Floor metal grate plate spanning 100% wall-to-wall across the corridor
      const grate = new THREE.Mesh(
        new THREE.BoxGeometry(spec.width - 0.3, 0.06, spec.lineDepth - 0.25),
        plateMat
      );
      grate.position.set(0, 0.03, localZ);
      zoneGroup.add(grate);

      // Glowing warning strip along each spike row
      const warnMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.3,
      });
      const warnStrip = new THREE.Mesh(
        new THREE.PlaneGeometry(spec.width - 0.5, spec.lineDepth - 0.45),
        warnMat
      );
      warnStrip.rotation.x = -Math.PI / 2;
      warnStrip.position.set(0, 0.068, localZ);
      zoneGroup.add(warnStrip);
      lineWarnStrips.push(warnStrip);

      // Movable spike bed for this line
      const spikesHolder = new THREE.Group();
      spikesHolder.position.set(0, -1.15, localZ);

      const cols = Math.max(6, Math.floor(spec.width / 1.65));
      const subRows = 2;
      for (let r = 0; r < subRows; r++) {
        const rz = (r - 0.5) * (spec.lineDepth * 0.46);
        for (let c = 0; c < cols; c++) {
          const cx = -spec.width * 0.45 + (c / Math.max(1, cols - 1)) * (spec.width * 0.9);
          const hole = new THREE.Mesh(new THREE.CircleGeometry(0.24, 8), slotMat);
          hole.rotation.x = -Math.PI / 2;
          hole.position.set(cx, 0.072, localZ + rz);
          zoneGroup.add(hole);

          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.21, 1.38, 6), spikeMat);
          spike.position.set(cx, 0.69, rz);
          spikesHolder.add(spike);
        }
      }

      zoneGroup.add(spikesHolder);
      lineGroups.push(spikesHolder);
    }

    const badge = this.createBillboardBadge(
      `🩸 ${spec.label}`,
      '#ef4444',
      `Волна шипов (${spec.lineCount} ряда по очереди) · Урон ${spec.damage}`
    );
    badge.scale.set(3.8, 1.0, 1);
    badge.position.set(0, 3.6, 0);
    zoneGroup.add(badge);

    this.worldContentGroup.add(zoneGroup);
    this.spikeTrapZones.push({
      id: spec.id,
      spec,
      mesh: zoneGroup,
      lineGroups,
      lineWarnStrips,
      hitCooldown: 0,
      elapsedTime: idx * 0.65,
    });
  }

  private spawnTreasureChest(spec: LabyrinthChestSpec, idx: number) {
    const group = new THREE.Group();
    group.position.set(spec.x, 0, spec.z);
    this.addContactShadow(group, 1.15);

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.68,
      metalness: 0.18,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.88,
    });
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.6,
      roughness: 0.12,
    });

    // Chest base box
    const baseBox = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.82, 1.05), woodMat);
    baseBox.position.y = 0.41;
    const bandL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.86, 1.1), goldMat);
    bandL.position.set(-0.52, 0.42, 0);
    const bandR = bandL.clone();
    bandR.position.x = 0.52;
    const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.12), goldMat);
    lockPlate.position.set(0, 0.68, 0.54);
    const lockGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), gemMat);
    lockGem.position.set(0, 0.68, 0.62);
    group.add(baseBox, bandL, bandR, lockPlate, lockGem);

    // Hinged lid pivot at the back edge (y = 0.82, z = -0.5)
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.82, -0.5);
    const lidMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.52, 1.55, 12, 1, false, 0, Math.PI),
      woodMat
    );
    lidMesh.rotation.z = Math.PI / 2;
    lidMesh.position.set(0, 0, 0.5);
    const lidStrapL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.16, 12, 1, false, 0, Math.PI),
      goldMat
    );
    lidStrapL.rotation.z = Math.PI / 2;
    lidStrapL.position.set(-0.52, 0, 0.5);
    const lidStrapR = lidStrapL.clone();
    lidStrapR.position.x = 0.52;
    lidPivot.add(lidMesh, lidStrapL, lidStrapR);
    group.add(lidPivot);

    // Golden floor aura ring
    const ringGeo = new THREE.RingGeometry(1.1, 1.38, 28);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const glowRing = new THREE.Mesh(ringGeo, ringMat);
    glowRing.position.y = 0.04;
    group.add(glowRing);

    const badgeSubtitle =
      spec.artifactPool.length > 0
        ? '[E] Осмотреть (Ресурсы + Артефакт)'
        : '[E] Осмотреть (Ресурсы)';
    const badge = this.createBillboardBadge(
      `🎁 ${spec.label}`,
      '#facc15',
      badgeSubtitle
    );
    badge.scale.set(3.4, 0.92, 1);
    badge.position.set(0, 2.25, 0);
    group.add(badge);

    this.worldContentGroup.add(group);
    this.chests.push({
      id: spec.id,
      spec,
      mesh: group,
      lidPivot,
      glowRing,
      badgeSprite: badge,
      position: new THREE.Vector3(spec.x, 0, spec.z),
      opened: false,
      looted: false,
      contents: null,
      openAnimProgress: 0,
      animPhase: idx * 1.1,
    });
  }

  private buildChestContents(spec: LabyrinthChestSpec): {
    reagents: Array<{ id: ReagentId; count: number }>;
    artifactId: ArtifactId | null;
  } {
    const rolled = rollChestLoot(spec, []);
    const reagents = (Object.entries(rolled.reagents) as Array<[ReagentId, number]>)
      .filter(([, count]) => count && count > 0)
      .map(([id, count]) => ({ id, count: count || 1 }));
    return {
      reagents,
      artifactId: rolled.artifactId,
    };
  }

  public openTreasureChest(chest: TreasureChestActor, fromRemote = false) {
    if (chest.opened) return;
    chest.opened = true;
    if (!chest.contents) {
      chest.contents = this.buildChestContents(chest.spec);
    }

    chest.mesh.remove(chest.badgeSprite);
    const openedBadge = this.createBillboardBadge(
      `👁️ ${chest.spec.label}`,
      '#38bdf8',
      'Нажмите [E] ещё раз — Взять!'
    );
    openedBadge.scale.set(3.2, 0.88, 1);
    openedBadge.position.set(0, 2.25, 0);
    chest.badgeSprite = openedBadge;
    chest.mesh.add(openedBadge);

    (chest.glowRing.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
    this.spawnParticles(_v1.copy(chest.position).setY(1.0), 0xfacc15, 24, 6.0);
    audioEngine.playPickupChime();

    if (fromRemote) {
      chest.looted = true;
    }
    this.pushHudSnapshot();
  }

  public lootTreasureChest(chest: TreasureChestActor, fromRemote = false) {
    if (chest.looted) return;
    if (!chest.opened) {
      chest.opened = true;
    }
    const finalContents = chest.contents ?? this.buildChestContents(chest.spec);
    chest.contents = finalContents;
    chest.looted = true;

    chest.mesh.remove(chest.badgeSprite);
    const lootedBadge = this.createBillboardBadge(
      `✨ ${chest.spec.label}`,
      '#22c55e',
      'Сундук пуст (Взято)'
    );
    lootedBadge.scale.set(3.1, 0.84, 1);
    lootedBadge.position.set(0, 2.25, 0);
    chest.badgeSprite = lootedBadge;
    chest.mesh.add(lootedBadge);

    (chest.glowRing.material as THREE.MeshBasicMaterial).color.setHex(0x22c55e);
    this.spawnParticles(_v1.copy(chest.position).setY(1.0), 0xfacc15, 36, 7.5);
    this.spawnParticles(_v1.copy(chest.position).setY(1.0), 0x22c55e, 24, 6.0);
    audioEngine.playVictoryFanfare();

    if (!fromRemote) {
      this.emitWorldEvent({
        kind: 'chest_open',
        stage: this.labyrinthStage,
        targetId: chest.id,
      });
      this.callbacks.onChestLooted?.(chest.spec, finalContents);
      this.callbacks.onChestOpened?.(chest.spec);
    }
    this.pushHudSnapshot();
  }

  public collectActivePreviewChest(): boolean {
    for (const chest of this.chests) {
      if (chest.opened && !chest.looted && chest.position.distanceTo(this.playerPos) <= 4.5) {
        this.lootTreasureChest(chest, false);
        return true;
      }
    }
    return false;
  }

  private spawnRuneGateAndButtons(spec: LabyrinthRuneGateSpec, _idx: number) {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(spec.x, 0, spec.z);

    const doorWidth = spec.w / 2;
    const doorHeight = 5.4;
    const doorDepth = spec.d;

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.72,
      metalness: 0.35,
      flatShading: true,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.85,
      flatShading: true,
    });
    const runeCoreMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.5,
      roughness: 0.15,
    });

    const buildDoorHalf = (sideSign: -1 | 1): THREE.Group => {
      const half = new THREE.Group();
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth),
        stoneMat
      );
      slab.position.set(sideSign * (doorWidth / 2), doorHeight / 2, 0);
      half.add(slab);

      const topBar = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth, 0.36, doorDepth + 0.24),
        trimMat
      );
      topBar.position.set(sideSign * (doorWidth / 2), doorHeight - 0.18, 0);
      const midBar = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth, 0.28, doorDepth + 0.28),
        trimMat
      );
      midBar.position.set(sideSign * (doorWidth / 2), doorHeight * 0.5, 0);
      half.add(topBar, midBar);

      const sealCrystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.65, 0),
        runeCoreMat
      );
      sealCrystal.position.set(sideSign * 1.4, doorHeight * 0.5, 0);
      half.add(sealCrystal);
      return half;
    };

    const leftDoor = buildDoorHalf(-1);
    const rightDoor = buildDoorHalf(1);
    gateGroup.add(leftDoor, rightDoor);

    const badge = this.createBillboardBadge(
      `🔒 ${spec.label}`,
      '#f59e0b',
      `Кнопки магии: 0 / ${spec.buttons.length}`
    );
    badge.scale.set(4.2, 1.15, 1);
    badge.position.set(0, 6.5, 0);
    gateGroup.add(badge);

    this.worldContentGroup.add(gateGroup);

    const pad = 0.85;
    const wallBox: WallBox = {
      minX: spec.x - spec.w / 2 - pad,
      maxX: spec.x + spec.w / 2 + pad,
      minZ: spec.z - spec.d / 2 - pad,
      maxZ: spec.z + spec.d / 2 + pad,
    };

    this.runeGates.push({
      id: spec.id,
      spec,
      mesh: gateGroup,
      leftDoor,
      rightDoor,
      badgeSprite: badge,
      wallBox,
      isOpen: false,
      openingProgress: 0,
      buttonsActivated: 0,
      totalButtons: spec.buttons.length,
    });

    // Spawn each Elemental Magic Button (on Floor or Wall) required for this Gate (30% smaller via RUNE_BUTTON_SCALE = 0.7)
    spec.buttons.forEach((btnSpec, bIdx) => {
      const btnGroup = new THREE.Group();
      btnGroup.position.set(btnSpec.x, btnSpec.y, btnSpec.z);
      btnGroup.scale.setScalar(RUNE_BUTTON_SCALE);

      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.55,
        metalness: 0.7,
        flatShading: true,
      });
      const crystalMat = new THREE.MeshStandardMaterial({
        color: btnSpec.colorHex,
        emissive: btnSpec.colorHex,
        emissiveIntensity: 1.75,
        roughness: 0.12,
        metalness: 0.25,
      });
      const ringMat = new THREE.MeshBasicMaterial({
        color: btnSpec.colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      });

      let crystalMesh: THREE.Mesh;
      let ringMesh: THREE.Mesh;

      if (btnSpec.mount === 'floor') {
        const plate = new THREE.Mesh(
          new THREE.CylinderGeometry(1.05, 1.25, 0.24, 12),
          baseMat
        );
        plate.position.y = 0.12;
        btnGroup.add(plate);

        const rGeo = new THREE.RingGeometry(0.68, 0.96, 24);
        rGeo.rotateX(-Math.PI / 2);
        ringMesh = new THREE.Mesh(rGeo, ringMat);
        ringMesh.position.y = 0.26;
        btnGroup.add(ringMesh);

        crystalMesh = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.46, 0),
          crystalMat
        );
        crystalMesh.position.y = 0.72;
        btnGroup.add(crystalMesh);
      } else {
        // Wall-mounted arcane switch plate
        const wallPlate = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 1.5, 0.35),
          baseMat
        );
        btnGroup.add(wallPlate);

        const rGeo = new THREE.RingGeometry(0.52, 0.74, 24);
        ringMesh = new THREE.Mesh(rGeo, ringMat);
        ringMesh.position.z = 0.2;
        btnGroup.add(ringMesh);

        crystalMesh = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.44, 0),
          crystalMat
        );
        crystalMesh.position.y = 0.0;
        btnGroup.add(crystalMesh);
      }

      const mountText = btnSpec.mount === 'wall' ? 'На стене' : 'На полу';
      const btnBadge = this.createBillboardBadge(
        `🎯 Кнопка (${mountText})`,
        btnSpec.colorHex,
        `Выстрелите: ${btnSpec.spellLabel}`
      );
      btnBadge.scale.set(3.2, 0.9, 1);
      btnBadge.position.set(0, btnSpec.mount === 'wall' ? 1.45 : 1.95, 0);
      btnGroup.add(btnBadge);

      this.worldContentGroup.add(btnGroup);
      this.runeButtons.push({
        id: btnSpec.id,
        spec: btnSpec,
        mesh: btnGroup,
        crystalMesh,
        ringMesh,
        badgeSprite: btnBadge,
        position: new THREE.Vector3(btnSpec.x, btnSpec.y, btnSpec.z),
        activated: false,
        animPhase: bIdx * 1.4,
      });
    });
  }

  public activateRuneButton(buttonId: string, fromRemote = false) {
    const btn = this.runeButtons.find((b) => b.id === buttonId);
    if (!btn || btn.activated) return;
    btn.activated = true;

    const cMat = btn.crystalMesh.material as THREE.MeshStandardMaterial;
    cMat.color.set('#22c55e');
    cMat.emissive.set('#16a34a');
    cMat.emissiveIntensity = 2.1;

    const rMat = btn.ringMesh.material as THREE.MeshBasicMaterial;
    rMat.color.set('#22c55e');

    btn.mesh.remove(btn.badgeSprite);
    const nextBadge = this.createBillboardBadge(
      `✅ Кнопка активна`,
      '#22c55e',
      btn.spec.spellLabel
    );
    nextBadge.scale.set(3.0, 0.85, 1);
    nextBadge.position.set(0, btn.spec.mount === 'wall' ? 1.45 : 1.95, 0);
    btn.badgeSprite = nextBadge;
    btn.mesh.add(nextBadge);

    this.spawnParticles(btn.position, 0x22c55e, 28, 6.5);
    audioEngine.playPickupChime();

    if (!fromRemote) {
      this.callbacks.onQuestEvent('activate_rune_button', 1);
      this.emitWorldEvent({
        kind: 'rune_button',
        stage: this.labyrinthStage,
        targetId: btn.id,
      });
    }

    const gate = this.runeGates.find((g) => g.id === btn.spec.gateId);
    if (gate) {
      gate.buttonsActivated = this.runeButtons.filter(
        (b) => b.spec.gateId === gate.id && b.activated
      ).length;

      gate.mesh.remove(gate.badgeSprite);
      if (gate.buttonsActivated >= gate.totalButtons && !gate.isOpen) {
        gate.isOpen = true;
        const openBadge = this.createBillboardBadge(
          `🔓 ${gate.spec.label}`,
          '#22c55e',
          `Ворота открыты (${gate.buttonsActivated}/${gate.totalButtons})`
        );
        openBadge.scale.set(4.2, 1.15, 1);
        openBadge.position.set(0, 6.5, 0);
        gate.badgeSprite = openBadge;
        gate.mesh.add(openBadge);

        this.spawnParticles(
          new THREE.Vector3(gate.spec.x, 2.5, gate.spec.z),
          0x22c55e,
          42,
          9.0
        );
        audioEngine.playVictoryFanfare();
        this.lastCastBanner = {
          spellName: `🔓 Все кнопки нажаты (${gate.buttonsActivated}/${gate.totalButtons})! Сплошные ворота раздвигаются!`,
          qualityPercent: 100,
          damage: 0,
          detail: '',
          color: '#22c55e',
          timestamp: performance.now(),
        };
      } else {
        const progressBadge = this.createBillboardBadge(
          `🔒 ${gate.spec.label}`,
          '#f59e0b',
          `Кнопки магии: ${gate.buttonsActivated} / ${gate.totalButtons}`
        );
        progressBadge.scale.set(4.2, 1.15, 1);
        progressBadge.position.set(0, 6.5, 0);
        gate.badgeSprite = progressBadge;
        gate.mesh.add(progressBadge);

        this.lastCastBanner = {
          spellName: `✨ Кнопка «${btn.spec.spellLabel}» нажата (${gate.buttonsActivated}/${gate.totalButtons})!`,
          qualityPercent: 100,
          damage: 0,
          detail: '',
          color: btn.spec.colorHex,
          timestamp: performance.now(),
        };
      }
    }
    this.pushHudSnapshot();
  }

  private emitWorldEvent(payload: SharedWorldEventPayload) {
    if (
      this.mapMode === 'labyrinth' &&
      this.labyrinthMultiplayerMode === 'shared' &&
      this.callbacks.onMultiplayerWorldEvent
    ) {
      this.callbacks.onMultiplayerWorldEvent(payload);
    }
  }

  private spawnLaserBeamTrap(spec: LaserBeamTrapSpec, idx: number) {
    const group = new THREE.Group();
    group.position.set(spec.x, 0, spec.z);
    if (spec.axis === 'z') {
      group.rotation.y = Math.PI / 2;
    }

    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.85,
      flatShading: true,
    });
    const emitterCrystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.9,
      roughness: 0.15,
      metalness: 0.2,
    });

    const halfSpan = spec.span / 2;
    for (const sideSign of [-1, 1]) {
      const pylon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.36, 1.85, 8),
        pylonMat
      );
      pylon.position.set(sideSign * (halfSpan - 0.15), 0.925, 0);
      group.add(pylon);

      for (const beamY of [0.62, 1.22]) {
        const emitter = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.22, 0),
          emitterCrystalMat
        );
        emitter.position.set(sideSign * (halfSpan - 0.25), beamY, 0);
        group.add(emitter);
      }
    }

    const beamGroup = new THREE.Group();
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
    });
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
    });

    for (const beamY of [0.62, 1.22]) {
      const coreGeo = new THREE.CylinderGeometry(0.055, 0.055, spec.span, 10);
      coreGeo.rotateZ(Math.PI / 2);
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.y = beamY;

      const glowGeo = new THREE.CylinderGeometry(0.16, 0.16, spec.span, 12);
      glowGeo.rotateZ(Math.PI / 2);
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.y = beamY;

      beamGroup.add(coreMesh, glowMesh);
    }

    group.add(beamGroup);
    this.worldContentGroup.add(group);

    this.laserTraps.push({
      id: spec.id,
      spec,
      mesh: group,
      beamGroup,
      position: new THREE.Vector3(spec.x, 0, spec.z),
      cooldown: 0,
      animPhase: idx * 1.3,
    });
  }

  public triggerLaserBeamTrap(laser: LaserBeamTrapActor, fromRemote = false) {
    if (laser.cooldown > 0) return;
    laser.cooldown = laser.spec.respawnSec; // Disappears for 60 seconds!
    laser.beamGroup.visible = false;

    const hitPos = _v1.copy(fromRemote ? laser.position : this.playerPos).setY(1.0);
    this.spawnParticles(hitPos, 0x38bdf8, 36, 8.5);
    this.spawnParticles(hitPos, 0xe0f2fe, 20, 6.0);
    audioEngine.playHeavyImpact(true);

    if (!fromRemote) {
      this.emitWorldEvent({
        kind: 'laser_trap',
        stage: this.labyrinthStage,
        targetId: laser.id,
      });
      if (!this.testInvulnerable) {
        this.tookDamageThisStage = true;
        audioEngine.playPlayerHurt();
        this.hp = Math.max(0, this.hp - laser.spec.damage);
        this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.68);
      }

      this.lastCastBanner = {
        spellName: this.testInvulnerable
          ? `🛡️ Синий луч поглощён неуязвимостью (0 ОЗ)`
          : `⚡ Синий луч ловушки! -${laser.spec.damage} ОЗ (исчез на ${laser.spec.respawnSec}с)`,
        qualityPercent: 100,
        damage: this.testInvulnerable ? 0 : laser.spec.damage,
        detail: '',
        color: '#38bdf8',
        timestamp: performance.now(),
      };

      if (!this.testInvulnerable && this.hp <= 0 && this.mode === 'playing') {
        this.mode = 'gameover';
        audioEngine.playDefeatSting();
        this.callbacks.onGameOver(false, {
          score: this.score,
          wave: this.wave,
          enemiesDefeated: this.enemiesDefeated,
        });
      }
    }
    this.pushHudSnapshot();
  }

  private spawnFloorTrap(spec: FloorTrapSpec, idx: number) {
    const group = new THREE.Group();
    group.position.set(spec.x, 0.02, spec.z);
    // +20% larger trap size as requested ("И сделай ловушки на 20 % больше размером")
    group.scale.setScalar(FLOOR_TRAP_SCALE_MULTIPLIER);

    // Scorched dark stone base ring (remains visible even after detonation)
    const baseRingMat = new THREE.MeshStandardMaterial({
      color: 0x1f2430,
      roughness: 0.85,
      metalness: 0.45,
    });
    const basePlate = new THREE.Mesh(
      new THREE.CylinderGeometry(1.18, 1.28, 0.05, 18),
      baseRingMat
    );
    basePlate.position.y = 0.025;
    group.add(basePlate);

    // Armed visuals (hidden after detonation)
    const armedGroup = new THREE.Group();
    group.add(armedGroup);

    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.35,
      metalness: 0.8,
    });
    for (let s = 0; s < 6; s++) {
      const angle = (s / 6) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 4), spikeMat);
      spike.position.set(Math.cos(angle) * 1.05, 0.14, Math.sin(angle) * 1.05);
      spike.rotation.z = Math.cos(angle) * 0.4;
      spike.rotation.x = -Math.sin(angle) * 0.4;
      armedGroup.add(spike);
    }

    const runeMat = new THREE.MeshBasicMaterial({
      color: 0xff3b00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const runeGeo = new THREE.RingGeometry(0.58, 0.88, 24);
    runeGeo.rotateX(-Math.PI / 2);
    const runeRing = new THREE.Mesh(runeGeo, runeMat);
    runeRing.position.y = 0.065;

    const crossBarGeo1 = new THREE.PlaneGeometry(1.45, 0.12);
    crossBarGeo1.rotateX(-Math.PI / 2);
    const crossBar1 = new THREE.Mesh(crossBarGeo1, runeMat);
    const crossBar2 = new THREE.Mesh(crossBarGeo1, runeMat);
    crossBar2.rotation.y = Math.PI / 2;
    runeRing.add(crossBar1, crossBar2);
    armedGroup.add(runeRing);

    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff2200,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    const coreCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), coreMat);
    coreCrystal.position.y = 0.22;
    armedGroup.add(coreCrystal);

    // Expanding fiery shockwave sphere when stepped on
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const shockwaveMesh = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 12), shockwaveMat);
    shockwaveMesh.position.y = 0.35;
    shockwaveMesh.visible = false;
    group.add(shockwaveMesh);

    this.worldContentGroup.add(group);
    this.floorTraps.push({
      id: spec.id,
      mesh: group,
      armedGroup,
      runeRing,
      coreCrystal,
      shockwaveMesh,
      position: new THREE.Vector3(spec.x, 0, spec.z),
      radius: spec.radius,
      damage: spec.damage,
      triggered: false,
      explosionTimer: 0,
      animPhase: idx * 1.1,
    });
  }

  public triggerFloorTrap(trap: FloorTrapActor, fromRemote = false) {
    if (trap.triggered) return;
    trap.triggered = true;
    trap.explosionTimer = 0.42;
    trap.armedGroup.visible = false;
    trap.shockwaveMesh.visible = true;
    trap.shockwaveMesh.scale.setScalar(0.5);

    const blastOrigin = _v1.copy(trap.position).setY(0.5);
    this.spawnParticles(blastOrigin, 0xff3b00, 38, 9.0);
    this.spawnParticles(blastOrigin, 0xfacc15, 22, 6.5);
    audioEngine.playHeavyImpact(true);

    if (!fromRemote) {
      this.emitWorldEvent({
        kind: 'floor_trap',
        stage: this.labyrinthStage,
        targetId: trap.id,
      });
      if (!this.testInvulnerable) {
        this.tookDamageThisStage = true;
        audioEngine.playPlayerHurt();
        // Floor trap explosion strictly deals 30 HP damage ("отнимет 30 здоровья")
        this.hp = Math.max(0, this.hp - trap.damage);
        this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.65);
      }

      this.lastCastBanner = {
        spellName: this.testInvulnerable
          ? `🛡️ Ловушка поглощена неуязвимостью (0 ОЗ)`
          : `💥 Ловушка! -${trap.damage} ОЗ`,
        qualityPercent: 100,
        damage: this.testInvulnerable ? 0 : trap.damage,
        detail: '',
        color: '#ef4444',
        timestamp: performance.now(),
      };

      if (!this.testInvulnerable && this.hp <= 0 && this.mode === 'playing') {
        this.mode = 'gameover';
        audioEngine.playDefeatSting();
        this.callbacks.onGameOver(false, {
          score: this.score,
          wave: this.wave,
          enemiesDefeated: this.enemiesDefeated,
        });
      }
    }
    this.pushHudSnapshot();
  }

  private spawnPhysicsProp(pos: THREE.Vector3, kind: PhysicsProp['kind'], name: string, idx: number) {
    const group = this.createPhysicsPropMesh(kind);
    group.position.copy(pos);
    this.worldContentGroup.add(group);

    this.props.push({
      id:
        this.mapMode === 'labyrinth'
          ? `prop_s${this.labyrinthStage}_${idx}`
          : `prop_arena_${idx}`,
      name,
      kind,
      mesh: group,
      homePosition: pos.clone(),
      velocity: new THREE.Vector3(),
      radius: 0.85,
      isHeld: false,
      isThrown: false,
      throwDamage: kind === 'barrel' ? 68 : 32,
      explodedTimer: 0,
      isPet: false,
      petScale: 1,
      petAttackTimer: 0,
      petDuration: 0,
    });
  }

  private createPhysicsPropMesh(kind: PhysicsProp['kind']): THREE.Group {
    const group = new THREE.Group();
    this.addContactShadow(group, 0.8);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.78, metalness: 0.1 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.85 });
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      roughness: 0.25,
    });

    if (kind === 'crate') {
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), woodMat);
      box.position.y = 0.5;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.18, 1.06), ironMat);
      frame.position.y = 0.5;
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), runeMat);
      gem.position.y = 1.08;
      group.add(box, frame, gem);
    } else if (kind === 'shield') {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.65, 0.18, 8), ironMat);
      plate.rotation.x = Math.PI / 2;
      plate.position.y = 0.75;
      const boss = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), runeMat);
      boss.position.set(0, 0.75, 0.1);
      group.add(plate, boss);
    } else {
      // Bright Crimson-Red Explosive Alchemical Barrel ("красные бочки давай сделаем что б они взрывались при броске")
      const redBarrelMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        emissive: 0x991b1b,
        emissiveIntensity: 0.35,
        roughness: 0.42,
        metalness: 0.18,
      });
      const fireCoreMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xff4500,
        emissiveIntensity: 1.4,
        roughness: 0.2,
      });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 1.18, 12), redBarrelMat);
      body.position.y = 0.59;
      const hoop1 = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.045, 8, 16), ironMat);
      hoop1.rotation.x = Math.PI / 2;
      hoop1.position.y = 0.3;
      const hoop2 = hoop1.clone();
      hoop2.position.y = 0.88;
      const hazardGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), fireCoreMat);
      hazardGem.position.y = 1.26;
      group.add(body, hoop1, hoop2, hazardGem);
    }

    return group;
  }

  /**
   * Detonates a thrown Red Explosive Barrel (`barrel`) on impact, dealing AoE damage scaled by `Тяни` power!
   */
  public detonateExplosiveBarrel(prop: PhysicsProp, fromRemote = false) {
    if (prop.explodedTimer > 0) return;
    const blastPos = prop.mesh.position.clone();
    blastPos.y = 0.7;

    if (!fromRemote) {
      this.emitWorldEvent({
        kind: 'barrel_explode',
        stage: this.labyrinthStage,
        targetId: prop.id,
        x: Number(blastPos.x.toFixed(2)),
        y: Number(blastPos.y.toFixed(2)),
        z: Number(blastPos.z.toFixed(2)),
        throwDamage: prop.throwDamage,
      });
    }

    this.spawnParticles(blastPos, 0xff3b00, 42, 10.5);
    this.spawnParticles(blastPos, 0xfacc15, 26, 7.5);
    audioEngine.playHeavyImpact(true);
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.55);

    const blastRadius = 6.2;
    let enemiesHit = 0;
    if (!fromRemote) {
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const d = Math.hypot(enemy.position.x - blastPos.x, enemy.position.z - blastPos.z);
        if (d <= blastRadius) {
          const knockDir = new THREE.Vector3(
            enemy.position.x - blastPos.x,
            0,
            enemy.position.z - blastPos.z
          );
          if (knockDir.lengthSq() < 0.01) knockDir.set(0, 0, -1);
          knockDir.normalize().multiplyScalar(14);
          this.damageEnemy(enemy, prop.throwDamage, knockDir, 0xff4500);
          enemiesHit++;
        }
      }

      if (enemiesHit > 0) {
        this.callbacks.onQuestEvent('barrel_explode_hit', enemiesHit);
      }

      // Friendly fire / PvP on remote wizards caught in the barrel blast radius!
      if (this.callbacks.onMultiplayerHit) {
        for (const [remoteId, entry] of this.remoteMeshes.entries()) {
          const distToRemote = Math.hypot(
            entry.data.x - blastPos.x,
            entry.data.z - blastPos.z
          );
          if (distToRemote <= blastRadius) {
            this.callbacks.onMultiplayerHit(remoteId, prop.throwDamage);
          }
        }
      }

      this.lastCastBanner = {
        spellName: `💥 Взрыв бочки: ${prop.throwDamage} ур.${enemiesHit > 0 ? ` (${enemiesHit} враг.)` : ''}`,
        qualityPercent: 100,
        damage: prop.throwDamage,
        detail: '',
        color: '#ef4444',
        timestamp: performance.now(),
      };
    }

    prop.isThrown = false;
    prop.isHeld = false;
    prop.velocity.set(0, 0, 0);
    prop.explodedTimer = BARREL_RESPAWN_SEC; // Respawns at homePosition after 60 seconds (1 minute)
    prop.mesh.visible = false;
  }

  /**
   * Places an unlit 3D Campfire (`Костёр`) in front of the player using 3 firewood (`ancient_wood`).
   * Must be shot with the Fire spell (`Огонь` / `incendio`) to ignite!
   */
  public placeCampfire(
    customPos?: THREE.Vector3,
    customId?: string,
    fromRemote = false
  ): CampfireActor {
    // Single Campfire Rule: Only 1 campfire can exist at a time! Building a second one removes the previous campfire.
    if (this.campfires.length > 0) {
      for (const oldCf of this.campfires) {
        this.spawnParticles(_v1.copy(oldCf.position).setY(0.5), 0x94a3b8, 16, 4.0);
        this.worldContentGroup.remove(oldCf.mesh);
      }
      this.campfires = [];
    }

    _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const pos = customPos
      ? customPos.clone()
      : this.playerPos.clone().addScaledVector(_forward, 2.4);
    pos.y = 0;
    if (this.mapMode === 'labyrinth' && !customPos) {
      this.resolveLabyrinthCollisions(pos);
    }

    const group = new THREE.Group();
    group.position.copy(pos);

    // Stone ring around the campfire
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.85,
      flatShading: true,
    });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), stoneMat);
      stone.position.set(Math.cos(a) * 0.68, 0.1, Math.sin(a) * 0.68);
      stone.scale.set(1.2, 0.75, 1.0);
      group.add(stone);
    }

    // Stacked wooden logs (Дрова)
    const logMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.8,
      flatShading: true,
    });
    for (let l = 0; l < 4; l++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 1.15, 6), logMat);
      log.position.set(0, 0.18 + (l % 2) * 0.08, 0);
      log.rotation.z = Math.PI / 2 - 0.28;
      log.rotation.y = (l / 4) * Math.PI;
      group.add(log);
    }

    // Subtle small-radius healing aura ring on the floor (visible only when lit!)
    const auraGeo = new THREE.RingGeometry(CAMPFIRE_HEAL_RADIUS - 0.18, CAMPFIRE_HEAL_RADIUS, 36);
    auraGeo.rotateX(-Math.PI / 2);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
    });
    const auraRing = new THREE.Mesh(auraGeo, auraMat);
    auraRing.position.y = 0.03;
    auraRing.visible = false;
    group.add(auraRing);

    // Low-poly 3D Flames (hidden until shot with Fire spell `Огонь`!)
    const flameGroup = new THREE.Group();
    flameGroup.position.y = 0.25;
    flameGroup.visible = false;

    const outerFlameMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 1.8,
      roughness: 0.15,
      flatShading: true,
    });
    const innerFlameMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xfacc15,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      flatShading: true,
    });

    const mainFlame = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.95, 5), outerFlameMat);
    mainFlame.position.y = 0.42;
    const coreFlame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.68, 5), innerFlameMat);
    coreFlame.position.set(0, 0.35, 0.04);
    const sideFlame1 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.58, 4), outerFlameMat);
    sideFlame1.position.set(-0.18, 0.28, 0.1);
    sideFlame1.rotation.z = 0.22;
    const sideFlame2 = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.52, 4), innerFlameMat);
    sideFlame2.position.set(0.18, 0.26, -0.08);
    sideFlame2.rotation.z = -0.22;

    flameGroup.add(mainFlame, coreFlame, sideFlame1, sideFlame2);
    group.add(flameGroup);

    const fireLight = new THREE.PointLight(0xff7b00, 0, 9.5, 1.6);
    fireLight.position.set(0, 1.1, 0);
    group.add(fireLight);

    this.worldContentGroup.add(group);

    const actor: CampfireActor = {
      id:
        customId ||
        `campfire_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      mesh: group,
      flameGroup,
      fireLight,
      auraRing,
      position: pos,
      isLit: false,
      animPhase: Math.random() * 5,
    };
    this.campfires.push(actor);
    this.spawnParticles(_v1.copy(pos).setY(0.4), 0xd97706, 14, 3.5);
    audioEngine.playPickupChime();
    if (!fromRemote) {
      this.emitWorldEvent({
        kind: 'campfire_place',
        stage: this.labyrinthStage,
        targetId: actor.id,
        x: Number(pos.x.toFixed(2)),
        z: Number(pos.z.toFixed(2)),
      });
    }
    this.pushHudSnapshot();
    return actor;
  }

  /**
   * Ignites an unlit Campfire when hit by the Fire spell (`Огонь` / `incendio`)!
   */
  public igniteCampfire(campfire: CampfireActor, fromRemote = false) {
    if (campfire.isLit) return;
    campfire.isLit = true;
    campfire.flameGroup.visible = true;
    campfire.auraRing.visible = true;
    campfire.fireLight.intensity = 2.4;

    const firePos = _v1.copy(campfire.position).setY(0.6);
    this.spawnParticles(firePos, 0xf97316, 32, 6.5);
    this.spawnParticles(firePos, 0xfde047, 18, 4.5);
    audioEngine.playVictoryFanfare();
    if (!fromRemote) {
      this.emitWorldEvent({
        kind: 'campfire_light',
        stage: this.labyrinthStage,
        targetId: campfire.id,
      });
      this.callbacks.onQuestEvent('light_campfire', 1);
      this.callbacks.onLootCollected(
        'ancient_wood',
        0,
        '🔥 Костёр зажжён! Вблизи: +0.5 ОЗ/с и +50% реген МП (окружите 3 стенами [B] для бонуса ×2!).'
      );
    }
    this.pushHudSnapshot();
  }

  /**
   * Places a player-built 3D Wooden Palisade Wall (`Стена`) in front of the player:
   * - Costs 2 wood (`WALL_WOOD_COST = 2`)
   * - Builds over 2.0 seconds (`WALL_BUILD_DURATION_SEC = 2.0`)
   * - Up to `MAX_BUILT_WALLS = 12` walls can exist on the map at once
   * - Blocks enemy projectiles, charges, and abilities, and 3 walls around a campfire double HP/MP regeneration!
   */
  public placeWoodenWall(
    customPos?: THREE.Vector3,
    customRotY?: number,
    customId?: string
  ): BuiltWallActor | null {
    if (this.builtWalls.length >= MAX_BUILT_WALLS) {
      return null;
    }

    _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const pos = customPos
      ? customPos.clone()
      : this.playerPos.clone().addScaledVector(_forward, 2.85);
    pos.y = 0;

    // Snap wall orientation perpendicular to player's gaze along cardinal axes so walls align cleanly around campfires
    const rotY =
      customRotY !== undefined
        ? customRotY
        : Math.abs(Math.cos(this.yaw)) >= Math.abs(Math.sin(this.yaw))
        ? 0
        : Math.PI / 2;

    const halfLen = 1.7; // 3.4m wide wall
    const halfThick = 0.28; // 0.56m thick wall
    const halfX = Math.abs(Math.cos(rotY)) >= 0.5 ? halfLen : halfThick;
    const halfZ = Math.abs(Math.cos(rotY)) >= 0.5 ? halfThick : halfLen;

    const group = new THREE.Group();
    group.position.copy(pos);
    group.rotation.y = rotY;

    // Ground stone foundation sill
    const sillMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.85,
      flatShading: true,
    });
    const foundationSill = new THREE.Mesh(
      new THREE.BoxGeometry(halfLen * 2.02, 0.16, halfThick * 2.1),
      sillMat
    );
    foundationSill.position.y = 0.08;
    group.add(foundationSill);

    // Rising wooden palisade body group (scales Y from 0.15 -> 1.0 over 2.0s construction!)
    const bodyGroup = new THREE.Group();
    const logLightMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e,
      roughness: 0.78,
      metalness: 0.08,
      flatShading: true,
    });
    const logDarkMat = new THREE.MeshStandardMaterial({
      color: 0x713f12,
      roughness: 0.85,
      metalness: 0.06,
      flatShading: true,
    });
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x5c2d0c,
      roughness: 0.72,
      metalness: 0.1,
      flatShading: true,
    });
    const ironBandMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.35,
      metalness: 0.78,
      flatShading: true,
    });

    // 5 stacked horizontal timber logs
    for (let l = 0; l < 5; l++) {
      const logMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, halfLen * 1.92, 8),
        l % 2 === 0 ? logLightMat : logDarkMat
      );
      logMesh.rotation.z = Math.PI / 2;
      logMesh.position.set(0, 0.34 + l * 0.41, 0);
      bodyGroup.add(logMesh);
    }

    // 2 vertical corner support posts + conical palisade tips + 4 forged iron reinforcement bands
    for (const side of [-1, 1]) {
      const postX = side * (halfLen - 0.22);
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.27, 2.42, 8),
        postMat
      );
      post.position.set(postX, 1.25, 0);
      bodyGroup.add(post);

      const postCap = new THREE.Mesh(
        new THREE.ConeGeometry(0.27, 0.42, 6),
        logLightMat
      );
      postCap.position.set(postX, 2.62, 0);
      bodyGroup.add(postCap);

      for (const bandY of [0.65, 1.85]) {
        const band = new THREE.Mesh(
          new THREE.BoxGeometry(0.56, 0.15, 0.58),
          ironBandMat
        );
        band.position.set(postX, bandY, 0);
        bodyGroup.add(band);
      }
    }

    bodyGroup.scale.set(1, 0.15, 1);
    group.add(bodyGroup);
    this.worldContentGroup.add(group);

    const wallBox: WallBox = {
      minX: pos.x - halfX - 0.55,
      maxX: pos.x + halfX + 0.55,
      minZ: pos.z - halfZ - 0.55,
      maxZ: pos.z + halfZ + 0.55,
    };

    const wallActor: BuiltWallActor = {
      id: customId || `wall_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      mesh: group,
      bodyGroup,
      position: pos,
      x: pos.x,
      z: pos.z,
      rotY,
      wallBox,
      buildRemainingSec: WALL_BUILD_DURATION_SEC,
      totalBuildSec: WALL_BUILD_DURATION_SEC,
      isBuilt: false,
    };

    this.builtWalls.push(wallActor);
    this.spawnParticles(_v1.copy(pos).setY(0.5), 0xd97706, 18, 4.2);
    if (!customId) {
      audioEngine.playPickupChime();
      this.callbacks.onQuestEvent('build_wall', 1);
      this.emitWorldEvent({
        kind: 'wall_place',
        stage: this.labyrinthStage,
        targetId: wallActor.id,
        x: pos.x,
        z: pos.z,
        rotY,
      });
    }
    this.pushHudSnapshot();
    return wallActor;
  }

  /**
   * Returns the player-built Wooden Wall (`Стена`) currently aimed at by the player's crosshair ray within 11.5m.
   */
  public getAimedWoodenWall(): { wall: BuiltWallActor; index: number; distance: number } | null {
    const aimDir = {
      x: -Math.sin(this.yaw),
      z: -Math.cos(this.yaw),
    };
    return findAimedWoodenWall(this.playerPos, aimDir, this.builtWalls, 11.5);
  }

  /**
   * Dismantles/breaks the player-built Wooden Wall (`Стена`) that the player is aiming at (`по наведению куда целишься`),
   * and returns it so the caller refunds +1 wood (`ancient_wood`).
   */
  public dismantleNearestWoodenWall(): BuiltWallActor | null {
    const aimed = this.getAimedWoodenWall();
    if (!aimed) return null;

    const [removed] = this.builtWalls.splice(aimed.index, 1);
    this.worldContentGroup.remove(removed.mesh);
    this.spawnParticles(_v1.copy(removed.position).setY(1.1), 0xd97706, 24, 5.5);
    this.spawnParticles(_v1.copy(removed.position).setY(1.1), 0x94a3b8, 12, 4.0);
    audioEngine.playHeavyImpact(false);
    this.callbacks.onQuestEvent('dismantle_wall', 1);
    this.emitWorldEvent({
      kind: 'wall_dismantle',
      stage: this.labyrinthStage,
      targetId: removed.id,
    });
    this.pushHudSnapshot();
    return removed;
  }

  /**
   * Drinks a crafted Health or Mana Potion (`10..50` HP or MP).
   */
  public applyCraftedPotion(potion: CraftedPotionItem): boolean {
    if (potion.kind === 'health') {
      this.hp = Math.min(this.maxHp, this.hp + potion.restoreAmount);
      this.spawnParticles(_v1.copy(this.playerPos).setY(1.2), 0x22c55e, 22, 4.5);
    } else {
      this.mp = Math.min(this.maxMp, this.mp + potion.restoreAmount);
      this.spawnParticles(_v1.copy(this.playerPos).setY(1.2), 0x38bdf8, 22, 4.5);
    }
    audioEngine.playPickupChime();
    this.pushHudSnapshot();
    return true;
  }

  /**
   * Eats a Cooked Rat, Boar, or Bear Meal (`+10..120 Max HP` and `+0.1..1.6 HP/s`).
   */
  public applyCookedFoodBuff(food: CookedRatFoodItem | CookedBoarFoodItem | CookedBearFoodItem) {
    this.activeFoodBuff = {
      name: food.name,
      bonusMaxHp: food.bonusMaxHp,
      hpRegenPerSec: food.hpRegenPerSec,
      remainingSec: food.durationSec,
      totalDurationSec: food.durationSec,
    };
    this.recomputeMaxVitals();
    this.spawnParticles(_v1.copy(this.playerPos).setY(1.3), 0xf97316, 26, 5.0);
    audioEngine.playVictoryFanfare();
    this.pushHudSnapshot();
  }

  /**
   * Eats a Cooked Bat Meal (`Жареная летучая мышь`: `+10..50 Max MP` and `+0.1..0.5 MP/s` for `1..5 minutes`).
   */
  public applyCookedBatFoodBuff(food: CookedBatFoodItem) {
    this.activeBatFoodBuff = {
      name: food.name,
      bonusMaxHp: 0,
      hpRegenPerSec: 0,
      bonusMaxMp: food.bonusMaxMp,
      mpRegenPerSec: food.mpRegenPerSec,
      remainingSec: food.durationSec,
      totalDurationSec: food.durationSec,
    };
    this.recomputeMaxVitals();
    this.spawnParticles(_v1.copy(this.playerPos).setY(1.3), 0x818cf8, 26, 5.0);
    audioEngine.playVictoryFanfare();
    this.pushHudSnapshot();
  }

  /**
   * Builds high-detail, unmistakable multi-part 3D models for Tameable Pets:
   * - 'cat' (Котик Мурзик): Ginger tabby with pointed ears, pink inner ears, whiskers, collar bell, paws, swaying tail
   * - 'fox' (Лис Иней): Arctic white-and-cyan fox with long snout, dark-tipped ears, crystal crest, huge fluffy tail
   * - 'owl' (Совенок Филин): Plump horned owl with golden lantern eyes, beak, flapping feathered wings
   * - 'salamander' (Саламандр Игнис): Crimson fire drake with horned head, glowing dorsal spines, splayed legs, whip tail
   */
  private createDetailedTameablePetMesh(species: TameableSpeciesId): {
    group: THREE.Group;
    tailOrWingPart: THREE.Object3D | null;
  } {
    const group = new THREE.Group();
    this.addContactShadow(group, 0.85);
    let tailOrWingPart: THREE.Object3D | null = null;

    if (species === 'cat') {
      const gingerMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.55, metalness: 0.1 });
      const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6, metalness: 0.05 });
      const pinkMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 });
      const emeraldEyeMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 1.1,
      });
      const bellMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0ea5e9,
        emissiveIntensity: 1.2,
        metalness: 0.8,
        roughness: 0.2,
      });

      // Plump cat torso + white chest bib
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.48, 8, 12), gingerMat);
      torso.rotation.x = Math.PI / 2;
      torso.position.set(0, 0.44, 0);

      const chestBib = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), creamMat);
      chestBib.position.set(0, 0.42, -0.26);

      // Rounded feline head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 14), gingerMat);
      head.position.set(0, 0.74, -0.34);

      const muzzleL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), creamMat);
      muzzleL.position.set(-0.06, 0.68, -0.56);
      const muzzleR = muzzleL.clone();
      muzzleR.position.x = 0.06;

      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.05, 3), pinkMat);
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 0.72, -0.62);

      // Pointed Cat Ears + Pink Inner Ears
      const earGeo = new THREE.ConeGeometry(0.11, 0.24, 4);
      const earL = new THREE.Mesh(earGeo, gingerMat);
      earL.position.set(-0.16, 1.0, -0.32);
      earL.rotation.z = 0.22;
      const earR = new THREE.Mesh(earGeo, gingerMat);
      earR.position.set(0.16, 1.0, -0.32);
      earR.rotation.z = -0.22;

      const innerEarL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 3), pinkMat);
      innerEarL.position.set(-0.16, 0.99, -0.36);
      innerEarL.rotation.z = 0.22;
      const innerEarR = innerEarL.clone();
      innerEarR.position.x = 0.16;
      innerEarR.rotation.z = -0.22;

      // Glowing Emerald Cat Eyes
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), emeraldEyeMat);
      eyeL.position.set(-0.11, 0.78, -0.56);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.11;

      // Collar & Arcane Bell
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(0.21, 0.028, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 })
      );
      collar.rotation.x = Math.PI / 2.4;
      collar.position.set(0, 0.58, -0.28);
      const bell = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 1), bellMat);
      bell.position.set(0, 0.5, -0.45);

      // 4 White-Socked Paws
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.34, 8), gingerMat);
        const lx = i % 2 === 0 ? -0.15 : 0.15;
        const lz = i < 2 ? -0.22 : 0.22;
        leg.position.set(lx, 0.18, lz);
        const paw = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), creamMat);
        paw.position.set(lx, 0.06, lz - 0.03);
        group.add(leg, paw);
      }

      // Upright Swaying Cat Tail
      const tailGroup = new THREE.Group();
      tailGroup.position.set(0, 0.52, 0.34);
      const tailSeg1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.38, 6, 8), gingerMat);
      tailSeg1.position.set(0, 0.22, 0.1);
      tailSeg1.rotation.x = -0.45;
      const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), creamMat);
      tailTip.position.set(0, 0.44, 0.2);
      tailGroup.add(tailSeg1, tailTip);
      tailOrWingPart = tailGroup;

      group.add(
        torso,
        chestBib,
        head,
        muzzleL,
        muzzleR,
        nose,
        earL,
        earR,
        innerEarL,
        innerEarR,
        eyeL,
        eyeR,
        collar,
        bell,
        tailGroup
      );
    } else if (species === 'fox') {
      const snowMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.5, metalness: 0.1 });
      const iceMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.9,
        roughness: 0.2,
      });
      const darkTipMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });

      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.58, 8, 12), snowMat);
      torso.rotation.x = Math.PI / 2;
      torso.position.y = 0.46;

      const head = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.54, 8), snowMat);
      head.rotation.x = -Math.PI / 2;
      head.position.set(0, 0.72, -0.45);

      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.32, 4), darkTipMat);
      earL.position.set(-0.15, 0.98, -0.3);
      const earR = earL.clone();
      earR.position.x = 0.15;

      const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), iceMat);
      crest.position.set(0, 0.74, 0);

      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.4, 8), darkTipMat);
        leg.position.set(i % 2 === 0 ? -0.15 : 0.15, 0.2, i < 2 ? -0.26 : 0.26);
        group.add(leg);
      }

      const tailGroup = new THREE.Group();
      tailGroup.position.set(0, 0.48, 0.38);
      const fluffyTail = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.68, 8), snowMat);
      fluffyTail.rotation.x = Math.PI / 2.6;
      fluffyTail.position.set(0, 0.12, 0.3);
      tailGroup.add(fluffyTail);
      tailOrWingPart = tailGroup;

      group.add(torso, head, earL, earR, crest, tailGroup);
    } else if (species === 'owl') {
      const featherMat = new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 0.65, metalness: 0.15 });
      const breastMat = new THREE.MeshStandardMaterial({ color: 0xddd6fe, roughness: 0.7 });
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xeab308,
        emissiveIntensity: 1.1,
      });

      const body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 14), featherMat);
      body.scale.set(1, 1.25, 0.95);
      body.position.y = 0.75;

      const breast = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), breastMat);
      breast.position.set(0, 0.72, -0.14);

      const eyeL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12), goldMat);
      eyeL.rotation.x = Math.PI / 2;
      eyeL.position.set(-0.12, 0.92, -0.32);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.12;

      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), goldMat);
      beak.rotation.x = -Math.PI / 2;
      beak.position.set(0, 0.84, -0.4);

      const wingsGroup = new THREE.Group();
      wingsGroup.position.set(0, 0.8, 0);
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.32), featherMat);
      wingL.position.set(-0.42, 0, 0);
      const wingR = wingL.clone();
      wingR.position.x = 0.42;
      wingsGroup.add(wingL, wingR);
      tailOrWingPart = wingsGroup;

      group.add(body, breast, eyeL, eyeR, beak, wingsGroup);
    } else {
      const scaleMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45, metalness: 0.25 });
      const fireMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 1.2,
      });

      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.65, 8, 12), scaleMat);
      torso.rotation.x = Math.PI / 2;
      torso.position.y = 0.35;

      const head = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.48, 6), scaleMat);
      head.rotation.x = -Math.PI / 2;
      head.position.set(0, 0.48, -0.48);

      for (let s = 0; s < 4; s++) {
        const spine = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), fireMat);
        spine.position.set(0, 0.6, -0.2 + s * 0.18);
        group.add(spine);
      }

      const tailGroup = new THREE.Group();
      tailGroup.position.set(0, 0.32, 0.4);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.65, 6), fireMat);
      tail.rotation.x = Math.PI / 2;
      tail.position.z = 0.3;
      tailGroup.add(tail);
      tailOrWingPart = tailGroup;

      group.add(torso, head, tailGroup);
    }

    return { group, tailOrWingPart };
  }

  /**
   * Builds full-detail, articulated multi-part 3D Enemy Models with animated wings, limbs, weapons, and halos
   * so every ground and flying enemy looks like a crafted dark-fantasy creature rather than a prototype.
   */
  private createEnemyMesh(
    archetype: EnemyActor['archetype'],
    name: string
  ): {
    group: THREE.Group;
    telegraphMesh: THREE.Mesh;
    hpBarCanvas: HTMLCanvasElement;
    hpBarTexture: THREE.CanvasTexture;
    animParts: EnemyAnimParts;
    chargeTrajectoryLine?: THREE.Mesh;
    burrowWarningRing?: THREE.Mesh;
  } {
    const group = new THREE.Group();
    const isFlying =
      archetype === 'sky_dive_gargoyle' || archetype === 'storm_harpy_shooter';
    if (!isFlying) {
      this.addContactShadow(group, 1.25);
    }

    const animParts: EnemyAnimParts = {};

    const telegraphGeo = new THREE.RingGeometry(1.1, 1.45, 28);
    telegraphGeo.rotateX(-Math.PI / 2);
    const telegraphMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const telegraphMesh = new THREE.Mesh(telegraphGeo, telegraphMat);
    telegraphMesh.position.y = isFlying ? -0.45 : 0.04;
    group.add(telegraphMesh);

    if (archetype === 'rat_swarmer') {
      // Armored Shadow Plague Stalker: Chitin armor plates, muscular haunches, articulated legs with claws,
      // open fanged maw, glowing toxic back crystals, and whipping segmented tail
      const furMat = new THREE.MeshStandardMaterial({
        color: 0x2e1065,
        roughness: 0.65,
        metalness: 0.2,
      });
      const chitinMat = new THREE.MeshStandardMaterial({
        color: 0x4c1d95,
        roughness: 0.35,
        metalness: 0.65,
      });
      const toxicMat = new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        emissive: 0x9333ea,
        emissiveIntensity: 1.35,
        roughness: 0.2,
      });
      const boneMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
      const redEyeMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xdc2626,
        emissiveIntensity: 1.6,
      });

      const bodyGroup = new THREE.Group();
      bodyGroup.scale.setScalar(1.18);

      const haunch = new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 14), furMat);
      haunch.scale.set(1.0, 0.92, 1.25);
      haunch.position.set(0, 0.58, -0.32);

      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.62, 10, 14), furMat);
      torso.rotation.x = Math.PI / 2.15;
      torso.position.set(0, 0.64, 0.18);

      // Chitin back armor plates
      for (let p = 0; p < 3; p++) {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.68 - p * 0.08, 0.14, 0.34), chitinMat);
        plate.position.set(0, 0.92 - p * 0.06, 0.32 - p * 0.32);
        plate.rotation.x = 0.2;
        bodyGroup.add(plate);
      }

      // 4 Articulated Legs with Claws
      for (let l = 0; l < 4; l++) {
        const lx = l % 2 === 0 ? -0.38 : 0.38;
        const lz = l < 2 ? 0.36 : -0.32;
        const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.32, 6, 8), furMat);
        thigh.position.set(lx, 0.36, lz);
        thigh.rotation.z = l % 2 === 0 ? 0.25 : -0.25;
        const paw = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.26), chitinMat);
        paw.position.set(lx * 1.15, 0.08, lz + 0.08);
        bodyGroup.add(thigh, paw);
      }

      // Expressive Forward-Facing Rat Head + Tapered Snout (+Z) + Pink Nose + Incisors + Whiskers + Round Rat Ears
      const headCranium = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 14), furMat);
      headCranium.scale.set(1.05, 0.95, 1.1);
      headCranium.position.set(0, 0.72, 0.54);

      // IMPORTANT: ConeGeometry tip is +Y, so rotation.x = +Math.PI / 2 points the snout tip forward (+Z) toward the player!
      const snout = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.68, 12), furMat);
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, 0.67, 0.86);

      const lowerJaw = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.48, 10), furMat);
      lowerJaw.rotation.x = Math.PI / 2 + 0.22;
      lowerJaw.position.set(0, 0.53, 0.8);

      // Glowing Pink/Crimson Rat Nose Tip right at the front of the snout (+Z = 1.20)
      const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), redEyeMat);
      noseTip.position.set(0, 0.68, 1.2);

      // Large Round Rat Ears facing forward
      const earGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.06, 14);
      const earL = new THREE.Mesh(earGeo, furMat);
      earL.rotation.x = Math.PI / 2;
      earL.rotation.z = -0.25;
      earL.position.set(-0.28, 1.0, 0.48);
      const earR = new THREE.Mesh(earGeo, furMat);
      earR.rotation.x = Math.PI / 2;
      earR.rotation.z = 0.25;
      earR.position.set(0.28, 1.0, 0.48);

      // Bright Glowing Red Eyes clearly visible on the front-sides of the face
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), redEyeMat);
      eyeL.position.set(-0.18, 0.8, 0.76);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.18;

      // Prominent White Rat Incisors (front teeth) & Fangs
      for (const side of [-1, 1]) {
        const incisor = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.16, 0.045), boneMat);
        incisor.position.set(side * 0.042, 0.56, 1.06);
        const lowerFang = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 5), boneMat);
        lowerFang.position.set(side * 0.09, 0.56, 0.94);
        bodyGroup.add(incisor, lowerFang);

        // Whiskers sticking out from the snout
        for (const wAngle of [-0.18, 0.14]) {
          const whisker = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.005, 0.42, 5),
            boneMat
          );
          whisker.rotation.z = side * (Math.PI / 2 - 0.15);
          whisker.rotation.y = side * wAngle;
          whisker.position.set(side * 0.24, 0.66 + wAngle * 0.2, 1.0);
          bodyGroup.add(whisker);
        }
      }

      // Segmented Whip Tail
      const tailPivot = new THREE.Group();
      tailPivot.position.set(0, 0.48, -0.68);
      const tailMesh = new THREE.Mesh(new THREE.ConeGeometry(0.1, 1.25, 8), toxicMat);
      tailMesh.rotation.x = -Math.PI / 2.25;
      tailMesh.position.set(0, 0.12, -0.55);
      tailPivot.add(tailMesh);
      animParts.weaponOrTail = tailPivot;

      bodyGroup.add(
        haunch,
        torso,
        headCranium,
        snout,
        lowerJaw,
        noseTip,
        earL,
        earR,
        eyeL,
        eyeR,
        tailPivot
      );
      group.add(bodyGroup);
    } else if (archetype === 'wild_boar') {
      // STAGE 3 & 4 FAST MONSTER: Дикий Кабан (`wild_boar`)
      // Muscular dark-brown bristled boar with high charging shoulders, flat snout disk,
      // 2 large curved ivory tusks (`Клыки лютого кабана`), glowing amber eyes, bristly dorsal mane, and 4 hooves!
      const bodyGroup = new THREE.Group();
      bodyGroup.scale.setScalar(1.32);

      const boarHideMat = new THREE.MeshStandardMaterial({
        color: 0x451a03,
        roughness: 0.78,
        metalness: 0.1,
        flatShading: true,
      });
      const maneMat = new THREE.MeshStandardMaterial({
        color: 0x1c1917,
        roughness: 0.85,
        metalness: 0.08,
        flatShading: true,
      });
      const snoutMat = new THREE.MeshStandardMaterial({
        color: 0x9a3412,
        roughness: 0.65,
        flatShading: true,
      });
      const tuskMat = new THREE.MeshStandardMaterial({
        color: 0xfef9c3,
        emissive: 0xfde047,
        emissiveIntensity: 0.35,
        roughness: 0.22,
        metalness: 0.15,
      });
      const amberEyeMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xff5500,
        emissiveIntensity: 2.0,
      });

      // Heavy muscular boar barrel torso + high hunched charging shoulder hump
      const torso = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.42, 0.78, 8, 12),
        boarHideMat
      );
      torso.rotation.x = Math.PI / 2;
      torso.position.set(0, 0.62, -0.05);

      const shoulderHump = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.46, 1),
        boarHideMat
      );
      shoulderHump.scale.set(1.08, 1.15, 1.05);
      shoulderHump.position.set(0, 0.78, 0.25);

      // 4 sturdy boar legs with dark hooves
      const legCoords = [
        [-0.28, 0.32, 0.38],
        [0.28, 0.32, 0.38],
        [-0.28, 0.3, -0.42],
        [0.28, 0.3, -0.42],
      ];
      for (const [lx, ly, lz] of legCoords) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.08, 0.56, 7),
          boarHideMat
        );
        leg.position.set(lx, ly, lz);
        const hoof = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.11, 0.14, 6),
          maneMat
        );
        hoof.position.set(lx, 0.07, lz + 0.03);
        bodyGroup.add(leg, hoof);
      }

      // Boar Head & Flat Snout Disk
      const head = new THREE.Mesh(
        new THREE.ConeGeometry(0.38, 0.68, 8),
        boarHideMat
      );
      head.rotation.x = Math.PI / 2 + 0.15;
      head.position.set(0, 0.66, 0.72);

      const snoutDisk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.19, 0.21, 0.14, 12),
        snoutMat
      );
      snoutDisk.rotation.x = Math.PI / 2;
      snoutDisk.scale.set(1.18, 1.0, 0.92);
      snoutDisk.position.set(0, 0.58, 1.06);

      // Raised fleshy outer rim around the boar's snout (`ободок пятачка`)
      const snoutRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.175, 0.032, 7, 14),
        snoutMat
      );
      snoutRim.scale.set(1.18, 0.92, 1.0);
      snoutRim.position.set(0, 0.58, 1.12);

      // Deep dark recessed boar nostrils (`ноздри на пятачке`) + fleshy nostril rings + center philtrum crease
      const nostrilCavityMat = new THREE.MeshStandardMaterial({
        color: 0x0f0703,
        roughness: 0.95,
      });
      const snoutGroup = new THREE.Group();
      snoutGroup.add(snoutDisk, snoutRim);

      const philtrumCrease = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, 0.13, 0.03),
        nostrilCavityMat
      );
      philtrumCrease.position.set(0, 0.52, 1.132);
      snoutGroup.add(philtrumCrease);

      for (const side of [-1, 1]) {
        const nostrilRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.052, 0.015, 6, 10),
          snoutMat
        );
        nostrilRing.position.set(side * 0.088, 0.6, 1.132);
        nostrilRing.rotation.z = -side * 0.22;

        const nostrilHole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.048, 0.04, 0.055, 8),
          nostrilCavityMat
        );
        nostrilHole.rotation.x = Math.PI / 2;
        nostrilHole.rotation.z = -side * 0.22;
        nostrilHole.scale.set(0.88, 1.0, 1.18);
        nostrilHole.position.set(side * 0.088, 0.6, 1.122);

        const nostrilDepth = new THREE.Mesh(
          new THREE.SphereGeometry(0.044, 7, 7),
          nostrilCavityMat
        );
        nostrilDepth.scale.set(0.85, 1.12, 0.7);
        nostrilDepth.position.set(side * 0.088, 0.6, 1.138);

        snoutGroup.add(nostrilRing, nostrilHole, nostrilDepth);
      }

      // 2 Large Curved Ivory Tusks (`Клыки кабана`) jutting upward on left & right of snout!
      for (const side of [-1, 1]) {
        const tuskBase = new THREE.Mesh(
          new THREE.ConeGeometry(0.065, 0.44, 7),
          tuskMat
        );
        tuskBase.position.set(side * 0.23, 0.68, 0.94);
        tuskBase.rotation.z = -side * 0.38;
        tuskBase.rotation.x = 0.28;
        bodyGroup.add(tuskBase);

        const ear = new THREE.Mesh(
          new THREE.ConeGeometry(0.12, 0.28, 5),
          boarHideMat
        );
        ear.position.set(side * 0.28, 0.96, 0.54);
        ear.rotation.z = -side * 0.45;
        ear.rotation.x = 0.25;
        bodyGroup.add(ear);
      }

      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), amberEyeMat);
      eyeL.position.set(-0.2, 0.76, 0.78);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.2;

      // Tufted Boar Tail
      const tailPivot = new THREE.Group();
      tailPivot.position.set(0, 0.68, -0.66);
      const tailMesh = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.42, 6), maneMat);
      tailMesh.rotation.x = -Math.PI / 2.6;
      tailMesh.position.set(0, 0.08, -0.18);
      tailPivot.add(tailMesh);
      animParts.weaponOrTail = tailPivot;

      bodyGroup.add(
        torso,
        shoulderHump,
        head,
        snoutGroup,
        eyeL,
        eyeR,
        tailPivot
      );
      group.add(bodyGroup);
    } else if (archetype === 'sky_dive_gargoyle') {
      // LARGE FLYING MELEE ENEMY: Крылатая Каменная Горгулья (Flies at Y=3.3m, huge articulated bat-stone wings,
      // horned demonic head, glowing magma chest core, taloned feet, and twin magma claws)
      const bodyGroup = new THREE.Group();
      bodyGroup.scale.setScalar(1.38);

      const basaltMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.55,
        metalness: 0.45,
      });
      const obsidianMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.35,
        metalness: 0.75,
      });
      const magmaMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 1.55,
        roughness: 0.2,
      });

      // Muscular Gargoyle Torso & Glowing Magma Heart Core
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.42, 1.25, 8), basaltMat);
      torso.position.set(0, 0.15, 0);
      const chestArmor = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52, 0), obsidianMat);
      chestArmor.scale.set(1.15, 0.9, 0.75);
      chestArmor.position.set(0, 0.32, 0.22);

      const magmaCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 1), magmaMat);
      magmaCore.position.set(0, 0.32, 0.55);
      animParts.haloOrCore = magmaCore;

      // Horned Gargoyle Head & Glowing Eyes
      const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 1), basaltMat);
      head.position.set(0, 0.98, 0.18);

      const hornGeo = new THREE.ConeGeometry(0.11, 0.62, 6);
      const hornL = new THREE.Mesh(hornGeo, obsidianMat);
      hornL.position.set(-0.28, 1.32, 0.05);
      hornL.rotation.z = 0.48;
      hornL.rotation.x = -0.35;
      const hornR = hornL.clone();
      hornR.position.x = 0.28;
      hornR.rotation.z = -0.48;

      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), magmaMat);
      eyeL.position.set(-0.14, 1.02, 0.48);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.14;

      // Huge Articulated Bat/Dragon Wings (Left & Right Wing Pivots for Flapping Animation!)
      const createGargoyleWing = (side: -1 | 1): THREE.Group => {
        const wingPivot = new THREE.Group();
        wingPivot.position.set(side * 0.48, 0.52, -0.15);

        const armSpar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 1.65, 6), obsidianMat);
        armSpar.rotation.z = side * (Math.PI / 2.3);
        armSpar.position.set(side * 0.75, 0.25, 0);

        const membrane1 = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.55, 4), basaltMat);
        membrane1.scale.set(1.2, 1.0, 0.18);
        membrane1.rotation.z = side * 0.65;
        membrane1.position.set(side * 0.85, -0.05, -0.05);

        const membrane2 = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.35, 4), magmaMat);
        membrane2.scale.set(1.1, 1.0, 0.14);
        membrane2.rotation.z = side * 0.95;
        membrane2.position.set(side * 1.42, 0.12, -0.08);

        const wingClaw = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.34, 5), magmaMat);
        wingClaw.position.set(side * 1.45, 0.58, 0.12);
        wingClaw.rotation.x = Math.PI / 3;

        wingPivot.add(armSpar, membrane1, membrane2, wingClaw);
        return wingPivot;
      };

      const leftWing = createGargoyleWing(-1);
      const rightWing = createGargoyleWing(1);
      animParts.leftWing = leftWing;
      animParts.rightWing = rightWing;

      // Twin Swooping Forearms & Magma Claws
      const armsGroup = new THREE.Group();
      for (const side of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.52, 6, 8), basaltMat);
        arm.position.set(side * 0.62, 0.12, 0.42);
        arm.rotation.x = Math.PI / 3;
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 5), magmaMat);
        claw.rotation.x = Math.PI / 2;
        claw.position.set(side * 0.62, -0.08, 0.78);
        armsGroup.add(arm, claw);
      }
      animParts.weaponOrTail = armsGroup;

      // Taloned Hind Legs
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.45, 6, 8), obsidianMat);
        leg.position.set(side * 0.32, -0.62, 0.08);
        leg.rotation.x = 0.35;
        bodyGroup.add(leg);
      }

      bodyGroup.add(
        torso,
        chestArmor,
        magmaCore,
        head,
        hornL,
        hornR,
        eyeL,
        eyeR,
        leftWing,
        rightWing,
        armsGroup
      );
      group.add(bodyGroup);
    } else if (archetype === 'storm_harpy_shooter') {
      // LARGE FLYING RANGED ENEMY: Штормовая Гарпия-Стрелок (Hovers high at Y=4.2m, wide feathered lightning wings,
      // Valkyrie storm crown, glowing cyan eyes, tail feathers, and lightning orb caster)
      const bodyGroup = new THREE.Group();
      bodyGroup.scale.setScalar(1.42);

      const stormFeatherMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.4,
        metalness: 0.35,
      });
      const goldArmorMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.25,
        metalness: 0.88,
      });
      const lightningMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0ea5e9,
        emissiveIntensity: 1.65,
        roughness: 0.15,
      });

      const torso = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.35, 10), stormFeatherMat);
      torso.rotation.x = Math.PI;
      torso.position.set(0, 0.15, 0);

      const breastplate = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.32, 0.68, 8), goldArmorMat);
      breastplate.position.set(0, 0.38, 0.12);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), stormFeatherMat);
      head.position.set(0, 0.96, 0.14);

      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.55, 5), goldArmorMat);
      crown.position.set(0, 1.32, 0.12);

      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 4), goldArmorMat);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0.94, 0.48);

      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), lightningMat);
      eyeL.position.set(-0.14, 1.0, 0.4);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.14;

      // Wide Articulated Storm-Feather Wings (Left & Right Wing Pivots)
      const createHarpyWing = (side: -1 | 1): THREE.Group => {
        const wingPivot = new THREE.Group();
        wingPivot.position.set(side * 0.44, 0.52, -0.08);

        for (let f = 0; f < 4; f++) {
          const feather = new THREE.Mesh(
            new THREE.ConeGeometry(0.28 - f * 0.03, 1.55 - f * 0.12, 5),
            f % 2 === 0 ? stormFeatherMat : lightningMat
          );
          feather.scale.set(1.0, 1.0, 0.22);
          feather.rotation.z = side * (0.85 + f * 0.22);
          feather.position.set(side * (0.65 + f * 0.28), 0.18 - f * 0.12, -f * 0.06);
          wingPivot.add(feather);
        }
        return wingPivot;
      };

      const leftWing = createHarpyWing(-1);
      const rightWing = createHarpyWing(1);
      animParts.leftWing = leftWing;
      animParts.rightWing = rightWing;

      // Floating Storm Lightning Focus Orb in front of chest
      const stormOrbGroup = new THREE.Group();
      stormOrbGroup.position.set(0, 0.28, 0.65);
      const orbCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 1), lightningMat);
      const orbRing = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.035, 8, 20), goldArmorMat);
      stormOrbGroup.add(orbCore, orbRing);
      animParts.haloOrCore = stormOrbGroup;

      // Fan of Tail Feathers
      const tailFan = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.95, 6), stormFeatherMat);
      tailFan.scale.set(1.2, 1.0, 0.2);
      tailFan.rotation.x = -0.55;
      tailFan.position.set(0, -0.62, -0.35);
      animParts.weaponOrTail = tailFan;

      bodyGroup.add(
        torso,
        breastplate,
        head,
        crown,
        beak,
        eyeL,
        eyeR,
        leftWing,
        rightWing,
        stormOrbGroup,
        tailFan
      );
      group.add(bodyGroup);
    } else if (
      archetype === 'dark_kiter' ||
      archetype === 'boss_mage_1' ||
      archetype === 'boss_mage_2' ||
      archetype === 'boss_mage_3'
    ) {
      // Exact Low-Poly Faceted Enemy Wizard from Reference Image:
      // Bent pointed hat with wide brim, dark hood framing angular beige wooden mask with 2 glowing eyes,
      // jagged purple shoulder mantle, dark charcoal outer coat with split jagged tails over deep purple inner robe,
      // wide-stance boots, right hand at side, and extended forward casting arm holding a crooked wooden wand
      // with floating golden-orange & magenta-purple low-poly polyhedra sparkling at the tip!
      const isBoss1 = archetype === 'boss_mage_1';
      const isBoss2 = archetype === 'boss_mage_2';
      const isBoss3 = archetype === 'boss_mage_3';

      const bodyGroup = new THREE.Group();
      if (isBoss1) bodyGroup.scale.setScalar(1.62);
      else if (isBoss2) bodyGroup.scale.setScalar(1.98);
      else if (isBoss3) bodyGroup.scale.setScalar(2.2);
      else bodyGroup.scale.setScalar(1.16);

      const outerCoatMat = new THREE.MeshStandardMaterial({
        color: isBoss3 ? 0x273549 : 0x3e3b47,
        roughness: 0.82,
        metalness: 0.12,
        flatShading: true,
      });
      const innerPurpleMat = new THREE.MeshStandardMaterial({
        color: isBoss3 ? 0x1e40af : isBoss2 ? 0x6b21a8 : 0x543361,
        roughness: 0.75,
        metalness: 0.15,
        flatShading: true,
      });
      const mantlePurpleMat = new THREE.MeshStandardMaterial({
        color: isBoss3 ? 0x1d4ed8 : 0x4c2f54,
        roughness: 0.76,
        metalness: 0.16,
        flatShading: true,
      });
      const hatMat = new THREE.MeshStandardMaterial({
        color: 0x3e3242,
        roughness: 0.8,
        metalness: 0.12,
        flatShading: true,
      });
      const darkTrimMat = new THREE.MeshStandardMaterial({
        color: 0x25212c,
        roughness: 0.85,
        metalness: 0.2,
        flatShading: true,
      });
      const maskSkinMat = new THREE.MeshStandardMaterial({
        color: 0x8d7768,
        roughness: 0.65,
        metalness: 0.08,
        flatShading: true,
      });
      const eyeGlowMat = new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        emissive: 0xfde68a,
        emissiveIntensity: 2.2,
        roughness: 0.1,
      });
      const wandWoodMat = new THREE.MeshStandardMaterial({
        color: 0x6b4c35,
        roughness: 0.78,
        metalness: 0.08,
        flatShading: true,
      });
      const goldSparkMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.85,
        roughness: 0.15,
        flatShading: true,
      });
      const magentaSparkMat = new THREE.MeshStandardMaterial({
        color: 0xd946ef,
        emissive: 0xc026d3,
        emissiveIntensity: 1.75,
        roughness: 0.15,
        flatShading: true,
      });
      const violetSparkMat = new THREE.MeshStandardMaterial({
        color: 0x9333ea,
        emissive: 0x7e22ce,
        emissiveIntensity: 1.5,
        roughness: 0.2,
        flatShading: true,
      });

      // 1. Wide-Stance Low-Poly Boots & Legs
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.72, 5), darkTrimMat);
        leg.position.set(side * 0.28, 0.42, side > 0 ? 0.08 : -0.06);
        leg.rotation.z = -side * 0.12;
        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.42), darkTrimMat);
        boot.position.set(side * 0.32, 0.1, side > 0 ? 0.16 : 0.02);
        boot.rotation.y = -side * 0.22;
        bodyGroup.add(leg, boot);
      }

      // 2. Deep Purple Inner Robe Skirt + Jagged Hem & Dark Waist Belt
      const innerSkirt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.56, 1.08, 6),
        innerPurpleMat
      );
      innerSkirt.position.y = 0.84;
      bodyGroup.add(innerSkirt);

      // Split Dark Outer Coat Panels & Jagged Purple/Charcoal Coat Tails
      for (const side of [-1, 1]) {
        const coatPanel = new THREE.Mesh(
          new THREE.ConeGeometry(0.42, 1.22, 4),
          outerCoatMat
        );
        coatPanel.position.set(side * 0.26, 0.86, -0.04);
        coatPanel.rotation.z = -side * 0.22;
        coatPanel.rotation.y = side * 0.4;
        bodyGroup.add(coatPanel);

        // Jagged triangular coat spikes at bottom hem
        for (let j = 0; j < 3; j++) {
          const spike = new THREE.Mesh(
            new THREE.ConeGeometry(0.16, 0.46, 3),
            j % 2 === 0 ? mantlePurpleMat : outerCoatMat
          );
          spike.rotation.x = Math.PI;
          spike.position.set(
            side * (0.16 + j * 0.13),
            0.34,
            0.18 - j * 0.14
          );
          spike.rotation.z = side * 0.16;
          bodyGroup.add(spike);
        }
      }

      // Waist Belt & Inner Purple Tunic Chest
      const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.18, 6), darkTrimMat);
      belt.position.y = 1.26;
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.29, 0.68, 6), innerPurpleMat);
      torso.position.y = 1.62;
      const outerVest = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.32, 0.64, 6), outerCoatMat);
      outerVest.position.set(0, 1.62, -0.04);
      bodyGroup.add(belt, torso, outerVest);

      // 3. Jagged Purple Shoulder Mantle / Capelet (Layered pointed collar like reference)
      const mantleBase = new THREE.Mesh(
        new THREE.ConeGeometry(0.64, 0.48, 6),
        mantlePurpleMat
      );
      mantleBase.position.set(0, 1.88, 0);
      bodyGroup.add(mantleBase);

      for (let m = 0; m < 6; m++) {
        const ang = (m / 6) * Math.PI * 2 + 0.5;
        const dags = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.38, 3), mantlePurpleMat);
        dags.rotation.x = Math.PI;
        dags.position.set(Math.cos(ang) * 0.42, 1.66, Math.sin(ang) * 0.38);
        dags.rotation.z = Math.cos(ang) * 0.35;
        bodyGroup.add(dags);
      }

      // 4. Dark Hood & Angular Beige Mask with 2 Glowing Eyes
      const hoodOuter = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.66, 6), darkTrimMat);
      hoodOuter.position.set(0, 2.24, -0.02);
      const faceMask = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.12, 0.42, 5), maskSkinMat);
      faceMask.position.set(0, 2.16, 0.12);
      faceMask.rotation.y = Math.PI / 5;

      const eyeL = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), eyeGlowMat);
      eyeL.scale.set(1.3, 0.85, 0.6);
      eyeL.position.set(-0.075, 2.22, 0.29);
      const eyeR = eyeL.clone();
      eyeR.position.set(0.075, 2.22, 0.29);
      bodyGroup.add(hoodOuter, faceMask, eyeL, eyeR);

      // 5. Crooked Pointed Low-Poly Wizard Hat with Wide Brim
      const hatGroup = new THREE.Group();
      hatGroup.position.set(0, 2.42, 0);
      const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.82, 0.07, 7), hatMat);
      hatBrim.rotation.z = -0.06;
      hatBrim.rotation.x = 0.05;
      const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.12, 6), darkTrimMat);
      hatBand.position.y = 0.08;
      const hatMidCone = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.56, 6), hatMat);
      hatMidCone.position.set(-0.03, 0.34, -0.02);
      hatMidCone.rotation.z = 0.16;
      const hatCrookedTip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.48, 5), hatMat);
      hatCrookedTip.position.set(-0.18, 0.68, -0.06);
      hatCrookedTip.rotation.z = 0.65;
      hatCrookedTip.rotation.x = -0.18;
      hatGroup.add(hatBrim, hatBand, hatMidCone, hatCrookedTip);
      bodyGroup.add(hatGroup);

      // 6. Right Arm (Viewer's Left: angled down at side with flared sleeve & beige low-poly hand)
      const sideArmGroup = new THREE.Group();
      sideArmGroup.position.set(-0.44, 1.82, -0.04);
      sideArmGroup.rotation.z = -0.32;
      sideArmGroup.rotation.x = 0.12;
      const sideSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.66, 5), outerCoatMat);
      sideSleeve.position.y = -0.3;
      const sideCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.23, 0.14, 5), mantlePurpleMat);
      sideCuff.position.y = -0.62;
      const sideHand = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), maskSkinMat);
      sideHand.scale.set(0.85, 1.25, 0.9);
      sideHand.position.set(0, -0.74, 0.04);
      sideArmGroup.add(sideSleeve, sideCuff, sideHand);
      bodyGroup.add(sideArmGroup);

      // 7. Extended Forward Casting Arm + Crooked Wooden Wand + Floating Golden & Purple Polyhedra!
      const castArmGroup = new THREE.Group();
      castArmGroup.position.set(0.38, 1.82, 0.12);
      // Extend arm forward (+Z) toward the player/target with flared wizard sleeve
      const castSleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.24, 0.78, 5),
        outerCoatMat
      );
      castSleeve.rotation.x = Math.PI / 2 - 0.12;
      castSleeve.position.set(0.08, -0.04, 0.36);

      const castCuff = new THREE.Mesh(
        new THREE.CylinderGeometry(0.19, 0.25, 0.14, 5),
        mantlePurpleMat
      );
      castCuff.rotation.x = Math.PI / 2 - 0.12;
      castCuff.position.set(0.1, -0.08, 0.72);

      const castHand = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), maskSkinMat);
      castHand.position.set(0.1, -0.1, 0.84);

      // Crooked Wooden Wand (2 angled segments)
      const wandSeg1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.036, 0.48, 5),
        wandWoodMat
      );
      wandSeg1.rotation.x = Math.PI / 2 - 0.28;
      wandSeg1.rotation.z = -0.12;
      wandSeg1.position.set(0.13, -0.02, 1.05);

      const wandSeg2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.024, 0.44, 5),
        wandWoodMat
      );
      wandSeg2.rotation.x = Math.PI / 2 - 0.42;
      wandSeg2.rotation.z = 0.08;
      wandSeg2.position.set(0.14, 0.12, 1.42);

      // Floating Low-Poly Arcane Polyhedra Cluster at Wand Tip (exact reference match!)
      const wandSparkGroup = new THREE.Group();
      wandSparkGroup.position.set(0.14, 0.28, 1.78);

      const bigGoldPoly = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), goldSparkMat);
      bigGoldPoly.position.set(0, 0, 0);

      const smallOrangePoly = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), goldSparkMat);
      smallOrangePoly.position.set(-0.18, -0.18, -0.12);

      const bigMagentaPoly = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.155, 0),
        magentaSparkMat
      );
      bigMagentaPoly.position.set(0.24, 0.28, 0.18);

      const midVioletPoly1 = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.095, 0),
        violetSparkMat
      );
      midVioletPoly1.position.set(-0.14, 0.24, 0.06);

      const midVioletPoly2 = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.085, 0),
        magentaSparkMat
      );
      midVioletPoly2.position.set(0.26, -0.06, 0.12);

      // Tiny orbiting crystal shards
      for (let s = 0; s < 5; s++) {
        const shard = new THREE.Mesh(
          new THREE.ConeGeometry(0.035, 0.12, 3),
          s % 2 === 0 ? goldSparkMat : magentaSparkMat
        );
        const a = (s / 5) * Math.PI * 2;
        shard.position.set(Math.cos(a) * 0.34, Math.sin(a) * 0.28, (s - 2) * 0.06);
        shard.rotation.set(a, a * 1.5, a * 0.7);
        wandSparkGroup.add(shard);
      }

      wandSparkGroup.add(
        bigGoldPoly,
        smallOrangePoly,
        bigMagentaPoly,
        midVioletPoly1,
        midVioletPoly2
      );

      castArmGroup.add(castSleeve, castCuff, castHand, wandSeg1, wandSeg2, wandSparkGroup);
      animParts.weaponOrTail = castArmGroup;
      animParts.haloOrCore = wandSparkGroup;

      bodyGroup.add(castArmGroup);
      group.add(bodyGroup);
    } else if (archetype === 'boss_totem') {
      // Allied Shooting Totem guarding Boss 2 / Boss 3: Carved Obsidian Pillar + Glowing Rotating Rings + Arcane Eye Turret
      const stoneMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.75,
        metalness: 0.3,
      });
      const runeMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x9333ea,
        emissiveIntensity: 1.5,
        roughness: 0.2,
      });
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.3,
        metalness: 0.85,
      });

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.12, 0.65, 8), stoneMat);
      base.position.y = 0.32;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.76, 2.5, 8), stoneMat);
      pillar.position.y = 1.65;
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.065, 8, 20), goldMat);
      ring1.rotation.x = Math.PI / 2;
      ring1.position.y = 1.45;

      const turretGroup = new THREE.Group();
      turretGroup.position.y = 3.15;
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.06, 8, 20), runeMat);
      const eyeCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.52, 0), runeMat);
      turretGroup.add(ring2, eyeCore);
      animParts.haloOrCore = turretGroup;

      group.add(base, pillar, ring1, turretGroup);
    } else if (archetype === 'fire_demon') {
      // Stage 4 Fire Demon (Огненный Демон): Obsidian-crimson horned demon with glowing magma core,
      // articulated flame wings, and fiery rune blades (shoots a moving Wall of Fire!)
      const obsidianMat = new THREE.MeshStandardMaterial({
        color: 0x271216,
        roughness: 0.42,
        metalness: 0.55,
      });
      const magmaMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 1.55,
        roughness: 0.2,
      });
      const crimsonMat = new THREE.MeshStandardMaterial({
        color: 0xb91c1c,
        roughness: 0.35,
        metalness: 0.45,
      });

      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 1.0, 7), obsidianMat);
      legL.position.set(-0.34, 0.5, 0);
      const legR = legL.clone();
      legR.position.x = 0.34;

      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.52, 1.45, 8), crimsonMat);
      torso.position.y = 1.52;

      const magmaCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 1), magmaMat);
      magmaCore.position.set(0, 1.58, 0.58);
      animParts.haloOrCore = magmaCore;

      const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), obsidianMat);
      head.position.set(0, 2.52, 0.08);

      for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), magmaMat);
        eye.position.set(side * 0.15, 2.56, 0.42);
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.78, 6), magmaMat);
        horn.position.set(side * 0.36, 2.95, -0.05);
        horn.rotation.z = -side * 0.52;
        horn.rotation.x = 0.22;
        group.add(eye, horn);
      }

      const wingGeo = new THREE.ConeGeometry(0.58, 1.9, 4);
      const wingL = new THREE.Mesh(wingGeo, magmaMat);
      wingL.position.set(-0.88, 2.15, -0.35);
      wingL.rotation.z = 0.62;
      const wingR = new THREE.Mesh(wingGeo, magmaMat);
      wingR.position.set(0.88, 2.15, -0.35);
      wingR.rotation.z = -0.62;
      animParts.leftWing = wingL;
      animParts.rightWing = wingR;

      const bladeGroup = new THREE.Group();
      bladeGroup.position.set(0.92, 1.48, 0.32);
      const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6), obsidianMat);
      const flameBlade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.65, 0.32), magmaMat);
      flameBlade.position.y = 0.95;
      bladeGroup.add(hilt, flameBlade);
      animParts.weaponOrTail = bladeGroup;

      group.add(legL, legR, torso, magmaCore, head, wingL, wingR, bladeGroup);
    } else if (archetype === 'water_monster') {
      // Stage 4 Water Monster (Водяной Монстр): Swirling abyssal hydro-elemental with glowing cyan core,
      // wave-crest tentacles, and cryo-crown (casts Ice Rain AoE on the floor!)
      const deepSeaMat = new THREE.MeshStandardMaterial({
        color: 0x0369a1,
        roughness: 0.18,
        metalness: 0.35,
      });
      const hydroGlowMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 1.45,
        roughness: 0.12,
      });
      const foamMat = new THREE.MeshStandardMaterial({
        color: 0xe0f2fe,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.65,
        roughness: 0.2,
      });

      const vortexBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.98, 1.15, 12),
        deepSeaMat
      );
      vortexBase.position.y = 0.58;

      const hydroTorso = new THREE.Mesh(new THREE.SphereGeometry(0.74, 14, 12), deepSeaMat);
      hydroTorso.scale.set(1.0, 1.28, 0.92);
      hydroTorso.position.y = 1.68;

      const coreOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), hydroGlowMat);
      coreOrb.position.set(0, 1.78, 0.56);

      const headCrest = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.92, 8), hydroGlowMat);
      headCrest.position.set(0, 2.75, 0);

      for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), foamMat);
        eye.position.set(side * 0.18, 2.35, 0.52);
        group.add(eye);
      }

      const tentacleL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.26, 1.65, 8),
        hydroGlowMat
      );
      tentacleL.position.set(-0.92, 1.65, 0.25);
      tentacleL.rotation.z = 0.48;
      const tentacleR = tentacleL.clone();
      tentacleR.position.x = 0.92;
      tentacleR.rotation.z = -0.48;
      animParts.leftWing = tentacleL;
      animParts.rightWing = tentacleR;

      const crownGroup = new THREE.Group();
      crownGroup.position.y = 2.65;
      const iceRing = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.06, 8, 20), foamMat);
      iceRing.rotation.x = Math.PI / 2;
      crownGroup.add(iceRing);
      animParts.haloOrCore = crownGroup;

      group.add(
        vortexBase,
        hydroTorso,
        coreOrb,
        headCrest,
        tentacleL,
        tentacleR,
        crownGroup
      );
    } else if (archetype === 'stone_crusher') {
      // Stage 4 Stone Crusher / Golem (Каменный Крушитель): Hulking jagged basalt/granite colossus
      // with glowing tectonic core and a floor Charge Trajectory Line shown during its 1s red windup!
      const graniteMat = new THREE.MeshStandardMaterial({
        color: 0x57534e,
        roughness: 0.88,
        metalness: 0.18,
      });
      const basaltMat = new THREE.MeshStandardMaterial({
        color: 0x292524,
        roughness: 0.92,
        metalness: 0.22,
      });
      const tectonicMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 1.35,
        roughness: 0.25,
      });

      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.54, 1.12, 0.58), basaltMat);
      legL.position.set(-0.46, 0.56, 0);
      const legR = legL.clone();
      legR.position.x = 0.46;

      const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(0.96, 0), graniteMat);
      torso.scale.set(1.15, 1.1, 0.92);
      torso.position.y = 1.75;

      const coreRune = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), tectonicMat);
      coreRune.position.set(0, 1.78, 0.82);
      animParts.haloOrCore = coreRune;

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.62, 0.64), basaltMat);
      head.position.set(0, 2.82, 0.12);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.14, 0.22), tectonicMat);
      visor.position.set(0, 2.84, 0.42);

      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.55, 0.56), graniteMat);
      armL.position.set(-1.22, 1.68, 0.24);
      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.65, 0.62), graniteMat);
      armR.position.set(1.22, 1.68, 0.24);
      animParts.weaponOrTail = armR;

      group.add(legL, legR, torso, coreRune, head, visor, armL, armR);
    } else if (archetype === 'boss_elemental_4') {
      // STAGE 4 FINAL BOSS: Tri-Elemental Titan (БОСС 4: Элементаль Трёх Стихий — Огонь, Вода и Земля)
      // Combines Earth basalt armor, Fire magma wing & horn, and Water/Ice crystal wing & vortex!
      const earthStoneMat = new THREE.MeshStandardMaterial({
        color: 0x44403c,
        roughness: 0.82,
        metalness: 0.28,
      });
      const fireMagmaMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 1.65,
        roughness: 0.18,
      });
      const waterIceMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 1.65,
        roughness: 0.15,
      });
      const triCoreMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.8,
        roughness: 0.1,
      });

      const baseVortex = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.65, 1.55, 12),
        earthStoneMat
      );
      baseVortex.position.y = 0.78;

      const torso = new THREE.Mesh(new THREE.DodecahedronGeometry(1.32, 0), earthStoneMat);
      torso.scale.set(1.18, 1.25, 0.95);
      torso.position.y = 2.45;

      const triCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.58, 1), triCoreMat);
      triCore.position.set(0, 2.55, 1.05);

      const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.68, 0), earthStoneMat);
      head.position.set(0, 4.15, 0.1);

      const hornFire = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.15, 6), fireMagmaMat);
      hornFire.position.set(-0.48, 4.75, 0);
      hornFire.rotation.z = 0.45;
      const hornIce = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.15, 6), waterIceMat);
      hornIce.position.set(0.48, 4.75, 0);
      hornIce.rotation.z = -0.45;

      const wingFireL = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.85, 5), fireMagmaMat);
      wingFireL.position.set(-1.55, 3.25, -0.45);
      wingFireL.rotation.z = 0.58;
      const wingIceR = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.85, 5), waterIceMat);
      wingIceR.position.set(1.55, 3.25, -0.45);
      wingIceR.rotation.z = -0.58;
      animParts.leftWing = wingFireL;
      animParts.rightWing = wingIceR;

      const elementalHalo = new THREE.Group();
      elementalHalo.position.set(0, 3.35, -0.35);
      const fireRing = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 8, 28), fireMagmaMat);
      const iceRing = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.08, 8, 28), waterIceMat);
      iceRing.rotation.y = Math.PI / 3;
      elementalHalo.add(fireRing, iceRing);
      animParts.haloOrCore = elementalHalo;

      const crusherArm = new THREE.Mesh(new THREE.BoxGeometry(0.68, 2.2, 0.68), earthStoneMat);
      crusherArm.position.set(1.65, 2.35, 0.45);
      animParts.weaponOrTail = crusherArm;

      group.add(
        baseVortex,
        torso,
        triCore,
        head,
        hornFire,
        hornIce,
        wingFireL,
        wingIceR,
        elementalHalo,
        crusherArm
      );
    } else if (archetype === 'frost_charger') {
      // Multi-part Frost Dragon Vanguard Knight: Articulated Ice-Dragon Wings, Horned Dragon Helm,
      // Frost Halberd, Rune Tower Shield, and Glowing Cryo-Core
      const iceArmorMat = new THREE.MeshStandardMaterial({
        color: 0x0369a1,
        roughness: 0.24,
        metalness: 0.82,
      });
      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0ea5e9,
        emissiveIntensity: 1.35,
        roughness: 0.15,
      });
      const silverMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.25,
        metalness: 0.9,
      });

      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.05, 0.46), iceArmorMat);
      legL.position.set(-0.36, 0.52, 0);
      const legR = legL.clone();
      legR.position.x = 0.36;

      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.68, 1.5, 8), iceArmorMat);
      torso.position.y = 1.58;
      const coreGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), crystalMat);
      coreGem.position.set(0, 1.65, 0.76);
      animParts.haloOrCore = coreGem;

      // Articulated Dragon Crystal Wings on Back
      const wingGeo = new THREE.ConeGeometry(0.52, 1.85, 5);
      const wingL = new THREE.Mesh(wingGeo, crystalMat);
      wingL.position.set(-0.92, 2.32, -0.38);
      wingL.rotation.z = 0.58;
      const wingR = new THREE.Mesh(wingGeo, crystalMat);
      wingR.position.set(0.92, 2.32, -0.38);
      wingR.rotation.z = -0.58;
      animParts.leftWing = wingL;
      animParts.rightWing = wingR;

      const helm = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.98, 6), iceArmorMat);
      helm.position.y = 2.68;
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.36), crystalMat);
      visor.position.set(0, 2.52, 0.32);

      for (const side of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.65, 5), silverMat);
        horn.position.set(side * 0.42, 2.95, 0);
        horn.rotation.z = -side * 0.48;
        group.add(horn);
      }

      // Animated Frost Halberd in Right Hand
      const halberdGroup = new THREE.Group();
      halberdGroup.position.set(1.06, 1.48, 0.28);
      const halberdShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 2.95, 8),
        silverMat
      );
      const halberdBlade = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), crystalMat);
      halberdBlade.scale.set(0.55, 1.75, 0.85);
      halberdBlade.position.set(0, 1.32, 0.12);
      halberdGroup.add(halberdShaft, halberdBlade);
      animParts.weaponOrTail = halberdGroup;

      // Tower Ice Shield in Left Hand
      const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.64, 0.18, 6), crystalMat);
      shield.rotation.x = Math.PI / 2;
      shield.position.set(-1.05, 1.5, 0.4);

      group.add(
        legL,
        legR,
        torso,
        coreGem,
        wingL,
        wingR,
        helm,
        visor,
        halberdGroup,
        shield
      );
    } else if (archetype === 'mud_monster') {
      // STAGE 5 MOB: Болотный Грязевик (`mud_monster`)
      // Semi-liquid bog monster rising from a puddle of bubbling mud, with dripping sludge tendrils and glowing amber core
      const mudMat = new THREE.MeshStandardMaterial({
        color: 0x422006,
        roughness: 0.35,
        metalness: 0.25,
        flatShading: true,
      });
      const oozeMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        emissive: 0xb45309,
        emissiveIntensity: 1.4,
        roughness: 0.2,
      });

      const basePuddle = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.35, 0.28, 12),
        mudMat
      );
      basePuddle.position.y = 0.14;

      const lowerBlob = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 1), mudMat);
      lowerBlob.scale.set(1.15, 1.05, 1.15);
      lowerBlob.position.y = 0.9;

      const upperTorso = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 1), mudMat);
      upperTorso.position.set(0, 1.75, 0.08);

      const coreGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), oozeMat);
      coreGem.position.set(0, 1.65, 0.52);
      animParts.haloOrCore = coreGem;

      const armGroup = new THREE.Group();
      for (const side of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.25, 7), mudMat);
        arm.position.set(side * 0.82, 1.6, 0.35);
        arm.rotation.z = side * 0.55;
        arm.rotation.x = 0.5;
        armGroup.add(arm);

        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), oozeMat);
        eye.position.set(side * 0.24, 2.02, 0.56);
        group.add(eye);
      }
      animParts.weaponOrTail = armGroup;

      group.add(basePuddle, lowerBlob, upperTorso, coreGem, armGroup);
    } else if (archetype === 'cave_bear') {
      // STAGE 5 MOB: Пещерный Медведь (`cave_bear`) — Reference Sheet (`/public/assets/aistudio/image_4080c35e.png`):
      // Faceted low-poly grizzly bear in warm cinnamon-brown fur (`0x8b4a24`), lighter shoulder hump (`0x9e562b`),
      // darker chest/underbelly (`0x5c2e14`), short stubby triangular bear tail, broad head with cupped round ears,
      // distinct light sandy-tan tapered muzzle (`0xd49b5e`), sculpted dark polygonal bear nose (`0x231712`) with
      // nostrils and vertical philtrum crease, and 4 thick plantigrade legs with wide paws & 4 grey claws each (`CLAW`)!
      const bodyGroup = new THREE.Group();
      bodyGroup.scale.setScalar(1.38);

      const bearFurMat = new THREE.MeshStandardMaterial({
        color: 0x8b4a24,
        roughness: 0.78,
        metalness: 0.05,
        flatShading: true,
      });
      const bearLightFurMat = new THREE.MeshStandardMaterial({
        color: 0x9e562b,
        roughness: 0.74,
        metalness: 0.05,
        flatShading: true,
      });
      const bearDarkFurMat = new THREE.MeshStandardMaterial({
        color: 0x5c2e14,
        roughness: 0.85,
        metalness: 0.04,
        flatShading: true,
      });
      const muzzleMat = new THREE.MeshStandardMaterial({
        color: 0xd49b5e,
        roughness: 0.66,
        metalness: 0.04,
        flatShading: true,
      });
      const noseMat = new THREE.MeshStandardMaterial({
        color: 0x231712,
        roughness: 0.52,
        metalness: 0.08,
        flatShading: true,
      });
      const nostrilDarkMat = new THREE.MeshStandardMaterial({
        color: 0x0d0806,
        roughness: 0.92,
      });
      const eyeMat = new THREE.MeshStandardMaterial({
        color: 0x1a110b,
        roughness: 0.32,
      });
      const clawMat = new THREE.MeshStandardMaterial({
        color: 0x8c8275,
        roughness: 0.44,
        metalness: 0.16,
        flatShading: true,
      });

      // 1. Faceted Low-Poly Grizzly Torso, Shoulder Hump, Hindquarters, Deep Chest & Stubby Tail
      const ribcage = new THREE.Mesh(
        new THREE.CylinderGeometry(0.54, 0.6, 1.06, 8),
        bearFurMat
      );
      ribcage.rotation.x = Math.PI / 2;
      ribcage.scale.set(1.08, 1.0, 1.04);
      ribcage.position.set(0, 1.02, 0.02);

      const shoulderHump = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.58, 0),
        bearLightFurMat
      );
      shoulderHump.scale.set(1.12, 0.96, 1.16);
      shoulderHump.position.set(0, 1.18, 0.36);

      const backRidge = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.22, 0.96),
        bearLightFurMat
      );
      backRidge.position.set(0, 1.46, -0.06);
      backRidge.rotation.x = -0.08;

      const hindquarters = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.58, 0),
        bearFurMat
      );
      hindquarters.scale.set(1.14, 1.02, 1.08);
      hindquarters.position.set(0, 1.03, -0.48);

      const deepChest = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.46, 0),
        bearDarkFurMat
      );
      deepChest.scale.set(1.08, 0.92, 0.95);
      deepChest.position.set(0, 0.84, 0.52);

      const underbelly = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 0.24, 0.98),
        bearDarkFurMat
      );
      underbelly.position.set(0, 0.64, -0.04);

      // Cute stubby triangular bear tail (`BACK` & `SIDE` view)
      const stubTail = new THREE.Mesh(
        new THREE.ConeGeometry(0.11, 0.24, 4),
        bearFurMat
      );
      stubTail.position.set(0, 1.12, -1.02);
      stubTail.rotation.x = -2.35;
      stubTail.rotation.y = Math.PI / 4;

      // 2. Sculpted Bear Head (`HEAD` callout): Broad Cranium, Cheek Jowls, Cupped Ears, Tan Muzzle & Polygonal Nose!
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.16, 0.92);

      const cranium = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.42, 1),
        bearFurMat
      );
      cranium.scale.set(1.16, 0.98, 0.95);

      const foreheadPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.18, 0.36),
        bearLightFurMat
      );
      foreheadPlate.position.set(0, 0.19, 0.08);
      foreheadPlate.rotation.x = 0.22;

      // Wide furry side cheek jowls (giving the bear head its iconic wide pentagonal silhouette in `FRONT` & `HEAD`)
      for (const side of [-1, 1]) {
        const cheekJowl = new THREE.Mesh(
          new THREE.ConeGeometry(0.24, 0.38, 5),
          bearFurMat
        );
        cheekJowl.position.set(side * 0.31, -0.06, 0.02);
        cheekJowl.rotation.z = side * 0.65;
        cheekJowl.rotation.x = 0.15;

        // Cupped Round Bear Ears (`уши медведя`)
        const earOuter = new THREE.Mesh(
          new THREE.CylinderGeometry(0.115, 0.095, 0.085, 7),
          bearFurMat
        );
        earOuter.rotation.x = Math.PI / 2;
        earOuter.rotation.z = -side * 0.32;
        earOuter.position.set(side * 0.31, 0.31, -0.04);

        const earInner = new THREE.Mesh(
          new THREE.CylinderGeometry(0.068, 0.058, 0.09, 6),
          bearDarkFurMat
        );
        earInner.rotation.x = Math.PI / 2;
        earInner.rotation.z = -side * 0.32;
        earInner.position.set(side * 0.31, 0.305, -0.028);

        // Prominent Brow Ridge + High-Contrast Visible Bear Eyes (`Медведь добавь глаза визуально их не видно`)
        // Positioned clearly outside the cranium (`z = 0.378..0.422`) with dark socket, amber-gold iris, dark pupil & specular glint!
        const brow = new THREE.Mesh(
          new THREE.BoxGeometry(0.165, 0.062, 0.14),
          bearDarkFurMat
        );
        brow.position.set(side * 0.175, 0.145, 0.355);
        brow.rotation.z = -side * 0.22;
        brow.rotation.y = side * 0.22;

        const eyeSocket = new THREE.Mesh(
          new THREE.BoxGeometry(0.115, 0.078, 0.065),
          nostrilDarkMat
        );
        eyeSocket.position.set(side * 0.175, 0.088, 0.382);
        eyeSocket.rotation.z = -side * 0.16;
        eyeSocket.rotation.y = side * 0.26;

        const eyeIrisMat = new THREE.MeshStandardMaterial({
          color: 0xffb703,
          emissive: 0xd97706,
          emissiveIntensity: 0.65,
          roughness: 0.22,
        });
        const eye = new THREE.Mesh(
          new THREE.BoxGeometry(0.092, 0.056, 0.055),
          eyeIrisMat
        );
        eye.position.set(side * 0.176, 0.088, 0.398);
        eye.rotation.z = -side * 0.16;
        eye.rotation.y = side * 0.26;

        const eyePupil = new THREE.Mesh(
          new THREE.BoxGeometry(0.048, 0.046, 0.042),
          eyeMat
        );
        eyePupil.position.set(side * 0.174, 0.088, 0.414);
        eyePupil.rotation.z = -side * 0.16;
        eyePupil.rotation.y = side * 0.26;

        const eyeGlint = new THREE.Mesh(
          new THREE.SphereGeometry(0.014, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        eyeGlint.position.set(side * 0.162, 0.102, 0.432);

        headGroup.add(cheekJowl, earOuter, earInner, brow, eyeSocket, eye, eyePupil, eyeGlint);
      }

      // Tapered Light Sandy-Tan Muzzle (`морда медведя` — 4-sided bevelled frustum prism matching `HEAD` & `3/4 VIEW`)
      const muzzleUpper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.165, 0.255, 0.42, 4),
        muzzleMat
      );
      muzzleUpper.rotation.x = Math.PI / 2 + 0.08;
      muzzleUpper.rotation.y = Math.PI / 4;
      muzzleUpper.scale.set(1.12, 1.0, 0.94);
      muzzleUpper.position.set(0, -0.08, 0.34);

      const muzzleBridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.21, 0.11, 0.38),
        muzzleMat
      );
      muzzleBridge.position.set(0, 0.01, 0.34);
      muzzleBridge.rotation.x = 0.16;

      const lowerJaw = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.1, 0.34),
        muzzleMat
      );
      lowerJaw.position.set(0, -0.21, 0.29);

      const mouthLine = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.026, 0.33),
        noseMat
      );
      mouthLine.position.set(0, -0.155, 0.31);

      // Sculpted Polygonal Bear Nose (`нос медведя` — wide dark nose pad + tapered lower septum + 2 nostrils + philtrum line!)
      const nosePadTop = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.095, 0.1),
        noseMat
      );
      nosePadTop.position.set(0, -0.025, 0.535);
      nosePadTop.rotation.x = 0.12;

      const nosePadBottom = new THREE.Mesh(
        new THREE.ConeGeometry(0.095, 0.085, 4),
        noseMat
      );
      nosePadBottom.rotation.x = Math.PI;
      nosePadBottom.rotation.y = Math.PI / 4;
      nosePadBottom.scale.set(1.15, 1.0, 0.72);
      nosePadBottom.position.set(0, -0.085, 0.535);

      const philtrumLine = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.09, 0.03),
        noseMat
      );
      philtrumLine.position.set(0, -0.115, 0.535);

      for (const side of [-1, 1]) {
        const nostril = new THREE.Mesh(
          new THREE.SphereGeometry(0.026, 6, 6),
          nostrilDarkMat
        );
        nostril.scale.set(0.85, 1.15, 0.7);
        nostril.position.set(side * 0.056, -0.03, 0.576);
        headGroup.add(nostril);
      }

      headGroup.add(
        cranium,
        foreheadPlate,
        muzzleUpper,
        muzzleBridge,
        lowerJaw,
        mouthLine,
        nosePadTop,
        nosePadBottom,
        philtrumLine
      );
      animParts.weaponOrTail = headGroup;

      // 3. Four Muscular Faceted Plantigrade Bear Legs & Wide Paws with 4 Curved Claws Each (`CLAW` callout)
      for (const side of [-1, 1]) {
        // Front Leg + Paw + 4 Claws
        const fShoulder = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.19, 0.56, 6),
          bearFurMat
        );
        fShoulder.position.set(side * 0.37, 0.74, 0.45);
        fShoulder.rotation.x = 0.08;
        fShoulder.rotation.z = side * 0.04;

        const fForearm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.19, 0.16, 0.48, 6),
          bearFurMat
        );
        fForearm.position.set(side * 0.38, 0.34, 0.47);

        const fPaw = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.13, 0.36),
          bearDarkFurMat
        );
        fPaw.position.set(side * 0.38, 0.065, 0.54);

        const fPawTop = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.1, 0.26),
          bearFurMat
        );
        fPawTop.position.set(side * 0.38, 0.12, 0.52);
        fPawTop.rotation.x = 0.18;

        for (const cx of [-0.096, -0.032, 0.032, 0.096]) {
          const fClaw = new THREE.Mesh(
            new THREE.ConeGeometry(0.025, 0.13, 4),
            clawMat
          );
          fClaw.rotation.x = Math.PI / 2 + 0.32;
          fClaw.position.set(side * 0.38 + cx, 0.045, 0.75);
          bodyGroup.add(fClaw);
        }

        // Hind Leg + Paw + 4 Claws
        const hThigh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.27, 0.19, 0.58, 6),
          bearFurMat
        );
        hThigh.position.set(side * 0.39, 0.74, -0.48);
        hThigh.rotation.x = -0.16;
        hThigh.rotation.z = side * 0.04;

        const hShin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.19, 0.155, 0.48, 6),
          bearFurMat
        );
        hShin.position.set(side * 0.39, 0.34, -0.54);
        hShin.rotation.x = 0.1;

        const hPaw = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.13, 0.38),
          bearDarkFurMat
        );
        hPaw.position.set(side * 0.39, 0.065, -0.46);

        const hPawTop = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.1, 0.28),
          bearFurMat
        );
        hPawTop.position.set(side * 0.39, 0.12, -0.48);
        hPawTop.rotation.x = 0.18;

        for (const cx of [-0.096, -0.032, 0.032, 0.096]) {
          const hClaw = new THREE.Mesh(
            new THREE.ConeGeometry(0.025, 0.13, 4),
            clawMat
          );
          hClaw.rotation.x = Math.PI / 2 + 0.32;
          hClaw.position.set(side * 0.39 + cx, 0.045, -0.24);
          bodyGroup.add(hClaw);
        }

        bodyGroup.add(
          fShoulder,
          fForearm,
          fPaw,
          fPawTop,
          hThigh,
          hShin,
          hPaw,
          hPawTop
        );
      }

      bodyGroup.add(
        ribcage,
        shoulderHump,
        backRidge,
        hindquarters,
        deepChest,
        underbelly,
        stubTail,
        headGroup
      );
      group.add(bodyGroup);
    } else if (archetype === 'skeleton_archer') {
      // STAGE 5 MOB: Скелет-Лучник (`skeleton_archer`) — Reference Sheet Top Row:
      // Aged bone-ivory skeleton with dark hollow recessed eye sockets & nasal cavity, exposed vertebral spine & curved ribcage,
      // tattered brown leather loincloth with dark belt, diagonal chest leather strap, back quiver with feathered arrows,
      // articulated skeletal limbs & feet, and carved wooden recurve bow with nocked arrow!
      const boneMat = new THREE.MeshStandardMaterial({
        color: 0xd9cfb8,
        roughness: 0.56,
        metalness: 0.06,
        flatShading: true,
      });
      const boneShadeMat = new THREE.MeshStandardMaterial({
        color: 0xb8ab90,
        roughness: 0.68,
        metalness: 0.05,
        flatShading: true,
      });
      const socketDarkMat = new THREE.MeshStandardMaterial({
        color: 0x171412,
        roughness: 0.95,
      });
      const leatherMat = new THREE.MeshStandardMaterial({
        color: 0x5c4033,
        roughness: 0.82,
        flatShading: true,
      });
      const darkStrapMat = new THREE.MeshStandardMaterial({
        color: 0x3b261d,
        roughness: 0.78,
        flatShading: true,
      });
      const bowWoodMat = new THREE.MeshStandardMaterial({
        color: 0x78553a,
        roughness: 0.62,
        metalness: 0.08,
        flatShading: true,
      });
      const arrowIronMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.36,
        metalness: 0.72,
        flatShading: true,
      });
      const stringMat = new THREE.MeshStandardMaterial({
        color: 0xd6d3d1,
        roughness: 0.5,
      });

      // Articulated Skeletal Legs (Femur + Knee Joint + Tibia + Skeletal Foot)
      for (const side of [-1, 1]) {
        const legGroup = new THREE.Group();
        const femur = new THREE.Mesh(
          new THREE.CylinderGeometry(0.068, 0.052, 0.52, 6),
          boneMat
        );
        femur.position.set(side * 0.21, 0.82, 0);
        const knee = new THREE.Mesh(new THREE.SphereGeometry(0.068, 6, 6), boneShadeMat);
        knee.position.set(side * 0.21, 0.54, 0.02);
        const tibia = new THREE.Mesh(
          new THREE.CylinderGeometry(0.056, 0.044, 0.5, 6),
          boneMat
        );
        tibia.position.set(side * 0.21, 0.28, 0);
        const foot = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.068, 0.3),
          boneMat
        );
        foot.position.set(side * 0.22, 0.035, 0.08);
        foot.rotation.y = side * 0.12;
        legGroup.add(femur, knee, tibia, foot);
        group.add(legGroup);
      }

      // Iliac Pelvis + Leather Waist Belt + Tattered Brown Leather Loincloth (Front & Back Jagged Flaps)
      const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.28), boneMat);
      pelvis.position.set(0, 1.08, 0);
      const waistBelt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.27, 0.26, 0.085, 8),
        darkStrapMat
      );
      waistBelt.scale.set(1.08, 1.0, 0.72);
      waistBelt.position.set(0, 1.11, 0);

      const loinclothGroup = new THREE.Group();
      for (const zSide of [-1, 1]) {
        for (let f = -1; f <= 1; f++) {
          const flap = new THREE.Mesh(
            new THREE.ConeGeometry(0.11, 0.36 - Math.abs(f) * 0.06, 4),
            leatherMat
          );
          flap.rotation.x = Math.PI + zSide * 0.08;
          flap.rotation.y = Math.PI / 4;
          flap.scale.set(1.15, 1.0, 0.35);
          flap.position.set(f * 0.13, 0.91, zSide * 0.16);
          loinclothGroup.add(flap);
        }
      }

      // Segmented Vertebral Spine + Open Ribcage with Individual Curved Ribs & Sternum
      const spine = new THREE.Mesh(
        new THREE.CylinderGeometry(0.062, 0.054, 0.94, 6),
        boneShadeMat
      );
      spine.position.set(0, 1.54, -0.07);
      const ribcageGroup = new THREE.Group();
      for (let v = 0; v < 6; v++) {
        const vertebra = new THREE.Mesh(
          new THREE.BoxGeometry(0.11, 0.07, 0.12),
          boneMat
        );
        vertebra.position.set(0, 1.18 + v * 0.13, -0.08);
        ribcageGroup.add(vertebra);
      }

      const sternum = new THREE.Mesh(
        new THREE.BoxGeometry(0.095, 0.44, 0.065),
        boneMat
      );
      sternum.position.set(0, 1.67, 0.16);
      ribcageGroup.add(sternum);

      for (let r = 0; r < 4; r++) {
        const ribRadius = 0.25 - r * 0.018;
        const ribY = 1.82 - r * 0.11;
        const ribArc = new THREE.Mesh(
          new THREE.TorusGeometry(ribRadius, 0.032, 5, 10, Math.PI * 1.48),
          boneMat
        );
        ribArc.rotation.x = Math.PI / 2 + 0.12;
        ribArc.rotation.z = -Math.PI * 0.24;
        ribArc.scale.set(1.12, 0.78, 1.0);
        ribArc.position.set(0, ribY, 0.01);
        ribcageGroup.add(ribArc);
      }

      // Collarbones (Clavicles) & Shoulder Blades (Scapulae)
      for (const side of [-1, 1]) {
        const clavicle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.032, 0.032, 0.34, 5),
          boneMat
        );
        clavicle.rotation.z = Math.PI / 2 - side * 0.14;
        clavicle.position.set(side * 0.17, 1.93, 0.08);
        const scapula = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.24, 0.045),
          boneShadeMat
        );
        scapula.position.set(side * 0.16, 1.78, -0.14);
        scapula.rotation.z = side * 0.15;
        ribcageGroup.add(clavicle, scapula);
      }

      // Diagonal Brown Leather Chest Strap & Cylindrical Back Quiver with Feathered Arrows
      const chestStrap = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.78, 0.34),
        leatherMat
      );
      chestStrap.position.set(0.02, 1.66, 0.01);
      chestStrap.rotation.z = 0.62;

      const quiverGroup = new THREE.Group();
      quiverGroup.position.set(0.14, 1.72, -0.23);
      quiverGroup.rotation.z = -0.42;
      quiverGroup.rotation.x = -0.08;
      const quiverTube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.115, 0.095, 0.76, 8),
        leatherMat
      );
      const quiverRim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.125, 0.12, 0.07, 8),
        darkStrapMat
      );
      quiverRim.position.y = 0.36;
      quiverGroup.add(quiverTube, quiverRim);

      // 4 Feathered Arrows protruding from top of quiver behind right shoulder
      const arrowOffsets = [
        [-0.035, 0.02],
        [0.035, 0.02],
        [0, -0.035],
        [0.02, 0.04],
      ];
      for (const [ax, az] of arrowOffsets) {
        const qShaft = new THREE.Mesh(
          new THREE.CylinderGeometry(0.014, 0.014, 0.42, 5),
          bowWoodMat
        );
        qShaft.position.set(ax, 0.48, az);
        const qFeather = new THREE.Mesh(
          new THREE.BoxGeometry(0.055, 0.12, 0.016),
          leatherMat
        );
        qFeather.position.set(ax, 0.64, az);
        quiverGroup.add(qShaft, qFeather);
      }

      // Sculpted Skull with Recessed Dark Hollow Eye Sockets, Triangular Nasal Cavity & Toothed Jaw
      const skullGroup = new THREE.Group();
      skullGroup.position.set(0, 2.24, 0.02);
      const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.235, 8, 8), boneMat);
      cranium.scale.set(0.96, 1.04, 1.08);
      cranium.position.set(0, 0.05, -0.02);

      const cheekbones = new THREE.Mesh(
        new THREE.BoxGeometry(0.33, 0.12, 0.21),
        boneMat
      );
      cheekbones.position.set(0, -0.02, 0.09);

      const jaw = new THREE.Mesh(
        new THREE.BoxGeometry(0.23, 0.14, 0.21),
        boneShadeMat
      );
      jaw.position.set(0, -0.15, 0.08);

      const teethGroove = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.028, 0.04),
        socketDarkMat
      );
      teethGroove.position.set(0, -0.12, 0.175);

      const nasalCavity = new THREE.Mesh(
        new THREE.ConeGeometry(0.042, 0.085, 3),
        socketDarkMat
      );
      nasalCavity.position.set(0, -0.05, 0.195);
      nasalCavity.rotation.x = 0.15;

      for (const side of [-1, 1]) {
        const eyeSocket = new THREE.Mesh(
          new THREE.CylinderGeometry(0.066, 0.056, 0.08, 7),
          socketDarkMat
        );
        eyeSocket.rotation.x = Math.PI / 2;
        eyeSocket.position.set(side * 0.088, 0.02, 0.175);
        skullGroup.add(eyeSocket);
      }
      skullGroup.add(cranium, cheekbones, jaw, teethGroove, nasalCavity);

      // Articulated Skeletal Arms (Left Arm holds the bow forward; Right Arm draws the string)
      const rightArmGroup = new THREE.Group();
      rightArmGroup.position.set(-0.34, 1.9, 0);
      const rHumerus = new THREE.Mesh(
        new THREE.CylinderGeometry(0.048, 0.04, 0.44, 6),
        boneMat
      );
      rHumerus.position.set(-0.1, -0.16, 0.12);
      rHumerus.rotation.z = -0.45;
      rHumerus.rotation.x = -0.5;
      const rForearm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.034, 0.42, 6),
        boneMat
      );
      rForearm.position.set(-0.08, -0.28, 0.36);
      rForearm.rotation.x = -1.1;
      rForearm.rotation.z = 0.25;
      rightArmGroup.add(rHumerus, rForearm);

      // Left Arm & Carved Wooden Recurve Bow (`animParts.weaponOrTail`)
      const bowGroup = new THREE.Group();
      bowGroup.position.set(0.36, 1.64, 0.48);

      // Left skeletal arm extending into the bow grip
      const lHumerus = new THREE.Mesh(
        new THREE.CylinderGeometry(0.048, 0.04, 0.46, 6),
        boneMat
      );
      lHumerus.position.set(-0.04, 0.18, -0.34);
      lHumerus.rotation.x = Math.PI / 2 - 0.25;
      const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.11), boneShadeMat);
      lHand.position.set(0, 0, -0.04);

      // Central dark leather bow grip + faceted upper & lower wooden limbs (matching reference diagram!)
      const bowGrip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.042, 0.042, 0.34, 6),
        darkStrapMat
      );
      for (const vSign of [-1, 1]) {
        const innerLimb = new THREE.Mesh(
          new THREE.BoxGeometry(0.055, 0.46, 0.085),
          bowWoodMat
        );
        innerLimb.position.set(0, vSign * 0.35, -0.04);
        innerLimb.rotation.x = -vSign * 0.24;

        const outerLimb = new THREE.Mesh(
          new THREE.ConeGeometry(0.045, 0.48, 5),
          bowWoodMat
        );
        outerLimb.position.set(0, vSign * 0.74, -0.18);
        outerLimb.rotation.x = vSign > 0 ? -0.48 : Math.PI + 0.48;
        bowGroup.add(innerLimb, outerLimb);
      }

      // Taut Bowstring + Nocked Feathered Arrow
      const bowString = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 1.72, 4),
        stringMat
      );
      bowString.position.set(0, 0, -0.32);

      const nockedShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.78, 6),
        bowWoodMat
      );
      nockedShaft.rotation.x = Math.PI / 2;
      nockedShaft.position.set(0, 0, 0.06);

      const nockedTip = new THREE.Mesh(
        new THREE.ConeGeometry(0.048, 0.16, 4),
        arrowIronMat
      );
      nockedTip.rotation.x = Math.PI / 2;
      nockedTip.position.set(0, 0, 0.48);

      const nockedFeather = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 0.08, 0.14),
        leatherMat
      );
      nockedFeather.position.set(0, 0, -0.26);

      bowGroup.add(
        lHumerus,
        lHand,
        bowGrip,
        bowString,
        nockedShaft,
        nockedTip,
        nockedFeather
      );
      animParts.weaponOrTail = bowGroup;

      group.add(
        pelvis,
        waistBelt,
        loinclothGroup,
        spine,
        ribcageGroup,
        chestStrap,
        quiverGroup,
        skullGroup,
        rightArmGroup,
        bowGroup
      );
    } else if (archetype === 'skeleton_hammer_shield') {
      // STAGE 5 MOB: Скелет с Молотом и Щитом (`skeleton_hammer_shield`) — Reference Sheet Bottom Row:
      // Aged bone-ivory skeleton wearing a Rusted Iron Barbute/Nasal Helmet, Weathered Rusted Iron Cuirass (Breastplate),
      // Asymmetric Left Shoulder Pauldron, Leather Belt with Metal Buckle + Jagged Chainmail Skirt,
      // Heavy Double-Headed War Hammer in Right Hand (`animParts.weaponOrTail`), and Round Wooden Plank Shield with Iron Rim & Boss in Left Hand (`animParts.haloOrCore`)!
      const boneMat = new THREE.MeshStandardMaterial({
        color: 0xd9cfb8,
        roughness: 0.56,
        metalness: 0.06,
        flatShading: true,
      });
      const boneShadeMat = new THREE.MeshStandardMaterial({
        color: 0xb8ab90,
        roughness: 0.68,
        metalness: 0.05,
        flatShading: true,
      });
      const socketDarkMat = new THREE.MeshStandardMaterial({
        color: 0x171412,
        roughness: 0.95,
      });
      const weatheredIronMat = new THREE.MeshStandardMaterial({
        color: 0x57534e,
        roughness: 0.5,
        metalness: 0.64,
        flatShading: true,
      });
      const darkIronMat = new THREE.MeshStandardMaterial({
        color: 0x3f3b37,
        roughness: 0.46,
        metalness: 0.72,
        flatShading: true,
      });
      const rustPatinaMat = new THREE.MeshStandardMaterial({
        color: 0x9a3412,
        roughness: 0.82,
        metalness: 0.22,
        flatShading: true,
      });
      const chainmailMat = new THREE.MeshStandardMaterial({
        color: 0x78716c,
        roughness: 0.48,
        metalness: 0.68,
        flatShading: true,
      });
      const leatherBeltMat = new THREE.MeshStandardMaterial({
        color: 0x5c4033,
        roughness: 0.78,
        flatShading: true,
      });
      const woodPlankMat = new THREE.MeshStandardMaterial({
        color: 0x6d4c41,
        roughness: 0.68,
        flatShading: true,
      });
      const bossSilverMat = new THREE.MeshStandardMaterial({
        color: 0xa8a29e,
        roughness: 0.34,
        metalness: 0.78,
        flatShading: true,
      });

      // Exposed Skeletal Legs & Skeletal Feet (matching reference bottom row!)
      for (const side of [-1, 1]) {
        const legGroup = new THREE.Group();
        const femur = new THREE.Mesh(
          new THREE.CylinderGeometry(0.075, 0.058, 0.54, 6),
          boneMat
        );
        femur.position.set(side * 0.23, 0.84, 0);
        const knee = new THREE.Mesh(new THREE.SphereGeometry(0.075, 6, 6), boneShadeMat);
        knee.position.set(side * 0.23, 0.56, 0.02);
        const tibia = new THREE.Mesh(
          new THREE.CylinderGeometry(0.062, 0.048, 0.52, 6),
          boneMat
        );
        tibia.position.set(side * 0.23, 0.29, 0);
        const foot = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.072, 0.32),
          boneMat
        );
        foot.position.set(side * 0.24, 0.036, 0.09);
        foot.rotation.y = side * 0.12;
        legGroup.add(femur, knee, tibia, foot);
        group.add(legGroup);
      }

      // Jagged Grey Chainmail Skirt + Brown Leather Belt with Silver Buckle
      const skirtGroup = new THREE.Group();
      const chainSkirt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.31, 0.36, 0.32, 8),
        chainmailMat
      );
      chainSkirt.scale.set(1.08, 1.0, 0.78);
      chainSkirt.position.set(0, 0.98, 0);
      skirtGroup.add(chainSkirt);

      // Jagged triangular chainmail hem points around the lower edge
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2 + 0.2;
        const hemTip = new THREE.Mesh(
          new THREE.ConeGeometry(0.11, 0.22, 4),
          chainmailMat
        );
        hemTip.rotation.x = Math.PI;
        hemTip.position.set(Math.cos(ang) * 0.32, 0.78, Math.sin(ang) * 0.24);
        skirtGroup.add(hemTip);
      }

      const leatherBelt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 0.095, 8),
        leatherBeltMat
      );
      leatherBelt.scale.set(1.08, 1.0, 0.78);
      leatherBelt.position.set(0, 1.13, 0);

      const beltBuckle = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.11, 0.05),
        bossSilverMat
      );
      beltBuckle.position.set(0, 1.13, 0.26);
      skirtGroup.add(leatherBelt, beltBuckle);

      // Exposed Lumbar Spine & Lower Ribs between the Belt and the Cuirass
      const lumbarSpine = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.068, 0.42, 6),
        boneShadeMat
      );
      lumbarSpine.position.set(0, 1.28, -0.04);
      for (let v = 0; v < 3; v++) {
        const disc = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.055, 0.14), boneMat);
        disc.position.set(0, 1.2 + v * 0.08, -0.04);
        group.add(disc);
      }

      // Weathered Rusted Iron Cuirass (Breastplate & Backplate) with Rust Patina Patches
      const cuirassGroup = new THREE.Group();
      const cuirassBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.39, 0.31, 0.64, 8),
        weatheredIronMat
      );
      cuirassBody.scale.set(1.12, 1.0, 0.76);
      cuirassBody.position.set(0, 1.68, 0);

      const chestPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.48, 0.32),
        weatheredIronMat
      );
      chestPlate.position.set(0, 1.72, 0.06);

      // Visible orange-brown rust patches on front & back of the iron cuirass
      const rustFront1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.18, 0.025),
        rustPatinaMat
      );
      rustFront1.position.set(-0.11, 1.75, 0.225);
      rustFront1.rotation.z = 0.22;

      const rustFront2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.24, 0.025),
        rustPatinaMat
      );
      rustFront2.position.set(0.12, 1.62, 0.225);
      rustFront2.rotation.z = -0.18;

      const rustBack = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.26, 0.025),
        rustPatinaMat
      );
      rustBack.position.set(0.04, 1.7, -0.225);
      rustBack.rotation.z = 0.3;

      // Asymmetric Left Shoulder Pauldron (`наплечник на плече со стороны щита`) + Right Bare Shoulder Collarbone
      const leftPauldronGroup = new THREE.Group();
      leftPauldronGroup.position.set(0.46, 1.94, 0);
      const pauldronMain = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.24, 0),
        weatheredIronMat
      );
      pauldronMain.scale.set(1.18, 0.88, 1.12);
      const pauldronLower = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.12, 0.34),
        darkIronMat
      );
      pauldronLower.position.set(0.06, -0.12, 0);
      pauldronLower.rotation.z = -0.25;
      const pauldronRust = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.14, 0.22),
        rustPatinaMat
      );
      pauldronRust.position.set(0.04, 0.08, 0.05);
      leftPauldronGroup.add(pauldronMain, pauldronLower, pauldronRust);

      const rightClavicle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.038, 0.28, 5),
        boneMat
      );
      rightClavicle.rotation.z = Math.PI / 2 + 0.15;
      rightClavicle.position.set(-0.34, 1.94, 0.04);

      cuirassGroup.add(
        cuirassBody,
        chestPlate,
        rustFront1,
        rustFront2,
        rustBack,
        leftPauldronGroup,
        rightClavicle
      );

      // Skull + Rusted Iron Barbute / Nasal Helmet (`шлем с наносником и ржавчиной`)
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 2.32, 0.02);

      const skullFace = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.26, 0.26),
        boneMat
      );
      skullFace.position.set(0, -0.04, 0.04);

      const jawBone = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.13, 0.22),
        boneShadeMat
      );
      jawBone.position.set(0, -0.18, 0.06);

      const teethLine = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.026, 0.04),
        socketDarkMat
      );
      teethLine.position.set(0, -0.14, 0.165);

      const nasalHole = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.08, 3),
        socketDarkMat
      );
      nasalHole.position.set(0, -0.06, 0.178);

      for (const side of [-1, 1]) {
        const socket = new THREE.Mesh(
          new THREE.CylinderGeometry(0.064, 0.054, 0.08, 7),
          socketDarkMat
        );
        socket.rotation.x = Math.PI / 2;
        socket.position.set(side * 0.09, 0.01, 0.165);
        headGroup.add(socket);
      }

      // Iron Barbute Dome + Cheek Guards + Central Nasal Guard Bar + Rust Patch
      const helmDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.265, 8, 7),
        weatheredIronMat
      );
      helmDome.scale.set(0.98, 1.06, 1.08);
      helmDome.position.set(0, 0.09, -0.01);

      const helmBackSkirt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.27, 0.28, 7, 1, false, Math.PI * 0.65, Math.PI * 1.7),
        weatheredIronMat
      );
      helmBackSkirt.position.set(0, -0.04, -0.02);

      const helmBrow = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.08, 0.28),
        darkIronMat
      );
      helmBrow.position.set(0, 0.09, 0.08);

      const nasalGuard = new THREE.Mesh(
        new THREE.BoxGeometry(0.052, 0.16, 0.055),
        darkIronMat
      );
      nasalGuard.position.set(0, 0.01, 0.21);

      for (const side of [-1, 1]) {
        const cheekGuard = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.24, 0.22),
          weatheredIronMat
        );
        cheekGuard.position.set(side * 0.18, -0.04, 0.05);
        headGroup.add(cheekGuard);
      }

      const helmRust = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.18, 0.22),
        rustPatinaMat
      );
      helmRust.position.set(-0.06, 0.16, 0.02);

      headGroup.add(
        skullFace,
        jawBone,
        teethLine,
        nasalHole,
        helmDome,
        helmBackSkirt,
        helmBrow,
        nasalGuard,
        helmRust
      );

      // Right Skeletal Arm + Heavy Double-Headed War Hammer (`animParts.weaponOrTail`)
      const hammerGroup = new THREE.Group();
      hammerGroup.position.set(-0.56, 1.54, 0.26);

      // Skeletal Right Arm holding the hammer shaft
      const rArmUpper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.044, 0.46, 6),
        boneMat
      );
      rArmUpper.position.set(0.14, 0.26, -0.18);
      rArmUpper.rotation.z = -0.35;
      rArmUpper.rotation.x = 0.35;
      const rArmFore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.038, 0.42, 6),
        boneMat
      );
      rArmFore.position.set(0.05, 0.06, -0.06);
      rArmFore.rotation.x = Math.PI / 2 - 0.35;
      const rBonyHand = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.11, 0.12),
        boneShadeMat
      );

      // Wooden Hammer Handle + Leather Grip Wrap + Iron Pommel + Double-Faced Bevelled Iron Head
      const hammerPivot = new THREE.Group();
      hammerPivot.rotation.x = 0.42;
      hammerPivot.rotation.z = 0.28;

      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.046, 1.55, 7),
        woodPlankMat
      );
      shaft.position.set(0, 0.32, 0);

      const leatherGrip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.058, 0.054, 0.52, 7),
        leatherBeltMat
      );
      leatherGrip.position.set(0, -0.12, 0);

      const pommel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.068, 0.062, 0.09, 7),
        darkIronMat
      );
      pommel.position.set(0, -0.45, 0);

      // Central Iron Collar + Two Flared Bevelled Striking Faces (matching reference hammer diagram!)
      const headCenter = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.34, 0.34),
        darkIronMat
      );
      headCenter.position.set(0, 0.96, 0);

      const topSpike = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.09, 0.14, 6),
        weatheredIronMat
      );
      topSpike.position.set(0, 1.17, 0);

      for (const zDir of [-1, 1]) {
        const strikingFace = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.19, 0.38, 4),
          weatheredIronMat
        );
        strikingFace.rotation.x = (zDir * Math.PI) / 2;
        strikingFace.rotation.y = Math.PI / 4;
        strikingFace.position.set(0, 0.96, zDir * 0.32);

        const faceRust = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.16, 0.04),
          rustPatinaMat
        );
        faceRust.position.set(0.05 * zDir, 0.98, zDir * 0.49);
        hammerPivot.add(strikingFace, faceRust);
      }

      hammerPivot.add(shaft, leatherGrip, pommel, headCenter, topSpike);
      hammerGroup.add(rArmUpper, rArmFore, rBonyHand, hammerPivot);
      animParts.weaponOrTail = hammerGroup;

      // Left Skeletal Arm + Round Wooden Plank Shield with Riveted Iron Rim & Central Boss (`animParts.haloOrCore`)
      const shieldGroup = new THREE.Group();
      shieldGroup.position.set(0.58, 1.44, 0.44);
      shieldGroup.rotation.y = -0.28;

      const lArmUpper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.042, 0.44, 6),
        boneMat
      );
      lArmUpper.position.set(-0.12, 0.3, -0.32);
      lArmUpper.rotation.x = 0.55;
      lArmUpper.rotation.z = 0.25;

      // Round Wooden Plank Disc
      const shieldBoard = new THREE.Mesh(
        new THREE.CylinderGeometry(0.58, 0.58, 0.08, 12),
        woodPlankMat
      );
      shieldBoard.rotation.x = Math.PI / 2;

      // Vertical Plank Seam Grooves (so vertical wooden boards are clearly readable!)
      for (const seamX of [-0.28, -0.09, 0.09, 0.28]) {
        const plankH = Math.sqrt(Math.max(0.05, 0.56 * 0.56 - seamX * seamX)) * 1.92;
        const seam = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, plankH, 0.09),
          socketDarkMat
        );
        seam.position.set(seamX, 0, 0);
        shieldGroup.add(seam);
      }

      // Thick Faceted Iron Rim + 8 Perimeter Rivets
      const shieldRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.56, 0.068, 6, 12),
        weatheredIronMat
      );
      for (let r = 0; r < 8; r++) {
        const rAng = (r / 8) * Math.PI * 2;
        const rivet = new THREE.Mesh(
          new THREE.SphereGeometry(0.026, 5, 5),
          bossSilverMat
        );
        rivet.position.set(Math.cos(rAng) * 0.55, Math.sin(rAng) * 0.55, 0.055);
        shieldGroup.add(rivet);
      }

      // Raised Central Metal Boss (`Умбон щита`)
      const shieldBoss = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.19, 0.11, 8),
        bossSilverMat
      );
      shieldBoss.rotation.x = Math.PI / 2;
      shieldBoss.position.set(0, 0, 0.065);

      const bossCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 7, 6),
        bossSilverMat
      );
      bossCap.scale.set(1, 1, 0.55);
      bossCap.position.set(0, 0, 0.11);

      shieldGroup.add(lArmUpper, shieldBoard, shieldRim, shieldBoss, bossCap);
      animParts.haloOrCore = shieldGroup;

      group.add(
        skirtGroup,
        lumbarSpine,
        cuirassGroup,
        headGroup,
        hammerGroup,
        shieldGroup
      );
    } else if (isStage5WormBossArchetype(archetype)) {
      // STAGE 5 GIANT SPLITTING WORM BOSS (`Древний Червь Катакомб`) — 3 Phases per Reference Image (`/public/assets/aistudio/image_13a5a342.png`)!
      // - Horizontal crawling/lunging S-curve posture ("Сделай червей немного более горизонтально. Они слишком высокие получились по размеру нормально но этот размер должен быть более горизонтально")
      // - Static non-spinning open maw with large, high-contrast ivory-white conical teeth & 4 outer mandibles ("у червя крутится круг во рту в всех стадиях. Сделай как на референсе чтоб было типа рта без кручений. и зубы чтоб было лучше видно")
      const isP1 = archetype === 'boss_worm_5_p1';
      const isP2 = archetype === 'boss_worm_5_p2_fire' || archetype === 'boss_worm_5_p2_melee';
      const wormScale = isP1 ? 1.62 : isP2 ? 1.14 : 0.78;

      const wormGroup = new THREE.Group();
      wormGroup.scale.setScalar(wormScale);

      const primaryHex = isP1
        ? 0x312e81
        : archetype === 'boss_worm_5_p2_fire'
        ? 0xea580c
        : archetype === 'boss_worm_5_p2_melee'
        ? 0xc2410c
        : archetype === 'boss_worm_5_p3_leech'
        ? 0xf59e0b
        : 0xfacc15;
      const ridgeHex = isP1 ? 0x64748b : isP2 ? 0x38bdf8 : 0xfef08a;
      const glowHex = isP1
        ? 0xf97316
        : archetype === 'boss_worm_5_p3_leech'
        ? 0xef4444
        : 0xfde047;

      const chitinMat = new THREE.MeshStandardMaterial({
        color: primaryHex,
        roughness: 0.35,
        metalness: 0.52,
        flatShading: true,
      });
      const bellyMat = new THREE.MeshStandardMaterial({
        color: isP1 ? 0x4c1d95 : isP2 ? 0x7c2d12 : 0xb45309,
        roughness: 0.55,
        metalness: 0.25,
        flatShading: true,
      });
      const ridgeMat = new THREE.MeshStandardMaterial({
        color: ridgeHex,
        roughness: 0.28,
        metalness: 0.68,
        flatShading: true,
      });
      const glowMat = new THREE.MeshStandardMaterial({
        color: glowHex,
        emissive: glowHex,
        emissiveIntensity: 1.9,
        roughness: 0.15,
      });
      // High-contrast bright ivory-white tooth material with subtle self-illumination so every tooth stands out clearly against the dark throat!
      const toothMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfef08a,
        emissiveIntensity: 0.32,
        roughness: 0.18,
        metalness: 0.1,
        flatShading: true,
      });
      const tuskMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        emissive: 0xfef9c3,
        emissiveIntensity: 0.15,
        roughness: 0.25,
        metalness: 0.2,
        flatShading: true,
      });
      const mawGumMat = new THREE.MeshStandardMaterial({
        color: 0x6b1126,
        roughness: 0.65,
        flatShading: true,
      });
      const mawDeepThroatMat = new THREE.MeshBasicMaterial({
        color: 0x07030a,
      });

      // Build 8 articulated segments in a low, long HORIZONTAL S-curve along the Z axis (from z = -2.45 tail to z = +1.35 head, peaking at y = 1.48 instead of towering vertically at y = 3.0+)
      const segPositions: Array<{ y: number; z: number; r: number; pitch: number }> = [
        { y: 0.32, z: -2.45, r: 0.52, pitch: 0.95 },
        { y: 0.48, z: -1.95, r: 0.65, pitch: 1.08 },
        { y: 0.72, z: -1.42, r: 0.76, pitch: 1.18 },
        { y: 0.98, z: -0.88, r: 0.85, pitch: 1.28 },
        { y: 1.24, z: -0.32, r: 0.91, pitch: 1.38 },
        { y: 1.42, z: 0.24, r: 0.95, pitch: 1.48 },
        { y: 1.46, z: 0.80, r: 0.92, pitch: 1.54 },
        { y: 1.38, z: 1.32, r: 0.88, pitch: 1.58 },
      ];

      const tailSwayGroup = new THREE.Group();
      segPositions.forEach((seg, sIdx) => {
        const targetParent = sIdx <= 2 ? tailSwayGroup : wormGroup;
        const segRing = new THREE.Mesh(
          new THREE.CylinderGeometry(seg.r * 0.94, seg.r, 0.68, 10),
          chitinMat
        );
        segRing.position.set(0, seg.y, seg.z);
        segRing.rotation.x = seg.pitch;
        targetParent.add(segRing);

        // Segmented ventral belly plate
        const bellyPlate = new THREE.Mesh(
          new THREE.BoxGeometry(seg.r * 1.18, 0.48, seg.r * 0.85),
          bellyMat
        );
        bellyPlate.position.set(0, seg.y - seg.r * 0.45, seg.z);
        bellyPlate.rotation.x = seg.pitch - Math.PI / 2;
        targetParent.add(bellyPlate);

        // Dorsal armor crest ridge
        const dorsalCrest = new THREE.Mesh(
          new THREE.ConeGeometry(0.16, 0.48, 4),
          ridgeMat
        );
        dorsalCrest.position.set(0, seg.y + seg.r * 0.88, seg.z - 0.08);
        dorsalCrest.rotation.x = -0.38;
        targetParent.add(dorsalCrest);

        // Lateral chitinous spikes + glowing magma pores along the horizontal body
        for (const side of [-1, 1]) {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.56, 5), ridgeMat);
          spike.position.set(side * (seg.r + 0.14), seg.y + 0.04, seg.z);
          spike.rotation.z = -side * 1.22;
          spike.rotation.y = -side * 0.25;
          targetParent.add(spike);

          const spot = new THREE.Mesh(new THREE.OctahedronGeometry(0.125, 0), glowMat);
          spot.position.set(side * (seg.r * 0.88), seg.y + 0.16, seg.z + 0.12);
          targetParent.add(spot);
        }
      });
      wormGroup.add(tailSwayGroup);
      // Only sway the rear tail segments slightly; NEVER rotate or spin the head or mouth!
      animParts.weaponOrTail = tailSwayGroup;

      // Sculpted Non-Rotating Head & Open Toothed Maw facing forward (+Z) matching reference image!
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.34, 1.72);

      // Outer Armored Head Carapace Hood (Upper & Lower Jaw Cowls)
      const headCarapace = new THREE.Mesh(
        new THREE.CylinderGeometry(0.84, 0.90, 0.62, 10),
        chitinMat
      );
      headCarapace.rotation.x = Math.PI / 2;
      headCarapace.position.set(0, 0.04, -0.08);
      headGroup.add(headCarapace);

      // Deep Pitch-Dark Throat Cavity so the bright ivory teeth have 100% contrast
      const mawCavity = new THREE.Mesh(
        new THREE.CylinderGeometry(0.68, 0.42, 0.56, 12),
        mawDeepThroatMat
      );
      mawCavity.rotation.x = Math.PI / 2;
      mawCavity.position.set(0, 0, -0.02);
      headGroup.add(mawCavity);

      // Thick Fleshy/Chitinous Open Mouth Gum Rim (non-spinning!)
      const mawGumRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.68, 0.14, 7, 12),
        mawGumMat
      );
      mawGumRim.position.set(0, 0, 0.20);
      headGroup.add(mawGumRim);

      // 14 Large, Sharp Ivory-White Conical Teeth arranged cleanly around the open jaw rim pointing inward & forward!
      const numTeeth = 14;
      for (let t = 0; t < numTeeth; t++) {
        const ang = (t / numTeeth) * Math.PI * 2;
        const isMajorFang = t % 2 === 0;
        const toothRadius = isMajorFang ? 0.125 : 0.098;
        const toothLen = isMajorFang ? 0.46 : 0.36;
        const tooth = new THREE.Mesh(
          new THREE.ConeGeometry(toothRadius, toothLen, 4),
          toothMat
        );
        // Orient cone tip (+Y) along +Z so `lookAt` points the sharp tip directly toward the center of the open mouth!
        tooth.geometry.rotateX(Math.PI / 2);
        const rimX = Math.cos(ang) * 0.63;
        const rimY = Math.sin(ang) * 0.63;
        tooth.position.set(rimX, rimY, 0.24);
        tooth.lookAt(rimX * 0.15, rimY * 0.15, 0.42);
        headGroup.add(tooth);
      }

      // 4 Large Curved Outer Jaw Mandibles / Tusks (`жвалы`) on the upper & lower corners of the mouth (matching Reference!)
      for (const side of [-1, 1]) {
        // Upper Lateral Mandible Tusk
        const upperMandible = new THREE.Mesh(
          new THREE.ConeGeometry(0.15, 0.72, 5),
          tuskMat
        );
        upperMandible.position.set(side * 0.78, 0.24, 0.28);
        upperMandible.rotation.z = side * 0.85;
        upperMandible.rotation.x = 0.65;

        // Lower Jaw Mandible Tusk
        const lowerMandible = new THREE.Mesh(
          new THREE.ConeGeometry(0.16, 0.78, 5),
          tuskMat
        );
        lowerMandible.position.set(side * 0.72, -0.36, 0.30);
        lowerMandible.rotation.z = side * 0.55;
        lowerMandible.rotation.x = 0.78;

        // Glowing Furious Angled Eyes above the maw
        const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.20, 0), glowMat);
        eye.scale.set(1.25, 0.75, 0.9);
        eye.position.set(side * 0.54, 0.44, 0.18);
        eye.rotation.z = -side * 0.32;

        // Sweeping Dorsal Head Horns (like Phase 1 reference)
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.92, 5), ridgeMat);
        horn.position.set(side * 0.64, 0.74, -0.05);
        horn.rotation.z = -side * 0.62;
        horn.rotation.x = -0.42;

        headGroup.add(upperMandible, lowerMandible, eye, horn);
      }

      wormGroup.add(headGroup);
      group.add(wormGroup);
    }

    // Optional floor Charge Trajectory Line for Stone Crusher (`stone_crusher`) and Stage 4 Tri-Elemental Boss (`boss_elemental_4`)
    let chargeTrajectoryLine: THREE.Mesh | undefined;
    if (archetype === 'stone_crusher' || archetype === 'boss_elemental_4') {
      const lineLen = 13.0;
      const lineGeo = new THREE.PlaneGeometry(1.35, lineLen);
      lineGeo.translate(0, lineLen / 2, 0);
      const lineMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.82,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      chargeTrajectoryLine = new THREE.Mesh(lineGeo, lineMat);
      chargeTrajectoryLine.rotation.x = Math.PI / 2;
      chargeTrajectoryLine.position.set(0, 0.08, 0);
      chargeTrajectoryLine.visible = false;
      group.add(chargeTrajectoryLine);
    }

    // Red Emergence / Jump Landing Circle (`burrowWarningRing`) on the floor for Stage 5 Worm Bosses & Mud Monsters
    let burrowWarningRing: THREE.Mesh | undefined;
    if (isStage5WormBossArchetype(archetype) || archetype === 'mud_monster') {
      const emergeRad =
        archetype === 'boss_worm_5_p1'
          ? WORM_EMERGE_RADIUS
          : archetype === 'boss_worm_5_p3_leech'
          ? WORM_LEECH_LAND_RADIUS
          : WORM_EMERGE_RADIUS * 0.82;
      const warnGroup = new THREE.Mesh(
        new THREE.RingGeometry(emergeRad * 0.18, emergeRad, 32),
        new THREE.MeshBasicMaterial({
          color: 0xef4444,
          transparent: true,
          opacity: 0.78,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      warnGroup.rotation.x = -Math.PI / 2;
      warnGroup.position.set(0, 0.09, 0);
      warnGroup.visible = false;
      this.worldContentGroup.add(warnGroup);
      burrowWarningRing = warnGroup;
    }

    // Overhead Name + Dynamic HP Bar Sprite directly on the enemy/boss in 3D space
    const hpBarCanvas = document.createElement('canvas');
    hpBarCanvas.width = 320;
    hpBarCanvas.height = 72;
    const hpBarTexture = new THREE.CanvasTexture(hpBarCanvas);
    hpBarTexture.colorSpace = THREE.SRGBColorSpace;
    this.drawEnemyHpBarCanvas(hpBarCanvas, hpBarTexture, name, 1, 1);

    const spriteMat = new THREE.SpriteMaterial({
      map: hpBarTexture,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    const isBossUnit =
      archetype === 'boss_mage_1' ||
      archetype === 'boss_mage_2' ||
      archetype === 'boss_mage_3' ||
      archetype === 'boss_elemental_4' ||
      isStage5WormBossArchetype(archetype);
    sprite.scale.set(
      isBossUnit ? 4.4 : isFlying ? 3.1 : 2.6,
      isBossUnit ? 1.05 : isFlying ? 0.76 : 0.65,
      1
    );
    sprite.position.set(
      0,
      archetype === 'boss_worm_5_p1'
        ? 4.2
        : archetype === 'boss_worm_5_p2_fire' || archetype === 'boss_worm_5_p2_melee'
        ? 3.3
        : isStage5WormBossArchetype(archetype)
        ? 2.6
        : archetype === 'boss_elemental_4'
        ? 6.6
        : archetype === 'boss_mage_3'
        ? 6.5
        : archetype === 'boss_mage_2'
        ? 5.9
        : archetype === 'boss_mage_1'
        ? 4.9
        : archetype === 'boss_totem'
        ? 4.1
        : archetype === 'stone_crusher' || archetype === 'skeleton_hammer_shield'
        ? 3.85
        : archetype === 'cave_bear'
        ? 3.5
        : archetype === 'fire_demon'
        ? 3.65
        : archetype === 'water_monster'
        ? 3.55
        : archetype === 'frost_charger'
        ? 3.6
        : isFlying
        ? 2.35
        : 2.85,
      0
    );
    group.add(sprite);

    return {
      group,
      telegraphMesh,
      chargeTrajectoryLine,
      burrowWarningRing,
      hpBarCanvas,
      hpBarTexture,
      animParts,
    };
  }

  private drawEnemyHpBarCanvas(
    canvas: HTMLCanvasElement,
    tex: THREE.CanvasTexture,
    name: string,
    hp: number,
    maxHp: number
  ) {
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(9, 8, 15, 0.88)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(4, 4, w - 8, h - 8, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${name}`, w / 2, 26);

    // HP Bar track with numeric HP right on the bar
    const barX = 18;
    const barY = 36;
    const barW = w - 36;
    const barH = 22;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, barY, barW, barH);

    const ratio = Math.max(0, Math.min(1, hp / (maxHp || 1)));
    ctx.fillStyle = ratio > 0.4 ? '#dc2626' : '#f59e0b';
    ctx.fillRect(barX, barY, Math.round(barW * ratio), barH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`♥ ${Math.max(0, Math.round(hp))} / ${maxHp}`, w / 2, barY + 16);

    tex.needsUpdate = true;
  }

  private spawnSingleEnemy(
    arch: EnemyActor['archetype'],
    pos: THREE.Vector3,
    idx: number,
    waveNum: number,
    customId?: string
  ): EnemyActor {
    const nameMap: Record<EnemyActor['archetype'], string> = {
      rat_swarmer: 'Крыса Теней',
      wild_boar: 'Дикий Кабан',
      dark_kiter: 'Темный Аколит',
      frost_charger: 'Ледяной Страж',
      sky_dive_gargoyle: 'Крылатая Горгулья (Небо)',
      storm_harpy_shooter: 'Штормовая Гарпия (Небо)',
      fire_demon: 'Огненный Демон',
      water_monster: 'Водяной Монстр',
      stone_crusher: 'Каменный Крушитель',
      mud_monster: 'Болотный Грязевик',
      cave_bear: 'Пещерный Медведь',
      skeleton_archer: 'Скелет-Лучник',
      skeleton_hammer_shield: 'Скелет-Молотобоец со Щитом',
      boss_mage_1: 'БОСС 1: Архимаг Малкор',
      boss_mage_2: 'БОСС 2: Владыка Вальтазар',
      boss_mage_3: 'БОСС 3: Повелитель Хронос',
      boss_elemental_4: 'БОСС 4: Элементаль Трёх Стихий',
      boss_worm_5_p1: 'БОСС 5: Древний Червь Катакомб (Фаза 1)',
      boss_worm_5_p2_fire: 'БОСС 5: Огненный Червь (Фаза 2)',
      boss_worm_5_p2_melee: 'БОСС 5: Подземный Червь-Таран (Фаза 2)',
      boss_worm_5_p3_fire_bomber: 'БОСС 5: Взрывной Червь Огня (Фаза 3)',
      boss_worm_5_p3_fire_pool: 'БОСС 5: Пепельный Червь Луж (Фаза 3)',
      boss_worm_5_p3_burrower: 'БОСС 5: Малый Подземный Червь (Фаза 3)',
      boss_worm_5_p3_leech: 'БОСС 5: Прыгающий Червь-Кровопийца (Фаза 3)',
      boss_totem: 'Тотем Бездны',
    };

    const lootMap: Record<EnemyActor['archetype'], ReagentId> = {
      rat_swarmer: 'rat_hair',
      wild_boar: 'boar_tusk',
      dark_kiter: 'dark_core_shard',
      frost_charger: 'ice_dragon_scale',
      sky_dive_gargoyle: 'gargoyle_heart',
      storm_harpy_shooter: 'harpy_feather',
      fire_demon: 'fire_essence',
      water_monster: 'water_essence',
      stone_crusher: 'earth_essence',
      mud_monster: 'earth_essence',
      cave_bear: 'bear_meat',
      skeleton_archer: 'dark_core_shard',
      skeleton_hammer_shield: 'earth_essence',
      boss_mage_1: 'ice_dragon_scale',
      boss_mage_2: 'ice_dragon_scale',
      boss_mage_3: 'ice_dragon_scale',
      boss_elemental_4: 'fire_essence',
      boss_worm_5_p1: 'earth_essence',
      boss_worm_5_p2_fire: 'fire_essence',
      boss_worm_5_p2_melee: 'earth_essence',
      boss_worm_5_p3_fire_bomber: 'fire_essence',
      boss_worm_5_p3_fire_pool: 'fire_essence',
      boss_worm_5_p3_burrower: 'earth_essence',
      boss_worm_5_p3_leech: 'dark_core_shard',
      boss_totem: 'dark_core_shard',
    };

    const isFlying =
      arch === 'sky_dive_gargoyle' || arch === 'storm_harpy_shooter';
    const flyHeight =
      arch === 'storm_harpy_shooter'
        ? 4.2
        : arch === 'sky_dive_gargoyle'
        ? 3.35
        : 0;

    // Diablo-style Difficulty scaling:
    // On Difficulty 2 (Nightmare), even Stage 1 mobs have strictly more HP than Stage 5 Normal mobs,
    // and scale progressively across Stages 2..5!
    const baseMaxHp = evaluateEnemyBaseMaxHp(
      arch,
      waveNum,
      this.labyrinthStage,
      this.difficultyTier,
      this.mapMode === 'labyrinth'
    );

    // In 'shared' Co-op Labyrinth mode, enemies have +30% more HP and deal +20% more damage!
    const scaledStats = getScaledEnemyStatsForMode(
      baseMaxHp,
      10,
      this.labyrinthMultiplayerMode,
      this.mapMode === 'labyrinth'
    );
    const maxHp = scaledStats.maxHp;

    const {
      group,
      telegraphMesh,
      chargeTrajectoryLine,
      burrowWarningRing,
      hpBarCanvas,
      hpBarTexture,
      animParts,
    } = this.createEnemyMesh(arch, nameMap[arch]);
    const spawnPos = pos.clone();
    if (this.mapMode === 'labyrinth') {
      this.resolveLabyrinthCollisions(spawnPos, 0.85);
    }
    spawnPos.y = flyHeight;
    group.position.copy(spawnPos);
    this.drawEnemyHpBarCanvas(hpBarCanvas, hpBarTexture, nameMap[arch], maxHp, maxHp);
    this.worldContentGroup.add(group);

    const speedScale = this.mapMode === 'labyrinth' ? 0.68 : 1.0;
    const baseSpeed =
      arch === 'boss_totem'
        ? 0
        : arch === 'wild_boar' ||
          arch === 'boss_worm_5_p2_melee' ||
          arch === 'boss_worm_5_p3_burrower'
        ? 4.95 // Fast boar-like rusher (`быстро набегает как кабаны`)!
        : arch === 'boss_worm_5_p3_leech' || arch === 'boss_worm_5_p3_fire_bomber'
        ? 4.45
        : arch === 'cave_bear'
        ? 4.35
        : arch === 'boss_worm_5_p1' || arch === 'boss_worm_5_p2_fire' || arch === 'boss_worm_5_p3_fire_pool'
        ? 3.45
        : arch === 'skeleton_archer'
        ? 3.2
        : arch === 'mud_monster'
        ? 2.75
        : arch === 'skeleton_hammer_shield'
        ? 2.55
        : arch === 'boss_elemental_4'
        ? 3.0
        : arch === 'boss_mage_3'
        ? 2.8
        : arch === 'boss_mage_2'
        ? 2.5
        : arch === 'boss_mage_1'
        ? 2.2
        : arch === 'fire_demon'
        ? 3.1
        : arch === 'water_monster'
        ? 2.85
        : arch === 'stone_crusher'
        ? 2.55
        : arch === 'rat_swarmer'
        ? 4.1
        : arch === 'sky_dive_gargoyle'
        ? 3.8
        : arch === 'storm_harpy_shooter'
        ? 3.1
        : arch === 'dark_kiter'
        ? 2.9
        : 2.4;

    const actor: EnemyActor = {
      id:
        customId ||
        getDeterministicEnemyId(
          this.mapMode === 'arena' ? waveNum : this.labyrinthStage,
          idx,
          this.mapMode === 'arena'
        ),
      name: nameMap[arch],
      archetype: arch,
      isFlying,
      flyHeight,
      animPhase: idx * 1.3,
      animParts,
      lootId: lootMap[arch],
      mesh: group,
      telegraphMesh,
      chargeTrajectoryLine,
      hpBarCanvas,
      hpBarTexture,
      baseMaxHp,
      hp: maxHp,
      maxHp,
      speed:
        baseSpeed *
        speedScale *
        getDiabloDifficultyMultipliers(this.difficultyTier, this.labyrinthStage)
          .moveSpeedMultiplier,
      homePosition: spawnPos.clone(),
      position: spawnPos.clone(),
      velocity: new THREE.Vector3(),
      state: this.mapMode === 'labyrinth' && !customId ? 'idle' : 'seek',
      stateTimer: 1.5 + (idx % 4) * 0.35,
      stunTimer: 0,
      freezeTimer: 0,
      burnTimer: 0,
      burnTickAccum: 0,
      chargeCooldown: 7.0,
      chargeWindupTimer: 0,
      chargeActiveTimer: 0,
      chargeDir: new THREE.Vector3(0, 0, 1),
      chargeHitPlayer: false,
      enragedPhase2: false,
      attackCycle: idx % 3,
      hitFlashTimer: 0,
      koTimer: 0,
      strafeDir: idx % 2 === 0 ? 1 : -1,
      teleportTimer: 7.0,
      burrowTimer: 0,
      surfaceFightTimer:
        arch === 'boss_worm_5_p2_melee' || arch === 'boss_worm_5_p3_burrower'
          ? WORM_MELEE_FIGHT_DURATION_SEC
          : 5.5,
      emergeTargetPos: spawnPos.clone(),
      burrowWarningRing,
      leechGlowTimer: 0,
      leechJumpCooldown: 1.5,
      leechJumpStartPos: spawnPos.clone(),
      leechJumpTargetPos: spawnPos.clone(),
      leechLatchTimer: 0,
      leechTickAccum: 0,
      frostWindCooldown: 3.0 + (idx % 3) * 1.2,
      shieldGuardTimer: 4.0,
      shieldGuardActive: false,
      hasSplitWorm: false,
    };
    this.enemies.push(actor);
    return actor;
  }

  public spawnEnemyWave(waveNum: number) {
    this.wave = waveNum;
    // Include common flying melee Gargoyle and rarer flying ranged Harpy Shooter in Arena waves!
    const archetypes: EnemyActor['archetype'][] = [
      'rat_swarmer',
      'sky_dive_gargoyle',
      'dark_kiter',
      'frost_charger',
      'storm_harpy_shooter',
    ];
    const count = Math.min(6, 3 + Math.floor((waveNum - 1) * 0.8));

    for (let i = 0; i < count; i++) {
      const arch = archetypes[i % archetypes.length];
      const angle = (i / count) * Math.PI * 1.4 - Math.PI * 0.7;
      const radius = 14 + (i % 2) * 4;
      const pos = new THREE.Vector3(Math.sin(angle) * radius, 0, -Math.cos(angle) * radius - 4);
      this.spawnSingleEnemy(arch, pos, i, waveNum);
    }
  }

  public setMode(newMode: 'title' | 'playing' | 'paused' | 'gameover') {
    this.mode = newMode;
    this.keysHeld.clear();
    this.keysJustPressed.clear();
    if (newMode === 'playing') {
      this.camera.rotation.set(0, 0, 0, 'YXZ');
    }
  }

  public resetRun(targetMapMode?: GameMapMode, initialStage: 1 | 2 | 3 | 4 | 5 = 1) {
    this.score = 0;
    this.wave = 1;
    this.enemiesDefeated = 0;
    this.loadMapMode(targetMapMode ?? this.mapMode, initialStage, false);
    this.setMode('playing');
    if (
      (targetMapMode ?? this.mapMode) === 'labyrinth' &&
      this.labyrinthMultiplayerMode === 'shared'
    ) {
      this.callbacks.onMultiplayerStageAdvance?.({
        stage: initialStage,
        victory: false,
        reset: true,
      });
    }
  }

  public setLabyrinthMultiplayerMode(mode: LabyrinthMultiplayerMode) {
    const prevMode = this.labyrinthMultiplayerMode;
    this.labyrinthMultiplayerMode = mode;
    if (prevMode !== mode && this.mapMode === 'labyrinth') {
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;
        const nextMaxHp = getScaledEnemyStatsForMode(
          enemy.baseMaxHp,
          10,
          mode,
          true
        ).maxHp;
        enemy.maxHp = nextMaxHp;
        enemy.hp = Math.max(1, Math.round(nextMaxHp * hpRatio));
        this.drawEnemyHpBarCanvas(
          enemy.hpBarCanvas,
          enemy.hpBarTexture,
          enemy.name,
          enemy.hp,
          enemy.maxHp
        );
      }
    }
    this.pushHudSnapshot();
  }

  private getScaledEnemyDamage(baseDamage: number): number {
    const stageDmgMult =
      this.mapMode === 'labyrinth' && (this.labyrinthStage >= 4 || this.difficultyTier >= 2)
        ? 1.35
        : 1.0;
    const diffDmgMult = getDiabloDifficultyMultipliers(
      this.difficultyTier,
      this.labyrinthStage
    ).damageMultiplier;
    return getScaledEnemyStatsForMode(
      100,
      Math.round(baseDamage * stageDmgMult * diffDmgMult),
      this.labyrinthMultiplayerMode,
      this.mapMode === 'labyrinth'
    ).damage;
  }

  private getActiveLabyrinthWalls(): WallBox[] {
    const extraBoxes: WallBox[] = [];
    for (const gate of this.runeGates) {
      if (!gate.isOpen) {
        extraBoxes.push(gate.wallBox);
      }
    }
    for (const wall of this.builtWalls) {
      extraBoxes.push(wall.wallBox);
    }
    return extraBoxes.length > 0
      ? [...this.labyrinthWalls, ...extraBoxes]
      : this.labyrinthWalls;
  }

  public rotateCamera(deltaYaw: number, deltaPitch: number) {
    if (this.mode !== 'playing') return;
    this.yaw -= deltaYaw;
    this.pitch = THREE.MathUtils.clamp(this.pitch - deltaPitch, -Math.PI / 2.6, Math.PI / 2.6);
  }

  public setWandGestureTraceOffset(normX: number, normY: number) {
    this.gestureAimOffset.set(normX - 0.5, normY - 0.5);
  }

  /**
   * Tames a specific animal species (only ONE animal can be tamed at a time; selecting a new one releases the previous one).
   */
  public selectAndTamePet(species: TameableSpeciesId): boolean {
    let target = this.animals.find((a) => a.species === species);
    if (!target) {
      // If on Stage 2 or if not yet spawned nearby, spawn it right in front of the player
      _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
      const pos = _v1.copy(this.playerPos).addScaledVector(_forward, 3.4);
      pos.y = 0;
      this.spawnTameableAnimal(species, pos, this.animals.length);
      target = this.animals[this.animals.length - 1];
    }
    if (!target) return false;

    for (const a of this.animals) {
      if (a === target) {
        a.isTamed = true;
        this.activeTamedPet = a;
        this.updatePetBadge(a);
      } else if (a.isTamed) {
        a.isTamed = false;
        a.position.copy(a.homePosition);
        a.mesh.position.copy(a.homePosition);
        this.updatePetBadge(a);
      }
    }

    if (species === 'cat') {
      audioEngine.playCatPurrMeow();
    } else {
      audioEngine.playPickupChime();
    }
    this.spawnParticles(target.position, PET_CATALOG[species].primaryColor, 22, 5);
    this.callbacks.onPetTamedOrUpgraded(target.species, target.level);
    this.callbacks.onQuestEvent('tame_pet', 1);
    this.pushHudSnapshot();
    return true;
  }

  /**
   * Slow, gradual pet training inside the Settings (Grimoire) menu:
   * Requires 3 training steps per level (0 -> 1 -> 2 -> Level Up!), so the player cannot max out the pet with one click.
   */
  public upgradeActiveTamedPet(): {
    success: boolean;
    newLevel: number;
    trainingStep: number;
    petName: string;
  } {
    const pet = this.activeTamedPet;
    if (!pet) {
      return { success: false, newLevel: 1, trainingStep: 0, petName: '' };
    }

    if (pet.level >= 5) {
      return { success: false, newLevel: pet.level, trainingStep: 0, petName: pet.name };
    }

    pet.trainingStep += 1;
    const def = PET_CATALOG[pet.species];

    if (pet.trainingStep >= 3) {
      pet.trainingStep = 0;
      pet.level += 1;
      pet.baseScale = Number((1.0 + (pet.level - 1) * 0.14).toFixed(2));
    }

    pet.baseAttack = def.baseAttack + (pet.level - 1) * 2 + pet.trainingStep;
    if (pet.engorgioTimer <= 0) {
      pet.targetScale = pet.baseScale;
      pet.attackPower = pet.baseAttack;
    }
    this.updatePetBadge(pet);

    if (pet.species === 'cat') {
      audioEngine.playCatPurrMeow();
    } else {
      audioEngine.playPickupChime();
    }
    this.spawnParticles(pet.position, def.primaryColor, 20, 5);
    this.callbacks.onPetTamedOrUpgraded(pet.species, pet.level);
    this.pushHudSnapshot();
    return {
      success: true,
      newLevel: pet.level,
      trainingStep: pet.trainingStep,
      petName: pet.name,
    };
  }

  private updatePetBadge(pet: TameableAnimalActor) {
    // Do NOT show any floating text above the pet once it is tamed so combat view is completely clean!
    if (pet.isTamed) {
      pet.badgeSprite.visible = false;
      return;
    }
    const def = PET_CATALOG[pet.species];
    pet.mesh.remove(pet.badgeSprite);
    const nextSprite = this.createBillboardBadge(pet.name, def.primaryColor, '[E] Приручить питомца');
    nextSprite.position.set(0, 1.85, 0);
    nextSprite.visible = true;
    pet.badgeSprite = nextSprite;
    pet.mesh.add(nextSprite);
  }

  /**
   * Validates whether the player's crosshair is aimed at a visible, reachable floor point (`y = 0`)
   * within `maxRange` meters, inside map boundaries, not inside any wall/stele, and with unobstructed line of sight.
   */
  public getAimedTeleportFloorPoint(maxRange = 16): {
    valid: boolean;
    point: THREE.Vector3 | null;
    reason?: string;
  } {
    if (!this.camera) {
      return { valid: false, point: null, reason: 'Камера не готова' };
    }
    const camPos = this.camera.position;
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    dir.normalize();

    // Must aim downward onto the floor (not into the sky, horizon, or upper wall steles!)
    if (dir.y >= -0.045) {
      return {
        valid: false,
        point: null,
        reason: '⚡ Телепорт работает только при наведении на видимый пол!',
      };
    }

    const t = (0 - camPos.y) / dir.y;
    if (t < 0.8) {
      return {
        valid: false,
        point: null,
        reason: '⚡ Слишком близко под ногами!',
      };
    }
    if (t > maxRange) {
      return {
        valid: false,
        point: null,
        reason: `⚡ Слишком далеко (макс. дальность ${maxRange}м)! Наведите ниже на пол.`,
      };
    }

    const targetX = camPos.x + dir.x * t;
    const targetZ = camPos.z + dir.z * t;

    // Cannot teleport outside map boundaries (off textures)
    if (this.mapMode === 'arena') {
      if (Math.hypot(targetX, targetZ) > 35.5) {
        return {
          valid: false,
          point: null,
          reason: '⚡ Нельзя телепортироваться за пределы арены!',
        };
      }
    } else {
      if (
        Math.abs(targetX) > this.labyrinthHalfWidth - 2.2 ||
        Math.abs(targetZ) > this.labyrinthHalfLength - 2.2
      ) {
        return {
          valid: false,
          point: null,
          reason: '⚡ Нельзя телепортироваться за текстуры лабиринта!',
        };
      }
      // Check closed Solid Rune Gates first so players cannot teleport through or into closed gates!
      for (const gate of this.runeGates) {
        if (gate.isOpen) continue;
        const gBox = gate.wallBox;
        if (
          (targetX > gBox.minX - 0.5 &&
            targetX < gBox.maxX + 0.5 &&
            targetZ > gBox.minZ - 0.5 &&
            targetZ < gBox.maxZ + 0.5) ||
          segmentHitsWall(
            this.playerPos.x,
            this.playerPos.z,
            targetX,
            targetZ,
            [gBox],
            0.45
          )
        ) {
          return {
            valid: false,
            point: null,
            reason: `🔒 Сплошные ворота закрыты (${gate.buttonsActivated}/${gate.totalButtons} кнопок)! Нельзя телепортироваться через них.`,
          };
        }
      }

      // Cannot teleport inside a wall or through a wall/stele
      for (const box of this.labyrinthWalls) {
        if (
          targetX > box.minX - 0.45 &&
          targetX < box.maxX + 0.45 &&
          targetZ > box.minZ - 0.45 &&
          targetZ < box.maxZ + 0.45
        ) {
          return {
            valid: false,
            point: null,
            reason: '⚡ Нельзя телепортироваться внутрь стены или стелы!',
          };
        }
      }
      if (
        segmentHitsWall(
          this.playerPos.x,
          this.playerPos.z,
          targetX,
          targetZ,
          this.labyrinthWalls,
          0.35
        )
      ) {
        return {
          valid: false,
          point: null,
          reason: '⚡ Нельзя телепортироваться сквозь стены — нужен видимый пол!',
        };
      }
    }

    return {
      valid: true,
      point: new THREE.Vector3(targetX, 0, targetZ),
    };
  }

  /**
   * Executes a spell cast in the 3D world with minimal, non-intrusive feedback banner.
   * When projectileCount === 2 (combat spells upgraded to Level 4 or 5), fires 2 projectiles:
   * - Projectile 1 flies along the crosshair aim vector (_forward).
   * - Projectile 2 spawns slightly lower and flies slightly below the crosshair so both can hit or at least 1 connects!
   */
  public castSpellInWorld(params: {
    spellId: SpellId;
    spellLevel?: number;
    finalDamage: number;
    healAmount?: number;
    manaCost: number;
    cooldownSec?: number;
    projectileCount?: number;
    castQualityPercent: number;
    animalScaleMultiplier: number;
    petDamageMultiplier?: number;
    petDurationSec: number;
    teleportRange?: number;
    castDurationSec?: number;
    swordDurationSec?: number;
    cooldownReductionPercent?: number;
    spellLevels?: Record<SpellId, number>;
    detailText: string;
  }): {
    origin: { x: number; y: number; z: number };
    direction: { x: number; y: number; z: number };
  } | null {
    if (this.mode !== 'playing') return null;

    if (this.playerStunTimer > 0) {
      this.lastCastBanner = {
        spellName: `💫 Оглушение (${this.playerStunTimer.toFixed(1)}с)!`,
        qualityPercent: params.castQualityPercent,
        damage: 0,
        detail: '',
        color: '#f59e0b',
        timestamp: performance.now(),
      };
      return null;
    }

    const spell = SPELLS[params.spellId];
    const spellLevel = params.spellLevel ?? 1;

    // Check per-spell cooldown (4s->3s standard, 10s->faster for Teleport, 30s for Heal & Growth, 120s for Campfire Teleport)
    const cdRemaining = this.spellCooldowns[params.spellId] || 0;
    if (cdRemaining > 0.05) {
      this.lastCastBanner = {
        spellName: `Перезарядка: ${cdRemaining.toFixed(1)}с`,
        qualityPercent: params.castQualityPercent,
        damage: 0,
        detail: '',
        color: '#94a3b8',
        timestamp: performance.now(),
      };
      return null;
    }

    if (this.mp < params.manaCost) {
      this.lastCastBanner = {
        spellName: `Недостаточно маны (${params.manaCost} МП)`,
        qualityPercent: params.castQualityPercent,
        damage: 0,
        detail: '',
        color: '#94a3b8',
        timestamp: performance.now(),
      };
      return null;
    }

    // Validate CAMPFIRE TELEPORT ('campfire_teleport' [F]) BEFORE spending mana or starting channel!
    if (params.spellId === 'campfire_teleport') {
      if (this.campfires.length === 0) {
        this.lastCastBanner = {
          spellName: '🔥 Сначала постройте Костёр [C], чтобы переместиться к нему!',
          qualityPercent: params.castQualityPercent,
          damage: 0,
          detail: '',
          color: '#f87171',
          timestamp: performance.now(),
        };
        this.pushHudSnapshot();
        return null;
      }
      if (this.campfireTeleportChannel) {
        return null;
      }
      this.mp = Math.max(0, this.mp - params.manaCost);
      const castDur = params.castDurationSec ?? 3.0;
      const cdToApply = params.cooldownSec ?? CAMPFIRE_TELEPORT_COOLDOWN_SEC;
      this.campfireTeleportChannel = {
        remainingSec: castDur,
        totalSec: castDur,
        qualityPercent: params.castQualityPercent,
        cdToApply,
      };
      this.castRecoil = 1.0;
      audioEngine.playSpellCast('campfire_teleport', params.castQualityPercent);
      this.camera.getWorldDirection(_forward);
      _forward.normalize();
      this.spawnParticles(_v1.copy(this.playerPos).setY(1.0), 0xf97316, 22, 5.5);
      this.lastCastBanner = {
        spellName: `🏠 Домой (к костру): подготовка ${castDur.toFixed(1)}с...`,
        qualityPercent: params.castQualityPercent,
        damage: 0,
        detail: '',
        color: '#f97316',
        timestamp: performance.now(),
      };
      this.pushHudSnapshot();
      return {
        origin: { x: this.playerPos.x, y: 1.0, z: this.playerPos.z },
        direction: { x: _forward.x, y: _forward.y, z: _forward.z },
      };
    }

    // Validate TELEPORT ('teleport' [Ё]) BEFORE spending mana or triggering cooldown!
    let validatedTeleportPoint: THREE.Vector3 | null = null;
    if (params.spellId === 'teleport') {
      const tpCheck = this.getAimedTeleportFloorPoint(params.teleportRange ?? 16);
      if (!tpCheck.valid || !tpCheck.point) {
        this.lastCastBanner = {
          spellName: tpCheck.reason || '⚡ Телепорт только на видимый пол!',
          qualityPercent: params.castQualityPercent,
          damage: 0,
          detail: '',
          color: '#f87171',
          timestamp: performance.now(),
        };
        this.pushHudSnapshot();
        return null;
      }
      validatedTeleportPoint = tpCheck.point;
    }

    this.mp = Math.max(0, this.mp - params.manaCost);
    const cdToApply =
      params.cooldownSec ??
      (params.spellId === 'cooldown_reset'
        ? COOLDOWN_RESET_BASE_COOLDOWN_SEC
        : params.spellId === 'arcane_sword'
        ? ARCANE_SWORD_COOLDOWN_SEC
        : params.spellId === 'vera_verto' || params.spellId === 'engorgio'
        ? SPECIAL_COOLDOWN_SEC
        : params.spellId === 'teleport'
        ? TELEPORT_BASE_COOLDOWN_SEC
        : SPELL_COOLDOWN_SEC);
    this.spellCooldowns[params.spellId] = cdToApply;
    this.castRecoil = 1.0;
    audioEngine.playSpellCast(params.spellId, params.castQualityPercent);

    this.camera.getWorldDirection(_forward);
    _forward.normalize();

    const spawnPos = _v1.copy(this.camera.position).addScaledVector(_forward, 1.1);
    spawnPos.y -= 0.15;

    this.spawnParticles(spawnPos, spell.color, 16, 6);

    // Special Handling -2: COOLDOWN RESET ('cooldown_reset' -> Перезарядка способностей [G] / Песочные часы ⏳)
    if (params.spellId === 'cooldown_reset') {
      const pct = Math.max(0, Math.min(100, Math.round(params.cooldownReductionPercent ?? 30)));
      this.spellCooldowns = applyCooldownResetToSpellCooldowns(
        this.spellCooldowns,
        params.spellLevels || {},
        pct
      );
      this.spawnParticles(_v2.copy(this.playerPos).setY(1.0), 0x2dd4bf, 32, 7.5);
      this.spawnParticles(_v2.copy(this.playerPos).setY(1.2), 0xfde047, 20, 6.0);
      this.lastCastBanner = {
        spellName:
          pct >= 100
            ? '⏳ Перезарядка способностей: 100% — все заклинания готовы!'
            : `⏳ Перезарядка способностей: -${pct}% ко всем откатам!`,
        qualityPercent: params.castQualityPercent,
        damage: 0,
        detail: '',
        color: '#2dd4bf',
        timestamp: performance.now(),
      };
      this.pushHudSnapshot();
      return {
        origin: { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
        direction: { x: _forward.x, y: _forward.y, z: _forward.z },
      };
    }

    // Special Handling -1: ARCANE SWORD ('arcane_sword' -> Меч [8] / Силуэт меча 🗡️)
    if (params.spellId === 'arcane_sword') {
      const swordDur = params.castDurationSec ?? 10.0;
      this.summonArcaneSword({
        durationSec: swordDur,
        slashDamage: params.finalDamage,
        level: spellLevel,
        ignitesOnHit: spellLevel >= 4,
        stunsOnHit: false,
        qualityPercent: params.castQualityPercent,
      });
      return {
        origin: { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
        direction: { x: _forward.x, y: _forward.y, z: _forward.z },
      };
    }

    // Special Handling 0: TELEPORT ('teleport' -> Прыжок [Ё] / Круг ◯)
    if (params.spellId === 'teleport' && validatedTeleportPoint) {
      // Detach any latched Phase 3 Leech Worm immediately at the departure point ("если делаешь телепорт то он сразу спадает")!
      const detachedLeech = this.detachLatchedLeechWormsOnTeleport();

      // Departure particles
      this.spawnParticles(_v2.copy(this.playerPos).setY(1.0), 0xa855f7, 26, 7.0);
      this.playerPos.copy(validatedTeleportPoint);
      if (this.mapMode === 'labyrinth') {
        this.resolveLabyrinthCollisions(this.playerPos);
      }
      this.camera.position.set(this.playerPos.x, 1.72, this.playerPos.z);
      if (detachedLeech) {
        this.lastCastBanner = {
          spellName: '🌀 Телепорт сбросил вцепившегося Червя-Кровопийцу!',
          qualityPercent: params.castQualityPercent,
          damage: params.finalDamage,
          detail: '',
          color: '#a855f7',
          timestamp: performance.now(),
        };
      }

      // Arrival arcane blast particles & AoE damage in TELEPORT_BLAST_RADIUS (6.0m, like red barrel!)
      const blastOrigin = _v2.copy(this.playerPos).setY(0.75);
      this.spawnParticles(blastOrigin, 0xa855f7, 38, 9.5);
      this.spawnParticles(blastOrigin, 0x38bdf8, 24, 7.0);
      audioEngine.playHeavyImpact(true);
      this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.35);
      this.playerCombatEngageTimer = 10.0;

      if (spellLevel >= 6) {
        this.playerSpeedBuffTimer = 3.0;
      }

      let enemiesHit = 0;
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const d = Math.hypot(
          enemy.position.x - this.playerPos.x,
          enemy.position.z - this.playerPos.z
        );
        if (d <= TELEPORT_BLAST_RADIUS) {
          const knockDir = new THREE.Vector3(
            enemy.position.x - this.playerPos.x,
            0,
            enemy.position.z - this.playerPos.z
          );
          if (knockDir.lengthSq() < 0.01) knockDir.set(0, 0, -1);
          knockDir.normalize().multiplyScalar(12);
          if (spellLevel >= 6) {
            enemy.stunTimer = Math.max(enemy.stunTimer, 1.0);
            enemy.state = 'seek';
          }
          this.damageEnemy(enemy, params.finalDamage, knockDir, 0xa855f7, false, 'teleport');
          enemiesHit++;
        }
      }

      // Friendly fire / PvP on remote wizards caught in the Teleport arrival blast!
      if (this.callbacks.onMultiplayerHit) {
        for (const [remoteId, entry] of this.remoteMeshes.entries()) {
          const dRemote = Math.hypot(
            entry.data.x - this.playerPos.x,
            entry.data.z - this.playerPos.z
          );
          if (dRemote <= TELEPORT_BLAST_RADIUS) {
            this.callbacks.onMultiplayerHit(remoteId, params.finalDamage);
          }
        }
      }

      this.callbacks.onQuestEvent('cast_teleport', 1);
      this.lastCastBanner = {
        spellName: `⚡ Телепорт! Взрыв: ${params.finalDamage} ур.${
          enemiesHit > 0 ? ` (${enemiesHit} враг.)` : ''
        }${spellLevel >= 6 ? ' · Оглушение 1с + Рывок' : ''} · КД ${cdToApply.toFixed(1)}с`,
        qualityPercent: params.castQualityPercent,
        damage: params.finalDamage,
        detail: '',
        color: '#a855f7',
        timestamp: performance.now(),
      };
      this.pushHudSnapshot();

      return {
        origin: { x: this.playerPos.x, y: 1.0, z: this.playerPos.z },
        direction: { x: _forward.x, y: _forward.y, z: _forward.z },
      };
    }

    // Special Handling 1: HEAL ('vera_verto' -> Хил / Сердце ♥)
    if (params.spellId === 'vera_verto') {
      const healVal = params.healAmount ?? 20;
      this.hp = Math.min(this.maxHp, this.hp + healVal);
      if (spellLevel >= 6) {
        this.playerBurnTimer = 0;
        this.playerStunTimer = 0;
        this.playerRegenTimer = 4.0;
      }
      this.spawnParticles(_v2.copy(this.playerPos).setY(1.2), 0x22c55e, 28, 5.5);
      audioEngine.playPickupChime();
      this.callbacks.onQuestEvent('transfigure', 1);

      this.lastCastBanner = {
        spellName:
          spellLevel >= 6
            ? `+${healVal} ОЗ · Очищение + Регенерация 4с`
            : `+${healVal} здоровья`,
        qualityPercent: params.castQualityPercent,
        damage: healVal,
        detail: '',
        color: '#22c55e',
        timestamp: performance.now(),
      };

      return {
        origin: { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
        direction: { x: _forward.x, y: _forward.y, z: _forward.z },
      };
    }

    // Special Handling 2: ENGORGIO ('engorgio' -> Рост):
    // - Aiming at Water ('water') -> Summons Water Helper (`Водяной Помощник`, 2 spheres, lasts 1–3 min, shoots water balls)
    // - Aiming at Snow ('snow') -> Summons Snowman (`Боевой Снеговик`, 3 spheres, lasts 1–3 min, shoots snowballs)
    // - Aiming at neither ('none') -> Automatically grows/buffs the Cat / Tamed Pet for 10s (16s at Lv6)!
    if (params.spellId === 'engorgio') {
      if (spellLevel >= 6) {
        this.hp = Math.min(this.maxHp, this.hp + 15);
        this.mp = Math.min(this.maxMp, this.mp + 15);
      }
      const aimInfo = this.getAimedSurfaceInfo();
      if (aimInfo.target === 'water') {
        const ally = this.summonElementalAlly(
          'water_spirit',
          params.castQualityPercent,
          spellLevel,
          aimInfo.point ?? undefined
        );
        this.callbacks.onQuestEvent('transfigure', 1);
        this.lastCastBanner = {
          spellName: `💧 ${ally.name} призван (${Math.round(ally.remainingSec)}с · урон ${ally.attackDamage})`,
          qualityPercent: params.castQualityPercent,
          damage: ally.attackDamage,
          detail: '',
          color: '#0ea5e9',
          timestamp: performance.now(),
        };
        return {
          origin: { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
          direction: { x: _forward.x, y: _forward.y, z: _forward.z },
        };
      }

      if (aimInfo.target === 'snow') {
        const ally = this.summonElementalAlly(
          'snowman',
          params.castQualityPercent,
          spellLevel,
          aimInfo.point ?? undefined
        );
        this.callbacks.onQuestEvent('transfigure', 1);
        this.lastCastBanner = {
          spellName: `⛄ ${ally.name} призван (${Math.round(ally.remainingSec)}с · урон ${ally.attackDamage})`,
          qualityPercent: params.castQualityPercent,
          damage: ally.attackDamage,
          detail: '',
          color: '#38bdf8',
          timestamp: performance.now(),
        };
        return {
          origin: { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
          direction: { x: _forward.x, y: _forward.y, z: _forward.z },
        };
      }

      // Not aiming at water or snow -> Automatically grow/buff the Cat / Tamed Pet!
      if (!this.activeTamedPet) {
        this.selectAndTamePet('cat');
      }
      if (this.activeTamedPet) {
        const pet = this.activeTamedPet;
        const buffDur = params.petDurationSec || (spellLevel >= 6 ? 16 : ENGORGIO_BUFF_DURATION_SEC);
        pet.engorgioTimer = buffDur;
        pet.engorgioScaleMult = params.animalScaleMultiplier;
        pet.engorgioDamageMult = params.petDamageMultiplier ?? 1.8;
        pet.targetScale = Number((pet.baseScale * pet.engorgioScaleMult).toFixed(2));
        pet.attackPower = Math.round(pet.baseAttack * pet.engorgioDamageMult);
        this.updatePetBadge(pet);
        this.spawnParticles(pet.position, 0x10b981, 28, 6.5);
        this.callbacks.onQuestEvent('transfigure', 1);

        this.lastCastBanner = {
          spellName: `Рост: ${pet.name} (${buffDur}с · урон ${pet.attackPower})`,
          qualityPercent: params.castQualityPercent,
          damage: pet.attackPower,
          detail: '',
          color: '#10b981',
          timestamp: performance.now(),
        };
      }

      this.spawnSpellProjectile({
        spellId: 'engorgio',
        spellLevel,
        casterId: 'local',
        origin: spawnPos.clone(),
        direction: _forward.clone(),
        damage: params.finalDamage,
        qualityPercent: params.castQualityPercent,
        colorHex: '#4ade80',
      });

      return {
        origin: { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
        direction: { x: _forward.x, y: _forward.y, z: _forward.z },
      };
    }

    // Mark player as actively engaging in combat so the Elemental Ally joins the battle!
    this.playerCombatEngageTimer = 10.0;

    // If casting Ice (`glacius` [2]) while aiming at Water, freeze part of the water into a Snow patch (`Снег`)!
    if (params.spellId === 'glacius') {
      const aimInfo = this.getAimedSurfaceInfo();
      if (aimInfo.target === 'water' && aimInfo.point) {
        this.freezeWaterIntoSnowPatch(aimInfo.point);
        this.callbacks.onQuestEvent('transfigure', 1);
        this.lastCastBanner = {
          spellName: `❄️ Вода заморожена в Снег! Наведите [6] Рост (3 кружка) для Снеговика`,
          qualityPercent: params.castQualityPercent,
          damage: params.finalDamage,
          detail: '',
          color: '#38bdf8',
          timestamp: performance.now(),
        };
      }
    }

    const count = params.projectileCount ?? 1;
    this.lastCastBanner = {
      spellName:
        params.spellId === 'wingardium'
          ? 'Телекинез'
          : count >= 2
          ? `Урон: ${params.finalDamage} x2`
          : `Урон: ${params.finalDamage}`,
      qualityPercent: params.castQualityPercent,
      damage: params.finalDamage,
      detail: '',
      color: spell.color,
      timestamp: performance.now(),
    };

    // Special Handling 3: Wingardium Leviosa (Telekinesis Grab / Shield / Throw)
    if (params.spellId === 'wingardium') {
      this.activeWingardiumLevel = spellLevel;
      const lv6Mult = spellLevel >= 6 ? 1.5 : 1.0;
      if (this.heldProp) {
        const thrown = this.heldProp;
        this.heldProp = null;
        thrown.isHeld = false;
        thrown.isThrown = true;
        // Red explosive barrels deal higher AoE damage scaled by Wingardium power (+50% at Lv6)!
        thrown.throwDamage = Math.round(
          (thrown.kind === 'barrel'
            ? calculateExplosiveBarrelDamage(params.finalDamage)
            : params.finalDamage) * lv6Mult
        );
        thrown.velocity.copy(_forward).multiplyScalar(28);
        thrown.velocity.y += 2.5;
        this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.22);
        this.callbacks.onQuestEvent('transfigure', 1);
        this.emitWorldEvent({
          kind: 'prop_sync',
          stage: this.labyrinthStage,
          targetId: thrown.id,
          x: Number(thrown.mesh.position.x.toFixed(2)),
          y: Number(thrown.mesh.position.y.toFixed(2)),
          z: Number(thrown.mesh.position.z.toFixed(2)),
          vx: Number(thrown.velocity.x.toFixed(2)),
          vy: Number(thrown.velocity.y.toFixed(2)),
          vz: Number(thrown.velocity.z.toFixed(2)),
          isHeld: false,
          isThrown: true,
          throwDamage: thrown.throwDamage,
        });
      } else {
        // Strict Direct-Aim Only for Wingardium Leviosa (`Левиоса`):
        // Only pulls a physics object if the player's crosshair ray points directly at it!
        let bestProp: PhysicsProp | null = null;
        let bestDist = Infinity;
        for (const prop of this.props) {
          if (prop.isPet || prop.explodedTimer > 0) continue;
          const propCenter = _v3.copy(prop.mesh.position).setY(prop.mesh.position.y + 0.65);
          const toProp = _v2.copy(propCenter).sub(this.camera.position);
          const dist = toProp.length();
          if (dist < 18 && dist > 0.2) {
            const alongRay = toProp.dot(_forward);
            if (alongRay <= 0) continue;
            const dot = alongRay / dist;
            // Perpendicular distance from camera aim ray to the object's center
            const perpSq = Math.max(0, dist * dist - alongRay * alongRay);
            const perpDist = Math.sqrt(perpSq);
            if (dot >= 0.965 && perpDist <= 1.15 && dist < bestDist) {
              bestDist = dist;
              bestProp = prop;
            }
          }
        }
        if (bestProp) {
          bestProp.isHeld = true;
          bestProp.isThrown = false;
          this.heldProp = bestProp;
          this.spawnParticles(bestProp.mesh.position, 0x38bdf8, 18, 5);
          this.callbacks.onQuestEvent('transfigure', 1);
          this.emitWorldEvent({
            kind: 'prop_sync',
            stage: this.labyrinthStage,
            targetId: bestProp.id,
            x: Number(bestProp.mesh.position.x.toFixed(2)),
            y: Number(bestProp.mesh.position.y.toFixed(2)),
            z: Number(bestProp.mesh.position.z.toFixed(2)),
            isHeld: true,
            isThrown: false,
          });
        } else {
          this.lastCastBanner = {
            spellName: '🎯 Наведите прицел точно на предмет (щит, бочку или ящик)!',
            qualityPercent: params.castQualityPercent,
            damage: 0,
            detail: '',
            color: '#38bdf8',
            timestamp: performance.now(),
          };
        }
      }
    }

    // If casting Fire spell (`Огонь` / `incendio`) while standing close to an unlit campfire, ignite it!
    if (params.spellId === 'incendio') {
      for (const cf of this.campfires) {
        if (!cf.isLit && cf.position.distanceTo(this.playerPos) < 5.0) {
          _v2.copy(cf.position).sub(this.playerPos).setY(0).normalize();
          const flatFwd = _v3.copy(_forward).setY(0).normalize();
          if (_v2.dot(flatFwd) > 0.35 || cf.position.distanceTo(this.playerPos) < 2.8) {
            this.igniteCampfire(cf);
          }
        }
      }
    }

    // Projectile 1: Directly along the crosshair aim vector
    this.spawnSpellProjectile({
      spellId: params.spellId,
      spellLevel,
      casterId: 'local',
      origin: spawnPos.clone(),
      direction: _forward.clone(),
      damage: params.finalDamage,
      qualityPercent: params.castQualityPercent,
      animalScale: params.animalScaleMultiplier,
      petDuration: params.petDurationSec,
      colorHex: spell.color,
    });

    // Projectile 2 (for Level 4+ combat spells): Spawns slightly lower and flies slightly below the crosshair!
    if (count >= 2) {
      const lowerOrigin = spawnPos.clone();
      lowerOrigin.y -= 0.26;
      const lowerDir = _forward.clone();
      lowerDir.y -= 0.048;
      lowerDir.normalize();
      this.spawnSpellProjectile({
        spellId: params.spellId,
        spellLevel,
        casterId: 'local',
        origin: lowerOrigin,
        direction: lowerDir,
        damage: params.finalDamage,
        qualityPercent: params.castQualityPercent,
        animalScale: params.animalScaleMultiplier,
        petDuration: params.petDurationSec,
        colorHex: spell.color,
      });
    }

    return {
      origin: { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
      direction: { x: _forward.x, y: _forward.y, z: _forward.z },
    };
  }

  public spawnSpellProjectile(opts: {
    spellId: SpellId;
    spellLevel?: number;
    isFireWall?: boolean;
    isMudBall?: boolean;
    isArrow?: boolean;
    projectileScale?: number;
    speedOverride?: number;
    casterId: string;
    origin: THREE.Vector3;
    direction: THREE.Vector3;
    damage: number;
    qualityPercent: number;
    animalScale?: number;
    petDuration?: number;
    colorHex: string | number;
    isPetAttack?: boolean;
  }) {
    const col = new THREE.Color(opts.colorHex);
    let mesh: THREE.Object3D;

    if (opts.isFireWall) {
      // Moving Wall of Fire (`Огненная стена`) launched by Stage 4 Fire Demon & Tri-Elemental Boss!
      const wallGroup = new THREE.Group();
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 1.8,
        roughness: 0.18,
        transparent: true,
        opacity: 0.9,
      });
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.85,
      });
      const wallBody = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.55, 0.42), wallMat);
      wallGroup.add(wallBody);

      for (let k = -2; k <= 2; k++) {
        const crest = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.85, 5), coreMat);
        crest.position.set(k * 0.68, 0.85, 0);
        wallGroup.add(crest);
      }
      wallGroup.position.copy(opts.origin);
      wallGroup.rotation.y = Math.atan2(opts.direction.x, opts.direction.z);
      mesh = wallGroup;
    } else if (opts.isMudBall) {
      // Stage 5 Mud Monster Giant Mud Ball (`в 5 раз больше стандартных шариков обычных мобов`)
      const stdRadius = 0.24;
      const mudRadius = stdRadius * MUD_BALL_SCALE_MULTIPLIER; // 5x larger!
      const mudGroup = new THREE.Group();
      const mudMat = new THREE.MeshStandardMaterial({
        color: 0x451a03,
        emissive: 0x78350f,
        emissiveIntensity: 0.55,
        roughness: 0.45,
        flatShading: true,
      });
      const coreSphere = new THREE.Mesh(new THREE.DodecahedronGeometry(mudRadius * 0.62, 1), mudMat);
      mudGroup.add(coreSphere);
      mudGroup.position.copy(opts.origin);
      mesh = mudGroup;
    } else if (opts.isArrow) {
      // Stage 5 Skeleton Archer Arrow matching the reference sheet (`wooden shaft + steel broadhead + feathered tail`)
      const arrowGroup = new THREE.Group();
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.026, 1.02, 6),
        new THREE.MeshStandardMaterial({ color: 0x78553a, roughness: 0.55 })
      );
      shaft.rotation.x = Math.PI / 2;
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.068, 0.24, 4),
        new THREE.MeshStandardMaterial({
          color: 0xcbd5e1,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.55,
          roughness: 0.3,
          metalness: 0.75,
        })
      );
      tip.rotation.x = Math.PI / 2;
      tip.position.z = 0.56;
      const fletching = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.09, 0.18),
        new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.78 })
      );
      fletching.position.z = -0.42;
      arrowGroup.add(shaft, tip, fletching);
      arrowGroup.position.copy(opts.origin);
      arrowGroup.rotation.y = Math.atan2(opts.direction.x, opts.direction.z);
      mesh = arrowGroup;
    } else if (
      this.graphicsQuality === 'high' &&
      (opts.spellId === 'incendio' ||
        opts.spellId === 'glacius' ||
        opts.spellId === 'expelliarmus' ||
        opts.spellId === 'stupefy' ||
        opts.spellId === 'wingardium')
    ) {
      const scaleMult = opts.projectileScale ?? 1;
      const radius = (0.2 + (opts.qualityPercent / 100) * 0.18) * scaleMult;
      mesh = this.buildHighGraphicsProjectileMesh(
        opts.spellId,
        radius,
        col,
        opts.origin,
        opts.direction
      );
    } else {
      const scaleMult = opts.projectileScale ?? 1;
      const radius = (0.2 + (opts.qualityPercent / 100) * 0.18) * scaleMult;
      const geo = new THREE.OctahedronGeometry(radius, 1);
      const mat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 1.5,
        roughness: 0.15,
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(opts.origin);
    }

    this.scene.add(mesh);

    const rawSpeed =
      opts.speedOverride !== undefined
        ? opts.speedOverride
        : opts.isArrow
        ? SKELETON_ARROW_SPEED
        : opts.isFireWall
        ? 11.5
        : opts.isMudBall
        ? 11.2
        : opts.casterId === 'enemy'
        ? 13
        : 26;
    const enemyProjSpeedMult =
      opts.casterId === 'enemy'
        ? getDiabloDifficultyMultipliers(this.difficultyTier, this.labyrinthStage)
            .projectileSpeedMultiplier
        : 1.0;
    const speed = rawSpeed * enemyProjSpeedMult;
    this.projectiles.push({
      active: true,
      spellId: opts.spellId,
      spellLevel: opts.spellLevel ?? 1,
      isFireWall: opts.isFireWall ?? false,
      isMudBall: opts.isMudBall ?? false,
      isArrow: opts.isArrow ?? false,
      isPetAttack: opts.isPetAttack ?? false,
      casterId: opts.casterId,
      mesh,
      position: opts.origin.clone(),
      velocity: opts.direction.clone().normalize().multiplyScalar(speed),
      damage: opts.damage,
      qualityPercent: opts.qualityPercent,
      animalScale: opts.animalScale ?? 1.4,
      petDuration: opts.petDuration ?? 20,
      life: opts.isFireWall ? 4.0 : 3.4,
      color: col,
    });
  }

  /**
   * Builds high-detail 3D spell projectile meshes for High Graphics (`graphicsQuality === 'high'`)
   * matching the reference sheet (`/public/assets/aistudio/image_75db2109.png`):
   * 1. `incendio` (FIREBALL / ОГНЕННЫЙ СНАРЯД): Golden-yellow core + spiky star corona + multi-layer flame comet tail + trailing embers.
   * 2. `glacius` (ICE SHARD / ЛЕДЯНОЙ СНАРЯД): Faceted cyan-white diamond crystal head + crown of jagged ice spikes fanning backward + ice fragments.
   * 3. `expelliarmus` (LIGHTNING BOLT / СНАРЯД МОЛНИИ): Electric blue sphere core + jagged yellow-white lightning arcs wrapping sphere & forked tail bolts.
   * 4. `stupefy` (KNOCKBACK DISC / ОТТАЛКИВАЮЩИЙ СНАРЯД): Flat turquoise-cyan energy disc with concentric glowing shockwave rings.
   * 5. `wingardium` (FEATHER PROJECTILE / СНАРЯД-ПЁРЫШКО): Glowing pale-blue/white curved magical feather with quill shaft and layered barbs.
   */
  private buildHighGraphicsProjectileMesh(
    spellId: SpellId,
    radius: number,
    col: THREE.Color,
    origin: THREE.Vector3,
    direction: THREE.Vector3
  ): THREE.Group {
    const group = new THREE.Group();
    group.userData.isDirectionalProjectile = true;
    group.userData.highDetailProjectileSpell = spellId;
    const r = Math.max(0.22, radius);

    if (spellId === 'incendio') {
      // 1. FIREBALL (ОГНЕННЫЙ СНАРЯД):
      // Front: bright golden-yellow sphere surrounded by a spiky orange-red star corona.
      // Side / 3-4: tapered multi-layer flame comet tail (-Z) + floating glowing ember cubes.
      const innerCoreMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const midFlameMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.8,
        roughness: 0.2,
        flatShading: true,
      });
      const outerFlameMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 1.6,
        roughness: 0.25,
        flatShading: true,
      });
      const tailTipMat = new THREE.MeshBasicMaterial({ color: 0xea580c });

      const coreSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.92, 2), innerCoreMat);
      coreSphere.position.z = r * 0.35;
      group.add(coreSphere);

      const midShell = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 1.08, 1), midFlameMat);
      midShell.position.z = r * 0.22;
      group.add(midShell);

      // Spiky star-like flame corona around the front sphere (10 radial cones)
      const spikeCount = 10;
      for (let i = 0; i < spikeCount; i++) {
        const angle = (i / spikeCount) * Math.PI * 2;
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(r * 0.32, r * 0.72, 4),
          i % 2 === 0 ? outerFlameMat : midFlameMat
        );
        spike.position.set(
          Math.cos(angle) * r * 0.95,
          Math.sin(angle) * r * 0.95,
          r * 0.15
        );
        spike.rotation.z = angle - Math.PI / 2;
        spike.rotation.x = -0.32; // slightly swept back
        group.add(spike);
      }

      // Tapered multi-layer comet tail extending along -Z
      const mainTail = new THREE.Mesh(
        new THREE.ConeGeometry(r * 1.05, r * 3.8, 7),
        outerFlameMat
      );
      mainTail.rotation.x = -Math.PI / 2;
      mainTail.position.z = -r * 1.55;
      group.add(mainTail);

      const innerTail = new THREE.Mesh(
        new THREE.ConeGeometry(r * 0.76, r * 2.7, 6),
        midFlameMat
      );
      innerTail.rotation.x = -Math.PI / 2;
      innerTail.position.set(0, r * 0.04, -r * 1.05);
      group.add(innerTail);

      // Jagged side flame fins along the tail
      for (let k = 0; k < 4; k++) {
        const finAngle = (k / 4) * Math.PI * 2 + 0.4;
        const fin = new THREE.Mesh(new THREE.ConeGeometry(r * 0.34, r * 1.65, 4), outerFlameMat);
        fin.rotation.x = -Math.PI / 2 + Math.sin(finAngle) * 0.22;
        fin.rotation.y = Math.cos(finAngle) * 0.22;
        fin.position.set(
          Math.cos(finAngle) * r * 0.55,
          Math.sin(finAngle) * r * 0.55,
          -r * (1.1 + k * 0.32)
        );
        group.add(fin);
      }

      // Trailing ember particles floating around the comet tail
      const emberOffsets = [
        [0.85, 0.72, -0.9],
        [-0.92, -0.55, -1.35],
        [0.65, -0.82, -1.85],
        [-0.75, 0.68, -2.35],
        [0.35, 0.48, -2.95],
        [-0.32, -0.42, -3.35],
      ];
      for (let e = 0; e < emberOffsets.length; e++) {
        const [ex, ey, ez] = emberOffsets[e];
        const ember = new THREE.Mesh(
          new THREE.OctahedronGeometry(r * (0.22 - e * 0.022), 0),
          e % 2 === 0 ? innerCoreMat : tailTipMat
        );
        ember.position.set(ex * r, ey * r, ez * r);
        group.add(ember);
      }
    } else if (spellId === 'glacius') {
      // 2. ICE SHARD (ЛЕДЯНОЙ СНАРЯД):
      // Front: sharp faceted cyan-white crystalline cluster.
      // Side / 3-4: faceted diamond crystal nose + angled jagged ice spikes fanning backward + trailing ice shards.
      const iceTipMat = new THREE.MeshStandardMaterial({
        color: 0xf0f9ff,
        emissive: 0x7dd3fc,
        emissiveIntensity: 1.5,
        roughness: 0.08,
        metalness: 0.25,
        flatShading: true,
      });
      const iceBodyMat = new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        emissive: 0x0284c7,
        emissiveIntensity: 1.35,
        roughness: 0.12,
        metalness: 0.3,
        flatShading: true,
      });
      const iceDarkMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0369a1,
        emissiveIntensity: 1.2,
        roughness: 0.18,
        flatShading: true,
      });

      // Faceted crystalline diamond head (+Z)
      const headCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(r * 0.95, 0), iceTipMat);
      headCrystal.scale.set(0.95, 0.95, 1.55);
      headCrystal.position.z = r * 0.45;
      group.add(headCrystal);

      // Long central ice lance tail (-Z)
      const mainIceTail = new THREE.Mesh(new THREE.ConeGeometry(r * 0.78, r * 3.9, 5), iceBodyMat);
      mainIceTail.rotation.x = -Math.PI / 2;
      mainIceTail.position.z = -r * 1.55;
      group.add(mainIceTail);

      // Crown of 9 sharp jagged crystal spikes fanning outward and backward (matching Front & 3/4 views)
      const crystalCount = 9;
      for (let i = 0; i < crystalCount; i++) {
        const angle = (i / crystalCount) * Math.PI * 2;
        const len = r * (1.75 + (i % 3) * 0.48);
        const shard = new THREE.Mesh(
          new THREE.ConeGeometry(r * 0.34, len, 4),
          i % 2 === 0 ? iceTipMat : iceDarkMat
        );
        const tiltOut = 0.42 + (i % 2) * 0.16;
        const dirVec = new THREE.Vector3(
          Math.cos(angle) * Math.sin(tiltOut),
          Math.sin(angle) * Math.sin(tiltOut),
          -Math.cos(tiltOut)
        ).normalize();
        shard.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirVec);
        shard.position.set(
          Math.cos(angle) * r * 0.48,
          Math.sin(angle) * r * 0.48,
          -r * (0.35 + (i % 3) * 0.25)
        );
        group.add(shard);
      }

      // Detached trailing ice crystal fragments behind the tail
      const shardOffsets = [
        [0.75, 0.55, -2.0],
        [-0.82, 0.38, -2.45],
        [0.45, -0.68, -2.85],
        [-0.48, -0.52, -3.35],
        [0.15, 0.42, -3.75],
      ];
      for (let s = 0; s < shardOffsets.length; s++) {
        const [sx, sy, sz] = shardOffsets[s];
        const frag = new THREE.Mesh(new THREE.ConeGeometry(r * 0.16, r * 0.65, 4), iceTipMat);
        frag.rotation.x = -Math.PI / 2;
        frag.position.set(sx * r, sy * r, sz * r);
        group.add(frag);
      }
    } else if (spellId === 'expelliarmus') {
      // 3. LIGHTNING BOLT (СНАРЯД МОЛНИИ):
      // Front: glowing electric blue sphere wrapped in bright yellow-white jagged lightning arcs.
      // Side / 3-4: blue-cyan energy orb head + forked zig-zag yellow-white lightning bolt tails.
      const coreOrbMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 2.0,
        roughness: 0.1,
      });
      const auraOrbMat = new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.42,
      });
      const boltYellowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const boltGoldMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

      const coreOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.88, 2), coreOrbMat);
      coreOrb.position.z = r * 0.35;
      group.add(coreOrb);

      const auraOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 1.18, 1), auraOrbMat);
      auraOrb.position.z = r * 0.35;
      group.add(auraOrb);

      // Front iconic zig-zag lightning bolt crest across the sphere face
      const crestSegments = [
        { x: 0.18, y: 0.52, z: 0.98, rotZ: -0.55, len: 0.62 },
        { x: 0.0, y: 0.05, z: 1.02, rotZ: 0.65, len: 0.55 },
        { x: -0.16, y: -0.45, z: 0.96, rotZ: -0.52, len: 0.62 },
      ];
      for (const seg of crestSegments) {
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(r * 0.22, r * seg.len, r * 0.14),
          boltYellowMat
        );
        bar.position.set(seg.x * r, seg.y * r, seg.z * r);
        bar.rotation.z = seg.rotZ;
        group.add(bar);
      }

      // 4 Forked zig-zag lightning bolt tails streaming backward along -Z
      for (let b = 0; b < 4; b++) {
        const baseAngle = (b / 4) * Math.PI * 2 + 0.35;
        let prevPt = new THREE.Vector3(
          Math.cos(baseAngle) * r * 0.65,
          Math.sin(baseAngle) * r * 0.65,
          r * 0.2
        );
        const segSteps = 5;
        for (let s = 1; s <= segSteps; s++) {
          const t = s / segSteps;
          const zig = (s % 2 === 0 ? 1 : -1) * r * 0.36 * (1 - t * 0.45);
          const nextPt = new THREE.Vector3(
            Math.cos(baseAngle) * r * (0.55 * (1 - t * 0.75)) + Math.cos(baseAngle + 1.57) * zig,
            Math.sin(baseAngle) * r * (0.55 * (1 - t * 0.75)) + Math.sin(baseAngle + 1.57) * zig,
            r * 0.2 - t * r * 3.8
          );
          const segVec = new THREE.Vector3().subVectors(nextPt, prevPt);
          const segLen = segVec.length();
          const thickness = r * (0.14 * (1 - t * 0.55));
          const boltSeg = new THREE.Mesh(
            new THREE.CylinderGeometry(thickness * 0.65, thickness, segLen, 5),
            s % 2 === 0 ? boltYellowMat : boltGoldMat
          );
          boltSeg.position.copy(prevPt).addScaledVector(segVec, 0.5);
          boltSeg.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            segVec.clone().normalize()
          );
          group.add(boltSeg);
          prevPt = nextPt;
        }
      }
    } else if (spellId === 'stupefy') {
      // 4. KNOCKBACK DISC (ОТТАЛКИВАЮЩИЙ СНАРЯД):
      // Flat turquoise-cyan energy disc with concentric glowing shockwave rings.
      group.userData.isSpinningDisc = true;
      const discBodyMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 1.5,
        roughness: 0.15,
        metalness: 0.25,
      });
      const ringGlowMat = new THREE.MeshBasicMaterial({ color: 0xa5f3fc });
      const rimGlowMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

      const discRadius = r * 1.55;
      const discThickness = r * 0.2;
      const discCore = new THREE.Mesh(
        new THREE.CylinderGeometry(discRadius, discRadius, discThickness, 28),
        discBodyMat
      );
      // Slight tilt so both the flat side profile and concentric top rings are visible in flight
      discCore.rotation.x = 0.22;
      group.add(discCore);

      const outerRim = new THREE.Mesh(
        new THREE.TorusGeometry(discRadius, r * 0.11, 8, 32),
        rimGlowMat
      );
      outerRim.rotation.x = Math.PI / 2 + 0.22;
      group.add(outerRim);

      for (const ringRatio of [0.76, 0.48, 0.22]) {
        for (const sideY of [-discThickness * 0.55, discThickness * 0.55]) {
          const cRing = new THREE.Mesh(
            new THREE.TorusGeometry(discRadius * ringRatio, r * 0.048, 6, 24),
            ringGlowMat
          );
          cRing.rotation.x = Math.PI / 2 + 0.22;
          cRing.position.y = sideY;
          group.add(cRing);
        }
      }
    } else {
      // 5. FEATHER PROJECTILE (СНАРЯД-ПЁРЫШКО / wingardium):
      // Glowing pale-blue/white aerodynamic curved feather with central quill shaft and layered barbs.
      group.userData.isFeather = true;
      const quillMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const vaneLightMat = new THREE.MeshStandardMaterial({
        color: 0xe0f2fe,
        emissive: 0x7dd3fc,
        emissiveIntensity: 1.45,
        roughness: 0.2,
        flatShading: true,
      });
      const vaneMidMat = new THREE.MeshStandardMaterial({
        color: 0xbae6fd,
        emissive: 0x38bdf8,
        emissiveIntensity: 1.25,
        roughness: 0.25,
        flatShading: true,
      });
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.28,
      });

      const featherLen = r * 3.6;
      // Central quill shaft (rachis) with slight graceful arch
      const shaftSegs = 6;
      for (let i = 0; i < shaftSegs; i++) {
        const t0 = i / shaftSegs;
        const t1 = (i + 1) / shaftSegs;
        const z0 = (0.45 - t0) * featherLen;
        const z1 = (0.45 - t1) * featherLen;
        const y0 = Math.sin(t0 * Math.PI) * r * 0.28;
        const y1 = Math.sin(t1 * Math.PI) * r * 0.28;
        const p0 = new THREE.Vector3(0, y0, z0);
        const p1 = new THREE.Vector3(0, y1, z1);
        const segVec = new THREE.Vector3().subVectors(p1, p0);
        const quillSeg = new THREE.Mesh(
          new THREE.CylinderGeometry(r * 0.045 * (1 - t1 * 0.5), r * 0.055 * (1 - t0 * 0.3), segVec.length(), 6),
          quillMat
        );
        quillSeg.position.copy(p0).addScaledVector(segVec, 0.5);
        quillSeg.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          segVec.clone().normalize()
        );
        group.add(quillSeg);
      }

      // Layered feather barbs/vanes along left and right sides of the shaft
      const barbPairs = 7;
      for (let b = 0; b < barbPairs; b++) {
        const t = b / (barbPairs - 1); // 0 (front tip) .. 1 (back base)
        const profile = Math.sin(Math.pow(t, 0.75) * Math.PI * 0.92);
        const halfWidth = r * (0.22 + profile * 0.68);
        const zPos = (0.38 - t * 0.82) * featherLen;
        const yArch = Math.sin(t * Math.PI) * r * 0.28;
        for (const side of [-1, 1] as const) {
          const barb = new THREE.Mesh(
            new THREE.BoxGeometry(halfWidth, r * 0.07, featherLen * 0.16),
            b % 2 === 0 ? vaneLightMat : vaneMidMat
          );
          barb.position.set(side * halfWidth * 0.48, yArch, zPos);
          barb.rotation.y = side * -0.38; // swept backward toward the quill stem
          barb.rotation.z = side * -0.12;
          group.add(barb);
        }
      }

      // Rounded aerodynamic front feather tip (+Z)
      const tipVane = new THREE.Mesh(
        new THREE.ConeGeometry(r * 0.42, r * 0.95, 5),
        vaneLightMat
      );
      tipVane.scale.set(1.15, 0.22, 1.0);
      tipVane.rotation.x = Math.PI / 2;
      tipVane.position.set(0, r * 0.08, featherLen * 0.46);
      group.add(tipVane);

      // Soft glowing wind aura around the feather
      const featherAura = new THREE.Mesh(
        new THREE.SphereGeometry(r * 0.72, 10, 8),
        auraMat
      );
      featherAura.scale.set(1.1, 0.45, 2.6);
      featherAura.position.set(0, r * 0.12, -featherLen * 0.05);
      group.add(featherAura);
    }

    group.position.copy(origin);
    const lookTarget = _v2.copy(origin).add(direction);
    group.lookAt(lookTarget);
    return group;
  }

  /**
   * Spawns a Stage 5 Mud Monster Mud Puddle (`Грязевая лужа`):
   * Lies on the floor for 5.0 seconds (`MUD_PUDDLE_DURATION_SEC = 5.0`) and slows player movement by 50% (`MUD_PUDDLE_SLOW_FACTOR = 0.50`)!
   */
  private spawnMudPuddle(center: THREE.Vector3) {
    const radius = MUD_PUDDLE_RADIUS;
    const group = new THREE.Group();
    group.position.set(center.x, 0.04, center.z);

    const discGeo = new THREE.CircleGeometry(radius, 28);
    discGeo.rotateX(-Math.PI / 2);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      emissive: 0x78350f,
      emissiveIntensity: 0.45,
      roughness: 0.35,
      transparent: true,
      opacity: 0.88,
    });
    const disc = new THREE.Mesh(discGeo, discMat);

    const rimGeo = new THREE.RingGeometry(radius - 0.25, radius, 28);
    rimGeo.rotateX(-Math.PI / 2);
    const rim = new THREE.Mesh(
      rimGeo,
      new THREE.MeshBasicMaterial({
        color: 0xd97706,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      })
    );
    rim.position.y = 0.02;

    group.add(disc, rim);
    this.worldContentGroup.add(group);

    this.mudPuddles.push({
      id: `mudpuddle_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      position: new THREE.Vector3(center.x, 0, center.z),
      radius,
      remainingSec: MUD_PUDDLE_DURATION_SEC,
      group,
    });
  }

  /**
   * Spawns a Stage 5 Fire Worm Boss Burning Floor Pool (`Огненная лужа`):
   * Burns on the floor for 4.0 seconds (`WORM_FIRE_POOL_DURATION_SEC = 4.0`) and ignites the player for 2.0 seconds (`WORM_FIRE_POOL_BURN_SEC = 2.0`)!
   */
  private spawnFirePool(center: THREE.Vector3, damagePerTick: number) {
    const radius = WORM_FIRE_POOL_RADIUS;
    const group = new THREE.Group();
    group.position.set(center.x, 0.05, center.z);

    const discGeo = new THREE.CircleGeometry(radius, 32);
    discGeo.rotateX(-Math.PI / 2);
    const disc = new THREE.Mesh(
      discGeo,
      new THREE.MeshBasicMaterial({
        color: 0xea580c,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
      })
    );

    const ringGeo = new THREE.RingGeometry(radius - 0.26, radius, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      })
    );
    ring.position.y = 0.02;

    group.add(disc, ring);
    this.worldContentGroup.add(group);

    this.firePools.push({
      id: `firepool_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      position: new THREE.Vector3(center.x, 0, center.z),
      radius,
      remainingSec: WORM_FIRE_POOL_DURATION_SEC,
      tickAccum: 0.5,
      damagePerTick,
      group,
    });
  }

  /**
   * Spawns a Stage 5 Skeleton Hammer-Shield Linear Ground Earthquake (`полоской пошел урон в сторону меня типа землетрясение земли`)!
   */
  private spawnEarthquakeLine(origin: THREE.Vector3, dir: THREE.Vector3, damage: number) {
    const flatDir = dir.clone().setY(0).normalize();
    const length = SKELETON_EARTHQUAKE_LENGTH;
    const width = SKELETON_EARTHQUAKE_WIDTH;

    const group = new THREE.Group();
    group.position.set(origin.x, 0.06, origin.z);
    group.rotation.y = Math.atan2(flatDir.x, flatDir.z);

    const stripGeo = new THREE.PlaneGeometry(width, length);
    stripGeo.translate(0, length / 2, 0);
    stripGeo.rotateX(-Math.PI / 2);
    const strip = new THREE.Mesh(
      stripGeo,
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      })
    );
    group.add(strip);

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      emissive: 0xd97706,
      emissiveIntensity: 0.9,
      roughness: 0.5,
      flatShading: true,
    });
    for (let s = 1; s <= 7; s++) {
      const dist = (s / 7) * (length - 0.8);
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.25, 5), rockMat);
      spike.position.set((s % 2 === 0 ? 1 : -1) * 0.25, 0.6, dist);
      group.add(spike);
    }

    this.worldContentGroup.add(group);
    audioEngine.playHeavyImpact(true);
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.28);

    this.earthquakeLines.push({
      id: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      origin: new THREE.Vector3(origin.x, 0, origin.z),
      direction: flatDir,
      length,
      width,
      remainingSec: 1.0,
      damage,
      hasHitPlayer: false,
      group,
    });
  }

  /**
   * Spawns a Stage 4 Water Monster / Tri-Elemental Boss Ice Rain AoE Zone (`Ледяной дождь`):
   * - Shows a bright RED warning circle on the floor for 1.0 second (`telegraphTimer = 1.0`).
   * - Then turns into a 5.0-second falling Ice Rain storm (`activeTimer = 5.0`) that deals damage every 1 second if the player stays inside!
   */
  private spawnIceRainZone(center: THREE.Vector3, damagePerTick: number) {
    const radius = 3.8;
    const group = new THREE.Group();
    group.position.set(center.x, 0.05, center.z);

    const ringGeo = new THREE.RingGeometry(radius - 0.24, radius, 36);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const warningRing = new THREE.Mesh(ringGeo, ringMat);

    const fillGeo = new THREE.CircleGeometry(radius - 0.2, 32);
    fillGeo.rotateX(-Math.PI / 2);
    const fillMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    const fillDisc = new THREE.Mesh(fillGeo, fillMat);

    const rainGroup = new THREE.Group();
    rainGroup.visible = false;
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x0284c7,
      emissiveIntensity: 1.4,
      roughness: 0.15,
    });
    for (let i = 0; i < 14; i++) {
      const shard = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.72, 5), shardMat);
      shard.rotation.x = Math.PI;
      const angle = (i / 14) * Math.PI * 2;
      const r = (0.25 + (i % 3) * 0.3) * radius;
      shard.position.set(Math.cos(angle) * r, 1.2 + (i % 4) * 0.95, Math.sin(angle) * r);
      rainGroup.add(shard);
    }

    group.add(warningRing, fillDisc, rainGroup);
    this.worldContentGroup.add(group);

    this.iceRainZones.push({
      id: `icerain_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      position: new THREE.Vector3(center.x, 0, center.z),
      radius,
      telegraphTimer: 1.0,
      activeTimer: 5.0,
      tickAccum: 0,
      damagePerTick,
      group,
      warningRing,
      fillDisc,
      rainGroup,
    });
  }

  /**
   * Detaches any latched Phase 3 Leech Worm (`boss_worm_5_p3_leech`) when the player casts Teleport (`[Ё]` or `[F]`):
   * "последняя стадия червяка когда один из них прыгает и вгрызается в меня если делаешь телепорт то он сразу спадает."
   */
  private detachLatchedLeechWormsOnTeleport(): boolean {
    let anyDetached = false;
    for (const enemy of this.enemies) {
      if (enemy.archetype === 'boss_worm_5_p3_leech' && (enemy.leechLatchTimer ?? 0) > 0) {
        enemy.leechLatchTimer = 0;
        enemy.leechTickAccum = 0;
        enemy.position.set(this.playerPos.x, 0, this.playerPos.z);
        if (this.mapMode === 'labyrinth') {
          this.resolveLabyrinthCollisions(enemy.position, 0.85);
        }
        enemy.mesh.position.copy(enemy.position);
        enemy.state = 'seek';
        enemy.stateTimer = 1.5;
        this.spawnParticles(_v1.copy(enemy.position).setY(0.9), 0xa855f7, 20, 5.5);
        anyDetached = true;
      }
    }
    return anyDetached;
  }

  /**
   * Spawns a Snow Giant (`frost_charger`) Ice Wind Pull Zone (`Ледяной Ветер`):
   * - Every 7 seconds (`FROST_WIND_COOLDOWN_SEC`), the Snow Giant casts an icy wind zone at the player's position.
   * - Shows a bright BLUE circle (`синий кружок`, `0x38bdf8`) on the floor for 1.0 second (`FROST_WIND_TELEGRAPH_SEC = 1.0`).
   * - Then blows icy wind toward the Snow Giant for 3.0 seconds (`FROST_WIND_DURATION_SEC = 3.0`), pulling the player toward
   *   the Snow Giant (`FROST_WIND_PULL_SPEED`) while allowing the player to walk out or teleport out!
   */
  private spawnFrostWindZone(center: THREE.Vector3, casterEnemy: EnemyActor) {
    const radius = FROST_WIND_RADIUS;
    const group = new THREE.Group();
    group.position.set(center.x, 0.06, center.z);

    const ringGeo = new THREE.RingGeometry(radius - 0.28, radius, 36);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    });
    const blueRing = new THREE.Mesh(ringGeo, ringMat);

    const fillGeo = new THREE.CircleGeometry(radius - 0.24, 32);
    fillGeo.rotateX(-Math.PI / 2);
    const fillMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
    });
    const fillDisc = new THREE.Mesh(fillGeo, fillMat);

    // Swirling icy wind ribbons & directional chevrons pointing toward the Snow Giant
    const windStreamGroup = new THREE.Group();
    windStreamGroup.visible = false;
    const streamMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    for (let i = 0; i < 12; i++) {
      const ribbon = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.35, 4), streamMat);
      ribbon.rotation.x = Math.PI / 2;
      const offsetX = ((i % 3) - 1) * 1.4;
      const offsetZ = (Math.floor(i / 3) - 1.5) * 1.3;
      ribbon.position.set(offsetX, 0.45 + (i % 3) * 0.35, offsetZ);
      windStreamGroup.add(ribbon);
    }

    const dirToGiant = new THREE.Vector3(
      casterEnemy.position.x - center.x,
      0,
      casterEnemy.position.z - center.z
    );
    if (dirToGiant.lengthSq() > 0.01) {
      windStreamGroup.rotation.y = Math.atan2(dirToGiant.x, dirToGiant.z);
    }

    group.add(blueRing, fillDisc, windStreamGroup);
    this.worldContentGroup.add(group);

    this.frostWindZones.push({
      id: `frostwind_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      position: new THREE.Vector3(center.x, 0, center.z),
      casterEnemyId: casterEnemy.id,
      casterPos: casterEnemy.position.clone(),
      radius,
      telegraphTimer: FROST_WIND_TELEGRAPH_SEC,
      activeTimer: FROST_WIND_DURATION_SEC,
      bannerCooldown: 0,
      group,
      blueRing,
      fillDisc,
      windStreamGroup,
    });
  }

  public tryHarvestOrInteract(): boolean {
    if (this.mode !== 'playing') return false;

    // 0. Two-Step Treasure Chest Interaction:
    // - 1st press [E]: Opens lid & shows Chest Contents Preview window
    // - 2nd press [E]: Collects the items into player's inventory!
    for (const chest of this.chests) {
      if (chest.opened && !chest.looted && chest.position.distanceTo(this.playerPos) <= 4.5) {
        this.lootTreasureChest(chest, false);
        return true;
      }
    }
    for (const chest of this.chests) {
      if (!chest.opened && chest.position.distanceTo(this.playerPos) <= 4.2) {
        this.openTreasureChest(chest, false);
        return true;
      }
    }

    // 0b. Check nearby LIT campfire to open Cooking & Alchemy modal [E]
    for (const cf of this.campfires) {
      if (cf.isLit && cf.position.distanceTo(this.playerPos) <= CAMPFIRE_HEAL_RADIUS + 0.6) {
        if (this.callbacks.onOpenCampfireCraft) {
          this.callbacks.onOpenCampfireCraft();
          return true;
        }
      }
    }

    // 1. Check nearby UNTAMED animals to tame (upgrading is done slowly in Settings/Grimoire, not by 1-click [E]!)
    for (const animal of this.animals) {
      if (animal.position.distanceTo(this.playerPos) < 4.5) {
        if (!animal.isTamed) {
          this.selectAndTamePet(animal.species);
          this.callbacks.onLootCollected(
            'mandrake_root',
            0,
            `Приручен спутник: ${animal.name}! Прокачка доступна в Гримуаре [G] → Питомцы.`
          );
          return true;
        }
      }
    }

    // 2. Check nearby loot drops
    for (let i = this.lootDrops.length - 1; i >= 0; i--) {
      const drop = this.lootDrops[i];
      if (drop.position.distanceTo(this.playerPos) < 4.5) {
        this.worldContentGroup.remove(drop.mesh);
        this.lootDrops.splice(i, 1);
        audioEngine.playPickupChime();
        this.callbacks.onLootCollected(drop.reagentId, 1, `Добыча: ${REAGENTS[drop.reagentId].name}`);
        return true;
      }
    }

    // 3. Check nearby harvestable trees & herbs (Disappear on harvest and respawn on the same spot after 60 seconds!)
    for (const node of this.harvestNodes) {
      if (node.cooldown <= 0 && node.position.distanceTo(this.playerPos) < 4.8) {
        node.cooldown = HARVEST_NODE_RESPAWN_SEC; // 60.0 seconds (1 minute)
        node.mesh.visible = false;
        audioEngine.playPickupChime();
        this.spawnParticles(
          _v1.copy(node.position).setY(1.2),
          REAGENTS[node.reagentId].color,
          20,
          4.5
        );
        this.emitWorldEvent({
          kind: 'harvest',
          stage: this.labyrinthStage,
          targetId: node.id,
        });
        this.callbacks.onLootCollected(
          node.reagentId,
          1,
          `Собрано: ${REAGENTS[node.reagentId].name} (вырастет вновь через 1 мин.)`
        );
        this.callbacks.onQuestEvent('harvest', 1);
        this.pushHudSnapshot();
        return true;
      }
    }

    return false;
  }

  public syncRemotePlayers(players: RemotePlayerState[], selfId: string) {
    const activeIds = new Set<string>();

    for (const p of players) {
      if (p.id === selfId) continue;
      activeIds.add(p.id);

      let entry = this.remoteMeshes.get(p.id);
      if (!entry) {
        const group = new THREE.Group();
        this.addContactShadow(group, 0.9);

        const robeMat = new THREE.MeshStandardMaterial({
          color: 0x1d4ed8,
          roughness: 0.7,
          metalness: 0.2,
          flatShading: true,
        });
        const trimMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.45,
          roughness: 0.3,
          flatShading: true,
        });
        const goldMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          roughness: 0.3,
          metalness: 0.85,
          flatShading: true,
        });

        const body = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.9, 8), robeMat);
        body.position.y = 0.95;
        const mantle = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.48, 6), trimMat);
        mantle.position.y = 1.65;
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), goldMat);
        head.position.y = 2.05;
        const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.06, 8), robeMat);
        hatBrim.position.y = 2.28;
        const hat = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.75, 8), robeMat);
        hat.position.y = 2.62;

        const shieldGeo = new THREE.SphereGeometry(1.35, 16, 16);
        const shieldMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.28,
          wireframe: true,
        });
        const shield = new THREE.Mesh(shieldGeo, shieldMat);
        shield.position.y = 1.1;
        shield.visible = false;

        // Overhead 3D Name + HP Bar Sprite for Co-op / PvP Wizard
        const hpBarCanvas = document.createElement('canvas');
        hpBarCanvas.width = 320;
        hpBarCanvas.height = 72;
        const hpBarTexture = new THREE.CanvasTexture(hpBarCanvas);
        hpBarTexture.colorSpace = THREE.SRGBColorSpace;
        this.drawEnemyHpBarCanvas(
          hpBarCanvas,
          hpBarTexture,
          `🧙 ${p.name}`,
          p.hp ?? 100,
          p.maxHp ?? 100
        );

        const spriteMat = new THREE.SpriteMaterial({
          map: hpBarTexture,
          transparent: true,
          depthWrite: false,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(2.9, 0.68, 1);
        sprite.position.set(0, 3.35, 0);

        group.add(body, mantle, head, hatBrim, hat, shield, sprite);
        this.scene.add(group);
        entry = { group, shield, hpBarCanvas, hpBarTexture, data: p };
        this.remoteMeshes.set(p.id, entry);
      }

      if (entry.data.hp !== p.hp || entry.data.maxHp !== p.maxHp || entry.data.name !== p.name) {
        this.drawEnemyHpBarCanvas(
          entry.hpBarCanvas,
          entry.hpBarTexture,
          `🧙 ${p.name}`,
          p.hp ?? 100,
          p.maxHp ?? 100
        );
      }

      entry.data = p;
      entry.group.position.set(p.x, p.y, p.z);
      entry.group.rotation.y = p.rotY;
      entry.shield.visible = p.shieldActive;
    }

    for (const [id, entry] of this.remoteMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(entry.group);
        this.remoteMeshes.delete(id);
      }
    }
  }

  public applyRemoteDamageToSelf(damage: number, blocked: boolean, attackerName?: string) {
    if (this.mode !== 'playing' || this.testInvulnerable) return;
    this.tookDamageThisStage = true;
    this.hp = Math.max(0, this.hp - damage);
    this.cameraTrauma = Math.min(1, this.cameraTrauma + (blocked ? 0.18 : 0.45));
    audioEngine.playPlayerHurt();
    this.lastCastBanner = {
      spellName: `⚠️ Урон от мага ${attackerName ? `«${attackerName}»` : ''}: -${damage} ОЗ`,
      qualityPercent: 100,
      damage,
      detail: '',
      color: '#f97316',
      timestamp: performance.now(),
    };
    if (this.hp <= 0) {
      this.hp = this.maxHp;
    }
    this.pushHudSnapshot();
  }

  public applyRemoteEnemyDamage(data: {
    enemyId: string;
    stage: number;
    hp: number;
    maxHp: number;
    damage: number;
    spellId?: string;
    stunSec?: number;
    freezeSec?: number;
    killed?: boolean;
    x?: number;
    z?: number;
  }) {
    if (
      this.mapMode !== 'labyrinth' ||
      this.labyrinthMultiplayerMode !== 'shared' ||
      data.stage !== this.labyrinthStage
    ) {
      return;
    }
    const enemy = this.enemies.find((e) => e.id === data.enemyId);
    if (!enemy || enemy.state === 'ko' || enemy.hp <= 0) return;

    if (typeof data.x === 'number' && typeof data.z === 'number') {
      enemy.position.x = THREE.MathUtils.lerp(enemy.position.x, data.x, 0.5);
      enemy.position.z = THREE.MathUtils.lerp(enemy.position.z, data.z, 0.5);
      enemy.mesh.position.copy(enemy.position);
    }

    if (data.stunSec && data.stunSec > 0) {
      enemy.stunTimer = Math.max(enemy.stunTimer, data.stunSec);
      enemy.state = 'seek';
    }
    if (data.freezeSec && data.freezeSec > 0) {
      enemy.freezeTimer = Math.max(enemy.freezeTimer, data.freezeSec);
    }

    const reconciled = reconcileSharedEnemyDamage(
      enemy.hp,
      enemy.maxHp,
      data.damage,
      data.hp
    );
    if (reconciled.damageApplied > 0 || reconciled.isFirstKill) {
      this.damageEnemy(
        enemy,
        reconciled.damageApplied > 0 ? reconciled.damageApplied : enemy.hp,
        new THREE.Vector3(),
        0xf97316,
        true
      );
    }
  }

  public applyRemoteEnemySync(
    stage: number,
    records: Array<{
      id: string;
      hp: number;
      maxHp: number;
      x: number;
      y: number;
      z: number;
      state: string;
      killed?: boolean;
    }>
  ) {
    if (
      this.mapMode !== 'labyrinth' ||
      this.labyrinthMultiplayerMode !== 'shared' ||
      stage !== this.labyrinthStage
    ) {
      return;
    }

    for (const rec of records) {
      const enemy = this.enemies.find((e) => e.id === rec.id);
      if (!enemy || enemy.state === 'ko') continue;

      if (rec.killed || rec.hp <= 0) {
        if (enemy.hp > 0) {
          this.damageEnemy(enemy, enemy.hp, new THREE.Vector3(), 0xf97316, true);
        }
        continue;
      }

      if (rec.hp < enemy.hp) {
        this.damageEnemy(enemy, enemy.hp - rec.hp, new THREE.Vector3(), 0xf97316, true);
      }

      if (typeof rec.x === 'number' && typeof rec.z === 'number') {
        const dist = Math.hypot(rec.x - enemy.position.x, rec.z - enemy.position.z);
        if (dist > 0.35 && dist < 35) {
          enemy.position.x = THREE.MathUtils.lerp(enemy.position.x, rec.x, 0.35);
          enemy.position.z = THREE.MathUtils.lerp(enemy.position.z, rec.z, 0.35);
          enemy.mesh.position.copy(enemy.position);
        }
      }
      if (rec.state === 'seek' && enemy.state === 'idle') {
        enemy.state = 'seek';
      }
    }
  }

  private spawnLootDrop(pos: THREE.Vector3, reagentId: ReagentId) {
    const groundPos = pos.clone();
    groundPos.y = 0;

    const group = new THREE.Group();
    group.position.copy(groundPos);
    group.position.y = 0.45;

    const col = new THREE.Color(REAGENTS[reagentId].color);
    const orb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.32, 0),
      new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 1.2,
        roughness: 0.2,
      })
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.03, 8, 16),
      new THREE.MeshBasicMaterial({ color: col })
    );
    ring.rotation.x = Math.PI / 2;
    group.add(orb, ring);
    this.worldContentGroup.add(group);

    this.lootDrops.push({
      id: `loot_${Date.now()}_${Math.random()}`,
      reagentId,
      mesh: group,
      position: groundPos,
      age: 0,
    });
  }

  public applyRemoteWorldEvent(ev: SharedWorldEventPayload) {
    if (
      this.mapMode !== 'labyrinth' ||
      this.labyrinthMultiplayerMode !== 'shared' ||
      ev.stage !== this.labyrinthStage
    ) {
      return;
    }

    if (ev.kind === 'harvest') {
      const node = this.harvestNodes.find((n) => n.id === ev.targetId);
      if (node && node.cooldown <= 0) {
        node.cooldown = HARVEST_NODE_RESPAWN_SEC;
        node.mesh.visible = false;
        this.spawnParticles(
          _v1.copy(node.position).setY(1.2),
          REAGENTS[node.reagentId].color,
          16,
          4.0
        );
      }
    } else if (ev.kind === 'floor_trap') {
      const trap = this.floorTraps.find((t) => t.id === ev.targetId);
      if (trap && !trap.triggered) {
        this.triggerFloorTrap(trap, true);
      }
    } else if (ev.kind === 'laser_trap') {
      const laser = this.laserTraps.find((l) => l.id === ev.targetId);
      if (laser && laser.cooldown <= 0) {
        this.triggerLaserBeamTrap(laser, true);
      }
    } else if (ev.kind === 'barrel_explode') {
      const prop = this.props.find((p) => p.id === ev.targetId);
      if (prop && prop.explodedTimer <= 0) {
        if (typeof ev.x === 'number' && typeof ev.z === 'number') {
          prop.mesh.position.set(ev.x, ev.y ?? 0, ev.z);
        }
        if (typeof ev.throwDamage === 'number') {
          prop.throwDamage = ev.throwDamage;
        }
        this.detonateExplosiveBarrel(prop, true);
      }
    } else if (ev.kind === 'prop_sync') {
      const prop = this.props.find((p) => p.id === ev.targetId);
      if (prop && this.heldProp !== prop) {
        if (typeof ev.x === 'number' && typeof ev.z === 'number') {
          prop.mesh.position.set(ev.x, ev.y ?? 0.6, ev.z);
        }
        if (
          typeof ev.vx === 'number' &&
          typeof ev.vy === 'number' &&
          typeof ev.vz === 'number'
        ) {
          prop.velocity.set(ev.vx, ev.vy, ev.vz);
        }
        prop.isHeld = Boolean(ev.isHeld);
        prop.isThrown = Boolean(ev.isThrown);
        if (typeof ev.throwDamage === 'number') {
          prop.throwDamage = ev.throwDamage;
        }
      }
    } else if (ev.kind === 'campfire_place') {
      if (!this.campfires.some((c) => c.id === ev.targetId)) {
        const pos = new THREE.Vector3(ev.x ?? 0, 0, ev.z ?? 0);
        this.placeCampfire(pos, ev.targetId, true);
      }
    } else if (ev.kind === 'campfire_light') {
      const cf = this.campfires.find((c) => c.id === ev.targetId);
      if (cf && !cf.isLit) {
        this.igniteCampfire(cf, true);
      }
    } else if (ev.kind === 'wall_place') {
      if (
        !this.builtWalls.some((w) => w.id === ev.targetId) &&
        typeof ev.x === 'number' &&
        typeof ev.z === 'number'
      ) {
        this.placeWoodenWall(new THREE.Vector3(ev.x, 0, ev.z), ev.rotY ?? 0, ev.targetId);
      }
    } else if (ev.kind === 'wall_dismantle') {
      const idx = this.builtWalls.findIndex((w) => w.id === ev.targetId);
      if (idx !== -1) {
        const [removed] = this.builtWalls.splice(idx, 1);
        this.worldContentGroup.remove(removed.mesh);
        this.spawnParticles(_v1.copy(removed.position).setY(1.1), 0xd97706, 20, 5.0);
        this.pushHudSnapshot();
      }
    } else if (ev.kind === 'rune_button') {
      this.activateRuneButton(ev.targetId, true);
    } else if (ev.kind === 'chest_open') {
      const chest = this.chests.find((c) => c.id === ev.targetId);
      if (chest && !chest.looted) {
        this.lootTreasureChest(chest, true);
      }
    }
  }

  /**
   * Respawns the local player at the stage entrance or last lit campfire WITHOUT resetting
   * shared enemies, chests, or player-built walls (used in Shared Co-op when allies are still alive).
   */
  public respawnInPlaceWithoutReset() {
    this.recomputeMaxVitals();
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    const lastCampfire = this.campfires[this.campfires.length - 1];
    if (lastCampfire) {
      this.playerPos.set(lastCampfire.position.x, 0, lastCampfire.position.z + 2.2);
    } else {
      this.playerPos.set(0, 0, 82);
    }
    this.playerVel.set(0, 0, 0);
    this.mode = 'playing';
    this.spawnParticles(_v1.copy(this.playerPos).setY(1.2), 0x22c55e, 28, 5.5);
    this.pushHudSnapshot();
  }

  private resolveLabyrinthCollisions(pos: THREE.Vector3, extraRadius = 0) {
    const walls = this.getActiveLabyrinthWalls();
    for (const box of walls) {
      const minX = box.minX - extraRadius;
      const maxX = box.maxX + extraRadius;
      const minZ = box.minZ - extraRadius;
      const maxZ = box.maxZ + extraRadius;
      if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ) {
        const dLeft = Math.abs(pos.x - minX);
        const dRight = Math.abs(maxX - pos.x);
        const dTop = Math.abs(pos.z - minZ);
        const dBottom = Math.abs(maxZ - pos.z);
        const min = Math.min(dLeft, dRight, dTop, dBottom);
        if (min === dLeft) pos.x = minX;
        else if (min === dRight) pos.x = maxX;
        else if (min === dTop) pos.z = minZ;
        else pos.z = maxZ;
      }
    }
  }

  private updateSimulation(dt: number) {
    // Decrement per-spell cooldowns (4s->3s standard, 30s for Heal & Growth, 120s for Campfire Teleport)
    for (const k of Object.keys(this.spellCooldowns) as SpellId[]) {
      if (this.spellCooldowns[k] > 0) {
        this.spellCooldowns[k] = Math.max(0, this.spellCooldowns[k] - dt);
      }
    }

    // Update Campfire Teleport [F] Channeling (3.0s quick / 2.0s voice / 2.2..1.5s drawn)
    if (this.campfireTeleportChannel) {
      if (this.campfires.length === 0) {
        this.campfireTeleportChannel = null;
      } else {
        this.campfireTeleportChannel.remainingSec = Math.max(
          0,
          this.campfireTeleportChannel.remainingSec - dt
        );
        if (Math.random() < 0.35) {
          this.spawnParticles(_v1.copy(this.playerPos).setY(0.9), 0xf97316, 4, 3.2);
        }
        if (this.campfireTeleportChannel.remainingSec <= 0) {
          const targetCf = this.campfires[this.campfires.length - 1];
          const cdToApply = this.campfireTeleportChannel.cdToApply;
          const qual = this.campfireTeleportChannel.qualityPercent;
          this.campfireTeleportChannel = null;
          this.spellCooldowns.campfire_teleport = cdToApply;

          this.detachLatchedLeechWormsOnTeleport();
          this.spawnParticles(_v2.copy(this.playerPos).setY(1.0), 0xf97316, 28, 7.0);
          this.playerPos.set(targetCf.position.x + 1.35, 0, targetCf.position.z + 1.35);
          if (this.mapMode === 'labyrinth') {
            this.resolveLabyrinthCollisions(this.playerPos);
          }
          this.camera.position.set(this.playerPos.x, 1.72, this.playerPos.z);
          this.spawnParticles(_v2.copy(this.playerPos).setY(1.0), 0xf97316, 36, 8.0);
          this.spawnParticles(_v2.copy(this.playerPos).setY(1.0), 0xfacc15, 22, 6.0);
          audioEngine.playPickupChime();
          this.callbacks.onQuestEvent('cast_teleport', 1);
          this.lastCastBanner = {
            spellName: `🏠 Вы вернулись Домой к Костру! (КД ${Math.round(cdToApply)}с)`,
            qualityPercent: qual,
            damage: 0,
            detail: '',
            color: '#f97316',
            timestamp: performance.now(),
          };
          this.pushHudSnapshot();
        }
      }
    }

    // Update Player-Built Wooden Walls (`Стена`: 2.0s construction animation!)
    for (const wall of this.builtWalls) {
      if (!wall.isBuilt) {
        wall.buildRemainingSec = Math.max(0, wall.buildRemainingSec - dt);
        const progress = THREE.MathUtils.clamp(
          1 - wall.buildRemainingSec / Math.max(0.1, wall.totalBuildSec),
          0.15,
          1.0
        );
        wall.bodyGroup.scale.set(1, progress, 1);
        if (Math.random() < 0.35) {
          this.spawnParticles(_v1.copy(wall.position).setY(progress * 2.2), 0xd97706, 3, 2.8);
        }
        if (wall.buildRemainingSec <= 0) {
          wall.isBuilt = true;
          wall.bodyGroup.scale.set(1, 1, 1);
          this.spawnParticles(_v1.copy(wall.position).setY(1.4), 0xfde047, 22, 5.2);
          audioEngine.playPickupChime();
          this.lastCastBanner = {
            spellName: `🧱 Стена построена! (${this.builtWalls.length}/${MAX_BUILT_WALLS})`,
            qualityPercent: 100,
            damage: 0,
            detail: '',
            color: '#fbbf24',
            timestamp: performance.now(),
          };
          this.pushHudSnapshot();
        }
      }
    }

    // Update Player Status Timers: Burn DoT (2s from Fire Demon Wall), Stun (1s from Stone Crusher Charge),
    // Lv6 Heal Regeneration (4s), and Lv6 Teleport Speed Surge (3s)
    if (this.playerBurnTimer > 0) {
      this.playerBurnTimer = Math.max(0, this.playerBurnTimer - dt);
      this.playerBurnTickAccum += dt;
      if (this.playerBurnTickAccum >= 0.5) {
        this.playerBurnTickAccum -= 0.5;
        if (!this.testInvulnerable) {
          this.tookDamageThisStage = true;
          this.hp = Math.max(1, this.hp - 2);
        }
        this.spawnParticles(_v1.copy(this.playerPos).setY(1.1), 0xf97316, 6, 3.0);
      }
    } else {
      this.playerBurnTickAccum = 0;
    }

    if (this.playerStunTimer > 0) {
      this.playerStunTimer = Math.max(0, this.playerStunTimer - dt);
    }

    if (this.playerFearTimer > 0) {
      this.playerFearTimer = Math.max(0, this.playerFearTimer - dt);
    }

    if (this.playerRegenTimer > 0) {
      this.playerRegenTimer = Math.max(0, this.playerRegenTimer - dt);
      this.hp = Math.min(this.maxHp, this.hp + 5.0 * dt);
      this.mp = Math.min(this.maxMp, this.mp + 5.0 * dt);
    }

    if (this.playerSpeedBuffTimer > 0) {
      this.playerSpeedBuffTimer = Math.max(0, this.playerSpeedBuffTimer - dt);
    }

    if (this.playerSlowTimer > 0) {
      this.playerSlowTimer = Math.max(0, this.playerSlowTimer - dt);
    }

    // Update Active Arcane Sword (`Магический Меч` [8]): duration, swing cooldown, 5s expiration warning sound, and slash animation!
    if (this.activeArcaneSword) {
      this.activeArcaneSword.remainingSec = Math.max(0, this.activeArcaneSword.remainingSec - dt);
      this.activeArcaneSword.swingCooldown = Math.max(0, this.activeArcaneSword.swingCooldown - dt);
      this.activeArcaneSword.swingAnimTimer = Math.max(0, this.activeArcaneSword.swingAnimTimer - dt);
      if (
        shouldTriggerArcaneSwordExpiringSound(
          this.activeArcaneSword.remainingSec,
          Boolean(this.activeArcaneSword.warningSoundPlayed)
        )
      ) {
        this.activeArcaneSword.warningSoundPlayed = true;
        audioEngine.playArcaneSwordExpiringSound();
      }
      if (this.activeArcaneSword.remainingSec <= 0) {
        this.dismissArcaneSword('⚔️ Время действия «Магического Меча» истекло');
      }
    }

    // Check Campfire Small-Radius Aura (`<= 4.2m`: +0.5 HP/s & +50% MP regen, or DOUBLED x2 when surrounded by >= 3 built walls!)
    let inLitCampfireAura = false;
    let activeCampfireSheltered = false;
    for (const cf of this.campfires) {
      const cfSheltered = isCampfireShelteredByWalls(cf.position, this.builtWalls);
      if (cf.isLit) {
        cf.animPhase += dt * 7.5;
        const flicker = 1 + Math.sin(cf.animPhase) * 0.14;
        cf.flameGroup.scale.set(1 + Math.cos(cf.animPhase * 0.7) * 0.08, flicker, 1);
        cf.flameGroup.rotation.y += dt * 1.8;
        cf.fireLight.intensity = (cfSheltered ? 2.9 : 2.2) + Math.sin(cf.animPhase * 1.3) * 0.35;
        (cf.auraRing.material as THREE.MeshBasicMaterial).color.setHex(
          cfSheltered ? 0x4ade80 : 0xf97316
        );

        const distToCampfire = Math.hypot(
          cf.position.x - this.playerPos.x,
          cf.position.z - this.playerPos.z
        );
        if (distToCampfire <= CAMPFIRE_HEAL_RADIUS) {
          inLitCampfireAura = true;
          if (cfSheltered) {
            activeCampfireSheltered = true;
          }
        }
      }
    }

    const campfireRegen = getCampfireEffectiveRegen(activeCampfireSheltered);
    if (inLitCampfireAura) {
      this.hp = Math.min(this.maxHp, this.hp + campfireRegen.hpRegenPerSec * dt);
    }

    // Update Active Cooked Rat/Boar/Bear Food Buff (+10..120 Max HP & +0.1..1.6 HP/s for 1..7 min)
    if (this.activeFoodBuff) {
      this.hp = Math.min(this.maxHp, this.hp + this.activeFoodBuff.hpRegenPerSec * dt);
      this.activeFoodBuff.remainingSec = Math.max(0, this.activeFoodBuff.remainingSec - dt);
      if (this.activeFoodBuff.remainingSec <= 0) {
        this.activeFoodBuff = null;
        this.recomputeMaxVitals();
      }
    }

    // Update Active Cooked Bat Food Buff (+10..70 Max MP & +0.1..0.8 MP/s for 1..6 min)
    let batMpRegenBonus = 0;
    if (this.activeBatFoodBuff) {
      batMpRegenBonus = this.activeBatFoodBuff.mpRegenPerSec || 0;
      this.activeBatFoodBuff.remainingSec = Math.max(0, this.activeBatFoodBuff.remainingSec - dt);
      if (this.activeBatFoodBuff.remainingSec <= 0) {
        this.activeBatFoodBuff = null;
        this.recomputeMaxVitals();
      }
    }

    // Wearable Artifact Bonuses (Gloves MP Regen +0.2..+1.0/s, Boots Move Speed +6..+22%)
    const artBonuses = getCombinedArtifactBonuses(this.equippedArtifacts);

    // Mana Regeneration (1.6 MP/sec base, +0.6 MP/sec if Cat Mursik is tamed, +batMpRegenBonus, +Gloves MP regen, x1.5 near campfire or x3.0 when campfire is surrounded by >= 3 walls!)
    const catBonus = this.activeTamedPet?.species === 'cat' ? 0.6 : 0;
    const baseMpRegen = 1.6 + catBonus + batMpRegenBonus + artBonuses.mpRegenBonus;
    const effectiveMpRegen = inLitCampfireAura
      ? baseMpRegen * campfireRegen.mpRegenMultiplier
      : baseMpRegen;
    this.mp = Math.min(this.maxMp, this.mp + dt * effectiveMpRegen);

    if (this.keysJustPressed.has('KeyE') && this.playerStunTimer <= 0 && this.playerFearTimer <= 0) {
      this.tryHarvestOrInteract();
    }
    this.keysJustPressed.clear();

    // Check if player is standing in a Stage 5 Mud Puddle (-50% move speed!)
    let inMudPuddle = false;
    for (let i = this.mudPuddles.length - 1; i >= 0; i--) {
      const puddle = this.mudPuddles[i];
      puddle.remainingSec -= dt;
      puddle.group.rotation.y += dt * 0.4;
      if (puddle.remainingSec <= 0) {
        this.worldContentGroup.remove(puddle.group);
        this.mudPuddles.splice(i, 1);
        continue;
      }
      const dPuddle = Math.hypot(
        this.playerPos.x - puddle.position.x,
        this.playerPos.z - puddle.position.z
      );
      if (dPuddle <= puddle.radius) {
        inMudPuddle = true;
      }
    }

    // Update Stage 5 Worm Boss Fire Pools (burns on floor for 4s, ignites player for 2s!)
    for (let i = this.firePools.length - 1; i >= 0; i--) {
      const pool = this.firePools[i];
      pool.remainingSec -= dt;
      pool.tickAccum += dt;
      pool.group.rotation.y += dt * 1.6;
      if (pool.remainingSec <= 0) {
        this.worldContentGroup.remove(pool.group);
        this.firePools.splice(i, 1);
        continue;
      }
      const dPool = Math.hypot(
        this.playerPos.x - pool.position.x,
        this.playerPos.z - pool.position.z
      );
      if (dPool <= pool.radius && this.mode === 'playing') {
        this.playerBurnTimer = Math.max(this.playerBurnTimer, WORM_FIRE_POOL_BURN_SEC);
        if (pool.tickAccum >= 0.9) {
          pool.tickAccum = 0;
          this.damagePlayer(pool.damagePerTick);
          this.spawnParticles(_v1.copy(this.playerPos).setY(0.9), 0xf97316, 12, 4.5);
          this.lastCastBanner = {
            spellName: `🔥 Огненная лужа Червя! -${pool.damagePerTick} ОЗ + горение ${WORM_FIRE_POOL_BURN_SEC}с!`,
            qualityPercent: 100,
            damage: pool.damagePerTick,
            detail: '',
            color: '#f97316',
            timestamp: performance.now(),
          };
        }
      }
    }

    // Update Stage 5 Skeleton Hammer Earthquake Lines (linear ground shockwave strip!)
    for (let i = this.earthquakeLines.length - 1; i >= 0; i--) {
      const eq = this.earthquakeLines[i];
      eq.remainingSec -= dt;
      if (eq.remainingSec <= 0) {
        this.worldContentGroup.remove(eq.group);
        this.earthquakeLines.splice(i, 1);
        continue;
      }
      if (!eq.hasHitPlayer && this.mode === 'playing') {
        const toPlayerX = this.playerPos.x - eq.origin.x;
        const toPlayerZ = this.playerPos.z - eq.origin.z;
        const forwardProj = toPlayerX * eq.direction.x + toPlayerZ * eq.direction.z;
        const lateralDist = Math.abs(toPlayerX * -eq.direction.z + toPlayerZ * eq.direction.x);
        if (forwardProj >= -0.4 && forwardProj <= eq.length && lateralDist <= eq.width * 0.58) {
          // Player-built walls and labyrinth walls block the earthquake shockwave!
          const blockedByWall = segmentHitsWall(
            eq.origin.x,
            eq.origin.z,
            this.playerPos.x,
            this.playerPos.z,
            this.getActiveLabyrinthWalls(),
            0.22
          );
          if (!blockedByWall) {
            eq.hasHitPlayer = true;
            this.damagePlayer(eq.damage);
            this.spawnParticles(_v1.copy(this.playerPos).setY(0.9), 0xf59e0b, 20, 6.0);
            this.lastCastBanner = {
              spellName: `🔨 Землетрясение молотом! -${eq.damage} ОЗ (полосой по земле)!`,
              qualityPercent: 100,
              damage: eq.damage,
              detail: '',
              color: '#f59e0b',
              timestamp: performance.now(),
            };
          }
        }
      }
    }

    // 1. Player First-Person WASD / Arrow Movement (disabled while stunned; forced backward for 1.5s during Cave Bear Fear Roar!)
    let moveZ = 0;
    let moveX = 0;
    if (this.playerFearTimer > 0) {
      // Cave Bear Fear Mechanic ("твой герой убегает назад 1.5 секунды. Типа механика страха"):
      moveZ = -1;
      moveX = 0;
    } else if (this.playerStunTimer <= 0) {
      if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) moveZ += 1;
      if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) moveZ -= 1;
      if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) moveX += 1;
      if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) moveX -= 1;

      if (this.keysHeld.has('KeyQ')) this.yaw += dt * 1.9;
      if (this.keysHeld.has('KeyT')) this.yaw -= dt * 1.9;
    }

    _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    _v1.set(0, 0, 0);
    if (moveZ !== 0 || moveX !== 0) {
      _v1.addScaledVector(_forward, moveZ).addScaledVector(_right, moveX).normalize();
    }

    const speedBuffMult = this.playerSpeedBuffTimer > 0 ? 1.25 : 1.0;
    const boarSlowMult = this.playerSlowTimer > 0 ? MUD_BALL_SLOW_FACTOR : 1.0;
    const mudPuddleMult = inMudPuddle ? MUD_PUDDLE_SLOW_FACTOR : 1.0;
    const bootsSpeedMult = 1 + artBonuses.moveSpeedBonusPercent / 100;
    const moveSpeed = 7.6 * speedBuffMult * boarSlowMult * mudPuddleMult * bootsSpeedMult;
    const damp = 1 - Math.exp(-12 * dt);
    this.playerVel.x = THREE.MathUtils.lerp(this.playerVel.x, _v1.x * moveSpeed, damp);
    this.playerVel.z = THREE.MathUtils.lerp(this.playerVel.z, _v1.z * moveSpeed, damp);

    this.playerPos.addScaledVector(this.playerVel, dt);

    if (this.mapMode === 'arena') {
      const radialDist = Math.hypot(this.playerPos.x, this.playerPos.z);
      if (radialDist > 36.5) {
        this.playerPos.x *= 36.5 / radialDist;
        this.playerPos.z *= 36.5 / radialDist;
      }
      if (this.builtWalls.length > 0) {
        this.resolveLabyrinthCollisions(this.playerPos);
      }
    } else {
      this.resolveLabyrinthCollisions(this.playerPos);

      // Check if player reached the Labyrinth Finish Portal!
      if (this.playerPos.distanceTo(this.labyrinthGoalPos) < 5.5 && this.mode === 'playing') {
        // Cannot enter the Portal until the Stage Boss is defeated! ("нельзя пройти в портал пока не убил главного босста уровня")
        if (!isStageBossDefeated(this.enemies, this.labyrinthStage)) {
          const pushBack = _v2.copy(this.playerPos).sub(this.labyrinthGoalPos);
          pushBack.y = 0;
          if (pushBack.lengthSq() < 0.01) pushBack.set(0, 0, 1);
          pushBack.normalize().multiplyScalar(6.0);
          this.playerPos.copy(this.labyrinthGoalPos).add(pushBack);
          this.lastCastBanner = {
            spellName: '🔒 Портал запечатан! Сначала победите главного Босса уровня!',
            qualityPercent: 100,
            damage: 0,
            detail: '',
            color: '#ef4444',
            timestamp: performance.now(),
          };
        } else if (this.labyrinthStage === 1) {
          if (!this.tookDamageThisStage) {
            this.callbacks.onQuestEvent('flawless_stage_clear', 1);
          }
          audioEngine.playVictoryFanfare();
          this.score += 500;
          this.bestScore = Math.max(this.bestScore, this.score);
          this.callbacks.onStageUnlocked?.(2);
          this.loadMapMode('labyrinth', 2, true);
          if (this.labyrinthMultiplayerMode === 'shared') {
            this.callbacks.onMultiplayerStageAdvance?.({
              stage: 2,
              victory: false,
              reset: false,
            });
          }
          this.callbacks.onLootCollected(
            'ice_dragon_scale',
            1,
            'Портал пройден! Уровень 2 Лабиринта открыт на аккаунте!'
          );
          return;
        } else if (this.labyrinthStage === 2) {
          if (!this.tookDamageThisStage) {
            this.callbacks.onQuestEvent('flawless_stage_clear', 1);
          }
          audioEngine.playVictoryFanfare();
          this.score += 800;
          this.bestScore = Math.max(this.bestScore, this.score);
          this.callbacks.onStageUnlocked?.(3);
          this.loadMapMode('labyrinth', 3, true);
          if (this.labyrinthMultiplayerMode === 'shared') {
            this.callbacks.onMultiplayerStageAdvance?.({
              stage: 3,
              victory: false,
              reset: false,
            });
          }
          this.callbacks.onLootCollected(
            'ice_dragon_scale',
            1,
            'Портал пройден! Уровень 3 Лабиринта открыт на аккаунте!'
          );
          return;
        } else if (this.labyrinthStage === 3) {
          if (!this.tookDamageThisStage) {
            this.callbacks.onQuestEvent('flawless_stage_clear', 1);
          }
          audioEngine.playVictoryFanfare();
          this.score += 1200;
          this.bestScore = Math.max(this.bestScore, this.score);
          this.callbacks.onStageUnlocked?.(4);
          this.loadMapMode('labyrinth', 4, true);
          if (this.labyrinthMultiplayerMode === 'shared') {
            this.callbacks.onMultiplayerStageAdvance?.({
              stage: 4,
              victory: false,
              reset: false,
            });
          }
          this.callbacks.onLootCollected(
            'fire_essence',
            1,
            'Портал пройден! Уровень 4: Лабиринт Стихий открыт на аккаунте!'
          );
          return;
        } else if (this.labyrinthStage === 4) {
          if (!this.tookDamageThisStage) {
            this.callbacks.onQuestEvent('flawless_stage_clear', 1);
          }
          audioEngine.playVictoryFanfare();
          this.score += 1800;
          this.bestScore = Math.max(this.bestScore, this.score);
          this.callbacks.onStageUnlocked?.(5);
          this.loadMapMode('labyrinth', 5, true);
          if (this.labyrinthMultiplayerMode === 'shared') {
            this.callbacks.onMultiplayerStageAdvance?.({
              stage: 5,
              victory: false,
              reset: false,
            });
          }
          this.callbacks.onLootCollected(
            'earth_essence',
            1,
            'Портал пройден! Уровень 5: Великие Катакомбы открыты на аккаунте!'
          );
          return;
        } else {
          if (!this.tookDamageThisStage) {
            this.callbacks.onQuestEvent('flawless_stage_clear', 1);
          }
          this.mode = 'gameover';
          this.score += 2500;
          this.bestScore = Math.max(this.bestScore, this.score);
          audioEngine.playVictoryFanfare();
          this.callbacks.onWormBossDefeated?.();
          if (this.labyrinthMultiplayerMode === 'shared') {
            this.callbacks.onMultiplayerStageAdvance?.({
              stage: 5,
              victory: true,
              reset: false,
            });
          }
          this.callbacks.onGameOver(true, {
            score: this.score,
            wave: this.labyrinthStage,
            enemiesDefeated: this.enemiesDefeated,
          });
          return;
        }
      }
    }

    const stepSpeed = Math.hypot(this.playerVel.x, this.playerVel.z);
    this.walkDistance += stepSpeed * dt;

    this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 2.2);
    const shake = this.cameraTrauma * this.cameraTrauma;
    const shakeYaw = (Math.random() - 0.5) * 0.06 * shake;
    const shakePitch = (Math.random() - 0.5) * 0.06 * shake;

    const bobY = Math.sin(this.walkDistance * 2.6) * 0.042 * Math.min(1, stepSpeed / 4);
    const bobX = Math.cos(this.walkDistance * 1.3) * 0.024 * Math.min(1, stepSpeed / 4);

    this.camera.position.set(this.playerPos.x + bobX, 1.72 + bobY, this.playerPos.z);
    this.camera.rotation.set(this.pitch + shakePitch, this.yaw + shakeYaw, 0, 'YXZ');

    // Animate First-Person Hands, Wand Rig, and Summoned Arcane Sword Slash (including Level 6 Dual-Wield Left Hand Sword)!
    this.castRecoil = Math.max(0, this.castRecoil - dt * 4.5);
    const swordSwingProgress =
      this.activeArcaneSword && this.activeArcaneSword.swingAnimTimer > 0
        ? Math.sin((1 - this.activeArcaneSword.swingAnimTimer / 0.28) * Math.PI)
        : 0;
    const isDualWieldSword = Boolean(this.activeArcaneSword?.dualWield);
    const activeSwingHand = this.activeArcaneSword?.swingHand ?? 'right';
    const rightSwingProgress =
      !isDualWieldSword || activeSwingHand === 'right' ? swordSwingProgress : 0;
    const leftSwingProgress =
      isDualWieldSword && activeSwingHand === 'left' ? swordSwingProgress : 0;
    const swordSwingDir = this.activeArcaneSword?.swingDir ?? 1;
    const rightDir = isDualWieldSword ? 1 : swordSwingDir;

    this.rightHandGroup.position.set(
      0.38 + this.gestureAimOffset.x * 0.22 + bobX * 0.5 + rightSwingProgress * rightDir * 0.26,
      -0.175 - this.gestureAimOffset.y * 0.22 + bobY * 0.5 + this.castRecoil * 0.06,
      -0.50 + this.castRecoil * 0.14 - rightSwingProgress * 0.16
    );
    this.rightHandGroup.rotation.set(
      0.26 + this.castRecoil * 0.45 - this.gestureAimOffset.y * 0.4 + rightSwingProgress * 0.52,
      -0.34 - this.gestureAimOffset.x * 0.4 - rightSwingProgress * rightDir * 0.95,
      0.28 - rightSwingProgress * rightDir * 0.75
    );
    if (isDualWieldSword) {
      this.leftHandGroup.position.set(
        -0.38 - bobX * 0.5 - leftSwingProgress * 0.26,
        -0.175 + bobY * 0.5,
        -0.50 - leftSwingProgress * 0.16
      );
      this.leftHandGroup.rotation.set(
        0.26 + leftSwingProgress * 0.52,
        0.34 + leftSwingProgress * 0.95,
        -0.28 + leftSwingProgress * 0.75
      );
    } else {
      this.leftHandGroup.position.set(
        -0.39 - bobX * 0.4,
        -0.19 + bobY * 0.4 + Math.sin(performance.now() * 0.003) * 0.01,
        -0.52 - (this.heldProp ? 0.08 : 0)
      );
      this.leftHandGroup.rotation.set(0.42, 0.42, -0.46);
    }

    // 2. Update Harvest Node Cooldowns (Disappeared trees/plants reappear after 60 seconds on the same spot!)
    for (const node of this.harvestNodes) {
      if (node.cooldown > 0) {
        node.cooldown = Math.max(0, node.cooldown - dt);
        if (node.cooldown <= 0 && !node.mesh.visible) {
          node.mesh.visible = true;
          node.mesh.scale.setScalar(1);
          this.spawnParticles(
            _v1.copy(node.position).setY(1.2),
            REAGENTS[node.reagentId].color,
            18,
            4.0
          );
        } else {
          node.mesh.visible = false;
        }
      } else {
        node.mesh.visible = true;
        node.mesh.scale.setScalar(1);
      }
    }

    // 2a. Animate Shallow Water Lakes & Update Summoned Elemental Ally (`Водяной Помощник` / `Боевой Снеговик`)
    for (const lake of this.waterLakes) {
      lake.animPhase += dt * 1.8;
      const pulse1 = 0.35 + ((lake.animPhase * 0.25) % 0.6);
      const pulse2 = 0.35 + (((lake.animPhase * 0.25) + 0.3) % 0.6);
      lake.rippleRing1.scale.set(lake.spec.radiusX * pulse1, 1, lake.spec.radiusZ * pulse1);
      lake.rippleRing2.scale.set(lake.spec.radiusX * pulse2, 1, lake.spec.radiusZ * pulse2);
    }

    if (this.playerCombatEngageTimer > 0) {
      this.playerCombatEngageTimer = Math.max(0, this.playerCombatEngageTimer - dt);
    }

    if (this.activeElementalAlly) {
      const ally = this.activeElementalAlly;
      ally.animPhase += dt * 4.0;
      ally.remainingSec = Math.max(0, ally.remainingSec - dt);

      if (ally.remainingSec <= 0) {
        this.spawnParticles(
          _v1.copy(ally.position).setY(1.0),
          ally.kind === 'water_spirit' ? 0x0ea5e9 : 0xe0f2fe,
          24,
          5.0
        );
        this.worldContentGroup.remove(ally.mesh);
        this.activeElementalAlly = null;
      } else {
        // Position the Elemental Ally in front and to the LEFT of the player (3.4m forward, 2.25m left),
        // mirroring the Cat on the right (3.4m forward, 2.25m right) so it is always visible and never inside the player!
        _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
        _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

        const leftFollowSpot = _v3
          .copy(this.playerPos)
          .addScaledVector(_forward, 3.4)
          .addScaledVector(_right, -2.25);
        leftFollowSpot.y = 0;

        const isSnowmanMelee = ally.kind === 'snowman';
        const nearestEnemy =
          this.playerCombatEngageTimer > 0
            ? this.findNearestAliveEnemy(ally.position, 22, !isSnowmanMelee)
            : this.findNearestAliveEnemy(this.playerPos, 15, !isSnowmanMelee);

        if (nearestEnemy && (this.playerCombatEngageTimer > 0 || nearestEnemy.state !== 'idle')) {
          if (isSnowmanMelee) {
            // Snowman fights strictly in MELEE and deals higher damage!
            const toEnemy = _v2.copy(nearestEnemy.position).sub(ally.position);
            toEnemy.y = 0;
            const dist = toEnemy.length();
            if (dist > 0.01) {
              toEnemy.normalize();
              ally.mesh.rotation.y = Math.atan2(toEnemy.x, toEnemy.z) + Math.PI;
            }
            if (dist > 2.15) {
              ally.position.addScaledVector(toEnemy, 6.2 * dt);
            }
            ally.attackCooldown -= dt;
            if (ally.attackCooldown <= 0 && dist <= 2.75) {
              ally.attackCooldown = ally.attackInterval;
              const knock = toEnemy.clone().multiplyScalar(8);
              nearestEnemy.freezeTimer = Math.max(nearestEnemy.freezeTimer, 2.2);
              this.spawnParticles(
                _v1.copy(nearestEnemy.position).setY(1.2),
                0xe0f2fe,
                18,
                6.0
              );
              this.damageEnemy(nearestEnemy, ally.attackDamage, knock, 0x38bdf8, false, 'glacius', true);
            }
          } else {
            // Water Helper stays on the left front flank and shoots ranged water balls
            ally.position.lerp(leftFollowSpot, 1 - Math.exp(-5.0 * dt));

            const dirToEnemy = new THREE.Vector3()
              .copy(nearestEnemy.position)
              .sub(ally.position);
            dirToEnemy.y = 0;
            if (dirToEnemy.lengthSq() > 0.01) {
              dirToEnemy.normalize();
              ally.mesh.rotation.y = Math.atan2(dirToEnemy.x, dirToEnemy.z) + Math.PI;
            }

            ally.attackCooldown -= dt;
            if (ally.attackCooldown <= 0) {
              ally.attackCooldown = ally.attackInterval;
              const shotOrigin = _v1.copy(ally.position).setY(1.35);
              const targetCenter = new THREE.Vector3(
                nearestEnemy.position.x,
                nearestEnemy.isFlying ? nearestEnemy.position.y + 0.45 : 1.15,
                nearestEnemy.position.z
              );
              const shotDir = targetCenter.sub(shotOrigin).normalize();
              this.spawnSpellProjectile({
                spellId: 'glacius',
                casterId: 'local',
                origin: shotOrigin,
                direction: shotDir,
                damage: ally.attackDamage,
                qualityPercent: 85,
                colorHex: 0x0ea5e9,
                isPetAttack: true,
              });
            }
          }
        } else {
          // Walk visibly on the left side in front of the player (mirroring Cat on the right)
          ally.position.lerp(leftFollowSpot, 1 - Math.exp(-6.0 * dt));
          ally.mesh.rotation.y = this.yaw;
        }

        // Enforce strict minimum distance from player body (2.4m) so ally NEVER sits inside the player!
        if (ally.position.distanceTo(this.playerPos) < 2.4) {
          ally.position.copy(leftFollowSpot);
        }

        if (this.mapMode === 'labyrinth') {
          this.resolveLabyrinthCollisions(ally.position);
        }
        ally.mesh.position.copy(ally.position);
        ally.mesh.position.y = Math.abs(Math.sin(ally.animPhase * 0.7)) * 0.08;
      }
    }

    for (let i = this.lootDrops.length - 1; i >= 0; i--) {
      const drop = this.lootDrops[i];
      drop.age += dt;
      drop.mesh.rotation.y += dt * 2.4;
      drop.mesh.position.y = 0.45 + Math.sin(drop.age * 4) * 0.12;
      if (drop.position.distanceTo(this.playerPos) < 2.6) {
        this.worldContentGroup.remove(drop.mesh);
        this.lootDrops.splice(i, 1);
        audioEngine.playPickupChime();
        this.callbacks.onLootCollected(drop.reagentId, 1, `Подобран лут: ${REAGENTS[drop.reagentId].name}`);
      }
    }

    // 2b. Update Explosive Floor Traps & Check if Player Stepped on One (-30 HP!)
    for (const trap of this.floorTraps) {
      if (!trap.triggered) {
        trap.animPhase += dt * 4.2;
        trap.runeRing.rotation.y += dt * 1.4;
        trap.coreCrystal.position.y = 0.22 + Math.sin(trap.animPhase) * 0.05;
        trap.coreCrystal.rotation.y += dt * 2.5;

        const distToTrap = Math.hypot(
          trap.position.x - this.playerPos.x,
          trap.position.z - this.playerPos.z
        );
        if (distToTrap < trap.radius && this.mode === 'playing') {
          this.triggerFloorTrap(trap);
        }
      } else if (trap.explosionTimer > 0) {
        trap.explosionTimer = Math.max(0, trap.explosionTimer - dt);
        const progress = 1 - trap.explosionTimer / 0.42;
        trap.shockwaveMesh.scale.setScalar(0.5 + progress * 3.2);
        const mat = trap.shockwaveMesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, (1 - progress) * 0.85);
        if (trap.explosionTimer <= 0) {
          trap.shockwaveMesh.visible = false;
        }
      }
    }

    // 2c. Update Stage 2 & Stage 3 Full-Width Blue Laser Beam Traps (45 damage, disappears for 60s, bypassable via Teleport [Ё]!)
    for (const laser of this.laserTraps) {
      if (laser.cooldown > 0) {
        laser.cooldown = Math.max(0, laser.cooldown - dt);
        if (laser.cooldown <= 0 && !laser.beamGroup.visible) {
          laser.beamGroup.visible = true;
          this.spawnParticles(_v1.copy(laser.position).setY(0.9), 0x38bdf8, 22, 5.0);
        } else {
          laser.beamGroup.visible = false;
        }
      } else {
        laser.beamGroup.visible = true;
        laser.animPhase += dt * 7.5;
        const scalePulse = 1 + Math.sin(laser.animPhase) * 0.14;
        laser.beamGroup.scale.set(1, scalePulse, scalePulse);

        if (this.mode === 'playing') {
          const halfSpan = laser.spec.span / 2 + 0.45;
          const beamThickness = 0.92;
          const hit =
            laser.spec.axis === 'x'
              ? Math.abs(this.playerPos.z - laser.spec.z) < beamThickness &&
                Math.abs(this.playerPos.x - laser.spec.x) <= halfSpan
              : Math.abs(this.playerPos.x - laser.spec.x) < beamThickness &&
                Math.abs(this.playerPos.z - laser.spec.z) <= halfSpan;
          if (hit) {
            this.triggerLaserBeamTrap(laser);
          }
        }
      }
    }

    // 2d. Animate Elemental Rune Buttons & Slide Apart Unlocked Solid Gates!
    for (const btn of this.runeButtons) {
      btn.animPhase += dt * 3.2;
      btn.crystalMesh.rotation.y += dt * 2.2;
      if (btn.spec.mount === 'floor') {
        btn.crystalMesh.position.y = 0.72 + Math.sin(btn.animPhase) * 0.08;
      }
    }
    for (const gate of this.runeGates) {
      if (gate.isOpen && gate.openingProgress < 1) {
        gate.openingProgress = Math.min(1, gate.openingProgress + dt * 0.65);
        const slideOffset = gate.openingProgress * (gate.spec.w * 0.56);
        gate.leftDoor.position.x = -slideOffset;
        gate.rightDoor.position.x = slideOffset;
        if (gate.openingProgress > 0.72) {
          const fadeScale = Math.max(0.01, 1 - (gate.openingProgress - 0.72) / 0.28);
          gate.leftDoor.scale.set(fadeScale, fadeScale, fadeScale);
          gate.rightDoor.scale.set(fadeScale, fadeScale, fadeScale);
        }
        if (gate.openingProgress >= 1) {
          gate.mesh.visible = false;
        }
      }
    }

    // 2e. Update Enshrouded-Style Sequential Wave Spike Trap Zones (Stage 2+, 30 damage per hit!)
    for (const zone of this.spikeTrapZones) {
      zone.elapsedTime += dt;
      if (zone.hitCooldown > 0) {
        zone.hitCooldown = Math.max(0, zone.hitCooldown - dt);
      }
      const lineCount = zone.spec.lineCount;
      for (let i = 0; i < lineCount; i++) {
        const waveState = evaluateSpikeLineWaveState(zone.elapsedTime, i, lineCount);
        const spikeGroup = zone.lineGroups[i];
        const warningMat = zone.lineWarnStrips[i].material as THREE.MeshBasicMaterial;

        // Spikes sit retracted underground (-1.22m) and thrust up to +0.0m when extended
        spikeGroup.position.y = -1.22 + waveState.extension * 1.22;
        if (waveState.isHazardActive) {
          warningMat.color.setHex(0xef4444);
          warningMat.opacity = 0.85;
        } else if (waveState.isWarning) {
          warningMat.color.setHex(0xf59e0b);
          warningMat.opacity = 0.65;
        } else {
          warningMat.color.setHex(0x64748b);
          warningMat.opacity = 0.22;
        }

        if (
          this.mode === 'playing' &&
          waveState.isHazardActive &&
          waveState.extension >= 0.82 &&
          zone.hitCooldown <= 0
        ) {
          const inLine = isPlayerTouchingSpikeLine(
            zone.spec,
            i,
            this.playerPos.x,
            this.playerPos.y,
            this.playerPos.z
          );

          if (inLine) {
            zone.hitCooldown = 0.85;
            this.damagePlayer(zone.spec.damage);
            this.spawnParticles(_v1.copy(this.playerPos).setY(0.8), 0xef4444, 24, 6.5);
            this.lastCastBanner = {
              spellName: `🗡️ Ловушка Шипы! (-${zone.spec.damage} ОЗ — ловите тайминг волны!)`,
              qualityPercent: 100,
              damage: zone.spec.damage,
              detail: '',
              color: '#ef4444',
              timestamp: performance.now(),
            };
          }
        }
      }
    }

    // 2f. Animate Treasure Chests (glow ring rotation & smooth lid opening)
    for (const chest of this.chests) {
      if (!chest.opened) {
        chest.glowRing.rotation.z += dt * 1.5;
      } else if (chest.openAnimProgress < 1) {
        chest.openAnimProgress = Math.min(1, chest.openAnimProgress + dt * 2.6);
        chest.lidPivot.rotation.x = -chest.openAnimProgress * Math.PI * 0.62;
      }
    }

    // 3. Update Physics Props & Transfigured Golems (Ground golems cannot target flying enemies!)
    for (const prop of this.props) {
      if (prop.isHeld && this.heldProp === prop) {
        this.camera.getWorldDirection(_forward);
        _v2.copy(this.camera.position).addScaledVector(_forward, 2.35);
        _v2.y = Math.max(0.8, _v2.y - 0.2);
        prop.mesh.position.lerp(_v2, 1 - Math.exp(-15 * dt));
        prop.mesh.rotation.y += dt * 2.2;
      } else if (prop.isPet) {
        prop.petDuration -= dt;
        const s = THREE.MathUtils.lerp(prop.mesh.scale.x, prop.petScale, 1 - Math.exp(-6 * dt));
        prop.mesh.scale.setScalar(s);
        prop.mesh.rotation.y += dt * 3.2;

        const nearestEnemy = this.findNearestAliveEnemy(prop.mesh.position, 22, false);
        if (nearestEnemy) {
          _v2.copy(nearestEnemy.position).sub(prop.mesh.position);
          _v2.y = 0;
          const dist = _v2.length();
          if (dist > 2.2) {
            _v2.normalize();
            prop.mesh.position.addScaledVector(_v2, 6.2 * dt);
          }
          prop.petAttackTimer -= dt;
          if (prop.petAttackTimer <= 0 && dist < 12) {
            prop.petAttackTimer = 1.25;
            _v3.copy(nearestEnemy.position).sub(prop.mesh.position).normalize();
            this.spawnSpellProjectile({
              spellId: 'vera_verto',
              casterId: 'local',
              origin: _v1.copy(prop.mesh.position).setY(1.1),
              direction: _v3,
              damage: Math.round(14 * prop.petScale),
              qualityPercent: 85,
              colorHex: 0xa855f7,
              isPetAttack: true,
            });
          }
        }

        if (prop.petDuration <= 0) {
          prop.isPet = false;
          prop.petScale = 1;
          prop.mesh.scale.setScalar(1);
          prop.mesh.position.y = 0;
        }
      } else {
        if (prop.explodedTimer > 0) {
          prop.explodedTimer = Math.max(0, prop.explodedTimer - dt);
          if (prop.explodedTimer <= 0) {
            prop.mesh.position.copy(prop.homePosition);
            prop.mesh.visible = true;
          }
          continue;
        }

        if (prop.mesh.position.y > 0 || prop.velocity.lengthSq() > 0.01) {
          const prevX = prop.mesh.position.x;
          const prevZ = prop.mesh.position.z;
          prop.velocity.y -= 18 * dt;
          prop.mesh.position.addScaledVector(prop.velocity, dt);

          // Check if thrown red barrel hit a labyrinth wall
          if (
            prop.isThrown &&
            prop.kind === 'barrel' &&
            this.mapMode === 'labyrinth' &&
            segmentHitsWall(prevX, prevZ, prop.mesh.position.x, prop.mesh.position.z, this.labyrinthWalls, 0.45)
          ) {
            this.detonateExplosiveBarrel(prop);
            continue;
          }

          if (prop.mesh.position.y <= 0) {
            prop.mesh.position.y = 0;
            if (prop.isThrown && prop.kind === 'barrel') {
              this.detonateExplosiveBarrel(prop);
              continue;
            }
            prop.velocity.y = 0;
            prop.velocity.multiplyScalar(0.82);
            if (prop.velocity.length() < 0.8) {
              prop.velocity.set(0, 0, 0);
              prop.isThrown = false;
            }
          }
        }

        if (prop.isThrown) {
          for (const enemy of this.enemies) {
            if (enemy.state === 'ko') continue;
            if (enemy.position.distanceTo(prop.mesh.position) < 2.15) {
              if (prop.kind === 'barrel') {
                this.detonateExplosiveBarrel(prop);
              } else {
                this.damageEnemy(
                  enemy,
                  prop.throwDamage,
                  prop.velocity.clone().normalize().multiplyScalar(10),
                  0x38bdf8
                );
                prop.isThrown = false;
                prop.velocity.multiplyScalar(0.25);
              }
              break;
            }
          }
        }
      }
    }

    // 4. Update Tameable Animals & Chosen Active Pet Companion
    for (const animal of this.animals) {
      animal.animPhase += dt * 4.5;

      // Update 10-second Engorgio ("Рост") temporary buff timer
      if (animal.engorgioTimer > 0) {
        const prevSec = Math.ceil(animal.engorgioTimer);
        animal.engorgioTimer = Math.max(0, animal.engorgioTimer - dt);
        const nextSec = Math.ceil(animal.engorgioTimer);
        if (animal.engorgioTimer <= 0) {
          animal.targetScale = animal.baseScale;
          animal.attackPower = animal.baseAttack;
          this.updatePetBadge(animal);
        } else if (nextSec !== prevSec) {
          this.updatePetBadge(animal);
        }
      }

      const currScale = THREE.MathUtils.lerp(
        animal.mesh.scale.x,
        animal.targetScale,
        1 - Math.exp(-5 * dt)
      );
      animal.mesh.scale.setScalar(currScale);
      animal.scaleMultiplier = currScale;

      if (animal.tailOrWingPart) {
        if (animal.species === 'owl') {
          animal.tailOrWingPart.scale.y = 1 + Math.sin(animal.animPhase * 2) * 0.25;
        } else {
          animal.tailOrWingPart.rotation.z = Math.sin(animal.animPhase) * 0.35;
        }
      }

      if (animal.isTamed && this.activeTamedPet === animal) {
        // Position the pet further to the RIGHT (3.4m forward + 2.25m right) so the center combat line of sight is completely clear!
        _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
        _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

        const frontFollowSpot = _v3
          .copy(this.playerPos)
          .addScaledVector(_forward, 3.4)
          .addScaledVector(_right, 2.25);
        frontFollowSpot.y = 0;

        // Ground melee/companion pets (cat, fox, salamander) CANNOT attack flying enemies!
        const canHitFlying = animal.species === 'owl';
        const nearestEnemy = this.findNearestAliveEnemy(animal.position, 16, canHitFlying);
        if (nearestEnemy) {
          _v2.copy(nearestEnemy.position).sub(animal.position);
          _v2.y = 0;
          const dist = _v2.length();
          if (dist > 2.8) {
            _v2.normalize();
            animal.position.addScaledVector(_v2, 5.2 * dt);
            animal.mesh.rotation.y = Math.atan2(_v2.x, _v2.z) + Math.PI;
          }
          animal.attackCooldown -= dt;
          if (animal.attackCooldown <= 0 && dist < 12) {
            const def = PET_CATALOG[animal.species];
            animal.attackCooldown = def.attackInterval;
            const originPos = _v1.copy(animal.position).setY(animal.species === 'owl' ? 1.5 : 0.9);
            const targetAimPos = new THREE.Vector3(
              nearestEnemy.position.x,
              nearestEnemy.isFlying ? nearestEnemy.position.y + 0.45 : 1.0,
              nearestEnemy.position.z
            );
            _v2.copy(targetAimPos).sub(originPos).normalize();
            this.spawnSpellProjectile({
              spellId: animal.species === 'fox' ? 'glacius' : 'incendio',
              casterId: 'local',
              origin: originPos,
              direction: _v2,
              damage: animal.attackPower,
              qualityPercent: animal.engorgioTimer > 0 ? 95 : 65,
              colorHex: def.primaryColor,
              isPetAttack: true,
            });
          }
        } else {
          animal.position.lerp(frontFollowSpot, 1 - Math.exp(-6.0 * dt));
          animal.mesh.rotation.y = this.yaw;
        }

        // Enforce strict minimum distance from player body (2.4m) so pet NEVER clips into the camera!
        const distFromPlayer = animal.position.distanceTo(this.playerPos);
        if (distFromPlayer < 2.4) {
          animal.position.copy(frontFollowSpot);
        }

        if (this.mapMode === 'labyrinth') {
          this.resolveLabyrinthCollisions(animal.position);
        }
        animal.mesh.position.copy(animal.position);
      } else {
        // Peaceful idle bob at sanctuary spot
        animal.mesh.position.y = Math.abs(Math.sin(animal.animPhase * 0.5)) * 0.06;
      }
    }

    // 2e. Update Stage 4 Water Monster / Boss 4 Ice Rain AoE Zones (1s Red Warning Circle -> 5s Falling Ice Rain ticking every 1s!)
    for (let i = this.iceRainZones.length - 1; i >= 0; i--) {
      const zone = this.iceRainZones[i];
      if (zone.telegraphTimer > 0) {
        zone.telegraphTimer = Math.max(0, zone.telegraphTimer - dt);
        const pulse = 0.92 + Math.sin(performance.now() * 0.025) * 0.08;
        zone.warningRing.scale.setScalar(pulse);
        if (zone.telegraphTimer <= 0) {
          (zone.warningRing.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
          (zone.fillDisc.material as THREE.MeshBasicMaterial).color.setHex(0x0ea5e9);
          (zone.fillDisc.material as THREE.MeshBasicMaterial).opacity = 0.35;
          zone.rainGroup.visible = true;
          this.spawnParticles(_v1.copy(zone.position).setY(1.8), 0x38bdf8, 22, 6.0);
        }
      } else {
        zone.activeTimer -= dt;
        zone.rainGroup.rotation.y += dt * 2.5;
        for (const child of zone.rainGroup.children) {
          child.position.y -= dt * 7.5;
          if (child.position.y < 0.25) {
            child.position.y = 3.8;
          }
        }
        zone.tickAccum += dt;
        if (zone.tickAccum >= 1.0) {
          zone.tickAccum -= 1.0;
          this.spawnParticles(_v1.copy(zone.position).setY(1.2), 0x7dd3fc, 12, 4.5);
          const distToPlayer = Math.hypot(
            this.playerPos.x - zone.position.x,
            this.playerPos.z - zone.position.z
          );
          if (distToPlayer <= zone.radius && this.mode === 'playing') {
            this.damagePlayer(zone.damagePerTick);
            this.lastCastBanner = {
              spellName: `❄️ Ледяной дождь! -${zone.damagePerTick} ОЗ (выйдите из круга!)`,
              qualityPercent: 100,
              damage: zone.damagePerTick,
              detail: '',
              color: '#38bdf8',
              timestamp: performance.now(),
            };
          }
        }
        if (zone.activeTimer <= 0) {
          this.worldContentGroup.remove(zone.group);
          this.iceRainZones.splice(i, 1);
        }
      }
    }

    // 2f. Update Snow Giant (`frost_charger`) Ice Wind Pull Zones (`Ледяной Ветер`: 1s Blue Circle Warning -> 3s Icy Wind pulling player toward Snow Giant!)
    for (let i = this.frostWindZones.length - 1; i >= 0; i--) {
      const zone = this.frostWindZones[i];
      // Track live Snow Giant position if still alive
      const caster = this.enemies.find((e) => e.id === zone.casterEnemyId && e.state !== 'ko');
      if (caster) {
        zone.casterPos.copy(caster.position);
      }
      const pullVec = _v2.set(
        zone.casterPos.x - zone.position.x,
        0,
        zone.casterPos.z - zone.position.z
      );
      if (pullVec.lengthSq() > 0.01) {
        zone.windStreamGroup.rotation.y = Math.atan2(pullVec.x, pullVec.z);
      }

      if (zone.telegraphTimer > 0) {
        zone.telegraphTimer = Math.max(0, zone.telegraphTimer - dt);
        const pulse = 0.92 + Math.sin(performance.now() * 0.028) * 0.09;
        zone.blueRing.scale.setScalar(pulse);
        if (zone.telegraphTimer <= 0) {
          (zone.fillDisc.material as THREE.MeshBasicMaterial).opacity = 0.38;
          zone.windStreamGroup.visible = true;
          this.spawnParticles(_v1.copy(zone.position).setY(1.1), 0x38bdf8, 22, 6.0);
        }
      } else {
        zone.activeTimer -= dt;
        zone.bannerCooldown = Math.max(0, zone.bannerCooldown - dt);
        for (const child of zone.windStreamGroup.children) {
          child.position.z += dt * 7.5;
          if (child.position.z > 2.2) {
            child.position.z = -2.2;
          }
        }
        if (Math.random() < 0.45) {
          this.spawnParticles(_v1.copy(zone.position).setY(0.9), 0x7dd3fc, 3, 4.5);
        }

        const distToZone = Math.hypot(
          this.playerPos.x - zone.position.x,
          this.playerPos.z - zone.position.z
        );
        if (distToZone <= zone.radius && this.mode === 'playing') {
          const toGiant = _v3.set(
            zone.casterPos.x - this.playerPos.x,
            0,
            zone.casterPos.z - this.playerPos.z
          );
          const distToGiant = toGiant.length();
          // Player-built walls and labyrinth walls block the Snow Giant's icy wind pull!
          const windBlockedByWall = segmentHitsWall(
            this.playerPos.x,
            this.playerPos.z,
            zone.casterPos.x,
            zone.casterPos.z,
            this.getActiveLabyrinthWalls(),
            0.22
          );
          if (distToGiant > 1.85 && !windBlockedByWall) {
            toGiant.normalize();
            this.playerPos.addScaledVector(toGiant, FROST_WIND_PULL_SPEED * dt);
            this.resolveLabyrinthCollisions(this.playerPos);
            this.camera.position.set(this.playerPos.x, 1.72, this.playerPos.z);
          }
          if (zone.bannerCooldown <= 0) {
            zone.bannerCooldown = 1.2;
            this.lastCastBanner = {
              spellName: `🌬️❄️ Ледяной ветер тянет к Снежному Гиганту! (Выйдите из синего круга или [Ё] Прыжок)`,
              qualityPercent: 100,
              damage: 0,
              detail: '',
              color: '#38bdf8',
              timestamp: performance.now(),
            };
          }
        }

        if (zone.activeTimer <= 0) {
          this.worldContentGroup.remove(zone.group);
          this.frostWindZones.splice(i, 1);
        }
      }
    }

    // 5. Update Enemies (including Flying Gargoyles, Storm Harpies, Stage 4 Elemental Mobs, Stage 1-4 Bosses, and Allied Shooting Totems)
    let activeAttackers = 0;
    const maxConcurrentAttackers = 3;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.animPhase += dt * (enemy.isFlying ? 7.5 : 4.2);

      // Articulated 3D model animation (wings flapping, tail/weapon sway, rotating arcane halos)
      if (enemy.animParts.leftWing && enemy.animParts.rightWing) {
        const flap = Math.sin(enemy.animPhase) * 0.48;
        enemy.animParts.leftWing.rotation.z = 0.25 + flap;
        enemy.animParts.rightWing.rotation.z = -0.25 - flap;
      }
      if (enemy.animParts.weaponOrTail) {
        enemy.animParts.weaponOrTail.rotation.z = Math.sin(enemy.animPhase * 0.8) * 0.22;
      }
      if (enemy.animParts.haloOrCore) {
        if (enemy.archetype === 'skeleton_hammer_shield') {
          // Round wooden shield stays oriented on the left arm and braces forward during Shield Guard!
          const guardBlend = enemy.shieldGuardActive ? 1 : 0;
          enemy.animParts.haloOrCore.position.x = THREE.MathUtils.lerp(0.58, 0.2, guardBlend);
          enemy.animParts.haloOrCore.position.z = THREE.MathUtils.lerp(0.44, 0.62, guardBlend);
          enemy.animParts.haloOrCore.rotation.y = THREE.MathUtils.lerp(-0.28, -0.04, guardBlend);
          enemy.animParts.haloOrCore.rotation.z = Math.sin(enemy.animPhase * 0.7) * 0.08;
        } else {
          enemy.animParts.haloOrCore.rotation.z += dt * 1.8;
          enemy.animParts.haloOrCore.rotation.y += dt * 1.4;
        }
      }

      if (enemy.hitFlashTimer > 0) {
        enemy.hitFlashTimer = Math.max(0, enemy.hitFlashTimer - dt);
      }

      if (enemy.state === 'ko') {
        enemy.koTimer -= dt;
        if (enemy.chargeTrajectoryLine) {
          enemy.chargeTrajectoryLine.visible = false;
        }
        if (enemy.burrowWarningRing) {
          enemy.burrowWarningRing.visible = false;
        }
        enemy.mesh.rotation.x = THREE.MathUtils.lerp(
          enemy.mesh.rotation.x,
          -Math.PI / 2,
          1 - Math.exp(-10 * dt)
        );
        enemy.position.y = Math.max(0, enemy.position.y - dt * 6.5);
        enemy.mesh.position.y = enemy.position.y;
        enemy.mesh.scale.multiplyScalar(Math.max(0.1, 1 - dt * 1.8));
        if (enemy.koTimer <= 0) {
          if (enemy.burrowWarningRing) {
            this.worldContentGroup.remove(enemy.burrowWarningRing);
          }
          this.worldContentGroup.remove(enemy.mesh);
          this.enemies.splice(i, 1);
        }
        continue;
      }

      // Enemy Burn DoT (from Level 6 Incendio or Lv4+ Arcane Sword: 3 seconds of burning fire!)
      if (enemy.burnTimer > 0) {
        enemy.burnTimer = Math.max(0, enemy.burnTimer - dt);
        enemy.burnTickAccum += dt;
        if (enemy.burnTickAccum >= 1.0) {
          enemy.burnTickAccum -= 1.0;
          this.damageEnemy(enemy, 14, new THREE.Vector3(), 0xf97316, false, 'incendio');
          if ((enemy.state as string) === 'ko') continue;
        }
      } else {
        enemy.burnTickAccum = 0;
      }

      // Stage 3 Boss ("БОСС 3: Повелитель Хронос") Enrage at <= 50% HP:
      // Grows larger in size (1.38x), shoots 30% more frequently, and fires 5 orbs!
      if (
        enemy.archetype === 'boss_mage_3' &&
        !enemy.enragedPhase2 &&
        enemy.hp <= enemy.maxHp * 0.5
      ) {
        enemy.enragedPhase2 = true;
        enemy.mesh.scale.setScalar(1.38);
        this.spawnParticles(_v1.copy(enemy.position).setY(2.2), 0xef4444, 38, 8.5);
        audioEngine.playHeavyImpact(true);
        this.lastCastBanner = {
          spellName: '⚡ Повелитель Хронос в ярости (50% ОЗ): гигантский размер, атака +30% быстрее, 5 шаров!',
          qualityPercent: 100,
          damage: 0,
          detail: '',
          color: '#ef4444',
          timestamp: performance.now(),
        };
      }

      // Stage 4 Boss ("БОСС 4: Элементаль Трёх Стихий") Phase 2 at <= 50% HP:
      // Rises into the air and becomes a FLYING Boss for the rest of the battle!
      if (
        enemy.archetype === 'boss_elemental_4' &&
        !enemy.enragedPhase2 &&
        enemy.hp <= enemy.maxHp * 0.5
      ) {
        enemy.enragedPhase2 = true;
        enemy.isFlying = true;
        enemy.flyHeight = 3.6;
        this.spawnParticles(_v1.copy(enemy.position).setY(2.5), 0xfacc15, 42, 9.0);
        this.spawnParticles(_v1.copy(enemy.position).setY(2.5), 0x38bdf8, 32, 7.5);
        audioEngine.playHeavyImpact(true);
        this.lastCastBanner = {
          spellName: '🌪️ Элементаль Трёх Стихий взмыл в небо (50% ОЗ — теперь летающий)!',
          qualityPercent: 100,
          damage: 0,
          detail: '',
          color: '#facc15',
          timestamp: performance.now(),
        };
      }

      if (enemy.stunTimer > 0) {
        enemy.stunTimer -= dt;
        enemy.chargeWindupTimer = 0;
        enemy.chargeActiveTimer = 0;
        if (enemy.chargeTrajectoryLine) {
          enemy.chargeTrajectoryLine.visible = false;
        }
        enemy.mesh.rotation.y += dt * 8;
        (enemy.telegraphMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        continue;
      }

      // Glacius slows enemies by 30% (GLACIUS_SLOW_FACTOR = 0.7) for 2 seconds!
      const freezeFactor = enemy.freezeTimer > 0 ? GLACIUS_SLOW_FACTOR : 1.0;
      if (enemy.freezeTimer > 0) enemy.freezeTimer -= dt;

      if (enemy.archetype !== 'boss_totem' && enemy.velocity.lengthSq() > 0.01) {
        enemy.position.x += enemy.velocity.x * dt;
        enemy.position.z += enemy.velocity.z * dt;
        enemy.velocity.multiplyScalar(Math.exp(-8 * dt));
      }

      // Maintain flying altitude & bobbing for aerial enemies (including Boss 4 at <= 50% HP!)
      if (enemy.isFlying) {
        const hoverBob = Math.sin(enemy.animPhase * 0.65) * 0.26;
        const targetAltitude =
          enemy.archetype === 'sky_dive_gargoyle' &&
          (enemy.state === 'windup' || enemy.state === 'attack')
            ? 2.0
            : enemy.flyHeight + hoverBob;
        enemy.position.y = THREE.MathUtils.lerp(
          enemy.position.y,
          targetAltitude,
          1 - Math.exp(-5.5 * dt)
        );
        // Keep floor telegraph ring on the ground below the flying enemy
        enemy.telegraphMesh.position.y = Math.max(0.06 - enemy.position.y, -enemy.position.y + 0.06);
        if (enemy.chargeTrajectoryLine) {
          enemy.chargeTrajectoryLine.position.y = -enemy.position.y + 0.08;
        }
      } else {
        enemy.position.y = 0;
        if (enemy.chargeTrajectoryLine) {
          enemy.chargeTrajectoryLine.position.y = 0.08;
        }
      }

      // In 'shared' Co-op Labyrinth mode, enemies dynamically target whichever living wizard is closest!
      let aggroTargetX = this.playerPos.x;
      let aggroTargetZ = this.playerPos.z;
      let isTargetingLocal = true;

      if (
        this.mapMode === 'labyrinth' &&
        this.labyrinthMultiplayerMode === 'shared' &&
        this.remoteMeshes.size > 0
      ) {
        const candidates = [
          { id: 'local', x: this.playerPos.x, z: this.playerPos.z, hp: this.hp },
        ];
        for (const [rId, rEntry] of this.remoteMeshes.entries()) {
          candidates.push({
            id: rId,
            x: rEntry.data.x,
            z: rEntry.data.z,
            hp: rEntry.data.hp ?? 100,
          });
        }
        const picked = selectEnemyAggroTarget(
          { x: enemy.position.x, z: enemy.position.z },
          candidates
        );
        if (picked) {
          aggroTargetX = picked.target.x;
          aggroTargetZ = picked.target.z;
          isTargetingLocal = picked.target.id === 'local';
        }
      }

      _v2.set(aggroTargetX - enemy.position.x, 0, aggroTargetZ - enemy.position.z);
      const distToPlayer = _v2.length();

      const hasLineOfSight =
        this.mapMode !== 'labyrinth' ||
        !segmentHitsWall(
          enemy.position.x,
          enemy.position.z,
          aggroTargetX,
          aggroTargetZ,
          this.labyrinthWalls,
          0.15
        );

      const wakeRange =
        enemy.archetype === 'boss_mage_1' ||
        enemy.archetype === 'boss_mage_2' ||
        enemy.archetype === 'boss_mage_3' ||
        enemy.archetype === 'boss_elemental_4' ||
        isStage5WormBossArchetype(enemy.archetype) ||
        enemy.archetype === 'boss_totem'
          ? 36
          : enemy.isFlying
          ? 28
          : 25;
      if (enemy.state === 'idle') {
        if (distToPlayer < wakeRange && hasLineOfSight) {
          enemy.state = 'seek';
        } else {
          enemy.mesh.position.copy(enemy.position);
          continue;
        }
      }

      // Stage 5 Worm Boss & Mud Monster Underground Burrowing ("на 2 секунды исчезает и вылазит, кружком где он вылезет красным, его нельзя бить"):
      if (enemy.burrowTimer && enemy.burrowTimer > 0) {
        enemy.burrowTimer = Math.max(0, enemy.burrowTimer - dt);
        enemy.mesh.visible = false;
        if (enemy.burrowWarningRing && enemy.emergeTargetPos) {
          enemy.burrowWarningRing.visible = true;
          enemy.burrowWarningRing.position.set(
            enemy.emergeTargetPos.x,
            0.05,
            enemy.emergeTargetPos.z
          );
          const pulse = 0.88 + Math.sin(performance.now() * 0.025) * 0.14;
          enemy.burrowWarningRing.scale.setScalar(pulse);
        }
        if (enemy.burrowTimer <= 0) {
          // Emerge from underground at emergeTargetPos!
          if (enemy.emergeTargetPos) {
            enemy.position.x = enemy.emergeTargetPos.x;
            enemy.position.z = enemy.emergeTargetPos.z;
            if (this.mapMode === 'labyrinth') {
              this.resolveLabyrinthCollisions(enemy.position, 0.85);
            }
          }
          enemy.mesh.visible = true;
          enemy.mesh.position.copy(enemy.position);
          if (enemy.burrowWarningRing) {
            enemy.burrowWarningRing.visible = false;
          }
          const isWorm = isStage5WormBossArchetype(enemy.archetype);
          this.spawnParticles(
            _v1.copy(enemy.position).setY(1.2),
            isWorm ? 0xef4444 : 0x78350f,
            30,
            7.0
          );
          audioEngine.playHeavyImpact(false);
          if (isWorm && isTargetingLocal) {
            const dEmerge = Math.hypot(
              this.playerPos.x - enemy.position.x,
              this.playerPos.z - enemy.position.z
            );
            if (dEmerge <= WORM_EMERGE_RADIUS) {
              const emergeDmg = this.getScaledEnemyDamage(WORM_EMERGE_DAMAGE);
              this.damagePlayer(emergeDmg);
              this.playerStunTimer = Math.max(this.playerStunTimer, WORM_EMERGE_STUN_SEC);
              this.lastCastBanner = {
                spellName: `🪱 Прорыв Червя из-под земли! -${emergeDmg} ОЗ и Стан на ${WORM_EMERGE_STUN_SEC} сек.!`,
                qualityPercent: 100,
                damage: emergeDmg,
                detail: '',
                color: '#ef4444',
                timestamp: performance.now(),
              };
            }
          }
          enemy.state = 'seek';
          enemy.stateTimer = 0.85;
        }
        continue;
      }

      // Trigger periodic underground burrowing for Worm Bosses & Mud Monster:
      if (
        (isStage5WormBossArchetype(enemy.archetype) || enemy.archetype === 'mud_monster') &&
        (!enemy.leechLatchTimer || enemy.leechLatchTimer <= 0) &&
        (!enemy.leechGlowTimer || enemy.leechGlowTimer <= 0)
      ) {
        enemy.burrowCooldown = (enemy.burrowCooldown ?? 5.0) - dt * freezeFactor;
        if (enemy.burrowCooldown <= 0 && distToPlayer < 26) {
          enemy.burrowTimer = WORM_BURROW_DURATION_SEC; // 2.0 seconds underground!
          enemy.burrowCooldown =
            enemy.archetype === 'boss_worm_5_p2_melee' ||
            enemy.archetype === 'boss_worm_5_p3_burrower'
              ? WORM_MELEE_SURFACE_DURATION_SEC // 4.0 seconds fighting on surface ("на 2 секунды залазит 4 секунды воюет")
              : enemy.archetype === 'mud_monster'
              ? 6.5
              : WORM_RANGED_SURFACE_DURATION_SEC;
          if (!enemy.emergeTargetPos) {
            enemy.emergeTargetPos = new THREE.Vector3();
          }
          enemy.emergeTargetPos.set(
            aggroTargetX + (Math.random() - 0.5) * 2.2,
            0,
            aggroTargetZ + (Math.random() - 0.5) * 2.2
          );
          if (this.mapMode === 'labyrinth') {
            this.resolveLabyrinthCollisions(enemy.emergeTargetPos, 0.85);
          }
          this.spawnParticles(_v1.copy(enemy.position).setY(0.8), 0x78350f, 22, 5.5);
          enemy.mesh.visible = false;
          if (enemy.burrowWarningRing) {
            enemy.burrowWarningRing.visible = true;
            enemy.burrowWarningRing.position.set(
              enemy.emergeTargetPos.x,
              0.05,
              enemy.emergeTargetPos.z
            );
          }
          continue;
        }
      }

      // Phase 3 Leech Worm (`boss_worm_5_p3_leech`):
      // 1) Cooldown of 25 seconds between jumps ("И эта атака у него редка раз в 25 секунд")
      // 2) 1-second flying jump telegraph showing the red landing circle on the floor ("есть 1 секунда до прыжка он как бы летит на тебя и видно куда приземлится", "от неё можно увернутся")
      // 3) Latches onto the player for 4 seconds if it hits, and detaches immediately if the player teleports ("если делаешь телепорт то он сразу спадает")
      if (enemy.archetype === 'boss_worm_5_p3_leech') {
        enemy.leechJumpCooldown = Math.max(0, (enemy.leechJumpCooldown ?? 0) - dt * freezeFactor);

        if (enemy.leechLatchTimer && enemy.leechLatchTimer > 0) {
          enemy.leechLatchTimer = Math.max(0, enemy.leechLatchTimer - dt);
          enemy.leechTickAccum = (enemy.leechTickAccum ?? 0) + dt;
          if (enemy.burrowWarningRing) {
            enemy.burrowWarningRing.visible = false;
          }
          _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
          enemy.position
            .copy(this.playerPos)
            .addScaledVector(_forward, 1.35)
            .setY(0.85);
          enemy.mesh.position.copy(enemy.position);
          enemy.mesh.rotation.y = this.yaw + Math.PI;

          if (enemy.leechTickAccum >= 1.0) {
            enemy.leechTickAccum -= 1.0;
            const biteDmg = this.getScaledEnemyDamage(WORM_LEECH_BITE_DAMAGE);
            this.damagePlayer(biteDmg);
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + WORM_LEECH_HEAL_AMOUNT);
            this.drawEnemyHpBarCanvas(
              enemy.hpBarCanvas,
              enemy.hpBarTexture,
              enemy.name,
              enemy.hp,
              enemy.maxHp
            );
            this.spawnParticles(_v1.copy(enemy.position), 0xef4444, 14, 4.5);
            this.lastCastBanner = {
              spellName: `🩸 Червь-Кровопийца вцепился! -${biteDmg} ОЗ (+${WORM_LEECH_HEAL_AMOUNT} ОЗ червю · [Ё] Телепорт сбросит его!)`,
              qualityPercent: 100,
              damage: biteDmg,
              detail: '',
              color: '#ef4444',
              timestamp: performance.now(),
            };
          }
          if (enemy.leechLatchTimer <= 0) {
            enemy.position.y = 0;
            enemy.velocity.copy(_forward).multiplyScalar(-8);
            enemy.state = 'seek';
            enemy.stateTimer = 2.0;
          }
          continue;
        }

        if (enemy.leechGlowTimer && enemy.leechGlowTimer > 0) {
          enemy.leechGlowTimer = Math.max(0, enemy.leechGlowTimer - dt * freezeFactor);
          const tMat = enemy.telegraphMesh.material as THREE.MeshBasicMaterial;
          tMat.color.setHex(0xef4444);
          tMat.opacity = 0.88;

          const startPos = enemy.leechJumpStartPos ?? enemy.position;
          const targetPos = enemy.leechJumpTargetPos ?? enemy.position;
          const progress = THREE.MathUtils.clamp(
            1 - enemy.leechGlowTimer / WORM_LEECH_GLOW_DURATION_SEC,
            0,
            1
          );
          // Fly in a parabolic arc toward the locked landing circle over 1.0 second ("есть 1 секунда до прыжка он как бы летит на тебя и видно куда приземлится")
          enemy.position.x = THREE.MathUtils.lerp(startPos.x, targetPos.x, progress);
          enemy.position.z = THREE.MathUtils.lerp(startPos.z, targetPos.z, progress);
          enemy.position.y = Math.sin(progress * Math.PI) * 2.55;
          enemy.mesh.rotation.y = Math.atan2(
            targetPos.x - startPos.x,
            targetPos.z - startPos.z
          );

          if (enemy.burrowWarningRing) {
            enemy.burrowWarningRing.visible = true;
            enemy.burrowWarningRing.position.set(targetPos.x, 0.09, targetPos.z);
            const ringPulse = 0.9 + Math.sin(performance.now() * 0.03) * 0.12;
            enemy.burrowWarningRing.scale.setScalar(ringPulse);
          }

          this.spawnParticles(_v1.copy(enemy.position).setY(enemy.position.y + 0.6), 0xef4444, 3, 4.0);
          if (enemy.leechGlowTimer <= 0) {
            tMat.opacity = 0;
            enemy.position.set(targetPos.x, 0, targetPos.z);
            if (enemy.burrowWarningRing) {
              enemy.burrowWarningRing.visible = false;
              enemy.burrowWarningRing.scale.setScalar(1.0);
            }
            if (this.mapMode === 'labyrinth') {
              this.resolveLabyrinthCollisions(enemy.position, 0.85);
            }
            const dAfterJump = Math.hypot(
              this.playerPos.x - enemy.position.x,
              this.playerPos.z - enemy.position.z
            );
            if (isTargetingLocal && dAfterJump <= WORM_LEECH_LAND_RADIUS) {
              enemy.leechLatchTimer = WORM_LEECH_LATCH_DURATION_SEC; // 4.0 seconds latched!
              enemy.leechTickAccum = 0.5;
              audioEngine.playHeavyImpact(false);
            } else if (isTargetingLocal) {
              this.lastCastBanner = {
                spellName: `⚡ Вы увернулись от прыжка Червя-Кровопийцы! (Следующий прыжок через ${WORM_LEECH_JUMP_COOLDOWN_SEC}с)`,
                qualityPercent: 100,
                damage: 0,
                detail: '',
                color: '#38bdf8',
                timestamp: performance.now(),
              };
            }
          }
          enemy.mesh.position.copy(enemy.position);
          continue;
        }
      }

      // Snow Giant (`frost_charger`) 7-Second Ice Wind Pull Ability ("Снежные гиганты добавим им новую способность они раз в 7 секунд могут притягивать меня к себе ветром ледяным"):
      if (enemy.archetype === 'frost_charger') {
        enemy.frostWindCooldown = Math.max(0, (enemy.frostWindCooldown ?? 3.5) - dt * freezeFactor);
        if (
          enemy.frostWindCooldown <= 0 &&
          distToPlayer <= 20.0 &&
          distToPlayer >= 2.4 &&
          hasLineOfSight
        ) {
          enemy.frostWindCooldown = FROST_WIND_COOLDOWN_SEC;
          this.spawnFrostWindZone(new THREE.Vector3(aggroTargetX, 0, aggroTargetZ), enemy);
          this.spawnParticles(_v1.copy(enemy.position).setY(1.8), 0x38bdf8, 20, 5.5);
          if (isTargetingLocal) {
            this.lastCastBanner = {
              spellName: `🌬️❄️ Снежный Гигант вызывает Ледяной Ветер! Синий круг — 1 сек до притяжения!`,
              qualityPercent: 100,
              damage: 0,
              detail: '',
              color: '#38bdf8',
              timestamp: performance.now(),
            };
          }
        }
      }

      // Stage 5 Skeleton Hammer Shield (`skeleton_hammer_shield`): cycles Shield Guard stance!
      if (enemy.archetype === 'skeleton_hammer_shield') {
        enemy.shieldGuardTimer = (enemy.shieldGuardTimer ?? 4.0) - dt;
        if (enemy.shieldGuardTimer <= 0) {
          enemy.shieldGuardActive = !enemy.shieldGuardActive;
          enemy.shieldGuardTimer = enemy.shieldGuardActive ? 3.5 : 4.5;
          if (enemy.shieldGuardActive) {
            this.spawnParticles(_v1.copy(enemy.position).setY(1.2), 0x38bdf8, 12, 3.5);
          }
        }
      }

      // Stage 3 Boss ("Повелитель Хронос") & Stage 4 Boss ("Элементаль Трёх Стихий") teleport every 7 seconds during combat!
      if (
        (enemy.archetype === 'boss_mage_3' || enemy.archetype === 'boss_elemental_4') &&
        enemy.chargeWindupTimer <= 0 &&
        enemy.chargeActiveTimer <= 0
      ) {
        enemy.teleportTimer -= dt * freezeFactor;
        if (enemy.teleportTimer <= 0) {
          enemy.teleportTimer = 7.0;
          this.spawnParticles(_v1.copy(enemy.position).setY(1.8), 0x38bdf8, 28, 7);
          const candidateX = [-24, -14, 0, 14, 24];
          const chosenX = candidateX[Math.floor(Math.random() * candidateX.length)];
          const chosenZ = this.labyrinthGoalPos.z + 10 + Math.random() * 14;
          enemy.position.set(chosenX, enemy.isFlying ? enemy.flyHeight : 0, chosenZ);
          this.resolveLabyrinthCollisions(enemy.position, 0.85);
          enemy.mesh.position.copy(enemy.position);
          this.spawnParticles(_v1.copy(enemy.position).setY(1.8), 0xf97316, 28, 7);
        }
      }

      // Handle Stone Crusher (`stone_crusher`) & Stage 4 Boss (`boss_elemental_4`) 7-Second Charge Ability:
      if (enemy.archetype === 'stone_crusher' || enemy.archetype === 'boss_elemental_4') {
        if (enemy.chargeWindupTimer > 0) {
          enemy.chargeWindupTimer = Math.max(0, enemy.chargeWindupTimer - dt * freezeFactor);
          enemy.mesh.rotation.y = Math.atan2(enemy.chargeDir.x, enemy.chargeDir.z);
          const tMat = enemy.telegraphMesh.material as THREE.MeshBasicMaterial;
          tMat.color.setHex(0xef4444);
          tMat.opacity = 0.75 + Math.sin(performance.now() * 0.03) * 0.2;
          if (enemy.chargeTrajectoryLine) {
            enemy.chargeTrajectoryLine.visible = true;
            const lMat = enemy.chargeTrajectoryLine.material as THREE.MeshBasicMaterial;
            lMat.opacity = 0.65 + Math.sin(performance.now() * 0.035) * 0.25;
          }
          this.spawnParticles(_v1.copy(enemy.position).setY(1.6), 0xef4444, 2, 3.5);

          if (enemy.chargeWindupTimer <= 0) {
            enemy.chargeActiveTimer = 0.65;
            enemy.chargeHitPlayer = false;
            if (enemy.chargeTrajectoryLine) {
              enemy.chargeTrajectoryLine.visible = false;
            }
            audioEngine.playHeavyImpact(false);
          }
          enemy.mesh.position.copy(enemy.position);
          continue;
        }

        if (enemy.chargeActiveTimer > 0) {
          enemy.chargeActiveTimer = Math.max(0, enemy.chargeActiveTimer - dt);
          const dashSpeed = 18.5 * freezeFactor;
          const nextX = enemy.position.x + enemy.chargeDir.x * dashSpeed * dt;
          const nextZ = enemy.position.z + enemy.chargeDir.z * dashSpeed * dt;
          if (
            this.mapMode === 'labyrinth' &&
            segmentHitsWall(
              enemy.position.x,
              enemy.position.z,
              nextX,
              nextZ,
              this.getActiveLabyrinthWalls(),
              0.85
            )
          ) {
            enemy.chargeActiveTimer = 0;
            this.spawnParticles(_v1.copy(enemy.position).setY(1.2), 0xf59e0b, 18, 5.5);
          } else {
            enemy.position.x = nextX;
            enemy.position.z = nextZ;
          }

          if (isTargetingLocal && !enemy.chargeHitPlayer) {
            const dPlayer = Math.hypot(
              this.playerPos.x - enemy.position.x,
              this.playerPos.z - enemy.position.z
            );
            if (dPlayer < 2.35) {
              enemy.chargeHitPlayer = true;
              const chargeDmg = this.getScaledEnemyDamage(
                enemy.archetype === 'boss_elemental_4' ? 26 : 20
              );
              this.damagePlayer(chargeDmg);
              this.playerStunTimer = Math.max(this.playerStunTimer, 1.0);
              this.lastCastBanner = {
                spellName: `💫 Каменный таран! -${chargeDmg} ОЗ и Оглушение на 1 сек.!`,
                qualityPercent: 100,
                damage: chargeDmg,
                detail: '',
                color: '#ef4444',
                timestamp: performance.now(),
              };
            }
          }

          if (enemy.chargeActiveTimer <= 0) {
            enemy.chargeCooldown = 7.0;
            enemy.state = 'seek';
            enemy.stateTimer = 1.1;
            (enemy.telegraphMesh.material as THREE.MeshBasicMaterial).opacity = 0;
          }
          if (this.mapMode === 'labyrinth') {
            this.resolveLabyrinthCollisions(enemy.position, 0.85);
          }
          enemy.mesh.position.copy(enemy.position);
          continue;
        }

        enemy.chargeCooldown = Math.max(0, enemy.chargeCooldown - dt * freezeFactor);
        if (
          enemy.chargeCooldown <= 0 &&
          distToPlayer < 14.5 &&
          distToPlayer > 2.2 &&
          hasLineOfSight
        ) {
          enemy.chargeCooldown = 7.0;
          enemy.chargeWindupTimer = 1.0;
          enemy.chargeDir.copy(_v2).setY(0).normalize();
          enemy.mesh.rotation.y = Math.atan2(enemy.chargeDir.x, enemy.chargeDir.z);
          if (enemy.chargeTrajectoryLine) {
            enemy.chargeTrajectoryLine.visible = true;
          }
          this.spawnParticles(_v1.copy(enemy.position).setY(1.8), 0xef4444, 24, 6.0);
          enemy.mesh.position.copy(enemy.position);
          continue;
        }
      }

      const dirToPlayer = _v3.copy(_v2).normalize();
      enemy.mesh.rotation.y = Math.atan2(dirToPlayer.x, dirToPlayer.z);

      if (enemy.state === 'seek') {
        (enemy.telegraphMesh.material as THREE.MeshBasicMaterial).opacity = 0;

        if (enemy.archetype === 'boss_totem') {
          enemy.stateTimer -= dt * freezeFactor;
          if (enemy.stateTimer <= 0 && distToPlayer < 28 && hasLineOfSight) {
            enemy.state = 'windup';
            enemy.stateTimer = 0.7;
          }
        } else if (enemy.archetype === 'sky_dive_gargoyle') {
          // Common Flying Melee Gargoyle: flies in the sky toward player, then swoops down to slash in melee!
          if (hasLineOfSight) {
            const perpX = -dirToPlayer.z * enemy.strafeDir * 0.42;
            const perpZ = dirToPlayer.x * enemy.strafeDir * 0.42;
            enemy.position.x += (dirToPlayer.x + perpX) * enemy.speed * freezeFactor * dt;
            enemy.position.z += (dirToPlayer.z + perpZ) * enemy.speed * freezeFactor * dt;
          }

          if (distToPlayer < 4.3 && hasLineOfSight && activeAttackers < maxConcurrentAttackers) {
            enemy.state = 'windup';
            enemy.stateTimer = 0.75;
          }
        } else if (enemy.archetype === 'storm_harpy_shooter') {
          // Rarer Flying Ranged Harpy: circles high in the sky and shoots storm bolts down at the player!
          if (hasLineOfSight) {
            const idealDist = 12.5;
            const radialMove =
              distToPlayer > idealDist + 1.8 ? 1 : distToPlayer < idealDist - 2 ? -0.75 : 0;
            enemy.position.x +=
              (dirToPlayer.x * radialMove - dirToPlayer.z * enemy.strafeDir * 0.85) *
              enemy.speed *
              freezeFactor *
              dt;
            enemy.position.z +=
              (dirToPlayer.z * radialMove + dirToPlayer.x * enemy.strafeDir * 0.85) *
              enemy.speed *
              freezeFactor *
              dt;
          }

          enemy.stateTimer -= dt * freezeFactor;
          if (enemy.stateTimer <= 0 && distToPlayer < 28 && hasLineOfSight) {
            enemy.state = 'windup';
            enemy.stateTimer = 0.85;
          }
        } else if (enemy.archetype === 'rat_swarmer' || enemy.archetype === 'wild_boar') {
          if (hasLineOfSight) {
            const strafeWeight = enemy.archetype === 'wild_boar' ? 0.22 : 0.55;
            const perpX = -dirToPlayer.z * enemy.strafeDir * strafeWeight;
            const perpZ = dirToPlayer.x * enemy.strafeDir * strafeWeight;
            enemy.position.x += (dirToPlayer.x + perpX) * enemy.speed * freezeFactor * dt;
            enemy.position.z += (dirToPlayer.z + perpZ) * enemy.speed * freezeFactor * dt;
          }

          if (distToPlayer < 3.8 && hasLineOfSight && activeAttackers < maxConcurrentAttackers) {
            enemy.state = 'windup';
            enemy.stateTimer =
              enemy.archetype === 'wild_boar'
                ? 0.58
                : this.mapMode === 'labyrinth'
                ? 0.8
                : 0.5;
          }
        } else if (
          enemy.archetype === 'dark_kiter' ||
          enemy.archetype === 'fire_demon' ||
          enemy.archetype === 'water_monster' ||
          enemy.archetype === 'mud_monster' ||
          enemy.archetype === 'skeleton_archer' ||
          enemy.archetype === 'boss_mage_1' ||
          enemy.archetype === 'boss_mage_2' ||
          enemy.archetype === 'boss_mage_3' ||
          enemy.archetype === 'boss_elemental_4' ||
          enemy.archetype === 'boss_worm_5_p1' ||
          enemy.archetype === 'boss_worm_5_p2_fire' ||
          enemy.archetype === 'boss_worm_5_p3_fire_pool'
        ) {
          if (hasLineOfSight) {
            const idealDist =
              enemy.archetype === 'dark_kiter' ||
              enemy.archetype === 'fire_demon' ||
              enemy.archetype === 'water_monster' ||
              enemy.archetype === 'mud_monster' ||
              enemy.archetype === 'skeleton_archer'
                ? 11.5
                : 12.0;
            const radialMove =
              distToPlayer > idealDist + 1.5 ? 1 : distToPlayer < idealDist - 2 ? -0.8 : 0;
            enemy.position.x +=
              (dirToPlayer.x * radialMove - dirToPlayer.z * enemy.strafeDir * 0.8) *
              enemy.speed *
              freezeFactor *
              dt;
            enemy.position.z +=
              (dirToPlayer.z * radialMove + dirToPlayer.x * enemy.strafeDir * 0.8) *
              enemy.speed *
              freezeFactor *
              dt;
          }

          enemy.stateTimer -= dt * freezeFactor;
          if (enemy.stateTimer <= 0 && distToPlayer < 28 && hasLineOfSight) {
            enemy.state = 'windup';
            enemy.stateTimer =
              enemy.archetype === 'boss_mage_3'
                ? enemy.enragedPhase2
                  ? 0.38
                  : 0.55
                : enemy.archetype === 'boss_elemental_4' || isStage5WormBossArchetype(enemy.archetype)
                ? 0.55
                : enemy.archetype === 'boss_mage_2'
                ? 0.65
                : enemy.archetype === 'boss_mage_1'
                ? 0.8
                : 0.85;
          }
        } else {
          // Melee fighters (`frost_charger`, `stone_crusher`, `cave_bear`, `skeleton_hammer_shield`, `boss_worm_5_p2_melee`, `boss_worm_5_p3_fire_bomber`, `boss_worm_5_p3_burrower`, `boss_worm_5_p3_leech`)
          const shieldSlow =
            enemy.archetype === 'skeleton_hammer_shield' && enemy.shieldGuardActive ? 0.55 : 1.0;
          if (distToPlayer > 2.8 && hasLineOfSight) {
            enemy.position.addScaledVector(
              dirToPlayer,
              enemy.speed * shieldSlow * freezeFactor * dt
            );
          }
          enemy.stateTimer -= dt * freezeFactor;
          if (
            (distToPlayer < 5.6 || enemy.stateTimer <= 0) &&
            hasLineOfSight &&
            activeAttackers < maxConcurrentAttackers
          ) {
            if (
              enemy.archetype === 'boss_worm_5_p3_leech' &&
              distToPlayer <= 10.5 &&
              (enemy.leechJumpCooldown ?? 0) <= 0
            ) {
              // Rare jump once every 25s: glow bright red & fly for 1.0 second showing red landing circle on the floor!
              enemy.leechGlowTimer = WORM_LEECH_GLOW_DURATION_SEC;
              enemy.leechJumpCooldown = WORM_LEECH_JUMP_COOLDOWN_SEC;
              enemy.leechJumpStartPos = enemy.position.clone();
              enemy.leechJumpTargetPos = new THREE.Vector3(aggroTargetX, 0, aggroTargetZ);
              if (this.mapMode === 'labyrinth') {
                this.resolveLabyrinthCollisions(enemy.leechJumpTargetPos, 0.85);
              }
              if (enemy.burrowWarningRing) {
                enemy.burrowWarningRing.visible = true;
                enemy.burrowWarningRing.position.set(
                  enemy.leechJumpTargetPos.x,
                  0.09,
                  enemy.leechJumpTargetPos.z
                );
              }
              enemy.stateTimer = 2.4;
              this.spawnParticles(_v1.copy(enemy.position).setY(1.1), 0xef4444, 18, 5.0);
              if (isTargetingLocal) {
                this.lastCastBanner = {
                  spellName: `🩸 Червь-Кровопийца прыгает (1 сек)! Выйдите из красного круга!`,
                  qualityPercent: 100,
                  damage: 0,
                  detail: '',
                  color: '#ef4444',
                  timestamp: performance.now(),
                };
              }
            } else {
              enemy.state = 'windup';
              enemy.stateTimer = this.mapMode === 'labyrinth' ? 0.72 : 0.65;
            }
          }
        }
      } else if (enemy.state === 'windup') {
        activeAttackers++;
        enemy.stateTimer -= dt * freezeFactor;
        const mat = enemy.telegraphMesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.55 + Math.sin(performance.now() * 0.025) * 0.3;
        enemy.telegraphMesh.scale.setScalar(1.0 + (1 - enemy.stateTimer) * 0.45);

        if (enemy.stateTimer <= 0) {
          enemy.state = 'attack';
          enemy.stateTimer = 0.35;
          mat.opacity = 0;

          if (!hasLineOfSight) {
            // Wall blocked line of sight during windup
          } else if (enemy.archetype === 'boss_totem') {
            this.spawnSpellProjectile({
              spellId: 'stupefy',
              casterId: 'enemy',
              origin: _v1.copy(enemy.position).setY(3.1),
              direction: dirToPlayer,
              damage: this.getScaledEnemyDamage(15),
              qualityPercent: 85,
              colorHex: 0xa855f7,
            });
          } else if (enemy.archetype === 'storm_harpy_shooter') {
            // Ranged Flying Harpy shoots a storm bolt 3D downward from the sky toward the targeted player!
            const harpyOrigin = _v1.copy(enemy.position).setY(enemy.position.y + 0.35);
            const aim3d = new THREE.Vector3(
              aggroTargetX - harpyOrigin.x,
              1.65 - harpyOrigin.y,
              aggroTargetZ - harpyOrigin.z
            ).normalize();
            this.spawnSpellProjectile({
              spellId: 'expelliarmus',
              casterId: 'enemy',
              origin: harpyOrigin,
              direction: aim3d,
              damage: this.getScaledEnemyDamage(14),
              qualityPercent: 85,
              colorHex: 0x38bdf8,
            });
          } else if (enemy.archetype === 'sky_dive_gargoyle') {
            // Melee Flying Gargoyle swoops down and slashes the targeted player!
            enemy.velocity.copy(dirToPlayer).multiplyScalar(9.5);
            if (isTargetingLocal && distToPlayer < 4.6) {
              this.damagePlayer(this.getScaledEnemyDamage(12));
            }
          } else if (enemy.archetype === 'mud_monster') {
            // Stage 5 Mud Monster (`Болотный Грязевик`):
            // Alternates throwing a 5-second Mud Puddle (-50% move speed) and shooting a 5x Giant Mud Ball (-30% move speed)!
            enemy.attackCycle = (enemy.attackCycle + 1) % 2;
            if (enemy.attackCycle === 0) {
              this.spawnMudPuddle(new THREE.Vector3(aggroTargetX, 0, aggroTargetZ));
            } else {
              this.spawnSpellProjectile({
                spellId: 'stupefy',
                isMudBall: true,
                casterId: 'enemy',
                origin: _v1.copy(enemy.position).setY(1.35),
                direction: dirToPlayer,
                damage: this.getScaledEnemyDamage(15),
                qualityPercent: 95,
                colorHex: 0x78350f,
              });
            }
          } else if (enemy.archetype === 'cave_bear') {
            // Stage 5 Cave Bear (`Пещерный Медведь`):
            // Attack 0: Fear Roar ("рыкнет в радиусе от него твой герой убегает назад 1.5 секунды")
            // Attack 1: Wide Cleave ("подбегает и бьет в широком радиусе")
            enemy.attackCycle = (enemy.attackCycle + 1) % 2;
            if (enemy.attackCycle === 0 && distToPlayer <= BEAR_FEAR_RADIUS) {
              this.spawnParticles(_v1.copy(enemy.position).setY(1.8), 0xef4444, 28, 7.0);
              audioEngine.playHeavyImpact(false);
              if (isTargetingLocal) {
                this.playerFearTimer = Math.max(this.playerFearTimer, BEAR_FEAR_DURATION_SEC);
                const roarDmg = this.getScaledEnemyDamage(10);
                this.damagePlayer(roarDmg);
                this.lastCastBanner = {
                  spellName: `🐻 Рёв Пещерного Медведя! Страх на ${BEAR_FEAR_DURATION_SEC}с (бег назад)!`,
                  qualityPercent: 100,
                  damage: roarDmg,
                  detail: '',
                  color: '#ef4444',
                  timestamp: performance.now(),
                };
              }
            } else {
              enemy.velocity.copy(dirToPlayer).multiplyScalar(11.0);
              this.spawnParticles(_v1.copy(enemy.position).setY(1.2), 0xd97706, 20, 5.5);
              if (isTargetingLocal && distToPlayer <= BEAR_CLEAVE_RADIUS) {
                const cleaveDmg = this.getScaledEnemyDamage(18);
                this.damagePlayer(cleaveDmg);
                this.lastCastBanner = {
                  spellName: `🐾 Широкий удар лапой Медведя! -${cleaveDmg} ОЗ!`,
                  qualityPercent: 100,
                  damage: cleaveDmg,
                  detail: '',
                  color: '#d97706',
                  timestamp: performance.now(),
                };
              }
            }
          } else if (enemy.archetype === 'skeleton_archer') {
            // Stage 5 Skeleton Archer (`Скелет-Лучник`):
            // Shoots 1 fast arrow (`SKELETON_ARROW_SPEED`) or a slower dodgeable 5-arrow fan volley (`SKELETON_VOLLEY_ARROW_SPEED`)!
            enemy.attackCycle = (enemy.attackCycle + 1) % 3;
            const arrowOrigin = _v1.copy(enemy.position).setY(1.45);
            const isMultiVolley = enemy.attackCycle === 0;
            const arrowAngles = isMultiVolley ? [-0.28, -0.14, 0, 0.14, 0.28] : [0];
            const arrowSpeed = isMultiVolley
              ? SKELETON_VOLLEY_ARROW_SPEED
              : SKELETON_ARROW_SPEED;
            for (const ang of arrowAngles) {
              const cosA = Math.cos(ang);
              const sinA = Math.sin(ang);
              const spreadDir = new THREE.Vector3(
                dirToPlayer.x * cosA - dirToPlayer.z * sinA,
                0,
                dirToPlayer.x * sinA + dirToPlayer.z * cosA
              ).normalize();
              this.spawnSpellProjectile({
                spellId: 'stupefy',
                isArrow: true,
                speedOverride: arrowSpeed,
                casterId: 'enemy',
                origin: arrowOrigin.clone(),
                direction: spreadDir,
                damage: this.getScaledEnemyDamage(13),
                qualityPercent: 90,
                colorHex: 0xfef08a,
              });
            }
          } else if (enemy.archetype === 'skeleton_hammer_shield') {
            // Stage 5 Skeleton Hammer & Shield (`Скелет-Молотобоец со Щитом`):
            // Alternates Linear Ground Earthquake ("бьет в пол молотом и полоской пошел урон типа землетрясение") and Heavy Hammer Melee!
            enemy.attackCycle = (enemy.attackCycle + 1) % 2;
            if (enemy.attackCycle === 0) {
              this.spawnEarthquakeLine(
                enemy.position,
                dirToPlayer,
                this.getScaledEnemyDamage(19)
              );
            } else {
              enemy.velocity.copy(dirToPlayer).multiplyScalar(9.5);
              if (isTargetingLocal && distToPlayer < 4.6) {
                this.damagePlayer(this.getScaledEnemyDamage(20));
              }
            }
          } else if (
            enemy.archetype === 'boss_worm_5_p1' ||
            enemy.archetype === 'boss_worm_5_p2_fire'
          ) {
            // Phase 1 Worm & Phase 2 Fire Worm:
            // Attack 0: Fire Pool on floor (burns 4s, ignites player 2s)
            // Attack 1: 3-Fireball Spit Volley ("вторая атака обычные огненные плевки по 3 шарика")
            enemy.attackCycle = (enemy.attackCycle + 1) % 2;
            if (enemy.attackCycle === 0) {
              this.spawnFirePool(
                new THREE.Vector3(aggroTargetX, 0, aggroTargetZ),
                this.getScaledEnemyDamage(14)
              );
            } else {
              const spitOrigin = _v1.copy(enemy.position).setY(2.2);
              for (const ang of [-0.22, 0, 0.22]) {
                const cosA = Math.cos(ang);
                const sinA = Math.sin(ang);
                const spreadDir = new THREE.Vector3(
                  dirToPlayer.x * cosA - dirToPlayer.z * sinA,
                  0,
                  dirToPlayer.x * sinA + dirToPlayer.z * cosA
                ).normalize();
                this.spawnSpellProjectile({
                  spellId: 'incendio',
                  casterId: 'enemy',
                  origin: spitOrigin.clone(),
                  direction: spreadDir,
                  damage: this.getScaledEnemyDamage(18),
                  qualityPercent: 95,
                  colorHex: 0xf97316,
                });
              }
            }
          } else if (
            enemy.archetype === 'boss_worm_5_p2_melee' ||
            enemy.archetype === 'boss_worm_5_p3_burrower'
          ) {
            // Phase 2 Melee Worm & Phase 3 Burrower Worm: fast boar-like melee rush ("в ближнем бою и он бьет быстро набегает как кабаны")!
            enemy.velocity.copy(dirToPlayer).multiplyScalar(14.0);
            if (isTargetingLocal && distToPlayer < 4.6) {
              const rushDmg = this.getScaledEnemyDamage(
                enemy.archetype === 'boss_worm_5_p2_melee' ? 20 : 15
              );
              this.damagePlayer(rushDmg);
            }
          } else if (enemy.archetype === 'boss_worm_5_p3_fire_bomber') {
            // Phase 3 Fire Bomber Worm: crawls close & explodes in a fiery burst + shoots fireballs ("подползает и взрывается и стреляет шариками")!
            if (distToPlayer <= 5.2) {
              this.spawnParticles(_v1.copy(enemy.position).setY(1.2), 0xf97316, 32, 7.5);
              audioEngine.playHeavyImpact(false);
              if (isTargetingLocal) {
                const expDmg = this.getScaledEnemyDamage(20);
                this.damagePlayer(expDmg);
                this.playerBurnTimer = Math.max(this.playerBurnTimer, 2.0);
                this.lastCastBanner = {
                  spellName: `💥 Взрыв Огненного Червя! -${expDmg} ОЗ + горение 2с!`,
                  qualityPercent: 100,
                  damage: expDmg,
                  detail: '',
                  color: '#f97316',
                  timestamp: performance.now(),
                };
              }
            }
            const spitOrigin = _v1.copy(enemy.position).setY(1.5);
            for (const ang of [-0.18, 0.18]) {
              const cosA = Math.cos(ang);
              const sinA = Math.sin(ang);
              const spreadDir = new THREE.Vector3(
                dirToPlayer.x * cosA - dirToPlayer.z * sinA,
                0,
                dirToPlayer.x * sinA + dirToPlayer.z * cosA
              ).normalize();
              this.spawnSpellProjectile({
                spellId: 'incendio',
                casterId: 'enemy',
                origin: spitOrigin.clone(),
                direction: spreadDir,
                damage: this.getScaledEnemyDamage(15),
                qualityPercent: 90,
                colorHex: 0xf97316,
              });
            }
          } else if (enemy.archetype === 'boss_worm_5_p3_fire_pool') {
            // Phase 3 Fire Pool Worm: throws burning fire puddles onto the floor ("кидает на пол огненные лужи которые так же горят")!
            this.spawnFirePool(
              new THREE.Vector3(aggroTargetX, 0, aggroTargetZ),
              this.getScaledEnemyDamage(13)
            );
          } else if (enemy.archetype === 'fire_demon') {
            // Stage 4 Fire Elemental alternates between Primary Attack (Moving Wall of Fire + 2s Burn)
            // and Alternative Attack (`Веер пламени`: 3-fireball fan volley)!
            enemy.attackCycle = (enemy.attackCycle + 1) % 2;
            const fireOrigin = _v1.copy(enemy.position).setY(1.15);
            if (enemy.attackCycle === 0) {
              this.spawnSpellProjectile({
                spellId: 'incendio',
                isFireWall: true,
                casterId: 'enemy',
                origin: fireOrigin,
                direction: dirToPlayer,
                damage: this.getScaledEnemyDamage(18),
                qualityPercent: 95,
                colorHex: 0xf97316,
              });
            } else {
              const fanAngles = [-0.22, 0, 0.22];
              for (const ang of fanAngles) {
                const cosA = Math.cos(ang);
                const sinA = Math.sin(ang);
                const spreadDir = new THREE.Vector3(
                  dirToPlayer.x * cosA - dirToPlayer.z * sinA,
                  0,
                  dirToPlayer.x * sinA + dirToPlayer.z * cosA
                ).normalize();
                this.spawnSpellProjectile({
                  spellId: 'incendio',
                  casterId: 'enemy',
                  origin: fireOrigin.clone(),
                  direction: spreadDir,
                  damage: this.getScaledEnemyDamage(15),
                  qualityPercent: 90,
                  colorHex: 0xfb923c,
                });
              }
            }
          } else if (enemy.archetype === 'water_monster') {
            // Stage 4 Water Elemental alternates between Primary Attack (5s Falling Ice Rain AoE)
            // and Alternative Attack (`Приливной залп льда`: 3-spear frost fan volley that slows player)!
            enemy.attackCycle = (enemy.attackCycle + 1) % 2;
            if (enemy.attackCycle === 0) {
              this.spawnIceRainZone(
                new THREE.Vector3(aggroTargetX, 0, aggroTargetZ),
                this.getScaledEnemyDamage(15)
              );
            } else {
              const iceOrigin = _v1.copy(enemy.position).setY(1.25);
              const frostAngles = [-0.18, 0, 0.18];
              for (const ang of frostAngles) {
                const cosA = Math.cos(ang);
                const sinA = Math.sin(ang);
                const spreadDir = new THREE.Vector3(
                  dirToPlayer.x * cosA - dirToPlayer.z * sinA,
                  0,
                  dirToPlayer.x * sinA + dirToPlayer.z * cosA
                ).normalize();
                this.spawnSpellProjectile({
                  spellId: 'glacius',
                  casterId: 'enemy',
                  origin: iceOrigin.clone(),
                  direction: spreadDir,
                  damage: this.getScaledEnemyDamage(14),
                  qualityPercent: 92,
                  colorHex: 0x38bdf8,
                });
              }
            }
          } else if (enemy.archetype === 'stone_crusher') {
            // Stage 4 Earth Elemental (`Каменный Крушитель`) alternates between Primary Attack (melee slam / single boulder)
            // and Alternative Attack (`Каменный обвал`: 3-boulder seismic fan + ground shockwave), plus its 7s Bull Charge!
            enemy.attackCycle = (enemy.attackCycle + 1) % 2;
            if (enemy.attackCycle === 0) {
              enemy.velocity.copy(dirToPlayer).multiplyScalar(8.5);
              if (isTargetingLocal && distToPlayer < 4.5) {
                this.damagePlayer(this.getScaledEnemyDamage(18));
              } else {
                this.spawnSpellProjectile({
                  spellId: 'stupefy',
                  casterId: 'enemy',
                  origin: _v1.copy(enemy.position).setY(1.5),
                  direction: dirToPlayer,
                  damage: this.getScaledEnemyDamage(16),
                  qualityPercent: 90,
                  colorHex: 0xd97706,
                });
              }
            } else {
              const rockOrigin = _v1.copy(enemy.position).setY(1.45);
              const boulderAngles = [-0.25, 0, 0.25];
              for (const ang of boulderAngles) {
                const cosA = Math.cos(ang);
                const sinA = Math.sin(ang);
                const spreadDir = new THREE.Vector3(
                  dirToPlayer.x * cosA - dirToPlayer.z * sinA,
                  0,
                  dirToPlayer.x * sinA + dirToPlayer.z * cosA
                ).normalize();
                this.spawnSpellProjectile({
                  spellId: 'stupefy',
                  casterId: 'enemy',
                  origin: rockOrigin.clone(),
                  direction: spreadDir,
                  damage: this.getScaledEnemyDamage(15),
                  qualityPercent: 92,
                  colorHex: 0xf59e0b,
                });
              }
              this.spawnParticles(_v1.copy(enemy.position).setY(0.3), 0xd97706, 22, 6.5);
              if (isTargetingLocal && distToPlayer < 6.2) {
                this.damagePlayer(this.getScaledEnemyDamage(16));
              }
            }
          } else if (enemy.archetype === 'boss_elemental_4') {
            enemy.attackCycle = (enemy.attackCycle + 1) % 4;
            const bossOrigin = _v1
              .copy(enemy.position)
              .setY(enemy.isFlying ? 1.35 : 1.25);
            if (enemy.attackCycle === 0) {
              this.spawnSpellProjectile({
                spellId: 'incendio',
                isFireWall: true,
                casterId: 'enemy',
                origin: bossOrigin,
                direction: dirToPlayer,
                damage: this.getScaledEnemyDamage(24),
                qualityPercent: 100,
                colorHex: 0xf97316,
              });
            } else if (enemy.attackCycle === 1) {
              this.spawnIceRainZone(
                new THREE.Vector3(aggroTargetX, 0, aggroTargetZ),
                this.getScaledEnemyDamage(18)
              );
            } else if (enemy.attackCycle === 2) {
              const fanAngles = [-0.32, -0.16, 0, 0.16, 0.32];
              fanAngles.forEach((ang, idx) => {
                const cosA = Math.cos(ang);
                const sinA = Math.sin(ang);
                const spreadDir = new THREE.Vector3(
                  dirToPlayer.x * cosA - dirToPlayer.z * sinA,
                  0,
                  dirToPlayer.x * sinA + dirToPlayer.z * cosA
                ).normalize();
                const isFireOrb = idx % 2 === 0;
                this.spawnSpellProjectile({
                  spellId: isFireOrb ? 'incendio' : 'glacius',
                  casterId: 'enemy',
                  origin: bossOrigin.clone(),
                  direction: spreadDir,
                  damage: this.getScaledEnemyDamage(19),
                  qualityPercent: 100,
                  colorHex: isFireOrb ? 0xf97316 : 0x38bdf8,
                });
              });
            } else {
              const boulderAngles = [-0.24, 0, 0.24];
              for (const ang of boulderAngles) {
                const cosA = Math.cos(ang);
                const sinA = Math.sin(ang);
                const spreadDir = new THREE.Vector3(
                  dirToPlayer.x * cosA - dirToPlayer.z * sinA,
                  0,
                  dirToPlayer.x * sinA + dirToPlayer.z * cosA
                ).normalize();
                this.spawnSpellProjectile({
                  spellId: 'stupefy',
                  casterId: 'enemy',
                  origin: bossOrigin.clone(),
                  direction: spreadDir,
                  damage: this.getScaledEnemyDamage(21),
                  qualityPercent: 100,
                  colorHex: 0xf59e0b,
                });
              }
            }
          } else if (enemy.archetype === 'boss_mage_3') {
            const angles = enemy.enragedPhase2
              ? [-0.32, -0.16, 0, 0.16, 0.32]
              : [-0.27, -0.09, 0.09, 0.27];
            for (const ang of angles) {
              const cosA = Math.cos(ang);
              const sinA = Math.sin(ang);
              const spreadDir = new THREE.Vector3(
                dirToPlayer.x * cosA - dirToPlayer.z * sinA,
                0,
                dirToPlayer.x * sinA + dirToPlayer.z * cosA
              ).normalize();
              this.spawnSpellProjectile({
                spellId: 'glacius',
                casterId: 'enemy',
                origin: _v1.copy(enemy.position).setY(2.5),
                direction: spreadDir,
                damage: this.getScaledEnemyDamage(25),
                qualityPercent: 100,
                colorHex: enemy.enragedPhase2 ? 0xef4444 : 0x38bdf8,
              });
            }
          } else if (enemy.archetype === 'boss_mage_2') {
            const angles = [-0.22, 0, 0.22];
            for (const ang of angles) {
              const cosA = Math.cos(ang);
              const sinA = Math.sin(ang);
              const spreadDir = new THREE.Vector3(
                dirToPlayer.x * cosA - dirToPlayer.z * sinA,
                0,
                dirToPlayer.x * sinA + dirToPlayer.z * cosA
              ).normalize();
              this.spawnSpellProjectile({
                spellId: 'expelliarmus',
                casterId: 'enemy',
                origin: _v1.copy(enemy.position).setY(2.4),
                direction: spreadDir,
                damage: this.getScaledEnemyDamage(22),
                qualityPercent: 100,
                colorHex: 0x9333ea,
              });
            }
          } else if (enemy.archetype === 'boss_mage_1') {
            this.spawnSpellProjectile({
              spellId: 'expelliarmus',
              casterId: 'enemy',
              origin: _v1.copy(enemy.position).setY(2.1),
              direction: dirToPlayer,
              damage: this.getScaledEnemyDamage(18),
              qualityPercent: 95,
              projectileScale: 4.0,
              colorHex: 0xef4444,
            });
          } else if (enemy.archetype === 'dark_kiter') {
            const stageNum = this.mapMode === 'labyrinth' ? this.labyrinthStage : this.wave;
            const kiterAngles =
              stageNum >= 3 ? [-0.2, 0, 0.2] : stageNum === 2 ? [-0.12, 0.12] : [0];
            for (const ang of kiterAngles) {
              const cosA = Math.cos(ang);
              const sinA = Math.sin(ang);
              const spreadDir = new THREE.Vector3(
                dirToPlayer.x * cosA - dirToPlayer.z * sinA,
                0,
                dirToPlayer.x * sinA + dirToPlayer.z * cosA
              ).normalize();
              this.spawnSpellProjectile({
                spellId: 'stupefy',
                casterId: 'enemy',
                origin: _v1.copy(enemy.position).setY(1.4),
                direction: spreadDir,
                damage: this.getScaledEnemyDamage(12),
                qualityPercent: 80,
                colorHex: 0xef4444,
              });
            }
          } else if (enemy.archetype === 'frost_charger') {
            enemy.velocity.copy(dirToPlayer).multiplyScalar(12);
            if (isTargetingLocal && distToPlayer < 4.5) {
              this.damagePlayer(this.getScaledEnemyDamage(14));
            }
          } else if (enemy.archetype === 'wild_boar') {
            enemy.velocity.copy(dirToPlayer).multiplyScalar(11.5);
            if (isTargetingLocal && distToPlayer < 4.1) {
              const boarDmg = this.getScaledEnemyDamage(11);
              this.damagePlayer(boarDmg);
              this.playerSlowTimer = BOAR_SLOW_DURATION_SEC;
              this.lastCastBanner = {
                spellName: `🐗 Удар Дикого Кабана! Замедление -${BOAR_SLOW_PERCENT}% на ${BOAR_SLOW_DURATION_SEC}с`,
                qualityPercent: 100,
                damage: boarDmg,
                detail: '',
                color: '#ea580c',
                timestamp: performance.now(),
              };
            }
          } else {
            if (isTargetingLocal && distToPlayer < 3.8) {
              this.damagePlayer(this.getScaledEnemyDamage(8));
            }
          }
        }
      } else if (enemy.state === 'attack') {
        enemy.stateTimer -= dt;
        if (enemy.stateTimer <= 0) {
          enemy.state = 'seek';
          const baseCadence =
            enemy.archetype === 'boss_mage_3'
              ? enemy.enragedPhase2
                ? 0.94
                : 1.35
              : enemy.archetype === 'boss_elemental_4' || isStage5WormBossArchetype(enemy.archetype)
              ? 1.15
              : enemy.archetype === 'boss_mage_2'
              ? 1.5
              : enemy.archetype === 'boss_mage_1'
              ? 1.9
              : enemy.archetype === 'boss_totem'
              ? 2.2
              : enemy.archetype === 'water_monster'
              ? 2.8
              : enemy.archetype === 'fire_demon'
              ? 2.2
              : enemy.archetype === 'storm_harpy_shooter'
              ? 2.6
              : 2.0 + Math.random() * 1.1;
          const cadenceMult = getDiabloDifficultyMultipliers(
            this.difficultyTier,
            this.labyrinthStage
          ).attackCadenceMultiplier;
          enemy.stateTimer = baseCadence / cadenceMult;
          enemy.strafeDir *= -1;
        }
      }

      if (this.mapMode === 'labyrinth' && enemy.archetype !== 'boss_totem') {
        this.resolveLabyrinthCollisions(enemy.position, 0.85);
      }
      enemy.mesh.position.copy(enemy.position);
    }

    // Only auto-spawn endless waves in Arena mode
    if (this.mapMode === 'arena' && this.enemies.length === 0) {
      this.waveSpawnTimer += dt;
      if (this.waveSpawnTimer > 2.2) {
        this.waveSpawnTimer = 0;
        this.spawnEnemyWave(this.wave + 1);
      }
    }

    // 6. Update Projectiles & Collisions (Walls block all projectiles!)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life -= dt;
      const prevX = proj.position.x;
      const prevZ = proj.position.z;
      proj.position.addScaledVector(proj.velocity, dt);
      proj.mesh.position.copy(proj.position);
      if (!proj.isFireWall && !proj.isArrow) {
        if (proj.mesh.userData?.isDirectionalProjectile) {
          if (proj.mesh.userData?.isSpinningDisc) {
            proj.mesh.rotateY(dt * 14);
          } else if (!proj.mesh.userData?.isFeather) {
            proj.mesh.rotateZ(dt * 4.5);
          }
        } else {
          proj.mesh.rotation.x += dt * 6;
          proj.mesh.rotation.y += dt * 8;
        }
      }

      if (proj.life <= 0) {
        this.scene.remove(proj.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check if player projectile hits an Elemental Rune Button (before wall collision check so wall-mounted buttons can be hit!)
      if (proj.casterId === 'local' && this.runeButtons.length > 0) {
        let hitButton = false;
        for (const btn of this.runeButtons) {
          if (btn.activated) continue;
          const btnCenter = _v1.set(
            btn.position.x,
            btn.spec.mount === 'wall' ? btn.position.y : 0.7,
            btn.position.z
          );
          if (proj.position.distanceTo(btnCenter) < 1.45) {
            if (proj.spellId === btn.spec.requiredSpellId) {
              this.activateRuneButton(btn.id, false);
            } else {
              this.spawnParticles(proj.position, proj.color.getHex(), 14, 5);
              audioEngine.playHeavyImpact(false);
              this.lastCastBanner = {
                spellName: `🔒 Для этой кнопки нужна магия «${btn.spec.spellLabel}»!`,
                qualityPercent: 100,
                damage: 0,
                detail: '',
                color: btn.spec.colorHex,
                timestamp: performance.now(),
              };
            }
            hitButton = true;
            break;
          }
        }
        if (hitButton) {
          this.scene.remove(proj.mesh);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Check if projectile hit any Labyrinth wall, closed Rune Gate, or player-built Wooden Wall!
      const activeWalls = this.getActiveLabyrinthWalls();
      if (
        activeWalls.length > 0 &&
        segmentHitsWall(
          prevX,
          prevZ,
          proj.position.x,
          proj.position.z,
          activeWalls,
          0.22
        )
      ) {
        this.spawnParticles(proj.position, proj.color.getHex(), 10, 4);
        this.scene.remove(proj.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      let hit = false;

      if (proj.casterId === 'enemy') {
        const hitDistToPlayer = proj.isFireWall
          ? Math.hypot(
              proj.position.x - this.playerPos.x,
              proj.position.z - this.playerPos.z
            )
          : proj.position.distanceTo(this.camera.position);
        const hitThreshold = proj.isFireWall ? 2.15 : proj.isMudBall ? 1.85 : 1.25;

        if (
          this.heldProp &&
          proj.position.distanceTo(this.heldProp.mesh.position) <
            (proj.isFireWall ? 2.2 : proj.isMudBall ? 1.95 : 1.45)
        ) {
          this.spawnParticles(proj.position, 0x38bdf8, 14, 5);
          audioEngine.playHeavyImpact(false);
          this.damagePlayer(proj.damage);
          hit = true;
        } else if (hitDistToPlayer < hitThreshold) {
          this.damagePlayer(proj.damage);
          if (proj.isFireWall) {
            this.playerBurnTimer = 2.0;
            this.playerBurnTickAccum = 0;
            this.lastCastBanner = {
              spellName: `🔥 Огненная стена! -${proj.damage} ОЗ + горение 2 сек.`,
              qualityPercent: 100,
              damage: proj.damage,
              detail: '',
              color: '#f97316',
              timestamp: performance.now(),
            };
          } else if (proj.isMudBall) {
            this.playerSlowTimer = Math.max(this.playerSlowTimer, MUD_BALL_SLOW_DURATION_SEC);
            this.lastCastBanner = {
              spellName: `🟤 Гигантский ком грязи! -${proj.damage} ОЗ и замедление -30% на ${MUD_BALL_SLOW_DURATION_SEC}с!`,
              qualityPercent: 100,
              damage: proj.damage,
              detail: '',
              color: '#a16207',
              timestamp: performance.now(),
            };
          } else if (proj.spellId === 'glacius') {
            this.playerSlowTimer = Math.max(this.playerSlowTimer, 2.0);
          }
          hit = true;
        }
      } else if (proj.casterId === 'local') {
        const isLv6 = (proj.spellLevel ?? 1) >= 6;
        for (const enemy of this.enemies) {
          if (enemy.state === 'ko') continue;
          if (enemy.burrowTimer && enemy.burrowTimer > 0) continue; // Cannot hit Worm Boss or Mud Monster while burrowed underground!
          const hitRadius = enemy.isFlying
            ? 2.35
            : enemy.archetype === 'boss_worm_5_p1'
            ? 2.85
            : enemy.archetype === 'boss_worm_5_p2_fire' || enemy.archetype === 'boss_worm_5_p2_melee'
            ? 2.25
            : isStage5WormBossArchetype(enemy.archetype)
            ? 1.9
            : enemy.archetype === 'boss_elemental_4'
            ? 2.5
            : enemy.archetype === 'boss_mage_3'
            ? 2.35
            : enemy.archetype === 'boss_mage_2'
            ? 2.2
            : enemy.archetype === 'boss_mage_1'
            ? 1.9
            : enemy.archetype === 'stone_crusher' || enemy.archetype === 'cave_bear'
            ? 1.95
            : 1.55;
          const enemyCenter = _v1
            .copy(enemy.position)
            .setY(enemy.isFlying ? enemy.position.y + 0.45 : 1.3);
          if (proj.position.distanceTo(enemyCenter) < hitRadius) {
            const knockMult =
              proj.spellId === 'stupefy' && isLv6
                ? 18
                : proj.spellId === 'expelliarmus'
                ? isLv6
                  ? 15
                  : 10
                : 4;
            const knock =
              enemy.archetype === 'boss_totem' || isStage5WormBossArchetype(enemy.archetype)
                ? new THREE.Vector3()
                : proj.velocity.clone().normalize().multiplyScalar(knockMult);

            if (proj.spellId === 'stupefy') {
              enemy.stunTimer =
                enemy.archetype === 'boss_mage_1' ||
                enemy.archetype === 'boss_mage_2' ||
                enemy.archetype === 'boss_mage_3' ||
                enemy.archetype === 'boss_elemental_4' ||
                isStage5WormBossArchetype(enemy.archetype)
                  ? 1.2
                  : 2.6;
              enemy.state = 'seek';
            }
            if (proj.spellId === 'glacius') {
              enemy.freezeTimer = GLACIUS_SLOW_DURATION_SEC; // 2.0 seconds 30% slow!
              // Level 6 Glacius Awakening: Completely freezes the enemy in ice for 1.0 full second!
              if (isLv6) {
                enemy.stunTimer = Math.max(enemy.stunTimer, 1.0);
                enemy.state = 'seek';
                this.spawnParticles(enemyCenter, 0xe0f2fe, 24, 6.5);
              }
            }
            if (proj.spellId === 'incendio' && isLv6) {
              // Level 6 Incendio Awakening: Explodes on impact in a 4.5m fiery AoE and ignites enemies for 3 seconds!
              enemy.burnTimer = 3.0;
              this.spawnParticles(enemyCenter, 0xf97316, 28, 7.5);
              for (const other of this.enemies) {
                if (other === enemy || other.state === 'ko') continue;
                const dOther = Math.hypot(
                  other.position.x - enemy.position.x,
                  other.position.z - enemy.position.z
                );
                if (dOther <= 4.5) {
                  other.burnTimer = 3.0;
                  this.damageEnemy(
                    other,
                    Math.max(1, Math.round(proj.damage * 0.45)),
                    new THREE.Vector3(),
                    0xf97316,
                    false,
                    'incendio'
                  );
                }
              }
            }
            if (proj.spellId === 'expelliarmus' && isLv6) {
              // Level 6 Expelliarmus Awakening: Chain lightning shockwave arcs to a nearby second enemy!
              for (const other of this.enemies) {
                if (other === enemy || other.state === 'ko') continue;
                const dOther = Math.hypot(
                  other.position.x - enemy.position.x,
                  other.position.z - enemy.position.z
                );
                if (dOther <= 7.5) {
                  this.spawnParticles(
                    _v2.copy(other.position).setY(1.2),
                    0xec4899,
                    18,
                    5.5
                  );
                  this.damageEnemy(
                    other,
                    Math.max(1, Math.round(proj.damage * 0.55)),
                    knock.clone().multiplyScalar(0.5),
                    0xec4899,
                    false,
                    'expelliarmus'
                  );
                  break;
                }
              }
            }

            this.damageEnemy(
              enemy,
              proj.damage,
              knock,
              proj.color.getHex(),
              false,
              proj.spellId,
              Boolean(proj.isPetAttack)
            );
            hit = true;
            break;
          }
        }

        if (!hit && this.callbacks.onMultiplayerHit) {
          for (const [remoteId, entry] of this.remoteMeshes.entries()) {
            const rCenter = _v1.set(entry.data.x, 1.1, entry.data.z);
            if (proj.position.distanceTo(rCenter) < 1.35) {
              this.spawnParticles(proj.position, proj.color.getHex(), 18, 6);
              audioEngine.playHeavyImpact(false);
              this.callbacks.onMultiplayerHit(remoteId, proj.damage);
              this.lastCastBanner = {
                spellName:
                  this.mapMode === 'labyrinth' && this.labyrinthMultiplayerMode === 'shared'
                    ? `⚠️ Осторожно! Попадание по союзнику «${entry.data.name}»: -${proj.damage} ОЗ`
                    : `⚔️ Попадание по магу «${entry.data.name}»: -${proj.damage} ОЗ`,
                qualityPercent: 100,
                damage: proj.damage,
                detail: '',
                color: '#f97316',
                timestamp: performance.now(),
              };
              hit = true;
              break;
            }
          }
        }

        // Check if Fire projectile (`incendio` / `Огонь`) hits an unlit Campfire to ignite it!
        if (!hit && proj.spellId === 'incendio') {
          for (const cf of this.campfires) {
            if (!cf.isLit) {
              const cfCenter = _v1.copy(cf.position).setY(0.5);
              if (proj.position.distanceTo(cfCenter) < 2.2) {
                this.igniteCampfire(cf);
                hit = true;
                break;
              }
            }
          }
        }

        if (!hit) {
          for (const prop of this.props) {
            if (prop.isHeld || prop.explodedTimer > 0) continue;
            const pCenter = _v1.copy(prop.mesh.position).setY(0.6);
            if (proj.position.distanceTo(pCenter) < 1.15) {
              const impulse = proj.velocity.clone().normalize().multiplyScalar(9);
              impulse.y = 4.2;
              prop.velocity.add(impulse);
              this.spawnParticles(pCenter, proj.color.getHex(), 12, 4);
              hit = true;
              break;
            }
          }
        }
      }

      if (hit) {
        this.scene.remove(proj.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private findNearestAliveEnemy(
    from: THREE.Vector3,
    maxRange: number,
    canHitFlying = false
  ): EnemyActor | null {
    let best: EnemyActor | null = null;
    let bestDist = maxRange;
    for (const e of this.enemies) {
      if (e.state === 'ko') continue;
      if (e.burrowTimer && e.burrowTimer > 0) continue;
      if (e.isFlying && !canHitFlying) continue;
      const d = Math.hypot(e.position.x - from.x, e.position.z - from.z);
      if (d < bestDist) {
        if (
          this.mapMode === 'labyrinth' &&
          segmentHitsWall(from.x, from.z, e.position.x, e.position.z, this.labyrinthWalls, 0.15)
        ) {
          continue;
        }
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  private damageEnemy(
    enemy: EnemyActor,
    amount: number,
    knockback: THREE.Vector3,
    colorHex: number,
    fromRemote = false,
    spellId = 'incendio',
    isPetAttack = false
  ) {
    if (enemy.state === 'ko' || enemy.hp <= 0) return;
    // Worm Boss & Mud Monster cannot be hit while burrowed underground ("исчезает под текстуры его нельзя бить")!
    if (enemy.burrowTimer && enemy.burrowTimer > 0) return;
    if (enemy.state === 'idle') enemy.state = 'seek';

    // Stage 5 Skeleton Hammer & Shield takes almost no damage (85% reduction) while Shield Guard is active!
    if (enemy.archetype === 'skeleton_hammer_shield' && enemy.shieldGuardActive) {
      amount = Math.max(1, Math.round(amount * SKELETON_SHIELD_DAMAGE_MULTIPLIER));
      this.spawnParticles(_v1.copy(enemy.position).setY(1.2), 0x38bdf8, 8, 3.5);
    }

    const reconciled = reconcileSharedEnemyDamage(enemy.hp, enemy.maxHp, amount);
    enemy.hp = reconciled.nextHp;

    // Check Stage 5 Worm Boss 3-Phase Splitting at <= 30% HP ("Фаза 2 - после 30% ХП -> 2x", "Фаза 3 - после 30% ХП среднего -> 4x")!
    let splitTriggered = false;
    const splitChildren = isStage5WormBossArchetype(enemy.archetype)
      ? getWormBossSplitChildren(enemy.archetype)
      : null;
    if (
      splitChildren &&
      splitChildren.length === 2 &&
      !enemy.hasSplitWorm &&
      enemy.hp <= enemy.maxHp * WORM_SPLIT_HP_RATIO
    ) {
      enemy.hasSplitWorm = true;
      enemy.hp = 0;
      splitTriggered = true;

      const basePos = enemy.position.clone();
      const offsets = [-2.6, 2.6];
      splitChildren.forEach((childArchetype, idx) => {
        const spawnX = basePos.x + offsets[idx];
        const spawnZ = basePos.z + (idx === 0 ? -1.2 : 1.2);
        const childPos = new THREE.Vector3(spawnX, 0, spawnZ);
        if (this.mapMode === 'labyrinth') {
          this.resolveLabyrinthCollisions(childPos, 0.85);
        }
        const childId = `${enemy.id}_split_${childArchetype}_${idx}`;
        const childActor = this.spawnSingleEnemy(
          childArchetype,
          childPos,
          this.enemies.length + idx,
          this.labyrinthStage,
          childId
        );
        childActor.state = 'seek';
      });

      this.spawnParticles(_v1.copy(basePos).setY(1.8), 0xf97316, 42, 9.0);
      this.spawnParticles(_v1.copy(basePos).setY(1.8), 0xfacc15, 34, 8.0);
      audioEngine.playHeavyImpact(true);
      this.lastCastBanner = {
        spellName:
          enemy.archetype === 'boss_worm_5_p1'
            ? '🪱 БОСС ЧЕРВЬ (30% ОЗ) РАЗДЕЛИЛСЯ НА 2 СРЕДНИХ ЧЕРВЕЙ (ФАЗА 2)!'
            : '🪱 СРЕДНИЙ ЧЕРВЬ (30% ОЗ) РАЗДЕЛИЛСЯ НА 2 МАЛЫХ ЧЕРВЕЙ (ФАЗА 3)!',
        qualityPercent: 100,
        damage: amount,
        detail: '',
        color: '#f97316',
        timestamp: performance.now(),
      };
    }

    if (enemy.archetype !== 'boss_totem' && !isStage5WormBossArchetype(enemy.archetype)) {
      enemy.velocity.x += knockback.x;
      enemy.velocity.z += knockback.z;
    }
    enemy.hitFlashTimer = 0.06;
    this.drawEnemyHpBarCanvas(
      enemy.hpBarCanvas,
      enemy.hpBarTexture,
      enemy.name,
      enemy.hp,
      enemy.maxHp
    );

    // Broadcast shared enemy/boss hit to co-op partner in 'shared' Labyrinth mode!
    if (
      !fromRemote &&
      this.mapMode === 'labyrinth' &&
      this.labyrinthMultiplayerMode === 'shared' &&
      this.callbacks.onMultiplayerEnemyHit
    ) {
      this.callbacks.onMultiplayerEnemyHit({
        hitId: `ehit_${enemy.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        enemyId: enemy.id,
        stage: this.labyrinthStage,
        damage: Math.max(1, Math.round(amount)),
        maxHp: enemy.maxHp,
        x: Number(enemy.position.x.toFixed(2)),
        y: Number(enemy.position.y.toFixed(2)),
        z: Number(enemy.position.z.toFixed(2)),
        spellId,
        stunSec: Number(enemy.stunTimer.toFixed(2)),
        freezeSec: Number(enemy.freezeTimer.toFixed(2)),
      });
    }

    const isKill = reconciled.isFirstKill || splitTriggered;
    this.hitstopTimer = isPetAttack ? (isKill ? 0.04 : 0) : isKill ? 0.06 : 0.035;
    this.cameraTrauma = Math.min(
      1,
      this.cameraTrauma + (isPetAttack ? (isKill ? 0.12 : 0.02) : isKill ? 0.35 : 0.14)
    );
    this.spawnParticles(
      _v1.copy(enemy.position).setY(enemy.isFlying ? enemy.position.y + 0.45 : 1.2),
      colorHex,
      isKill ? 24 : isPetAttack ? 6 : 12,
      isKill ? 7 : 4.5
    );
    if (isPetAttack) {
      audioEngine.playPetImpact(isKill);
    } else {
      audioEngine.playHeavyImpact(isKill);
    }

    if (isKill) {
      enemy.state = 'ko';
      enemy.koTimer = 0.42;
      if (enemy.burrowWarningRing) {
        enemy.burrowWarningRing.visible = false;
      }
      const isBoss =
        enemy.archetype === 'boss_mage_1' ||
        enemy.archetype === 'boss_mage_2' ||
        enemy.archetype === 'boss_mage_3' ||
        enemy.archetype === 'boss_elemental_4' ||
        isStage5WormBossArchetype(enemy.archetype);
      this.score += isBoss ? 500 : enemy.isFlying ? 150 * this.wave : 100 * this.wave;
      this.bestScore = Math.max(this.bestScore, this.score);
      this.enemiesDefeated += 1;

      this.spawnLootDrop(enemy.position, enemy.lootId);
      // Mutant Rats (`rat_swarmer`) also drop Raw Rat Meat (`rat_meat`) for cooking at the Campfire!
      if (enemy.archetype === 'rat_swarmer') {
        this.spawnLootDrop(
          _v2.copy(enemy.position).add(new THREE.Vector3(0.85, 0, 0.35)),
          'rat_meat'
        );
      }
      // Wild Boars (`wild_boar`) drop both Boar Tusk (`boar_tusk` for 4th/5th Staff) AND Raw Boar Meat (`boar_meat` for superior Boar Food)!
      if (enemy.archetype === 'wild_boar') {
        this.spawnLootDrop(
          _v2.copy(enemy.position).add(new THREE.Vector3(0.85, 0, 0.35)),
          'boar_meat'
        );
      }
      // Stage 5 Cave Bears (`cave_bear`) drop Bear Meat (`bear_meat`) + an extra Boar Tusk!
      if (enemy.archetype === 'cave_bear') {
        this.spawnLootDrop(
          _v2.copy(enemy.position).add(new THREE.Vector3(0.85, 0, 0.35)),
          'boar_tusk'
        );
      }
      // Stage 4 Water Monsters (`water_monster`) drop Water (`water_essence`) AND Raw Bat Meat (`bat_meat`) for Mana Food cooking!
      if (enemy.archetype === 'water_monster') {
        this.spawnLootDrop(
          _v2.copy(enemy.position).add(new THREE.Vector3(0.85, 0, -0.35)),
          'bat_meat'
        );
      }
      // Flying creatures (`sky_dive_gargoyle` & `storm_harpy_shooter`) also drop Raw Bat Meat (`bat_meat`) for cooking at the Campfire!
      if (enemy.isFlying && enemy.archetype !== 'boss_elemental_4') {
        this.spawnLootDrop(
          _v2.copy(enemy.position).add(new THREE.Vector3(-0.85, 0, 0.35)),
          'bat_meat'
        );
      }
      // Stage 4 Tri-Elemental Boss drops all 3 Elemental Essences!
      if (enemy.archetype === 'boss_elemental_4') {
        this.spawnLootDrop(
          _v2.copy(enemy.position).add(new THREE.Vector3(-1.1, 0, 0.4)),
          'water_essence'
        );
        this.spawnLootDrop(
          _v2.copy(enemy.position).add(new THREE.Vector3(1.1, 0, 0.4)),
          'earth_essence'
        );
      }
      if (isBoss) {
        this.spawnLootDrop(
          _v2.copy(enemy.position).add(new THREE.Vector3(1.2, 0, 0)),
          'dark_core_shard'
        );
      }

      // 10-step XP gradation across Maps 1..5 (Difficulty 1) and Maps 6..10 (Difficulty 2 / Diablo)!
      const xpReward = evaluateEnemyKillXp(
        enemy.archetype,
        this.labyrinthStage,
        this.difficultyTier
      );
      this.callbacks.onXpGain(xpReward);
      if (this.activeTamedPet) {
        this.activeTamedPet.petXp += isBoss ? 40 : 15;
      }
      this.callbacks.onQuestEvent('mob_kill', 1);
      if (enemy.archetype === 'wild_boar') {
        this.callbacks.onQuestEvent('kill_boar', 1);
      }
      if (
        enemy.archetype === 'fire_demon' ||
        enemy.archetype === 'water_monster' ||
        enemy.archetype === 'stone_crusher' ||
        enemy.archetype === 'boss_elemental_4'
      ) {
        this.callbacks.onQuestEvent('kill_elemental', 1);
      }
      if (
        enemy.archetype === 'mud_monster' ||
        enemy.archetype === 'cave_bear' ||
        enemy.archetype === 'skeleton_archer' ||
        enemy.archetype === 'skeleton_hammer_shield' ||
        this.labyrinthStage === 5
      ) {
        if (!isBoss) {
          this.callbacks.onQuestEvent('defeat_stage5_mob', 1);
        }
      }
      if (enemy.isFlying) {
        this.callbacks.onQuestEvent('kill_flying', 1);
      }
      if (isBoss && !splitTriggered) {
        this.callbacks.onQuestEvent('kill_boss', 1);
        if (enemy.archetype === 'boss_mage_1' || this.labyrinthStage === 1) {
          this.callbacks.onQuestEvent('defeat_boss_1', 1);
        } else if (enemy.archetype === 'boss_mage_2' || this.labyrinthStage === 2) {
          this.callbacks.onQuestEvent('defeat_boss_2', 1);
        } else if (enemy.archetype === 'boss_mage_3' || this.labyrinthStage === 3) {
          this.callbacks.onQuestEvent('defeat_boss_3', 1);
        } else if (enemy.archetype === 'boss_elemental_4' || this.labyrinthStage === 4) {
          this.callbacks.onQuestEvent('defeat_boss_4', 1);
        }
        if (
          isStage5WormBossArchetype(enemy.archetype) &&
          isStageBossDefeated(this.enemies, 5)
        ) {
          this.callbacks.onQuestEvent('defeat_boss_5', 1);
          this.callbacks.onWormBossDefeated?.();
        }
      }
    }
  }

  private damagePlayer(amount: number) {
    if (this.testInvulnerable) {
      return;
    }
    const artBonuses = getCombinedArtifactBonuses(this.equippedArtifacts);
    if (artBonuses.evasionPercent > 0 && Math.random() * 100 < artBonuses.evasionPercent) {
      this.spawnParticles(_v1.copy(this.playerPos).setY(1.2), 0x38bdf8, 18, 4.5);
      this.lastCastBanner = {
        spellName: `🛡️ Уклонение мантии (${artBonuses.evasionPercent}%)! Урон не прошёл!`,
        qualityPercent: 100,
        damage: 0,
        detail: '',
        color: '#38bdf8',
        timestamp: performance.now(),
      };
      return;
    }

    if (artBonuses.damageReductionPercent > 0) {
      amount = Math.max(
        1,
        Math.round(amount * (1 - artBonuses.damageReductionPercent / 100))
      );
    }

    if (this.heldProp) {
      // Base shield held in hand gives 50% damage reduction (`SHIELD_BASE_DAMAGE_MULTIPLIER = 0.5`)!
      // At Level 6 Wingardium Awakening, shield absorbs 75% (0.25x damage taken).
      const dmgMult = this.activeWingardiumLevel >= 6 ? 0.25 : SHIELD_BASE_DAMAGE_MULTIPLIER;
      amount = Math.max(1, Math.round(amount * dmgMult));
    }
    this.tookDamageThisStage = true;
    this.hp = Math.max(0, this.hp - amount);
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.42);
    audioEngine.playPlayerHurt();

    if (this.hp <= 0 && this.mode === 'playing') {
      this.mode = 'gameover';
      audioEngine.playDefeatSting();
      this.callbacks.onGameOver(false, {
        score: this.score,
        wave: this.wave,
        enemiesDefeated: this.enemiesDefeated,
      });
    }
  }

  private updateParticles(dt: number) {
    let anyUpdated = false;
    for (let i = 0; i < this.maxParticles; i++) {
      if (this.particleLife[i] > 0) {
        this.particleLife[i] -= dt;
        const i3 = i * 3;
        if (this.particleLife[i] <= 0) {
          _dummyObj.position.set(0, -100, 0);
          _dummyObj.scale.setScalar(0.001);
        } else {
          this.particleVel[i3 + 1] -= 9.8 * dt;
          this.particlePos[i3] += this.particleVel[i3] * dt;
          this.particlePos[i3 + 1] += this.particleVel[i3 + 1] * dt;
          this.particlePos[i3 + 2] += this.particleVel[i3 + 2] * dt;

          const ratio = this.particleLife[i] / (this.particleMaxLife[i] || 1);
          _dummyObj.position.set(
            this.particlePos[i3],
            this.particlePos[i3 + 1],
            this.particlePos[i3 + 2]
          );
          _dummyObj.scale.setScalar(this.particleScale[i] * ratio);
        }
        _dummyObj.updateMatrix();
        this.particleMesh.setMatrixAt(i, _dummyObj.matrix);
        anyUpdated = true;
      }
    }
    if (anyUpdated) {
      this.particleMesh.instanceMatrix.needsUpdate = true;
    }
  }

  private getCampfireHudStatus(): 'none' | 'unlit_nearby' | 'lit_in_aura' | 'lit_nearby' {
    let status: 'none' | 'unlit_nearby' | 'lit_in_aura' | 'lit_nearby' = 'none';
    for (const cf of this.campfires) {
      const d = Math.hypot(cf.position.x - this.playerPos.x, cf.position.z - this.playerPos.z);
      if (cf.isLit) {
        if (d <= CAMPFIRE_HEAL_RADIUS) {
          return 'lit_in_aura';
        }
        if (d <= 8.5) {
          status = 'lit_nearby';
        }
      } else if (d <= 6.5 && status === 'none') {
        status = 'unlit_nearby';
      }
    }
    return status;
  }

  private getNearbyInteractPrompt(): string | null {
    for (const cf of this.campfires) {
      const d = Math.hypot(cf.position.x - this.playerPos.x, cf.position.z - this.playerPos.z);
      if (cf.isLit && d <= CAMPFIRE_HEAL_RADIUS + 0.6) {
        return `[E] Готовить у костра (Зелья и Мясные блюда)`;
      }
      if (!cf.isLit && d <= 5.0) {
        return `Костёр сложен — выстрелите заклинанием «Огонь» [1], чтобы зажечь!`;
      }
    }
    for (const chest of this.chests) {
      if (chest.opened && !chest.looted && chest.position.distanceTo(this.playerPos) <= 4.5) {
        return `[E] Взять добычу: ${chest.spec.label}`;
      }
      if (!chest.opened && chest.position.distanceTo(this.playerPos) <= 4.2) {
        return `[E] Открыть и осмотреть: ${chest.spec.label}`;
      }
    }
    for (const animal of this.animals) {
      if (animal.position.distanceTo(this.playerPos) < 4.5) {
        if (!animal.isTamed) {
          return `[E] Приручить питомца: ${animal.name} (${animal.title}) — можно выбрать только 1`;
        }
      }
    }
    for (const drop of this.lootDrops) {
      if (drop.position.distanceTo(this.playerPos) < 4.2) {
        return `[E] Подобрать: ${REAGENTS[drop.reagentId].name}`;
      }
    }
    for (const node of this.harvestNodes) {
      if (node.cooldown <= 0 && node.position.distanceTo(this.playerPos) < 4.5) {
        return `[E] Собрать: ${node.name} (${REAGENTS[node.reagentId].name})`;
      }
    }
    return null;
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public pushHudSnapshot() {
    const activeGolem = this.props.find((p) => p.isPet);
    const totalLabyrinthSpan = Math.max(1, this.labyrinthStartZ - this.labyrinthGoalPos.z);
    const currentAdvanced = Math.max(0, this.labyrinthStartZ - this.playerPos.z);
    const labyrinthProgressPercent = Math.min(
      100,
      Math.max(0, Math.round((currentAdvanced / totalLabyrinthSpan) * 100))
    );
    const distanceToGoal = Math.round(this.playerPos.distanceTo(this.labyrinthGoalPos));

    const activeWormBosses = this.enemies.filter(
      (e) => e.state !== 'ko' && isStage5WormBossArchetype(e.archetype)
    );
    const activeBoss = this.enemies.find(
      (e) =>
        e.state !== 'ko' &&
        (e.archetype === 'boss_mage_1' ||
          e.archetype === 'boss_mage_2' ||
          e.archetype === 'boss_mage_3' ||
          e.archetype === 'boss_elemental_4')
    );
    const totemsAlive = this.enemies.filter(
      (e) => e.state !== 'ko' && e.archetype === 'boss_totem'
    ).length;

    let bossHudInfo: { name: string; hp: number; maxHp: number; totemsAlive: number } | null =
      null;
    if (activeWormBosses.length > 0) {
      // Only show the Boss HP bar once the player starts damaging the Worm Boss (or after it splits into Phase 2/3)!
      const hasStartedFightingWorm =
        activeWormBosses.length > 1 ||
        activeWormBosses.some((w) => w.hp < w.maxHp || w.archetype !== 'boss_worm_5_p1');
      if (hasStartedFightingWorm) {
        const totalWormHp = activeWormBosses.reduce((sum, w) => sum + Math.max(0, w.hp), 0);
        const totalWormMaxHp = activeWormBosses.reduce((sum, w) => sum + w.maxHp, 0);
        const label =
          activeWormBosses.length === 1
            ? activeWormBosses[0].name
            : `🪱 Древний Червь Катакомб (Частей: ${activeWormBosses.length})`;
        bossHudInfo = {
          name: label,
          hp: Math.round(totalWormHp),
          maxHp: Math.round(totalWormMaxHp),
          totemsAlive: 0,
        };
      }
    } else if (activeBoss && activeBoss.hp < activeBoss.maxHp) {
      bossHudInfo = {
        name: activeBoss.name,
        hp: Math.max(0, Math.round(activeBoss.hp)),
        maxHp: activeBoss.maxHp,
        totemsAlive,
      };
    }

    const previewChest = this.chests.find(
      (c) => c.opened && !c.looted && c.contents && c.position.distanceTo(this.playerPos) <= 4.5
    );

    this.callbacks.onHudUpdate({
      mapMode: this.mapMode,
      labyrinthMultiplayerMode: this.labyrinthMultiplayerMode,
      labyrinthStage: this.labyrinthStage,
      difficultyTier: this.difficultyTier,
      hp: Math.round(this.hp),
      maxHp: Math.round(this.maxHp),
      mp: Math.round(this.mp),
      maxMp: Math.round(this.maxMp),
      score: Math.round(this.score),
      bestScore: Math.round(this.bestScore),
      wave: this.wave,
      enemiesAlive: this.enemies.filter((e) => e.state !== 'ko').length,
      labyrinthProgressPercent,
      distanceToGoal,
      bossInfo: bossHudInfo,
      heldObjectName: this.heldProp ? this.heldProp.name : null,
      tamedPet: this.activeTamedPet
        ? {
            species: this.activeTamedPet.species,
            name: this.activeTamedPet.name,
            title: this.activeTamedPet.title,
            level: this.activeTamedPet.level,
            trainingStep: this.activeTamedPet.trainingStep,
            petXp: this.activeTamedPet.petXp,
            petNextXp: this.activeTamedPet.level * 180,
            scale: Number(this.activeTamedPet.scaleMultiplier.toFixed(2)),
            attackDamage: this.activeTamedPet.attackPower,
            engorgioTimeLeft: Number(this.activeTamedPet.engorgioTimer.toFixed(1)),
            passiveBonus: PET_CATALOG[this.activeTamedPet.species].passiveBonus,
          }
        : null,
      transfiguredPetName: activeGolem ? activeGolem.name : null,
      nearbyInteractPrompt: this.getNearbyInteractPrompt(),
      campfireStatus: this.getCampfireHudStatus(),
      campfireWallsCount:
        this.campfires.length > 0
          ? countWallsSurroundingCampfire(
              this.campfires[this.campfires.length - 1].position,
              this.builtWalls
            )
          : 0,
      campfireSheltered:
        this.campfires.length > 0
          ? isCampfireShelteredByWalls(
              this.campfires[this.campfires.length - 1].position,
              this.builtWalls
            )
          : false,
      builtWallsCount: this.builtWalls.length,
      maxBuiltWalls: MAX_BUILT_WALLS,
      aimedWallId: this.getAimedWoodenWall()?.wall.id ?? null,
      activeWallBuildCast: (() => {
        const buildingWall = this.builtWalls.find((w) => !w.isBuilt && w.buildRemainingSec > 0);
        return buildingWall
          ? {
              remainingSec: Number(buildingWall.buildRemainingSec.toFixed(1)),
              totalSec: buildingWall.totalBuildSec,
            }
          : null;
      })(),
      activeFoodBuff: this.activeFoodBuff ? { ...this.activeFoodBuff } : null,
      activeBatFoodBuff: this.activeBatFoodBuff ? { ...this.activeBatFoodBuff } : null,
      aimSurfaceTarget: this.getAimedSurfaceInfo().target,
      activeElementalAlly: this.activeElementalAlly
        ? {
            kind: this.activeElementalAlly.kind,
            name: this.activeElementalAlly.name,
            remainingSec: Math.ceil(this.activeElementalAlly.remainingSec),
            totalDurationSec: this.activeElementalAlly.totalDurationSec,
            attackDamage: this.activeElementalAlly.attackDamage,
          }
        : null,
      activeArcaneSword: this.activeArcaneSword
        ? {
            remainingSec: Number(this.activeArcaneSword.remainingSec.toFixed(1)),
            totalDurationSec: this.activeArcaneSword.totalDurationSec,
            damage: this.activeArcaneSword.damage,
            slashDamage: this.activeArcaneSword.slashDamage,
            level: this.activeArcaneSword.level,
            swingCooldown: Number(this.activeArcaneSword.swingCooldown.toFixed(2)),
            ignites: this.activeArcaneSword.ignites,
            ignitesOnHit: this.activeArcaneSword.ignitesOnHit,
            stuns: this.activeArcaneSword.stuns,
            stunsOnHitSec: this.activeArcaneSword.stunsOnHitSec,
          }
        : null,
      playerFearTimeLeft: Number(this.playerFearTimer.toFixed(1)),
      testInvulnerable: this.testInvulnerable,
      spellCooldowns: { ...this.spellCooldowns },
      openChestPreview:
        previewChest && previewChest.contents
          ? {
              chestId: previewChest.id,
              label: previewChest.spec.label,
              reagents: previewChest.contents.reagents,
              artifactId: previewChest.contents.artifactId,
            }
          : null,
      campfireTeleportCast: this.campfireTeleportChannel
        ? {
            active: true,
            remainingSec: Number(this.campfireTeleportChannel.remainingSec.toFixed(1)),
            totalSec: this.campfireTeleportChannel.totalSec,
            qualityPercent: this.campfireTeleportChannel.qualityPercent,
          }
        : null,
      lastCastBanner:
        this.lastCastBanner && performance.now() - this.lastCastBanner.timestamp < 2400
          ? this.lastCastBanner
          : null,
    });
  }

  private tick = () => {
    if (this.disposed) return;

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);

    if (this.mode === 'title') {
      this.titlePanTime += dt * 0.28;
      if (this.mapMode === 'labyrinth') {
        this.camera.position.set(
          Math.sin(this.titlePanTime) * 16,
          6.5 + Math.sin(this.titlePanTime * 1.5) * 1.2,
          82 + Math.cos(this.titlePanTime) * 12
        );
        this.camera.lookAt(0, 1.5, 58);
      } else {
        const r = 21;
        this.camera.position.set(
          Math.sin(this.titlePanTime) * r,
          5.8 + Math.sin(this.titlePanTime * 1.7) * 1.1,
          Math.cos(this.titlePanTime) * r
        );
        this.camera.lookAt(0, 1.8, -4);
      }
      this.fpRig.visible = false;
    } else if (this.mode === 'playing') {
      this.fpRig.visible = true;
      if (this.hitstopTimer > 0) {
        this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      } else {
        this.updateSimulation(dt);
      }
      this.updateParticles(dt);

      // Throttle HUD updates to ~10Hz
      this.hudSyncAccum += dt;
      if (this.hudSyncAccum >= 0.1) {
        this.hudSyncAccum = 0;
        this.pushHudSnapshot();
      }

      this.netSyncAccum += dt;
      if (this.netSyncAccum >= 0.12 && this.callbacks.onMultiplayerMove) {
        this.netSyncAccum = 0;
        this.callbacks.onMultiplayerMove({
          x: Number(this.playerPos.x.toFixed(2)),
          y: 0,
          z: Number(this.playerPos.z.toFixed(2)),
          rotY: Number(this.yaw.toFixed(2)),
          hp: Math.round(this.hp),
          maxHp: Math.round(this.maxHp),
          shieldActive: Boolean(this.heldProp),
        });
      }

      this.enemySyncAccum += dt;
      if (
        this.enemySyncAccum >= 0.28 &&
        this.mapMode === 'labyrinth' &&
        this.labyrinthMultiplayerMode === 'shared' &&
        this.remoteMeshes.size > 0 &&
        this.callbacks.onMultiplayerEnemySync
      ) {
        this.enemySyncAccum = 0;
        const activeEnemies = this.enemies
          .filter((e) => e.state !== 'idle' || e.hp < e.maxHp)
          .map((e) => ({
            id: e.id,
            hp: Math.max(0, Math.round(e.hp)),
            maxHp: e.maxHp,
            x: Number(e.position.x.toFixed(2)),
            y: Number(e.position.y.toFixed(2)),
            z: Number(e.position.z.toFixed(2)),
            state: e.state,
          }));
        if (activeEnemies.length > 0) {
          this.callbacks.onMultiplayerEnemySync({
            stage: this.labyrinthStage,
            enemies: activeEnemies,
          });
        }
      }
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (
      document.activeElement &&
      (document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA')
    ) {
      return;
    }
    if (!this.keysHeld.has(e.code)) {
      this.keysJustPressed.add(e.code);
    }
    this.keysHeld.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.code);
  };

  private onBlur = () => {
    this.keysHeld.clear();
    this.keysJustPressed.clear();
  };

  private onResize = () => {
    if (!this.container || this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('resize', this.onResize);
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
