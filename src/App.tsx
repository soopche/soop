import React, { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  advanceQuestProgress,
  AimSurfaceTarget,
  CAMPFIRE_WOOD_COST,
  CampfireRecipeId,
  CookedBatFoodItem,
  CookedBearFoodItem,
  CookedBoarFoodItem,
  CookedRatFoodItem,
  CraftedPotionItem,
  calculateCookedBatFoodStats,
  calculateCookedBearFoodStats,
  calculateCookedBoarFoodStats,
  calculateCookedRatFoodStats,
  calculateCraftedPotionStats,
  calculateSpellCastStats,
  computePlayerVitalsAfterXpGain,
  claimQuestReward,
  craftEquipmentItem,
  EquipmentId,
  EQUIPMENT_CATALOG,
  evaluateArcaneSwordSpellControl,
  evaluateContextualGesture,
  evaluateGestureAccuracy,
  getActiveSpellGestureInfo,
  INITIAL_QUESTS,
  PET_CATALOG,
  Point2D,
  QuestDef,
  QuestEventType,
  ReagentId,
  REAGENTS,
  CastInputMode,
  SpellId,
  SPELLS,
  SPELL_ORDER,
  TameableSpeciesId,
  canAffordSpellUpgrade,
  consumeSpellUpgradeCost,
  getSpellUpgradeCost,
  canAffordPetTrainingStep,
  consumePetTrainingStepCost,
  getPetTrainingStepCost,
  getSpellCooldownForLevel,
  getSpellHotkeyLabel,
  LABYRINTH_MULTIPLAYER_MODES,
  LabyrinthMultiplayerMode,
  LabyrinthStageId,
  MAX_SPELL_LEVEL,
  SPELL_LEVEL_6_EFFECTS,
  ArtifactId,
  ArtifactSlot,
  ARTIFACT_CATALOG,
  ARTIFACT_SLOT_LABELS,
  collectChestArtifact,
  craftArtifactItem,
  getArtifactOwnedCount,
  salvageArtifactItem,
  CharacterProfileData,
  createDefaultCharacterProfile,
  DIFFICULTY_CATALOG,
  DifficultyTier,
  getDiabloDifficultyMultipliers,
  getUnlockedStageForDifficulty,
  unlockDifficultyOnWormBossKill,
  unlockStageForCharacter,
  WALL_WOOD_COST,
  WALL_BUILD_DURATION_SEC,
  MAX_BUILT_WALLS,
  WALL_DISMANTLE_WOOD_REFUND,
  canBuildWoodenWall,
  calculatePracticeGestureXp,
  upgradeAllSpellsByOneLevel,
  ControlSchemeId,
  resolveControlSchemeCastParams,
  cycleSpellByWheel,
  getLabyrinthStageLayout,
  projectRadarPoint,
  RADAR_CANVAS_SIZE,
  RADAR_PX_PER_METER,
} from './game/spells';
import { audioEngine, VoiceSpellRecognizer } from './game/audio';
import {
  ArcaneWorldEngine,
  GameMapMode,
  GraphicsQuality,
  HudSnapshot,
  RemotePlayerState,
} from './game/world3d';
import { GrimoireModal, GrimoireTab, ItemBadgeIcon } from './components/GrimoireModal';
import {
  connectMqttRoom,
  decodeCharacterCode,
  encodeCharacterCode,
  generateTwoDigitRoomCode,
  getActiveCharacterIdFromStorage,
  getOrCreateGuestDeviceId,
  getOrCreateSessionPlayerId,
  loadLocalCharacters,
  normalizePlayerProfileKey,
  parseTwoDigitRoomCode,
  sanitizeCharacterProfile,
  saveLocalCharacters,
  setActiveCharacterIdInStorage,
  type MqttRoomController,
} from './game/mqttRoom';

const INITIAL_COOLDOWNS: Record<SpellId, number> = {
  incendio: 0,
  wingardium: 0,
  expelliarmus: 0,
  stupefy: 0,
  glacius: 0,
  engorgio: 0,
  vera_verto: 0,
  arcane_sword: 0,
  teleport: 0,
  campfire_teleport: 0,
  cooldown_reset: 0,
};

const INITIAL_SPELL_LEVELS: Record<SpellId, number> = {
  incendio: 1,
  wingardium: 1,
  expelliarmus: 1,
  stupefy: 1,
  glacius: 1,
  engorgio: 1,
  vera_verto: 1,
  arcane_sword: 1,
  teleport: 1,
  campfire_teleport: 1,
  cooldown_reset: 1,
};

interface SpellDockGridProps {
  selectedSpellId: SpellId;
  spellLevels: Record<SpellId, number>;
  aimSurfaceTarget: AimSurfaceTarget;
  spellCooldowns: Record<SpellId, number>;
  onSelectSpell: (spellId: SpellId) => void;
}

const SpellDockGrid = memo(
  function SpellDockGrid({
    selectedSpellId,
    spellLevels,
    aimSurfaceTarget,
    spellCooldowns,
    onSelectSpell,
  }: SpellDockGridProps) {
    const svgPointsBySpell = useMemo(() => {
      const map = {} as Record<SpellId, string>;
      for (const spId of SPELL_ORDER) {
        const dockGesture = getActiveSpellGestureInfo(spId, aimSurfaceTarget);
        map[spId] = dockGesture.templatePoints
          .map((p) => `${Math.round(p.x * 36)},${Math.round(p.y * 36)}`)
          .join(' ');
      }
      return map;
    }, [aimSurfaceTarget]);

    const renderSpellButton = (spId: SpellId) => {
      const sp = SPELLS[spId];
      const isSelected = selectedSpellId === spId;
      const cd = spellCooldowns?.[spId] || 0;
      const maxCd = getSpellCooldownForLevel(spId, spellLevels[spId] || 1);
      const onCooldown = cd > 0.05;
      const svgPoints = svgPointsBySpell[spId];
      const hotkeyLabel = getSpellHotkeyLabel(spId);

      return (
        <button
          key={sp.id}
          type="button"
          data-testid={`spell-dock-btn-${sp.id}`}
          onClick={() => onSelectSpell(sp.id)}
          className={`relative overflow-hidden py-2 px-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            isSelected
              ? 'bg-[#261f3d]'
              : 'bg-[#161321] border-[#2a233d] hover:border-[#4c3d75]'
          }`}
          style={isSelected ? { borderColor: sp.color } : undefined}
        >
          {onCooldown && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-[#09080d]/85 pointer-events-none transition-all duration-100 flex items-center justify-center"
              style={{
                height: `${Math.min(100, (cd / maxCd) * 100)}%`,
              }}
            />
          )}

          <span className="relative text-[11px] font-bold font-mono-num text-[#fde047] leading-none">
            [{hotkeyLabel}]
          </span>

          <svg
            viewBox="0 0 36 36"
            className="relative w-7 h-7 overflow-visible"
            aria-hidden="true"
          >
            {sp.id === 'arcane_sword' ? (
              <g>
                <polygon
                  points="15.8,31.5 15.8,23 14.8,10 18,2.8 21.2,10 20.2,23 20.2,31.5"
                  fill="rgba(251, 191, 36, 0.28)"
                  stroke={sp.color}
                  strokeWidth="2.3"
                  strokeLinejoin="round"
                />
                <line
                  x1="15.8"
                  y1="23"
                  x2="20.2"
                  y2="23"
                  stroke="rgba(245, 158, 11, 0.55)"
                  strokeWidth="1.4"
                  strokeDasharray="1.5 1.5"
                />
              </g>
            ) : sp.id === 'cooldown_reset' ? (
              <g>
                <polyline
                  points={svgPoints}
                  fill="rgba(45, 212, 191, 0.18)"
                  stroke={sp.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="7" cy="5" r="2.2" fill="#fde047" />
              </g>
            ) : (
              <polyline
                points={svgPoints}
                fill="none"
                stroke={sp.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>

          <span
            className={`relative font-bold leading-none whitespace-nowrap ${
              sp.shortWord.length > 8 ? 'text-[9.5px] tracking-tighter' : 'text-xs'
            }`}
            style={{ color: sp.color }}
          >
            {sp.shortWord}
          </span>

          {onCooldown && (
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono-num text-white hud-stroke">
              {Math.ceil(cd)}с
            </span>
          )}
        </button>
      );
    };

    const combatSpells = SPELL_ORDER.slice(0, 4);
    const tacticalSpells = SPELL_ORDER.slice(4, 8);
    const utilitySpells = SPELL_ORDER.slice(8, 11);

    return (
      <div
        data-testid="spell-dock-grid"
        className="w-full p-2 rounded-xl border border-[#3b3154] shadow-2xl flex items-stretch gap-2"
        style={{ backgroundColor: 'rgba(14, 12, 22, 0.92)' }}
      >
        <div
          data-testid="spell-dock-cluster-combat"
          className="flex-[4] grid grid-cols-4 gap-[6px]"
        >
          {combatSpells.map(renderSpellButton)}
        </div>
        <div className="w-px self-stretch my-1 bg-[#3b3154]/85 shrink-0" aria-hidden="true" />
        <div
          data-testid="spell-dock-cluster-tactical"
          className="flex-[4] grid grid-cols-4 gap-[6px]"
        >
          {tacticalSpells.map(renderSpellButton)}
        </div>
        <div className="w-px self-stretch my-1 bg-[#3b3154]/85 shrink-0" aria-hidden="true" />
        <div
          data-testid="spell-dock-cluster-utility"
          className="flex-[3] grid grid-cols-3 gap-[6px]"
        >
          {utilitySpells.map(renderSpellButton)}
        </div>
      </div>
    );
  },
  (prev, next) => {
    if (
      prev.selectedSpellId !== next.selectedSpellId ||
      prev.spellLevels !== next.spellLevels ||
      prev.aimSurfaceTarget !== next.aimSurfaceTarget ||
      prev.onSelectSpell !== next.onSelectSpell
    ) {
      return false;
    }
    for (const spId of SPELL_ORDER) {
      const a = prev.spellCooldowns?.[spId] || 0;
      const b = next.spellCooldowns?.[spId] || 0;
      if ((a > 0.05) !== (b > 0.05) || Math.round(a * 10) !== Math.round(b * 10)) {
        return false;
      }
    }
    return true;
  }
);

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<ArcaneWorldEngine | null>(null);
  const voiceRef = useRef<VoiceSpellRecognizer | null>(null);
  const roomSessionRef = useRef<MqttRoomController | null>(null);

  const initialAutoStart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const initialModeParam =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('mode') === 'arena'
      ? 'arena'
      : 'labyrinth';

  const initialLabyrinthMpMode: LabyrinthMultiplayerMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('coop') === 'parallel'
      ? 'parallel'
      : 'shared';

  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover'>(
    initialAutoStart ? 'playing' : 'title'
  );
  const [mapMode, setMapMode] = useState<GameMapMode>(initialModeParam);
  const [labyrinthMultiplayerMode, setLabyrinthMultiplayerMode] =
    useState<LabyrinthMultiplayerMode>(initialLabyrinthMpMode);
  const [grimoireOpen, setGrimoireOpen] = useState(false);
  const [grimoireTab, setGrimoireTab] = useState<GrimoireTab>('craft');
  const [buildMenuOpen, setBuildMenuOpen] = useState(false);
  const [hudHideStep, setHudHideStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [pauseSubmenu, setPauseSubmenu] = useState<'main' | 'sound' | 'graphics' | 'controls' | 'coop'>('main');
  const [radarVisible, setRadarVisible] = useState(true);
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() =>
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );
  const [showControlsHelp, setShowControlsHelp] = useState(
    initialAutoStart && initialModeParam === 'labyrinth'
  );
  const [muted, setMuted] = useState<boolean>(() => audioEngine.muted);
  const [masterVolume, setMasterVolume] = useState<number>(() =>
    Math.round(audioEngine.getMasterVolume() * 100)
  );
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>('high');
  const [controlScheme, setControlScheme] = useState<ControlSchemeId>(() => {
    try {
      return localStorage.getItem('vox_arcanum_control_scheme_v1') === 'classic'
        ? 'classic'
        : 'alternative';
    } catch {
      return 'alternative';
    }
  });
  const [roomInputCode, setRoomInputCode] = useState('');

  // Player Progression, Inventory & Customization State
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerXp, setPlayerXp] = useState(0);
  const [gestureMasteryLevel, setGestureMasteryLevel] = useState(1);
  const [selectedSpellId, setSelectedSpellId] = useState<SpellId>('incendio');
  const [spellLevels, setSpellLevels] = useState<Record<SpellId, number>>(INITIAL_SPELL_LEVELS);
  const [reagentInventory, setReagentInventory] = useState<Record<ReagentId, number>>({
    ancient_wood: 3,
    mandrake_root: 1,
    rat_hair: 0,
    rat_meat: 2,
    bat_meat: 2,
    boar_meat: 0,
    boar_tusk: 0,
    bear_meat: 0,
    gargoyle_heart: 0,
    harpy_feather: 0,
    dark_core_shard: 0,
    ice_dragon_scale: 0,
    fire_essence: 0,
    water_essence: 0,
    earth_essence: 0,
  });
  const [craftedPotions, setCraftedPotions] = useState<CraftedPotionItem[]>([]);
  const [cookedFoods, setCookedFoods] = useState<
    Array<CookedRatFoodItem | CookedBoarFoodItem | CookedBearFoodItem>
  >([]);
  const [cookedBatFoods, setCookedBatFoods] = useState<CookedBatFoodItem[]>([]);
  const [ownedEquipment, setOwnedEquipment] = useState<EquipmentId[]>(['wand_ollivander']);
  const [equippedStaffId, setEquippedStaffId] = useState<EquipmentId>('wand_ollivander');
  const [ownedArtifacts, setOwnedArtifacts] = useState<ArtifactId[]>([]);
  const [equippedArtifacts, setEquippedArtifacts] = useState<
    Partial<Record<ArtifactSlot, ArtifactId>>
  >({});
  const [quests, setQuests] = useState<QuestDef[]>(INITIAL_QUESTS);
  const [questCompletedBanner, setQuestCompletedBanner] = useState<string | null>(null);

  // Multi-Character & Diablo Difficulty State
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [newCharNameInput, setNewCharNameInput] = useState('');
  const [characters, setCharacters] = useState<CharacterProfileData[]>(() => {
    const existing = loadLocalCharacters('local_guest');
    if (existing.length > 0) return existing;
    const starterId = getOrCreateGuestDeviceId();
    const starter = createDefaultCharacterProfile('local_guest', 'Магистр Арканума', starterId);
    saveLocalCharacters('local_guest', [starter]);
    return [starter];
  });
  const [activeCharacterId, setActiveCharacterId] = useState<string>(() => {
    const storedId = getActiveCharacterIdFromStorage('local_guest');
    const existing = loadLocalCharacters('local_guest');
    if (storedId && existing.some((c) => c.id === storedId)) return storedId;
    return existing[0]?.id || getOrCreateGuestDeviceId();
  });
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyTier>(1);
  const [highestUnlockedDifficulty, setHighestUnlockedDifficulty] = useState<DifficultyTier>(1);
  const [unlockedStageD1, setUnlockedStageD1] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [unlockedStageD2, setUnlockedStageD2] = useState<1 | 2 | 3 | 4 | 5>(1);
  const isApplyingCharacterRef = useRef(false);

  // Push-To-Talk Voice Recognition State ([R] key)
  const [micListening, setMicListening] = useState(false);
  const [voiceSpellMatched, setVoiceSpellMatched] = useState(false);
  const voiceMatchTimerRef = useRef<number | null>(null);
  const [hitMarkerActive, setHitMarkerActive] = useState(false);
  const hitMarkerTimerRef = useRef<number | null>(null);
  const pendingVoiceSpellRef = useRef<{
    spellId: SpellId;
    quality: number;
    timestamp: number;
  } | null>(null);

  // Live HUD State (throttled ~10Hz from 3D engine + immediate sync on Settings actions)
  const [hud, setHud] = useState<HudSnapshot>({
    mapMode: initialModeParam,
    labyrinthMultiplayerMode: initialLabyrinthMpMode,
    labyrinthStage: 1,
    difficultyTier: 1,
    hp: 100,
    maxHp: 100,
    mp: 100,
    maxMp: 100,
    score: 0,
    bestScore: 0,
    wave: 1,
    enemiesAlive: 15,
    labyrinthProgressPercent: 0,
    distanceToGoal: 192,
    bossInfo: null,
    heldObjectName: null,
    tamedPet: null,
    transfiguredPetName: null,
    nearbyInteractPrompt: null,
    openChestPreview: null,
    campfireTeleportCast: null,
    campfireStatus: 'none',
    activeFoodBuff: null,
    activeBatFoodBuff: null,
    aimSurfaceTarget: 'none',
    activeElementalAlly: null,
    activeArcaneSword: null,
    playerFearTimeLeft: 0,
    spellCooldowns: INITIAL_COOLDOWNS,
    lastCastBanner: null,
    radar: null,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // End-of-run frozen snapshot for Victory / Game Over modal
  const [endStats, setEndStats] = useState<{
    victory: boolean;
    score: number;
    best: number;
    wave: number;
    enemiesDefeated: number;
  } | null>(null);

  // Multiplayer MQTT (WebSockets) State
  const [selfPlayerId] = useState(() => getOrCreateSessionPlayerId());
  const [pvpRoom, setPvpRoom] = useState('');
  const [pvpPlayerName, setPvpPlayerName] = useState('Магистр Арканума');
  const [pvpConnected, setPvpConnected] = useState(false);
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayerState[]>([]);
  const shieldActiveRef = useRef(false);

  // In-World Gesture Drawing Overlay State (Right-Click or Shift+Left-Click)
  const gestureOverlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingGestureRef = useRef(false);
  const isSwordSlashDragRef = useRef(false);
  const swordSlashStartXRef = useRef(0);
  const swordSlashFiredDuringDragRef = useRef(false);
  const isLookingDragRef = useRef(false);
  const altSwordNextHandRef = useRef<1 | -1>(1);
  const hasFreeLookInitRef = useRef(false);
  const lastPointerPosRef = useRef({ x: 0, y: 0 });
  const gesturePointsRef = useRef<Point2D[]>([]);
  const altVirtualPenRef = useRef<Point2D>({ x: 110, y: 44 });
  const altEdgeTurnRef = useRef<{ yawRate: number; pitchRate: number }>({
    yawRate: 0,
    pitchRate: 0,
  });
  const exitingPointerLockProgrammaticallyRef = useRef(false);
  const [isTracingRune, setIsTracingRune] = useState(false);

  // Refs to access current React state inside 3D engine / Firestore callbacks without re-mounting
  const stateRef = useRef({
    gameState,
    mapMode,
    labyrinthMultiplayerMode,
    grimoireOpen,
    activeCharacterId,
    playerLevel,
    playerXp,
    gestureMasteryLevel,
    selectedSpellId,
    spellLevels,
    equippedStaffId,
    ownedArtifacts,
    equippedArtifacts,
    selfPlayerId,
    pvpPlayerName,
    controlScheme,
    reagentInventory,
    craftedPotions,
    cookedFoods,
    cookedBatFoods,
  });
  useEffect(() => {
    stateRef.current = {
      gameState,
      mapMode,
      labyrinthMultiplayerMode,
      grimoireOpen,
      activeCharacterId,
      playerLevel,
      playerXp,
      gestureMasteryLevel,
      selectedSpellId,
      spellLevels,
      equippedStaffId,
      ownedArtifacts,
      equippedArtifacts,
      selfPlayerId,
      pvpPlayerName,
      controlScheme,
      reagentInventory,
      craftedPotions,
      cookedFoods,
      cookedBatFoods,
    };
  }, [
    gameState,
    mapMode,
    labyrinthMultiplayerMode,
    grimoireOpen,
    activeCharacterId,
    playerLevel,
    playerXp,
    gestureMasteryLevel,
    selectedSpellId,
    spellLevels,
    equippedStaffId,
    ownedArtifacts,
    equippedArtifacts,
    selfPlayerId,
    pvpPlayerName,
    controlScheme,
    reagentInventory,
    craftedPotions,
    cookedFoods,
    cookedBatFoods,
  ]);

  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const handleSelectControlScheme = useCallback(
    (scheme: ControlSchemeId) => {
      setControlScheme(scheme);
      stateRef.current.controlScheme = scheme;
      worldRef.current?.setControlScheme(scheme);
      try {
        localStorage.setItem('vox_arcanum_control_scheme_v1', scheme);
      } catch {
        // Ignore storage errors
      }
      showToast(
        scheme === 'alternative'
          ? '⚡ Включено Основное управление (Лёгкое): поворот камеры мышью без [ЛКМ], клик [ЛКМ]/[Пробел] — каст 20%, зажать [ПКМ] — рисование руны от жёлтой точки!'
          : '🪄 Включено Классическое управление (дополнительный режим)'
      );
    },
    [showToast]
  );

  const toggleRadar = useCallback(() => {
    setRadarVisible((prev) => {
      const next = !prev;
      worldRef.current?.setRadarEnabled(next);
      return next;
    });
  }, []);

  const tryEngageAlternativePointerLock = useCallback(() => {
    if (
      stateRef.current.controlScheme !== 'alternative' ||
      stateRef.current.gameState !== 'playing' ||
      stateRef.current.grimoireOpen
    ) {
      return;
    }
    if (
      typeof document !== 'undefined' &&
      !document.pointerLockElement &&
      canvasMountRef.current?.requestPointerLock
    ) {
      try {
        const lockPromise = canvasMountRef.current.requestPointerLock() as unknown as
          | Promise<void>
          | undefined;
        if (lockPromise && typeof lockPromise.catch === 'function') {
          lockPromise.catch(() => {});
        }
      } catch {
        // Ignore pointer lock rejection in headless/automated environments
      }
    }
  }, []);

  // Continuous edge-turn fallback in Alternative mode when Pointer Lock is not active so the mouse NEVER hits a dead stop at the screen edge!
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      const isLocked = typeof document !== 'undefined' && document.pointerLockElement !== null;
      if (
        stateRef.current.controlScheme === 'alternative' &&
        stateRef.current.gameState === 'playing' &&
        !stateRef.current.grimoireOpen &&
        !isDrawingGestureRef.current &&
        !isSwordSlashDragRef.current &&
        !isLocked
      ) {
        const { yawRate, pitchRate } = altEdgeTurnRef.current;
        if (yawRate !== 0 || pitchRate !== 0) {
          worldRef.current?.rotateCamera(yawRate * dt, pitchRate * dt);
        }
      } else {
        altEdgeTurnRef.current.yawRate = 0;
        altEdgeTurnRef.current.pitchRate = 0;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Release Pointer Lock automatically when menus/modals open or when switching back to Classic controls
  useEffect(() => {
    const shouldReleaseLock =
      controlScheme !== 'alternative' ||
      gameState !== 'playing' ||
      grimoireOpen ||
      buildMenuOpen ||
      accountModalOpen;
    if (shouldReleaseLock) {
      altEdgeTurnRef.current.yawRate = 0;
      altEdgeTurnRef.current.pitchRate = 0;
    }
    if (
      shouldReleaseLock &&
      typeof document !== 'undefined' &&
      document.pointerLockElement
    ) {
      exitingPointerLockProgrammaticallyRef.current = true;
      try {
        document.exitPointerLock();
      } catch {
        // Ignore pointer lock exit errors
      }
    }
  }, [accountModalOpen, buildMenuOpen, controlScheme, gameState, grimoireOpen]);

  // Apply a CharacterProfileData snapshot into live React & 3D Engine state
  const applyCharacterProfileToState = useCallback((rawProfile: CharacterProfileData) => {
    const profile = sanitizeCharacterProfile(rawProfile, rawProfile.ownerId || 'local_guest');
    const isSameCharWhilePlaying =
      stateRef.current.gameState === 'playing' &&
      stateRef.current.activeCharacterId === profile.id;

    isApplyingCharacterRef.current = true;
    stateRef.current.activeCharacterId = profile.id;
    stateRef.current.playerLevel = profile.playerLevel;
    stateRef.current.playerXp = profile.playerXp;
    setActiveCharacterId(profile.id);
    setPvpPlayerName(profile.name);
    setPlayerLevel(profile.playerLevel);
    setPlayerXp(profile.playerXp);
    setGestureMasteryLevel(profile.gestureMasteryLevel);
    setSelectedDifficulty(profile.selectedDifficulty);
    setHighestUnlockedDifficulty(profile.highestUnlockedDifficulty);
    setUnlockedStageD1(profile.unlockedStageD1);
    setUnlockedStageD2(profile.unlockedStageD2);
    setEquippedStaffId(profile.equippedStaffId);
    setOwnedEquipment(profile.ownedEquipment);
    setOwnedArtifacts(profile.ownedArtifacts);
    setEquippedArtifacts(profile.equippedArtifacts);
    setSpellLevels({ ...INITIAL_SPELL_LEVELS, ...profile.spellLevels });
    setReagentInventory(profile.reagentInventory);
    setCraftedPotions(profile.craftedPotions || []);
    setCookedFoods(profile.cookedFoods || []);
    setCookedBatFoods(profile.cookedBatFoods || []);
    setQuests((prevQuests) =>
      INITIAL_QUESTS.map((q) => {
        if (profile.claimedQuestIds.includes(q.id)) {
          return { ...q, currentCount: q.targetCount, completed: true, claimed: true };
        }
        const existing = isSameCharWhilePlaying
          ? prevQuests.find((pq) => pq.id === q.id)
          : undefined;
        return existing ? { ...existing } : { ...q };
      })
    );

    if (worldRef.current) {
      worldRef.current.setDifficultyTier(profile.selectedDifficulty);
      worldRef.current.setEquippedStaff(profile.equippedStaffId);
      worldRef.current.setEquippedArtifacts(profile.equippedArtifacts);
      worldRef.current.restoreCharacterPet(
        profile.tamedPetSpecies,
        profile.tamedPetLevel,
        profile.tamedPetTrainingStep,
        profile.tamedPetXp
      );
      // Never overwrite current HP/MP if already playing the same character
      worldRef.current.setPlayerBaseLevel(profile.playerLevel, !isSameCharWhilePlaying);
    }

    window.setTimeout(() => {
      isApplyingCharacterRef.current = false;
    }, 60);
  }, []);

  // Load initial local character on first mount
  useEffect(() => {
    const owner = 'local_guest';
    const localChars = loadLocalCharacters(owner);
    const storedActiveId = getActiveCharacterIdFromStorage(owner);
    const chosen = localChars.find((c) => c.id === storedActiveId) || localChars[0];
    if (chosen) {
      applyCharacterProfileToState(chosen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const charactersRef = useRef<CharacterProfileData[]>(characters);
  charactersRef.current = characters;
  const tamedPetRef = useRef(hud.tamedPet);
  tamedPetRef.current = hud.tamedPet;

  // Build current active character profile snapshot & auto-persist to localStorage
  const buildCurrentCharacterSnapshot = useCallback((): CharacterProfileData => {
    const owner = 'local_guest';
    const currentHighestStage = getUnlockedStageForDifficulty(
      { unlockedStageD1, unlockedStageD2 },
      selectedDifficulty
    );
    const claimedIds = quests.filter((q) => q.claimed).map((q) => q.id);
    const existingChar = charactersRef.current.find((c) => c.id === activeCharacterId);
    const livePet = tamedPetRef.current;
    const petSpecies = livePet?.species || existingChar?.tamedPetSpecies || 'none';
    const petLevel = livePet?.level || existingChar?.tamedPetLevel || 1;
    const petTrainingStep =
      livePet?.trainingStep ?? existingChar?.tamedPetTrainingStep ?? 0;
    const petXp = livePet?.petXp ?? existingChar?.tamedPetXp ?? 0;

    return sanitizeCharacterProfile(
      {
        id: activeCharacterId || 'char_1',
        ownerId: owner,
        name: pvpPlayerName || 'Магистр Арканума',
        playerLevel,
        playerXp,
        gestureMasteryLevel,
        highestUnlockedStage: currentHighestStage,
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
        craftedPotions,
        cookedFoods,
        cookedBatFoods,
        tamedPetSpecies: petSpecies,
        tamedPetLevel: petLevel,
        tamedPetTrainingStep: petTrainingStep,
        tamedPetXp: petXp,
        claimedQuestIds: claimedIds,
        updatedAtMs: Date.now(),
      },
      owner
    );
  }, [
    unlockedStageD1,
    unlockedStageD2,
    selectedDifficulty,
    quests,
    activeCharacterId,
    pvpPlayerName,
    playerLevel,
    playerXp,
    gestureMasteryLevel,
    highestUnlockedDifficulty,
    equippedStaffId,
    ownedEquipment,
    ownedArtifacts,
    equippedArtifacts,
    spellLevels,
    reagentInventory,
    craftedPotions,
    cookedFoods,
    cookedBatFoods,
  ]);

  useEffect(() => {
    if (isApplyingCharacterRef.current) return;
    const timerId = window.setTimeout(() => {
      if (isApplyingCharacterRef.current) return;
      const owner = 'local_guest';
      const updatedSnap = buildCurrentCharacterSnapshot();
      setCharacters((prev) => {
        const exists = prev.some((c) => c.id === updatedSnap.id);
        const nextList = exists
          ? prev.map((c) => (c.id === updatedSnap.id ? updatedSnap : c))
          : [updatedSnap, ...prev];
        saveLocalCharacters(owner, nextList);
        setActiveCharacterIdInStorage(owner, updatedSnap.id);
        return nextList;
      });
    }, 600);
    return () => {
      window.clearTimeout(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeCharacterId,
    pvpPlayerName,
    playerLevel,
    playerXp,
    gestureMasteryLevel,
    selectedDifficulty,
    highestUnlockedDifficulty,
    unlockedStageD1,
    unlockedStageD2,
    equippedStaffId,
    ownedEquipment,
    ownedArtifacts,
    equippedArtifacts,
    spellLevels,
    reagentInventory,
    craftedPotions,
    cookedFoods,
    cookedBatFoods,
  ]);

  const handleManualSaveCharacter = useCallback(() => {
    const owner = 'local_guest';
    const snap = buildCurrentCharacterSnapshot();
    setCharacters((prev) => {
      const exists = prev.some((c) => c.id === snap.id);
      const next = exists
        ? prev.map((c) => (c.id === snap.id ? snap : c))
        : [snap, ...prev];
      saveLocalCharacters(owner, next);
      return next;
    });
    showToast(`💾 Персонаж «${snap.name}» сохранён локально!`);
  }, [buildCurrentCharacterSnapshot, showToast]);

  const handleCreateNewCharacter = useCallback(
    (customName?: string) => {
      const owner = 'local_guest';
      const cleanName =
        (customName ?? newCharNameInput).trim().slice(0, 40) ||
        `Маг Арканума #${characters.length + 1}`;
      const baseKey = normalizePlayerProfileKey(cleanName);
      const existsLocally = characters.some((c) => c.id === baseKey);
      const targetId = existsLocally
        ? `${baseKey}_${Math.random().toString(36).slice(2, 6)}`.slice(0, 64)
        : baseKey;

      const created = createDefaultCharacterProfile(owner, cleanName, targetId);
      const nextList = [created, ...characters];
      setCharacters(nextList);
      saveLocalCharacters(owner, nextList);
      setActiveCharacterIdInStorage(owner, created.id);
      setNewCharNameInput('');
      applyCharacterProfileToState(created);
      showToast(`✨ Создан новый персонаж: «${created.name}» (Ур. 1)!`);
    },
    [newCharNameInput, characters, applyCharacterProfileToState, showToast]
  );

  const handleLoadCharacterByNameOrCode = useCallback(
    (customNameOrCode?: string) => {
      const owner = 'local_guest';
      const queryInput = (customNameOrCode ?? newCharNameInput).trim();
      if (!queryInput) {
        showToast('Введите имя или код персонажа.');
        return;
      }
      const normalizedKey = normalizePlayerProfileKey(queryInput);
      const found = characters.find(
        (c) =>
          c.id === queryInput ||
          c.id === normalizedKey ||
          c.name.trim().toLowerCase() === queryInput.toLowerCase()
      );
      if (!found) {
        showToast(`Профиль «${queryInput}» не найден — нажмите «+ Добавить персонажа».`);
        return;
      }
      setActiveCharacterIdInStorage(owner, found.id);
      setNewCharNameInput('');
      applyCharacterProfileToState(found);
      showToast(`🧙 Профиль «${found.name}» (Ур. ${found.playerLevel}) загружен!`);
    },
    [newCharNameInput, characters, applyCharacterProfileToState, showToast]
  );

  const handleExportCharacterCode = useCallback(() => {
    const snap = buildCurrentCharacterSnapshot();
    const encoded = encodeCharacterCode(snap);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(encoded)
        .then(() => {
          showToast(`📋 Код мага «${snap.name}» скопирован в буфер обмена!`);
        })
        .catch(() => {
          setNewCharNameInput(encoded);
          showToast(`📋 Код мага «${snap.name}» вставлен в поле — скопируйте его вручную.`);
        });
    } else {
      setNewCharNameInput(encoded);
      showToast(`📋 Код мага «${snap.name}» вставлен в поле — скопируйте его вручную.`);
    }
  }, [buildCurrentCharacterSnapshot, showToast]);

  const handleImportCharacterCode = useCallback(
    (rawOverride?: string) => {
      const owner = 'local_guest';
      const raw = (rawOverride ?? newCharNameInput).trim();
      if (!raw) {
        showToast('Вставьте код мага в поле выше и нажмите «📥 Импорт кода».');
        return;
      }
      const decoded = decodeCharacterCode(raw, owner);
      if (!decoded) {
        showToast('❌ Неверный код мага! Проверьте, что скопировали строку полностью.');
        return;
      }
      const nextList = characters.some((c) => c.id === decoded.id)
        ? characters.map((c) => (c.id === decoded.id ? decoded : c))
        : [decoded, ...characters];
      setCharacters(nextList);
      saveLocalCharacters(owner, nextList);
      setActiveCharacterIdInStorage(owner, decoded.id);
      setNewCharNameInput('');
      applyCharacterProfileToState(decoded);
      showToast(`📥 Импортирован маг «${decoded.name}» (Ур. ${decoded.playerLevel})!`);
    },
    [newCharNameInput, characters, applyCharacterProfileToState, showToast]
  );

  const handleSwitchCharacter = useCallback(
    (charId: string) => {
      const owner = 'local_guest';
      const target = characters.find((c) => c.id === charId);
      if (!target) return;
      setActiveCharacterIdInStorage(owner, target.id);
      applyCharacterProfileToState(target);
      showToast(
        `🧙 Выбран персонаж: «${target.name}» (Ур. ${target.playerLevel}, открыт Этап ${getUnlockedStageForDifficulty(
          target,
          target.selectedDifficulty
        )}/5)`
      );
    },
    [characters, applyCharacterProfileToState, showToast]
  );

  const handleDeleteCharacter = useCallback(
    (charId: string) => {
      const owner = 'local_guest';
      const target = characters.find((c) => c.id === charId);
      const remaining = characters.filter((c) => c.id !== charId);
      let nextList = remaining;
      if (nextList.length === 0) {
        const fresh = createDefaultCharacterProfile(
          owner,
          'Магистр Арканума',
          getOrCreateGuestDeviceId()
        );
        nextList = [fresh];
      }
      setCharacters(nextList);
      saveLocalCharacters(owner, nextList);
      if (activeCharacterId === charId) {
        setActiveCharacterIdInStorage(owner, nextList[0].id);
        applyCharacterProfileToState(nextList[0]);
      }
      showToast(`🗑️ Персонаж «${target?.name || charId}» удалён!`);
    },
    [characters, activeCharacterId, applyCharacterProfileToState, showToast]
  );

  const handleSelectDifficultyTier = useCallback(
    (tier: DifficultyTier) => {
      if (tier === 2 && highestUnlockedDifficulty < 2) {
        showToast(
          '🔒 Сложность II «Кошмар» откроется после победы над финальным Боссом-Червём 5-го уровня!'
        );
        return;
      }
      setSelectedDifficulty(tier);
      worldRef.current?.setDifficultyTier(tier);
      const def = DIFFICULTY_CATALOG[tier];
      showToast(`⚔️ Выбрана ${def.name}!`);
    },
    [highestUnlockedDifficulty, showToast]
  );

  // Selecting a different spell while Arcane Sword is active immediately dismisses the sword!
  // ("Если меняешь заклинание или рисуешь заклинание, меч сразу исчезает")
  const handleSelectSpell = useCallback((nextSpellId: SpellId) => {
    if (
      nextSpellId !== stateRef.current.selectedSpellId &&
      worldRef.current?.hasActiveArcaneSword()
    ) {
      worldRef.current.dismissArcaneSword('⚔️ Меч исчез при смене заклинания');
    }
    setSelectedSpellId(nextSpellId);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2400);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (!questCompletedBanner) return;
    const timer = window.setTimeout(() => setQuestCompletedBanner(null), 4500);
    return () => clearTimeout(timer);
  }, [questCompletedBanner]);

  // Auto-hide Controls Help overlay after 15 seconds
  useEffect(() => {
    if (!showControlsHelp || gameState !== 'playing') return;
    const timer = window.setTimeout(() => setShowControlsHelp(false), 15000);
    return () => clearTimeout(timer);
  }, [showControlsHelp, gameState]);

  const recordQuestEvents = useCallback(
    (events: Array<{ type: QuestEventType; amount?: number }>) => {
      setQuests((prevQuests) => {
        const { updatedQuests, newlyCompleted } = advanceQuestProgress(prevQuests, events);
        if (newlyCompleted.length > 0) {
          audioEngine.playPickupChime();
          const latest = newlyCompleted[newlyCompleted.length - 1];
          setQuestCompletedBanner(
            `✨ Квест выполнен: «${latest.title}»! Заберите награду в Квестах [G]`
          );
        }
        return updatedQuests;
      });
    },
    []
  );

  // Slower player progression: 500 XP * level required per level up.
  // Crucially, killing a monster and gaining XP/leveling up NEVER restores missing HP or MP!
  const grantXp = useCallback((amount: number) => {
    const world = worldRef.current;
    const res = computePlayerVitalsAfterXpGain({
      currentLevel: stateRef.current.playerLevel,
      currentXp: stateRef.current.playerXp,
      gainedXp: amount,
      currentHp: world ? world.hp : 100,
      maxHp: world ? world.maxHp : 100,
      currentMp: world ? world.mp : 100,
      maxMp: world ? world.maxMp : 100,
    });
    stateRef.current.playerXp = res.nextXp;
    setPlayerXp(res.nextXp);
    if (res.levelsGained > 0) {
      stateRef.current.playerLevel = res.nextLevel;
      setPlayerLevel(res.nextLevel);
      if (world) {
        world.setPlayerBaseLevel(res.nextLevel, false);
      }
      audioEngine.playVictoryFanfare();
    }
  }, []);

  /**
   * Executes a spell cast using the updated balance and spell upgrade level (1..6).
   */
  const triggerSpellCast = useCallback(
    (opts: {
      spellId: SpellId;
      castMode: CastInputMode;
      gestureAccuracy: number;
      voiceMatched: boolean;
      voiceQuality?: number;
      spokenLabel?: string;
    }) => {
      const world = worldRef.current;
      if (!world) return;

      // Enforce Arcane Sword spell control rules:
      // - Only VOICE [R] can cast spells while keeping the Arcane Sword active, except Wingardium ("любые кроме левиоса").
      // - Drawing or quick-casting another spell dismisses the Arcane Sword immediately!
      if (world.hasActiveArcaneSword() && opts.spellId !== 'arcane_sword') {
        const swordCtrl = evaluateArcaneSwordSpellControl(
          true,
          opts.spellId,
          opts.castMode,
          false
        );
        if (!swordCtrl.canCast) {
          showToast(swordCtrl.reason);
          return;
        }
        if (!swordCtrl.keepSwordActive) {
          world.dismissArcaneSword(swordCtrl.reason);
        }
      }

      const st = stateRef.current;
      const spell = SPELLS[opts.spellId];
      const isUnlocked =
        st.playerLevel >= spell.unlockLevel || st.equippedStaffId === 'staff_frost_dragon';

      if (!isUnlocked) {
        showToast(`Требуется Ур. ${spell.unlockLevel}`);
        return;
      }

      const spellLevel = st.spellLevels[opts.spellId] || 1;
      const resolvedCast = resolveControlSchemeCastParams({
        controlScheme: st.controlScheme,
        rawCastMode: opts.castMode,
        rawGestureAccuracy: opts.gestureAccuracy,
      });

      const calc = calculateSpellCastStats({
        spellId: opts.spellId,
        castMode: resolvedCast.effectiveCastMode,
        gestureAccuracy: resolvedCast.effectiveGestureAccuracy,
        voiceMatched: opts.voiceMatched,
        voiceQuality: opts.voiceQuality,
        playerLevel: st.playerLevel,
        staffId: st.equippedStaffId,
        infusedReagent: null,
        gestureMasteryLevel: st.gestureMasteryLevel,
        spellLevel,
        equippedArtifacts: st.equippedArtifacts,
      });

      const castVector = world.castSpellInWorld({
        spellId: opts.spellId,
        spellLevel,
        finalDamage: calc.finalDamage,
        healAmount: calc.healAmount,
        manaCost: calc.manaCost,
        cooldownSec: calc.cooldownSec,
        castQualityPercent: calc.castQualityPercent,
        animalScaleMultiplier: calc.animalScaleMultiplier,
        petDamageMultiplier: calc.petDamageMultiplier,
        petDurationSec: calc.petDurationSec,
        projectileCount: calc.projectileCount,
        teleportRange: calc.teleportRange,
        castDurationSec: calc.castDurationSec,
        swordDurationSec: calc.swordDurationSec,
        cooldownReductionPercent: calc.cooldownReductionPercent,
        spellLevels: st.spellLevels,
        detailText: '',
      });

      if (castVector) {
        const castEvents: Array<{ type: QuestEventType; amount?: number }> = [
          { type: 'cast_any', amount: 1 },
        ];
        const isVoice =
          opts.castMode === 'voice' ||
          opts.castMode === 'voice_and_drawn' ||
          Boolean(opts.voiceMatched);
        const isDrawn =
          opts.castMode === 'drawn' ||
          opts.castMode === 'voice_and_drawn' ||
          opts.gestureAccuracy > 0;

        if (isVoice) {
          castEvents.push({ type: 'cast_voice', amount: 1 });
        }
        if (isDrawn) {
          castEvents.push({ type: 'cast_drawn', amount: 1 });
          if (opts.gestureAccuracy >= 85) {
            castEvents.push({ type: 'cast_perfect_drawn', amount: 1 });
          }
        }

        if (opts.spellId === 'incendio') castEvents.push({ type: 'cast_incendio', amount: 1 });
        else if (opts.spellId === 'glacius') castEvents.push({ type: 'cast_glacius', amount: 1 });
        else if (opts.spellId === 'expelliarmus')
          castEvents.push({ type: 'cast_expelliarmus', amount: 1 });
        else if (opts.spellId === 'stupefy') castEvents.push({ type: 'cast_stupefy', amount: 1 });
        else if (opts.spellId === 'wingardium')
          castEvents.push({ type: 'cast_wingardium', amount: 1 });
        else if (opts.spellId === 'vera_verto') castEvents.push({ type: 'cast_heal', amount: 1 });
        else if (opts.spellId === 'engorgio')
          castEvents.push({ type: 'cast_engorgio', amount: 1 });
        else if (opts.spellId === 'teleport' || opts.spellId === 'campfire_teleport')
          castEvents.push({ type: 'cast_teleport', amount: 1 });

        recordQuestEvents(castEvents);
      }

      if (castVector && roomSessionRef.current) {
        roomSessionRef.current.sendSpellCast({
          casterName: st.pvpPlayerName,
          spellId: opts.spellId,
          spellName: spell.name,
          power: calc.finalDamage,
          accuracy: calc.castQualityPercent,
          origin: castVector.origin,
          direction: castVector.direction,
          color: spell.color,
        });
      }
    },
    [recordQuestEvents, showToast]
  );

  // Connect to MQTT over WebSockets Room for cross-device Multiplayer Co-op & PvP Duels
  const connectMultiplayerRoom = useCallback(
    (roomCode: string, wizardName: string) => {
      if (typeof window === 'undefined') return;
      const parsedCode = parseTwoDigitRoomCode(roomCode);
      if (!parsedCode) {
        showToast('Введите 2 цифры кода комнаты (10–99)');
        return;
      }

      if (roomSessionRef.current) {
        roomSessionRef.current.dispose();
        roomSessionRef.current = null;
      }

      setPvpRoom(parsedCode);
      setRemotePlayers([]);
      setPvpConnected(false);

      const controller = connectMqttRoom({
        roomCode: parsedCode,
        playerId: stateRef.current.selfPlayerId,
        playerName: wizardName,
        maxHp: worldRef.current?.maxHp || 100,
        level: stateRef.current.playerLevel,
        staffId: stateRef.current.equippedStaffId,
        labyrinthMode: stateRef.current.labyrinthMultiplayerMode,
        stage: worldRef.current?.labyrinthStage || 1,
        onConnectedChange: (connected) => {
          setPvpConnected(connected);
        },
        onConnectionError: (msg) => {
          showToast(msg);
        },
        onPlayersSync: (list) => {
          const others = list.filter((p) => p.id !== stateRef.current.selfPlayerId);
          setRemotePlayers(others);
          worldRef.current?.syncRemotePlayers(list, stateRef.current.selfPlayerId);
        },
        onModeChanged: (nextMode) => {
          setLabyrinthMultiplayerMode(nextMode);
          worldRef.current?.setLabyrinthMultiplayerMode(nextMode);
          showToast(`Режим комнаты: ${LABYRINTH_MULTIPLAYER_MODES[nextMode].title}`);
        },
        onGameStarted: (data) => {
          setLabyrinthMultiplayerMode('shared');
          worldRef.current?.setLabyrinthMultiplayerMode('shared');
          document.body.dataset.state = 'playing';
          setGrimoireOpen(false);
          setAccountModalOpen(false);
          setEndStats(null);
          setGameState('playing');
          worldRef.current?.resetRun('labyrinth', data.labyrinthStage);
          showToast(
            `🤝 Совместная игра в комнате «${data.room}» началась (Этап ${data.labyrinthStage})!`
          );
        },
        onAllDeadReset: (resetStage) => {
          document.body.dataset.state = 'playing';
          setEndStats(null);
          setGameState('playing');
          worldRef.current?.resetRun('labyrinth', resetStage);
          showToast('💀 Все маги в комнате погибли — враги этапа восстановились!');
        },
        onPlayerDowned: (playerId) => {
          if (playerId !== stateRef.current.selfPlayerId) {
            showToast(
              `⚠️ Союзник пал в бою! Вы ещё живы — враги не восстанавливаются, пока вы держитесь!`
            );
          }
        },
        onSpellSpawned: (data) => {
          if (data.casterId !== stateRef.current.selfPlayerId && worldRef.current) {
            const origin = worldRef.current.playerPos
              .clone()
              .set(data.origin.x, data.origin.y, data.origin.z);
            const dir = worldRef.current.playerPos
              .clone()
              .set(data.direction.x, data.direction.y, data.direction.z);
            worldRef.current.spawnSpellProjectile({
              spellId: (data.spellId as SpellId) || 'incendio',
              casterId: data.casterId,
              origin,
              direction: dir,
              damage: data.power,
              qualityPercent: data.accuracy,
              colorHex: data.color || '#f97316',
            });
          }
        },
        onEnemyDamaged: (data) => {
          if (
            data.attackerId !== stateRef.current.selfPlayerId &&
            stateRef.current.labyrinthMultiplayerMode === 'shared'
          ) {
            worldRef.current?.applyRemoteEnemyDamage({
              enemyId: data.enemyId,
              stage: data.stage || worldRef.current?.labyrinthStage || 1,
              damage: data.damage,
              hp: data.hp,
              maxHp: data.maxHp,
              spellId: data.spellId,
              freezeSec: data.freezeSec,
              stunSec: data.stunSec,
              killed: data.killed,
              x: data.x,
              z: data.z,
            });
          }
        },
        onEnemySynced: (data) => {
          if (
            data.senderId !== stateRef.current.selfPlayerId &&
            stateRef.current.labyrinthMultiplayerMode === 'shared' &&
            Array.isArray(data.enemies)
          ) {
            worldRef.current?.applyRemoteEnemySync(
              data.stage || worldRef.current?.labyrinthStage || 1,
              data.enemies
            );
          }
        },
        onWorldEvent: (ev) => {
          if (stateRef.current.labyrinthMultiplayerMode === 'shared') {
            worldRef.current?.applyRemoteWorldEvent(ev);
          }
        },
        onStageAdvanced: (data) => {
          if (
            data.senderId !== stateRef.current.selfPlayerId &&
            stateRef.current.labyrinthMultiplayerMode === 'shared' &&
            worldRef.current
          ) {
            if (data.victory) {
              worldRef.current.score += 1200;
              worldRef.current.bestScore = Math.max(
                worldRef.current.bestScore,
                worldRef.current.score
              );
              setEndStats({
                victory: true,
                score: worldRef.current.score,
                best: worldRef.current.bestScore,
                wave: 5,
                enemiesDefeated: worldRef.current.enemiesDefeated,
              });
              worldRef.current.setMode('gameover');
              setGameState('gameover');
            } else if (
              data.stage === 2 ||
              data.stage === 3 ||
              data.stage === 4 ||
              data.stage === 5
            ) {
              if (worldRef.current.labyrinthStage < data.stage) {
                worldRef.current.loadMapMode('labyrinth', data.stage, true);
                showToast(`Союзник открыл портал: Этап ${data.stage}/5!`);
              }
            }
          }
        },
        onPlayerDamaged: (data) => {
          if (data.targetId === stateRef.current.selfPlayerId && worldRef.current) {
            const blocked = shieldActiveRef.current;
            const finalDmg = blocked
              ? Math.round(data.damage * 0.5)
              : Math.round(data.damage);
            worldRef.current.applyRemoteDamageToSelf(finalDmg, blocked, data.attackerName);
            roomSessionRef.current?.sendMove({
              x: Number(worldRef.current.playerPos.x.toFixed(2)),
              y: 0,
              z: Number(worldRef.current.playerPos.z.toFixed(2)),
              rotY: Number(worldRef.current.yaw.toFixed(2)),
              hp: Math.round(worldRef.current.hp),
              maxHp: Math.round(worldRef.current.maxHp),
              shieldActive: blocked,
              name: stateRef.current.pvpPlayerName,
              staffId: stateRef.current.equippedStaffId,
              level: stateRef.current.playerLevel,
            });
          }
        },
        onPlayerHealed: (data) => {
          if (data.targetId === stateRef.current.selfPlayerId && worldRef.current) {
            worldRef.current.applyRemoteHealToSelf(data.healAmount, data.healerName);
            roomSessionRef.current?.sendMove({
              x: Number(worldRef.current.playerPos.x.toFixed(2)),
              y: 0,
              z: Number(worldRef.current.playerPos.z.toFixed(2)),
              rotY: Number(worldRef.current.yaw.toFixed(2)),
              hp: Math.round(worldRef.current.hp),
              maxHp: Math.round(worldRef.current.maxHp),
              shieldActive: shieldActiveRef.current,
              name: stateRef.current.pvpPlayerName,
              staffId: stateRef.current.equippedStaffId,
              level: stateRef.current.playerLevel,
            });
            showToast(`💚 ${data.healerName || 'Союзник'} исцелил вас (+${data.healAmount} ОЗ)!`);
          }
        },
        onDuelReset: () => {
          if (worldRef.current) {
            worldRef.current.hp = worldRef.current.maxHp;
            worldRef.current.pushHudSnapshot();
            showToast('🔄 Раунд дуэли сброшен!');
          }
        },
      });

      roomSessionRef.current = controller;
    },
    [showToast]
  );

  // Mount Three.js World Engine once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new ArcaneWorldEngine(canvasMountRef.current, {
      onHudUpdate: (snapshot) => {
        shieldActiveRef.current = Boolean(snapshot.heldObjectName);
        setHud(snapshot);
      },
      onLootCollected: (reagentId, count, reason) => {
        if (count > 0) {
          setReagentInventory((prev) => ({
            ...prev,
            [reagentId]: (prev[reagentId] || 0) + count,
          }));
        }
        showToast(reason);
      },
      onQuestEvent: (eventType, amount = 1) => {
        recordQuestEvents([{ type: eventType, amount }]);
      },
      onXpGain: (xp) => {
        grantXp(xp);
      },
      onPetTamedOrUpgraded: (species, level) => {
        const def = PET_CATALOG[species];
        showToast(`${def.name} (Ур. ${level})`);
      },
      onOpenCampfireCraft: () => {
        setGrimoireTab('inventory');
        setGrimoireOpen(true);
        engine.setMode('paused');
        engine.pushHudSnapshot();
      },
      onStageUnlocked: (nextStage) => {
        setSelectedDifficulty((currDiff) => {
          if (currDiff === 2) {
            setUnlockedStageD2((prev) =>
              (Math.max(prev, nextStage) as 1 | 2 | 3 | 4 | 5)
            );
          } else {
            setUnlockedStageD1((prev) =>
              (Math.max(prev, nextStage) as 1 | 2 | 3 | 4 | 5)
            );
          }
          return currDiff;
        });
      },
      onWormBossDefeated: () => {
        setUnlockedStageD1(5);
        setHighestUnlockedDifficulty((prevDiff) => {
          if (prevDiff < 2) {
            setQuestCompletedBanner(
              '🔥 БОСС-ЧЕРВЬ ПОВЕРЖЕН! Открыта Сложность II: «КОШМАР» (Diablo Nightmare)! Все мобы сильнее 5-го уровня!'
            );
          }
          return 2;
        });
      },
      onChestLooted: (chestSpec, contents) => {
        setReagentInventory((prev) => {
          const next = { ...prev };
          for (const item of contents.reagents) {
            next[item.id] = (next[item.id] || 0) + item.count;
          }
          return next;
        });

        grantXp(30 * chestSpec.stage);

        if (contents.artifactId) {
          const foundArt = ARTIFACT_CATALOG[contents.artifactId];
          const prevOwned = stateRef.current.ownedArtifacts;
          const collected = collectChestArtifact(foundArt.id, prevOwned);
          setOwnedArtifacts(collected.updatedOwned);
          setEquippedArtifacts((prev) => {
            const currentInSlot = prev[foundArt.slot];
            const shouldAutoEquip =
              !currentInSlot || ARTIFACT_CATALOG[currentInSlot].tier < foundArt.tier;
            if (shouldAutoEquip) {
              const nextEq = { ...prev, [foundArt.slot]: foundArt.id };
              engine.setEquippedArtifacts(nextEq);
              return nextEq;
            }
            return prev;
          });
          if (collected.isDuplicate) {
            showToast(
              `🧰 Взято из «${chestSpec.label}»: 2-й одинаковый артефакт «${foundArt.name}» (в наличии ×${collected.newCount} — дубликат можно разобрать на 50% ресурсов!)`
            );
          } else {
            showToast(
              `🧰 Взято из «${chestSpec.label}»: Ресурсы + Артефакт «${foundArt.name}» (Ур. ${foundArt.tier})!`
            );
          }
        } else {
          showToast(`🧰 Взято из «${chestSpec.label}»: ресурсы добавлены в сумку!`);
        }
      },
      onGameOver: (victory, stats) => {
        setEndStats({
          victory,
          score: stats.score,
          best: Math.max(stats.score, engine.bestScore),
          wave: stats.wave,
          enemiesDefeated: stats.enemiesDefeated,
        });
        setGameState('gameover');
        if (
          !victory &&
          stateRef.current.mapMode === 'labyrinth' &&
          stateRef.current.labyrinthMultiplayerMode === 'shared'
        ) {
          roomSessionRef.current?.sendPlayerDied(engine.labyrinthStage);
        }
      },
      onMultiplayerMove: (pos) => {
        roomSessionRef.current?.sendMove({
          ...pos,
          name: stateRef.current.pvpPlayerName,
          staffId: stateRef.current.equippedStaffId,
          level: stateRef.current.playerLevel,
        });
      },
      onMultiplayerHit: (targetId, damage) => {
        roomSessionRef.current?.sendPlayerHit(
          targetId,
          damage,
          stateRef.current.pvpPlayerName
        );
      },
      onMultiplayerHeal: (targetId, healAmount) => {
        roomSessionRef.current?.sendPlayerHeal(
          targetId,
          healAmount,
          stateRef.current.pvpPlayerName
        );
        showToast(`💚 Вы исцелили союзника (+${healAmount} ОЗ)!`);
      },
      onMultiplayerEnemyHit: (payload) => {
        roomSessionRef.current?.sendEnemyHit(payload);
      },
      onMultiplayerEnemySync: (payload) => {
        roomSessionRef.current?.sendEnemySync(payload);
      },
      onMultiplayerStageAdvance: (payload) => {
        roomSessionRef.current?.sendStageAdvance(payload);
      },
      onPlayerEnemyHit: () => {
        setHitMarkerActive(true);
        if (hitMarkerTimerRef.current !== null) {
          window.clearTimeout(hitMarkerTimerRef.current);
        }
        hitMarkerTimerRef.current = window.setTimeout(() => {
          setHitMarkerActive(false);
          hitMarkerTimerRef.current = null;
        }, 120);
      },
      onMultiplayerWorldEvent: (payload) => {
        roomSessionRef.current?.sendWorldEvent(payload);
      },
    });

    worldRef.current = engine;
    engine.setLabyrinthMultiplayerMode(initialLabyrinthMpMode);
    engine.setControlScheme(stateRef.current.controlScheme);
    engine.setRadarEnabled(true);
    (window as unknown as { __voxWorld?: ArcaneWorldEngine }).__voxWorld = engine;
    if (initialModeParam !== 'arena') {
      engine.loadMapMode(initialModeParam);
    }
    if (initialAutoStart) {
      engine.setMode('playing');
    }

    const triggerVoiceMatchFlash = () => {
      setVoiceSpellMatched(true);
      if (voiceMatchTimerRef.current !== null) {
        window.clearTimeout(voiceMatchTimerRef.current);
      }
      voiceMatchTimerRef.current = window.setTimeout(() => {
        setVoiceSpellMatched(false);
        voiceMatchTimerRef.current = null;
      }, 500);
    };

    // Initialize Push-To-Talk Voice Spell Recognizer ([R] key)
    const recognizer = new VoiceSpellRecognizer({
      onSpellRecognized: (spellId, _transcript, quality) => {
        triggerVoiceMatchFlash();
        setSelectedSpellId(spellId);
        pendingVoiceSpellRef.current = {
          spellId,
          quality,
          timestamp: performance.now(),
        };

        if (stateRef.current.gameState === 'playing' && !stateRef.current.grimoireOpen) {
          triggerSpellCast({
            spellId,
            castMode: 'voice',
            gestureAccuracy: 0,
            voiceMatched: true,
            voiceQuality: quality,
            spokenLabel: SPELLS[spellId].shortWord,
          });
        }
      },
      onTranscriptUpdate: () => {},
      onStatusChange: (listening) => {
        setMicListening(listening);
      },
    });
    voiceRef.current = recognizer;

    const handleBeforeUnload = () => {
      roomSessionRef.current?.dispose();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      if (voiceMatchTimerRef.current !== null) {
        window.clearTimeout(voiceMatchTimerRef.current);
        voiceMatchTimerRef.current = null;
      }
      if (hitMarkerTimerRef.current !== null) {
        window.clearTimeout(hitMarkerTimerRef.current);
        hitMarkerTimerRef.current = null;
      }
      recognizer.stop();
      roomSessionRef.current?.dispose();
      roomSessionRef.current = null;
      engine.dispose();
    };
  }, [
    connectMultiplayerRoom,
    grantXp,
    initialAutoStart,
    initialLabyrinthMpMode,
    initialModeParam,
    recordQuestEvents,
    showToast,
    triggerSpellCast,
  ]);

  const handleSelectLabyrinthMultiplayerMode = useCallback(
    (nextMode: LabyrinthMultiplayerMode) => {
      setLabyrinthMultiplayerMode(nextMode);
      worldRef.current?.setLabyrinthMultiplayerMode(nextMode);
      roomSessionRef.current?.sendSetMode(
        nextMode,
        worldRef.current?.labyrinthStage || 1
      );
      showToast(`Выбран режим: ${LABYRINTH_MULTIPLAYER_MODES[nextMode].title}`);
    },
    [showToast]
  );

  const toggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    if (gameState !== 'title') return;
    const onFirstTitlePointer = (e: PointerEvent) => {
      if (document.fullscreenElement) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.closest('[data-testid="title-fullscreen-btn"]')) return;
      document.documentElement.requestFullscreen?.().catch(() => {});
    };
    window.addEventListener('pointerdown', onFirstTitlePointer, { once: true });
    return () => window.removeEventListener('pointerdown', onFirstTitlePointer);
  }, [gameState]);

  const handleStartGameWithMode = useCallback(
    (
      targetMode: GameMapMode,
      customLabyrinthMpMode?: LabyrinthMultiplayerMode,
      initialStage: LabyrinthStageId = 1
    ) => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
      if (customLabyrinthMpMode) {
        setLabyrinthMultiplayerMode(customLabyrinthMpMode);
        worldRef.current?.setLabyrinthMultiplayerMode(customLabyrinthMpMode);
        roomSessionRef.current?.sendSetMode(customLabyrinthMpMode, initialStage);
      }
      setMapMode(targetMode);
      document.body.dataset.state = 'playing';
      setGrimoireOpen(false);
      setEndStats(null);
      setHudHideStep(0);
      setShowControlsHelp(targetMode === 'labyrinth' && initialStage !== 0);
      setGameState('playing');
      if (worldRef.current) {
        worldRef.current.resetRun(targetMode, initialStage);
      }
    },
    []
  );

  const handleRestartGame = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    document.body.dataset.state = 'playing';
    setGrimoireOpen(false);
    const wasVictory = Boolean(endStats?.victory);
    setEndStats(null);
    setHudHideStep(0);
    setShowControlsHelp(stateRef.current.mapMode === 'labyrinth');
    setGameState('playing');
    // In Shared Co-op, if a player died (not victory), respawning keeps shared enemies & walls intact!
    if (
      !wasVictory &&
      stateRef.current.mapMode === 'labyrinth' &&
      stateRef.current.labyrinthMultiplayerMode === 'shared' &&
      worldRef.current
    ) {
      worldRef.current.respawnInPlaceWithoutReset();
      roomSessionRef.current?.sendPlayerRespawn(worldRef.current.maxHp);
      showToast('✨ Вы возродились у костра! Общие враги и стены сохранены.');
    } else {
      worldRef.current?.resetRun(stateRef.current.mapMode);
    }
  }, [endStats, showToast]);

  useEffect(() => {
    if (gameState !== 'paused') {
      setPauseSubmenu('main');
    }
  }, [gameState]);

  const handleTogglePause = useCallback(() => {
    setPauseSubmenu('main');
    setGameState((prev) => {
      if (prev === 'playing') {
        worldRef.current?.setMode('paused');
        return 'paused';
      }
      if (prev === 'paused') {
        worldRef.current?.setMode('playing');
        return 'playing';
      }
      return prev;
    });
  }, []);

  // Push-To-Talk Microphone Handler ([R] key or HUD button)
  const handlePushToTalkTrigger = useCallback(() => {
    if (!voiceRef.current) return;
    if (micListening) {
      voiceRef.current.stop();
    } else if (voiceRef.current.isSupported()) {
      voiceRef.current.startPushToTalk();
    } else {
      // Fallback in browsers without Web Speech API: cast active spell by voice word
      const sp = SPELLS[stateRef.current.selectedSpellId];
      triggerSpellCast({
        spellId: sp.id,
        castMode: 'voice',
        gestureAccuracy: 0,
        voiceMatched: true,
        voiceQuality: 100,
        spokenLabel: sp.shortWord,
      });
    }
  }, [micListening, triggerSpellCast]);

  // Build unlit campfire from 3 Firewood (`ancient_wood`); only 1 campfire can exist at a time (new one replaces old)
  const handlePlaceCampfire = useCallback(() => {
    const woodCount = stateRef.current.reagentInventory.ancient_wood || 0;
    if (woodCount < CAMPFIRE_WOOD_COST) {
      showToast(`Нужно ${CAMPFIRE_WOOD_COST} дрова (сейчас: ${woodCount}). Срубите тис [E]!`);
      return;
    }
    const res = worldRef.current?.placeCampfire();
    if (res) {
      setReagentInventory((prev) => {
        const next = {
          ...prev,
          ancient_wood: Math.max(0, (prev.ancient_wood || 0) - CAMPFIRE_WOOD_COST),
        };
        stateRef.current.reagentInventory = next;
        return next;
      });
      showToast(
        '🪵 Костёр сложен! Зажгите Огнём [1] · Окружите 3 стенами [B] для регена ×2 · Заклинание «Домой» — [F]!'
      );
    }
  }, [showToast]);

  // Build a Wooden Palisade Wall (`Стена` [B]) from 2 Firewood (`ancient_wood`); builds in 2.0s, max 12 walls on map
  const handlePlaceWall = useCallback(() => {
    const woodCount = stateRef.current.reagentInventory.ancient_wood || 0;
    const currentWalls = worldRef.current?.builtWalls.length ?? 0;
    const check = canBuildWoodenWall(woodCount, currentWalls);
    if (!check.allowed) {
      showToast(check.reason || 'Невозможно построить стену');
      return;
    }
    const wall = worldRef.current?.placeWoodenWall();
    if (wall) {
      setReagentInventory((prev) => {
        const next = {
          ...prev,
          ancient_wood: Math.max(0, (prev.ancient_wood || 0) - WALL_WOOD_COST),
        };
        stateRef.current.reagentInventory = next;
        return next;
      });
      showToast(
        `🧱 Строительство стены (${WALL_BUILD_DURATION_SEC} сек)... Стены: ${
          currentWalls + 1
        }/${MAX_BUILT_WALLS} (сломать и вернуть +${WALL_DISMANTLE_WOOD_REFUND} дрова — [N])`
      );
    }
  }, [showToast]);

  // Dismantle / break player-built Wooden Wall aimed at by crosshair (`Сломать стену по наведению` [N]) and refund +1 Firewood (`ancient_wood`)
  const handleDismantleWall = useCallback(() => {
    const totalBuilt = worldRef.current?.builtWalls.length ?? 0;
    if (totalBuilt === 0) {
      showToast('На карте нет построенных стен для разбора!');
      return;
    }
    const removed = worldRef.current?.dismantleNearestWoodenWall();
    if (!removed) {
      showToast('🎯 Наведите прицел на построенную стену, чтобы сломать её [N]!');
      return;
    }
    setReagentInventory((prev) => {
      const next = {
        ...prev,
        ancient_wood: (prev.ancient_wood || 0) + WALL_DISMANTLE_WOOD_REFUND,
      };
      stateRef.current.reagentInventory = next;
      return next;
    });
    const remaining = worldRef.current?.builtWalls.length ?? 0;
    showToast(
      `🔨 Стена разобрана! Возвращено +${WALL_DISMANTLE_WOOD_REFUND} Дрова (осталось стен: ${remaining}/${MAX_BUILT_WALLS})`
    );
  }, [showToast]);

  const handleUsePotion = useCallback(
    (potionId: string) => {
      const pot = stateRef.current.craftedPotions.find((p) => p.id === potionId);
      if (!pot) return;
      setCraftedPotions((prev) => {
        const next = prev.filter((p) => p.id !== potionId);
        stateRef.current.craftedPotions = next;
        return next;
      });
      worldRef.current?.applyCraftedPotion(pot);
      showToast(
        `Выпито: ${pot.name} (+${pot.restoreAmount} ${
          pot.kind === 'health' ? 'ОЗ' : 'МП'
        })`
      );
    },
    [showToast]
  );

  const handleEatFood = useCallback(
    (foodId: string) => {
      const food = stateRef.current.cookedFoods.find((f) => f.id === foodId);
      if (!food) return;
      setCookedFoods((prev) => {
        const next = prev.filter((f) => f.id !== foodId);
        stateRef.current.cookedFoods = next;
        return next;
      });
      worldRef.current?.applyCookedFoodBuff(food);
      showToast(
        `Съедено: ${food.name} (+${food.bonusMaxHp} Макс. ОЗ и +${food.hpRegenPerSec} ОЗ/с на ${Math.round(
          food.durationSec / 60
        )} мин)`
      );
    },
    [showToast]
  );

  const handleEatBatFood = useCallback(
    (foodId: string) => {
      const batFood = stateRef.current.cookedBatFoods.find((f) => f.id === foodId);
      if (!batFood) return;
      setCookedBatFoods((prev) => {
        const next = prev.filter((f) => f.id !== foodId);
        stateRef.current.cookedBatFoods = next;
        return next;
      });
      worldRef.current?.applyCookedBatFoodBuff(batFood);
      showToast(
        `Съедено: ${batFood.name} (+${batFood.bonusMaxMp} Макс. МП и +${batFood.mpRegenPerSec} МП/с на ${Math.round(
          batFood.durationSec / 60
        )} мин)`
      );
    },
    [showToast]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }

      if (gameState === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleStartGameWithMode(mapMode);
        return;
      }

      if (e.code === 'Escape') {
        if (buildMenuOpen) {
          setBuildMenuOpen(false);
          return;
        }
        if (grimoireOpen) {
          setGrimoireOpen(false);
          worldRef.current?.setMode('playing');
          return;
        }
        handleTogglePause();
        return;
      }

      if (e.code === 'KeyP' && !grimoireOpen && gameState !== 'title') {
        handleTogglePause();
        return;
      }

      if (
        (e.code === 'KeyM' || e.key === 'ь' || e.key === 'Ь') &&
        gameState === 'playing' &&
        !grimoireOpen &&
        !accountModalOpen &&
        !e.repeat
      ) {
        e.preventDefault();
        toggleRadar();
        return;
      }

      // 5-state progressive [H] HUD visibility cycle:
      // Step 0 -> Step 1: hide top-right panel
      // Step 1 -> Step 2: also hide top-left panel
      // Step 2 -> Step 3: also hide bottom spell dock & [ . ] hint
      // Step 3 -> Step 4: also hide rune drawing contour canvas (keep crosshair reticle!)
      // Step 4 -> Step 0: restore full HUD
      if (e.code === 'KeyH' && gameState === 'playing' && !e.repeat) {
        e.preventDefault();
        setHudHideStep((prev) => ((prev + 1) % 5) as 0 | 1 | 2 | 3 | 4);
        return;
      }

      // [I], [U], [Y] Grimoire Tab Hotkeys (Work during gameplay and switch/toggle tabs when Grimoire is open)
      if ((gameState === 'playing' || grimoireOpen) && !e.repeat) {
        if (e.code === 'KeyI') {
          e.preventDefault();
          setBuildMenuOpen(false);
          setShowControlsHelp(false);
          if (grimoireOpen && grimoireTab === 'inventory') {
            setGrimoireOpen(false);
            worldRef.current?.setMode('playing');
          } else {
            setGrimoireTab('inventory');
            setGrimoireOpen(true);
            worldRef.current?.setMode('paused');
            worldRef.current?.pushHudSnapshot();
          }
          return;
        }
        if (e.code === 'KeyU') {
          e.preventDefault();
          setBuildMenuOpen(false);
          setShowControlsHelp(false);
          if (grimoireOpen && grimoireTab === 'spells') {
            setGrimoireOpen(false);
            worldRef.current?.setMode('playing');
          } else {
            setGrimoireTab('spells');
            setGrimoireOpen(true);
            worldRef.current?.setMode('paused');
            worldRef.current?.pushHudSnapshot();
          }
          return;
        }
        if (e.code === 'KeyY') {
          e.preventDefault();
          setBuildMenuOpen(false);
          setShowControlsHelp(false);
          if (grimoireOpen && grimoireTab === 'quests') {
            setGrimoireOpen(false);
            worldRef.current?.setMode('playing');
          } else {
            setGrimoireTab('quests');
            setGrimoireOpen(true);
            worldRef.current?.setMode('paused');
            worldRef.current?.pushHudSnapshot();
          }
          return;
        }
      }

      const allowSpellHotkeysInTraining = grimoireOpen && grimoireTab === 'training';
      if ((gameState === 'playing' && !grimoireOpen) || allowSpellHotkeysInTraining) {
        if (gameState === 'playing' && !grimoireOpen) {
          // Period [.] ('Period' / 'NumpadDecimal' / '.' / 'ю') toggles Controls Help overlay anytime!
          if (
            (e.code === 'Period' ||
              e.code === 'NumpadDecimal' ||
              e.key === '.' ||
              e.key === 'ю' ||
              e.key === 'Ю') &&
            !e.repeat
          ) {
            e.preventDefault();
            setShowControlsHelp((prev) => !prev);
            return;
          }

          // Pressing any action or movement key dismisses the Controls Help overlay immediately and engages Pointer Lock in Alternative mode
          if (
            e.code === 'KeyW' ||
            e.code === 'KeyA' ||
            e.code === 'KeyS' ||
            e.code === 'KeyD' ||
            e.code === 'ArrowUp' ||
            e.code === 'ArrowDown' ||
            e.code === 'ArrowLeft' ||
            e.code === 'ArrowRight' ||
            e.code === 'KeyQ' ||
            e.code === 'KeyT' ||
            e.code === 'KeyE' ||
            e.code === 'KeyR' ||
            e.code === 'KeyF' ||
            e.code === 'KeyG' ||
            e.code === 'KeyC' ||
            e.code === 'KeyB' ||
            e.code === 'KeyN' ||
            e.code === 'KeyZ' ||
            e.code === 'KeyX' ||
            e.code === 'KeyV' ||
            e.code === 'Space' ||
            e.code === 'Backquote' ||
            e.code === 'Tab' ||
            e.code === 'CapsLock' ||
            /^Digit[1-6]$/.test(e.code)
          ) {
            if (showControlsHelp) {
              setShowControlsHelp(false);
            }
            tryEngageAlternativePointerLock();
          }
        }

        // Hotkey [Tab] selects Heal ('vera_verto') and prevents browser focus from leaving canvas
        if (e.code === 'Tab') {
          e.preventDefault();
          if (!e.repeat) {
            handleSelectSpell('vera_verto');
          }
          return;
        }

        // Hotkey [CapsLock] selects Arcane Sword ('arcane_sword')
        if (e.code === 'CapsLock') {
          e.preventDefault();
          if (!e.repeat) {
            handleSelectSpell('arcane_sword');
          }
          return;
        }

        // Hotkey [Ё] (`Backquote`) selects Teleport spell
        if (
          e.code === 'Backquote' ||
          e.key === 'ё' ||
          e.key === 'Ё' ||
          e.key === '`' ||
          e.key === '~'
        ) {
          e.preventDefault();
          handleSelectSpell('teleport');
          return;
        }

        // Hotkey [F] (`KeyF`) selects 10th spell: Teleport to Nearest Campfire ('campfire_teleport')
        if (e.code === 'KeyF' && !e.repeat) {
          e.preventDefault();
          handleSelectSpell('campfire_teleport');
          return;
        }

        // Hotkey [G] (`KeyG`) selects 11th spell: Cooldown Reset ('cooldown_reset')
        if (e.code === 'KeyG' && !e.repeat) {
          e.preventDefault();
          handleSelectSpell('cooldown_reset');
          return;
        }

        // Hotkeys 1..6 select first 6 spells ([1] Огонь .. [6] Рост)
        const digitMatch = e.code.match(/^Digit([1-6])$/);
        if (digitMatch) {
          const idx = Number(digitMatch[1]) - 1;
          const spId = SPELL_ORDER[idx];
          if (spId) {
            handleSelectSpell(spId);
          }
          return;
        }
      }

      if (gameState === 'playing' && !grimoireOpen) {

        // [R] Push-To-Talk Microphone ONLY (Voice casting is exclusively on [R])
        if (e.code === 'KeyR' && !e.repeat) {
          e.preventDefault();
          handlePushToTalkTrigger();
          return;
        }

        // [Space] Quick Cast without drawing (in 'alternative' control scheme: 80% combat power or swings active Arcane Sword!)
        if (e.code === 'Space' && !e.repeat) {
          e.preventDefault();
          if (
            stateRef.current.controlScheme === 'alternative' &&
            worldRef.current?.hasActiveArcaneSword() &&
            stateRef.current.selectedSpellId === 'arcane_sword'
          ) {
            const dir = altSwordNextHandRef.current;
            altSwordNextHandRef.current = dir === 1 ? -1 : 1;
            worldRef.current.swingArcaneSword(dir);
            return;
          }
          const sp = SPELLS[stateRef.current.selectedSpellId];
          triggerSpellCast({
            spellId: sp.id,
            castMode: 'quick',
            gestureAccuracy: 0,
            voiceMatched: false,
          });
          return;
        }

        // [C] Build Campfire from Firewood (3 Дрова)
        if (e.code === 'KeyC' && !e.repeat) {
          e.preventDefault();
          handlePlaceCampfire();
          return;
        }

        // [B] Build Wooden Palisade Wall (2 Дрова · builds in 2s · max 12 walls)
        if (e.code === 'KeyB' && !e.repeat) {
          e.preventDefault();
          handlePlaceWall();
          return;
        }

        // [N] Break / Dismantle Nearest Wooden Wall (+1 Дрова refund)
        if (e.code === 'KeyN' && !e.repeat) {
          e.preventDefault();
          handleDismantleWall();
          return;
        }

        // [Z] Drink Health Potion
        if (e.code === 'KeyZ' && !e.repeat) {
          e.preventDefault();
          const hpPot = stateRef.current.craftedPotions.find((p) => p.kind === 'health');
          if (hpPot) {
            handleUsePotion(hpPot.id);
          } else {
            showToast('Нет готового Зелья Здоровья (сварите у костра [I])');
          }
          return;
        }

        // [Shift+X] Upgrade all spells by +1 level (press 5 times to reach max Level 6 for testing)
        if (
          e.shiftKey &&
          (e.code === 'KeyX' ||
            e.code === 'BracketLeft' ||
            e.key === 'x' ||
            e.key === 'X' ||
            e.key === 'х' ||
            e.key === 'Х') &&
          !e.repeat
        ) {
          e.preventDefault();
          setSpellLevels((prev) => {
            const next = upgradeAllSpellsByOneLevel(prev);
            const sampleLvl = next.incendio || 1;
            audioEngine.playPickupChime();
            showToast(
              sampleLvl >= MAX_SPELL_LEVEL
                ? `⚡ Все способности прокачаны на максимум (Ур. ${MAX_SPELL_LEVEL}/${MAX_SPELL_LEVEL}) [Shift+X]!`
                : `⬆️ Все способности +1 уровень (теперь Ур. ${sampleLvl}/${MAX_SPELL_LEVEL}) [Shift+X]!`
            );
            return next;
          });
          return;
        }

        // [X] Drink Mana Potion
        if (e.code === 'KeyX' && !e.shiftKey && !e.repeat) {
          e.preventDefault();
          const mpPot = stateRef.current.craftedPotions.find((p) => p.kind === 'mana');
          if (mpPot) {
            handleUsePotion(mpPot.id);
          } else {
            showToast('Нет готового Зелья Маны (сварите у костра [I])');
          }
          return;
        }

        // [V] Eat Cooked Rat/Boar/Bear Meal or Roasted Bat
        if (e.code === 'KeyV' && !e.repeat) {
          e.preventDefault();
          const food = stateRef.current.cookedFoods[0];
          const batFood = stateRef.current.cookedBatFoods[0];
          if (food) {
            handleEatFood(food.id);
          } else if (batFood) {
            handleEatBatFood(batFood.id);
          } else {
            showToast('Нет готовой еды (приготовьте жаркое у костра [I])');
          }
          return;
        }

        // [O / Щ] Toggle Temporary Test Invulnerability ("добавь временную кнопку неуязвимости на кнопке O щ для тестов, я нажимаю и я полностью неуязвим")
        if (
          (e.code === 'KeyO' ||
            e.key === 'o' ||
            e.key === 'O' ||
            e.key === 'щ' ||
            e.key === 'Щ') &&
          !e.repeat
        ) {
          e.preventDefault();
          const active = worldRef.current?.toggleTestInvulnerability();
          showToast(
            active
              ? '🛡️ Режим полной неуязвимости ВКЛЮЧЕН [O / Щ]'
              : '🛡️ Режим полной неуязвимости ВЫКЛЮЧЕН [O / Щ]'
          );
          return;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyR' && micListening) {
        voiceRef.current?.stop();
      }
    };

    const onPointerLockChange = () => {
      hasFreeLookInitRef.current = false;
      if (typeof document !== 'undefined' && !document.pointerLockElement) {
        if (exitingPointerLockProgrammaticallyRef.current) {
          exitingPointerLockProgrammaticallyRef.current = false;
          return;
        }
        if (
          stateRef.current.controlScheme === 'alternative' &&
          stateRef.current.gameState === 'playing' &&
          !stateRef.current.grimoireOpen
        ) {
          handleTogglePause();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
    };
  }, [
    accountModalOpen,
    buildMenuOpen,
    gameState,
    grimoireOpen,
    grimoireTab,
    handleDismantleWall,
    handleEatBatFood,
    handleEatFood,
    handlePlaceCampfire,
    handlePlaceWall,
    handlePushToTalkTrigger,
    handleSelectSpell,
    handleStartGameWithMode,
    handleTogglePause,
    handleUsePotion,
    mapMode,
    micListening,
    showControlsHelp,
    showToast,
    toggleRadar,
    triggerSpellCast,
    tryEngageAlternativePointerLock,
  ]);

  // 10Hz 2D Top-Down Radar Canvas Renderer (only draws while visible and playing)
  useEffect(() => {
    if (!radarVisible || gameState !== 'playing' || hudHideStep >= 2) return;
    const radar = hud.radar;
    const canvas = radarCanvasRef.current;
    if (!radar || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = RADAR_CANVAS_SIZE;
    const half = size / 2;
    const scale = RADAR_PX_PER_METER;
    ctx.clearRect(0, 0, size, size);

    // Background + perimeter ring
    ctx.fillStyle = 'rgba(10, 12, 20, 0.92)';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(half, half, half - 4, 0, Math.PI * 2);
    ctx.stroke();

    // Nearby labyrinth walls
    if (radar.mapMode === 'labyrinth') {
      const layout = getLabyrinthStageLayout(radar.stage);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
      for (const wb of layout.wallBoxes) {
        const x0 = half + (wb.minX - radar.playerX) * scale;
        const x1 = half + (wb.maxX - radar.playerX) * scale;
        const y0 = half + (wb.minZ - radar.playerZ) * scale;
        const y1 = half + (wb.maxZ - radar.playerZ) * scale;
        if (x1 < 0 || x0 > size || y1 < 0 || y0 > size) continue;
        const rx = Math.max(0, x0);
        const ry = Math.max(0, y0);
        const rw = Math.min(size, x1) - rx;
        const rh = Math.min(size, y1) - ry;
        if (rw > 0.4 && rh > 0.4) {
          ctx.fillRect(rx, ry, Math.max(1.2, rw), Math.max(1.2, rh));
        }
      }
    }

    // Unopened chests (gold)
    ctx.fillStyle = '#facc15';
    for (const ch of radar.unopenedChests) {
      const pt = projectRadarPoint(ch.x, ch.z, radar.playerX, radar.playerZ);
      if (pt.cx >= 2 && pt.cx <= size - 2 && pt.cy >= 2 && pt.cy <= size - 2) {
        ctx.fillRect(pt.cx - 2.5, pt.cy - 2.5, 5, 5);
      }
    }

    // Unactivated rune gate buttons (elemental color dots)
    for (const btn of radar.unactivatedButtons) {
      const pt = projectRadarPoint(btn.x, btn.z, radar.playerX, radar.playerZ);
      if (pt.cx >= 2 && pt.cx <= size - 2 && pt.cy >= 2 && pt.cy <= size - 2) {
        ctx.fillStyle = btn.color;
        ctx.beginPath();
        ctx.arc(pt.cx, pt.cy, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Lit campfire (orange)
    if (radar.litCampfire) {
      const pt = projectRadarPoint(
        radar.litCampfire.x,
        radar.litCampfire.z,
        radar.playerX,
        radar.playerZ
      );
      if (pt.cx >= 2 && pt.cx <= size - 2 && pt.cy >= 2 && pt.cy <= size - 2) {
        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.arc(pt.cx, pt.cy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Finish portal (cyan, clamped to radar edge if far away)
    if (radar.goalPortal) {
      const pt = projectRadarPoint(
        radar.goalPortal.x,
        radar.goalPortal.z,
        radar.playerX,
        radar.playerZ
      );
      let gx = pt.cx;
      let gy = pt.cy;
      const dx = gx - half;
      const dy = gy - half;
      const rPx = Math.hypot(dx, dy);
      if (rPx > half - 6) {
        const k = (half - 6) / rPx;
        gx = half + dx * k;
        gy = half + dy * k;
      }
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(gx, gy, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Remote co-op players (green)
    ctx.fillStyle = '#4ade80';
    for (const rp of radar.remotePlayers) {
      const pt = projectRadarPoint(rp.x, rp.z, radar.playerX, radar.playerZ);
      if (pt.cx >= 2 && pt.cx <= size - 2 && pt.cy >= 2 && pt.cy <= size - 2) {
        ctx.beginPath();
        ctx.arc(pt.cx, pt.cy, 3.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player view cone + white dot at center
    const lookAngle = Math.atan2(-Math.cos(radar.playerYaw), -Math.sin(radar.playerYaw));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.moveTo(half, half);
    ctx.arc(half, half, 17, lookAngle - 0.42, lookAngle + 0.42);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(half, half, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [gameState, hud.radar, hudHideStep, radarVisible]);

  // Draw live rune guide & player mouse stroke on the center HUD overlay canvas
  const renderHudRuneOverlay = useCallback(
    (points: Point2D[], showGuide: boolean) => {
      const canvas = gestureOverlayCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const spell = SPELLS[selectedSpellId];
      const gestureInfo = getActiveSpellGestureInfo(selectedSpellId, hud.aimSurfaceTarget);

      ctx.save();
      ctx.strokeStyle = gestureInfo.isContextual
        ? showGuide
          ? 'rgba(56, 189, 248, 0.45)'
          : 'rgba(56, 189, 248, 0.3)'
        : showGuide
        ? 'rgba(245, 158, 11, 0.38)'
        : 'rgba(245, 158, 11, 0.22)';
      ctx.lineWidth = showGuide ? 3.2 : 2.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      gestureInfo.templatePoints.forEach((pt, i) => {
        const px = pt.x * w;
        const py = pt.y * h;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      const first = gestureInfo.templatePoints[0];
      ctx.fillStyle = gestureInfo.isContextual
        ? showGuide
          ? 'rgba(56, 189, 248, 0.65)'
          : 'rgba(56, 189, 248, 0.5)'
        : showGuide
        ? 'rgba(253, 224, 71, 0.62)'
        : 'rgba(253, 224, 71, 0.45)';
      ctx.beginPath();
      ctx.arc(first.x * w, first.y * h, showGuide ? 4.5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (points.length > 1) {
        ctx.save();
        ctx.strokeStyle = spell.color;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        points.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.restore();
      }

      if (showGuide && points.length > 0) {
        const tip = points[points.length - 1];
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = spell.color;
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    },
    [hud.aimSurfaceTarget, selectedSpellId]
  );

  useEffect(() => {
    if (gameState === 'playing') {
      renderHudRuneOverlay(gesturePointsRef.current, isTracingRune);
    }
  }, [gameState, hud.aimSurfaceTarget, isTracingRune, renderHudRuneOverlay, selectedSpellId]);

  const handleViewportWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (gameState !== 'playing' || grimoireOpen) return;
    if (e.deltaY !== 0) {
      const nextSpell = cycleSpellByWheel(stateRef.current.selectedSpellId, e.deltaY);
      handleSelectSpell(nextSpell);
    }
  };

  const handleViewportPointerLeave = () => {
    isLookingDragRef.current = false;
    hasFreeLookInitRef.current = false;
    altEdgeTurnRef.current.yawRate = 0;
    altEdgeTurnRef.current.pitchRate = 0;
  };

  const handleViewportPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gameState !== 'playing' || grimoireOpen) return;

    if (e.button === 2 || e.shiftKey) {
      e.preventDefault();
      if (showControlsHelp) setShowControlsHelp(false);
      isLookingDragRef.current = false;
      altEdgeTurnRef.current.yawRate = 0;
      altEdgeTurnRef.current.pitchRate = 0;
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
      hasFreeLookInitRef.current = true;
      tryEngageAlternativePointerLock();

      // If Arcane Sword is active in hand and `arcane_sword` is selected, RMB performs directional sword slashes!
      if (
        worldRef.current?.hasActiveArcaneSword() &&
        stateRef.current.selectedSpellId === 'arcane_sword'
      ) {
        isSwordSlashDragRef.current = true;
        swordSlashStartXRef.current =
          stateRef.current.controlScheme === 'alternative' ? 0 : e.clientX;
        swordSlashFiredDuringDragRef.current = false;
        return;
      }

      isDrawingGestureRef.current = true;
      setIsTracingRune(true);
      const canvas = gestureOverlayCanvasRef.current;
      if (canvas) {
        if (stateRef.current.controlScheme === 'alternative') {
          // In Alternative Control Scheme:
          // Camera rotation pauses while RMB is held, and the virtual wand pen starts directly on the yellow dot of the center rune stencil!
          const gestureInfo = getActiveSpellGestureInfo(
            stateRef.current.selectedSpellId,
            hud.aimSurfaceTarget
          );
          const first = gestureInfo.templatePoints[0] || { x: 0.5, y: 0.2 };
          const startPt = {
            x: first.x * canvas.width,
            y: first.y * canvas.height,
          };
          altVirtualPenRef.current = { ...startPt };
          gesturePointsRef.current = [startPt];
          renderHudRuneOverlay(gesturePointsRef.current, true);
          worldRef.current?.setWandGestureTraceOffset(first.x, first.y);
        } else {
          const rect = canvas.getBoundingClientRect();
          const pt = {
            x: ((e.clientX - rect.left) / rect.width) * canvas.width,
            y: ((e.clientY - rect.top) / rect.height) * canvas.height,
          };
          gesturePointsRef.current = [pt];
          renderHudRuneOverlay(gesturePointsRef.current, true);
        }
      }
    } else if (e.button === 0) {
      if (showControlsHelp) setShowControlsHelp(false);
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
      hasFreeLookInitRef.current = true;

      if (stateRef.current.controlScheme === 'alternative') {
        tryEngageAlternativePointerLock();

        // In Alternative Control Scheme, LMB click immediately casts the selected spell at 20% power (or swings the Arcane Sword)!
        if (
          worldRef.current?.hasActiveArcaneSword() &&
          stateRef.current.selectedSpellId === 'arcane_sword'
        ) {
          worldRef.current.swingArcaneSword(1);
          return;
        }
        triggerSpellCast({
          spellId: stateRef.current.selectedSpellId,
          castMode: 'quick',
          gestureAccuracy: 0,
          voiceMatched: false,
        });
        return;
      }

      isLookingDragRef.current = true;
    }
  };

  const handleViewportPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gameState !== 'playing' || grimoireOpen) return;

    // Safety guard: if RMB was released outside the window/iframe (so `e.buttons` no longer has bit 2 set and Shift is not held),
    // immediately clear any stuck drawing or sword-slash drag state so the mouse NEVER gets stuck!
    if (
      (isDrawingGestureRef.current || isSwordSlashDragRef.current) &&
      typeof e.buttons === 'number' &&
      (e.buttons & 2) === 0 &&
      !e.shiftKey
    ) {
      isSwordSlashDragRef.current = false;
      swordSlashFiredDuringDragRef.current = false;
      if (isDrawingGestureRef.current) {
        isDrawingGestureRef.current = false;
        setIsTracingRune(false);
        gesturePointsRef.current = [];
        renderHudRuneOverlay([], false);
        worldRef.current?.setWandGestureTraceOffset(0.5, 0.5);
      }
    }

    const isPointerLocked =
      typeof document !== 'undefined' && document.pointerLockElement !== null;
    const rawDx = isPointerLocked
      ? e.nativeEvent.movementX || 0
      : hasFreeLookInitRef.current
      ? e.clientX - lastPointerPosRef.current.x
      : 0;
    const rawDy = isPointerLocked
      ? e.nativeEvent.movementY || 0
      : hasFreeLookInitRef.current
      ? e.clientY - lastPointerPosRef.current.y
      : 0;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    hasFreeLookInitRef.current = true;

    if (isSwordSlashDragRef.current) {
      if (stateRef.current.controlScheme === 'alternative') {
        swordSlashStartXRef.current += rawDx;
        if (Math.abs(swordSlashStartXRef.current) >= 14) {
          const dir: 1 | -1 = swordSlashStartXRef.current >= 0 ? 1 : -1;
          swordSlashStartXRef.current = 0;
          swordSlashFiredDuringDragRef.current = true;
          worldRef.current?.swingArcaneSword(dir);
        }
      } else {
        const dx = e.clientX - swordSlashStartXRef.current;
        if (Math.abs(dx) >= 14) {
          const dir: 1 | -1 = dx >= 0 ? 1 : -1;
          swordSlashStartXRef.current = e.clientX;
          swordSlashFiredDuringDragRef.current = true;
          worldRef.current?.swingArcaneSword(dir);
        }
      }
      return;
    }

    if (isDrawingGestureRef.current) {
      const canvas = gestureOverlayCanvasRef.current;
      if (canvas) {
        let x: number;
        let y: number;
        if (stateRef.current.controlScheme === 'alternative') {
          const clampedDx = Math.max(-220, Math.min(220, rawDx));
          const clampedDy = Math.max(-220, Math.min(220, rawDy));
          // Move the virtual wand pen directly from the yellow starting dot along the center rune stencil while camera aim stays locked!
          altVirtualPenRef.current.x = Math.max(
            -16,
            Math.min(canvas.width + 16, altVirtualPenRef.current.x + clampedDx)
          );
          altVirtualPenRef.current.y = Math.max(
            -16,
            Math.min(canvas.height + 16, altVirtualPenRef.current.y + clampedDy)
          );
          x = altVirtualPenRef.current.x;
          y = altVirtualPenRef.current.y;
        } else {
          const rect = canvas.getBoundingClientRect();
          x = ((e.clientX - rect.left) / rect.width) * canvas.width;
          y = ((e.clientY - rect.top) / rect.height) * canvas.height;
        }
        gesturePointsRef.current.push({ x, y });
        renderHudRuneOverlay(gesturePointsRef.current, true);
        worldRef.current?.setWandGestureTraceOffset(x / canvas.width, y / canvas.height);
      }
    } else if (stateRef.current.controlScheme === 'alternative') {
      if (!isPointerLocked && (buildMenuOpen || accountModalOpen)) {
        altEdgeTurnRef.current.yawRate = 0;
        altEdgeTurnRef.current.pitchRate = 0;
        return;
      }
      // In Alternative Control Scheme, moving the mouse rotates the camera smoothly without needing to hold LMB!
      const lookDx = Math.max(-90, Math.min(90, rawDx));
      const lookDy = Math.max(-90, Math.min(90, rawDy));
      if (lookDx !== 0 || lookDy !== 0) {
        worldRef.current?.rotateCamera(lookDx * 0.0042, lookDy * 0.0034);
      }
      // When Pointer Lock is not yet active, also update edge-turn rates near the viewport edges so the camera never hits a dead stop!
      if (!isPointerLocked && typeof window !== 'undefined') {
        const edgeMargin = 42;
        const w = Math.max(320, window.innerWidth);
        const h = Math.max(240, window.innerHeight);
        let yawRate = 0;
        let pitchRate = 0;
        if (e.clientX <= edgeMargin) {
          yawRate = -((edgeMargin - e.clientX) / edgeMargin) * 2.1;
        } else if (e.clientX >= w - edgeMargin) {
          yawRate = ((e.clientX - (w - edgeMargin)) / edgeMargin) * 2.1;
        }
        if (e.clientY <= edgeMargin) {
          pitchRate = -((edgeMargin - e.clientY) / edgeMargin) * 1.1;
        } else if (e.clientY >= h - edgeMargin) {
          pitchRate = ((e.clientY - (h - edgeMargin)) / edgeMargin) * 1.1;
        }
        altEdgeTurnRef.current.yawRate = yawRate;
        altEdgeTurnRef.current.pitchRate = pitchRate;
      } else {
        altEdgeTurnRef.current.yawRate = 0;
        altEdgeTurnRef.current.pitchRate = 0;
      }
    } else if (isLookingDragRef.current) {
      worldRef.current?.rotateCamera(rawDx * 0.0045, rawDy * 0.0038);
    }
  };

  const handleViewportPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button === 0 && isLookingDragRef.current) {
      isLookingDragRef.current = false;
      return;
    }

    isLookingDragRef.current = false;

    if (isSwordSlashDragRef.current) {
      isSwordSlashDragRef.current = false;
      if (!swordSlashFiredDuringDragRef.current) {
        const dir: 1 | -1 =
          stateRef.current.controlScheme === 'alternative'
            ? -1
            : e.clientX - swordSlashStartXRef.current < -4
            ? -1
            : 1;
        worldRef.current?.swingArcaneSword(dir);
      }
      swordSlashFiredDuringDragRef.current = false;
      return;
    }

    if (isDrawingGestureRef.current) {
      isDrawingGestureRef.current = false;
      setIsTracingRune(false);
      worldRef.current?.setWandGestureTraceOffset(0.5, 0.5);

      const pts = gesturePointsRef.current;
      gesturePointsRef.current = [];
      renderHudRuneOverlay([], false);

      let strokeLenPx = 0;
      for (let i = 1; i < pts.length; i++) {
        strokeLenPx += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      }

      const isActualDrawing =
        stateRef.current.controlScheme === 'alternative'
          ? pts.length >= 3 && strokeLenPx >= 22
          : pts.length >= 3;

      if (isActualDrawing) {
        const equip = EQUIPMENT_CATALOG[equippedStaffId];
        const recentVoice =
          pendingVoiceSpellRef.current &&
          performance.now() - pendingVoiceSpellRef.current.timestamp < 4000
            ? pendingVoiceSpellRef.current
            : null;

        const targetSpellId = recentVoice ? recentVoice.spellId : selectedSpellId;
        const gestureInfo = getActiveSpellGestureInfo(targetSpellId, hud.aimSurfaceTarget);
        const evalRes =
          gestureInfo.isContextual && gestureInfo.contextId
            ? evaluateContextualGesture(
                pts,
                gestureInfo.contextId,
                gestureMasteryLevel * 3 + equip.gestureForgiveness
              )
            : evaluateGestureAccuracy(
                pts,
                targetSpellId,
                gestureMasteryLevel * 3,
                equip.gestureForgiveness
              );

        triggerSpellCast({
          spellId: targetSpellId,
          castMode: recentVoice ? 'voice_and_drawn' : 'drawn',
          gestureAccuracy: evalRes.accuracy,
          voiceMatched: Boolean(recentVoice),
          voiceQuality: recentVoice?.quality ?? 95,
          spokenLabel: SPELLS[targetSpellId].shortWord,
        });
        pendingVoiceSpellRef.current = null;
      } else if (stateRef.current.controlScheme === 'alternative') {
        // In Alternative Control Scheme, a short RMB click without drawing fires the spell at 20% power!
        triggerSpellCast({
          spellId: selectedSpellId,
          castMode: 'quick',
          gestureAccuracy: 0,
          voiceMatched: false,
        });
      }
    }
  };

  // Progressive Spell Upgrade (Level 1..6: unlocks 2 projectiles at Level 4+ and Elemental Awakening at Level 6!)
  const handleUpgradeSpell = (spellId: SpellId) => {
    const currentLvl = spellLevels[spellId] || 1;
    if (currentLvl >= MAX_SPELL_LEVEL) return;

    const cost = getSpellUpgradeCost(currentLvl, spellLevels, spellId);
    if (!canAffordSpellUpgrade(currentLvl, reagentInventory, spellLevels, spellId)) {
      showToast(`Нужно: ${cost.label}`);
      return;
    }

    const updatedInv = consumeSpellUpgradeCost(currentLvl, reagentInventory, spellLevels, spellId);
    setReagentInventory(updatedInv);
    const nextLvl = currentLvl + 1;
    setSpellLevels((prev) => ({
      ...prev,
      [spellId]: nextLvl,
    }));
    if (nextLvl === 6) {
      recordQuestEvents([{ type: 'upgrade_spell_lv6', amount: 1 }]);
    }
    audioEngine.playPickupChime();
    showToast(
      nextLvl === 6
        ? `⚡ «${SPELLS[spellId].shortWord}» Ур. 6: ${SPELL_LEVEL_6_EFFECTS[spellId]}`
        : nextLvl === 4 &&
          (spellId === 'incendio' ||
            spellId === 'glacius' ||
            spellId === 'expelliarmus' ||
            spellId === 'stupefy')
        ? `«${SPELLS[spellId].shortWord}» Ур. 4: теперь вылетают 2 снаряда!`
        : nextLvl === 4 && spellId === 'arcane_sword'
        ? `🔥 «Магический Меч» Ур. 4: теперь удары мечом поджигают врагов!`
        : `Заклинание «${SPELLS[spellId].shortWord}» улучшено до Ур. ${nextLvl}!`
    );
  };

  const handleCraftOrEquip = (equipmentId: EquipmentId) => {
    if (ownedEquipment.includes(equipmentId)) {
      setEquippedStaffId(equipmentId);
      worldRef.current?.setEquippedStaff(equipmentId);
      audioEngine.playPickupChime();
      showToast(`В руках: ${EQUIPMENT_CATALOG[equipmentId].name}`);
      return;
    }

    const res = craftEquipmentItem(equipmentId, reagentInventory, ownedEquipment);
    if (res.success) {
      setReagentInventory(res.updatedInventory);
      setOwnedEquipment(res.updatedOwned);
      setEquippedStaffId(equipmentId);
      worldRef.current?.setEquippedStaff(equipmentId);
      audioEngine.playVictoryFanfare();
      showToast(`Создано: ${EQUIPMENT_CATALOG[equipmentId].name}!`);
    }
  };

  const handleCraftOrEquipArtifact = (artifactId: ArtifactId) => {
    const art = ARTIFACT_CATALOG[artifactId];
    if (!art) return;

    if (ownedArtifacts.includes(artifactId)) {
      setEquippedArtifacts((prev) => {
        const isAlreadyEquipped = prev[art.slot] === artifactId;
        const next = { ...prev };
        if (isAlreadyEquipped) {
          delete next[art.slot];
          showToast(`Снято: ${art.name}`);
        } else {
          next[art.slot] = artifactId;
          showToast(`Надето: ${art.name} (Ур. ${art.tier})`);
        }
        worldRef.current?.setEquippedArtifacts(next);
        return next;
      });
      audioEngine.playPickupChime();
      return;
    }

    const res = craftArtifactItem(artifactId, reagentInventory, ownedArtifacts);
    if (res.success) {
      setReagentInventory(res.updatedInventory);
      setOwnedArtifacts(res.updatedOwned);
      setEquippedArtifacts((prev) => {
        const next = { ...prev, [art.slot]: artifactId };
        worldRef.current?.setEquippedArtifacts(next);
        return next;
      });
      audioEngine.playVictoryFanfare();
      showToast(`👑 Создано и надето: ${art.name} (Ур. ${art.tier})!`);
    }
  };

  const handleSalvageArtifact = (artifactId: ArtifactId) => {
    const art = ARTIFACT_CATALOG[artifactId];
    if (!art) return;

    const res = salvageArtifactItem(
      artifactId,
      reagentInventory,
      ownedArtifacts,
      equippedArtifacts
    );
    if (res.success) {
      setReagentInventory(res.updatedInventory);
      setOwnedArtifacts(res.updatedOwned);
      setEquippedArtifacts(res.updatedEquipped);
      worldRef.current?.setEquippedArtifacts(res.updatedEquipped);
      audioEngine.playPickupChime();
      const refundList = Object.entries(res.refunded)
        .map(([rId, q]) => `${REAGENTS[rId as ReagentId].name} +${q}`)
        .join(', ');
      if (res.remainingCopies > 0) {
        showToast(
          `♻️ Разобран дубликат «${art.name}» (осталось ×${res.remainingCopies}, +50% рес.): ${refundList}`
        );
      } else {
        showToast(`♻️ Разобрано «${art.name}» (50% ресурсов): ${refundList}`);
      }
    }
  };

  const handleSelectTamedPet = (species: TameableSpeciesId) => {
    worldRef.current?.selectAndTamePet(species);
  };

  const handleUpgradeTamedPet = () => {
    const petLvl = hud.tamedPet?.level || 1;
    const cost = getPetTrainingStepCost(petLvl);
    const canAffordResources = canAffordPetTrainingStep(petLvl, reagentInventory);

    if (!canAffordResources) {
      showToast(`Нужно: ${cost.label}`);
      return;
    }

    const res = worldRef.current?.upgradeActiveTamedPet();
    if (res && res.success) {
      setReagentInventory((prev) => consumePetTrainingStepCost(petLvl, prev));
      if (res.trainingStep === 0) {
        showToast(`${res.petName}: Уровень ${res.newLevel}!`);
      } else {
        showToast(`${res.petName}: Шаг ${res.trainingStep}/3`);
      }
    }
  };

  const handleClaimQuest = (questId: string) => {
    const res = claimQuestReward(quests, questId, reagentInventory);
    if (!res.claimedQuest) return;

    setQuests(res.updatedQuests);
    setReagentInventory(res.updatedInventory);
    if (res.rewardXp > 0) {
      grantXp(res.rewardXp);
    }
    if (worldRef.current) {
      if (res.rewardMaxHp > 0) {
        worldRef.current.maxHp += res.rewardMaxHp;
        worldRef.current.hp = Math.min(
          worldRef.current.maxHp,
          worldRef.current.hp + res.rewardMaxHp
        );
      }
      if (res.rewardMaxMp > 0) {
        worldRef.current.maxMp += res.rewardMaxMp;
        worldRef.current.mp = Math.min(
          worldRef.current.maxMp,
          worldRef.current.mp + res.rewardMaxMp
        );
      }
      worldRef.current.pushHudSnapshot();
    }
    audioEngine.playVictoryFanfare();
    showToast(`Награда получена: +${res.rewardXp} XP · ${res.claimedQuest.rewardStat}`);
  };

  // Craft Potion or Cook Rat/Boar/Bear/Bat Meat at a lit campfire based on drawing accuracy
  const handleCraftAtCampfire = (recipeId: CampfireRecipeId, accuracy: number) => {
    if (hud.campfireStatus !== 'lit_in_aura') {
      showToast('Подойдите вплотную к горящему костру!');
      return;
    }

    if (recipeId === 'rat_food') {
      if ((reagentInventory.rat_meat || 0) < 2) {
        showToast('Нужно 2 тушки крысы для жаркого!');
        return;
      }
      setReagentInventory((prev) => ({
        ...prev,
        rat_meat: Math.max(0, (prev.rat_meat || 0) - 2),
      }));
      const food = calculateCookedRatFoodStats(accuracy);
      setCookedFoods((prev) => [food, ...prev]);
      const qEvents: Array<{ type: QuestEventType; amount?: number }> = [
        { type: 'cook_rat_food', amount: 1 },
      ];
      if (food.accuracyPercent >= 70) {
        qEvents.push({ type: 'cook_high_rat_food', amount: 1 });
      }
      recordQuestEvents(qEvents);
      worldRef.current?.notifyStage0PrepAction('food');
      audioEngine.playPickupChime();
      showToast(
        `🍖 Приготовлено: ${food.name} (+${food.bonusMaxHp} ОЗ, +${food.hpRegenPerSec}/с на ${Math.round(
          food.durationSec / 60
        )} мин)`
      );
      return;
    }

    if (recipeId === 'boar_food') {
      if ((reagentInventory.boar_meat || 0) < 2) {
        showToast('Нужно 2 куска мяса кабана (с 3-4 ур.) для жаркого!');
        return;
      }
      setReagentInventory((prev) => ({
        ...prev,
        boar_meat: Math.max(0, (prev.boar_meat || 0) - 2),
      }));
      const boarFood = calculateCookedBoarFoodStats(accuracy);
      setCookedFoods((prev) => [boarFood, ...prev]);
      const qEvents: Array<{ type: QuestEventType; amount?: number }> = [
        { type: 'cook_rat_food', amount: 1 },
        { type: 'cook_boar_food', amount: 1 },
      ];
      if (boarFood.accuracyPercent >= 70) {
        qEvents.push({ type: 'cook_high_rat_food', amount: 1 });
      }
      recordQuestEvents(qEvents);
      worldRef.current?.notifyStage0PrepAction('food');
      audioEngine.playPickupChime();
      showToast(
        `🐗 Приготовлено: ${boarFood.name} (+${boarFood.bonusMaxHp} ОЗ, +${boarFood.hpRegenPerSec}/с на ${Math.round(
          boarFood.durationSec / 60
        )} мин)`
      );
      return;
    }

    if (recipeId === 'bear_food') {
      if ((reagentInventory.bear_meat || 0) < 2) {
        showToast('Нужно 2 куска Медвежатины (с Пещерного Медведя на 5 ур.)!');
        return;
      }
      setReagentInventory((prev) => ({
        ...prev,
        bear_meat: Math.max(0, (prev.bear_meat || 0) - 2),
      }));
      const bearFood = calculateCookedBearFoodStats(accuracy);
      setCookedFoods((prev) => [bearFood, ...prev]);
      const qEvents: Array<{ type: QuestEventType; amount?: number }> = [
        { type: 'cook_rat_food', amount: 1 },
        { type: 'cook_boar_food', amount: 1 },
      ];
      if (bearFood.accuracyPercent >= 70) {
        qEvents.push({ type: 'cook_high_rat_food', amount: 1 });
      }
      recordQuestEvents(qEvents);
      worldRef.current?.notifyStage0PrepAction('food');
      audioEngine.playPickupChime();
      showToast(
        `🐻 Приготовлено: ${bearFood.name} (+${bearFood.bonusMaxHp} ОЗ, +${bearFood.hpRegenPerSec}/с на ${Math.round(
          bearFood.durationSec / 60
        )} мин)`
      );
      return;
    }

    if (recipeId === 'bat_food') {
      const hasWaterCombo =
        (reagentInventory.bat_meat || 0) >= 1 && (reagentInventory.water_essence || 0) >= 1;
      if (!hasWaterCombo && (reagentInventory.bat_meat || 0) < 2) {
        showToast('Нужно 1 мясо мыши + 1 Вода (с 4 ур.) ИЛИ 2 тушки летучей мыши!');
        return;
      }
      setReagentInventory((prev) => ({
        ...prev,
        bat_meat: Math.max(0, (prev.bat_meat || 0) - (hasWaterCombo ? 1 : 2)),
        water_essence: hasWaterCombo
          ? Math.max(0, (prev.water_essence || 0) - 1)
          : prev.water_essence,
      }));
      const batFood = calculateCookedBatFoodStats(accuracy, hasWaterCombo);
      setCookedBatFoods((prev) => [batFood, ...prev]);
      const qEvents: Array<{ type: QuestEventType; amount?: number }> = [
        { type: 'cook_rat_food', amount: 1 },
      ];
      if (hasWaterCombo) {
        qEvents.push({ type: 'cook_bat_water_food', amount: 1 });
      }
      if (batFood.accuracyPercent >= 70) {
        qEvents.push({ type: 'cook_high_rat_food', amount: 1 });
      }
      recordQuestEvents(qEvents);
      worldRef.current?.notifyStage0PrepAction('food');
      audioEngine.playPickupChime();
      showToast(
        `🦇${hasWaterCombo ? '💧' : ''} Приготовлено: ${batFood.name} (+${batFood.bonusMaxMp} МП, +${batFood.mpRegenPerSec}/с на ${Math.round(
          batFood.durationSec / 60
        )} мин)`
      );
      return;
    }

    // Health or Mana Potion
    const useMandrake = (reagentInventory.mandrake_root || 0) >= 1;
    const useRatHair =
      !useMandrake && recipeId === 'mana_potion' && (reagentInventory.rat_hair || 0) >= 1;
    const useWood =
      !useMandrake && !useRatHair && (reagentInventory.ancient_wood || 0) >= 1;

    if (!useMandrake && !useRatHair && !useWood) {
      showToast('Недостаточно реагентов для варки зелья!');
      return;
    }

    setReagentInventory((prev) => ({
      ...prev,
      mandrake_root: useMandrake ? Math.max(0, (prev.mandrake_root || 0) - 1) : prev.mandrake_root,
      rat_hair: useRatHair ? Math.max(0, (prev.rat_hair || 0) - 1) : prev.rat_hair,
      ancient_wood: useWood ? Math.max(0, (prev.ancient_wood || 0) - 1) : prev.ancient_wood,
    }));

    const kind = recipeId === 'health_potion' ? 'health' : 'mana';
    const potion = calculateCraftedPotionStats(kind, accuracy);
    setCraftedPotions((prev) => [potion, ...prev]);
    const qEvents: Array<{ type: QuestEventType; amount?: number }> = [
      { type: 'brew_potion', amount: 1 },
    ];
    if (potion.accuracyPercent >= 75) {
      qEvents.push({ type: 'brew_high_potion', amount: 1 });
    }
    recordQuestEvents(qEvents);
    worldRef.current?.notifyStage0PrepAction('potion');
    audioEngine.playPickupChime();
    showToast(
      `🧪 Сварено: ${potion.name} (+${potion.restoreAmount} ${
        kind === 'health' ? 'ОЗ' : 'МП'
      })`
    );
  };

  const readyToClaimQuestsCount = quests.filter((q) => q.completed && !q.claimed).length;

  const nextLevelXp = playerLevel * 500;
  const lowHpWarning = gameState === 'playing' && hud.hp <= hud.maxHp * 0.28;

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-[#09080d] select-none"
      onContextMenu={(e) => e.preventDefault()}
      onPointerMove={handleViewportPointerMove}
      onPointerUp={handleViewportPointerUp}
      onWheel={handleViewportWheel}
    >
      {/* Isolated Three.js WebGL Viewport Container */}
      <div
        ref={canvasMountRef}
        data-testid="webgl-viewport"
        onPointerDown={handleViewportPointerDown}
        onPointerLeave={handleViewportPointerLeave}
        className={`absolute inset-0 w-full h-full ${
          controlScheme === 'alternative' && gameState === 'playing' && !grimoireOpen
            ? 'cursor-none'
            : 'cursor-crosshair'
        }`}
      />

      {/* Peripheral Critical Low-HP Vignette */}
      {lowHpWarning && (
        <div
          className="fixed inset-0 pointer-events-none z-10"
          style={{
            boxShadow: 'inset 0 0 110px 32px rgba(220, 38, 38, 0.45)',
          }}
        />
      )}

      {/* =====================================================================
          1. TITLE SCREEN OVERLAY (Mode 1 Arena PvP + Mode 2 3-Stage Labyrinth)
         ===================================================================== */}
      {gameState === 'title' && (
        <div
          className="fixed inset-0 z-30 flex flex-col justify-between p-6 md:p-10 pointer-events-none overflow-y-auto"
          style={{
            background:
              'linear-gradient(90deg, rgba(9, 8, 13, 0.93) 0%, rgba(9, 8, 13, 0.74) 55%, rgba(9, 8, 13, 0.25) 100%)',
          }}
        >
          <div className="max-w-2xl my-auto space-y-4 pointer-events-auto">
            {!isFullscreen && (
              <button
                type="button"
                data-testid="title-fullscreen-btn"
                onClick={toggleFullscreen}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-[#fde047] bg-gradient-to-r from-[#1e1b2e]/95 via-[#132638]/95 to-[#2b1f10]/95 text-xs sm:text-sm font-bold text-[#fde047] hover:text-white hover:border-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 text-center animate-pulse"
              >
                <span>
                  🖥️ Для лучшего обзора нажмите <span className="text-[#38bdf8]">[F11]</span> или кликните сюда — ПОЛНЫЙ ЭКРАН [⛶]
                </span>
              </button>
            )}
            <div className="space-y-2">
              <svg
                viewBox="0 0 420 110"
                className="w-full max-w-[360px] h-auto overflow-visible"
                role="img"
                aria-label="VOX ARCANUM: Магия Голоса и Жеста"
              >
                <defs>
                  <linearGradient id="arcaneGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fde047" />
                    <stop offset="55%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                </defs>
                <g transform="translate(42, 52)">
                  <circle
                    cx="0"
                    cy="0"
                    r="34"
                    fill="#120f1d"
                    stroke="url(#arcaneGold)"
                    strokeWidth="2.5"
                  />
                  <polygon
                    points="0,-26 23,14 -23,14"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  <polygon
                    points="0,26 23,-14 -23,-14"
                    fill="none"
                    stroke="url(#arcaneGold)"
                    strokeWidth="1.6"
                  />
                  <circle cx="0" cy="0" r="6" fill="#38bdf8" />
                </g>

                <text
                  x="92"
                  y="48"
                  fill="url(#arcaneGold)"
                  fontFamily="Cinzel, Georgia, serif"
                  fontWeight="800"
                  fontSize="34"
                  letterSpacing="3"
                >
                  VOX ARCANUM
                </text>
                <line
                  x1="92"
                  y1="60"
                  x2="405"
                  y2="60"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeOpacity="0.55"
                />
                <text
                  x="92"
                  y="82"
                  fill="#e2d9f3"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                  fontWeight="600"
                  fontSize="13.5"
                  letterSpacing="2"
                >
                  5 УРОВНЕЙ ЛАБИРИНТА · ГОЛОС [R] И ЖЕСТЫ
                </text>
              </svg>

              <p className="text-xs md:text-sm text-[#d8d0e5] leading-relaxed max-w-xl">
                Произносите заклинания по кнопке <strong>[R]</strong> (<strong>«Огонь»</strong>, <strong>«Лед»</strong>, <strong>«Хил»</strong>) или рисуйте палочкой <strong>[ПКМ]</strong>. Пройдите 5 этапов Лабиринта с Боссами, сохраняйте прокачку на аккаунте и откройте <strong>Сложность II: Кошмар (Diablo)</strong>!
              </p>
            </div>

            {/* COMPACT CHARACTER SWITCHER PANEL (Only Character Name & Unlocked Stages!) */}
            <div
              data-testid="title-account-panel"
              className="px-3 py-2 rounded-xl border border-[#3b3154] bg-[#120f1d]/95 flex flex-wrap items-center justify-between gap-2 shadow-xl"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                {characters.map((ch) => {
                  const isActive = ch.id === activeCharacterId;
                  const unlockedSt = getUnlockedStageForDifficulty(ch, ch.selectedDifficulty);
                  return (
                    <div
                      key={ch.id}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono-num transition-colors ${
                        isActive
                          ? 'bg-[#2a1f10] border-[#f59e0b] text-[#fde047] font-bold'
                          : 'bg-[#171324] border-[#3b3154] text-[#cbd5e1]'
                      }`}
                    >
                      <button
                        type="button"
                        data-testid={`switch-char-${ch.id}`}
                        onClick={() => handleSwitchCharacter(ch.id)}
                        className="cursor-pointer hover:underline"
                      >
                        {ch.name} · Пройдено ур.: {unlockedSt}/5
                      </button>
                      {characters.length > 1 && (
                        <button
                          type="button"
                          title={`Удалить ${ch.name}`}
                          data-testid={`quick-delete-char-${ch.id}`}
                          onClick={() => handleDeleteCharacter(ch.id)}
                          className="ml-1 text-[#f87171] hover:text-[#ef4444] font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  data-testid="open-account-modal-btn"
                  onClick={() => setAccountModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-[#251f38] hover:bg-[#332a4d] border border-[#a855f7] text-[11px] font-bold text-[#e9d5ff] cursor-pointer"
                >
                  👤 Сменить / Создать
                </button>
              </div>
            </div>

            {/* COMPACT SINGLE-LINE CO-OP BAR (MQTT WebSocket, 2-Digit Room Code) */}
            <div
              data-testid="title-coop-room-panel"
              className="px-3 py-2 rounded-xl border border-[#22c55e]/60 bg-[#101c18]/95 flex flex-wrap items-center gap-2 shadow-xl"
            >
              <button
                type="button"
                data-testid="title-create-room-btn"
                onClick={() => {
                  const code = generateTwoDigitRoomCode();
                  setPvpRoom(code);
                  connectMultiplayerRoom(code, pvpPlayerName);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#15803d] hover:bg-[#16a34a] text-white text-xs font-bold cursor-pointer shrink-0"
              >
                Создать комнату
              </button>

              {pvpRoom && (
                <>
                  <span
                    data-testid="title-room-status"
                    className="text-sm font-extrabold font-mono-num text-[#4ade80] tracking-wide px-1.5"
                  >
                    Код: {pvpRoom} | Игроков: {remotePlayers.length + 1}
                  </span>
                  <button
                    type="button"
                    data-testid="title-launch-room-btn"
                    onClick={() => {
                      roomSessionRef.current?.sendStartGame(1);
                      handleStartGameWithMode('labyrinth', 'shared', 1);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#22c55e] hover:bg-[#4ade80] text-[#09080d] text-xs font-extrabold cursor-pointer shrink-0"
                  >
                    Начать игру
                  </button>
                </>
              )}

              <div className="flex items-center gap-1.5 ml-auto">
                <input
                  type="text"
                  inputMode="numeric"
                  value={roomInputCode}
                  onChange={(e) =>
                    setRoomInputCode(e.target.value.replace(/\D/g, '').slice(0, 2))
                  }
                  placeholder="42"
                  maxLength={2}
                  aria-label="Код комнаты (2 цифры)"
                  data-testid="title-room-code-input"
                  className="w-14 px-2 py-1.5 rounded-lg bg-[#090d0b] border border-[#22c55e]/60 text-xs text-center font-bold text-white font-mono-num focus:outline-none focus:border-[#4ade80]"
                />
                <button
                  type="button"
                  data-testid="title-join-room-btn"
                  onClick={() => {
                    const parsed = parseTwoDigitRoomCode(roomInputCode);
                    if (!parsed) {
                      showToast('Введите 2 цифры кода комнаты (10–99)');
                      return;
                    }
                    setPvpRoom(parsed);
                    connectMultiplayerRoom(parsed, pvpPlayerName);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#38bdf8] text-[#bae6fd] text-xs font-bold cursor-pointer shrink-0"
                >
                  Войти
                </button>
              </div>
            </div>

            {/* DIABLO DIFFICULTY & UNLOCKED STAGES (1..5) SELECTOR */}
            <div
              data-testid="title-difficulty-stage-panel"
              className="p-3.5 rounded-xl border border-[#3b3154] bg-[#120f1d]/95 space-y-2.5 shadow-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#e2d9f3]">
                  ⚔️ Сложность (как в Diablo):
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="select-difficulty-1"
                    onClick={() => handleSelectDifficultyTier(1)}
                    className={`px-3 py-1 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                      selectedDifficulty === 1
                        ? 'bg-[#1e293b] border-[#38bdf8] text-[#bae6fd]'
                        : 'bg-[#161321] border-[#3b3154] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    I · Обычная
                  </button>
                  <button
                    type="button"
                    data-testid="select-difficulty-2"
                    onClick={() => handleSelectDifficultyTier(2)}
                    className={`px-3 py-1 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                      selectedDifficulty === 2
                        ? 'bg-[#451a1c] border-[#ef4444] text-[#fecaca] shadow-md'
                        : highestUnlockedDifficulty >= 2
                        ? 'bg-[#261319] border-[#991b1b] text-[#fca5a5] hover:bg-[#381821]'
                        : 'bg-[#161321] border-[#2e2640] text-[#64748b] cursor-pointer'
                    }`}
                  >
                    {highestUnlockedDifficulty >= 2
                      ? '🔥 II · Кошмар (Diablo)'
                      : '🔒 II · Кошмар (Убейте Босса-Червя 5 ур.)'}
                  </button>
                  <button
                    type="button"
                    data-testid="unlock-all-test-btn"
                    onClick={() => {
                      setUnlockedStageD1(5);
                      setUnlockedStageD2(5);
                      setHighestUnlockedDifficulty(2);
                      showToast(
                        '🔓 Открыты все 5 уровней Лабиринта и Сложность II «Кошмар» (Diablo)!'
                      );
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#231e36] hover:bg-[#312a4a] border border-[#f59e0b] text-[11px] font-bold text-[#fde047] cursor-pointer"
                  >
                    🔓 Открыть Ур. 1–5 + Кошмар II (Тест)
                  </button>
                </div>
              </div>

              {selectedDifficulty === 2 && (
                <div className="text-[11px] text-[#fca5a5] bg-[#291016] border border-[#7f1d1d] rounded-lg px-2.5 py-1.5">
                  🔥 <strong>Сложность II (Кошмар):</strong> Мобы уже на 1-м уровне сильнее и живучее 5-го уровня Обычной сложности, быстрее двигаются (+28%..+48%) и стремительнее кидают снаряды (+35%..+55%)!
                </div>
              )}

              {/* Direct Stage Launch Buttons (1..5) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#cbd5e1]">
                  <span>
                    🏰 Вход на открытый Уровень Лабиринта (пройдите уровень, чтобы открыть следующий):
                  </span>
                  <span className="font-mono-num text-[#fde047] font-bold">
                    Открыто:{' '}
                    {getUnlockedStageForDifficulty(
                      { unlockedStageD1, unlockedStageD2 },
                      selectedDifficulty
                    )}
                    /5
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {([0, 1, 2, 3, 4, 5] as const).map((stageNum) => {
                    const maxUnlocked = getUnlockedStageForDifficulty(
                      { unlockedStageD1, unlockedStageD2 },
                      selectedDifficulty
                    );
                    const isStageUnlocked = stageNum === 0 || stageNum <= maxUnlocked;
                    return (
                      <button
                        key={stageNum}
                        type="button"
                        data-testid={`start-stage-${stageNum}`}
                        onClick={() => {
                          if (!isStageUnlocked) {
                            showToast(
                              `🔒 Уровень ${stageNum} ещё закрыт! Сначала пройдите Уровень ${
                                stageNum - 1
                              } через портал Босса (или нажмите «Открыть Ур. 1–5 (Тест)»).`
                            );
                            return;
                          }
                          handleStartGameWithMode(
                            'labyrinth',
                            labyrinthMultiplayerMode,
                            stageNum
                          );
                        }}
                        className={`py-2 px-1.5 rounded-lg border text-xs font-bold font-mono-num transition-all cursor-pointer ${
                          stageNum === 0
                            ? 'bg-[#132a1f] hover:bg-[#1a3a2b] border-[#22c55e] text-[#bbf7d0]'
                            : isStageUnlocked
                            ? selectedDifficulty === 2
                              ? 'bg-[#3b151c] hover:bg-[#521b25] border-[#ef4444] text-[#fecaca]'
                              : 'bg-[#1b2436] hover:bg-[#24324a] border-[#38bdf8] text-[#bae6fd]'
                            : 'bg-[#14111d] border-[#2a233d] text-[#64748b] opacity-75'
                        }`}
                      >
                        {stageNum === 0
                          ? '🎓 Уровень 0'
                          : isStageUnlocked
                          ? `▶ Уровень ${stageNum}`
                          : `🔒 Ур. ${stageNum}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                data-start="true"
                data-testid="start-labyrinth-shared"
                onClick={() => handleStartGameWithMode('labyrinth', 'shared', 1)}
                className="px-4 py-3 text-xs md:text-sm font-bold tracking-wider uppercase bg-[#f59e0b] hover:bg-[#fbbf24] text-[#09080d] rounded-lg shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              >
                🤝 Совместный Лабиринт (Этап 1) [Enter]
              </button>

              <button
                type="button"
                data-testid="start-labyrinth-parallel"
                onClick={() => handleStartGameWithMode('labyrinth', 'parallel', 1)}
                className="px-3.5 py-3 text-xs font-bold text-[#e9d5ff] bg-[#1f1633] hover:bg-[#2d1f4a] border border-[#a855f7] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                🌀 Свои миры + PvP
              </button>

              <button
                type="button"
                data-testid="start-labyrinth-stage4"
                onClick={() => handleStartGameWithMode('labyrinth', labyrinthMultiplayerMode, 4)}
                className="px-3.5 py-3 text-xs font-extrabold text-[#fef08a] bg-[#7c2d12] hover:bg-[#9a3412] border-2 border-[#f97316] rounded-lg shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              >
                🔥 Сразу на 4 Уровень (Тест)
              </button>

              <button
                type="button"
                data-testid="start-labyrinth-stage5"
                onClick={() => handleStartGameWithMode('labyrinth', labyrinthMultiplayerMode, 5)}
                className="px-3.5 py-3 text-xs font-extrabold text-[#bae6fd] bg-[#0c4a6e] hover:bg-[#075985] border-2 border-[#38bdf8] rounded-lg shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              >
                🏛️ Сразу на 5 Уровень (Тест)
              </button>

              <button
                type="button"
                onClick={() => handleStartGameWithMode('arena')}
                className="px-3.5 py-3 text-xs font-bold text-[#fde047] bg-[#1e182d] hover:bg-[#2c2342] border border-[#f59e0b] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Полигон / PvP Арена
              </button>
            </div>
          </div>

          <div className="text-xs text-[#cbd5e1] tracking-wide font-mono-num pt-2">
            WASD Движение · {controlScheme === 'alternative' ? 'Мышь Осмотр · ЛКМ Быстрый каст' : 'ЛКМ Осмотр'} · ПКМ Рисовать · [R] Микрофон · [M] Радар · [Esc] Настройки
          </div>
        </div>
      )}

      {/* =====================================================================
          2. PLAYING HUD OVERLAY (Clean, Decluttered Combat Interface with 5-State [H] Toggle)
         ===================================================================== */}
      {gameState === 'playing' && (
        <div className="fixed inset-0 z-20 pointer-events-none">
          {/* TOP-LEFT PERIMETER CLUSTER (Hidden at hudHideStep >= 2) */}
          {hudHideStep < 2 && (
            <div
              data-testid="hud-top-left-panel"
              className="absolute top-4 left-4 p-3 rounded-xl border border-[#3b3154] space-y-2 pointer-events-auto w-[250px]"
              style={{ backgroundColor: 'rgba(14, 12, 22, 0.88)' }}
            >
              {/* Red Health Bar with Heart & Number directly on the bar */}
              <div className="relative h-7 bg-[#241219] rounded-lg overflow-hidden border border-[#7f1d1d] flex items-center">
                <div
                  className="h-full bg-[#dc2626] transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100))}%` }}
                />
                <div className="absolute inset-0 px-2.5 flex items-center justify-between text-xs font-bold font-mono-num text-white hud-stroke">
                  <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                      <path
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        fill="#fca5a5"
                      />
                    </svg>
                  </span>
                  <span>
                    {hud.hp} / {hud.maxHp}
                  </span>
                </div>
              </div>

              {/* Blue Mana Bar with Crystal & Number directly on the bar */}
              <div className="relative h-7 bg-[#0f1d2e] rounded-lg overflow-hidden border border-[#0369a1] flex items-center">
                <div
                  className="h-full bg-[#0284c7] transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(100, (hud.mp / hud.maxMp) * 100))}%` }}
                />
                <div className="absolute inset-0 px-2.5 flex items-center justify-between text-xs font-bold font-mono-num text-white hud-stroke">
                  <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                      <polygon points="12,2 20,10 12,22 4,10" fill="#7dd3fc" />
                    </svg>
                  </span>
                  <span>
                    {Math.round(hud.mp)} / {hud.maxMp}
                  </span>
                </div>
              </div>

              {/* Gold/Purple XP & Player Level Bar (Always visible on main HUD so player sees XP & Level!) */}
              <div
                data-testid="hud-xp-level-bar"
                className="relative h-6 bg-[#1b1429] rounded-lg overflow-hidden border border-[#7e22ce] flex items-center"
              >
                <div
                  className="h-full bg-gradient-to-r from-[#7e22ce] via-[#a855f7] to-[#f59e0b] transition-all duration-200"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, (playerXp / Math.max(1, nextLevelXp)) * 100)
                    )}%`,
                  }}
                />
                <div className="absolute inset-0 px-2.5 flex items-center justify-between text-[11px] font-bold font-mono-num text-white hud-stroke">
                  <span className="text-[#fde047]">Ур. {playerLevel}</span>
                  <span>
                    Опыт: {playerXp} / {nextLevelXp} XP
                  </span>
                </div>
              </div>

              {/* Compact 120x120 2D Top-Down Radar ([Tab / M] toggles visibility & saves FPS when hidden) */}
              {radarVisible ? (
                <div
                  data-testid="hud-radar-container"
                  className="flex items-start justify-between gap-2 pt-0.5"
                >
                  <div className="relative w-[120px] h-[120px] rounded-lg overflow-hidden border border-[#3b3154] bg-[#0a0c14] shrink-0">
                    <canvas
                      ref={radarCanvasRef}
                      width={RADAR_CANVAS_SIZE}
                      height={RADAR_CANVAS_SIZE}
                      data-testid="hud-radar-canvas"
                      className="block w-[120px] h-[120px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-[10px] font-mono-num text-[#cbd5e1] leading-tight">
                    <button
                      type="button"
                      tabIndex={-1}
                      data-testid="hud-radar-toggle-btn"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        toggleRadar();
                      }}
                      className="px-1.5 py-0.5 rounded bg-[#181426] hover:bg-[#26203b] border border-[#3b3154] text-[#fde047] font-bold text-left cursor-pointer"
                    >
                      [M] Скрыть
                    </button>
                    <span className="text-[#22d3ee]">● Портал</span>
                    <span className="text-[#facc15]">■ Сундук</span>
                    <span className="text-[#fb923c]">● Костёр</span>
                    <span className="text-[#4ade80]">● Союзник</span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  tabIndex={-1}
                  data-testid="hud-radar-restore-btn"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    toggleRadar();
                  }}
                  className="w-full px-2 py-1 rounded-lg border border-[#3b3154] bg-[#14111f] hover:bg-[#211c33] text-[10px] font-mono-num font-bold text-[#94a3b8] hover:text-[#fde047] text-left cursor-pointer"
                >
                  🗺️ Радар выкл · [M] вернуть
                </button>
              )}

              {/* Active Campfire Aura Indicator (Small Radius <= 4.2m; 2x Regen when surrounded by >= 3 built walls!) */}
              {hud.campfireStatus === 'lit_in_aura' && (
                <div
                  data-testid="hud-campfire-aura-badge"
                  className={`px-2 py-1 rounded-lg border text-[11px] font-mono-num flex items-center justify-between ${
                    hud.campfireSheltered
                      ? 'bg-[#102a1d] border-[#4ade80] text-[#bbf7d0]'
                      : 'bg-[#2a160d] border-[#f97316] text-[#fed7aa]'
                  }`}
                >
                  <span>
                    {hud.campfireSheltered
                      ? '🏠 Дом у костра (3+ стены): +1.0 ОЗ/с · ×3.0 МП (×2!)'
                      : `🔥 У костра (${hud.campfireWallsCount || 0}/3 стен): +0.5 ОЗ/с · +50% МП`}
                  </span>
                </div>
              )}
              {hud.campfireStatus === 'unlit_nearby' && (
                <div className="px-2 py-1 rounded-lg bg-[#241f10] border border-[#f59e0b] text-[11px] font-mono-num text-[#fde047]">
                  🪵 Стрельните «Огонь» [1] в костёр! ({hud.campfireWallsCount || 0}/3 стен вокруг)
                </div>
              )}

              {/* Active Cooked Rat Food Buff Indicator */}
              {hud.activeFoodBuff && (
                <div className="px-2 py-1 rounded-lg bg-[#132a1f] border border-[#22c55e] text-[11px] font-mono-num text-[#bbf7d0] flex items-center justify-between">
                  <span>
                    🍖 +{hud.activeFoodBuff.bonusMaxHp} ОЗ · +{hud.activeFoodBuff.hpRegenPerSec}/с
                  </span>
                  <span>{Math.ceil(hud.activeFoodBuff.remainingSec)}с</span>
                </div>
              )}

              {/* Active Roasted Bat Food Buff Indicator */}
              {hud.activeBatFoodBuff && (
                <div className="px-2 py-1 rounded-lg bg-[#131d31] border border-[#38bdf8] text-[11px] font-mono-num text-[#bae6fd] flex items-center justify-between">
                  <span>
                    🦇 +{hud.activeBatFoodBuff.bonusMaxMp} МП · +{hud.activeBatFoodBuff.mpRegenPerSec}/с
                  </span>
                  <span>{Math.ceil(hud.activeBatFoodBuff.remainingSec)}с</span>
                </div>
              )}

              {/* Active Summoned Elemental Ally (Water Helper or Snowman) */}
              {hud.activeElementalAlly && (
                <div className="px-2 py-1 rounded-lg bg-[#162336] border border-[#38bdf8] text-[11px] font-mono-num text-[#bae6fd] flex items-center justify-between">
                  <span>
                    {hud.activeElementalAlly.kind === 'water_spirit' ? '💧' : '⛄'}{' '}
                    {hud.activeElementalAlly.name} ({hud.activeElementalAlly.attackDamage})
                  </span>
                  <span>{Math.ceil(hud.activeElementalAlly.remainingSec)}с</span>
                </div>
              )}

              {/* Active Summoned Arcane Sword Indicator ([8] Меч) */}
              {hud.activeArcaneSword && (
                <div
                  data-testid="hud-arcane-sword-badge"
                  className="px-2 py-1 rounded-lg bg-[#271c0c] border border-[#fbbf24] text-[11px] font-mono-num text-[#fde047] flex items-center justify-between"
                >
                  <span>
                    ⚔️ Меч ({hud.activeArcaneSword.damage} ур.) · [ПКМ ←/→]
                  </span>
                  <span>{hud.activeArcaneSword.remainingSec.toFixed(1)}с</span>
                </div>
              )}

              {/* Cave Bear Fear Roar Status Indicator */}
              {hud.playerFearTimeLeft > 0.05 && (
                <div
                  data-testid="hud-fear-badge"
                  className="px-2 py-1 rounded-lg bg-[#31101b] border border-[#f43f5e] text-[11px] font-mono-num text-[#fda4af] flex items-center justify-between animate-pulse"
                >
                  <span>🐻 Рёв Страха (бег назад!)</span>
                  <span>{hud.playerFearTimeLeft.toFixed(1)}с</span>
                </div>
              )}
            </div>
          )}

          {/* TOP-CENTER BOSS HP BAR (Stage Bosses 1..4 & Stage 5 Splitting Worm Boss Phases 1/2/3) */}
          {hudHideStep < 2 && hud.bossInfo && (
            <div
              data-testid="hud-boss-bar"
              className="fixed top-4 left-[41%] -translate-x-1/2 z-20 w-[280px] sm:w-[330px] p-2 rounded-xl border-2 border-[#ef4444] shadow-2xl pointer-events-none"
              style={{ backgroundColor: 'rgba(18, 10, 18, 0.92)' }}
            >
              <div className="flex items-center justify-between text-xs font-bold font-mono-num text-[#fecaca] mb-1">
                <span className="truncate">{hud.bossInfo.name}</span>
                <span className="text-[#fde047] shrink-0 ml-2">
                  {hud.bossInfo.hp} / {hud.bossInfo.maxHp}
                  {hud.bossInfo.enraged ? ' 🔥' : ''}
                </span>
              </div>
              <div className="w-full h-3 bg-[#09080d] rounded-full overflow-hidden border border-[#7f1d1d]">
                <div
                  className="h-full bg-gradient-to-r from-[#dc2626] via-[#f97316] to-[#fde047] transition-all duration-150"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, (hud.bossInfo.hp / Math.max(1, hud.bossInfo.maxHp)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* TOP-CENTER STAGE 0 TUTORIAL & PREPARATION CHECKLIST BANNER */}
          {hudHideStep < 2 && hud.stage0Tutorial && (
            <div
              data-testid="hud-stage0-tutorial-banner"
              className="fixed top-4 left-[40%] -translate-x-1/2 z-20 w-[320px] sm:w-[430px] p-2.5 rounded-xl border-2 border-[#38bdf8] shadow-2xl pointer-events-auto"
              style={{ backgroundColor: 'rgba(15, 13, 26, 0.94)' }}
            >
              <div className="flex items-center justify-between text-xs font-bold font-mono-num text-[#fde047] mb-1">
                <span>🎓 УРОВЕНЬ 0: ПОДГОТОВИТЕЛЬНЫЙ ЗАЛ</span>
                <span className="text-[#38bdf8]">
                  {hud.stage0Tutorial.completed
                    ? `${hud.stage0Tutorial.totalSteps}/${hud.stage0Tutorial.totalSteps} · Портал открыт!`
                    : `Этап ${hud.stage0Tutorial.phase}/4 · Враг ${Math.min(
                        hud.stage0Tutorial.totalSteps,
                        hud.stage0Tutorial.stepIndex + 1
                      )}/${hud.stage0Tutorial.totalSteps}`}
                </span>
              </div>
              <div className="text-xs font-semibold text-[#f5efe6] leading-snug">
                {hud.stage0Tutorial.activeBanner}
              </div>

              {hud.stage0Tutorial.waitingForPrep && (
                <div
                  data-testid="hud-stage0-prep-checklist"
                  className="mt-2.5 p-2.5 rounded-lg bg-[#181429] border border-[#f59e0b] space-y-1.5 text-[11px] font-mono-num"
                >
                  <div className="font-bold text-[#fde047]">
                    📋 Задание перед 4-й волной (выполните все 4 пункта, чтобы вышли враги):
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[#e2e8f0]">
                    <div
                      className={
                        hud.stage0Tutorial.prepState.campfireBuilt
                          ? 'text-[#4ade80] font-bold'
                          : 'text-[#cbd5e1]'
                      }
                    >
                      {hud.stage0Tutorial.prepState.campfireBuilt ? '✓' : '○'} 1. Костёр [C]
                    </div>
                    <div
                      className={
                        hud.stage0Tutorial.prepState.wallBuilt
                          ? 'text-[#4ade80] font-bold'
                          : 'text-[#cbd5e1]'
                      }
                    >
                      {hud.stage0Tutorial.prepState.wallBuilt ? '✓' : '○'} 2. Стена [B]
                    </div>
                    <div
                      className={
                        hud.stage0Tutorial.prepState.potionCrafted
                          ? 'text-[#4ade80] font-bold'
                          : 'text-[#cbd5e1]'
                      }
                    >
                      {hud.stage0Tutorial.prepState.potionCrafted ? '✓' : '○'} 3. Зелье у костра [I]
                    </div>
                    <div
                      className={
                        hud.stage0Tutorial.prepState.foodCooked
                          ? 'text-[#4ade80] font-bold'
                          : 'text-[#cbd5e1]'
                      }
                    >
                      {hud.stage0Tutorial.prepState.foodCooked ? '✓' : '○'} 4. Еда у костра [I]
                    </div>
                  </div>
                  <div className="text-[10px] text-[#94a3b8]">
                    Как рисовать лечилки и еду: постройте Костёр [C], подойдите к нему и нажмите [I] → в блоке «Костёр и Стены» выберите «Зелье Здоровья» и «Жареная Крыса» и обведите контур мышкой!
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TOP-RIGHT PERIMETER CLUSTER: Push-To-Talk Mic [R] + Construction Dropdown (Костёр / Стена / Сломать) + Inventory [I] + Unified Pause/Settings [Esc] (Hidden at hudHideStep >= 1) */}
          {hudHideStep < 1 && (
            <div
              data-testid="hud-top-right-panel"
              className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto"
            >
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  handlePushToTalkTrigger();
                }}
                aria-label="Сказать заклинание в микрофон [R]"
                className={`px-3.5 h-10 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  micListening
                    ? 'bg-[#ef4444] border-[#fca5a5] text-white animate-pulse'
                    : 'bg-[#14111f] hover:bg-[#231e36] border-[#f59e0b] text-[#fde047]'
                }`}
              >
                {micListening ? '● Слушаю [R]...' : '🎤 Голос [R]'}
              </button>

              {/* Single Unified Construction Tab (`Строительство`) with Dropdown for Campfire [C], Wall [B], and Aim-Based Dismantle [N] */}
              <div className="relative">
                <button
                  type="button"
                  tabIndex={-1}
                  data-testid="hud-construction-tab-btn"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setBuildMenuOpen((prev) => !prev);
                  }}
                  aria-label="Открыть вкладку Строительство (Костёр, Стена, Сломать)"
                  className={`px-3.5 h-10 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    buildMenuOpen
                      ? 'bg-[#f59e0b] border-[#fde047] text-[#09080d] shadow-lg'
                      : 'border-[#fbbf24] bg-[#21180d] hover:bg-[#332514] text-[#fde68a]'
                  }`}
                >
                  <span>🏗️</span>
                  <span>Строительство</span>
                  <span className="text-[10px] font-mono-num opacity-85">
                    ({hud.builtWallsCount || 0}/{MAX_BUILT_WALLS}) {buildMenuOpen ? '▲' : '▼'}
                  </span>
                </button>

                {buildMenuOpen && (
                  <div
                    data-testid="hud-construction-menu"
                    className="absolute right-0 mt-2 w-[265px] p-3 rounded-xl border border-[#f59e0b] bg-[#14111f]/95 shadow-2xl space-y-2 z-30"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono-num text-[#cbd5e1] pb-1.5 border-b border-[#2a233d]">
                      <span className="flex items-center gap-1.5 font-bold text-[#fde047]">
                        <ItemBadgeIcon kind="reagent" reagentId="ancient_wood" size={20} />
                        <span>Дрова в сумке:</span>
                      </span>
                      <span className="font-bold text-white">
                        {reagentInventory.ancient_wood || 0} шт.
                      </span>
                    </div>

                    <button
                      type="button"
                      data-testid="hud-place-campfire-btn"
                      onClick={() => {
                        handlePlaceCampfire();
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-[#f97316] bg-[#1c1310] hover:bg-[#2b1c16] text-[#fed7aa] text-xs font-bold transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <ItemBadgeIcon kind="campfire" size={22} />
                        <span>Костёр [C]</span>
                      </span>
                      <span className="font-mono-num text-[11px] text-[#fdba74]">
                        -{CAMPFIRE_WOOD_COST} Дрова
                      </span>
                    </button>

                    <button
                      type="button"
                      data-testid="hud-place-wall-btn"
                      onClick={() => {
                        handlePlaceWall();
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-[#fbbf24] bg-[#21180d] hover:bg-[#332514] text-[#fde68a] text-xs font-bold transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>
                        🧱 Стена ({hud.builtWallsCount || 0}/{MAX_BUILT_WALLS}) [B]
                      </span>
                      <span className="font-mono-num text-[11px] text-[#fde047]">
                        -{WALL_WOOD_COST} Дрова
                      </span>
                    </button>

                    <button
                      type="button"
                      data-testid="hud-dismantle-wall-btn"
                      onClick={() => {
                        handleDismantleWall();
                      }}
                      className={`w-full px-3 py-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                        hud.aimedWallId
                          ? 'border-[#4ade80] bg-[#132a1f] hover:bg-[#1a3a2b] text-[#bbf7d0]'
                          : 'border-[#f87171] bg-[#2a1215] hover:bg-[#3d1a1e] text-[#fecaca]'
                      }`}
                    >
                      <span>
                        🔨 Сломать [N]{' '}
                        <span className="text-[10px] font-normal opacity-90">
                          ({hud.aimedWallId ? 'в прицеле ✓' : 'по прицелу'})
                        </span>
                      </span>
                      <span className="font-mono-num text-[11px]">
                        +{WALL_DISMANTLE_WOOD_REFUND} Дрова
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Inventory [I] Button (opens Inventory tab directly!) */}
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-inventory-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setGrimoireTab('inventory');
                  setGrimoireOpen(true);
                  worldRef.current?.setMode('paused');
                  worldRef.current?.pushHudSnapshot();
                }}
                className="px-3 h-10 rounded-xl border border-[#38bdf8] bg-[#101c29] hover:bg-[#16283b] text-[#bae6fd] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <span>🎒 Инвентарь [I]</span>
                {readyToClaimQuestsCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#22c55e] text-[#09080d] animate-pulse">
                    +{readyToClaimQuestsCount}
                  </span>
                )}
              </button>

              {/* Unified Settings & Pause Icon Button [Esc] (Sound + Graphics + Pause combined in 1 icon!) */}
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-pause-settings-btn"
                aria-label="Настройки и Пауза [Esc]"
                title="Настройки и Пауза [Esc]"
                onClick={(e) => {
                  e.currentTarget.blur();
                  handleTogglePause();
                }}
                className="w-10 h-10 rounded-xl border border-[#3b3154] bg-[#14111f] hover:bg-[#231e36] flex items-center justify-center text-[#fde047] cursor-pointer shrink-0"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="8.5" stroke="#c4b5fd" strokeWidth="1.6" />
                  <rect x="9" y="8" width="2.2" height="8" rx="0.8" fill="#fde047" stroke="none" />
                  <rect x="12.8" y="8" width="2.2" height="8" rx="0.8" fill="#fde047" stroke="none" />
                </svg>
              </button>
            </div>
          )}

          {/* STRICTLY FIXED-POSITION CENTER RETICLE & RUNE GESTURE CANVAS */}
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] flex items-center justify-center pointer-events-none">
            <canvas
              ref={gestureOverlayCanvasRef}
              width={220}
              height={220}
              data-testid="gesture-overlay-canvas"
              className={`w-[220px] h-[220px] pointer-events-none ${
                hudHideStep >= 4 ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <svg
              viewBox="0 0 32 32"
              data-testid="center-reticle-svg"
              className={`absolute w-7 h-7 transition-transform duration-75 ${
                hitMarkerActive ? 'scale-135 opacity-100' : 'scale-100 opacity-80'
              }`}
              aria-hidden="true"
            >
              <circle
                cx="16"
                cy="16"
                r="9"
                fill="none"
                stroke={hitMarkerActive ? '#ef4444' : '#f59e0b'}
                strokeWidth={hitMarkerActive ? '2.2' : '1.5'}
              />
              {hitMarkerActive && (
                <g stroke="#fde047" strokeWidth="2" strokeLinecap="round">
                  <line x1="5" y1="5" x2="9.5" y2="9.5" />
                  <line x1="27" y1="5" x2="22.5" y2="9.5" />
                  <line x1="5" y1="27" x2="9.5" y2="22.5" />
                  <line x1="27" y1="27" x2="22.5" y2="22.5" />
                </g>
              )}
              <circle
                cx="16"
                cy="16"
                r={hitMarkerActive ? '2.6' : '2'}
                fill={hitMarkerActive ? '#fde047' : '#38bdf8'}
              />
            </svg>
            {(micListening || voiceSpellMatched) && (
              <div
                data-testid="voice-mic-badge"
                aria-hidden="true"
                className={`absolute left-[120px] top-[76px] w-6 h-6 rounded-full border flex items-center justify-center shadow-md pointer-events-none ${
                  voiceSpellMatched
                    ? 'bg-[#16a34a]/90 border-[#4ade80] text-white'
                    : 'bg-[#dc2626]/90 border-[#f87171] text-white animate-pulse'
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </div>
            )}
          </div>

          {/* SEPARATE STATUS BANNERS CONTAINER BELOW THE CENTER CANVAS (Never shifts the rune contour!) */}
          {hudHideStep < 4 && (
            <div className="fixed left-1/2 top-[calc(50%+114px)] -translate-x-1/2 flex flex-col items-center pointer-events-none">

              {/* Contextual Water / Snow Gesture Indicator */}
              {hud.aimSurfaceTarget !== 'none' && (
                <div
                  className="mt-1 px-3 py-1 rounded-lg border border-[#38bdf8] text-[11px] font-bold text-[#bae6fd] whitespace-nowrap"
                  style={{ backgroundColor: 'rgba(12, 22, 36, 0.92)' }}
                >
                  {hud.aimSurfaceTarget === 'water'
                    ? selectedSpellId === 'glacius'
                      ? '❄ На воде + Мороз [2]: нарисуйте Снежинку → Снег!'
                      : selectedSpellId === 'engorgio'
                      ? '💧 На воде + Рост [6]: нарисуйте 2 шарика → Водяной помощник!'
                      : '💧 Вы смотрите на воду: выберите Мороз [2] (Снег) или Рост [6] (Водяной)'
                    : selectedSpellId === 'engorgio'
                    ? '⛄ На снегу + Рост [6]: нарисуйте 3 кружка → Снеговик!'
                    : '❄ Вы смотрите на снег: выберите Рост [6], чтобы слепить Снеговика'}
                </div>
              )}

              {/* Home Teleport ('Домой' [F]) Channeling Progress Bar (3.0s Quick / 2.0s Voice / 2.2..1.5s Drawn) */}
              {hud.campfireTeleportCast?.active && (
                <div
                  data-testid="campfire-teleport-channel"
                  className="mt-1.5 w-[240px] p-2 rounded-xl border border-[#fb923c] shadow-xl pointer-events-none"
                  style={{ backgroundColor: 'rgba(26, 15, 10, 0.95)' }}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold font-mono-num text-[#fed7aa] mb-1">
                    <span>🏠 Домой (к костру)...</span>
                    <span>{Math.max(0, hud.campfireTeleportCast.remainingSec).toFixed(1)}с</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#09080d] rounded-full overflow-hidden border border-[#7c2d12]">
                    <div
                      className="h-full bg-gradient-to-r from-[#f97316] to-[#fde047] transition-all duration-75"
                      style={{
                        width: `${Math.min(
                          100,
                          ((hud.campfireTeleportCast.totalSec -
                            hud.campfireTeleportCast.remainingSec) /
                            Math.max(0.1, hud.campfireTeleportCast.totalSec)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 2.0s Wooden Wall Construction Progress Bar */}
              {hud.activeWallBuildCast && (
                <div
                  data-testid="wall-build-channel"
                  className="mt-1.5 w-[240px] p-2 rounded-xl border border-[#fbbf24] shadow-xl pointer-events-none"
                  style={{ backgroundColor: 'rgba(28, 20, 10, 0.95)' }}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold font-mono-num text-[#fde68a] mb-1">
                    <span>🧱 Постройка стены...</span>
                    <span>{Math.max(0, hud.activeWallBuildCast.remainingSec).toFixed(1)}с</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#09080d] rounded-full overflow-hidden border border-[#78350f]">
                    <div
                      className="h-full bg-gradient-to-r from-[#d97706] to-[#fde047] transition-all duration-75"
                      style={{
                        width: `${Math.min(
                          100,
                          ((hud.activeWallBuildCast.totalSec -
                            hud.activeWallBuildCast.remainingSec) /
                            Math.max(0.1, hud.activeWallBuildCast.totalSec)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 2-STEP TREASURE CHEST CONTENTS PREVIEW WINDOW (1st [E] opens & shows contents; 2nd [E] takes items!) */}
              {hud.openChestPreview && (
                <div
                  data-testid="chest-preview-modal"
                  className="fixed left-[calc(50%+130px)] top-1/2 -translate-y-1/2 z-30 w-[300px] p-3.5 rounded-xl border-2 border-[#f59e0b] shadow-2xl pointer-events-auto space-y-2.5"
                  style={{ backgroundColor: 'rgba(14, 12, 22, 0.96)' }}
                >
                  <div className="flex items-center justify-between border-b border-[#3b3154] pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🧰</span>
                      <div>
                        <div className="text-xs font-bold text-[#fde047]">
                          {hud.openChestPreview.label}
                        </div>
                        <div className="text-[10px] text-[#94a3b8] font-mono-num">
                          Содержимое сундука (Этап {hud.labyrinthStage})
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold font-mono-num rounded bg-[#2a1f10] text-[#fde047] border border-[#f59e0b]/40">
                      Открыт
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-0.5">
                    {/* Wearable Artifact inside Chest (if any) */}
                    {hud.openChestPreview.artifactId &&
                      ARTIFACT_CATALOG[hud.openChestPreview.artifactId] &&
                      (() => {
                        const previewArt = ARTIFACT_CATALOG[hud.openChestPreview.artifactId!];
                        const alreadyOwnedCopies = getArtifactOwnedCount(
                          previewArt.id,
                          ownedArtifacts
                        );
                        return (
                          <div
                            data-testid="chest-preview-artifact"
                            className="p-2 rounded-lg bg-[#231934] border border-[#c084fc] flex items-center gap-2.5"
                          >
                            <ItemBadgeIcon
                              kind={previewArt.slot}
                              tier={previewArt.tier}
                              size={34}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-[#f3e8ff] truncate">
                                  {previewArt.name}
                                </span>
                                {alreadyOwnedCopies >= 1 && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#f59e0b] text-[#09080d] text-[9px] font-extrabold uppercase shrink-0">
                                    Дубликат (×{alreadyOwnedCopies + 1})
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-mono-num text-[#d8b4fe]">
                                {ARTIFACT_SLOT_LABELS[previewArt.slot]} · Ур. {previewArt.tier}
                                {alreadyOwnedCopies >= 1
                                  ? ' · Можно разобрать на 50% рес.!'
                                  : ''}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    {/* Reagents inside Chest */}
                    {hud.openChestPreview.reagents.map(({ id: rId, count: qty }) => {
                      const r = REAGENTS[rId];
                      if (!r || !qty) return null;
                      return (
                        <div
                          key={rId}
                          data-testid={`chest-preview-reagent-${rId}`}
                          className="p-1.5 rounded-lg bg-[#161321] border border-[#2a233d] flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <ItemBadgeIcon kind="reagent" reagentId={rId} size={28} />
                            <span className="text-xs font-semibold text-[#e2d9f3] truncate">
                              {r.name}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-[#231e36] text-xs font-bold font-mono-num text-[#fde047] shrink-0">
                            ×{qty}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    data-testid="chest-take-btn"
                    onClick={() => worldRef.current?.collectActivePreviewChest()}
                    className="w-full py-2 px-3 rounded-lg bg-[#22c55e] hover:bg-[#4ade80] text-[#09080d] text-xs font-extrabold uppercase tracking-wider shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>[E] Взять всё из сундука</span>
                  </button>
                </div>
              )}

              {/* Nearby Tame / Harvest / Loot Prompt ([E]) */}
              {hud.nearbyInteractPrompt && !hud.openChestPreview && (
                <div
                  className="mt-1.5 px-3.5 py-1.5 rounded-lg border border-[#f59e0b] text-xs font-bold text-[#fde047] pointer-events-auto cursor-pointer whitespace-nowrap"
                  style={{ backgroundColor: 'rgba(14, 12, 22, 0.92)' }}
                  onClick={() => worldRef.current?.tryHarvestOrInteract()}
                >
                  {hud.nearbyInteractPrompt}
                </div>
              )}

              {/* Celebratory Quest Completed Banner (Click to open Quests tab & claim reward!) */}
              {questCompletedBanner && (
                <div
                  className="mt-1.5 px-4 py-1.5 rounded-lg border-2 border-[#22c55e] text-xs font-bold text-[#bbf7d0] shadow-lg pointer-events-auto cursor-pointer animate-pulse whitespace-nowrap"
                  style={{ backgroundColor: 'rgba(15, 38, 26, 0.95)' }}
                  onClick={() => {
                    setQuestCompletedBanner(null);
                    setGrimoireTab('quests');
                    setGrimoireOpen(true);
                    worldRef.current?.setMode('paused');
                    worldRef.current?.pushHudSnapshot();
                  }}
                >
                  {questCompletedBanner}
                </div>
              )}

              {/* Toast Notification */}
              {toastMessage && (
                <div
                  className="mt-1.5 px-3.5 py-1 rounded-lg border border-[#22c55e] text-xs font-semibold text-[#bbf7d0] whitespace-nowrap"
                  style={{ backgroundColor: 'rgba(14, 12, 22, 0.92)' }}
                >
                  {toastMessage}
                </div>
              )}
            </div>
          )}

          {/* =====================================================================
              CONTROLS HELP OVERLAY (Shown at Labyrinth start & toggled via [.] Period key;
              auto-closes after 15s or on any action key!)
             ===================================================================== */}
          {showControlsHelp && hudHideStep < 3 && (
            <div
              data-testid="controls-help-overlay"
              className={`fixed ${
                hud.labyrinthStage === 0 && hud.stage0Tutorial ? 'top-44' : 'top-20'
              } left-1/2 -translate-x-1/2 z-30 w-full max-w-[660px] px-4 pointer-events-none`}
            >
              <div
                className="p-4 rounded-xl border border-[#f59e0b] shadow-2xl space-y-3"
                style={{ backgroundColor: 'rgba(14, 12, 22, 0.94)' }}
              >
                <div className="flex items-center justify-between border-b border-[#2a233d] pb-2 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#fde047] font-display">
                      ⌨️ Управление ({controlScheme === 'alternative' ? '⚡ Основное (Лёгкое)' : '🪄 Классическое'})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => setShowControlsHelp(false)}
                      className="px-2 py-0.5 text-[11px] font-bold rounded bg-[#231e36] hover:bg-[#322b4d] text-[#cbd5e1] cursor-pointer"
                    >
                      Закрыть [ . ]
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono-num text-[#e2d9f3]">
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#94a3b8]">Движение:</span>
                    <strong className="text-[#fde047]">[W A S D] / Стрелки</strong>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#94a3b8]">Поворот камеры:</span>
                    <strong className="text-[#fde047]">
                      {controlScheme === 'alternative'
                        ? 'Просто движение мыши (без [ЛКМ]!)'
                        : 'Зажать [ЛКМ] / [Q] влево / [T] вправо'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#94a3b8]">Рисовать / Удар мечом:</span>
                    <strong className="text-[#4ade80]">
                      {controlScheme === 'alternative'
                        ? 'Зажать [ПКМ] (камера фиксируется, перо сразу на ●!)'
                        : 'Зажать [ПКМ] (с мечом: ←/→ удар)'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#94a3b8]">Сказать голосом:</span>
                    <strong className="text-[#38bdf8]">Зажать [R] (работает с Мечом!)</strong>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#94a3b8]">Выбор заклинаний:</span>
                    <strong className="text-[#fde047]">
                      Колесо мыши / [1–6], [Tab] Лечение, [Caps] Меч, [Ё], [F], [G]
                    </strong>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#94a3b8]">Каст по нажатию:</span>
                    <strong className="text-[#fde047]">
                      {controlScheme === 'alternative'
                        ? 'Клик [ЛКМ] / [Пробел] / Клик [ПКМ] (20% силы!)'
                        : '[Пробел] (20% силы!)'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#94a3b8]">Сундук (осмотр / взять) / Сбор:</span>
                    <strong className="text-[#4ade80]">[E] (2 нажатия для сундука)</strong>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#94a3b8]">Сложить костёр (макс. 1):</span>
                    <strong className="text-[#fb923c]">[C] (зажечь Огнём [1])</strong>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#94a3b8]">Стена / Сломать по прицелу:</span>
                    <strong className="text-[#fde047]">[B] (-2🪵) / [N] (+1🪵)</strong>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#94a3b8]">Артефакты / Заклинания / Квесты:</span>
                    <strong className="text-[#38bdf8]">[I] / [U] / [Y]</strong>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#94a3b8]">Пауза и Настройки (Звук / Управление):</span>
                    <strong className="text-[#fde047]">[Esc]</strong>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#94a3b8]">Зелье ОЗ / Зелье МП / Еда:</span>
                    <strong className="text-[#4ade80]">[Z] / [X] / [V]</strong>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#94a3b8]">Скрыть интерфейс по шагам:</span>
                    <strong className="text-[#fde047]">[H] (5 нажатий)</strong>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-[#94a3b8]">Мини-радар (вкл / выкл для FPS):</span>
                    <strong className="text-[#38bdf8]">[M]</strong>
                  </div>
                </div>

                <div className="text-[11px] text-center text-[#a39bb5] pt-1 border-t border-[#2a233d]">
                  Нажмите <strong>[ . ] (Точка)</strong> в любой момент, чтобы снова открыть подсказку · Режим управления можно сменить в Настройках <strong>[Esc]</strong>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              MINIMAL BOTTOM SPELL DOCK + 5-STATE PROGRESSIVE [H] HIDE
              - Step 0: Full interface
              - Step 1: Hide top-right panel
              - Step 2: Also hide top-left panel
              - Step 3: Also hide bottom dock & [ . ] button
              - Step 4: Also hide rune contour canvas (keep crosshair SVG!)
             ===================================================================== */}
          <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-full max-w-[890px] px-4 flex flex-col items-center gap-1.5 pointer-events-auto">
            {/* [H] Visibility Hint Badge (Always visible, including Step 4!) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-visibility-toggle"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setHudHideStep((prev) => ((prev + 1) % 5) as 0 | 1 | 2 | 3 | 4);
                }}
                className="px-3 py-1 rounded-lg border border-[#3b3154] bg-[#14111f]/90 hover:bg-[#231e36] text-[11px] font-mono-num text-[#cbd5e1] transition-colors cursor-pointer"
              >
                {hudHideStep < 4 ? '[H] Скрыть интерфейс' : '[H] Вернуть интерфейс'}
              </button>

              {hudHideStep < 3 && (
                <button
                  type="button"
                  tabIndex={-1}
                  data-testid="controls-help-toggle-btn"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setShowControlsHelp((prev) => !prev);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-[#3b3154] bg-[#14111f]/90 hover:bg-[#231e36] text-[11px] font-mono-num text-[#fde047] transition-colors cursor-pointer"
                >
                  [ . ] Подсказка кнопок
                </button>
              )}
            </div>

            {hudHideStep < 3 && (
              <SpellDockGrid
                selectedSpellId={selectedSpellId}
                spellLevels={spellLevels}
                aimSurfaceTarget={hud.aimSurfaceTarget}
                spellCooldowns={hud.spellCooldowns}
                onSelectSpell={handleSelectSpell}
              />
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          3. GRIMOIRE / SETTINGS MODAL
         ===================================================================== */}
      {grimoireOpen && (
        <GrimoireModal
          activeTab={grimoireTab}
          onSelectTab={setGrimoireTab}
          onClose={() => {
            setGrimoireOpen(false);
            if (gameState === 'playing') {
              worldRef.current?.setMode('playing');
            }
          }}
          playerLevel={playerLevel}
          playerXp={playerXp}
          nextLevelXp={nextLevelXp}
          gestureMasteryLevel={gestureMasteryLevel}
          selectedSpellId={selectedSpellId}
          onSelectSpell={handleSelectSpell}
          spellLevels={spellLevels}
          onUpgradeSpell={handleUpgradeSpell}
          reagentInventory={reagentInventory}
          ownedEquipment={ownedEquipment}
          equippedStaffId={equippedStaffId}
          onCraftOrEquip={handleCraftOrEquip}
          ownedArtifacts={ownedArtifacts}
          equippedArtifacts={equippedArtifacts}
          onCraftOrEquipArtifact={handleCraftOrEquipArtifact}
          onSalvageArtifact={handleSalvageArtifact}
          quests={quests}
          onClaimQuest={handleClaimQuest}
          tamedPet={hud.tamedPet}
          onSelectTamedPet={handleSelectTamedPet}
          onUpgradeTamedPet={handleUpgradeTamedPet}
          campfireStatus={hud.campfireStatus}
          campfireWallsCount={hud.campfireWallsCount || 0}
          campfireSheltered={Boolean(hud.campfireSheltered)}
          builtWallsCount={hud.builtWallsCount || 0}
          activeFoodBuff={hud.activeFoodBuff}
          activeBatFoodBuff={hud.activeBatFoodBuff}
          craftedPotions={craftedPotions}
          cookedFoods={cookedFoods}
          cookedBatFoods={cookedBatFoods}
          onPlaceCampfire={handlePlaceCampfire}
          onPlaceWall={handlePlaceWall}
          onDismantleWall={handleDismantleWall}
          onCraftAtCampfire={handleCraftAtCampfire}
          onUsePotion={handleUsePotion}
          onEatFood={handleEatFood}
          onEatBatFood={handleEatBatFood}
          onPracticeGestureComplete={(acc, complete, xpMultiplier = 1) => {
            const mult = Math.max(1, Math.round(xpMultiplier ?? 1));
            const earnedXp = calculatePracticeGestureXp(acc) * mult;
            if (earnedXp > 0) {
              grantXp(earnedXp);
              if (complete || acc >= 75) {
                setGestureMasteryLevel((lvl) => Math.min(10, lvl + 1));
              }
              audioEngine.playPickupChime();
            }
          }}
          pvpConnected={pvpConnected}
          pvpRoom={pvpRoom}
          pvpPlayerName={pvpPlayerName}
          labyrinthMultiplayerMode={labyrinthMultiplayerMode}
          onSelectLabyrinthMultiplayerMode={handleSelectLabyrinthMultiplayerMode}
          remotePlayers={remotePlayers}
          onJoinPvpRoom={(room, name) => {
            const parsed = parseTwoDigitRoomCode(room);
            if (!parsed) {
              showToast('Введите 2 цифры кода комнаты (10–99)');
              return;
            }
            setPvpRoom(parsed);
            setPvpPlayerName(name);
            connectMultiplayerRoom(parsed, name);
          }}
          onResetPvpDuel={() => {
            roomSessionRef.current?.sendDuelReset();
          }}
        />
      )}

      {/* =====================================================================
          4. COMPACT STEP-BY-STEP PAUSE & SETTINGS MODAL ('paused')
         ===================================================================== */}
      {gameState === 'paused' && !grimoireOpen && !accountModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Настройки и Пауза"
          className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-auto"
          style={{ backgroundColor: 'rgba(9, 8, 13, 0.84)' }}
        >
          <div className="w-full max-w-sm bg-[#14111f] border border-[#3b3154] rounded-xl p-5 space-y-2.5 text-center shadow-2xl">
            <h2 className="font-display text-xl font-bold text-[#fde047] pb-1">
              {pauseSubmenu === 'main'
                ? 'Настройки и Пауза'
                : pauseSubmenu === 'sound'
                ? '🔊 Звук'
                : pauseSubmenu === 'graphics'
                ? '🖥️ Графика'
                : pauseSubmenu === 'controls'
                ? '🎮 Управление'
                : '🌐 Кооп и Режим'}
            </h2>

            {pauseSubmenu === 'main' ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="w-full py-2.5 text-sm font-bold bg-[#f59e0b] hover:bg-[#fbbf24] text-[#09080d] rounded-lg transition-colors cursor-pointer"
                >
                  ▶ Продолжить [Esc]
                </button>
                <button
                  type="button"
                  data-testid="pause-menu-sound-btn"
                  onClick={() => setPauseSubmenu('sound')}
                  className="w-full py-2 px-3 text-xs font-semibold bg-[#1b1729] hover:bg-[#251f38] border border-[#2a233d] text-[#e2d9f3] rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>🔊 Звук ({muted ? 'ВЫКЛ' : `${masterVolume}%`})</span>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  data-testid="pause-menu-graphics-btn"
                  onClick={() => setPauseSubmenu('graphics')}
                  className="w-full py-2 px-3 text-xs font-semibold bg-[#1b1729] hover:bg-[#251f38] border border-[#2a233d] text-[#e2d9f3] rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>
                    🖥️ Графика (
                    {graphicsQuality === 'high'
                      ? 'Высокая'
                      : graphicsQuality === 'medium'
                      ? 'Средняя'
                      : 'Мин.'}
                    )
                  </span>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  data-testid="pause-menu-controls-btn"
                  onClick={() => setPauseSubmenu('controls')}
                  className="w-full py-2 px-3 text-xs font-semibold bg-[#1b1729] hover:bg-[#251f38] border border-[#2a233d] text-[#e2d9f3] rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>🎮 Управление</span>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  data-testid="pause-menu-coop-btn"
                  onClick={() => setPauseSubmenu('coop')}
                  className="w-full py-2 px-3 text-xs font-semibold bg-[#1b1729] hover:bg-[#251f38] border border-[#2a233d] text-[#e2d9f3] rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>🌐 Кооп и Режим</span>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  data-testid="pause-account-btn"
                  onClick={() => setAccountModalOpen(true)}
                  className="w-full py-2 px-3 text-xs font-bold bg-[#251f38] hover:bg-[#332a4d] border border-[#a855f7] text-[#e9d5ff] rounded-lg transition-colors cursor-pointer"
                >
                  👤 Персонаж и Уровни
                </button>
                <button
                  type="button"
                  data-testid="pause-fullscreen-btn"
                  onClick={toggleFullscreen}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                    isFullscreen
                      ? 'bg-[#132a1f] border-[#22c55e] text-[#bbf7d0] hover:bg-[#173628]'
                      : 'bg-[#132638] border-[#38bdf8] text-[#bae6fd] hover:bg-[#1a344c]'
                  }`}
                >
                  {isFullscreen
                    ? '⛶ Полный экран [F11]: ВКЛ'
                    : '⛶ Полный экран [F11]'}
                </button>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleRestartGame}
                    className="py-2 text-xs font-semibold bg-[#231e36] hover:bg-[#312a4a] text-white rounded-lg transition-colors cursor-pointer"
                  >
                    🔄 Заново
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPauseSubmenu('main');
                      worldRef.current?.setMode('title');
                      setGameState('title');
                    }}
                    className="py-2 text-xs font-semibold bg-[#181524] hover:bg-[#231e36] text-[#cbd5e1] rounded-lg transition-colors cursor-pointer"
                  >
                    🏠 В меню
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {pauseSubmenu === 'sound' && (
                  <div
                    data-testid="pause-sound-settings"
                    className="p-3.5 rounded-xl bg-[#1b1729] border border-[#2a233d] space-y-3"
                  >
                    <button
                      type="button"
                      data-testid="pause-mute-toggle-btn"
                      onClick={() => {
                        setMuted((prev) => {
                          const next = !prev;
                          audioEngine.setMuted(next);
                          return next;
                        });
                      }}
                      className={`w-full py-2 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                        muted
                          ? 'bg-[#3b151c] border-[#ef4444] text-[#fecaca]'
                          : 'bg-[#132a1f] border-[#22c55e] text-[#bbf7d0]'
                      }`}
                    >
                      {muted ? '🔇 Мут: ВКЛ' : '🔊 Звук: ВКЛ'}
                    </button>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={muted ? 0 : masterVolume}
                        data-testid="pause-volume-slider"
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setMasterVolume(val);
                          if (val > 0 && muted) {
                            setMuted(false);
                            audioEngine.setMuted(false);
                          }
                          audioEngine.setMasterVolume(val / 100);
                        }}
                        className="w-full accent-[#f59e0b] cursor-pointer"
                      />
                      <span className="text-xs font-mono-num font-bold text-[#fde047] w-11 text-right">
                        {muted ? '0%' : `${masterVolume}%`}
                      </span>
                    </div>
                  </div>
                )}

                {pauseSubmenu === 'graphics' && (
                  <div
                    data-testid="pause-graphics-settings"
                    className="p-3 rounded-xl bg-[#1b1729] border border-[#2a233d] grid grid-cols-1 gap-2"
                  >
                    <button
                      type="button"
                      data-testid="graphics-standard-btn"
                      onClick={() => {
                        setGraphicsQuality('high');
                        worldRef.current?.setGraphicsQuality('high');
                      }}
                      className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                        graphicsQuality === 'high'
                          ? 'bg-[#1e293b] border-[#38bdf8] text-[#bae6fd]'
                          : 'bg-[#12101b] border-[#2a233d] text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      ✨ Высокая
                    </button>
                    <button
                      type="button"
                      data-testid="graphics-simplified-btn"
                      onClick={() => {
                        setGraphicsQuality('medium');
                        worldRef.current?.setGraphicsQuality('medium');
                      }}
                      className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                        graphicsQuality === 'medium'
                          ? 'bg-[#2a1f10] border-[#f59e0b] text-[#fde047]'
                          : 'bg-[#12101b] border-[#2a233d] text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      ⚡ Средняя (FPS+)
                    </button>
                    <button
                      type="button"
                      data-testid="graphics-ultralow-btn"
                      onClick={() => {
                        setGraphicsQuality('ultralow');
                        worldRef.current?.setGraphicsQuality('ultralow');
                      }}
                      className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                        graphicsQuality === 'ultralow'
                          ? 'bg-[#132a1f] border-[#22c55e] text-[#bbf7d0]'
                          : 'bg-[#12101b] border-[#2a233d] text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      🚀 Мин. (Макс FPS)
                    </button>
                  </div>
                )}

                {pauseSubmenu === 'controls' && (
                  <div
                    data-testid="pause-control-scheme-settings"
                    className="p-3 rounded-xl bg-[#1b1729] border border-[#2a233d] grid grid-cols-1 gap-2"
                  >
                    <button
                      type="button"
                      data-testid="control-scheme-alternative-btn"
                      onClick={() => handleSelectControlScheme('alternative')}
                      className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                        controlScheme === 'alternative'
                          ? 'bg-[#132a1f] border-[#22c55e] text-[#bbf7d0]'
                          : 'bg-[#12101b] border-[#2a233d] text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      ⚡ Основное (Лёгкое)
                    </button>
                    <button
                      type="button"
                      data-testid="control-scheme-classic-btn"
                      onClick={() => handleSelectControlScheme('classic')}
                      className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                        controlScheme === 'classic'
                          ? 'bg-[#2a1f10] border-[#f59e0b] text-[#fde047]'
                          : 'bg-[#12101b] border-[#2a233d] text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      🪄 Классическое
                    </button>
                  </div>
                )}

                {pauseSubmenu === 'coop' && (
                  <div
                    data-testid="pause-coop-settings"
                    className="p-3.5 rounded-xl bg-[#1b1729] border border-[#2a233d] space-y-2.5 text-left"
                  >
                    <div className="flex items-center justify-between text-xs font-mono-num text-[#4ade80] font-bold">
                      <span>{pvpRoom ? `Код комнаты: ${pvpRoom}` : 'Одиночная игра'}</span>
                      <span>Игроков: {remotePlayers.length + 1}</span>
                    </div>
                    <button
                      type="button"
                      data-testid="pause-coop-mode-toggle-btn"
                      onClick={() => {
                        const nextMode: LabyrinthMultiplayerMode =
                          labyrinthMultiplayerMode === 'shared' ? 'parallel' : 'shared';
                        handleSelectLabyrinthMultiplayerMode(nextMode);
                      }}
                      className={`w-full px-3 py-2.5 rounded-lg border text-xs font-mono-num flex items-center justify-between transition-colors cursor-pointer ${
                        labyrinthMultiplayerMode === 'shared'
                          ? 'bg-[#132a1f] border-[#22c55e] text-[#bbf7d0]'
                          : 'bg-[#1f1633] border-[#a855f7] text-[#e9d5ff]'
                      }`}
                    >
                      <span className="font-bold">
                        {labyrinthMultiplayerMode === 'shared'
                          ? '🤝 Общие враги'
                          : '🌀 Свои миры'}
                      </span>
                      <span className="text-[11px] opacity-90">⇄</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  data-testid="pause-submenu-back-btn"
                  onClick={() => setPauseSubmenu('main')}
                  className="w-full py-2.5 text-xs font-bold bg-[#231e36] hover:bg-[#312a4a] text-[#fde047] rounded-lg transition-colors cursor-pointer"
                >
                  ← Назад
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          5. GAME OVER / LABYRINTH VICTORY MODAL ('gameover')
         ===================================================================== */}
      {gameState === 'gameover' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Итоги Сражения"
          className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-auto"
          style={{ backgroundColor: 'rgba(9, 8, 13, 0.86)' }}
        >
          <div className="w-full max-w-md bg-[#14111f] border border-[#3b3154] rounded-xl p-6 space-y-5 text-center shadow-2xl">
            <h2
              className={`font-display text-2xl font-bold ${
                endStats?.victory ? 'text-[#22c55e]' : 'text-[#ef4444]'
              }`}
            >
              {endStats?.victory
                ? 'Все 5 Уровней Лабиринта Пройдены!'
                : 'Магический Щит Пробит'}
            </h2>

            {endStats?.victory && (
              <div className="p-3 rounded-lg bg-[#291016] border border-[#ef4444] text-xs text-[#fecaca]">
                🔥 <strong>Открыта Сложность II: «КОШМАР» (Diablo Nightmare)!</strong> Теперь на вашем аккаунте доступна повышенная сложность, где все мобы сильнее 5-го уровня, быстрее бегают и стремительнее метают снаряды!
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 text-center font-mono-num">
              <div className="p-3 rounded-lg bg-[#1b1729] border border-[#2a233d]">
                <div className="text-[10px] uppercase text-[#a39bb5]">СЧЕТ</div>
                <div className="text-base font-bold text-[#fde047] mt-0.5">
                  {endStats?.score ?? hud.score}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#1b1729] border border-[#2a233d]">
                <div className="text-[10px] uppercase text-[#a39bb5]">ЭТАП</div>
                <div className="text-base font-bold text-[#38bdf8] mt-0.5">
                  {hud.mapMode === 'labyrinth'
                    ? `${hud.labyrinthStage}/5`
                    : `Волна ${endStats?.wave ?? hud.wave}`}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#1b1729] border border-[#2a233d]">
                <div className="text-[10px] uppercase text-[#a39bb5]">ПОБЕЖДЕНО</div>
                <div className="text-base font-bold text-[#22c55e] mt-0.5">
                  {endStats?.enemiesDefeated ?? 0}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {endStats?.victory && (
                <button
                  type="button"
                  data-testid="victory-start-nightmare-btn"
                  onClick={() => {
                    setSelectedDifficulty(2);
                    worldRef.current?.setDifficultyTier(2);
                    handleStartGameWithMode('labyrinth', labyrinthMultiplayerMode, 1);
                  }}
                  className="w-full py-3.5 text-sm font-bold uppercase tracking-wider bg-[#dc2626] hover:bg-[#ef4444] text-white rounded-lg transition-colors cursor-pointer shadow-lg"
                >
                  🔥 Начать Сложность II: Кошмар (Этап 1)
                </button>
              )}
              <button
                type="button"
                data-start="true"
                onClick={handleRestartGame}
                className="w-full py-3.5 text-sm font-bold uppercase tracking-wider bg-[#f59e0b] hover:bg-[#fbbf24] text-[#09080d] rounded-lg transition-colors cursor-pointer"
              >
                Сыграть Снова
              </button>
              <button
                type="button"
                onClick={() =>
                  handleStartGameWithMode(hud.mapMode === 'labyrinth' ? 'arena' : 'labyrinth')
                }
                className="w-full py-2.5 text-xs font-semibold bg-[#231e36] hover:bg-[#312a4a] text-[#fde047] rounded-lg transition-colors cursor-pointer"
              >
                {hud.mapMode === 'labyrinth'
                  ? 'На Полигон / PvP Арену'
                  : 'В Лабиринт (5 Уровней)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. ACCOUNT, MULTI-CHARACTER, STAGES (1..5) & DIABLO DIFFICULTY MODAL
         ===================================================================== */}
      {accountModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Аккаунт и Персонажи"
          data-testid="account-characters-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto"
          style={{ backgroundColor: 'rgba(9, 8, 13, 0.88)' }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#14111f] border border-[#4c3d75] rounded-2xl p-6 space-y-5 shadow-2xl text-[#e2d9f3]">
            <div className="flex items-center justify-between border-b border-[#2a233d] pb-3">
              <div>
                <h2 className="font-display text-xl font-bold text-[#fde047]">
                  👤 Аккаунт, Персонажи и Сложность (Diablo)
                </h2>
                <p className="text-xs text-[#a39bb5]">
                  Сохраняйте прокачку, создавайте или удаляйте персонажей в любой момент и заходите сразу на открытые уровни (1–5)
                </p>
              </div>
              <button
                type="button"
                data-testid="close-account-modal-btn"
                onClick={() => {
                  setAccountModalOpen(false);
                  if (gameState === 'playing') {
                    worldRef.current?.setMode('playing');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-[#231e36] hover:bg-[#312a4a] text-xs font-bold text-white cursor-pointer"
              >
                Закрыть ✕
              </button>
            </div>

            {/* Local Profile Persistence Section */}
            <div className="p-4 rounded-xl bg-[#1b1729] border border-[#3b3154] flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-bold text-white">
                  💾 Локальное сохранение профилей
                </div>
                <div className="text-xs text-[#a39bb5]">
                  Прогресс привязан к имени/коду персонажа и сохраняется автоматически в вашем браузере.
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualSaveCharacter}
                  className="px-3 py-2 rounded-lg bg-[#132a1f] hover:bg-[#1a3a2b] border border-[#22c55e] text-xs font-bold text-[#bbf7d0] cursor-pointer"
                >
                  💾 Сохранить прокачку
                </button>
                <button
                  type="button"
                  data-testid="export-char-code-btn"
                  onClick={handleExportCharacterCode}
                  className="px-3 py-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#38bdf8] text-xs font-bold text-[#bae6fd] cursor-pointer"
                >
                  📋 Экспорт кода мага
                </button>
              </div>
            </div>

            {/* Create New Character & Import Bar */}
            <div className="p-4 rounded-xl bg-[#1b1729] border border-[#3b3154] space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#fde047]">
                ✨ Создать нового персонажа или импортировать код
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newCharNameInput}
                  onChange={(e) => setNewCharNameInput(e.target.value)}
                  placeholder="Имя мага или вставьте код экспорта..."
                  maxLength={16000}
                  data-testid="new-char-name-input"
                  className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-[#0f0c18] border border-[#3b3154] text-xs text-white focus:outline-none focus:border-[#f59e0b]"
                />
                <button
                  type="button"
                  data-testid="create-char-btn"
                  onClick={() => handleCreateNewCharacter()}
                  className="px-4 py-2 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#09080d] text-xs font-bold cursor-pointer"
                >
                  + Добавить персонажа
                </button>
                <button
                  type="button"
                  data-testid="load-char-by-code-btn"
                  onClick={() => handleLoadCharacterByNameOrCode()}
                  className="px-3 py-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#38bdf8] text-[#bae6fd] text-xs font-bold cursor-pointer"
                >
                  🔎 Найти по имени/коду
                </button>
                <button
                  type="button"
                  data-testid="import-char-code-btn"
                  onClick={() => handleImportCharacterCode()}
                  className="px-3 py-2 rounded-lg bg-[#251f38] hover:bg-[#332a4d] border border-[#a855f7] text-[#e9d5ff] text-xs font-bold cursor-pointer"
                >
                  📥 Импорт кода
                </button>
              </div>

              {/* Compact Character List (Only Character Name & Unlocked Stages!) */}
              <div className="space-y-1.5 pt-2">
                {characters.map((ch) => {
                  const isCurrent = ch.id === activeCharacterId;
                  const stD1 = ch.unlockedStageD1 || 1;
                  return (
                    <div
                      key={ch.id}
                      data-testid={`char-row-${ch.id}`}
                      className={`px-3 py-2 rounded-lg border flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-[#261e14] border-[#f59e0b]'
                          : 'bg-[#120f1d] border-[#2a233d]'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <span>🧙 {ch.name}</span>
                        <span className="text-[#fde047] font-mono-num">
                          · Пройдено ур.: {stD1}/5
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isCurrent && (
                          <button
                            type="button"
                            data-testid={`select-char-btn-${ch.id}`}
                            onClick={() => handleSwitchCharacter(ch.id)}
                            className="px-2.5 py-1 rounded bg-[#1e293b] hover:bg-[#334155] border border-[#38bdf8] text-[11px] font-bold text-[#bae6fd] cursor-pointer"
                          >
                            Выбрать
                          </button>
                        )}
                        <button
                          type="button"
                          data-testid={`delete-char-btn-${ch.id}`}
                          onClick={() => handleDeleteCharacter(ch.id)}
                          className="px-2.5 py-1 rounded bg-[#2a1219] hover:bg-[#3d1a24] border border-[#ef4444] text-[11px] font-bold text-[#fca5a5] cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Diablo Difficulty & Unlocked Stages (1..5) */}
            <div className="p-4 rounded-xl bg-[#1b1729] border border-[#3b3154] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#fde047]">
                  🔥 Сложность (Diablo) и Быстрый Вход на Этапы (1–5)
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUnlockedStageD1(5);
                    setUnlockedStageD2(5);
                    setHighestUnlockedDifficulty(2);
                    showToast('🔓 Открыты все уровни (1–5) и Сложность II «Кошмар»!');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#231e36] hover:bg-[#312a4a] border border-[#f59e0b] text-[11px] font-bold text-[#fde047] cursor-pointer"
                >
                  🔓 Разблокировать Ур. 1–5 и Кошмар II (Тест)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {([1, 2] as const).map((tier) => {
                  const def = DIFFICULTY_CATALOG[tier];
                  const unlocked = tier <= highestUnlockedDifficulty;
                  const active = selectedDifficulty === tier;
                  const mult = getDiabloDifficultyMultipliers(tier, 1);
                  return (
                    <button
                      key={tier}
                      type="button"
                      data-testid={`modal-difficulty-${tier}`}
                      onClick={() => handleSelectDifficultyTier(tier)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? tier === 2
                            ? 'bg-[#3b151c] border-[#ef4444] text-white'
                            : 'bg-[#1b283d] border-[#38bdf8] text-white'
                          : unlocked
                          ? 'bg-[#120f1d] border-[#3b3154] text-[#cbd5e1]'
                          : 'bg-[#120f1d] border-[#241e33] text-[#64748b]'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>{def.name}</span>
                        <span>{active ? '✓ Выбрана' : unlocked ? 'Доступна' : '🔒 Закрыта'}</span>
                      </div>
                      <p className="text-[11px] opacity-85 mt-1 leading-snug">{def.description}</p>
                      {tier === 2 && (
                        <div className="mt-1.5 text-[10px] font-mono-num text-[#fca5a5]">
                          На 1 карте Кошмара: ОЗ мобов ×{mult.hpMultiplier} от 5 ур. · Урон ×
                          {mult.damageMultiplier} · Бег ×{mult.moveSpeedMultiplier} · Снаряды ×
                          {mult.projectileSpeedMultiplier}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-5 gap-2 pt-1">
                {([1, 2, 3, 4, 5] as const).map((stNum) => {
                  const maxSt = getUnlockedStageForDifficulty(
                    { unlockedStageD1, unlockedStageD2 },
                    selectedDifficulty
                  );
                  const isOpen = stNum <= maxSt;
                  return (
                    <button
                      key={stNum}
                      type="button"
                      data-testid={`modal-start-stage-${stNum}`}
                      onClick={() => {
                        if (!isOpen) {
                          showToast(`🔒 Сначала пройдите Этап ${stNum - 1}!`);
                          return;
                        }
                        setAccountModalOpen(false);
                        handleStartGameWithMode('labyrinth', labyrinthMultiplayerMode, stNum);
                      }}
                      className={`py-2.5 px-2 rounded-lg border text-xs font-bold font-mono-num cursor-pointer ${
                        isOpen
                          ? 'bg-[#f59e0b] hover:bg-[#fbbf24] border-[#fde047] text-[#09080d]'
                          : 'bg-[#120f1d] border-[#2a233d] text-[#64748b]'
                      }`}
                    >
                      {isOpen ? `▶ Этап ${stNum}` : `🔒 Этап ${stNum}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
