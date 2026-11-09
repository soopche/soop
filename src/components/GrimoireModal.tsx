import React, { useRef, useState, useEffect } from 'react';
import {
  CAMPFIRE_HEAL_RADIUS,
  CAMPFIRE_HP_REGEN_PER_SEC,
  CAMPFIRE_WOOD_COST,
  WALL_WOOD_COST,
  WALL_BUILD_DURATION_SEC,
  MAX_BUILT_WALLS,
  WALL_DISMANTLE_WOOD_REFUND,
  CampfireRecipeId,
  CookedBatFoodItem,
  CookedBearFoodItem,
  CookedBoarFoodItem,
  CookedRatFoodItem,
  CRAFT_DRAW_TEMPLATES,
  CraftedPotionItem,
  calculateArcaneSwordStats,
  calculateCooldownResetStats,
  calculateCookedBatFoodStats,
  calculateCookedBearFoodStats,
  calculateCookedBoarFoodStats,
  calculateCookedRatFoodStats,
  calculateCraftedPotionStats,
  evaluateCampfireCraftDrawing,
  EquipmentId,
  EQUIPMENT_CATALOG,
  evaluateGestureAccuracy,
  PET_CATALOG,
  Point2D,
  QUEST_CATEGORY_LABELS,
  QuestCategory,
  QuestDef,
  ReagentId,
  REAGENTS,
  SpellId,
  SPELLS,
  SPELL_ORDER,
  TameableSpeciesId,
  canCraftEquipment,
  getTotalReagentCount,
  getSpellCooldownForLevel,
  getSpellHotkeyLabel,
  getTeleportMaxRange,
  getSpellUpgradeCost,
  canAffordSpellUpgrade,
  getPetTrainingStepCost,
  canAffordPetTrainingStep,
  LABYRINTH_MULTIPLAYER_MODES,
  LabyrinthMultiplayerMode,
  MAX_SPELL_LEVEL,
  SPELL_LEVEL_6_EFFECTS,
  ArtifactId,
  ArtifactSlot,
  ARTIFACT_CATALOG,
  ARTIFACT_SLOT_LABELS,
  canCraftArtifact,
  getArtifactOwnedCount,
  getArtifactSalvageRefund,
  getCombinedArtifactBonuses,
  calculatePracticeGestureXp,
} from '../game/spells';
import { HudSnapshot, RemotePlayerState } from '../game/world3d';

export type GrimoireTab =
  | 'inventory'
  | 'spells'
  | 'pets'
  | 'training'
  | 'craft'
  | 'quests'
  | 'pvp';

export type CraftSectionFilter = 'all_grouped' | 'staffs' | ArtifactSlot;

const TIER_BADGE_COLORS: Record<number, { stroke: string; fill: string; bg: string }> = {
  1: { stroke: '#38bdf8', fill: 'rgba(56, 189, 248, 0.22)', bg: '#0f1d2e' },
  2: { stroke: '#4ade80', fill: 'rgba(74, 222, 128, 0.22)', bg: '#0f261c' },
  3: { stroke: '#c084fc', fill: 'rgba(192, 132, 252, 0.24)', bg: '#211433' },
  4: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.25)', bg: '#2b1d0e' },
  5: { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.28)', bg: '#2e111b' },
};

export const ItemBadgeIcon: React.FC<{
  kind: 'staff' | ArtifactSlot | 'reagent' | 'campfire';
  tier?: number;
  staffId?: EquipmentId;
  reagentId?: ReagentId;
  size?: number;
}> = ({ kind, tier = 1, staffId, reagentId, size = 38 }) => {
  const palette = TIER_BADGE_COLORS[Math.min(5, Math.max(1, tier))] || TIER_BADGE_COLORS[1];

  if (kind === 'campfire') {
    return (
      <div
        data-testid="campfire-badge-icon"
        className="rounded-lg border flex items-center justify-center shrink-0 shadow-inner"
        style={{
          width: size,
          height: size,
          backgroundColor: '#26140c',
          borderColor: '#f97316',
        }}
      >
        <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 24 24" fill="none">
          {/* Crossed firewood logs at base */}
          <line
            x1="4"
            y1="19.5"
            x2="20"
            y2="15.5"
            stroke="#b45309"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <line
            x1="4"
            y1="15.5"
            x2="20"
            y2="19.5"
            stroke="#92400e"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          {/* Outer orange flame */}
          <path
            d="M12 3C12 3 17.5 8 17.5 12.5C17.5 15.5 15 17.5 12 17.5C9 17.5 6.5 15.5 6.5 12.5C6.5 9.8 8.5 7.5 9.5 6.5C9.5 8.5 10.8 9.2 10.8 9.2C10.2 6.8 12 3 12 3Z"
            fill="rgba(249, 115, 22, 0.35)"
            stroke="#f97316"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Inner golden flame core */}
          <path
            d="M12 8.5C12 8.5 14.5 11 14.5 13.2C14.5 14.8 13.4 16 12 16C10.6 16 9.5 14.8 9.5 13.2C9.5 11 12 8.5 12 8.5Z"
            fill="#fde047"
          />
        </svg>
      </div>
    );
  }

  if (kind === 'reagent' && reagentId) {
    const r = REAGENTS[reagentId];
    if (reagentId === 'ancient_wood') {
      return (
        <div
          data-testid="firewood-badge-icon"
          className="rounded-lg border flex items-center justify-center shrink-0 shadow-inner"
          style={{
            width: size,
            height: size,
            backgroundColor: '#23170d',
            borderColor: '#f59e0b',
          }}
        >
          <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 24 24" fill="none">
            {/* Bottom timber log */}
            <rect
              x="3"
              y="13"
              width="15"
              height="5"
              rx="2.2"
              fill="#92400e"
              stroke="#f59e0b"
              strokeWidth="1.6"
            />
            <circle cx="16" cy="15.5" r="1.4" fill="#fde68a" />
            {/* Top angled timber log */}
            <g transform="rotate(-16 12 9)">
              <rect
                x="4"
                y="6.5"
                width="15"
                height="5"
                rx="2.2"
                fill="#b45309"
                stroke="#fde047"
                strokeWidth="1.6"
              />
              <circle cx="17" cy="9" r="1.4" fill="#fef08a" />
            </g>
          </svg>
        </div>
      );
    }

    return (
      <div
        className="rounded-lg border flex items-center justify-center shrink-0"
        style={{
          width: size,
          height: size,
          backgroundColor: '#12101b',
          borderColor: r.color,
        }}
      >
        <svg width={size * 0.64} height={size * 0.64} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="7" fill={r.color} fillOpacity={0.28} stroke={r.color} strokeWidth="2" />
          <path d="M12 7L15 12L12 17L9 12Z" fill={r.color} />
        </svg>
      </div>
    );
  }

  const staffTier =
    staffId === 'wand_ollivander'
      ? 1
      : staffId === 'wand_ancient_yew'
      ? 2
      : staffId === 'staff_coven'
      ? 3
      : staffId === 'staff_frost_dragon'
      ? 4
      : 5;
  const activePalette =
    kind === 'staff' ? TIER_BADGE_COLORS[staffTier] || palette : palette;

  return (
    <div
      className="rounded-lg border flex items-center justify-center shrink-0 shadow-inner"
      style={{
        width: size,
        height: size,
        backgroundColor: activePalette.bg,
        borderColor: activePalette.stroke,
      }}
    >
      <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 24 24" fill="none">
        {kind === 'staff' && (
          <>
            <line
              x1="5"
              y1="19"
              x2="16"
              y2="8"
              stroke={activePalette.stroke}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <polygon
              points="18,3 21,6 16,9 15,5"
              fill={activePalette.fill}
              stroke={activePalette.stroke}
              strokeWidth="1.8"
            />
            <circle cx="18.5" cy="5.5" r="1.5" fill="#fde047" />
          </>
        )}
        {kind === 'robe' && (
          <>
            <path
              d="M8 4L12 6L16 4L20 8L17 11L16 8V20H8V8L7 11L4 8L8 4Z"
              fill={activePalette.fill}
              stroke={activePalette.stroke}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <line x1="12" y1="6" x2="12" y2="20" stroke={activePalette.stroke} strokeWidth="1.4" />
          </>
        )}
        {kind === 'gloves' && (
          <>
            <path
              d="M7 13V7.5C7 6.7 7.7 6 8.5 6C9.3 6 10 6.7 10 7.5V5.5C10 4.7 10.7 4 11.5 4C12.3 4 13 4.7 13 5.5V6.5C13 5.7 13.7 5 14.5 5C15.3 5 16 5.7 16 6.5V11L18 9.5C18.7 9 19.5 9.6 19.2 10.5L16.5 16.5H7.5L7 13Z"
              fill={activePalette.fill}
              stroke={activePalette.stroke}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <rect
              x="7"
              y="16.5"
              width="10"
              height="3.5"
              rx="1"
              fill={activePalette.fill}
              stroke={activePalette.stroke}
              strokeWidth="1.6"
            />
          </>
        )}
        {kind === 'ring' && (
          <>
            <circle
              cx="12"
              cy="13.5"
              r="6"
              fill={activePalette.fill}
              stroke={activePalette.stroke}
              strokeWidth="2.2"
            />
            <polygon
              points="12,3.5 15.5,7 12,9.5 8.5,7"
              fill="#fde047"
              stroke={activePalette.stroke}
              strokeWidth="1.5"
            />
          </>
        )}
        {kind === 'boots' && (
          <>
            <path
              d="M8 4H14V13L19.5 16.2C20.4 16.7 20.8 17.8 20.5 19H6V15.5L8 13V4Z"
              fill={activePalette.fill}
              stroke={activePalette.stroke}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <line x1="6" y1="19.5" x2="20.5" y2="19.5" stroke="#fde047" strokeWidth="1.8" />
          </>
        )}
      </svg>
    </div>
  );
};

interface GrimoireModalProps {
  activeTab: GrimoireTab;
  onSelectTab: (tab: GrimoireTab) => void;
  onClose: () => void;
  playerLevel: number;
  playerXp: number;
  nextLevelXp: number;
  gestureMasteryLevel: number;
  selectedSpellId: SpellId;
  onSelectSpell: (id: SpellId) => void;
  spellLevels: Record<SpellId, number>;
  onUpgradeSpell: (spellId: SpellId) => void;
  reagentInventory: Record<ReagentId, number>;
  ownedEquipment: EquipmentId[];
  equippedStaffId: EquipmentId;
  onCraftOrEquip: (id: EquipmentId) => void;
  ownedArtifacts: ArtifactId[];
  equippedArtifacts: Partial<Record<ArtifactSlot, ArtifactId>>;
  onCraftOrEquipArtifact: (id: ArtifactId) => void;
  onSalvageArtifact: (id: ArtifactId) => void;
  quests: QuestDef[];
  onClaimQuest: (questId: string) => void;
  onPracticeGestureComplete: (accuracy: number, isComplete: boolean) => void;
  tamedPet: HudSnapshot['tamedPet'];
  onSelectTamedPet: (species: TameableSpeciesId) => void;
  onUpgradeTamedPet: () => void;
  campfireStatus: HudSnapshot['campfireStatus'];
  campfireWallsCount?: number;
  campfireSheltered?: boolean;
  builtWallsCount?: number;
  activeFoodBuff: HudSnapshot['activeFoodBuff'];
  activeBatFoodBuff: HudSnapshot['activeBatFoodBuff'];
  craftedPotions: CraftedPotionItem[];
  cookedFoods: Array<CookedRatFoodItem | CookedBoarFoodItem | CookedBearFoodItem>;
  cookedBatFoods: CookedBatFoodItem[];
  onPlaceCampfire: () => void;
  onPlaceWall?: () => void;
  onDismantleWall?: () => void;
  onCraftAtCampfire: (recipeId: CampfireRecipeId, accuracy: number) => void;
  onUsePotion: (potionId: string) => void;
  onEatFood: (foodId: string) => void;
  onEatBatFood: (foodId: string) => void;
  pvpConnected: boolean;
  pvpRoom: string;
  pvpPlayerName: string;
  labyrinthMultiplayerMode: LabyrinthMultiplayerMode;
  onSelectLabyrinthMultiplayerMode: (mode: LabyrinthMultiplayerMode) => void;
  remotePlayers: RemotePlayerState[];
  onJoinPvpRoom: (room: string, playerName: string) => void;
  onResetPvpDuel: () => void;
}

export const GrimoireModal: React.FC<GrimoireModalProps> = ({
  activeTab,
  onSelectTab,
  onClose,
  playerLevel,
  playerXp,
  nextLevelXp,
  gestureMasteryLevel,
  selectedSpellId,
  onSelectSpell,
  spellLevels,
  onUpgradeSpell,
  reagentInventory,
  ownedEquipment,
  equippedStaffId,
  onCraftOrEquip,
  ownedArtifacts,
  equippedArtifacts,
  onCraftOrEquipArtifact,
  onSalvageArtifact,
  quests,
  onClaimQuest,
  onPracticeGestureComplete,
  tamedPet,
  onSelectTamedPet,
  onUpgradeTamedPet,
  campfireStatus,
  campfireWallsCount = 0,
  campfireSheltered = false,
  builtWallsCount = 0,
  activeFoodBuff,
  activeBatFoodBuff,
  craftedPotions,
  cookedFoods,
  cookedBatFoods,
  onPlaceCampfire,
  onPlaceWall,
  onDismantleWall,
  onCraftAtCampfire,
  onUsePotion,
  onEatFood,
  onEatBatFood,
  pvpConnected,
  pvpRoom,
  pvpPlayerName,
  labyrinthMultiplayerMode,
  onSelectLabyrinthMultiplayerMode,
  remotePlayers,
  onJoinPvpRoom,
  onResetPvpDuel,
}) => {
  const [roomInput, setRoomInput] = useState(pvpRoom);
  const [nameInput, setNameInput] = useState(pvpPlayerName);
  const [questCategoryFilter, setQuestCategoryFilter] = useState<'all' | QuestCategory>('all');
  const [craftSectionFilter, setCraftSectionFilter] = useState<CraftSectionFilter>('all_grouped');
  const [selectedRecipe, setSelectedRecipe] = useState<CampfireRecipeId>('health_potion');
  const [craftDrawResult, setCraftDrawResult] = useState<{
    accuracy: number;
    summary: string;
  } | null>(null);

  const craftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isCraftDrawingRef = useRef(false);
  const craftStrokeRef = useRef<Point2D[]>([]);

  const trainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const strokeRef = useRef<Point2D[]>([]);
  const [trainResult, setTrainResult] = useState<{
    accuracy: number;
    completionRatio: number;
    isComplete: boolean;
    estimatedDamage: number;
  } | null>(null);

  const activeSpell = SPELLS[selectedSpellId];
  const activeSpellLevel = spellLevels[selectedSpellId] || 1;
  const activeSpellMult = 1 + (activeSpellLevel - 1) * 0.2;
  const activeSpellCooldown = getSpellCooldownForLevel(selectedSpellId, activeSpellLevel);
  const isCombatSpell =
    selectedSpellId === 'incendio' ||
    selectedSpellId === 'glacius' ||
    selectedSpellId === 'expelliarmus' ||
    selectedSpellId === 'stupefy';

  const totalResources = getTotalReagentCount(reagentInventory);
  const spellUpgradeCost = getSpellUpgradeCost(activeSpellLevel);
  const canUpgradeActiveSpell = canAffordSpellUpgrade(activeSpellLevel, reagentInventory);

  const petTrainingCost = getPetTrainingStepCost(tamedPet?.level || 1);
  const canTrainActivePet =
    Boolean(tamedPet) && canAffordPetTrainingStep(tamedPet?.level || 1, reagentInventory);

  const readyToClaimCount = quests.filter((q) => q.completed && !q.claimed).length;
  const claimedCount = quests.filter((q) => q.claimed).length;

  const drawTrainingCanvas = (userPoints: Point2D[]) => {
    const canvas = trainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.38, 0, Math.PI * 2);
    ctx.stroke();

    const tpl = activeSpell.templatePoints;
    if (tpl.length > 1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.42)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      tpl.forEach((pt, idx) => {
        const px = pt.x * w;
        const py = pt.y * h;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      const startPt = tpl[0];
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(startPt.x * w, startPt.y * h, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (userPoints.length > 1) {
      ctx.save();
      ctx.strokeStyle = activeSpell.color;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      userPoints.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.restore();
    }
  };

  useEffect(() => {
    if (activeTab === 'training') {
      strokeRef.current = [];
      setTrainResult(null);
      drawTrainingCanvas([]);
    }
  }, [activeTab, selectedSpellId]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = trainCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    isDrawingRef.current = true;
    strokeRef.current = [
      {
        x: ((e.clientX - rect.left) / rect.width) * canvas.width,
        y: ((e.clientY - rect.top) / rect.height) * canvas.height,
      },
    ];
    drawTrainingCanvas(strokeRef.current);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = trainCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    strokeRef.current.push({
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    });
    drawTrainingCanvas(strokeRef.current);
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (strokeRef.current.length < 3) return;

    // Evaluate raw drawing accuracy strictly on the 280x280 training canvas (bonus = 0, forgiveness = 0)
    // so Gesture Training reflects true drawing precision instead of inflating every stroke to 100%!
    const res = evaluateGestureAccuracy(
      strokeRef.current,
      selectedSpellId,
      0,
      0,
      280
    );
    const drawnVal =
      selectedSpellId === 'vera_verto'
        ? Math.round((20 + (res.accuracy / 100) * 20) * activeSpellMult)
        : selectedSpellId === 'stupefy'
        ? Math.round((4 + ((res.accuracy - 10) / 90) * 16) * activeSpellMult)
        : Math.round((6 + ((res.accuracy - 10) / 90) * 24) * activeSpellMult);
    setTrainResult({ ...res, estimatedDamage: drawnVal });
    onPracticeGestureComplete(res.accuracy, res.isComplete);
  };

  const drawCampfireCraftCanvas = (userPoints: Point2D[]) => {
    const canvas = craftCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(249, 115, 22, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    const tpl = CRAFT_DRAW_TEMPLATES[selectedRecipe];
    if (tpl && tpl.points.length > 1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      tpl.points.forEach((pt, idx) => {
        const px = pt.x * w;
        const py = pt.y * h;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      const startPt = tpl.points[0];
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(startPt.x * w, startPt.y * h, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (userPoints.length > 1) {
      ctx.save();
      ctx.strokeStyle =
        selectedRecipe === 'health_potion'
          ? '#ef4444'
          : selectedRecipe === 'mana_potion'
          ? '#38bdf8'
          : selectedRecipe === 'bat_food'
          ? '#818cf8'
          : '#f97316';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      userPoints.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.restore();
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory') {
      craftStrokeRef.current = [];
      drawCampfireCraftCanvas([]);
    }
  }, [activeTab, selectedRecipe]);

  const canAffordSelectedRecipe = () => {
    if (selectedRecipe === 'rat_food') {
      return (reagentInventory.rat_meat || 0) >= 2;
    }
    if (selectedRecipe === 'boar_food') {
      return (reagentInventory.boar_meat || 0) >= 2;
    }
    if (selectedRecipe === 'bear_food') {
      return (reagentInventory.bear_meat || 0) >= 2;
    }
    if (selectedRecipe === 'bat_food') {
      const hasWaterAndBat =
        (reagentInventory.bat_meat || 0) >= 1 && (reagentInventory.water_essence || 0) >= 1;
      return hasWaterAndBat || (reagentInventory.bat_meat || 0) >= 2;
    }
    if (selectedRecipe === 'health_potion') {
      return (
        (reagentInventory.mandrake_root || 0) >= 1 ||
        (reagentInventory.ancient_wood || 0) >= 1
      );
    }
    return (
      (reagentInventory.mandrake_root || 0) >= 1 ||
      (reagentInventory.rat_hair || 0) >= 1 ||
      (reagentInventory.ancient_wood || 0) >= 1
    );
  };

  const finalizeCampfireRecipeDraw = (accuracy: number) => {
    if (campfireStatus !== 'lit_in_aura') return;
    if (!canAffordSelectedRecipe()) return;

    if (selectedRecipe === 'rat_food') {
      const food = calculateCookedRatFoodStats(accuracy);
      setCraftDrawResult({
        accuracy: food.accuracyPercent,
        summary: `${food.name}: +${food.bonusMaxHp} Макс. ОЗ и +${food.hpRegenPerSec} ОЗ/с на ${Math.round(
          food.durationSec / 60
        )} мин (${food.durationSec}с)`,
      });
    } else if (selectedRecipe === 'boar_food') {
      const boarFood = calculateCookedBoarFoodStats(accuracy);
      setCraftDrawResult({
        accuracy: boarFood.accuracyPercent,
        summary: `${boarFood.name}: +${boarFood.bonusMaxHp} Макс. ОЗ и +${boarFood.hpRegenPerSec} ОЗ/с на ${Math.round(
          boarFood.durationSec / 60
        )} мин (${boarFood.durationSec}с)`,
      });
    } else if (selectedRecipe === 'bear_food') {
      const bearFood = calculateCookedBearFoodStats(accuracy);
      setCraftDrawResult({
        accuracy: bearFood.accuracyPercent,
        summary: `${bearFood.name}: +${bearFood.bonusMaxHp} Макс. ОЗ и +${bearFood.hpRegenPerSec} ОЗ/с на ${Math.round(
          bearFood.durationSec / 60
        )} мин (${bearFood.durationSec}с)`,
      });
    } else if (selectedRecipe === 'bat_food') {
      const withWater =
        (reagentInventory.bat_meat || 0) >= 1 && (reagentInventory.water_essence || 0) >= 1;
      const batFood = calculateCookedBatFoodStats(accuracy, withWater);
      setCraftDrawResult({
        accuracy: batFood.accuracyPercent,
        summary: `${batFood.name}: +${batFood.bonusMaxMp} Макс. МП и +${batFood.mpRegenPerSec} МП/с на ${Math.round(
          batFood.durationSec / 60
        )} мин (${batFood.durationSec}с)`,
      });
    } else {
      const kind = selectedRecipe === 'health_potion' ? 'health' : 'mana';
      const pot = calculateCraftedPotionStats(kind, accuracy);
      setCraftDrawResult({
        accuracy: pot.accuracyPercent,
        summary: `${pot.name}: восстанавливает +${pot.restoreAmount} ${
          kind === 'health' ? 'ОЗ' : 'МП'
        }`,
      });
    }

    onCraftAtCampfire(selectedRecipe, accuracy);
  };

  const handleCraftPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = craftCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    isCraftDrawingRef.current = true;
    craftStrokeRef.current = [
      {
        x: ((e.clientX - rect.left) / rect.width) * canvas.width,
        y: ((e.clientY - rect.top) / rect.height) * canvas.height,
      },
    ];
    drawCampfireCraftCanvas(craftStrokeRef.current);
  };

  const handleCraftPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isCraftDrawingRef.current) return;
    const canvas = craftCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    craftStrokeRef.current.push({
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    });
    drawCampfireCraftCanvas(craftStrokeRef.current);
  };

  const handleCraftPointerUp = () => {
    if (!isCraftDrawingRef.current) return;
    isCraftDrawingRef.current = false;
    if (craftStrokeRef.current.length < 3) return;
    const res = evaluateCampfireCraftDrawing(
      craftStrokeRef.current,
      selectedRecipe,
      gestureMasteryLevel * 2
    );
    finalizeCampfireRecipeDraw(res.accuracy);
  };

  // Ordered strictly left-to-right:
  // 1. Артефакты -> 2. Инвентарь [I] -> 3. Заклинания [U] -> 4. Квесты [Y] -> 5. Жесты -> 6. Онлайн / Кооп
  const tabs: Array<{ id: GrimoireTab; label: string; badge?: number }> = [
    { id: 'craft', label: 'Артефакты', badge: ownedArtifacts.length || undefined },
    {
      id: 'inventory',
      label: 'Инвентарь [I]',
      badge: craftedPotions.length + cookedFoods.length + cookedBatFoods.length || undefined,
    },
    { id: 'spells', label: 'Заклинания [U]' },
    { id: 'quests', label: 'Квесты [Y]', badge: readyToClaimCount },
    { id: 'training', label: 'Жесты' },
    { id: 'pvp', label: 'Онлайн / Кооп' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Артефакты, Инвентарь, Заклинания и Квесты"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-auto"
      style={{ backgroundColor: 'rgba(9, 8, 13, 0.86)' }}
    >
      <div className="w-full max-w-4xl bg-[#13111c] border border-[#3b3154] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a233d] bg-[#181524]">
          <div>
            <h2 className="font-display text-xl font-bold text-[#f5efe6] tracking-wide">
              Гримуар Арканума
            </h2>
            <p className="text-xs text-[#a39bb5] mt-0.5 font-mono-num">
              Ур. {playerLevel} · Опыт {playerXp}/{nextLevelXp} XP
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть Гримуар"
            className="px-4 py-2 text-xs font-semibold text-[#f5efe6] bg-[#2a233d] hover:bg-[#3b3154] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            В игру [Esc]
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-[#100e18] border-b border-[#2a233d] overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              data-testid={`grimoire-tab-${t.id}`}
              onClick={() => onSelectTab(t.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === t.id || (t.id === 'spells' && activeTab === 'pets')
                  ? 'bg-[#d97706] text-[#09080d]'
                  : 'text-[#c4b5fd] hover:bg-[#1f1b2e] hover:text-white'
              }`}
            >
              <span>{t.label}</span>
              {t.badge && t.badge > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#22c55e] text-[#09080d] animate-pulse">
                  +{t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB: ИНВЕНТАРЬ (Сверху слева: Готовка зелий и еды | Сверху справа: Зелья и еда | В самом низу: Ресурсы для этого всего) */}
          {activeTab === 'inventory' && (
            <div className="space-y-5">
              {/* 1. TOP ROW: СЛЕВА ГОТОВКА ЗЕЛИЙ И ЕДЫ (lg:col-span-7) | СПРАВА ЗЕЛЬЯ И ЕДА (lg:col-span-5) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* TOP-LEFT: ГОТОВКА ЗЕЛИЙ И ЕДЫ */}
                <div
                  data-testid="inventory-top-left-cooking"
                  className="lg:col-span-7 bg-[#181524] border border-[#3b3154] rounded-xl p-4 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ItemBadgeIcon kind="campfire" size={38} />
                      <div>
                        <h4 className="font-display text-base font-bold text-[#f5efe6]">
                          🍳 Готовка Зелий и Еды
                        </h4>
                        <p className="text-xs text-[#a39bb5]">
                          Выберите рецепт зелья или жаркого и обведите контур на холсте:
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recipe Selector Buttons (6 Recipes: Health Potion, Mana Potion, Roasted Rat, Roasted Boar, Roasted Bear, Bat+Water Mana Food) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipe('health_potion');
                        setCraftDrawResult(null);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        selectedRecipe === 'health_potion'
                          ? 'bg-[#2b1419] border-[#ef4444] text-white'
                          : 'bg-[#12101b] border-[#2a233d] text-[#cbd5e1]'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#fca5a5]">❤️ Зелье ОЗ</div>
                      <div className="text-[11px] font-mono-num text-[#e2d9f3] mt-0.5">
                        Лечит: <strong>10–50 ОЗ</strong>
                      </div>
                      <div className="text-[10px] text-[#94a3b8] mt-0.5">
                        Цена: 1 Мандрагора/Дрова
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipe('mana_potion');
                        setCraftDrawResult(null);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        selectedRecipe === 'mana_potion'
                          ? 'bg-[#102338] border-[#38bdf8] text-white'
                          : 'bg-[#12101b] border-[#2a233d] text-[#cbd5e1]'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#7dd3fc]">💧 Зелье МП</div>
                      <div className="text-[11px] font-mono-num text-[#e2d9f3] mt-0.5">
                        Мана: <strong>10–50 МП</strong>
                      </div>
                      <div className="text-[10px] text-[#94a3b8] mt-0.5">
                        Цена: 1 Мандрагора/Шерсть
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipe('rat_food');
                        setCraftDrawResult(null);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        selectedRecipe === 'rat_food'
                          ? 'bg-[#2b1a0e] border-[#f97316] text-white'
                          : 'bg-[#12101b] border-[#2a233d] text-[#cbd5e1]'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#fdba74]">🍖 Жареная Крыса</div>
                      <div className="text-[11px] font-mono-num text-[#e2d9f3] mt-0.5">
                        <strong>+10..50 ОЗ</strong> · <strong>+0.1..0.5/с</strong>
                      </div>
                      <div className="text-[10px] text-[#fde047] mt-0.5">
                        Цена: 2 Крысы (1–5 мин)
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipe('boar_food');
                        setCraftDrawResult(null);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        selectedRecipe === 'boar_food'
                          ? 'bg-[#361708] border-[#ea580c] text-white'
                          : 'bg-[#12101b] border-[#2a233d] text-[#cbd5e1]'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#fb923c]">🐗 Жаркое Кабана</div>
                      <div className="text-[11px] font-mono-num text-[#e2d9f3] mt-0.5">
                        <strong>+25..80 ОЗ</strong> · <strong>+0.3..0.9/с</strong>
                      </div>
                      <div className="text-[10px] text-[#fde047] mt-0.5">
                        Цена: 2 Мяса кабана
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipe('bear_food');
                        setCraftDrawResult(null);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        selectedRecipe === 'bear_food'
                          ? 'bg-[#38141a] border-[#e11d48] text-white'
                          : 'bg-[#12101b] border-[#2a233d] text-[#cbd5e1]'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#fda4af]">🐻 Медвежатина</div>
                      <div className="text-[11px] font-mono-num text-[#e2d9f3] mt-0.5">
                        <strong>+45..120 ОЗ</strong> · <strong>+0.6..1.6/с</strong>
                      </div>
                      <div className="text-[10px] text-[#fde047] mt-0.5">
                        Цена: 2 Медвежатины
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipe('bat_food');
                        setCraftDrawResult(null);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        selectedRecipe === 'bat_food'
                          ? 'bg-[#1c1936] border-[#818cf8] text-white'
                          : 'bg-[#12101b] border-[#2a233d] text-[#cbd5e1]'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#a5b4fc]">🦇💧 Мышь + Вода</div>
                      <div className="text-[11px] font-mono-num text-[#e2d9f3] mt-0.5">
                        <strong>+25..80 МП</strong> · <strong>+0.3..0.9/с</strong>
                      </div>
                      <div className="text-[10px] text-[#c7d2fe] mt-0.5">
                        1 Мышь + 1 Вода 4 ур.
                      </div>
                    </button>
                  </div>

                  {/* Interactive Drawing Canvas + Instructions */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#110e1a] p-3.5 rounded-xl border border-[#2a233d]">
                    <canvas
                      ref={craftCanvasRef}
                      width={220}
                      height={220}
                      onPointerDown={handleCraftPointerDown}
                      onPointerMove={handleCraftPointerMove}
                      onPointerUp={handleCraftPointerUp}
                      className="w-[220px] h-[220px] bg-[#09080d] rounded-xl border border-[#3b3154] cursor-crosshair touch-none shrink-0"
                    />

                    <div className="space-y-2.5 text-xs flex-1">
                      <div className="font-semibold text-[#fde047]">
                        Узор: {CRAFT_DRAW_TEMPLATES[selectedRecipe].gestureLabel}
                      </div>
                      <p className="text-[#cbd5e1] leading-relaxed">
                        {CRAFT_DRAW_TEMPLATES[selectedRecipe].subtitle}. Зажмите ЛКМ на холсте слева и проведите по пунктиру от жёлтой точки.
                      </p>

                      {campfireStatus !== 'lit_in_aura' ? (
                        <div className="p-2.5 rounded-lg bg-[#2a1215] border border-[#ef4444] text-[#fecaca] font-semibold">
                          ⚠️ Чтобы готовить, встаньте рядом с горящим костром (сложите костёр [C] и подожгите его «Огнём» [1])!
                        </div>
                      ) : !canAffordSelectedRecipe() ? (
                        <div className="p-2.5 rounded-lg bg-[#271f10] border border-[#f59e0b] text-[#fde047] font-semibold">
                          ⚠️ Недостаточно ингредиентов для рецепта ({selectedRecipe === 'rat_food' ? 'нужно 2 тушки крысы' : selectedRecipe === 'boar_food' ? 'нужно 2 мяса дикого кабана с 3–4 уровней' : selectedRecipe === 'bat_food' ? 'нужно 1 сырое мясо мыши + 1 вода 4 ур. (или 2 мыши)' : 'нужен 1 реагент'}).
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-[#132a1f] border border-[#22c55e] text-[#bbf7d0]">
                          ✓ Костёр горит! Нарисуйте узор на холсте для готовки.
                        </div>
                      )}

                      {craftDrawResult && (
                        <div className="p-2.5 rounded-lg bg-[#1e1b2e] border border-[#38bdf8] text-[#e0f2fe] font-mono-num">
                          Точность рисунка: <strong>{craftDrawResult.accuracy}%</strong> — {craftDrawResult.summary}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* TOP-RIGHT: ЗЕЛЬЯ И ЕДА */}
                <div
                  data-testid="inventory-top-right-potions-food"
                  className="lg:col-span-5 bg-[#181524] border border-[#3b3154] rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="font-display text-base font-bold text-[#f5efe6]">
                        🧪 Зелья и Еда
                      </h4>
                      <p className="text-xs text-[#a39bb5]">
                        Готовые зелья и еда в вашей сумке (
                        {craftedPotions.length + cookedFoods.length + cookedBatFoods.length}):
                      </p>
                    </div>
                  </div>

                  {craftedPotions.length === 0 &&
                  cookedFoods.length === 0 &&
                  cookedBatFoods.length === 0 ? (
                    <div className="p-5 text-center text-xs text-[#94a3b8] bg-[#12101b] rounded-lg border border-[#241f36]">
                      У вас пока нет готовых зелий или еды. Выберите рецепт слева и нарисуйте узор у горящего костра!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {craftedPotions.map((pot) => (
                        <div
                          key={pot.id}
                          className="p-2.5 rounded-lg bg-[#12101b] border border-[#2a233d] flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="font-bold text-white">
                              {pot.kind === 'health' ? '❤️' : '💧'} {pot.name}{' '}
                              <span className="text-[#fde047] font-mono-num">
                                ({pot.accuracyPercent}%)
                              </span>
                            </div>
                            <div className="text-[11px] font-mono-num text-[#cbd5e1]">
                              Восстанавливает:{' '}
                              <strong
                                className={
                                  pot.kind === 'health' ? 'text-[#ef4444]' : 'text-[#38bdf8]'
                                }
                              >
                                +{pot.restoreAmount} {pot.kind === 'health' ? 'ОЗ' : 'МП'}
                              </strong>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onUsePotion(pot.id)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#22c55e] hover:bg-[#4ade80] text-[#09080d] cursor-pointer shrink-0"
                          >
                            Выпить
                          </button>
                        </div>
                      ))}

                      {cookedFoods.map((food) => (
                        <div
                          key={food.id}
                          className="p-2.5 rounded-lg bg-[#12101b] border border-[#f97316]/50 flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="font-bold text-[#fed7aa]">
                              🍖 {food.name}{' '}
                              <span className="text-[#fde047] font-mono-num">
                                ({food.accuracyPercent}%)
                              </span>
                            </div>
                            <div className="text-[11px] font-mono-num text-[#cbd5e1]">
                              <strong>+{food.bonusMaxHp} Макс. ОЗ</strong> ·{' '}
                              <strong>+{food.hpRegenPerSec} ОЗ/с</strong> на{' '}
                              {Math.round(food.durationSec / 60)} мин ({food.durationSec}с)
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onEatFood(food.id)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#f97316] hover:bg-[#fb923c] text-[#09080d] cursor-pointer shrink-0"
                          >
                            Съесть
                          </button>
                        </div>
                      ))}

                      {cookedBatFoods.map((batFood) => (
                        <div
                          key={batFood.id}
                          className="p-2.5 rounded-lg bg-[#12101b] border border-[#818cf8]/50 flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="font-bold text-[#c7d2fe]">
                              🦇 {batFood.name}{' '}
                              <span className="text-[#fde047] font-mono-num">
                                ({batFood.accuracyPercent}%)
                              </span>
                            </div>
                            <div className="text-[11px] font-mono-num text-[#cbd5e1]">
                              <strong>+{batFood.bonusMaxMp} Макс. МП</strong> ·{' '}
                              <strong>+{batFood.mpRegenPerSec} МП/с</strong> на{' '}
                              {Math.round(batFood.durationSec / 60)} мин ({batFood.durationSec}с)
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onEatBatFood(batFood.id)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#818cf8] hover:bg-[#a5b4fc] text-[#09080d] cursor-pointer shrink-0"
                          >
                            Съесть
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. BOTTOM BLOCK: РЕСУРСЫ И ДОБЫЧА В ИНВЕНТАРЕ (в самом низу под готовкой и готовыми зельями/едой) */}
              <div
                data-testid="inventory-bottom-resources"
                className="bg-[#181524] border border-[#2a233d] rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#c4b5fd]">
                    🎒 Ресурсы и Добыча в Инвентаре
                  </h4>
                  <span className="text-xs font-mono-num text-[#fde047]">
                    Всего ресурсов: {totalResources}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs font-mono-num">
                  {(Object.keys(REAGENTS) as ReagentId[]).map((rId) => {
                    const r = REAGENTS[rId];
                    const count = reagentInventory[rId] || 0;
                    return (
                      <div
                        key={r.id}
                        data-testid={`inventory-resource-${r.id}`}
                        className="px-2.5 py-2 rounded-lg bg-[#12101b] border border-[#262038] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ItemBadgeIcon kind="reagent" reagentId={r.id} size={26} />
                          <span className="truncate text-[#e2d9f3]" title={r.sourceHint}>
                            {r.id === 'ancient_wood'
                              ? 'Дрова'
                              : r.id === 'rat_meat'
                              ? 'Тушка крысы'
                              : r.id === 'boar_meat'
                              ? 'Мясо кабана'
                              : r.id === 'bear_meat'
                              ? 'Медвежатина'
                              : r.id === 'boar_tusk'
                              ? 'Клык кабана'
                              : r.id === 'bat_meat'
                              ? 'Мясо мыши'
                              : r.id === 'fire_essence'
                              ? 'Огн. эссенция'
                              : r.id === 'water_essence'
                              ? 'Вода глубин'
                              : r.id === 'earth_essence'
                              ? 'Кам. ядро'
                              : r.name.split(' ')[0]}
                          </span>
                        </div>
                        <span
                          className="font-bold px-1.5 py-0.5 rounded text-[11px] shrink-0"
                          style={{
                            color: count > 0 ? '#09080d' : '#64748b',
                            backgroundColor: count > 0 ? r.color : '#1e1b2e',
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Owned Wearable Artifacts & Duplicates in Bag (Quick Salvage & Equip) */}
              <div className="bg-[#181524] border border-[#3b3154] rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display text-base font-bold text-[#fde047]">
                      👑 Найденные Артефакты в Сумке и Разбор Дубликатов
                    </h4>
                    <p className="text-xs text-[#a39bb5]">
                      Если из сундука выпал второй одинаковый артефакт, он отмечается как <strong>Дубликат (×2)</strong> — его можно разобрать за 50% ресурсов, сохранив надетый предмет!
                    </p>
                  </div>
                  <span className="text-xs font-mono-num text-[#38bdf8]">
                    Всего предметов: <strong>{ownedArtifacts.length}</strong> (уникальных:{' '}
                    <strong>{new Set(ownedArtifacts).size}/20</strong>)
                  </span>
                </div>

                {ownedArtifacts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#94a3b8] bg-[#12101b] rounded-lg border border-[#241f36]">
                    У вас в сумке пока нет найденных артефактов. Открывайте сундуки в лабиринте клавишей [E] или создавайте их во вкладке «Посохи и Артефакты»!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {Array.from(new Set(ownedArtifacts)).map((artId) => {
                      const art = ARTIFACT_CATALOG[artId];
                      if (!art) return null;
                      const count = getArtifactOwnedCount(art.id, ownedArtifacts);
                      const isEquipped = equippedArtifacts[art.slot] === art.id;
                      const refund = getArtifactSalvageRefund(art.id);
                      return (
                        <div
                          key={art.id}
                          data-testid={`bag-artifact-${art.id}`}
                          className={`p-3 rounded-lg border flex flex-col justify-between gap-2 ${
                            count > 1
                              ? 'bg-[#2a1f14] border-[#f59e0b]'
                              : isEquipped
                              ? 'bg-[#231d36] border-[#22c55e]'
                              : 'bg-[#12101b] border-[#2a233d]'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <ItemBadgeIcon kind={art.slot} tier={art.tier} size={36} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-[#f5efe6] truncate">
                                  {art.name}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold font-mono-num shrink-0 ${
                                    count > 1
                                      ? 'bg-[#f59e0b] text-[#09080d]'
                                      : 'bg-[#231e36] text-[#c4b5fd]'
                                  }`}
                                >
                                  {count > 1 ? `Дубликат ×${count}` : `×1`}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono-num text-[#a39bb5] mt-0.5">
                                {ARTIFACT_SLOT_LABELS[art.slot]} · Ур. {art.tier}{' '}
                                {isEquipped ? '· Надето ✓' : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#2a233d]/80">
                            <button
                              type="button"
                              data-testid={`bag-salvage-artifact-${art.id}`}
                              onClick={() => onSalvageArtifact(art.id)}
                              title={`Вернёт: ${Object.entries(refund)
                                .map(([rId, q]) => `${REAGENTS[rId as ReagentId].name} +${q}`)
                                .join(', ')}`}
                              className="px-2.5 py-1 text-[11px] font-bold rounded bg-[#3b1518] hover:bg-[#521b20] border border-[#ef4444] text-[#fecaca] cursor-pointer"
                            >
                              {count > 1
                                ? `♻️ Разобрать дубликат (+50% рес.)`
                                : `♻️ Разобрать (+50% рес.)`}
                            </button>
                            <button
                              type="button"
                              onClick={() => onCraftOrEquipArtifact(art.id)}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded cursor-pointer ${
                                isEquipped
                                  ? 'bg-[#15803d] text-white'
                                  : 'bg-[#38bdf8] text-[#09080d]'
                              }`}
                            >
                              {isEquipped ? 'Снять' : 'Надеть'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: SPELLS & PROGRESSIVE 5-LEVEL UPGRADE */}
          {activeTab === 'spells' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 space-y-2">
                {SPELL_ORDER.map((spId) => {
                  const spell = SPELLS[spId];
                  const lvl = spellLevels[spId] || 1;
                  const cd = getSpellCooldownForLevel(spId, lvl);
                  const hotkey = getSpellHotkeyLabel(spId);
                  return (
                    <button
                      key={spell.id}
                      type="button"
                      onClick={() => onSelectSpell(spell.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedSpellId === spell.id
                          ? 'bg-[#231d36] border-[#f59e0b]'
                          : 'bg-[#181524] border-[#2a233d] hover:border-[#4c3d75]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-[#f5efe6] truncate">
                          [{hotkey}] {spell.shortWord} ({spell.name.split(' ')[0]})
                        </span>
                        <span
                          className="text-xs font-mono-num whitespace-nowrap shrink-0"
                          style={{ color: spell.color }}
                        >
                          Ур. {lvl}/{MAX_SPELL_LEVEL}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#a39bb5] mt-0.5 font-mono-num">
                        Мана: {spell.manaCost} · КД: {cd}с · {spell.gestureName}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-7 bg-[#181524] border border-[#2a233d] rounded-lg p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3
                      className="font-display text-lg font-bold"
                      style={{ color: activeSpell.color }}
                    >
                      «{activeSpell.shortWord}» — {activeSpell.name}
                    </h3>
                    <p className="text-xs text-[#a39bb5] mt-0.5">
                      Голос [R]: «{activeSpell.shortWord}» · Рисунок [ПКМ]: {activeSpell.gestureName}
                    </p>
                  </div>
                  <span className="text-xs text-[#fde047] font-mono-num font-bold">
                    {activeSpell.manaCost} МП · КД {activeSpellCooldown}с
                  </span>
                </div>

                {/* Simple Stats Grid */}
                {activeSpell.id === 'vera_verto' ? (
                  <div className="grid grid-cols-3 gap-2.5 text-center font-mono-num">
                    <div className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d]">
                      <div className="text-[10px] text-[#a39bb5]">БЫСТРО [Пробел]</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        +{Math.round(15 * activeSpellMult)} ОЗ
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d]">
                      <div className="text-[10px] text-[#38bdf8]">ГОЛОС [R]</div>
                      <div className="text-base font-bold text-[#38bdf8] mt-0.5">
                        +{Math.round(25 * activeSpellMult)} ОЗ
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#12101b] border border-[#22c55e]">
                      <div className="text-[10px] text-[#4ade80]">СЕРДЦЕ [ПКМ]</div>
                      <div className="text-base font-bold text-[#4ade80] mt-0.5">
                        +{Math.round(20 * activeSpellMult)}..{Math.round(40 * activeSpellMult)} ОЗ
                      </div>
                    </div>
                  </div>
                ) : activeSpell.id === 'engorgio' ? (
                  <div className="space-y-2">
                    <div className="p-3.5 rounded-lg bg-[#12101b] border border-[#f59e0b] text-xs font-mono-num text-[#fde047]">
                      На питомца: увеличивает на 10 секунд (размер до x{(2.25 * activeSpellMult).toFixed(2)}, урон до x{(2.2 * activeSpellMult).toFixed(2)}).
                    </div>
                    <div className="p-3 rounded-lg bg-[#12101b] border border-[#38bdf8] text-xs font-mono-num text-[#bae6fd]">
                      На воде (2 шарика): Водяной помощник (урон 6–12) · На снегу (3 кружка): Боевой Снеговик (урон 12–22) · Время жизни: <strong>30–150 сек</strong> от точности рисунка.
                    </div>
                  </div>
                ) : activeSpell.id === 'campfire_teleport' ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-3 gap-2.5 text-center font-mono-num">
                      <div className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d]">
                        <div className="text-[10px] text-[#a39bb5]">БЫСТРО [Пробел]</div>
                        <div className="text-base font-bold text-white mt-0.5">
                          Каст 3.0 сек
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d]">
                        <div className="text-[10px] text-[#38bdf8]">ГОЛОС [R]</div>
                        <div className="text-base font-bold text-[#38bdf8] mt-0.5">
                          Каст 2.0 сек
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#12101b] border border-[#22c55e]">
                        <div className="text-[10px] text-[#4ade80]">СПИРАЛЬ [ПКМ]</div>
                        <div className="text-base font-bold text-[#4ade80] mt-0.5">
                          Каст 2.2..1.5 сек
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#12101b] border border-[#f97316] text-xs font-mono-num text-[#fed7aa]">
                      🏠 Заклинание <strong>«Домой» [F]</strong> (голосом: <strong>«Домой»</strong>) переносит вас к вашему Костру [C] из любой точки лабиринта (10 МП · Перезарядка 2 минуты / 120 сек). Одновременно в мире может стоять только 1 костёр.
                    </div>
                  </div>
                ) : activeSpell.id === 'arcane_sword' ? (
                  <div className="space-y-2.5">
                    {(() => {
                      const quickSw = calculateArcaneSwordStats('quick', 0, activeSpellLevel);
                      const voiceSw = calculateArcaneSwordStats('voice', 0, activeSpellLevel);
                      const drawnMinSw = calculateArcaneSwordStats('drawn', 10, activeSpellLevel);
                      const drawnMaxSw = calculateArcaneSwordStats('drawn', 100, activeSpellLevel);
                      return (
                        <div className="grid grid-cols-3 gap-2.5 text-center font-mono-num">
                          <div className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d]">
                            <div className="text-[10px] text-[#a39bb5]">БЫСТРО [Пробел]</div>
                            <div className="text-base font-bold text-white mt-0.5">
                              {quickSw.damage} ур. · {quickSw.durationSec}с
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d]">
                            <div className="text-[10px] text-[#38bdf8]">ГОЛОС [R]</div>
                            <div className="text-base font-bold text-[#38bdf8] mt-0.5">
                              {voiceSw.damage} ур. · {voiceSw.durationSec}с
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-[#12101b] border border-[#22c55e]">
                            <div className="text-[10px] text-[#4ade80]">КЛИНОК [ПКМ]</div>
                            <div className="text-base font-bold text-[#4ade80] mt-0.5">
                              {drawnMinSw.damage}..{drawnMaxSw.damage} ур. · {drawnMinSw.durationSec}..{drawnMaxSw.durationSec}с
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="p-3 rounded-lg bg-[#12101b] border border-[#fbbf24] text-xs font-mono-num text-[#fde68a]">
                      ⚔️ Призывает большой 3D Меч в правую руку (КД 1 минута / 60с). Ведите мышь с зажатой <strong>[ПКМ] вправо или влево</strong>, чтобы рубить врагов перед собой (урон раз в 1.0с). На 4 ур. поджигает врагов. <strong>На 6 ур. появляется второй меч в левую руку</strong>: ведите вправо — бьёт правая рука, влево — левая рука, а урон наносится чаще (раз в 0.7с)!
                    </div>
                  </div>
                ) : activeSpell.id === 'cooldown_reset' ? (
                  <div className="space-y-2.5">
                    {(() => {
                      const cdReset = calculateCooldownResetStats('voice', 100, activeSpellLevel);
                      return (
                        <div className="grid grid-cols-3 gap-2.5 text-center font-mono-num">
                          <div className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d]">
                            <div className="text-[10px] text-[#a39bb5]">БЫСТРО [Пробел]</div>
                            <div className="text-base font-bold text-white mt-0.5">
                              -{cdReset.quickPercent}% КД
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d]">
                            <div className="text-[10px] text-[#38bdf8]">ГОЛОС [R]</div>
                            <div className="text-base font-bold text-[#38bdf8] mt-0.5">
                              -{cdReset.voicePercent}% КД
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-[#12101b] border border-[#22c55e]">
                            <div className="text-[10px] text-[#4ade80]">ПЕСОЧНЫЕ ЧАСЫ [ПКМ]</div>
                            <div className="text-base font-bold text-[#4ade80] mt-0.5">
                              -{cdReset.drawnMinPercent}%..-{cdReset.drawnMaxPercent}% КД
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="p-3 rounded-lg bg-[#12101b] border border-[#2dd4bf] text-xs font-mono-num text-[#99f6e4]">
                      ⏳ <strong>Перезарядка способностей [G]</strong> (голосом: <strong>«Перезарядка»</strong> / <strong>«Время»</strong>) мгновенно сокращает перезарядки всех остальных чар! На 1 ур.: Голос <strong>30%</strong>, Рисунок <strong>20–50%</strong> (КД 70с). С каждым уровнем прокачки бонус растёт на +10% (на 6 ур. доходит до <strong>100%</strong>), а собственная перезарядка снижается: <strong>70с → 65с → 60с → 55с → 50с</strong>.
                    </div>
                  </div>
                ) : activeSpell.id === 'teleport' ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-3 gap-2.5 text-center font-mono-num">
                      <div className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d]">
                        <div className="text-[10px] text-[#a39bb5]">БЫСТРО [Пробел]</div>
                        <div className="text-base font-bold text-white mt-0.5">
                          {Math.round(2 * activeSpellMult)} ур. · {activeSpellCooldown}с
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d]">
                        <div className="text-[10px] text-[#38bdf8]">ГОЛОС [R]</div>
                        <div className="text-base font-bold text-[#38bdf8] mt-0.5">
                          {Math.round(14 * activeSpellMult)} ур. · {(activeSpellCooldown * 0.82).toFixed(1)}с
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#12101b] border border-[#22c55e]">
                        <div className="text-[10px] text-[#4ade80]">КРУГ [ПКМ]</div>
                        <div className="text-base font-bold text-[#4ade80] mt-0.5">
                          {Math.round(6 * activeSpellMult)}..{Math.round(30 * activeSpellMult)} ур. · до {(activeSpellCooldown * 0.45).toFixed(1)}с
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#12101b] border border-[#c084fc] text-xs font-mono-num text-[#e9d5ff]">
                      Дальность прыжка: <strong>до {getTeleportMaxRange(activeSpellLevel)}м</strong> (+4м за уровень) · Взрыв при появлении в радиусе 6м · Позволяет перепрыгивать синие лазерные лучи и ловушки на видимый пол.
                    </div>
                  </div>
                ) : activeSpell.id === 'glacius' ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2.5 text-center font-mono-num">
                      <div className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d]">
                        <div className="text-[10px] text-[#a39bb5]">БЫСТРО [Пробел]</div>
                        <div className="text-base font-bold text-white mt-0.5">
                          {Math.round(2 * activeSpellMult)} ур.
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d]">
                        <div className="text-[10px] text-[#38bdf8]">ГОЛОС [R]</div>
                        <div className="text-base font-bold text-[#38bdf8] mt-0.5">
                          {Math.round(10 * activeSpellMult)} ур.
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#12101b] border border-[#22c55e]">
                        <div className="text-[10px] text-[#4ade80]">РИСУНОК [ПКМ]</div>
                        <div className="text-base font-bold text-[#4ade80] mt-0.5">
                          {Math.round(4 * activeSpellMult)}..{Math.round(26 * activeSpellMult)} ур.
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#12101b] border border-[#38bdf8] text-xs font-mono-num text-[#bae6fd]">
                      ❄️ Замедляет врагов на <strong>30% на 2 секунды</strong> · При наведении на воду замораживает участок в Снег.
                    </div>
                  </div>
                ) : activeSpell.id === 'stupefy' ? (
                  <div className="grid grid-cols-3 gap-2.5 text-center font-mono-num">
                    <div className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d]">
                      <div className="text-[10px] text-[#a39bb5]">БЫСТРО [Пробел]</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {Math.round(2 * activeSpellMult)} ур.
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d]">
                      <div className="text-[10px] text-[#38bdf8]">ГОЛОС [R]</div>
                      <div className="text-base font-bold text-[#38bdf8] mt-0.5">
                        {Math.round(8 * activeSpellMult)} ур.
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#12101b] border border-[#22c55e]">
                      <div className="text-[10px] text-[#4ade80]">КИРПИЧ [ПКМ]</div>
                      <div className="text-base font-bold text-[#4ade80] mt-0.5">
                        {Math.round(4 * activeSpellMult)}..{Math.round(20 * activeSpellMult)} ур.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5 text-center font-mono-num">
                    <div className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d]">
                      <div className="text-[10px] text-[#a39bb5]">БЫСТРО [Пробел]</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {Math.round(2 * activeSpellMult)} ур.
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d]">
                      <div className="text-[10px] text-[#38bdf8]">ГОЛОС [R]</div>
                      <div className="text-base font-bold text-[#38bdf8] mt-0.5">
                        {Math.round(14 * activeSpellMult)} ур.
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#12101b] border border-[#22c55e]">
                      <div className="text-[10px] text-[#4ade80]">РИСУНОК [ПКМ]</div>
                      <div className="text-base font-bold text-[#4ade80] mt-0.5">
                        {Math.round(6 * activeSpellMult)}..{Math.round(30 * activeSpellMult)} ур.
                      </div>
                    </div>
                  </div>
                )}

                {/* Progressive 6-Level Spell Upgrade Block (Level 6 unlocks Elemental Awakening!) */}
                <div className="p-4 rounded-lg bg-[#12101b] border border-[#3b3154] space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono-num">
                    <span className="font-bold text-[#f5efe6]">
                      Уровень: {activeSpellLevel} / {MAX_SPELL_LEVEL} (+{(activeSpellLevel - 1) * 20}% · КД {activeSpellCooldown}с)
                    </span>
                    <span className="text-[#fde047]">Ресурсов: {totalResources}</span>
                  </div>

                  {isCombatSpell && (
                    <div className="text-xs font-mono-num text-[#38bdf8]">
                      {activeSpellLevel >= 4
                        ? '★ Бонус Ур. 4+ активен: Вылетают 2 снаряда одновременно!'
                        : 'На Ур. 4 вылетают 2 снаряда (один по прицелу, второй чуть ниже) · КД снижается с 4с до 3с'}
                    </div>
                  )}

                  <div
                    className={`p-2.5 rounded-lg border text-xs font-mono-num ${
                      activeSpellLevel >= 6
                        ? 'bg-[#132a1f] border-[#22c55e] text-[#bbf7d0]'
                        : 'bg-[#1c182b] border-[#4c3d75] text-[#e9d5ff]'
                    }`}
                  >
                    <strong>
                      {activeSpellLevel >= 6 ? '⚡ Пробуждение 6 ур. АКТИВНО: ' : '⚡ Пробуждение на 6 ур. (ресурсы 4 этажа): '}
                    </strong>
                    {SPELL_LEVEL_6_EFFECTS[activeSpell.id]}
                  </div>

                  <div className="grid grid-cols-6 gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                      <div
                        key={step}
                        className={`h-2.5 rounded border ${
                          step <= activeSpellLevel
                            ? step === 6
                              ? 'bg-[#22c55e] border-[#86efac]'
                              : 'bg-[#f59e0b] border-[#fde047]'
                            : 'bg-[#1c182b] border-[#2a233d]'
                        }`}
                      />
                    ))}
                  </div>

                  {activeSpellLevel < MAX_SPELL_LEVEL &&
                    (spellUpgradeCost.minFlyingReagents > 0 ||
                      spellUpgradeCost.minEliteReagents > 0 ||
                      (spellUpgradeCost.minElementalReagents ?? 0) > 0) && (
                      <div className="text-[11px] font-mono-num text-[#cbd5e1] space-y-0.5">
                        {spellUpgradeCost.minFlyingReagents > 0 && (
                          <div>
                            Трофеи неба (Сердце горгульи / Перо гарпии):{' '}
                            <strong className="text-[#38bdf8]">
                              {(reagentInventory.gargoyle_heart || 0) +
                                (reagentInventory.harpy_feather || 0)}
                              /{spellUpgradeCost.minFlyingReagents}
                            </strong>
                          </div>
                        )}
                        {spellUpgradeCost.minEliteReagents > 0 && (
                          <div>
                            Редкие трофеи (Осколок ядра / Чешуя дракона):{' '}
                            <strong className="text-[#fde047]">
                              {(reagentInventory.dark_core_shard || 0) +
                                (reagentInventory.ice_dragon_scale || 0)}
                              /{spellUpgradeCost.minEliteReagents}
                            </strong>
                          </div>
                        )}
                        {(spellUpgradeCost.minElementalReagents ?? 0) > 0 && (
                          <div>
                            Эссенции Стихий 4 уровня (Огонь / Вода / Земля):{' '}
                            <strong className="text-[#f97316]">
                              {(reagentInventory.fire_essence || 0) +
                                (reagentInventory.water_essence || 0) +
                                (reagentInventory.earth_essence || 0)}
                              /{spellUpgradeCost.minElementalReagents}
                            </strong>
                          </div>
                        )}
                      </div>
                    )}

                  <button
                    type="button"
                    disabled={activeSpellLevel >= MAX_SPELL_LEVEL || !canUpgradeActiveSpell}
                    onClick={() => onUpgradeSpell(activeSpell.id)}
                    className={`w-full py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      activeSpellLevel >= MAX_SPELL_LEVEL
                        ? 'bg-[#15803d] text-white'
                        : canUpgradeActiveSpell
                        ? 'bg-[#f59e0b] hover:bg-[#fbbf24] text-[#09080d]'
                        : 'bg-[#241f33] text-[#64748b] cursor-not-allowed'
                    }`}
                  >
                    {activeSpellLevel >= MAX_SPELL_LEVEL
                      ? 'Максимальный уровень (Ур. 6 · Пробуждение Стихий активно!)'
                      : `Улучшить до Ур. ${activeSpellLevel + 1} (${spellUpgradeCost.label})`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAMEABLE PETS SECTION (Included inside Spells tab so Pets remain accessible while keeping the 6 clean top tabs) */}
          {(activeTab === 'spells' || activeTab === 'pets') && (
            <div className="space-y-5 pt-2 border-t border-[#2a233d]">
              {/* Active Pet Training Card */}
              <div className="p-5 rounded-lg bg-[#181524] border border-[#2a233d] space-y-4">
                {tamedPet ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="font-display text-lg font-bold text-[#fde047]">
                          {tamedPet.name} — Уровень {tamedPet.level} / 5
                        </h3>
                        <p className="text-xs text-[#a39bb5] mt-0.5">
                          {tamedPet.passiveBonus} ·{' '}
                          {tamedPet.species === 'owl'
                            ? 'Атакует наземных и летающих врагов'
                            : 'Питомец ближнего боя (не достаёт летающих врагов)'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono-num bg-[#12101b] px-4 py-2.5 rounded-lg border border-[#3b3154]">
                        <span>
                          Урон: <strong className="text-[#38bdf8]">{tamedPet.attackDamage}</strong>
                        </span>
                        <span>
                          Размер: <strong className="text-[#4ade80]">x{tamedPet.scale}</strong>
                        </span>
                        <span>
                          Ресурсов: <strong className="text-[#fde047]">{totalResources}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-[#12101b] border border-[#3b3154] space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono-num">
                        <span className="font-semibold text-[#e2d9f3]">
                          Тренировка до Ур. {Math.min(5, tamedPet.level + 1)}: Шаг {tamedPet.trainingStep} / 3
                        </span>
                        <span className="text-[#fde047]">
                          Опыт боя: {tamedPet.petXp}/{tamedPet.petNextXp}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[0, 1, 2].map((stepIdx) => (
                          <div
                            key={stepIdx}
                            className={`h-3 rounded border ${
                              tamedPet.level >= 5 || stepIdx < tamedPet.trainingStep
                                ? 'bg-[#f59e0b] border-[#fde047]'
                                : 'bg-[#1c182b] border-[#2a233d]'
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={tamedPet.level >= 5 || !canTrainActivePet}
                        onClick={onUpgradeTamedPet}
                        className={`w-full py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          tamedPet.level >= 5
                            ? 'bg-[#15803d] text-white'
                            : canTrainActivePet
                            ? 'bg-[#f59e0b] hover:bg-[#fbbf24] text-[#09080d]'
                            : 'bg-[#241f33] text-[#64748b] cursor-not-allowed'
                        }`}
                      >
                        {tamedPet.level >= 5
                          ? 'Максимальный уровень питомца (Ур. 5)'
                          : `Тренировать питомца (Шаг ${tamedPet.trainingStep + 1}/3 · ${petTrainingCost.label})`}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-[#cbd5e1]">
                    Питомец еще не выбран. Выберите спутника ниже или найдите Котика Мурзика в Лабиринте [E]:
                  </div>
                )}
              </div>

              {/* Pet Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(PET_CATALOG).map((pet) => {
                  const isChosen = tamedPet?.species === pet.id;
                  return (
                    <div
                      key={pet.id}
                      className={`p-4 rounded-lg border flex items-center justify-between gap-4 ${
                        isChosen
                          ? 'bg-[#231d36] border-[#f59e0b]'
                          : 'bg-[#181524] border-[#2a233d]'
                      }`}
                    >
                      <div>
                        <h4
                          className="font-display text-base font-bold"
                          style={{ color: pet.primaryColor }}
                        >
                          {pet.name}
                        </h4>
                        <div className="text-xs text-[#cbd5e1] mt-0.5 font-mono-num">
                          Базовый урон: {pet.baseAttack} · {pet.passiveBonus}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectTamedPet(pet.id)}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                          isChosen
                            ? 'bg-[#15803d] text-white'
                            : 'bg-[#d97706] hover:bg-[#f59e0b] text-[#09080d]'
                        }`}
                      >
                        {isChosen ? 'Выбран' : 'Выбрать'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: GESTURE TRAINING */}
          {activeTab === 'training' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 space-y-3">
                <h3 className="font-display text-lg font-bold text-[#f5efe6]">
                  Тренировка Жестов (Ур. {gestureMasteryLevel})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {SPELL_ORDER.map((spId) => {
                    const sp = SPELLS[spId];
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => onSelectSpell(sp.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer ${
                          selectedSpellId === sp.id
                            ? 'bg-[#f59e0b] text-[#09080d]'
                            : 'bg-[#1f1b2e] text-[#e2d9f3] hover:bg-[#2d2742]'
                        }`}
                      >
                        {sp.shortWord}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-[#cbd5e1] leading-relaxed">
                  Обводите пунктирный контур заклинания на холсте справа. Чем точнее нарисован жест, тем больше опыта вы получаете (от <strong>+2 XP</strong> при 45% до <strong>+15 XP</strong> при 100% точности)!
                </p>

                {trainResult && (
                  <div
                    data-testid="gesture-training-result"
                    className="p-3.5 rounded-lg bg-[#1c182b] border border-[#3b3154] text-sm font-bold text-[#fde047] font-mono-num space-y-1"
                  >
                    <div>
                      Точность: {trainResult.accuracy}% ·{' '}
                      {selectedSpellId === 'vera_verto'
                        ? `+${trainResult.estimatedDamage} ОЗ`
                        : `Урон: ${trainResult.estimatedDamage}`}
                    </div>
                    <div className="text-xs text-[#4ade80]">
                      {calculatePracticeGestureXp(trainResult.accuracy) > 0
                        ? `✨ Получено опыта за тренировку: +${calculatePracticeGestureXp(
                            trainResult.accuracy
                          )} XP`
                        : '⚠️ Точность ниже 45% (0 XP) — проведите линию точнее по контуру!'}
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-7 flex flex-col items-center">
                <div className="text-xs text-[#a39bb5] mb-2">
                  Обведите контур: <strong className="text-white">{activeSpell.gestureName}</strong>
                </div>
                <canvas
                  ref={trainCanvasRef}
                  width={280}
                  height={280}
                  data-testid="gesture-training-canvas"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="w-[280px] h-[280px] bg-[#0b0912] border-2 border-[#4c3d75] rounded-xl cursor-crosshair touch-none"
                />
              </div>
            </div>
          )}

          {/* TAB: АРТЕФАКТЫ (Посохи и Вещи без верхней панели ресурсов — всё указано прямо на карточках!) */}
          {activeTab === 'craft' && (
            <div className="space-y-6">
              {/* SECTION 1: EQUIPPED ITEMS SUMMARY (STAFF + 4 ARTIFACT SLOTS WITH CUSTOM ICONS) */}
              {(() => {
                const artBonuses = getCombinedArtifactBonuses(equippedArtifacts);
                const eqStaff = EQUIPMENT_CATALOG[equippedStaffId];
                return (
                  <div className="bg-[#181524] border border-[#3b3154] rounded-xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-display text-base font-bold text-[#fde047]">
                          🛡️ Экипировка Мага по Разделам (Посох, Мантия, Перчатки, Кольцо, Ботинки)
                        </h3>
                        <p className="text-xs text-[#cbd5e1] mt-0.5">
                          Все предметы разделены по категориям с собственными ярлычками. Ненужные артефакты можно <strong>разобрать за 50% ресурсов</strong>!
                        </p>
                      </div>
                      <span className="text-xs font-mono-num text-[#38bdf8]">
                        Артефактов в коллекции:{' '}
                        <strong>{new Set(ownedArtifacts).size}/20</strong>
                        {ownedArtifacts.length > new Set(ownedArtifacts).size && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-[#f59e0b] text-[#09080d] font-bold">
                            +{ownedArtifacts.length - new Set(ownedArtifacts).size} дубликат
                          </span>
                        )}
                      </span>
                    </div>

                    {/* 5 Active Slot Cards (Staff + 4 Artifact Slots) */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-lg border bg-[#231d36] border-[#f59e0b] flex items-center gap-2.5">
                        <ItemBadgeIcon kind="staff" staffId={equippedStaffId} size={34} />
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-wider text-[#fde047] font-mono-num">
                            Посох в руках
                          </div>
                          <div className="font-bold text-[#f5efe6] truncate">
                            {eqStaff.name}
                          </div>
                        </div>
                      </div>
                      {(['robe', 'gloves', 'ring', 'boots'] as ArtifactSlot[]).map((slot) => {
                        const eqId = equippedArtifacts[slot];
                        const eqArt = eqId ? ARTIFACT_CATALOG[eqId] : null;
                        return (
                          <div
                            key={slot}
                            className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                              eqArt
                                ? 'bg-[#231d36] border-[#f59e0b]'
                                : 'bg-[#12101b] border-[#2a233d]'
                            }`}
                          >
                            <ItemBadgeIcon
                              kind={slot}
                              tier={eqArt ? eqArt.tier : 1}
                              size={34}
                            />
                            <div className="min-w-0">
                              <div className="text-[10px] uppercase tracking-wider text-[#a39bb5] font-mono-num">
                                {ARTIFACT_SLOT_LABELS[slot]}
                              </div>
                              <div className="font-bold text-[#f5efe6] truncate">
                                {eqArt ? `${eqArt.name} (Ур. ${eqArt.tier})` : 'Не надето'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Active Bonus Totals Bar */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono-num">
                      <span className="px-2 py-1 rounded bg-[#12101b] border border-[#2a233d] text-[#bae6fd]">
                        🛡️ Защита: <strong>+{artBonuses.damageReductionPercent}%</strong>
                      </span>
                      <span className="px-2 py-1 rounded bg-[#12101b] border border-[#2a233d] text-[#c4b5fd]">
                        ✨ Непрохождение урона: <strong>{artBonuses.evasionPercent}%</strong>
                      </span>
                      <span className="px-2 py-1 rounded bg-[#12101b] border border-[#2a233d] text-[#fca5a5]">
                        ❤️ Макс. ОЗ: <strong>+{artBonuses.bonusMaxHp}</strong>
                      </span>
                      <span className="px-2 py-1 rounded bg-[#12101b] border border-[#2a233d] text-[#7dd3fc]">
                        💧 Макс. МП: <strong>+{artBonuses.bonusMaxMp}</strong> · Реген: <strong>+{artBonuses.mpRegenBonus}/с</strong>
                      </span>
                      <span className="px-2 py-1 rounded bg-[#12101b] border border-[#2a233d] text-[#fdba74]">
                        🔥 Урон магии: <strong>+{artBonuses.spellDamageBonusPercent}%</strong>
                      </span>
                      <span className="px-2 py-1 rounded bg-[#12101b] border border-[#2a233d] text-[#fde047]">
                        ⏱️ КД: <strong>-{artBonuses.cooldownReductionSec}с</strong> · Прыжок: <strong>+{artBonuses.teleportRangeBonus}м</strong>
                      </span>
                      <span className="px-2 py-1 rounded bg-[#12101b] border border-[#2a233d] text-[#4ade80]">
                        🥾 Скорость: <strong>+{artBonuses.moveSpeedBonusPercent}%</strong>
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* SECTION 2: CATEGORY NAVIGATION BAR (РАЗДЕЛЫ СОЗДАНИЯ ВЕЩЕЙ) */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#161322] p-3 rounded-xl border border-[#2a233d]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#fde047]">
                  Разделы мастерской:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'all_grouped', label: '📋 Все по разделам' },
                      { id: 'staffs', label: '🪄 Посохи (5)' },
                      { id: 'robe', label: '🧥 Мантии (5)' },
                      { id: 'gloves', label: '🧤 Перчатки (5)' },
                      { id: 'ring', label: '💍 Кольца (5)' },
                      { id: 'boots', label: '🥾 Ботинки (5)' },
                    ] as Array<{ id: CraftSectionFilter; label: string }>
                  ).map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      data-testid={`craft-section-${sec.id}`}
                      onClick={() => setCraftSectionFilter(sec.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        craftSectionFilter === sec.id
                          ? 'bg-[#f59e0b] text-[#09080d] border-[#fde047]'
                          : 'bg-[#181524] text-[#c4b5fd] border-[#2a233d] hover:border-[#4c3d75]'
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 3: STAFFS & WANDS SECTION */}
              {(craftSectionFilter === 'all_grouped' || craftSectionFilter === 'staffs') && (
                <div className="bg-[#151221] border border-[#2a233d] rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2.5 border-b border-[#2a233d] pb-2.5">
                    <ItemBadgeIcon kind="staff" staffId="staff_tri_elemental" size={32} />
                    <div>
                      <h3 className="font-display text-base font-bold text-[#f5efe6]">
                        Раздел 1: Посохи и Палочки (5 уровней)
                      </h3>
                      <p className="text-[11px] text-[#a39bb5]">
                        Усиливают базовый урон заклинаний и упрощают распознавание жестов
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.values(EQUIPMENT_CATALOG).map((item) => {
                      const isOwned = ownedEquipment.includes(item.id);
                      const isEquipped = equippedStaffId === item.id;
                      const canCraft = canCraftEquipment(item.id, reagentInventory);

                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-xl border flex flex-col justify-between ${
                            isEquipped
                              ? 'bg-[#231d36] border-[#f59e0b]'
                              : 'bg-[#181524] border-[#2a233d]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <ItemBadgeIcon kind="staff" staffId={item.id} size={42} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-display text-sm font-bold text-[#f5efe6] truncate">
                                  {item.name}
                                </h4>
                                <span className="text-xs font-mono-num text-[#38bdf8] shrink-0">
                                  x{item.powerBonus.toFixed(2)}
                                </span>
                              </div>
                              {Object.keys(item.recipe).length > 0 ? (
                                <div className="mt-1.5 text-xs text-[#a39bb5] font-mono-num">
                                  {Object.entries(item.recipe).map(([rId, qty], i) => (
                                    <span key={rId}>
                                      {i > 0 ? ' · ' : ''}
                                      {REAGENTS[rId as ReagentId].name}:{' '}
                                      <strong
                                        className={
                                          (reagentInventory[rId as ReagentId] || 0) >= (qty || 0)
                                            ? 'text-[#4ade80]'
                                            : 'text-[#f87171]'
                                        }
                                      >
                                        {reagentInventory[rId as ReagentId] || 0}/{qty}
                                      </strong>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-1.5 text-xs text-[#4ade80] font-mono-num">
                                  Стартовая палочка мага
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-[#2a233d] flex items-center justify-end">
                            <button
                              type="button"
                              disabled={!isOwned && !canCraft}
                              onClick={() => onCraftOrEquip(item.id)}
                              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                                isEquipped
                                  ? 'bg-[#15803d] text-white'
                                  : isOwned
                                  ? 'bg-[#38bdf8] text-[#09080d] hover:bg-[#7dd3fc]'
                                  : canCraft
                                  ? 'bg-[#d97706] hover:bg-[#f59e0b] text-[#09080d]'
                                  : 'bg-[#241f33] text-[#64748b] cursor-not-allowed'
                              }`}
                            >
                              {isEquipped ? 'В руках' : isOwned ? 'Взять' : 'Создать'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 4: DEDICATED ARTIFACT SECTIONS BY SLOT (ROBES, GLOVES, RINGS, BOOTS — NEVER MIXED IN ONE PILE!) */}
              {(['robe', 'gloves', 'ring', 'boots'] as ArtifactSlot[])
                .filter(
                  (slot) => craftSectionFilter === 'all_grouped' || craftSectionFilter === slot
                )
                .map((slot, secIdx) => {
                  const slotItems = Object.values(ARTIFACT_CATALOG).filter(
                    (art) => art.slot === slot
                  );
                  const sectionSubtitle =
                    slot === 'robe'
                      ? 'Защита от урона, шанс непрохождения урона (уклонение) и бонус к Макс. ОЗ'
                      : slot === 'gloves'
                      ? 'Увеличение запаса маны (Макс. МП) и ускорение регенерации маны в секунду'
                      : slot === 'ring'
                      ? 'Усиление урона всех заклинаний и снижение времени перезарядки'
                      : 'Повышение скорости передвижения мага и дальности прыжка Телепорта [Ё]';

                  return (
                    <div
                      key={slot}
                      data-testid={`artifact-section-${slot}`}
                      className="bg-[#151221] border border-[#2a233d] rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-[#2a233d] pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <ItemBadgeIcon kind={slot} tier={4} size={32} />
                          <div>
                            <h3 className="font-display text-base font-bold text-[#fde047]">
                              Раздел {secIdx + 2}: {ARTIFACT_SLOT_LABELS[slot]} (5 уровней)
                            </h3>
                            <p className="text-[11px] text-[#a39bb5]">{sectionSubtitle}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono-num text-[#c4b5fd]">
                          Найдено/создано:{' '}
                          <strong>
                            {slotItems.filter((a) => ownedArtifacts.includes(a.id)).length}/5
                          </strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {slotItems.map((art) => {
                          const ownedCount = getArtifactOwnedCount(art.id, ownedArtifacts);
                          const isOwned = ownedCount > 0;
                          const isEquipped = equippedArtifacts[art.slot] === art.id;
                          const canCraft = canCraftArtifact(art.id, reagentInventory);
                          const refund = getArtifactSalvageRefund(art.id);

                          return (
                            <div
                              key={art.id}
                              data-testid={`artifact-card-${art.id}`}
                              className={`p-4 rounded-xl border flex flex-col justify-between ${
                                isEquipped
                                  ? 'bg-[#231d36] border-[#f59e0b] shadow-md'
                                  : isOwned
                                  ? 'bg-[#182232] border-[#38bdf8]'
                                  : 'bg-[#181524] border-[#2a233d]'
                              }`}
                            >
                              <div className="space-y-2.5">
                                <div className="flex items-start gap-3">
                                  <ItemBadgeIcon kind={art.slot} tier={art.tier} size={42} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-mono-num uppercase tracking-wider px-2 py-0.5 rounded bg-[#12101b] text-[#c4b5fd]">
                                        {ARTIFACT_SLOT_LABELS[art.slot]} · Ур. {art.tier}/5
                                      </span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        {ownedCount > 1 && (
                                          <span
                                            data-testid={`artifact-duplicate-badge-${art.id}`}
                                            className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-[#f59e0b] text-[#09080d]"
                                          >
                                            ДУБЛИКАТ ×{ownedCount}
                                          </span>
                                        )}
                                        {ownedCount === 1 && (
                                          <span className="px-1.5 py-0.5 text-[10px] font-mono-num rounded bg-[#12101b] text-[#38bdf8]">
                                            ×1
                                          </span>
                                        )}
                                        {isEquipped && (
                                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#22c55e] text-[#09080d]">
                                            НАДЕТО ✓
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <h4 className="font-display text-sm font-bold text-[#f5efe6] mt-1 truncate">
                                      {art.name}
                                    </h4>
                                  </div>
                                </div>

                                {/* Stat Badges */}
                                <div className="flex flex-wrap gap-1.5 text-[11px] font-mono-num">
                                  {art.damageReductionPercent > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-[#12101b] text-[#bae6fd]">
                                      🛡️ Защита +{art.damageReductionPercent}%
                                    </span>
                                  )}
                                  {art.evasionPercent > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-[#12101b] text-[#c4b5fd]">
                                      ✨ Непрохождение урона {art.evasionPercent}%
                                    </span>
                                  )}
                                  {art.bonusMaxHp > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-[#12101b] text-[#fca5a5]">
                                      ❤️ +{art.bonusMaxHp} ОЗ
                                    </span>
                                  )}
                                  {art.bonusMaxMp > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-[#12101b] text-[#7dd3fc]">
                                      💧 +{art.bonusMaxMp} МП
                                    </span>
                                  )}
                                  {art.mpRegenBonus > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-[#12101b] text-[#38bdf8]">
                                      ⚡ +{art.mpRegenBonus} МП/с
                                    </span>
                                  )}
                                  {art.spellDamageBonusPercent > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-[#12101b] text-[#fdba74]">
                                      🔥 Урон заклинаний +{art.spellDamageBonusPercent}%
                                    </span>
                                  )}
                                  {art.cooldownReductionSec > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-[#12101b] text-[#fde047]">
                                      ⏱️ Перезарядка -{art.cooldownReductionSec}с
                                    </span>
                                  )}
                                  {art.teleportRangeBonus > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-[#12101b] text-[#a7f3d0]">
                                      🌀 Дальность прыжка +{art.teleportRangeBonus}м
                                    </span>
                                  )}
                                  {art.moveSpeedBonusPercent > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-[#12101b] text-[#4ade80]">
                                      🥾 Скорость +{art.moveSpeedBonusPercent}%
                                    </span>
                                  )}
                                </div>

                                {/* Crafting Recipe */}
                                <div className="text-xs text-[#a39bb5] font-mono-num pt-1">
                                  Крафт:{' '}
                                  {Object.entries(art.recipe).map(([rId, qty], i) => (
                                    <span key={rId}>
                                      {i > 0 ? ' · ' : ''}
                                      {REAGENTS[rId as ReagentId].name}:{' '}
                                      <strong
                                        className={
                                          (reagentInventory[rId as ReagentId] || 0) >= (qty || 0)
                                            ? 'text-[#4ade80]'
                                            : 'text-[#f87171]'
                                        }
                                      >
                                        {reagentInventory[rId as ReagentId] || 0}/{qty}
                                      </strong>
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="mt-3 pt-3 border-t border-[#2a233d] flex flex-wrap items-center justify-between gap-2">
                                {isOwned ? (
                                  <button
                                    type="button"
                                    data-testid={`salvage-artifact-${art.id}`}
                                    onClick={() => onSalvageArtifact(art.id)}
                                    title={`Вернёт 50% ресурсов: ${Object.entries(refund)
                                      .map(
                                        ([rId, q]) => `${REAGENTS[rId as ReagentId].name} x${q}`
                                      )
                                      .join(', ')}`}
                                    className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-[#3b1518] hover:bg-[#521b20] border border-[#ef4444] text-[#fecaca] transition-colors cursor-pointer"
                                  >
                                    {ownedCount > 1
                                      ? `♻️ Разобрать дубликат (×${ownedCount}→×${ownedCount - 1}, +50% рес.)`
                                      : `♻️ Разобрать (+50% рес.)`}
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-[#64748b] font-mono-num">
                                    Сундуки {art.tier === 1 ? '1 ур.' : art.tier === 2 ? '2 ур.' : art.tier <= 4 ? '3–4 ур.' : '4 ур.'} или крафт
                                  </span>
                                )}

                                <button
                                  type="button"
                                  data-testid={`craft-equip-artifact-${art.id}`}
                                  disabled={!isOwned && !canCraft}
                                  onClick={() => onCraftOrEquipArtifact(art.id)}
                                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                                    isEquipped
                                      ? 'bg-[#15803d] hover:bg-[#166534] text-white'
                                      : isOwned
                                      ? 'bg-[#38bdf8] text-[#09080d] hover:bg-[#7dd3fc]'
                                      : canCraft
                                      ? 'bg-[#d97706] hover:bg-[#f59e0b] text-[#09080d]'
                                      : 'bg-[#241f33] text-[#64748b] cursor-not-allowed'
                                  }`}
                                >
                                  {isEquipped ? 'Надето (Снять)' : isOwned ? 'Надеть' : 'Создать'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* TAB 5: CATEGORIZED CLAIMABLE QUESTS WITH VISUAL COMPLETION & REWARD BUTTONS */}
          {activeTab === 'quests' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#181524] p-3.5 rounded-lg border border-[#3b3154] text-xs font-mono-num">
                <span className="text-[#e2d9f3]">
                  Всего испытаний: <strong>{quests.length}</strong> · Получено наград:{' '}
                  <strong className="text-[#22c55e]">{claimedCount}</strong>
                </span>
                {readyToClaimCount > 0 ? (
                  <span className="px-3 py-1 rounded-md bg-[#14532d] border border-[#22c55e] text-[#bbf7d0] font-bold animate-pulse">
                    ✨ Готово к получению наград: {readyToClaimCount}! Нажмите «Забрать награду»
                  </span>
                ) : (
                  <span className="text-[#a39bb5]">
                    Квесты разделены по категориям — выполняйте испытания и забирайте награды
                  </span>
                )}
              </div>

              {/* Quest Category Filter Bar */}
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'all', label: `Все категории (${quests.length})` },
                    {
                      id: 'survival',
                      label: `🔥 ${QUEST_CATEGORY_LABELS.survival} (${
                        quests.filter((q) => q.category === 'survival').length
                      })`,
                    },
                    {
                      id: 'combat',
                      label: `⚔️ ${QUEST_CATEGORY_LABELS.combat} (${
                        quests.filter((q) => q.category === 'combat').length
                      })`,
                    },
                    {
                      id: 'magic',
                      label: `✨ ${QUEST_CATEGORY_LABELS.magic} (${
                        quests.filter((q) => q.category === 'magic').length
                      })`,
                    },
                    {
                      id: 'exploration',
                      label: `🐾 ${QUEST_CATEGORY_LABELS.exploration} (${
                        quests.filter((q) => q.category === 'exploration').length
                      })`,
                    },
                  ] as Array<{ id: 'all' | QuestCategory; label: string }>
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setQuestCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      questCategoryFilter === cat.id
                        ? 'bg-[#f59e0b] text-[#09080d] border-[#fde047]'
                        : 'bg-[#181524] text-[#c4b5fd] border-[#2a233d] hover:border-[#4c3d75]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...quests]
                  .filter(
                    (q) => questCategoryFilter === 'all' || q.category === questCategoryFilter
                  )
                  .sort((a, b) => {
                    const aReady = a.completed && !a.claimed ? 1 : 0;
                    const bReady = b.completed && !b.claimed ? 1 : 0;
                    if (aReady !== bReady) return bReady - aReady;
                    if (a.claimed !== b.claimed) return a.claimed ? 1 : -1;
                    return 0;
                  })
                  .map((q) => {
                    const isReadyToClaim = q.completed && !q.claimed;
                    const progressPct = Math.min(
                      100,
                      Math.round((q.currentCount / Math.max(1, q.targetCount)) * 100)
                    );

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                          isReadyToClaim
                            ? 'bg-[#132a1f] border-[#22c55e] shadow-lg shadow-[#22c55e]/15'
                            : q.claimed
                            ? 'bg-[#12101a] border-[#241f36] opacity-75'
                            : 'bg-[#181524] border-[#2a233d]'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono-num uppercase tracking-wider px-2 py-0.5 rounded bg-[#231d36] text-[#c4b5fd]">
                              {QUEST_CATEGORY_LABELS[q.category]}
                            </span>
                            <span
                              className={`text-xs font-mono-num font-bold shrink-0 px-2 py-0.5 rounded ${
                                isReadyToClaim
                                  ? 'bg-[#22c55e] text-[#09080d]'
                                  : q.claimed
                                  ? 'bg-[#1e293b] text-[#94a3b8]'
                                  : 'bg-[#231d36] text-[#fde047]'
                              }`}
                            >
                              {q.claimed
                                ? 'Получено ✓'
                                : `${q.currentCount}/${q.targetCount}`}
                            </span>
                          </div>

                          <h4 className="font-semibold text-sm text-[#f5efe6] leading-snug">
                            {q.title}
                          </h4>

                          <p className="text-xs text-[#cbd5e1] leading-relaxed">
                            {q.description}
                          </p>

                          {/* Visual Progress Bar */}
                          <div className="w-full h-2 bg-[#0e0c16] rounded-full overflow-hidden border border-[#2a233d]">
                            <div
                              className={`h-full transition-all duration-200 ${
                                q.claimed
                                  ? 'bg-[#15803d]'
                                  : isReadyToClaim
                                  ? 'bg-[#22c55e]'
                                  : 'bg-[#f59e0b]'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-[#2a233d] space-y-2.5">
                          <div className="text-[11px] font-mono-num text-[#38bdf8]">
                            Награда: <strong className="text-[#fde047]">+{q.rewardXp} XP</strong> ·{' '}
                            {q.rewardStat}
                          </div>

                          {isReadyToClaim ? (
                            <button
                              type="button"
                              onClick={() => onClaimQuest(q.id)}
                              className="w-full py-2 px-3 text-xs font-bold rounded-lg bg-[#22c55e] hover:bg-[#4ade80] text-[#09080d] shadow-md transition-transform active:scale-95 cursor-pointer"
                            >
                              🎁 Забрать награду!
                            </button>
                          ) : q.claimed ? (
                            <div className="w-full py-1.5 text-center text-[11px] font-semibold text-[#4ade80] bg-[#0f2419] rounded-lg border border-[#14532d]">
                              ✓ Награда получена
                            </div>
                          ) : (
                            <div className="w-full py-1.5 text-center text-[11px] font-mono-num text-[#94a3b8] bg-[#12101b] rounded-lg border border-[#231e36]">
                              В процессе ({progressPct}%)
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 6: MULTIPLAYER LABYRINTH CO-OP / PARALLEL WORLDS & PVP DUEL */}
          {activeTab === 'pvp' && (
            <div className="space-y-6">
              {/* Two Labyrinth Multiplayer Mode Cards: Shared Co-op vs Parallel Worlds */}
              <div className="bg-[#181524] border border-[#3b3154] rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#fde047]">
                    Режим совместного прохождения Лабиринта
                  </h3>
                  <p className="text-xs text-[#cbd5e1] mt-1">
                    Выберите, как вы хотите проходить Лабиринт с друзьями в одной комнате (режим переключается для всей комнаты):
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(
                    [
                      LABYRINTH_MULTIPLAYER_MODES.shared,
                      LABYRINTH_MULTIPLAYER_MODES.parallel,
                    ] as const
                  ).map((modeDef) => {
                    const isSelected = labyrinthMultiplayerMode === modeDef.id;
                    return (
                      <button
                        key={modeDef.id}
                        type="button"
                        data-testid={`labyrinth-mp-mode-${modeDef.id}`}
                        onClick={() => onSelectLabyrinthMultiplayerMode(modeDef.id)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          isSelected
                            ? modeDef.id === 'shared'
                              ? 'bg-[#132a1f] border-[#22c55e] shadow-lg shadow-[#22c55e]/15'
                              : 'bg-[#1a1630] border-[#a855f7] shadow-lg shadow-[#a855f7]/15'
                            : 'bg-[#12101b] border-[#2a233d] hover:border-[#4c3d75]'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-[#f5efe6]">
                              {modeDef.id === 'shared' ? '🤝 ' : '🌀 '}
                              {modeDef.title}
                            </span>
                            <span
                              className={`text-[10px] font-mono-num font-bold px-2 py-0.5 rounded shrink-0 ${
                                isSelected
                                  ? modeDef.id === 'shared'
                                    ? 'bg-[#22c55e] text-[#09080d]'
                                    : 'bg-[#a855f7] text-white'
                                  : 'bg-[#231d36] text-[#94a3b8]'
                              }`}
                            >
                              {isSelected ? 'АКТИВЕН ✓' : 'Выбрать'}
                            </span>
                          </div>

                          <p className="text-xs text-[#cbd5e1] leading-relaxed">
                            {modeDef.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#2a233d] flex flex-wrap items-center gap-1.5 text-[10px] font-mono-num">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              modeDef.sharedEnemies
                                ? 'bg-[#14532d] text-[#bbf7d0]'
                                : 'bg-[#1e1b2e] text-[#c4b5fd]'
                            }`}
                          >
                            {modeDef.sharedEnemies
                              ? '⚔️ Общие враги и Босс'
                              : '🌀 Свои враги и Босс'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#3b1518] text-[#fecaca]">
                            🔥 Урон по игрокам (Аккуратная стрельба!)
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Room Connection & Online Players */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-6 bg-[#181524] border border-[#2a233d] rounded-xl p-5 space-y-4">
                  <h3 className="font-display text-base font-bold text-[#f5efe6]">
                    Подключение к Комнате
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="pvp-wizard-name" className="block text-xs text-[#cbd5e1] mb-1">
                        Имя мага
                      </label>
                      <input
                        id="pvp-wizard-name"
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#0d0b14] border border-[#3b3154] rounded text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="pvp-room-code" className="block text-xs text-[#cbd5e1] mb-1">
                        Код комнаты (введите одинаковый код с другом)
                      </label>
                      <input
                        id="pvp-room-code"
                        type="text"
                        value={roomInput}
                        onChange={(e) => setRoomInput(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[#0d0b14] border border-[#3b3154] rounded text-white font-mono-num"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => onJoinPvpRoom(roomInput, nameInput)}
                        className="px-4 py-2 text-xs font-semibold bg-[#d97706] hover:bg-[#f59e0b] text-[#09080d] rounded-lg transition-colors cursor-pointer"
                      >
                        Подключиться к комнате
                      </button>
                      <button
                        type="button"
                        onClick={onResetPvpDuel}
                        className="px-4 py-2 text-xs font-semibold bg-[#2a233d] hover:bg-[#3b3154] text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Восстановить ОЗ всем
                      </button>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-6 bg-[#181524] border border-[#2a233d] rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-[#f5efe6]">
                      Комната «{pvpRoom}» · {LABYRINTH_MULTIPLAYER_MODES[labyrinthMultiplayerMode].shortBadge}
                    </h4>
                    <span className="text-xs font-mono-num text-[#38bdf8]">
                      {pvpConnected ? '● Онлайн' : '○ Офлайн'}
                    </span>
                  </div>

                  {remotePlayers.length === 0 ? (
                    <p className="text-xs text-[#a39bb5] py-4 leading-relaxed">
                      Ожидание второго мага в комнате «{pvpRoom}»... Откройте игру у друга с тем же кодом комнаты, чтобы проходить Лабиринт вместе!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {remotePlayers.map((rp) => (
                        <div
                          key={rp.id}
                          className="p-3 rounded-lg bg-[#12101b] border border-[#2a233d] flex items-center justify-between text-xs font-mono-num"
                        >
                          <div>
                            <span className="font-semibold text-white">🧙 {rp.name}</span>
                            <span className="ml-2 text-[11px] text-[#a39bb5]">
                              Ур. {rp.level || 1}
                            </span>
                          </div>
                          <span className="text-[#22c55e] font-bold">
                            ♥ {rp.hp}/{rp.maxHp}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
