export type GestureId =
  | 'triangle'
  | 'swish_flick'
  | 'bolt'
  | 'circle'
  | 'rect_brick'
  | 'heart'
  | 'caret'
  | 'diamond'
  | 'spiral_in'
  | 'sword_blade'
  | 'hourglass';

export type SpellId =
  | 'incendio'
  | 'wingardium'
  | 'expelliarmus'
  | 'stupefy'
  | 'vera_verto'
  | 'engorgio'
  | 'glacius'
  | 'arcane_sword'
  | 'teleport'
  | 'campfire_teleport'
  | 'cooldown_reset';

export type ReagentId =
  | 'ancient_wood'
  | 'mandrake_root'
  | 'rat_hair'
  | 'rat_meat'
  | 'boar_meat'
  | 'bear_meat'
  | 'boar_tusk'
  | 'bat_meat'
  | 'gargoyle_heart'
  | 'harpy_feather'
  | 'dark_core_shard'
  | 'ice_dragon_scale'
  | 'fire_essence'
  | 'water_essence'
  | 'earth_essence';

export type QuestCategory = 'combat' | 'magic' | 'survival' | 'exploration';

export const QUEST_CATEGORY_LABELS: Record<QuestCategory, string> = {
  combat: 'Бой и Охота',
  magic: 'Магия и Руны',
  survival: 'Костёр, Алхимия и Еда',
  exploration: 'Исследование и Спутники',
};

export type CampfireRecipeId =
  | 'health_potion'
  | 'mana_potion'
  | 'rat_food'
  | 'boar_food'
  | 'bear_food'
  | 'bat_food';

export type AimSurfaceTarget = 'none' | 'water' | 'snow';

export type ContextualGestureId = 'snowflake' | 'water_two_spheres' | 'snow_three_spheres';

export type ElementalAllyKind = 'water_spirit' | 'snowman';

export interface ElementalAllyStats {
  kind: ElementalAllyKind;
  name: string;
  durationSec: number; // 60..180 sec (1..3 min)
  attackDamage: number;
  attackInterval: number;
  projectileSpeed: number;
  accuracyPercent: number;
}

export interface CraftedPotionItem {
  id: string;
  kind: 'health' | 'mana';
  name: string;
  restoreAmount: number; // 10..50 HP or MP based on drawing accuracy
  accuracyPercent: number;
}

export interface CookedRatFoodItem {
  id: string;
  name: string;
  bonusMaxHp: number; // 10..50 Max HP
  hpRegenPerSec: number; // 0.1..0.5 HP/sec
  durationSec: number; // 60..300 sec (1..5 min)
  accuracyPercent: number;
}

export interface CookedBoarFoodItem {
  id: string;
  name: string;
  bonusMaxHp: number; // 25..80 Max HP (stronger than rat food!)
  hpRegenPerSec: number; // 0.3..0.9 HP/sec
  durationSec: number; // 90..360 sec (1.5..6 min)
  accuracyPercent: number;
}

export interface CookedBearFoodItem {
  id: string;
  name: string;
  bonusMaxHp: number; // 45..120 Max HP (best health food from Stage 5 Cave Bears!)
  hpRegenPerSec: number; // 0.6..1.6 HP/sec
  durationSec: number; // 120..420 sec (2..7 min)
  accuracyPercent: number;
}

export interface CookedBatFoodItem {
  id: string;
  name: string;
  bonusMaxMp: number; // 10..50 Max MP (or 25..80 Max MP when cooked with Stage 4 Water Essence!)
  mpRegenPerSec: number; // 0.1..0.5 MP/sec (or 0.3..0.9 MP/sec with Water Essence)
  durationSec: number; // 60..300 sec (1..5 min)
  accuracyPercent: number;
}

export interface ActiveFoodBuffState {
  name: string;
  bonusMaxHp: number;
  hpRegenPerSec: number;
  bonusMaxMp?: number;
  mpRegenPerSec?: number;
  remainingSec: number;
  totalDurationSec: number;
}

export type EquipmentId =
  | 'wand_ollivander'
  | 'wand_ancient_yew'
  | 'staff_coven'
  | 'staff_frost_dragon'
  | 'staff_tri_elemental';

export type ArtifactSlot = 'robe' | 'gloves' | 'ring' | 'boots';

export type ArtifactTier = 1 | 2 | 3 | 4 | 5;

export type ArtifactId =
  | 'robe_1'
  | 'robe_2'
  | 'robe_3'
  | 'robe_4'
  | 'robe_5'
  | 'gloves_1'
  | 'gloves_2'
  | 'gloves_3'
  | 'gloves_4'
  | 'gloves_5'
  | 'ring_1'
  | 'ring_2'
  | 'ring_3'
  | 'ring_4'
  | 'ring_5'
  | 'boots_1'
  | 'boots_2'
  | 'boots_3'
  | 'boots_4'
  | 'boots_5';

export interface ArtifactDef {
  id: ArtifactId;
  slot: ArtifactSlot;
  tier: ArtifactTier;
  name: string;
  description: string;
  color: string;
  damageReductionPercent: number; // Robes: +3%..+15%, Boots: +2%..+10%
  evasionPercent: number; // Robes: +3%..+15% (% chance incoming damage does not pass through)
  bonusMaxHp: number; // Robes: +30..+140 Max HP
  mpRegenBonus: number; // Gloves: +0.2..+1.0 MP/sec
  bonusMaxMp: number; // Gloves: +30..+100 Max MP
  spellDamageBonusPercent: number; // Gloves: 0%, 0%, +5% (Lv3), +10% (Lv4), +15% (Lv5)
  cooldownReductionSec: number; // Rings: -0.3s..-1.2s cooldown
  teleportRangeBonus: number; // Rings: +2m..+5m teleport jump range
  moveSpeedBonusPercent: number; // Boots: +6%..+22% move speed
  recipe: Partial<Record<ReagentId, number>>;
}

export type TameableSpeciesId = 'cat' | 'fox' | 'owl' | 'salamander';

export type CastInputMode = 'quick' | 'voice' | 'drawn' | 'voice_and_drawn';

/**
 * Authoritative Spell Dock Order:
 * [1] Огонь (incendio)
 * [2] Мороз (glacius)
 * [3] Удар (expelliarmus)
 * [4] Стоп (stupefy)
 * [5] Левиоса (wingardium)
 * [6] Рост (engorgio)
 * [7] Лечение (vera_verto)
 * [8] Меч (arcane_sword)
 * [Ё] Прыжок (teleport)
 * [F] Домой (campfire_teleport)
 * [G] Перезарядка способностей (cooldown_reset — самый последний после [F])
 */
export const SPELL_ORDER: SpellId[] = [
  'incendio',
  'glacius',
  'expelliarmus',
  'stupefy',
  'wingardium',
  'engorgio',
  'vera_verto',
  'arcane_sword',
  'teleport',
  'campfire_teleport',
  'cooldown_reset',
];

export function getSpellHotkeyLabel(spellId: SpellId): string {
  if (spellId === 'teleport') return 'Ё';
  if (spellId === 'campfire_teleport') return 'F';
  if (spellId === 'cooldown_reset') return 'G';
  const idx = SPELL_ORDER.indexOf(spellId);
  return idx >= 0 ? String(idx + 1) : '';
}

export interface Point2D {
  x: number;
  y: number;
}

export interface ReagentDef {
  id: ReagentId;
  name: string;
  sourceHint: string;
  spellInfusionBonus: string;
  powerMultiplier: number;
  manaDiscount: number;
  color: string;
}

export interface EquipmentDef {
  id: EquipmentId;
  name: string;
  type: 'wand' | 'staff';
  description: string;
  powerBonus: number;
  gestureForgiveness: number;
  unlocksSpell?: SpellId;
  recipe: Partial<Record<ReagentId, number>>;
  primaryColor: string;
  gemColor: string;
}

export interface TameablePetDef {
  id: TameableSpeciesId;
  name: string;
  title: string;
  description: string;
  roleClue: string;
  baseAttack: number;
  attackInterval: number;
  passiveBonus: string;
  primaryColor: string;
  accentColor: string;
}

export interface SpellDef {
  id: SpellId;
  name: string;
  shortWord: string; // Simple 3-5 letter Russian word!
  latinName: string;
  roleClue: string;
  description: string;
  voiceTriggers: string[];
  gestureId: GestureId;
  gestureName: string;
  baseDamage: number;
  manaCost: number;
  cooldown: number; // 4.0s base (down to 3.0s at Lv5), 30.0s for Heal & Growth
  unlockLevel: number;
  color: string;
  secondaryColor: string;
  templatePoints: Point2D[];
}

export type QuestEventType =
  | 'cast_any'
  | 'cast_voice'
  | 'cast_drawn'
  | 'cast_perfect_drawn'
  | 'cast_incendio'
  | 'cast_glacius'
  | 'cast_expelliarmus'
  | 'cast_stupefy'
  | 'cast_wingardium'
  | 'cast_heal'
  | 'cast_engorgio'
  | 'cast_teleport'
  | 'harvest'
  | 'tame_pet'
  | 'kill_flying'
  | 'mob_kill'
  | 'kill_boss'
  | 'transfigure'
  | 'light_campfire'
  | 'brew_potion'
  | 'brew_high_potion'
  | 'cook_rat_food'
  | 'cook_high_rat_food'
  | 'cook_boar_food'
  | 'cook_bat_water_food'
  | 'barrel_explode_hit'
  | 'kill_boar'
  | 'kill_elemental'
  | 'upgrade_spell_lv6'
  | 'activate_rune_button'
  | 'build_wall'
  | 'dismantle_wall'
  | 'defeat_stage5_mob'
  | 'defeat_boss_1'
  | 'defeat_boss_2'
  | 'defeat_boss_3'
  | 'defeat_boss_4'
  | 'defeat_boss_5'
  | 'flawless_stage_clear';

export interface QuestDef {
  id: string;
  category: QuestCategory;
  title: string;
  description: string;
  eventType: QuestEventType;
  targetCount: number;
  currentCount: number;
  completed: boolean; // True when currentCount >= targetCount (ready to claim!)
  claimed: boolean;   // True after player clicks "Забрать награду"
  rewardXp: number;
  rewardStat: string;
  rewardMaxHp?: number;
  rewardMaxMp?: number;
  rewardReagent?: { id: ReagentId; count: number };
  rewardReagents?: Partial<Record<ReagentId, number>>;
}

export const UNIFORM_MANA_COST = 15;
export const WINGARDIUM_MANA_COST = 10;
export const SPECIAL_MANA_COST = 30;
export const SPELL_COOLDOWN_SEC = 4.0;
export const MIN_UPGRADED_SPELL_COOLDOWN_SEC = 3.0;
export const SPECIAL_COOLDOWN_SEC = 30.0;
export const TELEPORT_BASE_COOLDOWN_SEC = 10.0;
export const TELEPORT_BLAST_RADIUS = 6.0;
export const CAMPFIRE_TELEPORT_MANA_COST = 10;
export const CAMPFIRE_TELEPORT_COOLDOWN_SEC = 120.0; // 2 minutes (120 seconds)
export const CAMPFIRE_TELEPORT_QUICK_CAST_SEC = 3.0; // 3.0s when quick-cast with [Space]
export const CAMPFIRE_TELEPORT_VOICE_CAST_SEC = 2.0; // 2.0s when cast by Voice [R]
export const CAMPFIRE_TELEPORT_DRAWN_MAX_CAST_SEC = 2.2; // 2.2s down to 1.5s based on drawing quality
export const CAMPFIRE_TELEPORT_DRAWN_MIN_CAST_SEC = 1.5;
export const ENGORGIO_BUFF_DURATION_SEC = 10.0;
export const GLACIUS_SLOW_PERCENT = 30; // 30% enemy movement/attack slow
export const GLACIUS_SLOW_FACTOR = 0.7; // 1.0 - 0.30 = 0.70 speed multiplier
export const GLACIUS_SLOW_DURATION_SEC = 2.0; // 2 seconds slow duration

// Campfire, Wooden Wall & Shelter Constants
export const CAMPFIRE_WOOD_COST = 3; // 3 Дрова (ancient_wood) to build a campfire
export const CAMPFIRE_HEAL_RADIUS = 4.2; // Small healing radius around lit campfire
export const CAMPFIRE_HP_REGEN_PER_SEC = 0.5; // +0.5 HP/sec near lit campfire
export const CAMPFIRE_MP_REGEN_MULTIPLIER = 1.5; // +50% of current character mana regen near lit campfire
export const WALL_WOOD_COST = 2; // Стена стоит 2 дерева (ancient_wood)
export const WALL_BUILD_DURATION_SEC = 2.0; // Стена строится 2 секунды
export const MAX_BUILT_WALLS = 12; // Максимум 12 стен можно построить на карте
export const WALL_DISMANTLE_WOOD_REFUND = 1; // При поломке стены возвращается 1 дерево
export const CAMPFIRE_SHELTER_MIN_WALLS = 3; // Если костёр окружён 3 стенами
export const CAMPFIRE_SHELTER_RADIUS = 6.5; // Радиус вокруг костра для зачёта окружающих стен
export const CAMPFIRE_SHELTER_REGEN_MULTIPLIER = 2.0; // Восстановление ОЗ и МП у окружённого 3 стенами костра увеличивается в 2 раза
export const HARVEST_NODE_RESPAWN_SEC = 60.0; // Trees and plants disappear and respawn in 1 minute (60s)
export const BARREL_RESPAWN_SEC = 60.0; // Red explosive barrels respawn 1 minute (60s) after exploding
export const RUNE_BUTTON_SCALE = 0.49; // Rune Gate buttons are 30% smaller again (0.7 * 0.7 = 0.49x scale) so harder to hit!
export const MAX_SPELL_LEVEL = 6; // Spells can now be upgraded to Level 6 with Stage 4 Elemental Essences!
export const ELEMENTAL_ALLY_MIN_DURATION_SEC = 30.0; // 30 seconds min (-30s from 60s)
export const ELEMENTAL_ALLY_MAX_DURATION_SEC = 150.0; // 150 seconds max (-30s from 180s)
export const LASER_TRAP_DAMAGE = 45; // 45 HP damage when walking through Stage 2 blue laser beam
export const LASER_TRAP_RESPAWN_SEC = 60.0; // Reappears 60 seconds after triggering
export const BOAR_SLOW_PERCENT = 15; // Wild Boar hit slows player movement by 15%
export const BOAR_SLOW_FACTOR = 0.85; // 1.0 - 0.15 = 0.85 player speed multiplier
export const BOAR_SLOW_DURATION_SEC = 3.0; // 3 seconds slow duration from Wild Boar hit
export const SHIELD_BASE_DAMAGE_MULTIPLIER = 0.5; // Base shield held in hand gives 50% damage reduction (0.5x damage taken)

// Arcane Sword ('arcane_sword' [8]) Constants
export const ARCANE_SWORD_MANA_COST = 25;
export const ARCANE_SWORD_COOLDOWN_SEC = 60.0; // 60 seconds cooldown
export const ARCANE_SWORD_SWING_COOLDOWN_SEC = 1.0; // Can deal swing damage once every 1.0 second (Lv 1-5)
export const ARCANE_SWORD_LV6_SWING_COOLDOWN_SEC = 0.7; // At Level 6 deals swing damage once every 0.7 seconds
export const ARCANE_SWORD_RANGE = 5.8; // Extended melee slash distance in front of the player

// Cooldown Reset ('cooldown_reset' [G]) Constants
export const COOLDOWN_RESET_MANA_COST = 20;
export const COOLDOWN_RESET_BASE_COOLDOWN_SEC = 70.0; // 70s at Lv1 -> 65s, 60s, 55s, 50s
export const COOLDOWN_RESET_COOLDOWNS_BY_LEVEL: readonly number[] = [70, 65, 60, 55, 50, 50];

// Stage 5 Mobs & Splitting Worm Boss Constants
export const MUD_PUDDLE_DURATION_SEC = 5.0; // Mud puddle lasts 5 seconds on the floor
export const MUD_PUDDLE_RADIUS = 3.8;
export const MUD_PUDDLE_SLOW_PERCENT = 50; // Mud puddle slows player movement by 50%
export const MUD_PUDDLE_SLOW_FACTOR = 0.5;
export const MUD_BALL_SCALE_MULTIPLIER = 5.0; // Mud Monster projectile is 5x larger than standard mob orbs
export const MUD_BALL_SLOW_PERCENT = 30; // Mud ball hit slows player movement by 30%
export const MUD_BALL_SLOW_FACTOR = 0.7;
export const MUD_BALL_SLOW_DURATION_SEC = 3.0;
export const BEAR_FEAR_DURATION_SEC = 1.5; // Bear roar makes player flee backward for 1.5 seconds
export const BEAR_ROAR_RADIUS = 9.0;
export const BEAR_FEAR_RADIUS = 9.0;
export const BEAR_CLEAVE_RADIUS = 5.6;
export const SKELETON_ARROW_SPEED = 18.5; // Single Skeleton Archer arrow flies faster than enemy magic orbs (13.0)
export const SKELETON_VOLLEY_ARROW_SPEED = 11.5; // 5-arrow fan volley flies slower so the player can dodge between/around arrows
export const SKELETON_EARTHQUAKE_LENGTH = 15.0;
export const SKELETON_EARTHQUAKE_WIDTH = 2.4;
export const SKELETON_SHIELD_DAMAGE_MULTIPLIER = 0.15; // Skeleton Shield Guard reduces incoming damage by 85%
export const WORM_BURROW_DURATION_SEC = 2.0; // Worm burrows underground for 2.0 seconds (untargetable + red warning circle)
export const WORM_MELEE_FIGHT_DURATION_SEC = 4.0; // Melee worm fights on surface for 4.0 seconds between 2.0s burrows
export const WORM_MELEE_SURFACE_DURATION_SEC = 4.0;
export const WORM_RANGED_SURFACE_DURATION_SEC = 5.5;
export const WORM_EMERGE_RADIUS = 4.6;
export const WORM_EMERGE_DAMAGE = 22;
export const WORM_EMERGE_STUN_SEC = 1.0; // Worm emergence stuns player for 1.0 second
export const WORM_FIRE_ZONE_DURATION_SEC = 4.0; // Fire worm burning floor zone lasts 4.0 seconds
export const WORM_FIRE_POOL_DURATION_SEC = 4.0;
export const WORM_FIRE_POOL_RADIUS = 4.5;
export const WORM_FIRE_BURN_DURATION_SEC = 2.0; // Ignites player for 2.0 seconds
export const WORM_FIRE_POOL_BURN_SEC = 2.0;
export const WORM_LEECH_TELEGRAPH_SEC = 1.0; // Jumping Leech Worm glows red and leaps for 1.0s showing target landing circle
export const WORM_LEECH_RED_TELEGRAPH_SEC = 1.0;
export const WORM_LEECH_GLOW_DURATION_SEC = 1.0;
export const WORM_LEECH_JUMP_COOLDOWN_SEC = 25.0; // Rare jump attack once every 25 seconds ("редка раз в 25 секунд")
export const WORM_LEECH_LAND_RADIUS = 2.5; // Landing circle radius — player can dodge out of it during the 1s leap!
export const WORM_LEECH_LATCH_DURATION_SEC = 4.0; // Latches onto player for 4.0s dealing damage and healing itself
export const WORM_LEECH_ATTACH_DURATION_SEC = 4.0;
export const WORM_LEECH_BITE_DAMAGE = 9;
export const WORM_LEECH_HEAL_AMOUNT = 28;
export const WORM_LEECH_HEAL_PER_TICK = 28;
export const WORM_SPLIT_HP_RATIO = 0.3; // Worm splits into 2 smaller worms at <= 30% HP
export const WORM_PHASE1_MAX_HP = 1350;
export const WORM_PHASE2_MAX_HP = 720;
export const WORM_PHASE3_MAX_HP = 380;
export const FROST_WIND_COOLDOWN_SEC = 7.0; // Snow Giants cast Ice Wind pull every 7 seconds ("раз в 7 секунд")
export const FROST_WIND_TELEGRAPH_SEC = 1.0; // Blue circle warning visible 1 second before wind starts ("видно за секунду синим кружком")
export const FROST_WIND_DURATION_SEC = 3.0; // Icy wind blows toward the Snow Giant for 3 seconds ("дует в их сторону 3 секунды")
export const FROST_WIND_RADIUS = 4.6; // Blue circle radius on the floor
export const FROST_WIND_PULL_SPEED = 5.2; // Pull speed toward Snow Giant (player can walk out or teleport out)

export const SPELL_LEVEL_6_EFFECTS: Record<SpellId, string> = {
  incendio:
    '🔥 Пробуждение 6 ур.: Взрывается при попадании в радиусе 4.5м и поджигает врагов на 3 сек (периодический урон огнём)!',
  glacius:
    '❄️ Пробуждение 6 ур.: Полностью замораживает (оглушает в глыбе льда) врага на 1 секунду поверх замедления!',
  expelliarmus:
    '⚡ Пробуждение 6 ур.: Цепной разряд — при попадании бьёт дугой молнии по второму врагу рядом и сильнее отбрасывает!',
  stupefy:
    '🧱 Пробуждение 6 ур.: Сокрушительный Кирпич — оглушает и мощно откидывает врага назад!',
  wingardium:
    '🛡️ Пробуждение 6 ур.: Щит поглощает 90% урона, а взрыв брошенных бочек и предметов усилен на +50%!',
  engorgio:
    '🐾 Пробуждение 6 ур.: Усиление длится 16 сек (вместо 10с) и мгновенно даёт магу +15 ОЗ и всплеск маны!',
  vera_verto:
    '💚 Пробуждение 6 ур.: Снимает горение и оглушение + даёт регенерацию (+5 ОЗ/с и +5 МП/с на 4 сек)!',
  arcane_sword:
    '⚔️ Пробуждение 6 ур.: Второй меч в левую руку (вправо — бьёт правая рука, влево — левая рука) и урон чаще (раз в 0.7 сек)!',
  teleport:
    '🌀 Пробуждение 6 ур.: Взрыв при прыжке оглушает врагов на 1 сек и ускоряет бег мага на +25% на 3 сек!',
  campfire_teleport:
    '🔥 Пробуждение 6 ур.: При телепорте к костру мгновенно восстанавливает +35 ОЗ и +35 МП и сокращает КД до 90 сек!',
  cooldown_reset:
    '⏳ Пробуждение 6 ур.: Сокращение перезарядки от рисунка Песочных часов доходит до 100% (полный мгновенный сброс всех перезарядок)!',
};

/**
 * Pets are balanced as supportive ground/air companions:
 * Ground pets (cat, fox, salamander) cannot hit flying enemies in the sky;
 * the player must look up and shoot flying enemies (or use the flying Owl companion).
 */
export const PET_CATALOG: Record<TameableSpeciesId, TameablePetDef> = {
  cat: {
    id: 'cat',
    name: 'Котик Мурзик',
    title: 'Аркановый Котик-Помощник',
    description:
      'Пушистый рыже-золотистый котик с рунным колокольчиком. Бежит справа впереди хозяина, атакует наземных врагов и ускоряет регенерацию маны.',
    roleClue: 'Наземный · +0.6 МП/с реген',
    baseAttack: 4,
    attackInterval: 2.8,
    passiveBonus: '+0.6 ед/с к восстановлению маны (бьет наземных врагов)',
    primaryColor: '#f59e0b',
    accentColor: '#38bdf8',
  },
  fox: {
    id: 'fox',
    name: 'Лис Иней',
    title: 'Полярный Лис-Помощник',
    description:
      'Снежно-белый лис с пушистым хвостом и ледяным кристаллом. Отвлекает наземных врагов морозными укусами.',
    roleClue: 'Наземный · Замедление 20%',
    baseAttack: 4,
    attackInterval: 3.0,
    passiveBonus: 'Замедляет наземных врагов морозными укусами',
    primaryColor: '#e0f2fe',
    accentColor: '#0ea5e9',
  },
  owl: {
    id: 'owl',
    name: 'Совенок Филин',
    title: 'Звездный Совенок',
    description:
      'Мудрый ушастый совенок с золотыми глазами-фонарями. Летит в воздухе и может доставать даже летающих врагов.',
    roleClue: 'Воздушный · Точность жестов +4%',
    baseAttack: 4,
    attackInterval: 3.3,
    passiveBonus: '+4% к точности жестов (достает летающих врагов)',
    primaryColor: '#a855f7',
    accentColor: '#fde047',
  },
  salamander: {
    id: 'salamander',
    name: 'Саламандр Игнис',
    title: 'Огненный Ящер',
    description:
      'Огненный ящер с пылающим гребнем. Поддерживает в бою против наземных целей огненными искрами.',
    roleClue: 'Наземный · Огненная искра',
    baseAttack: 6,
    attackInterval: 3.4,
    passiveBonus: '+8% к урону огненных чар (бьет наземных врагов)',
    primaryColor: '#ef4444',
    accentColor: '#f97316',
  },
};

export const REAGENTS: Record<ReagentId, ReagentDef> = {
  ancient_wood: {
    id: 'ancient_wood',
    name: 'Дрова древнего тиса',
    sourceHint: 'Сбор с вековых деревьев [E] · 3 шт. для костра [C]',
    spellInfusionBonus: 'Создание костра [C], прокачка чар и посохов',
    powerMultiplier: 1.15,
    manaDiscount: 0,
    color: '#d97706',
  },
  mandrake_root: {
    id: 'mandrake_root',
    name: 'Корень мандрагоры',
    sourceHint: 'Сбор светящихся трав [E] · Варка зелий у костра',
    spellInfusionBonus: 'Варка зелий здоровья и маны (10–50 ед.) у костра',
    powerMultiplier: 1.2,
    manaDiscount: 0,
    color: '#22c55e',
  },
  rat_hair: {
    id: 'rat_hair',
    name: 'Волос теневой крысы',
    sourceHint: 'Лут с Крысы Теней',
    spellInfusionBonus: '+25% бонус к усилению питомца и прокачка',
    powerMultiplier: 1.25,
    manaDiscount: 0,
    color: '#a855f7',
  },
  rat_meat: {
    id: 'rat_meat',
    name: 'Тушка теневой крысы',
    sourceHint: 'Охота на Крыс Теней (нужно 2 шт. на 1 блюдо у костра)',
    spellInfusionBonus: 'Жарка у костра: +10..50 Макс. ОЗ и +0.1..0.5 ОЗ/с на 1–5 мин.',
    powerMultiplier: 1.15,
    manaDiscount: 0,
    color: '#fb7185',
  },
  boar_meat: {
    id: 'boar_meat',
    name: 'Мясо дикого кабана',
    sourceHint: 'Охота на Дикого Кабана с 3–4 уровней (нужно 2 шт. на 1 жаркое у костра)',
    spellInfusionBonus: 'Сытное жаркое у костра: +25..80 Макс. ОЗ и +0.3..0.9 ОЗ/с на 1.5–6 мин.',
    powerMultiplier: 1.25,
    manaDiscount: 0,
    color: '#ea580c',
  },
  bear_meat: {
    id: 'bear_meat',
    name: 'Медвежатина пещерного медведя',
    sourceHint: 'Охота на Пещерных Медведей на 5-м уровне (нужно 2 шт. на царское жаркое у костра)',
    spellInfusionBonus: 'Лучшая еда на ОЗ у костра: +45..120 Макс. ОЗ и +0.6..1.6 ОЗ/с на 2–7 мин.!',
    powerMultiplier: 1.38,
    manaDiscount: 0,
    color: '#b45309',
  },
  boar_tusk: {
    id: 'boar_tusk',
    name: 'Клык лютого кабана',
    sourceHint: 'Трофей с Дикого Кабана (с 3-го и 4-го уровней Лабиринта)',
    spellInfusionBonus: 'Редкий ресурс для ковки 4-го и 5-го уровней посоха',
    powerMultiplier: 1.32,
    manaDiscount: 0,
    color: '#fef08a',
  },
  bat_meat: {
    id: 'bat_meat',
    name: 'Сырое мясо летучей мыши',
    sourceHint: 'Охота на летающих тварей · Готовка с Водой глубин 4 ур. (или 2 шт. мыши)',
    spellInfusionBonus: 'Еда на ману у костра (с Водой 4 ур.: +25..80 Макс. МП и +0.3..0.9 МП/с)',
    powerMultiplier: 1.18,
    manaDiscount: 0,
    color: '#818cf8',
  },
  gargoyle_heart: {
    id: 'gargoyle_heart',
    name: 'Каменное сердце горгульи',
    sourceHint: 'Лут с летающей Крылатой Горгульи (ближний бой)',
    spellInfusionBonus: 'Нужно для прокачки чар до 4 ур. (2 снаряда) и посохов',
    powerMultiplier: 1.25,
    manaDiscount: 0,
    color: '#f97316',
  },
  harpy_feather: {
    id: 'harpy_feather',
    name: 'Грозовое перо гарпии',
    sourceHint: 'Лут с летающей Штормовой Гарпии-Стрелка',
    spellInfusionBonus: 'Ценный реагент неба для высших уровней чар и посохов',
    powerMultiplier: 1.3,
    manaDiscount: 0,
    color: '#38bdf8',
  },
  dark_core_shard: {
    id: 'dark_core_shard',
    name: 'Осколок темного ядра',
    sourceHint: 'Лут с Темного Аколита, Тотемов и Боссов',
    spellInfusionBonus: '+25% урон боевых заклинаний',
    powerMultiplier: 1.25,
    manaDiscount: 0,
    color: '#ef4444',
  },
  ice_dragon_scale: {
    id: 'ice_dragon_scale',
    name: 'Чешуя ледяного дракона',
    sourceHint: 'Лут с Ледяного Стража и Боссов Лабиринта',
    spellInfusionBonus: '+35% урон и морозный взрыв при попадании',
    powerMultiplier: 1.35,
    manaDiscount: 0,
    color: '#06b6d4',
  },
  fire_essence: {
    id: 'fire_essence',
    name: 'Огненная эссенция демона',
    sourceHint: 'Лут с Огненного Демона и Босса 4-го уровня',
    spellInfusionBonus: 'Прокачка заклинаний до 6-го уровня и Посох Первородных Стихий',
    powerMultiplier: 1.4,
    manaDiscount: 0,
    color: '#fb923c',
  },
  water_essence: {
    id: 'water_essence',
    name: 'Водная эссенция (Вода для еды)',
    sourceHint: 'Падает с элементов воды на 4-м уровне · Для готовки еды на ману с сырым мясом мыши',
    spellInfusionBonus: 'Еда на ману с сырым мясом летучей мыши, 6-й ур. чар и Посох Стихий',
    powerMultiplier: 1.4,
    manaDiscount: 0,
    color: '#38bdf8',
  },
  earth_essence: {
    id: 'earth_essence',
    name: 'Каменное ядро крушителя',
    sourceHint: 'Лут с Каменного Крушителя и Босса 4-го уровня',
    spellInfusionBonus: 'Прокачка заклинаний до 6-го уровня и Посох Первородных Стихий',
    powerMultiplier: 1.4,
    manaDiscount: 0,
    color: '#a3e635',
  },
};

export const EQUIPMENT_CATALOG: Record<EquipmentId, EquipmentDef> = {
  wand_ollivander: {
    id: 'wand_ollivander',
    name: 'Учебная палочка Олливандера',
    type: 'wand',
    description:
      'Классическая палочка из остролиста с пером феникса для отработки базовых жестов.',
    powerBonus: 1.0,
    gestureForgiveness: 0,
    recipe: {},
    primaryColor: '#78350f',
    gemColor: '#f59e0b',
  },
  wand_ancient_yew: {
    id: 'wand_ancient_yew',
    name: 'Боевая палочка Древнего Тиса',
    type: 'wand',
    description:
      'Усиленная палочка из выдержанного тиса, корней мандрагоры и сердец горгулий. Повышает точность жестов и мощь чар.',
    powerBonus: 1.15,
    gestureForgiveness: 8,
    recipe: {
      ancient_wood: 6,
      mandrake_root: 6,
      rat_hair: 5,
      gargoyle_heart: 2,
    },
    primaryColor: '#92400e',
    gemColor: '#22c55e',
  },
  staff_coven: {
    id: 'staff_coven',
    name: 'Посох Трансфигурации Ковена',
    type: 'staff',
    description:
      'Резной боевой посох с каменными сердцами горгулий, перьями гарпий и темными ядрами. Усиливает чары, питомцев и телекинез.',
    powerBonus: 1.28,
    gestureForgiveness: 12,
    recipe: {
      ancient_wood: 10,
      mandrake_root: 8,
      rat_hair: 8,
      gargoyle_heart: 5,
      harpy_feather: 3,
      dark_core_shard: 4,
    },
    primaryColor: '#4c1d95',
    gemColor: '#c084fc',
  },
  staff_frost_dragon: {
    id: 'staff_frost_dragon',
    name: 'Посох Вечного Мороза Дракона (4 ур.)',
    type: 'staff',
    description:
      'Легендарный архимагический посох 4-го ранга из клыков лютого кабана, чешуи ледяного дракона, грозовых перьев гарпии и осколков ядра. Сокрушает любых врагов.',
    powerBonus: 1.45,
    gestureForgiveness: 16,
    unlocksSpell: 'glacius',
    recipe: {
      ancient_wood: 14,
      mandrake_root: 12,
      gargoyle_heart: 7,
      harpy_feather: 6,
      dark_core_shard: 6,
      ice_dragon_scale: 8,
      boar_tusk: 4,
    },
    primaryColor: '#0c4a6e',
    gemColor: '#38bdf8',
  },
  staff_tri_elemental: {
    id: 'staff_tri_elemental',
    name: 'Посох Первородных Стихий (5 ур. · Огонь · Вода · Земля)',
    type: 'staff',
    description:
      'Верховный реликтовый посох 5-го ранга, выкованный из клыков лютого кабана, Огненной эссенции демона, Водной эссенции глубин и Каменного ядра крушителя. Максимально усиливает все чары 6-го уровня.',
    powerBonus: 1.68,
    gestureForgiveness: 20,
    recipe: {
      ancient_wood: 12,
      dark_core_shard: 6,
      ice_dragon_scale: 6,
      boar_tusk: 5,
      fire_essence: 4,
      water_essence: 4,
      earth_essence: 4,
    },
    primaryColor: '#7c2d12',
    gemColor: '#fde047',
  },
};

export const ARTIFACT_SLOT_LABELS: Record<ArtifactSlot, string> = {
  robe: 'Мантия (Защита + Уклонение + ОЗ)',
  gloves: 'Перчатки (Реген МП + Мана + Урон чар)',
  ring: 'Кольцо (Перезарядка + Дальность телепорта)',
  boots: 'Ботинки (Скорость + Защита)',
};

export const ARTIFACT_CATALOG: Record<ArtifactId, ArtifactDef> = {
  // === 1. МАНТИИ (5 штук: Защита +3%..+15%, Непрохождение урона 3%..15%, Здоровье +30..+140 ОЗ) ===
  robe_1: {
    id: 'robe_1',
    slot: 'robe',
    tier: 1,
    name: 'Мантия Послушника Теней (1 ур.)',
    description: 'Защита +3%, непрохождение урона 3% и +30 к максимальному здоровью.',
    color: '#60a5fa',
    damageReductionPercent: 3,
    evasionPercent: 3,
    bonusMaxHp: 30,
    mpRegenBonus: 0,
    bonusMaxMp: 0,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 0,
    teleportRangeBonus: 0,
    moveSpeedBonusPercent: 0,
    recipe: { ancient_wood: 4, mandrake_root: 4, rat_hair: 2 },
  },
  robe_2: {
    id: 'robe_2',
    slot: 'robe',
    tier: 2,
    name: 'Мантия Стража Лабиринта (2 ур.)',
    description: 'Защита +6%, непрохождение урона 6% и +55 к максимальному здоровью.',
    color: '#38bdf8',
    damageReductionPercent: 6,
    evasionPercent: 6,
    bonusMaxHp: 55,
    mpRegenBonus: 0,
    bonusMaxMp: 0,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 0,
    teleportRangeBonus: 0,
    moveSpeedBonusPercent: 0,
    recipe: { ancient_wood: 6, mandrake_root: 4, rat_hair: 4, gargoyle_heart: 2 },
  },
  robe_3: {
    id: 'robe_3',
    slot: 'robe',
    tier: 3,
    name: 'Мантия Ковена Стихий (3 ур.)',
    description: 'Защита +9%, непрохождение урона 9% и +85 к максимальному здоровью.',
    color: '#a855f7',
    damageReductionPercent: 9,
    evasionPercent: 9,
    bonusMaxHp: 85,
    mpRegenBonus: 0,
    bonusMaxMp: 0,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 0,
    teleportRangeBonus: 0,
    moveSpeedBonusPercent: 0,
    recipe: { mandrake_root: 6, gargoyle_heart: 4, harpy_feather: 4, boar_tusk: 2 },
  },
  robe_4: {
    id: 'robe_4',
    slot: 'robe',
    tier: 4,
    name: 'Мантия Чешуи Дракона (4 ур.)',
    description: 'Защита +12%, непрохождение урона 12% и +110 к максимальному здоровью.',
    color: '#f472b6',
    damageReductionPercent: 12,
    evasionPercent: 12,
    bonusMaxHp: 110,
    mpRegenBonus: 0,
    bonusMaxMp: 0,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 0,
    teleportRangeBonus: 0,
    moveSpeedBonusPercent: 0,
    recipe: { gargoyle_heart: 4, harpy_feather: 4, dark_core_shard: 4, ice_dragon_scale: 4, boar_tusk: 4 },
  },
  robe_5: {
    id: 'robe_5',
    slot: 'robe',
    tier: 5,
    name: 'Архимагическая Мантия Вечности (5 ур.)',
    description: 'Защита +15%, непрохождение урона 15% и +140 к максимальному здоровью.',
    color: '#facc15',
    damageReductionPercent: 15,
    evasionPercent: 15,
    bonusMaxHp: 140,
    mpRegenBonus: 0,
    bonusMaxMp: 0,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 0,
    teleportRangeBonus: 0,
    moveSpeedBonusPercent: 0,
    recipe: { dark_core_shard: 4, ice_dragon_scale: 4, boar_tusk: 4, fire_essence: 2, water_essence: 2, earth_essence: 2 },
  },

  // === 2. ПЕРЧАТКИ (5 штук: Реген маны 0.2..1.0/с, Макс. мана +30..+100, с 3 ур. урон заклинаний +5%, +10%, +15%) ===
  gloves_1: {
    id: 'gloves_1',
    slot: 'gloves',
    tier: 1,
    name: 'Перчатки Искры Эфира (1 ур.)',
    description: 'Регенерация маны +0.2/с и +30 к максимальной мане.',
    color: '#60a5fa',
    damageReductionPercent: 0,
    evasionPercent: 0,
    bonusMaxHp: 0,
    mpRegenBonus: 0.2,
    bonusMaxMp: 30,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 0,
    teleportRangeBonus: 0,
    moveSpeedBonusPercent: 0,
    recipe: { ancient_wood: 2, mandrake_root: 4, rat_hair: 4 },
  },
  gloves_2: {
    id: 'gloves_2',
    slot: 'gloves',
    tier: 2,
    name: 'Перчатки Потока Чародея (2 ур.)',
    description: 'Регенерация маны +0.4/с и +45 к максимальной мане.',
    color: '#38bdf8',
    damageReductionPercent: 0,
    evasionPercent: 0,
    bonusMaxHp: 0,
    mpRegenBonus: 0.4,
    bonusMaxMp: 45,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 0,
    teleportRangeBonus: 0,
    moveSpeedBonusPercent: 0,
    recipe: { mandrake_root: 6, rat_hair: 4, gargoyle_heart: 2, harpy_feather: 2 },
  },
  gloves_3: {
    id: 'gloves_3',
    slot: 'gloves',
    tier: 3,
    name: 'Перчатки Боевого Заклинателя (3 ур.)',
    description: 'Регенерация маны +0.6/с, +65 к максимальной мане и +5% к урону заклинаний.',
    color: '#a855f7',
    damageReductionPercent: 0,
    evasionPercent: 0,
    bonusMaxHp: 0,
    mpRegenBonus: 0.6,
    bonusMaxMp: 65,
    spellDamageBonusPercent: 5,
    cooldownReductionSec: 0,
    teleportRangeBonus: 0,
    moveSpeedBonusPercent: 0,
    recipe: { mandrake_root: 6, harpy_feather: 4, dark_core_shard: 2, boar_tusk: 2 },
  },
  gloves_4: {
    id: 'gloves_4',
    slot: 'gloves',
    tier: 4,
    name: 'Перчатки Драконьего Пламени (4 ур.)',
    description: 'Регенерация маны +0.8/с, +80 к максимальной мане и +10% к урону заклинаний.',
    color: '#f472b6',
    damageReductionPercent: 0,
    evasionPercent: 0,
    bonusMaxHp: 0,
    mpRegenBonus: 0.8,
    bonusMaxMp: 80,
    spellDamageBonusPercent: 10,
    cooldownReductionSec: 0,
    teleportRangeBonus: 0,
    moveSpeedBonusPercent: 0,
    recipe: { harpy_feather: 4, dark_core_shard: 4, ice_dragon_scale: 4, boar_tusk: 4 },
  },
  gloves_5: {
    id: 'gloves_5',
    slot: 'gloves',
    tier: 5,
    name: 'Перчатки Первородного Могущества (5 ур.)',
    description: 'Регенерация маны +1.0/с, +100 к максимальной мане и +15% к урону заклинаний.',
    color: '#facc15',
    damageReductionPercent: 0,
    evasionPercent: 0,
    bonusMaxHp: 0,
    mpRegenBonus: 1.0,
    bonusMaxMp: 100,
    spellDamageBonusPercent: 15,
    cooldownReductionSec: 0,
    teleportRangeBonus: 0,
    moveSpeedBonusPercent: 0,
    recipe: { dark_core_shard: 4, ice_dragon_scale: 4, boar_tusk: 4, fire_essence: 2, water_essence: 2, earth_essence: 2 },
  },

  // === 3. КОЛЬЦА (5 штук: Перезарядка -0.3с..-1.2с и Дальность прыжка телепорта +2м..+5м) ===
  ring_1: {
    id: 'ring_1',
    slot: 'ring',
    tier: 1,
    name: 'Медное Кольцо Отклика (1 ур.)',
    description: 'Уменьшает перезарядку способностей на 0.3 сек. и увеличивает дальность телепорта на +2 м.',
    color: '#60a5fa',
    damageReductionPercent: 0,
    evasionPercent: 0,
    bonusMaxHp: 0,
    mpRegenBonus: 0,
    bonusMaxMp: 0,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 0.3,
    teleportRangeBonus: 2,
    moveSpeedBonusPercent: 0,
    recipe: { ancient_wood: 2, mandrake_root: 2, rat_hair: 4 },
  },
  ring_2: {
    id: 'ring_2',
    slot: 'ring',
    tier: 2,
    name: 'Серебряное Кольцо Ветра (2 ур.)',
    description: 'Уменьшает перезарядку способностей на 0.5 сек. и увеличивает дальность телепорта на +2.75 м.',
    color: '#38bdf8',
    damageReductionPercent: 0,
    evasionPercent: 0,
    bonusMaxHp: 0,
    mpRegenBonus: 0,
    bonusMaxMp: 0,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 0.5,
    teleportRangeBonus: 2.75,
    moveSpeedBonusPercent: 0,
    recipe: { ancient_wood: 4, mandrake_root: 4, gargoyle_heart: 2, harpy_feather: 2 },
  },
  ring_3: {
    id: 'ring_3',
    slot: 'ring',
    tier: 3,
    name: 'Рунное Кольцо Горизонта (3 ур.)',
    description: 'Уменьшает перезарядку способностей на 0.75 сек. и увеличивает дальность телепорта на +3.5 м.',
    color: '#a855f7',
    damageReductionPercent: 0,
    evasionPercent: 0,
    bonusMaxHp: 0,
    mpRegenBonus: 0,
    bonusMaxMp: 0,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 0.75,
    teleportRangeBonus: 3.5,
    moveSpeedBonusPercent: 0,
    recipe: { gargoyle_heart: 4, harpy_feather: 4, dark_core_shard: 2, boar_tusk: 2 },
  },
  ring_4: {
    id: 'ring_4',
    slot: 'ring',
    tier: 4,
    name: 'Кольцо Хроноса и Прыжка (4 ур.)',
    description: 'Уменьшает перезарядку способностей на 1.0 сек. и увеличивает дальность телепорта на +4.25 м.',
    color: '#f472b6',
    damageReductionPercent: 0,
    evasionPercent: 0,
    bonusMaxHp: 0,
    mpRegenBonus: 0,
    bonusMaxMp: 0,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 1.0,
    teleportRangeBonus: 4.25,
    moveSpeedBonusPercent: 0,
    recipe: { harpy_feather: 4, dark_core_shard: 4, ice_dragon_scale: 4, boar_tusk: 4 },
  },
  ring_5: {
    id: 'ring_5',
    slot: 'ring',
    tier: 5,
    name: 'Печать Разрыва Пространства (5 ур.)',
    description: 'Уменьшает перезарядку способностей на 1.2 сек. и увеличивает дальность телепорта на +5 м.',
    color: '#facc15',
    damageReductionPercent: 0,
    evasionPercent: 0,
    bonusMaxHp: 0,
    mpRegenBonus: 0,
    bonusMaxMp: 0,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 1.2,
    teleportRangeBonus: 5,
    moveSpeedBonusPercent: 0,
    recipe: { dark_core_shard: 4, ice_dragon_scale: 4, boar_tusk: 4, fire_essence: 2, water_essence: 2, earth_essence: 2 },
  },

  // === 4. БОТИНКИ (5 штук: Защита +2%..+10% и Скорость передвижения +6%..+22%) ===
  boots_1: {
    id: 'boots_1',
    slot: 'boots',
    tier: 1,
    name: 'Сапоги Путника Подземелий (1 ур.)',
    description: 'Дают +2% защиты и +6% к скорости передвижения.',
    color: '#60a5fa',
    damageReductionPercent: 2,
    evasionPercent: 0,
    bonusMaxHp: 0,
    mpRegenBonus: 0,
    bonusMaxMp: 0,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 0,
    teleportRangeBonus: 0,
    moveSpeedBonusPercent: 6,
    recipe: { ancient_wood: 4, mandrake_root: 2, rat_hair: 4 },
  },
  boots_2: {
    id: 'boots_2',
    slot: 'boots',
    tier: 2,
    name: 'Ботинки Каменной Поступи (2 ур.)',
    description: 'Дают +4% защиты и +10% к скорости передвижения.',
    color: '#38bdf8',
    damageReductionPercent: 4,
    evasionPercent: 0,
    bonusMaxHp: 0,
    mpRegenBonus: 0,
    bonusMaxMp: 0,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 0,
    teleportRangeBonus: 0,
    moveSpeedBonusPercent: 10,
    recipe: { ancient_wood: 4, rat_hair: 4, gargoyle_heart: 2, harpy_feather: 2 },
  },
  boots_3: {
    id: 'boots_3',
    slot: 'boots',
    tier: 3,
    name: 'Сапоги Кабаньего Натиска (3 ур.)',
    description: 'Дают +6% защиты и +14% к скорости передвижения.',
    color: '#a855f7',
    damageReductionPercent: 6,
    evasionPercent: 0,
    bonusMaxHp: 0,
    mpRegenBonus: 0,
    bonusMaxMp: 0,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 0,
    teleportRangeBonus: 0,
    moveSpeedBonusPercent: 14,
    recipe: { gargoyle_heart: 4, harpy_feather: 4, boar_tusk: 4, dark_core_shard: 2 },
  },
  boots_4: {
    id: 'boots_4',
    slot: 'boots',
    tier: 4,
    name: 'Ботфорты Штормового Крыла (4 ур.)',
    description: 'Дают +8% защиты и +18% к скорости передвижения.',
    color: '#f472b6',
    damageReductionPercent: 8,
    evasionPercent: 0,
    bonusMaxHp: 0,
    mpRegenBonus: 0,
    bonusMaxMp: 0,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 0,
    teleportRangeBonus: 0,
    moveSpeedBonusPercent: 18,
    recipe: { gargoyle_heart: 4, harpy_feather: 4, ice_dragon_scale: 4, boar_tusk: 4 },
  },
  boots_5: {
    id: 'boots_5',
    slot: 'boots',
    tier: 5,
    name: 'Поступь Повелителя Стихий (5 ур.)',
    description: 'Дают +10% защиты и +22% к скорости передвижения.',
    color: '#facc15',
    damageReductionPercent: 10,
    evasionPercent: 0,
    bonusMaxHp: 0,
    mpRegenBonus: 0,
    bonusMaxMp: 0,
    spellDamageBonusPercent: 0,
    cooldownReductionSec: 0,
    teleportRangeBonus: 0,
    moveSpeedBonusPercent: 22,
    recipe: { dark_core_shard: 4, ice_dragon_scale: 4, boar_tusk: 4, fire_essence: 2, water_essence: 2, earth_essence: 2 },
  },
};

export function getCombinedArtifactBonuses(
  equipped: Partial<Record<ArtifactSlot, ArtifactId>> = {}
): {
  damageReductionPercent: number;
  evasionPercent: number;
  bonusMaxHp: number;
  mpRegenBonus: number;
  bonusMaxMp: number;
  spellDamageBonusPercent: number;
  cooldownReductionSec: number;
  teleportRangeBonus: number;
  moveSpeedBonusPercent: number;
} {
  let damageReductionPercent = 0;
  let evasionPercent = 0;
  let bonusMaxHp = 0;
  let mpRegenBonus = 0;
  let bonusMaxMp = 0;
  let spellDamageBonusPercent = 0;
  let cooldownReductionSec = 0;
  let teleportRangeBonus = 0;
  let moveSpeedBonusPercent = 0;

  for (const slot of ['robe', 'gloves', 'ring', 'boots'] as ArtifactSlot[]) {
    const id = equipped[slot];
    if (!id) continue;
    const def = ARTIFACT_CATALOG[id];
    if (!def) continue;
    damageReductionPercent += def.damageReductionPercent;
    evasionPercent += def.evasionPercent;
    bonusMaxHp += def.bonusMaxHp;
    mpRegenBonus = Number((mpRegenBonus + def.mpRegenBonus).toFixed(2));
    bonusMaxMp += def.bonusMaxMp;
    spellDamageBonusPercent += def.spellDamageBonusPercent;
    cooldownReductionSec = Number((cooldownReductionSec + def.cooldownReductionSec).toFixed(2));
    teleportRangeBonus = Number((teleportRangeBonus + def.teleportRangeBonus).toFixed(2));
    moveSpeedBonusPercent += def.moveSpeedBonusPercent;
  }

  return {
    damageReductionPercent,
    evasionPercent,
    bonusMaxHp,
    mpRegenBonus,
    bonusMaxMp,
    spellDamageBonusPercent,
    cooldownReductionSec,
    teleportRangeBonus,
    moveSpeedBonusPercent,
  };
}

export function canCraftArtifact(
  artifactId: ArtifactId,
  inventory: Record<ReagentId, number>
): boolean {
  const art = ARTIFACT_CATALOG[artifactId];
  if (!art) return false;
  for (const [rId, qty] of Object.entries(art.recipe)) {
    if ((inventory[rId as ReagentId] || 0) < (qty || 0)) {
      return false;
    }
  }
  return true;
}

export function craftArtifactItem(
  artifactId: ArtifactId,
  inventory: Record<ReagentId, number>,
  ownedArtifacts: ArtifactId[]
): {
  success: boolean;
  updatedInventory: Record<ReagentId, number>;
  updatedOwned: ArtifactId[];
} {
  if (!canCraftArtifact(artifactId, inventory)) {
    return {
      success: false,
      updatedInventory: { ...inventory },
      updatedOwned: [...ownedArtifacts],
    };
  }
  const art = ARTIFACT_CATALOG[artifactId];
  const nextInv = { ...inventory };
  for (const [rId, qty] of Object.entries(art.recipe)) {
    nextInv[rId as ReagentId] = Math.max(0, (nextInv[rId as ReagentId] || 0) - (qty || 0));
  }
  return {
    success: true,
    updatedInventory: nextInv,
    updatedOwned: [...ownedArtifacts, artifactId],
  };
}

/**
 * Returns how many copies of a given wearable artifact the player currently owns (including duplicates).
 */
export function getArtifactOwnedCount(
  artifactId: ArtifactId,
  ownedArtifacts: ArtifactId[]
): number {
  let count = 0;
  for (const id of ownedArtifacts) {
    if (id === artifactId) count++;
  }
  return count;
}

/**
 * Adds a chest-dropped wearable artifact to `ownedArtifacts` (preserving duplicates so a 2nd/3rd identical
 * artifact is recorded as a duplicate and can be salvaged for 50% resources without losing the original!).
 */
export function collectChestArtifact(
  artifactId: ArtifactId,
  ownedArtifacts: ArtifactId[]
): {
  updatedOwned: ArtifactId[];
  isDuplicate: boolean;
  newCount: number;
  duplicateCount: number;
} {
  const prevCount = getArtifactOwnedCount(artifactId, ownedArtifacts);
  const nextOwned = [...ownedArtifacts, artifactId];
  const newCount = prevCount + 1;
  return {
    updatedOwned: nextOwned,
    isDuplicate: prevCount >= 1,
    newCount,
    duplicateCount: Math.max(0, newCount - 1),
  };
}

/**
 * Returns 50% of the artifact's crafting recipe resources when salvaged/disassembled (`Разобрать вещь`).
 */
export function getArtifactSalvageRefund(
  artifactId: ArtifactId
): Partial<Record<ReagentId, number>> {
  const art = ARTIFACT_CATALOG[artifactId];
  if (!art) return {};
  const refund: Partial<Record<ReagentId, number>> = {};
  for (const [rId, qty] of Object.entries(art.recipe)) {
    if (qty && qty > 0) {
      refund[rId as ReagentId] = Math.max(1, Math.floor(qty / 2));
    }
  }
  return refund;
}

export function salvageArtifactItem(
  artifactId: ArtifactId,
  inventory: Record<ReagentId, number>,
  ownedArtifacts: ArtifactId[],
  equippedArtifacts: Partial<Record<ArtifactSlot, ArtifactId>> = {}
): {
  success: boolean;
  refund: Partial<Record<ReagentId, number>>;
  refunded: Partial<Record<ReagentId, number>>;
  updatedInventory: Record<ReagentId, number>;
  updatedOwned: ArtifactId[];
  updatedEquipped: Partial<Record<ArtifactSlot, ArtifactId>>;
  remainingCopies: number;
} {
  const idx = ownedArtifacts.indexOf(artifactId);
  if (idx === -1) {
    return {
      success: false,
      refund: {},
      refunded: {},
      updatedInventory: { ...inventory },
      updatedOwned: [...ownedArtifacts],
      updatedEquipped: { ...equippedArtifacts },
      remainingCopies: 0,
    };
  }

  const nextOwned = [...ownedArtifacts];
  nextOwned.splice(idx, 1);

  const refund = getArtifactSalvageRefund(artifactId);
  const nextInv = { ...inventory };
  for (const [rId, qty] of Object.entries(refund)) {
    if (qty && qty > 0) {
      nextInv[rId as ReagentId] = (nextInv[rId as ReagentId] || 0) + qty;
    }
  }

  const art = ARTIFACT_CATALOG[artifactId];
  const nextEquipped = { ...equippedArtifacts };
  if (art && nextEquipped[art.slot] === artifactId && !nextOwned.includes(artifactId)) {
    delete nextEquipped[art.slot];
  }

  return {
    success: true,
    refund,
    refunded: refund,
    updatedInventory: nextInv,
    updatedOwned: nextOwned,
    updatedEquipped: nextEquipped,
    remainingCopies: getArtifactOwnedCount(artifactId, nextOwned),
  };
}

export const SPELLS: Record<SpellId, SpellDef> = {
  incendio: {
    id: 'incendio',
    name: 'Инсендио',
    shortWord: 'Огонь',
    latinName: 'Incendio',
    roleClue: 'Огненный взрыв · КД 4с→3с · 2 снаряда с 4 ур.',
    description:
      'Выпускает пылающий сгусток огня, взрывающийся при столкновении с врагами, тотемами и боссами. С 4-го уровня выпускает 2 снаряда сразу!',
    voiceTriggers: ['огонь', 'жар', 'пыл', 'пламя', 'инсендио', 'инсендия', 'incendio', 'фаер'],
    gestureId: 'triangle',
    gestureName: 'Треугольник (∆)',
    baseDamage: 30,
    manaCost: UNIFORM_MANA_COST,
    cooldown: SPELL_COOLDOWN_SEC,
    unlockLevel: 1,
    color: '#f97316',
    secondaryColor: '#fde047',
    templatePoints: [
      { x: 0.5, y: 0.12 },
      { x: 0.15, y: 0.85 },
      { x: 0.85, y: 0.85 },
      { x: 0.5, y: 0.12 },
    ],
  },
  wingardium: {
    id: 'wingardium',
    name: 'Вингардиум Левиоса',
    shortWord: 'Левиоса',
    latinName: 'Wingardium Leviosa',
    roleClue: 'Телекинез · Щит и Бросок · 10 МП · КД 4с→3с',
    description:
      'Захватывает физический объект в качестве летающего щита перед вами или швыряет его во врага как снаряд. Стоит всего 10 маны.',
    voiceTriggers: [
      'левиоса',
      'тяни',
      'щит',
      'верх',
      'полет',
      'вингардиум левиоса',
      'вингардиум',
      'wingardium',
      'leviosa',
    ],
    gestureId: 'swish_flick',
    gestureName: 'Взмах (∪→)',
    baseDamage: 30,
    manaCost: WINGARDIUM_MANA_COST,
    cooldown: SPELL_COOLDOWN_SEC,
    unlockLevel: 1,
    color: '#38bdf8',
    secondaryColor: '#e0f2fe',
    templatePoints: [
      { x: 0.15, y: 0.35 },
      { x: 0.25, y: 0.78 },
      { x: 0.55, y: 0.78 },
      { x: 0.68, y: 0.22 },
      { x: 0.88, y: 0.45 },
    ],
  },
  expelliarmus: {
    id: 'expelliarmus',
    name: 'Экспеллиармус',
    shortWord: 'Удар',
    latinName: 'Expelliarmus',
    roleClue: 'Алый луч · Отбрасывание · КД 4с→3с · 2 снаряда с 4 ур.',
    description:
      'Мощный дуэльный луч, выбивающий защиту противника и отбрасывающий цели назад. С 4-го уровня выпускает 2 снаряда!',
    voiceTriggers: [
      'удар',
      'луч',
      'сбей',
      'бой',
      'экспеллиармус',
      'экспелиармус',
      'expelliarmus',
    ],
    gestureId: 'bolt',
    gestureName: 'Молния (⚡)',
    baseDamage: 30,
    manaCost: UNIFORM_MANA_COST,
    cooldown: SPELL_COOLDOWN_SEC,
    unlockLevel: 1,
    color: '#ef4444',
    secondaryColor: '#fca5a5',
    templatePoints: [
      { x: 0.72, y: 0.12 },
      { x: 0.25, y: 0.48 },
      { x: 0.75, y: 0.52 },
      { x: 0.28, y: 0.88 },
    ],
  },
  stupefy: {
    id: 'stupefy',
    name: 'Остолбеней',
    shortWord: 'Стоп',
    latinName: 'Stupefy',
    roleClue: 'Оглушение · Кирпич (▬) · Урон 4..20 (голос 5) · КД 4с→3с',
    description:
      'Концентрированная сфера энергии, парализующая врагов и прерывающая их замах (рисунок горизонтального прямоугольника «Кирпич», базовый урон 4..20 от рисунка, 5 от голоса). С 4-го уровня выпускает 2 снаряда!',
    voiceTriggers: ['стоп', 'сон', 'цепь', 'замри', 'кирпич', 'остолбеней', 'ступефай', 'stupefy'],
    gestureId: 'rect_brick',
    gestureName: 'Кирпич (▬)',
    baseDamage: 20,
    manaCost: UNIFORM_MANA_COST,
    cooldown: SPELL_COOLDOWN_SEC,
    unlockLevel: 1,
    color: '#ec4899',
    secondaryColor: '#fbcfe8',
    templatePoints: [
      { x: 0.12, y: 0.35 },
      { x: 0.88, y: 0.35 },
      { x: 0.88, y: 0.65 },
      { x: 0.12, y: 0.65 },
      { x: 0.12, y: 0.35 },
    ],
  },
  vera_verto: {
    id: 'vera_verto',
    name: 'Лечение (Эпискей)',
    shortWord: 'Лечение',
    latinName: 'Episkey',
    roleClue: 'Лечение 15 / 20 / 20..40 ОЗ · 30 МП · КД 30с',
    description:
      'Целительное заклинание Сердца: восстанавливает от 20 до 40 здоровья при рисовании Сердца палочкой, 20 здоровья по слову «Лечение» или 15 здоровья при быстром нажатии. Стоит 30 маны, перезарядка 30 секунд.',
    voiceTriggers: [
      'лечение',
      'лечи',
      'исцеление',
      'хил',
      'хилл',
      'жизнь',
      'сердце',
      'эпискей',
      'episkey',
      'heal',
    ],
    gestureId: 'heart',
    gestureName: 'Сердце (♥)',
    baseDamage: 40,
    manaCost: SPECIAL_MANA_COST,
    cooldown: SPECIAL_COOLDOWN_SEC,
    unlockLevel: 1,
    color: '#22c55e',
    secondaryColor: '#86efac',
    templatePoints: [
      { x: 0.5, y: 0.28 },
      { x: 0.32, y: 0.12 },
      { x: 0.12, y: 0.26 },
      { x: 0.16, y: 0.54 },
      { x: 0.5, y: 0.88 },
      { x: 0.84, y: 0.54 },
      { x: 0.88, y: 0.26 },
      { x: 0.68, y: 0.12 },
      { x: 0.5, y: 0.28 },
    ],
  },
  engorgio: {
    id: 'engorgio',
    name: 'Энгоргио',
    shortWord: 'Рост',
    latinName: 'Engorgio',
    roleClue: 'Усиление Питомца на 10с · 30 МП · КД 30с',
    description:
      'Увеличивает вашего питомца на 10 секунд: он становится значительно больше и сильнее пропорционально качеству заклинания! Стоит 30 маны, перезарядка 30 секунд.',
    voiceTriggers: [
      'рост',
      'сила',
      'мощь',
      'высь',
      'энгоргио',
      'ингоргио',
      'engorgio',
      'увеличь',
    ],
    gestureId: 'caret',
    gestureName: 'Пик (∧)',
    baseDamage: 30,
    manaCost: SPECIAL_MANA_COST,
    cooldown: SPECIAL_COOLDOWN_SEC,
    unlockLevel: 1,
    color: '#10b981',
    secondaryColor: '#a7f3d0',
    templatePoints: [
      { x: 0.15, y: 0.82 },
      { x: 0.5, y: 0.15 },
      { x: 0.85, y: 0.82 },
    ],
  },
  glacius: {
    id: 'glacius',
    name: 'Глациус (Мороз)',
    shortWord: 'Мороз',
    latinName: 'Glacius',
    roleClue: 'Копье Мороза · Урон 4..26 · Замедление 30% на 2с · КД 4с→3с',
    description:
      'Древнее заклинание ледяного дракона. Наносит 4..26 урона от рисунка и замедляет врагов на 30% на 2 секунды! С 4-го уровня выпускает 2 снаряда.',
    voiceTriggers: ['мороз', 'лед', 'лёд', 'хлад', 'иней', 'глациус', 'гласиус', 'glacius'],
    gestureId: 'diamond',
    gestureName: 'Кристалл (◊)',
    baseDamage: 26,
    manaCost: UNIFORM_MANA_COST,
    cooldown: SPELL_COOLDOWN_SEC,
    unlockLevel: 1,
    color: '#06b6d4',
    secondaryColor: '#cffafe',
    templatePoints: [
      { x: 0.5, y: 0.1 },
      { x: 0.85, y: 0.5 },
      { x: 0.5, y: 0.9 },
      { x: 0.15, y: 0.5 },
      { x: 0.5, y: 0.1 },
    ],
  },
  arcane_sword: {
    id: 'arcane_sword',
    name: 'Магический Меч (Клинок Арканума)',
    shortWord: 'Меч',
    latinName: 'Gladius Arcanus',
    roleClue: 'Магический Меч [8] · Удары ПКМ влево/вправо (раз в 1с, на 6 ур. 2 меча раз в 0.7с) · КД 60с',
    description:
      'Призывает большой Магический Меч для ударов на средней дистанции движением ПКМ вправо или влево. Упрощённый жест в одну линию: верхний клинок и ручка без гарды. Длительность: 3с [Пробел], 10с [Голос], 7–20с [Рисунок]. Урон: 10 [Пробел], 25 [Голос], 20–40 [Рисунок]. На 4 ур. поджигает, на 6 ур. появляется второй меч в левую руку (вправо — бьёт правая рука, влево — левая рука, урон раз в 0.7 сек). Перезарядка 60 сек.',
    voiceTriggers: [
      'меч',
      'мечь',
      'клинок',
      'магический меч',
      'экскалибур',
      'гладиус',
      'sword',
      'gladius',
    ],
    gestureId: 'sword_blade',
    gestureName: 'Клинок без гарды (🗡️)',
    baseDamage: 40,
    manaCost: ARCANE_SWORD_MANA_COST,
    cooldown: ARCANE_SWORD_COOLDOWN_SEC,
    unlockLevel: 1,
    color: '#facc15',
    secondaryColor: '#fef08a',
    templatePoints: [
      { x: 0.44, y: 0.88 },
      { x: 0.44, y: 0.64 },
      { x: 0.41, y: 0.28 },
      { x: 0.5, y: 0.08 },
      { x: 0.59, y: 0.28 },
      { x: 0.56, y: 0.64 },
      { x: 0.56, y: 0.88 },
      { x: 0.44, y: 0.88 },
    ],
  },
  teleport: {
    id: 'teleport',
    name: 'Телепорт',
    shortWord: 'Прыжок',
    latinName: 'Appareo',
    roleClue: 'Скачок на пол + Взрыв · КД 10с (от рисунка быстрее) · [Ё]',
    description:
      'Мгновенно переносит вас в видимую точку на полу (не работает сквозь стены и за пределы зала) и наносит взрывной урон в радиусе 6м! Качество рисунка Круга и прокачка увеличивают урон, дальность и сокращают перезарядку (голос дает 14 урона и среднюю перезарядку).',
    voiceTriggers: ['прыжок', 'телепорт', 'блинк', 'скачок', 'шаг', 'круг', 'teleport', 'blink'],
    gestureId: 'circle',
    gestureName: 'Круг (◯)',
    baseDamage: 30,
    manaCost: UNIFORM_MANA_COST,
    cooldown: TELEPORT_BASE_COOLDOWN_SEC,
    unlockLevel: 1,
    color: '#a855f7',
    secondaryColor: '#e9d5ff',
    templatePoints: [
      { x: 0.5, y: 0.14 },
      { x: 0.82, y: 0.3 },
      { x: 0.86, y: 0.65 },
      { x: 0.5, y: 0.86 },
      { x: 0.14, y: 0.65 },
      { x: 0.18, y: 0.3 },
      { x: 0.5, y: 0.14 },
    ],
  },
  campfire_teleport: {
    id: 'campfire_teleport',
    name: 'Домой',
    shortWord: 'Домой',
    latinName: 'Reditus Domum',
    roleClue: 'Возврат домой к костру · Каст 3с [Пробел] / 2с [Голос] / 2.2–1.5с [Рисунок] · 10 МП · КД 2 мин · [F]',
    description:
      'Заклинание «Домой» переносит вас к вашему костру (одновременно может стоять только 1 костёр). Быстрый каст [Пробел] кастуется 3 сек, голосом [R] (фраза «Домой») — 2 сек, а при рисовании простой Спирали вовнутрь — от 2.2 до 1.5 сек в зависимости от качества рисунка. Стоит 10 маны, перезарядка 2 минуты.',
    voiceTriggers: [
      'домой',
      'дом',
      'возврат',
      'верни',
      'очаг',
      'спираль',
      'лагерь',
    ],
    gestureId: 'spiral_in',
    gestureName: 'Спираль (🌀)',
    baseDamage: 0,
    manaCost: CAMPFIRE_TELEPORT_MANA_COST,
    cooldown: CAMPFIRE_TELEPORT_COOLDOWN_SEC,
    unlockLevel: 1,
    color: '#fb923c',
    secondaryColor: '#fde047',
    templatePoints: [
      { x: 0.24, y: 0.28 },
      { x: 0.56, y: 0.16 },
      { x: 0.84, y: 0.38 },
      { x: 0.80, y: 0.72 },
      { x: 0.46, y: 0.84 },
      { x: 0.18, y: 0.64 },
      { x: 0.30, y: 0.38 },
      { x: 0.62, y: 0.42 },
      { x: 0.64, y: 0.62 },
      { x: 0.46, y: 0.56 },
    ],
  },
  cooldown_reset: {
    id: 'cooldown_reset',
    name: 'Перезарядка способностей',
    shortWord: 'Перезарядка',
    latinName: 'Chronos Reversio',
    roleClue: 'Сокращает перезарядки всех чар · 1 ур.: Голос 30% / Рисунок 20–50% · 6 ур.: до 100% · КД 70–50с · [G]',
    description:
      'Ускоряет течение времени и сокращает перезарядку всех остальных способностей! На 1 уровне: от голоса [R] сокращает на 30%, от рисования Песочных часов [ПКМ] — на 20–50%. С каждым уровнем прокачки бонус растёт на +10% (на 6 уровне доходит до 100% — полный сброс всех перезарядок!). Перезарядка способности: 70 сек на 1 ур., и с каждым уровнем уменьшается до 65, 60, 55 и 50 сек.',
    voiceTriggers: [
      'перезарядка',
      'откат',
      'время',
      'сброс',
      'часы',
      'песочные часы',
      'хронос',
      'обнови',
      'cooldown',
      'reset',
    ],
    gestureId: 'hourglass',
    gestureName: 'Песочные часы (⏳)',
    baseDamage: 0,
    manaCost: COOLDOWN_RESET_MANA_COST,
    cooldown: COOLDOWN_RESET_BASE_COOLDOWN_SEC,
    unlockLevel: 1,
    color: '#2dd4bf',
    secondaryColor: '#99f6e4',
    templatePoints: [
      { x: 0.20, y: 0.14 },
      { x: 0.80, y: 0.14 },
      { x: 0.50, y: 0.50 },
      { x: 0.20, y: 0.86 },
      { x: 0.80, y: 0.86 },
      { x: 0.50, y: 0.50 },
      { x: 0.20, y: 0.14 },
    ],
  },
};

export const INITIAL_QUESTS: QuestDef[] = [
  // === КАТЕГОРИЯ: МАГИЯ И РУНЫ ('magic') ===
  {
    id: 'quest_cast_any_5',
    category: 'magic',
    title: 'Первые Шаги Чародея',
    description: 'Примените любое магическое заклинание 12 раз в бою или на полигоне.',
    eventType: 'cast_any',
    targetCount: 12,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 16,
    rewardStat: '+1 Дрова древнего тиса · +1 Корень мандрагоры',
    rewardReagents: { ancient_wood: 1, mandrake_root: 1 },
  },
  {
    id: 'quest_voice_cast_4',
    category: 'magic',
    title: 'Голос Арканума',
    description: 'Произнесите заклинание голосом [R] или [Пробел] 10 раз.',
    eventType: 'cast_voice',
    targetCount: 10,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 22,
    rewardStat: '+3 Макс. Мана · +1 Корень мандрагоры',
    rewardMaxMp: 3,
    rewardReagents: { mandrake_root: 1 },
  },
  {
    id: 'quest_drawn_cast_5',
    category: 'magic',
    title: 'Искусство Палочки',
    description: 'Нарисуйте рунный жест заклинания палочкой [ПКМ] 10 раз.',
    eventType: 'cast_drawn',
    targetCount: 10,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 24,
    rewardStat: '+1 Дрова тиса · +1 Волос крысы',
    rewardReagents: { ancient_wood: 1, rat_hair: 1 },
  },
  {
    id: 'quest_perfect_draw_3',
    category: 'magic',
    title: 'Каллиграфия Магии (Идеальный Рисунок)',
    description: 'Идеально нарисуйте жест заклинания (точность 85% и выше) 6 раз.',
    eventType: 'cast_perfect_drawn',
    targetCount: 6,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 36,
    rewardStat: '+5 Макс. Мана · +1 Сердце горгульи',
    rewardMaxMp: 5,
    rewardReagents: { gargoyle_heart: 1 },
  },
  {
    id: 'quest_fire_casts_6',
    category: 'magic',
    title: 'Адепт Пламени (Инсендио)',
    description: 'Выпустите огненный снаряд «Огонь» [1] 10 раз.',
    eventType: 'cast_incendio',
    targetCount: 10,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 26,
    rewardStat: '+1 Дрова тиса · +1 Корень мандрагоры',
    rewardReagents: { ancient_wood: 1, mandrake_root: 1 },
  },
  {
    id: 'quest_ice_casts_6',
    category: 'magic',
    title: 'Дыхание Хлада (Глациус)',
    description: 'Выпустите ледяное копье «Лед» [2] 10 раз.',
    eventType: 'cast_glacius',
    targetCount: 10,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 28,
    rewardStat: '+1 Корень мандрагоры · +1 Волос крысы',
    rewardReagents: { mandrake_root: 1, rat_hair: 1 },
  },
  {
    id: 'quest_strike_casts_6',
    category: 'magic',
    title: 'Дуэльный Напор (Экспеллиармус)',
    description: 'Примените пробивной луч «Удар» [3] 10 раз.',
    eventType: 'cast_expelliarmus',
    targetCount: 10,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 28,
    rewardStat: '+1 Волос крысы · +1 Сердце горгульи',
    rewardReagents: { rat_hair: 1, gargoyle_heart: 1 },
  },
  {
    id: 'quest_stupefy_casts_5',
    category: 'magic',
    title: 'Парализующий Взор (Остолбеней)',
    description: 'Примените оглушающее заклинание «Стоп» [4] 8 раз.',
    eventType: 'cast_stupefy',
    targetCount: 8,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 26,
    rewardStat: '+1 Корень мандрагоры · +1 Перо гарпии',
    rewardReagents: { mandrake_root: 1, harpy_feather: 1 },
  },
  {
    id: 'quest_heal_3',
    category: 'magic',
    title: 'Исцеляющее Сердце (Хил)',
    description: 'Восстановите здоровье заклинанием «Хил» [7] 5 раз.',
    eventType: 'cast_heal',
    targetCount: 5,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 30,
    rewardStat: '+8 Макс. Здоровье · +1 Корень мандрагоры',
    rewardMaxHp: 8,
    rewardReagents: { mandrake_root: 1 },
  },
  {
    id: 'quest_perfect_draw_8',
    category: 'magic',
    title: 'Грандмастер Рунной Точности',
    description: 'Идеально нарисуйте заклинание (точность 85%+) 14 раз.',
    eventType: 'cast_perfect_drawn',
    targetCount: 14,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 64,
    rewardStat: '+1 Грозовое перо гарпии · +1 Осколок ядра',
    rewardReagents: { harpy_feather: 1, dark_core_shard: 1 },
  },
  {
    id: 'quest_cast_any_25',
    category: 'magic',
    title: 'Неутомимый Архимаг',
    description: 'Примените любые заклинания 40 раз за время приключения.',
    eventType: 'cast_any',
    targetCount: 40,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 60,
    rewardStat: '+1 Сердце горгульи · +1 Чешуя дракона',
    rewardReagents: { gargoyle_heart: 1, ice_dragon_scale: 1 },
  },

  // === КАТЕГОРИЯ: КОСТЁР, АЛХИМИЯ И ЕДА ('survival') ===
  {
    id: 'quest_campfire_ignite_4',
    category: 'survival',
    title: 'Хранитель Очага (Костёр)',
    description: 'Сложите из 3 дров [C] и подожгите выстрелом «Огонь» [1] 4 костра в походе.',
    eventType: 'light_campfire',
    targetCount: 4,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 34,
    rewardStat: '+2 Дрова древнего тиса · +1 Корень мандрагоры',
    rewardReagents: { ancient_wood: 2, mandrake_root: 1 },
  },
  {
    id: 'quest_cook_rat_food_4',
    category: 'survival',
    title: 'Полевая Кухня Подземелья',
    description: 'Добудьте 8 тушек крыс и приготовьте у горящего костра 4 порции жареной крысы (по 2 крысы на блюдо).',
    eventType: 'cook_rat_food',
    targetCount: 4,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 42,
    rewardStat: '+8 Макс. Здоровье · +2 Дрова тиса',
    rewardMaxHp: 8,
    rewardReagents: { ancient_wood: 2 },
  },
  {
    id: 'quest_cook_rat_master_6',
    category: 'survival',
    title: 'Шеф-Повар Лабиринта (Высшая Прожарка)',
    description: 'Приготовьте у костра 6 сытных блюд из крыс с качеством прорисовки от 75% и выше.',
    eventType: 'cook_high_rat_food',
    targetCount: 6,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 62,
    rewardStat: '+12 Макс. Здоровье · +1 Сердце горгульи · +1 Осколок ядра',
    rewardMaxHp: 12,
    rewardReagents: { gargoyle_heart: 1, dark_core_shard: 1 },
  },
  {
    id: 'quest_brew_potions_6',
    category: 'survival',
    title: 'Алхимик Походного Костра',
    description: 'Сварите у горящего костра 6 зелий здоровья или маны, нарисовав контур сосуда.',
    eventType: 'brew_potion',
    targetCount: 6,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 44,
    rewardStat: '+5 Макс. Мана · +2 Корень мандрагоры',
    rewardMaxMp: 5,
    rewardReagents: { mandrake_root: 2 },
  },
  {
    id: 'quest_brew_master_potions_4',
    category: 'survival',
    title: 'Великий Зельевар (Эталонная Варка)',
    description: 'Сварите у костра 4 мощных зелья с точностью рисунка от 80% и выше (восстановление 42+ ед.).',
    eventType: 'brew_high_potion',
    targetCount: 4,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 58,
    rewardStat: '+8 Макс. Мана · +1 Перо гарпии · +1 Чешуя дракона',
    rewardMaxMp: 8,
    rewardReagents: { harpy_feather: 1, ice_dragon_scale: 1 },
  },

  // === КАТЕГОРИЯ: ИССЛЕДОВАНИЕ И СПУТНИКИ ('exploration') ===
  {
    id: 'quest_telekinesis_4',
    category: 'exploration',
    title: 'Мастер Телекинеза (Вингардиум)',
    description: 'Захватите или метните физические объекты заклинанием «Тяни» [5] 7 раз.',
    eventType: 'cast_wingardium',
    targetCount: 7,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 24,
    rewardStat: '+2 Дрова древнего тиса',
    rewardReagents: { ancient_wood: 2 },
  },
  {
    id: 'quest_engorgio_3',
    category: 'exploration',
    title: 'Пробуждение Зверя (Рост)',
    description: 'Увеличьте своего питомца заклинанием «Рост» [6] 5 раз.',
    eventType: 'cast_engorgio',
    targetCount: 5,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 30,
    rewardStat: '+2 Волос крысы · +1 Сердце горгульи',
    rewardReagents: { rat_hair: 2, gargoyle_heart: 1 },
  },
  {
    id: 'quest_harvest_6',
    category: 'exploration',
    title: 'Дары Древнего Леса и Лабиринта',
    description: 'Соберите 12 ед. дров тиса или корня мандрагоры [клавиша E рядом с деревом/травой].',
    eventType: 'harvest',
    targetCount: 12,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 28,
    rewardStat: '+2 Дрова тиса · +1 Корень мандрагоры',
    rewardReagents: { ancient_wood: 2, mandrake_root: 1 },
  },
  {
    id: 'quest_tame_pet',
    category: 'exploration',
    title: 'Верный Спутник Лабиринта',
    description: 'Найдите и приручите Котика Мурзика или другого питомца в лабиринте [E].',
    eventType: 'tame_pet',
    targetCount: 1,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 32,
    rewardStat: '+2 Волос крысы · +1 Корень мандрагоры',
    rewardReagents: { rat_hair: 2, mandrake_root: 1 },
  },

  // === КАТЕГОРИЯ: БОЙ И ОХОТА ('combat') ===
  {
    id: 'quest_barrel_explosions_6',
    category: 'combat',
    title: 'Пиротехник Телекинеза (Красные Бочки)',
    description: 'Подорвите 6 врагов броском красной взрывной бочки с помощью заклинания «Тяни» [5].',
    eventType: 'barrel_explode_hit',
    targetCount: 6,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 48,
    rewardStat: '+1 Сердце горгульи · +1 Осколок темного ядра',
    rewardReagents: { gargoyle_heart: 1, dark_core_shard: 1 },
  },
  {
    id: 'quest_kill_flying_4',
    category: 'combat',
    title: 'Страж Небес (Летающие Враги)',
    description: 'Сбейте в небе 8 летающих врагов (Крылатых Горгулий или Штормовых Гарпий).',
    eventType: 'kill_flying',
    targetCount: 8,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 44,
    rewardStat: '+1 Сердце горгульи · +1 Перо гарпии',
    rewardReagents: { gargoyle_heart: 1, harpy_feather: 1 },
  },
  {
    id: 'quest_mobs_10',
    category: 'combat',
    title: 'Зачистка Теней Подземелья',
    description: 'Победите 18 враждебных существ в Лабиринте или на Арене.',
    eventType: 'mob_kill',
    targetCount: 18,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 48,
    rewardStat: '+10 Макс. Здоровье · +1 Осколок темного ядра',
    rewardMaxHp: 10,
    rewardReagents: { dark_core_shard: 1 },
  },
  {
    id: 'quest_kill_boss_1',
    category: 'combat',
    title: 'Триумф над Архимагами (Боссы)',
    description: 'Победите 2 Боссов этапов Лабиринта.',
    eventType: 'kill_boss',
    targetCount: 2,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 80,
    rewardStat: '+8 Макс. ОЗ · +8 Макс. МП · +2 Чешуя дракона',
    rewardMaxHp: 8,
    rewardMaxMp: 8,
    rewardReagents: { ice_dragon_scale: 2 },
  },

  // === ВЫСШИЕ ИСПЫТАНИЯ 3–4 УРОВНЕЙ ПОДЗЕМЕЛЬЯ (ТОЛЬКО С 3–4 ЭТАПОВ) ===
  {
    id: 'quest_kill_boars_6',
    category: 'combat',
    title: 'Охота на Лютых Кабанов (3–4 ур.)',
    description: 'Победите 6 стремительных Диких Кабанов, обитающих только на 3-м и 4-м уровнях подземелья.',
    eventType: 'kill_boar',
    targetCount: 6,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 72,
    rewardStat: '+12 Макс. ОЗ · +2 Клык лютого кабана · +2 Мясо кабана',
    rewardMaxHp: 12,
    rewardReagents: { boar_tusk: 2, boar_meat: 2 },
  },
  {
    id: 'quest_kill_elementals_10',
    category: 'combat',
    title: 'Покоритель Стихийных Глубин (4 ур.)',
    description: 'Уничтожьте 10 Первородных Стихийных Монстров (Огненных Демонов, Водяных Монстров или Каменных Крушителей) на 4-м уровне лабиринта.',
    eventType: 'kill_elemental',
    targetCount: 10,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 88,
    rewardStat: '+14 Макс. ОЗ · +1 Огненная · +1 Водная · +1 Каменная эссенция',
    rewardMaxHp: 14,
    rewardReagents: { fire_essence: 1, water_essence: 1, earth_essence: 1 },
  },
  {
    id: 'quest_kill_all_bosses_4',
    category: 'combat',
    title: 'Сокрушитель Четырёх Владык (3–4 ур.)',
    description: 'Победите 4 главных Боссов уровней подземелья, включая Владыку Трёх Стихий в финале 4-го уровня.',
    eventType: 'kill_boss',
    targetCount: 4,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 110,
    rewardStat: '+15 Макс. ОЗ · +15 Макс. МП · +2 Клыка кабана · +1 Водная эссенция',
    rewardMaxHp: 15,
    rewardMaxMp: 15,
    rewardReagents: { boar_tusk: 2, water_essence: 1 },
  },
  {
    id: 'quest_cook_boar_3',
    category: 'survival',
    title: 'Королевское Жаркое из Кабана (3–4 ур.)',
    description: 'Добудьте мясо диких кабанов на 3–4 уровнях и приготовьте у костра 3 порции нового Жаркого из кабана (по 2 мяса кабана).',
    eventType: 'cook_boar_food',
    targetCount: 3,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 76,
    rewardStat: '+14 Макс. Здоровье · +2 Клык лютого кабана',
    rewardMaxHp: 14,
    rewardReagents: { boar_tusk: 2 },
  },
  {
    id: 'quest_cook_bat_water_3',
    category: 'survival',
    title: 'Эликсирный Деликатес Глубин (4 ур.)',
    description: 'Добудьте воду с элементов воды 4-го уровня, соедините с сырым мясом летучей мыши и приготовьте у костра 3 блюда на ману.',
    eventType: 'cook_bat_water_food',
    targetCount: 3,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 84,
    rewardStat: '+16 Макс. Мана · +1 Водная эссенция · +1 Огненная эссенция',
    rewardMaxMp: 16,
    rewardReagents: { water_essence: 1, fire_essence: 1 },
  },
  {
    id: 'quest_spell_lv6_1',
    category: 'magic',
    title: 'Пробуждение Первородных Чар (4 ур.)',
    description: 'Соберите стихийные эссенции 4-го уровня Лабиринта и пробудите любое заклинание до 6-го уровня.',
    eventType: 'upgrade_spell_lv6',
    targetCount: 1,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 90,
    rewardStat: '+12 Макс. Мана · +1 Каменное ядро крушителя',
    rewardMaxMp: 12,
    rewardReagents: { earth_essence: 1 },
  },
  {
    id: 'quest_teleport_casts_12',
    category: 'magic',
    title: 'Владыка Пространственных Врат (3–4 ур.)',
    description: 'Совершите 12 боевых прыжков заклинанием «Телепорт» [Ё] при прохождении глубоких уровней Лабиринта.',
    eventType: 'cast_teleport',
    targetCount: 12,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 68,
    rewardStat: '+10 Макс. Мана · +1 Клык лютого кабана',
    rewardMaxMp: 10,
    rewardReagents: { boar_tusk: 1 },
  },
  {
    id: 'quest_rune_buttons_8',
    category: 'exploration',
    title: 'Хранитель Печатей Лабиринта (3–4 ур.)',
    description: 'Активируйте 8 рунных кнопок сплошных ворот стихийными заклинаниями на 3-м и 4-м уровнях подземелья.',
    eventType: 'activate_rune_button',
    targetCount: 8,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 78,
    rewardStat: '+10 Макс. ОЗ · +10 Макс. МП · +2 Клык лютого кабана',
    rewardMaxHp: 10,
    rewardMaxMp: 10,
    rewardReagents: { boar_tusk: 2 },
  },

  // === СТРОИТЕЛЬСТВО СТЕН, 5-Й УРОВЕНЬ, КАЖДЫЙ БОСС (1–5) И ИДЕАЛЬНОЕ ПРОХОЖДЕНИЕ ===
  {
    id: 'quest_build_wall_3',
    category: 'survival',
    title: 'Полевой Фортификатор (Стены)',
    description: 'Постройте 3 деревянные стены [B] (по 2 дрова на стену) для укрытия от снарядов или создания дома у костра.',
    eventType: 'build_wall',
    targetCount: 3,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 40,
    rewardStat: '+2 Дрова древнего тиса · +1 Корень мандрагоры',
    rewardReagents: { ancient_wood: 2, mandrake_root: 1 },
  },
  {
    id: 'quest_build_wall_10',
    category: 'survival',
    title: 'Зодчий Бастиона (Дом у Костра)',
    description: 'Возведите 10 деревянных стен [B] в походе (3 стены вокруг костра удваивают восстановление ОЗ и МП в 2 раза!).',
    eventType: 'build_wall',
    targetCount: 10,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 85,
    rewardStat: '+12 Макс. ОЗ · +4 Дрова тиса · +1 Сердце горгульи',
    rewardMaxHp: 12,
    rewardReagents: { ancient_wood: 4, gargoyle_heart: 1 },
  },
  {
    id: 'quest_dismantle_wall_3',
    category: 'survival',
    title: 'Мастер Разбора (Сломать по прицелу)',
    description: 'Наведите прицел на построенную деревянную стену и разберите 3 стены клавишей [N], возвращая по +1 дрова.',
    eventType: 'dismantle_wall',
    targetCount: 3,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 36,
    rewardStat: '+2 Дрова древнего тиса',
    rewardReagents: { ancient_wood: 2 },
  },
  {
    id: 'quest_stage5_mobs_12',
    category: 'combat',
    title: 'Покоритель Великих Катакомб (5 ур.)',
    description: 'Победите 12 монстров 5-го уровня подземелья (Грязевых Монстров, Пещерных Медведей, Скелетов-Лучников или Скелетов с Молотом и Щитом).',
    eventType: 'defeat_stage5_mob',
    targetCount: 12,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 120,
    rewardStat: '+16 Макс. ОЗ · +2 Медвежатина · +2 Осколок темного ядра',
    rewardMaxHp: 16,
    rewardReagents: { bear_meat: 2, dark_core_shard: 2 },
  },
  {
    id: 'quest_boss_stage_1',
    category: 'combat',
    title: 'Босс 1-го Уровня: Страж Древней Крипты',
    description: 'Победите главного Босса в конце 1-го уровня подземелья.',
    eventType: 'defeat_boss_1',
    targetCount: 1,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 60,
    rewardStat: '+6 Макс. ОЗ · +1 Сердце горгульи · +2 Дрова тиса',
    rewardMaxHp: 6,
    rewardReagents: { gargoyle_heart: 1, ancient_wood: 2 },
  },
  {
    id: 'quest_boss_stage_2',
    category: 'combat',
    title: 'Босс 2-го Уровня: Ледяной Владыка Цитадели',
    description: 'Победите главного Босса в конце 2-го уровня подземелья.',
    eventType: 'defeat_boss_2',
    targetCount: 1,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 80,
    rewardStat: '+8 Макс. МП · +1 Чешуя ледяного дракона · +1 Перо гарпии',
    rewardMaxMp: 8,
    rewardReagents: { ice_dragon_scale: 1, harpy_feather: 1 },
  },
  {
    id: 'quest_boss_stage_3',
    category: 'combat',
    title: 'Босс 3-го Уровня: Архидемон Залов Рока',
    description: 'Победите главного Босса в конце 3-го уровня подземелья.',
    eventType: 'defeat_boss_3',
    targetCount: 1,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 100,
    rewardStat: '+10 Макс. ОЗ · +1 Осколок темного ядра · +2 Клыка кабана',
    rewardMaxHp: 10,
    rewardReagents: { dark_core_shard: 1, boar_tusk: 2 },
  },
  {
    id: 'quest_boss_stage_4',
    category: 'combat',
    title: 'Босс 4-го Уровня: Владыка Трёх Стихий',
    description: 'Победите главного Босса в конце 4-го уровня подземелья.',
    eventType: 'defeat_boss_4',
    targetCount: 1,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 130,
    rewardStat: '+12 Макс. ОЗ · +12 Макс. МП · +1 Огненная, Водная и Каменная эссенция',
    rewardMaxHp: 12,
    rewardMaxMp: 12,
    rewardReagents: { fire_essence: 1, water_essence: 1, earth_essence: 1 },
  },
  {
    id: 'quest_boss_stage_5',
    category: 'combat',
    title: 'Босс 5-го Уровня: Древний Червь Бездны',
    description: 'Уничтожьте все стадии главного Босса-Червя в конце 5-го уровня подземелья.',
    eventType: 'defeat_boss_5',
    targetCount: 1,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 170,
    rewardStat: '+18 Макс. ОЗ · +18 Макс. МП · +2 Чешуя дракона · +2 Медвежатина',
    rewardMaxHp: 18,
    rewardMaxMp: 18,
    rewardReagents: { ice_dragon_scale: 2, dark_core_shard: 2, bear_meat: 2 },
  },
  {
    id: 'quest_flawless_stage_clear',
    category: 'combat',
    title: 'Идеальное прохождение',
    description: 'Пройдите любой уровень подземелья от начала до портала Босса, не получив ни единицы урона по персонажу.',
    eventType: 'flawless_stage_clear',
    targetCount: 1,
    currentCount: 0,
    completed: false,
    claimed: false,
    rewardXp: 250,
    rewardStat: '+20 Макс. ОЗ · +20 Макс. МП · +3 Чешуя дракона · +2 Осколка ядра',
    rewardMaxHp: 20,
    rewardMaxMp: 20,
    rewardReagents: { ice_dragon_scale: 3, dark_core_shard: 2 },
  },
];

/**
 * Resamples a polyline of 2D points into N equidistant points.
 */
export function resamplePath(points: Point2D[], n = 32): Point2D[] {
  if (points.length === 0) return [];
  if (points.length === 1) {
    return Array.from({ length: n }, () => ({ ...points[0] }));
  }

  let totalLen = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    totalLen += Math.hypot(dx, dy);
  }

  if (totalLen < 1e-5) {
    return Array.from({ length: n }, () => ({ ...points[0] }));
  }

  const step = totalLen / (n - 1);
  const resampled: Point2D[] = [{ ...points[0] }];
  let acc = 0;
  let curr = { ...points[0] };
  let idx = 1;

  while (idx < points.length && resampled.length < n) {
    const next = points[idx];
    const dist = Math.hypot(next.x - curr.x, next.y - curr.y);
    if (acc + dist >= step) {
      const t = (step - acc) / (dist || 1);
      const nx = curr.x + t * (next.x - curr.x);
      const ny = curr.y + t * (next.y - curr.y);
      resampled.push({ x: nx, y: ny });
      curr = { x: nx, y: ny };
      acc = 0;
    } else {
      acc += dist;
      curr = next;
      idx++;
    }
  }

  while (resampled.length < n) {
    resampled.push({ ...points[points.length - 1] });
  }

  return resampled;
}

/**
 * Normalizes a path into unit [0..1] box preserving aspect ratio.
 */
export function normalizePath(points: Point2D[]): {
  normalized: Point2D[];
  span: number;
  pathLength: number;
} {
  if (points.length === 0) return { normalized: [], span: 0, pathLength: 0 };

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let pathLength = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (i > 0) {
      pathLength += Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
    }
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const span = Math.max(width, height);

  if (span < 1e-4) {
    return {
      normalized: points.map(() => ({ x: 0.5, y: 0.5 })),
      span: 0,
      pathLength,
    };
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const normalized = points.map((p) => ({
    x: (p.x - cx) / span + 0.5,
    y: (p.y - cy) / span + 0.5,
  }));

  return { normalized, span, pathLength };
}

/**
 * Evaluates how accurately a drawn gesture matches a target spell's template,
 * factoring in both shape similarity and completion ratio.
 */
export function evaluateGestureAccuracy(
  drawnPoints: Point2D[],
  spellId: SpellId,
  gestureMasteryBonus = 0,
  equipmentForgiveness = 0,
  canvasSize = 0
): { accuracy: number; completionRatio: number; isComplete: boolean } {
  const spell = SPELLS[spellId];
  if (!spell || drawnPoints.length < 3) {
    return { accuracy: 0, completionRatio: 0, isComplete: false };
  }

  const n = 32;
  const candidatePointSets: Point2D[][] = [spell.templatePoints];
  if (spellId === 'arcane_sword') {
    // Allow drawing the guardless blade+handle in 1 line without closing the bottom cap, or starting from the top tip
    candidatePointSets.push(spell.templatePoints.slice(0, -1));
    candidatePointSets.push([
      { x: 0.5, y: 0.08 },
      { x: 0.59, y: 0.28 },
      { x: 0.56, y: 0.64 },
      { x: 0.56, y: 0.88 },
      { x: 0.44, y: 0.88 },
      { x: 0.44, y: 0.64 },
      { x: 0.41, y: 0.28 },
      { x: 0.5, y: 0.08 },
    ]);
  } else if (spellId === 'cooldown_reset') {
    // Allow drawing the Hourglass starting from top-right or bottom-left as well as top-left
    candidatePointSets.push([
      { x: 0.80, y: 0.14 },
      { x: 0.20, y: 0.14 },
      { x: 0.50, y: 0.50 },
      { x: 0.80, y: 0.86 },
      { x: 0.20, y: 0.86 },
      { x: 0.50, y: 0.50 },
      { x: 0.80, y: 0.14 },
    ]);
    candidatePointSets.push([
      { x: 0.20, y: 0.86 },
      { x: 0.80, y: 0.86 },
      { x: 0.50, y: 0.50 },
      { x: 0.20, y: 0.14 },
      { x: 0.80, y: 0.14 },
      { x: 0.50, y: 0.50 },
      { x: 0.20, y: 0.86 },
    ]);
  }

  const { normalized: drawnNormRaw, pathLength: rawLen } = normalizePath(drawnPoints);
  const drawnResampled = resamplePath(drawnNormRaw, n);
  const { pathLength: drawnNormLen } = normalizePath(drawnResampled);
  const rawResampled = canvasSize > 0 ? resamplePath(drawnPoints, n) : null;

  let bestAvgDist = Infinity;
  let bestCompletionRatio = 0.15;

  for (const candidatePts of candidatePointSets) {
    const templateResampled = resamplePath(candidatePts, n);
    const { normalized: templateNorm, pathLength: templateLen } =
      normalizePath(templateResampled);

    const expectedLenFactor = spellId === 'arcane_sword' ? 0.72 : 0.82;
    const expectedNormLen = Math.max(1.15, templateLen * expectedLenFactor);
    const rawSpanFactor = rawLen > 1.5 ? Math.min(1, rawLen / 95) : Math.min(1, rawLen / 0.85);
    const candCompletion = Math.min(
      1,
      Math.max(0.15, Math.min(drawnNormLen / expectedNormLen, rawSpanFactor))
    );

    let distForward = 0;
    let distReverse = 0;
    for (let i = 0; i < n; i++) {
      const xWeight = spellId === 'arcane_sword' ? 0.65 : 1.0;
      const d1 = Math.hypot(
        (drawnResampled[i].x - templateNorm[i].x) * xWeight,
        drawnResampled[i].y - templateNorm[i].y
      );
      const d2 = Math.hypot(
        (drawnResampled[n - 1 - i].x - templateNorm[i].x) * xWeight,
        drawnResampled[n - 1 - i].y - templateNorm[i].y
      );
      distForward += d1;
      distReverse += d2;
    }

    let candAvgDist = Math.min(distForward, distReverse) / n;

    // When canvasSize > 0 (e.g. 240x240 in Gesture Training), also measure direct positional alignment
    // against the guide rendered on the canvas so tracing off-guide or wrong size is penalized realistically.
    if (canvasSize > 0 && rawResampled) {
      let canvasForward = 0;
      let canvasReverse = 0;
      for (let i = 0; i < n; i++) {
        const ux = rawResampled[i].x / canvasSize;
        const uy = rawResampled[i].y / canvasSize;
        const rux = rawResampled[n - 1 - i].x / canvasSize;
        const ruy = rawResampled[n - 1 - i].y / canvasSize;
        canvasForward += Math.hypot(ux - templateResampled[i].x, uy - templateResampled[i].y);
        canvasReverse += Math.hypot(rux - templateResampled[i].x, ruy - templateResampled[i].y);
      }
      const avgCanvasDist = Math.min(canvasForward, canvasReverse) / n;
      candAvgDist = candAvgDist * 0.55 + avgCanvasDist * 0.45;
    }

    if (candAvgDist < bestAvgDist) {
      bestAvgDist = candAvgDist;
      bestCompletionRatio = Math.max(bestCompletionRatio, candCompletion);
    }
  }

  const avgDist = bestAvgDist;
  const completionRatio = bestCompletionRatio;

  const isStrictPractice =
    canvasSize > 0 && gestureMasteryBonus === 0 && equipmentForgiveness === 0;
  const distSlope = isStrictPractice ? 2.75 : 2.15;
  const rawShapeScore = Math.max(0.08, 1 - avgDist * distSlope);

  // Extra forgiveness for simple inward spiral ('campfire_teleport') and sword blade ('arcane_sword') only in live combat
  const spiralBonus =
    !isStrictPractice &&
    (spellId === 'campfire_teleport' || spellId === 'arcane_sword') &&
    drawnPoints.length >= 5
      ? 14
      : 0;

  const combined =
    rawShapeScore * (0.35 + 0.65 * completionRatio) * 100 +
    gestureMasteryBonus +
    equipmentForgiveness +
    spiralBonus;

  const accuracy = Math.round(Math.min(100, Math.max(10, combined)));
  const isComplete = completionRatio >= 0.8 && accuracy >= 75;

  return {
    accuracy,
    completionRatio: Number(completionRatio.toFixed(2)),
    isComplete,
  };
}

/**
 * Calculates the XP reward earned in Gesture Training (`Жесты`) based on drawing accuracy (`0..100%`).
 * More accurate drawings award higher XP (`0 XP` below 45%, scaling from `+2 XP` at 45% up to `+15 XP` at 100%).
 */
export function calculatePracticeGestureXp(accuracy: number): number {
  const clamped = Math.max(0, Math.min(100, Math.round(accuracy)));
  if (clamped < 45) return 0;
  return Math.max(2, Math.round(2 + ((clamped - 45) / 55) * 13));
}

/**
 * Matches a spoken transcript (including short 3-5 letter Russian words: "огонь", "тяни", "удар", "стоп", "хил", "рост", "лед", "меч")
 */
export function matchVoiceSpell(transcript: string): {
  spellId: SpellId | null;
  voiceQuality: number;
  matchedWord: string;
} {
  const clean = transcript
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) {
    return { spellId: null, voiceQuality: 0, matchedWord: '' };
  }

  const words = clean.split(' ');

  for (const spell of Object.values(SPELLS)) {
    for (const trigger of spell.voiceTriggers) {
      const normTrigger = trigger.replace(/ё/g, 'е');
      const matched =
        clean === normTrigger ||
        words.includes(normTrigger) ||
        words.some((w) => w.startsWith(normTrigger)) ||
        (normTrigger.length >= 5 && clean.includes(normTrigger));
      if (matched) {
        return {
          spellId: spell.id,
          voiceQuality: 100,
          matchedWord: spell.shortWord,
        };
      }
    }
  }

  const fuzzyMap: Array<{ pattern: RegExp; id: SpellId; quality: number }> = [
    { pattern: /(?:^|\s)(?:огон|жар|пыл|инсен|incen|огн|фаер)/i, id: 'incendio', quality: 95 },
    { pattern: /(?:^|\s)(?:тян|щит|верх|вингар|левиос|wingar|levio)/i, id: 'wingardium', quality: 95 },
    { pattern: /(?:^|\s)(?:удар|луч|сбей|экспел|expel|обезор)/i, id: 'expelliarmus', quality: 95 },
    { pattern: /(?:^|\s)(?:стоп|сон|цеп|замр|остолб|ступеф|stupe)/i, id: 'stupefy', quality: 95 },
    { pattern: /(?:^|\s)(?:хил|леч|сердц|жизн|эписк|episk|heal)/i, id: 'vera_verto', quality: 95 },
    { pattern: /(?:^|\s)(?:рост|сил|мощ|энгорг|engorg|увелич)/i, id: 'engorgio', quality: 95 },
    { pattern: /(?:^|\s)(?:лед|хлад|ине|мороз|глаци|glaci)/i, id: 'glacius', quality: 95 },
    { pattern: /(?:^|\s)(?:меч|клин|экскал|глади|sword)/i, id: 'arcane_sword', quality: 95 },
    { pattern: /(?:^|\s)(?:прыж|телеп|блинк|скач|шаг|telep|blink)/i, id: 'teleport', quality: 95 },
    { pattern: /(?:^|\s)(?:домо|дом|возвр|верн|очаг|спирал)/i, id: 'campfire_teleport', quality: 95 },
    { pattern: /(?:^|\s)(?:перезар|откат|врем|сброс|час|хрон|обнов|reset|cooldown)/i, id: 'cooldown_reset', quality: 95 },
  ];

  for (const item of fuzzyMap) {
    if (item.pattern.test(clean)) {
      return {
        spellId: item.id,
        voiceQuality: item.quality,
        matchedWord: SPELLS[item.id].shortWord,
      };
    }
  }

  return { spellId: null, voiceQuality: 0, matchedWord: '' };
}

/**
 * Computes the max range in meters for the Teleport spell ('teleport') at a given upgrade level (1..6):
 * Level 1 = 16m, Level 2 = 20m, Level 3 = 24m, Level 4 = 28m, Level 5 = 32m, Level 6 = 36m.
 */
export function getTeleportMaxRange(spellLevel = 1): number {
  const clamped = Math.max(1, Math.min(MAX_SPELL_LEVEL, spellLevel));
  return 16 + (clamped - 1) * 4;
}

/**
 * Computes the cast/channel duration in seconds for the Campfire Teleport spell ('campfire_teleport' [F]):
 * - Quick cast ([Space]): 3.0 seconds
 * - Voice cast ([R]): 2.0 seconds
 * - Drawn cast ([RMB] Inward Spiral): 2.2s (at 10% quality) down to 1.5s (at 100% quality)
 */
export function calculateCampfireTeleportCastDuration(
  modeUsed: CastInputMode,
  gestureAccuracy = 0
): number {
  if (modeUsed === 'drawn' || modeUsed === 'voice_and_drawn') {
    const clampedAcc = Math.min(100, Math.max(10, gestureAccuracy || 10));
    const drawnRatio = (clampedAcc - 10) / 90; // 0.0 -> 1.0
    const span = CAMPFIRE_TELEPORT_DRAWN_MAX_CAST_SEC - CAMPFIRE_TELEPORT_DRAWN_MIN_CAST_SEC; // 0.7s
    return Number((CAMPFIRE_TELEPORT_DRAWN_MAX_CAST_SEC - drawnRatio * span).toFixed(2));
  }
  if (modeUsed === 'voice') {
    return CAMPFIRE_TELEPORT_VOICE_CAST_SEC; // 2.0s
  }
  return CAMPFIRE_TELEPORT_QUICK_CAST_SEC; // 3.0s
}

/**
 * Computes the cooldown in seconds for a spell at a given upgrade level (1..6):
 * - Cooldown Reset ('cooldown_reset' [G]): 70s at Lv1, then 65s, 60s, 55s, 50s
 * - Campfire Teleport ('campfire_teleport'): 120.0s (2 minutes), 90.0s at Level 6
 * - Heal ('vera_verto') & Growth ('engorgio'): always 30.0s (26.0s at Level 6)
 * - Teleport ('teleport'): 10.0s base at Level 1, scaling down by 0.75s per level to 6.25s at Level 6
 *   (and further reduced by drawing quality in calculateSpellCastStats!)
 * - Standard spells: 4.0s at Level 1, scaling down by 0.25s per level to 3.0s at Level 5 and 2.75s at Level 6!
 */
export function getSpellCooldownForLevel(spellId: SpellId, spellLevel = 1): number {
  const clamped = Math.max(1, Math.min(MAX_SPELL_LEVEL, spellLevel));
  if (spellId === 'cooldown_reset') {
    return COOLDOWN_RESET_COOLDOWNS_BY_LEVEL[clamped - 1] ?? 50.0;
  }
  if (spellId === 'campfire_teleport') {
    return clamped >= 6 ? 90.0 : CAMPFIRE_TELEPORT_COOLDOWN_SEC;
  }
  if (spellId === 'arcane_sword') {
    return ARCANE_SWORD_COOLDOWN_SEC;
  }
  if (spellId === 'vera_verto' || spellId === 'engorgio') {
    return clamped >= 6 ? 26.0 : SPECIAL_COOLDOWN_SEC;
  }
  if (spellId === 'teleport') {
    return Number((TELEPORT_BASE_COOLDOWN_SEC - (clamped - 1) * 0.75).toFixed(2));
  }
  return Number((SPELL_COOLDOWN_SEC - (clamped - 1) * 0.25).toFixed(2));
}

export interface CooldownResetStats {
  reductionPercent: number; // % reduction applied to all other spell cooldowns
  voicePercent: number; // Lv1: 30% -> Lv6: 80% (+10% per level)
  drawnMinPercent: number; // Lv1: 20% -> Lv6: 70% (+10% per level)
  drawnMaxPercent: number; // Lv1: 50% -> Lv6: 100% (+10% per level, reaches 100% at Lv6!)
  quickPercent: number; // Lv1: 15% -> Lv6: 50%
  cooldownSec: number; // 70, 65, 60, 55, 50, 50
}

/**
 * Computes Cooldown Reset (`cooldown_reset` [G]) reduction percentage and cooldown for a given level (1..6):
 * - Level 1: Voice = 30%, Drawn = 20%..50%, Cooldown = 70s
 * - Level 2: Voice = 40%, Drawn = 30%..60%, Cooldown = 65s
 * - Level 3: Voice = 50%, Drawn = 40%..70%, Cooldown = 60s
 * - Level 4: Voice = 60%, Drawn = 50%..80%, Cooldown = 55s
 * - Level 5: Voice = 70%, Drawn = 60%..90%, Cooldown = 50s
 * - Level 6: Voice = 80%, Drawn = 70%..100% (reaches 100%!), Cooldown = 50s
 */
export function calculateCooldownResetStats(
  modeUsed: CastInputMode = 'voice',
  gestureAccuracy = 100,
  spellLevel = 1
): CooldownResetStats {
  const clampedLevel = Math.max(1, Math.min(MAX_SPELL_LEVEL, spellLevel));
  const step = clampedLevel - 1; // 0..5
  const voicePercent = 30 + step * 10;
  const drawnMinPercent = 20 + step * 10;
  const drawnMaxPercent = 50 + step * 10;
  const quickPercent = 15 + step * 7;
  const cooldownSec = getSpellCooldownForLevel('cooldown_reset', clampedLevel);

  const clampedAcc = Math.min(100, Math.max(10, gestureAccuracy || 10));
  const drawnRatio = (clampedAcc - 10) / 90;

  let reductionPercent = quickPercent;
  if (modeUsed === 'drawn' || modeUsed === 'voice_and_drawn') {
    reductionPercent = Math.round(drawnMinPercent + drawnRatio * (drawnMaxPercent - drawnMinPercent));
  } else if (modeUsed === 'voice') {
    reductionPercent = voicePercent;
  }

  return {
    reductionPercent: Math.max(0, Math.min(100, reductionPercent)),
    voicePercent,
    drawnMinPercent,
    drawnMaxPercent,
    quickPercent,
    cooldownSec,
  };
}

/**
 * Applies `reductionPercent` (0..100%) to all active spell cooldowns except `cooldown_reset` itself.
 */
export function applyCooldownResetToSpellCooldowns(
  currentCooldowns: Record<SpellId, number>,
  spellLevels: Partial<Record<SpellId, number>>,
  reductionPercent: number
): Record<SpellId, number> {
  const clampedPct = Math.max(0, Math.min(100, reductionPercent));
  const ratio = clampedPct / 100;
  const next = { ...currentCooldowns };
  for (const k of Object.keys(next) as SpellId[]) {
    if (k === 'cooldown_reset') continue;
    const rem = next[k] || 0;
    if (rem <= 0) continue;
    if (clampedPct >= 100) {
      next[k] = 0;
      continue;
    }
    const maxCd = getSpellCooldownForLevel(k, spellLevels[k] || 1);
    const amount = Math.max(maxCd * ratio, rem * ratio);
    next[k] = Math.max(0, Number((rem - amount).toFixed(2)));
  }
  return next;
}

/**
 * Pure test/utility helper for `[X]` hotkey: upgrades all spells in `SPELL_ORDER` by +1 level (up to `MAX_SPELL_LEVEL = 6`).
 * Pressing `[X]` 5 times from Level 1 upgrades all spells to Level 6!
 */
export function upgradeAllSpellsByOneLevel(
  currentLevels: Record<SpellId, number>
): Record<SpellId, number> {
  const next = { ...currentLevels };
  for (const spId of SPELL_ORDER) {
    const cur = next[spId] || 1;
    next[spId] = Math.min(MAX_SPELL_LEVEL, cur + 1);
  }
  return next;
}

export interface ArcaneSwordCastStats {
  durationSec: number; // 3s quick, 10s voice, 7..20s drawn (+1.5s per spell upgrade level above 1)
  rawSlashDamage: number; // 10 quick, 25 voice, 20..40 drawn
  slashDamage: number; // Scaled by spellLevel, staff, and gloves
  damage: number; // Alias for slashDamage
  cooldownSec: number; // 60s base
  swingCooldownSec: number; // 1.0s between damaging swings (0.7s at Level 6)
  range: number; // 5.8m reach
  ignitesOnHit: boolean; // True at Spell Level 4+
  stunsOnHitSec: number; // 0 (stun removed at Level 6)
  stunDurationSec: number; // Alias for stunsOnHitSec
  dualWield: boolean; // True at Spell Level 6 (second sword in left hand)
}

/**
 * Calculates stats for the summoned Arcane Sword (`Магический Меч` [8]):
 * - Duration: 3.0s if quick-cast (`[Пробел]`), 10.0s if voice-cast (`[R]`), 7.0..20.0s if drawn (`[ПКМ]`),
 *   plus +1.5s per spell upgrade level above 1!
 * - Damage: 10 if quick-cast, 25 if voice-cast, 20..40 if drawn, scaled by spell upgrade level!
 * - Cooldown: 60 seconds (`ARCANE_SWORD_COOLDOWN_SEC`).
 * - Swing damage cooldown: once per 1.0 second (`0.7` seconds at Level 6).
 * - Level 4+: Sword hits ignite enemies (`ignitesOnHit = true`).
 * - Level 6: Second sword in left hand (`dualWield = true`), swing cooldown 0.7s, no stun (`stunsOnHitSec = 0`).
 */
export function calculateArcaneSwordStats(
  modeOrParams:
    | CastInputMode
    | {
        modeUsed: CastInputMode;
        gestureAccuracy?: number;
        spellLevel?: number;
        staffId?: EquipmentId;
        equippedArtifacts?: Partial<Record<ArtifactSlot, ArtifactId>>;
      },
  gestureAccuracyArg = 10,
  spellLevelArg = 1,
  staffIdArg: EquipmentId = 'wand_ollivander',
  equippedArtifactsArg?: Partial<Record<ArtifactSlot, ArtifactId>>
): ArcaneSwordCastStats {
  const params =
    typeof modeOrParams === 'string'
      ? {
          modeUsed: modeOrParams,
          gestureAccuracy: gestureAccuracyArg,
          spellLevel: spellLevelArg,
          staffId: staffIdArg,
          equippedArtifacts: equippedArtifactsArg,
        }
      : modeOrParams;

  const clampedLevel = Math.max(1, Math.min(MAX_SPELL_LEVEL, params.spellLevel || 1));
  const clampedAcc = Math.min(100, Math.max(10, params.gestureAccuracy || 10));
  const drawnRatio = (clampedAcc - 10) / 90; // 0.0 -> 1.0

  let baseDurationSec = 3.0;
  let rawSlashDamage = 10;

  if (params.modeUsed === 'drawn' || params.modeUsed === 'voice_and_drawn') {
    baseDurationSec = Number((7.0 + drawnRatio * 13.0).toFixed(2)); // 7.0s .. 20.0s
    rawSlashDamage = Math.round(20 + drawnRatio * 20); // 20 .. 40
  } else if (params.modeUsed === 'voice') {
    baseDurationSec = 10.0;
    rawSlashDamage = 25;
  } else {
    baseDurationSec = 3.0;
    rawSlashDamage = 10;
  }

  const levelDurationBonus = (clampedLevel - 1) * 1.5;
  const durationSec = Number((baseDurationSec + levelDurationBonus).toFixed(2));

  const equip =
    EQUIPMENT_CATALOG[params.staffId || 'wand_ollivander'] || EQUIPMENT_CATALOG.wand_ollivander;
  const artBonuses = getCombinedArtifactBonuses(params.equippedArtifacts);
  const levelDmgMult = 1 + (clampedLevel - 1) * 0.15;
  const equipMult = params.modeUsed === 'quick' ? 1.0 : equip.powerBonus;
  const glovesMult = 1 + artBonuses.spellDamageBonusPercent / 100;
  const slashDamage = Math.round(rawSlashDamage * levelDmgMult * equipMult * glovesMult);
  const cooldownSec = Number(
    Math.max(15.0, ARCANE_SWORD_COOLDOWN_SEC - artBonuses.cooldownReductionSec).toFixed(2)
  );
  const stunsOnHitSec = 0;
  const dualWield = clampedLevel >= 6;
  const swingCooldownSec = dualWield
    ? ARCANE_SWORD_LV6_SWING_COOLDOWN_SEC
    : ARCANE_SWORD_SWING_COOLDOWN_SEC;

  return {
    durationSec,
    rawSlashDamage,
    slashDamage,
    damage: slashDamage,
    cooldownSec,
    swingCooldownSec,
    range: ARCANE_SWORD_RANGE,
    ignitesOnHit: clampedLevel >= 4,
    stunsOnHitSec,
    stunDurationSec: stunsOnHitSec,
    dualWield,
  };
}

/**
 * Enforces the Arcane Sword spell-control rule:
 * - Switching spells or casting by drawing/quick-cast immediately dismisses the Arcane Sword (`dismissSword: true`).
 * - Only Voice (`[R]`) can cast spells while keeping the Arcane Sword active (`keepSword: true`),
 *   for ANY spell EXCEPT `wingardium` (`Левиоса`), which is blocked while holding the sword (`blockCast: true`, `allowCast: false`).
 */
export function evaluateArcaneSwordSpellControl(
  arg1: CastInputMode | boolean,
  arg2: SpellId,
  arg3?: CastInputMode,
  _arg4?: boolean
): {
  keepSword: boolean;
  keepSwordActive: boolean;
  dismissSword: boolean;
  blockCast: boolean;
  allowCast: boolean;
  canCast: boolean;
  reason: string;
} {
  if (typeof arg1 === 'boolean') {
    const hasActiveSword = arg1;
    const spellId = arg2;
    const castMode = arg3 || 'quick';
    if (!hasActiveSword) {
      return {
        keepSword: false,
        keepSwordActive: false,
        dismissSword: false,
        blockCast: false,
        allowCast: true,
        canCast: true,
        reason: '',
      };
    }
    if (castMode === 'voice') {
      if (spellId === 'wingardium') {
        return {
          keepSword: true,
          keepSwordActive: true,
          dismissSword: false,
          blockCast: true,
          allowCast: false,
          canCast: false,
          reason: '⚔️ С Магическим Мечом в руках нельзя использовать Левиосу голосом!',
        };
      }
      return {
        keepSword: true,
        keepSwordActive: true,
        dismissSword: false,
        blockCast: false,
        allowCast: true,
        canCast: true,
        reason: '',
      };
    }
    return {
      keepSword: false,
      keepSwordActive: false,
      dismissSword: true,
      blockCast: false,
      allowCast: true,
      canCast: true,
      reason: '⚔️ Магический Меч исчез (при смене или рисовании заклинания)!',
    };
  }

  const castMode = arg1;
  const spellId = arg2;
  if (castMode === 'voice') {
    if (spellId === 'wingardium') {
      return {
        keepSword: true,
        keepSwordActive: true,
        dismissSword: false,
        blockCast: true,
        allowCast: false,
        canCast: false,
        reason: '⚔️ С Магическим Мечом в руках нельзя использовать Левиосу голосом!',
      };
    }
    return {
      keepSword: true,
      keepSwordActive: true,
      dismissSword: false,
      blockCast: false,
      allowCast: true,
      canCast: true,
      reason: '',
    };
  }
  return {
    keepSword: false,
    keepSwordActive: false,
    dismissSword: true,
    blockCast: false,
    allowCast: true,
    canCast: true,
    reason: '⚔️ Магический Меч исчез (при смене или рисовании заклинания)!',
  };
}

/**
 * Checks whether a spell is a combat projectile spell that fires 2 projectiles at Level 4+.
 */
export function isCombatProjectileSpell(spellId: SpellId): boolean {
  return (
    spellId === 'incendio' ||
    spellId === 'glacius' ||
    spellId === 'expelliarmus' ||
    spellId === 'stupefy'
  );
}

/**
 * Calculates final spell power, healing, pet growth, mana cost, cooldown, and projectileCount
 */
export function calculateSpellCastStats(params: {
  spellId: SpellId;
  gestureAccuracy: number; // 0..100 (0 if not drawn)
  voiceMatched: boolean;
  voiceQuality?: number;
  castMode?: CastInputMode;
  playerLevel: number;
  spellLevel?: number; // 1..6
  staffId: EquipmentId;
  infusedReagent?: ReagentId | null;
  gestureMasteryLevel?: number;
  equippedArtifacts?: Partial<Record<ArtifactSlot, ArtifactId>>;
}): {
  finalDamage: number;
  rawBaseDamage: number;
  healAmount: number;
  manaCost: number;
  cooldownSec: number;
  projectileCount: number;
  castQualityPercent: number;
  animalScaleMultiplier: number;
  petDamageMultiplier: number;
  petDurationSec: number;
  teleportRange: number;
  castDurationSec: number;
  swordDurationSec: number;
  cooldownReductionPercent: number;
  modeUsed: CastInputMode;
} {
  const spell = SPELLS[params.spellId];
  const equip = EQUIPMENT_CATALOG[params.staffId] || EQUIPMENT_CATALOG.wand_ollivander;
  const reagent = params.infusedReagent ? REAGENTS[params.infusedReagent] : null;
  const spellUpgradeLevel = Math.max(1, Math.min(MAX_SPELL_LEVEL, params.spellLevel || 1));
  const spellLevelMult = 1 + (spellUpgradeLevel - 1) * 0.2;
  const artBonuses = getCombinedArtifactBonuses(params.equippedArtifacts);

  const hasDrawn =
    params.castMode === 'drawn' ||
    params.castMode === 'voice_and_drawn' ||
    (!params.castMode && params.gestureAccuracy > 0);
  const hasVoice =
    params.castMode === 'voice' ||
    params.castMode === 'voice_and_drawn' ||
    Boolean(params.voiceMatched);

  let modeUsed: CastInputMode = 'quick';
  let rawBaseDamage = 2;
  let castQualityPercent = 10;
  let healAmount = 0;

  const clampedAcc = Math.min(100, Math.max(10, params.gestureAccuracy || 10));
  const drawnRatio = (clampedAcc - 10) / 90; // 0.0 -> 1.0
  const isStupefy = params.spellId === 'stupefy';
  const isGlacius = params.spellId === 'glacius';

  const drawnDmgMin = isStupefy || isGlacius ? 4 : 6;
  const drawnDmgSpan = isStupefy ? 16 : isGlacius ? 22 : 24;
  // Updated Voice Base Damage: Stupefy (Стоп) = 8, Glacius (Мороз) = 10, Incendio/Expelliarmus/Teleport (Огонь/Удар/Прыжок) = 14
  const voiceBaseDmg = isStupefy ? 8 : isGlacius ? 10 : 14;

  if (hasDrawn && hasVoice) {
    modeUsed = 'voice_and_drawn';
    const drawnDmg = Math.round(drawnDmgMin + drawnRatio * drawnDmgSpan);
    rawBaseDamage = drawnDmg + voiceBaseDmg;
    castQualityPercent = Math.min(100, Math.round(clampedAcc * 0.85 + 15));
    healAmount = Math.max(25, Math.round(20 + drawnRatio * 20));
  } else if (hasDrawn) {
    modeUsed = 'drawn';
    rawBaseDamage = Math.round(drawnDmgMin + drawnRatio * drawnDmgSpan);
    castQualityPercent = clampedAcc;
    healAmount = Math.round(20 + drawnRatio * 20);
  } else if (hasVoice) {
    modeUsed = 'voice';
    rawBaseDamage = voiceBaseDmg;
    castQualityPercent = 55;
    healAmount = 25;
  } else {
    modeUsed = 'quick';
    rawBaseDamage = 2;
    castQualityPercent = 15;
    healAmount = 15;
  }

  if (params.spellId === 'arcane_sword') {
    const swordStats = calculateArcaneSwordStats({
      modeUsed,
      gestureAccuracy: clampedAcc,
      spellLevel: spellUpgradeLevel,
      staffId: params.staffId,
      equippedArtifacts: params.equippedArtifacts,
    });
    return {
      finalDamage: swordStats.slashDamage,
      rawBaseDamage: swordStats.rawSlashDamage,
      healAmount: 0,
      manaCost: spell.manaCost,
      cooldownSec: swordStats.cooldownSec,
      projectileCount: 1,
      castQualityPercent,
      animalScaleMultiplier: 1,
      petDamageMultiplier: 1,
      petDurationSec: 0,
      teleportRange: 0,
      castDurationSec: swordStats.durationSec,
      swordDurationSec: swordStats.durationSec,
      cooldownReductionPercent: 0,
      modeUsed,
    };
  }

  if (params.spellId === 'cooldown_reset') {
    const cdResetStats = calculateCooldownResetStats(modeUsed, clampedAcc, spellUpgradeLevel);
    const cdSec = Number(
      Math.max(10.0, cdResetStats.cooldownSec - artBonuses.cooldownReductionSec).toFixed(2)
    );
    return {
      finalDamage: 0,
      rawBaseDamage: 0,
      healAmount: 0,
      manaCost: spell.manaCost,
      cooldownSec: cdSec,
      projectileCount: 1,
      castQualityPercent,
      animalScaleMultiplier: 1,
      petDamageMultiplier: 1,
      petDurationSec: 0,
      teleportRange: 0,
      castDurationSec: 0,
      swordDurationSec: 0,
      cooldownReductionPercent: cdResetStats.reductionPercent,
      modeUsed,
    };
  }

  const reagentMult = reagent ? reagent.powerMultiplier : 1.0;
  const equipMult = modeUsed === 'quick' ? 1.0 : equip.powerBonus;
  const glovesSpellMult = 1 + artBonuses.spellDamageBonusPercent / 100;
  const finalDamage = Math.max(
    2,
    Math.round(rawBaseDamage * equipMult * reagentMult * spellLevelMult * glovesSpellMult)
  );
  const finalHealAmount = Math.round(healAmount * spellLevelMult * glovesSpellMult);

  const isSpecial = params.spellId === 'vera_verto' || params.spellId === 'engorgio';
  const manaCost = isSpecial ? SPECIAL_MANA_COST : spell.manaCost;
  let cooldownSec = getSpellCooldownForLevel(params.spellId, spellUpgradeLevel);
  if (params.spellId === 'teleport') {
    if (modeUsed === 'voice_and_drawn' || modeUsed === 'drawn') {
      const cdFactor = 1.0 - drawnRatio * 0.36;
      cooldownSec = Number(Math.max(3.5, cooldownSec * cdFactor).toFixed(2));
    } else if (modeUsed === 'voice') {
      cooldownSec = Number(Math.max(4.5, cooldownSec * 0.82).toFixed(2));
    }
  }
  if (artBonuses.cooldownReductionSec > 0) {
    cooldownSec = Number(Math.max(0.8, cooldownSec - artBonuses.cooldownReductionSec).toFixed(2));
  }
  const projectileCount =
    isCombatProjectileSpell(params.spellId) && spellUpgradeLevel >= 4 ? 2 : 1;

  const ratHairBonus = reagent?.id === 'rat_hair' ? 1.15 : 1.0;
  const animalScaleMultiplier = Number(
    ((1.35 + (castQualityPercent / 100) * 0.9) * ratHairBonus * (1 + (spellUpgradeLevel - 1) * 0.08)).toFixed(2)
  );
  const petDamageMultiplier = Number(
    ((1.45 + (castQualityPercent / 100) * 1.15) * ratHairBonus * spellLevelMult).toFixed(2)
  );
  const petDurationSec = spellUpgradeLevel >= 6 ? 16.0 : ENGORGIO_BUFF_DURATION_SEC;
  const teleportRange = Number((getTeleportMaxRange(spellUpgradeLevel) + artBonuses.teleportRangeBonus).toFixed(2));
  const castDurationSec =
    params.spellId === 'campfire_teleport'
      ? calculateCampfireTeleportCastDuration(modeUsed, clampedAcc)
      : 0;

  return {
    finalDamage,
    rawBaseDamage,
    healAmount: params.spellId === 'vera_verto' ? finalHealAmount : 0,
    manaCost,
    cooldownSec,
    projectileCount,
    castQualityPercent,
    animalScaleMultiplier,
    petDamageMultiplier,
    petDurationSec,
    teleportRange,
    castDurationSec,
    swordDurationSec: 0,
    cooldownReductionPercent: 0,
    modeUsed,
  };
}

export interface WallSpec {
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface WallBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const FLOOR_TRAP_DAMAGE = 30;
export const FLOOR_TRAP_SCALE_MULTIPLIER = 1.44; // +20% wider again (1.2 * 1.2 = 1.44)
export const FLOOR_TRAP_TRIGGER_RADIUS = Number((1.65 * FLOOR_TRAP_SCALE_MULTIPLIER).toFixed(2)); // 2.38m

export interface FloorTrapSpec {
  id: string;
  x: number;
  z: number;
  radius: number;
  damage: number;
}

export interface WaterLakeSpec {
  id: string;
  x: number;
  z: number;
  radiusX: number;
  radiusZ: number;
  label: string;
}

/**
 * Returns the shallow water lake (`Неглубокое озеро`) for each Labyrinth stage:
 * - Stage 1: In the center of the map (`x: 0, z: 8`, medium size `11.5 x 7.2`)
 * - Stage 2: Closer to the start of the map (`x: 8, z: 98`, wider size `12.5 x 6.8`)
 * - Stage 3: Closer to the end of the map (`x: -24, z: -106`, largest size `16.0 x 8.0`)
 * - Stage 4: In the Northwest Maze Wing (`x: -44, z: 68`, size `15.0 x 8.4`)
 */
export function getLabyrinthWaterLake(stage: 1 | 2 | 3 | 4 | 5): WaterLakeSpec {
  if (stage === 1) {
    return {
      id: 'lake_stage_1',
      x: 0,
      z: 8,
      radiusX: 11.5,
      radiusZ: 7.2,
      label: 'Центральное Озеро (Уровень 1)',
    };
  }
  if (stage === 2) {
    return {
      id: 'lake_stage_2',
      x: 8,
      z: 98,
      radiusX: 12.5,
      radiusZ: 6.8,
      label: 'Верхнее Озеро у Входа (Уровень 2)',
    };
  }
  if (stage === 3) {
    return {
      id: 'lake_stage_3',
      x: -24,
      z: -106,
      radiusX: 16.0,
      radiusZ: 8.0,
      label: 'Глубинное Озеро у Финала (Уровень 3)',
    };
  }
  if (stage === 4) {
    return {
      id: 'lake_stage_4',
      x: -44,
      z: 68,
      radiusX: 15.0,
      radiusZ: 8.4,
      label: 'Стихийное Озеро Лабиринта (Уровень 4)',
    };
  }
  return {
    id: 'lake_stage_5_north',
    x: -60,
    z: 112,
    radiusX: 10.5,
    radiusZ: 6.0,
    label: 'Северное Озеро Катакомб (Уровень 5)',
  };
}

/**
 * Returns all shallow water lakes for a stage (Stage 5 has 2 water lakes in two distinct places!).
 */
export function getLabyrinthWaterLakes(stage: 1 | 2 | 3 | 4 | 5): WaterLakeSpec[] {
  if (stage === 5) {
    return [
      {
        id: 'lake_stage_5_north',
        x: -60,
        z: 112,
        radiusX: 10.5,
        radiusZ: 6.0,
        label: 'Северное Озеро Катакомб (Уровень 5)',
      },
      {
        id: 'lake_stage_5_south',
        x: -56,
        z: -128,
        radiusX: 10.5,
        radiusZ: 6.0,
        label: 'Южное Озеро Катакомб (Уровень 5)',
      },
    ];
  }
  return [getLabyrinthWaterLake(stage)];
}

/**
 * Returns the explosive floor traps for each Labyrinth stage (+4 more traps per level & +20% wider):
 * - Stage 1: 14 floor traps
 * - Stage 2: 18 floor traps (placed in open maze corridors of Stage 2)
 * - Stage 3: 24 floor traps (placed in open maze corridors of Stage 3)
 * - Stage 4: 28 floor traps (placed in open maze corridors of Stage 4)
 * Each trap explodes when stepped on and deals 30 HP damage!
 */
export function getLabyrinthFloorTraps(stage: 1 | 2 | 3 | 4 | 5): FloorTrapSpec[] {
  const coords: Array<{ x: number; z: number }> =
    stage === 1
      ? [
          // 14 traps on Stage 1 (none in the starting safe hall z > 70, away from secret room walls)
          { x: -16, z: 48 },
          { x: 12, z: 46 },
          { x: 22, z: 12 },
          { x: -28, z: 8 },
          { x: 32, z: -2 },
          { x: -8, z: -24 },
          { x: 6, z: -30 },
          { x: -18, z: -34 },
          { x: 26, z: -34 },
          { x: -32, z: -64 },
          { x: -12, z: -66 },
          { x: 8, z: -72 },
          { x: 22, z: -68 },
          { x: -24, z: -74 },
        ]
      : stage === 2
      ? [
          // 18 traps on Stage 2 (strictly inside open 20m maze corridors, away from walls & spike zones)
          { x: 34, z: 72 },
          { x: 0, z: 70 },
          { x: -32, z: 66 },
          { x: -28, z: 18 },
          { x: 4, z: 20 },
          { x: 46, z: 32 },
          { x: 24, z: 44 },
          { x: 32, z: -2 },
          { x: 0, z: 2 },
          { x: -28, z: -6 },
          { x: -28, z: -28 },
          { x: -24, z: -56 },
          { x: 0, z: -48 },
          { x: 28, z: -28 },
          { x: 48, z: -46 },
          { x: 22, z: -78 },
          { x: -18, z: -78 },
          { x: -36, z: -82 },
        ]
      : stage === 3
      ? [
          // 24 traps on Stage 3 (strictly inside open 24m maze corridors & chambers, majority in back half z < 0)
          { x: 24, z: 82 },
          { x: -8, z: 104 },
          { x: -28, z: 84 },
          { x: 48, z: 84 },
          { x: -28, z: 56 },
          { x: -10, z: 54 },
          { x: 32, z: 54 },
          { x: -12, z: 2 },
          { x: -44, z: 10 },
          { x: 24, z: 26 },
          { x: 24, z: -2 },
          { x: 52, z: -2 },
          { x: 44, z: -22 },
          { x: 8, z: -32 },
          { x: -28, z: -24 },
          { x: -44, z: -36 },
          { x: -38, z: -84 },
          { x: -6, z: -82 },
          { x: 34, z: -64 },
          { x: 36, z: -82 },
          { x: 44, z: -106 },
          { x: 16, z: -106 },
          { x: -48, z: -106 },
          { x: 0, z: -130 },
        ]
      : stage === 4
      ? [
          // 28 traps on Stage 4 True Maze (strictly inside open maze corridors, away from spike zones)
          { x: 8, z: 104 },
          { x: -56, z: 118 },
          { x: 56, z: 118 },
          { x: 48, z: 72 },
          { x: 26, z: 48 },
          { x: -12, z: 48 },
          { x: -52, z: 22 },
          { x: 22, z: 22 },
          { x: 66, z: 18 },
          { x: -52, z: -8 },
          { x: -10, z: -12 },
          { x: 22, z: -18 },
          { x: 66, z: -32 },
          { x: -34, z: -28 },
          { x: 14, z: -32 },
          { x: 32, z: -32 },
          { x: 52, z: -60 },
          { x: 26, z: -64 },
          { x: -28, z: -62 },
          { x: -58, z: -66 },
          { x: 12, z: -83 },
          { x: -36, z: -83 },
          { x: -30, z: -110 },
          { x: -12, z: -112 },
          { x: 24, z: -112 },
          { x: 56, z: -112 },
          { x: -18, z: -146 },
          { x: 18, z: -146 },
        ]
      : [
          // 34 traps on Stage 5 Grand Catacombs (strictly inside open 16m maze passages, majority in back half z < 0)
          { x: 28, z: 192 },
          { x: 28, z: 146 },
          { x: -6, z: 168 },
          { x: -48, z: 146 },
          { x: -52, z: 120 },
          { x: -16, z: 100 },
          { x: 18, z: 126 },
          { x: 58, z: 100 },
          { x: 0, z: 80 },
          { x: -36, z: 54 },
          { x: -40, z: 32 },
          { x: -4, z: 6 },
          { x: 26, z: 34 },
          { x: 60, z: 12 },
          // 20 traps in back half (z < 0)
          { x: 34, z: -14 },
          { x: -4, z: -42 },
          { x: -44, z: -14 },
          { x: -52, z: -42 },
          { x: -26, z: -90 },
          { x: 8, z: -64 },
          { x: 44, z: -90 },
          { x: 60, z: -88 },
          { x: 44, z: -114 },
          { x: 36, z: -142 },
          { x: 0, z: -142 },
          { x: 0, z: -114 },
          { x: -44, z: -114 },
          { x: -64, z: -130 },
          { x: -44, z: -146 },
          { x: 80, z: -130 },
          { x: -36, z: -172 },
          { x: 36, z: -172 },
          { x: -18, z: -186 },
          { x: 18, z: -186 },
        ];

  return coords.map((pt, idx) => ({
    id: `trap_s${stage}_${idx}`,
    x: pt.x,
    z: pt.z,
    radius: FLOOR_TRAP_TRIGGER_RADIUS,
    damage: FLOOR_TRAP_DAMAGE,
  }));
}

export interface LaserBeamTrapSpec {
  id: string;
  x: number;
  z: number;
  span: number;
  axis: 'x' | 'z';
  damage: number;
  respawnSec: number;
}

/**
 * Returns the full-passage Blue Laser Beam traps on Stages 2, 3, and 4:
 * Every laser spans 100% wall-to-wall across its corridor/doorway (`на весь проход до текстур`)!
 * - Stage 1: 0 laser beams
 * - Stage 2: 5 wall-to-wall laser beams across the 20m doorways & corridors
 * - Stage 3: 6 horizontal ('x' axis) wall-to-wall laser beams across the 24m passage openings
 * - Stage 4: 8 wall-to-wall laser beams across the maze corridors & doorways
 */
export function getLabyrinthLaserTraps(stage: 1 | 2 | 3 | 4 | 5): LaserBeamTrapSpec[] {
  if (stage === 1) return [];
  if (stage === 2) {
    const specs2: Array<{ x: number; z: number; span: number; axis: 'x' | 'z' }> = [
      // 1. Row 1 East doorway (z = 84, X in [38..58], exact 20m span)
      { x: 48, z: 84, span: 20, axis: 'x' },
      // 2. Row 2 West-Center doorway (z = 56, X in [-38..-18], exact 20m span)
      { x: -28, z: 56, span: 20, axis: 'x' },
      // 3. Band 3 Central corridor (x = 0, Z in [-17.75..+7.75], exact 25.5m span)
      { x: 0, z: -5, span: 25.5, axis: 'z' },
      // 4. Row 4 West-Center doorway (z = -20, X in [-38..-18], exact 20m span)
      { x: -28, z: -20, span: 20, axis: 'x' },
      // 5. Row 6 Boss Archway (z = -92, X in [-10..+10], exact 20m span)
      { x: 0, z: -92, span: 20, axis: 'x' },
    ];
    return specs2.map((s, idx) => ({
      id: `laser_s2_${idx}`,
      x: s.x,
      z: s.z,
      span: s.span,
      axis: s.axis,
      damage: LASER_TRAP_DAMAGE,
      respawnSec: LASER_TRAP_RESPAWN_SEC,
    }));
  }

  if (stage === 3) {
    // Stage 3: 6 horizontal ('x' axis) wall-to-wall laser beams across the 24m passage openings
    const specs3: Array<{ x: number; z: number; span: number; axis: 'x' | 'z' }> = [
      { x: 24, z: 118, span: 24, axis: 'x' },
      { x: -28, z: 72, span: 24, axis: 'x' },
      { x: 52, z: -8, span: 24, axis: 'x' },
      { x: -38, z: -80, span: 24, axis: 'x' },
      { x: 52, z: -92, span: 24, axis: 'x' },
      { x: 0, z: -120, span: 24, axis: 'x' },
    ];
    return specs3.map((s, idx) => ({
      id: `laser_s3_${idx}`,
      x: s.x,
      z: s.z,
      span: s.span,
      axis: s.axis,
      damage: LASER_TRAP_DAMAGE,
      respawnSec: LASER_TRAP_RESPAWN_SEC,
    }));
  }

  if (stage === 4) {
    // Stage 4: 8 wall-to-wall laser beams guarding key maze doorways & corridors
    const specs4: Array<{ x: number; z: number; span: number; axis: 'x' | 'z' }> = [
      { x: 8, z: 144, span: 28, axis: 'x' },
      { x: 62, z: 92, span: 40, axis: 'x' },
      { x: 12, z: 47, span: 14, axis: 'z' },
      { x: -52, z: 12, span: 56, axis: 'x' },
      { x: 66, z: 8, span: 32, axis: 'x' },
      { x: 0, z: -84, span: 16, axis: 'z' },
      { x: -64, z: -92, span: 36, axis: 'x' },
      { x: 0, z: -132, span: 44, axis: 'x' },
    ];
    return specs4.map((s, idx) => ({
      id: `laser_s4_${idx}`,
      x: s.x,
      z: s.z,
      span: s.span,
      axis: s.axis,
      damage: LASER_TRAP_DAMAGE,
      respawnSec: LASER_TRAP_RESPAWN_SEC,
    }));
  }

  // Stage 5: 14 wall-to-wall laser beams across the narrow 16m doorways & labyrinth passages
  const specs5: Array<{ x: number; z: number; span: number; axis: 'x' | 'z' }> = [
    { x: 52, z: 180, span: 16, axis: 'x' },
    { x: 12, z: 170, span: 16, axis: 'z' },
    { x: -24, z: 145, span: 16, axis: 'z' },
    { x: 0, z: 128, span: 16, axis: 'z' },
    { x: -32, z: 100, span: 16, axis: 'z' },
    { x: 24, z: 90, span: 16, axis: 'x' },
    { x: -16, z: 82, span: 16, axis: 'z' },
    { x: -40, z: 44, span: 16, axis: 'x' },
    { x: 12, z: 34, span: 16, axis: 'z' },
    { x: 16, z: -13, span: 16, axis: 'z' },
    { x: -52, z: -52, span: 16, axis: 'x' },
    { x: -8, z: -64, span: 16, axis: 'z' },
    { x: 20, z: -144, span: 20, axis: 'z' },
    { x: 0, z: -156, span: 16, axis: 'x' },
  ];
  return specs5.map((s, idx) => ({
    id: `laser_s5_${idx}`,
    x: s.x,
    z: s.z,
    span: s.span,
    axis: s.axis,
    damage: LASER_TRAP_DAMAGE,
    respawnSec: LASER_TRAP_RESPAWN_SEC,
  }));
}

// ============================================================================
// SEQUENTIAL WAVE SPIKE TRAPS (`Ловушка Шипы` — Enshrouded-style wave timing)
// ============================================================================

export const SPIKE_TRAP_DAMAGE = 30;
export const SPIKE_LINE_DEPTH = 3.8; // Each line of spikes is 3.8m deep so a 3-5 line zone spans 11.4m-19.0m!
export const SPIKE_STEP_DURATION_SEC = 0.95; // Each line stays popped up for ~0.82s before the next line pops up

export interface SpikeTrapLineSpec {
  lineIndex: number;
  centerZ: number;
  minZ: number;
  maxZ: number;
}

export interface SpikeTrapZoneSpec {
  id: string;
  stage: 2 | 3 | 4 | 5;
  label: string;
  x: number;
  z: number;
  span: number; // Spans 100% wall-to-wall across the corridor
  width: number; // Alias of span
  axis: 'x' | 'z';
  lineCount: 3 | 4 | 5;
  lineDepth: number;
  totalDepth: number;
  damage: number;
  direction: 'south' | 'north';
  lines: SpikeTrapLineSpec[];
}

/**
 * Evaluates the sequential wave state of a single spike line (`lineIndex` out of `totalLines`)
 * at `elapsedTimeSec`:
 * - Line 0 pops up -> retracts -> Line 1 pops up -> retracts -> Line 2 pops up -> retracts...
 * - Followed by a brief pause window so a skilled player who times the wave can run right behind the retracting spikes!
 */
export function evaluateSpikeLineWaveState(
  elapsedTimeSec: number,
  lineIndex: number,
  totalLines: number
): {
  active: boolean; // True when spikes deal 30 damage
  isHazardActive: boolean; // True when spikes deal 30 damage
  isWarning: boolean; // True right before spikes thrust upward
  extension: number; // 0 (retracted in floor) .. 1 (fully extended upward)
} {
  const stepSec = 0.85;
  // Total cycle includes totalLines sequential steps + 0.65 step breather between waves
  const cycleSec = (totalLines + 0.65) * stepSec;
  const t = ((elapsedTimeSec % cycleSec) + cycleSec) % cycleSec;
  const lineStart = lineIndex * stepSec;
  const local = t - lineStart;

  if (local >= -0.25 && local < 0) {
    return { active: false, isHazardActive: false, isWarning: true, extension: 0.08 };
  }

  if (local < 0 || local >= stepSec * 0.92) {
    return { active: false, isHazardActive: false, isWarning: false, extension: 0 };
  }

  const phase = local / (stepSec * 0.92); // 0 .. 1
  if (phase < 0.16) {
    // Fast thrust upward
    const ext = phase / 0.16;
    const isLethal = ext >= 0.82;
    return { active: isLethal, isHazardActive: isLethal, isWarning: !isLethal, extension: ext };
  }
  if (phase < 0.74) {
    // Fully extended lethal state
    return { active: true, isHazardActive: true, isWarning: false, extension: 1 };
  }
  // Retracting into floor
  const ext = Math.max(0, 1 - (phase - 0.74) / 0.26);
  const isLethal = ext >= 0.82;
  return { active: isLethal, isHazardActive: isLethal, isWarning: false, extension: ext };
}

/** Visual base radius of each 3D spike cone (`new THREE.ConeGeometry(0.21, 1.38, 6)`). */
export const SPIKE_VISUAL_BASE_RADIUS = 0.21;
/**
 * Collision hitbox radius for each spike needle — strictly smaller than `SPIKE_VISUAL_BASE_RADIUS` (`0.16m < 0.21m`)
 * so standing visually between spikes or near the sloped outer edge of a spike cone never causes accidental damage.
 */
export const SPIKE_HITBOX_RADIUS = 0.16;

/**
 * Pure helper that checks whether the player at (playerX, playerY, playerZ)
 * is physically touching an extended spike needle in row `lineIndex` of `zone`.
 * Uses `zone.lines[lineIndex].centerZ` directly so `direction === 'south'` and `'north'`
 * match the 3D spike meshes 1:1, with a hitbox slightly smaller than the visual spike model.
 */
export function isPlayerTouchingSpikeLine(
  zone: SpikeTrapZoneSpec,
  lineIndex: number,
  playerX: number,
  playerY: number,
  playerZ: number
): boolean {
  if (playerY > 0.72) return false;
  const line = zone.lines[lineIndex];
  const lineCenterZ =
    line !== undefined
      ? line.centerZ
      : zone.z + (lineIndex - (zone.lineCount - 1) / 2) * zone.lineDepth;

  const spikeHitRadius = SPIKE_HITBOX_RADIUS;
  // Tightly bound the row to the inner spike cores (smaller than visual grate & cone base)
  const halfWidth = zone.width * 0.45 + spikeHitRadius;
  const halfRowDepth = zone.lineDepth * 0.23 + spikeHitRadius;
  if (Math.abs(playerX - zone.x) > halfWidth) return false;
  if (Math.abs(playerZ - lineCenterZ) > halfRowDepth) return false;

  // Check proximity to the inner core of each spike cone in this row
  const cols = Math.max(6, Math.floor(zone.width / 1.65));
  const subRows = 2;
  const spikeHitRadiusSq = spikeHitRadius * spikeHitRadius;

  for (let r = 0; r < subRows; r++) {
    const rz = (r - 0.5) * (zone.lineDepth * 0.46);
    const spikeZ = lineCenterZ + rz;
    const dz = playerZ - spikeZ;
    if (Math.abs(dz) > spikeHitRadius) continue;
    for (let c = 0; c < cols; c++) {
      const cx = -zone.width * 0.45 + (c / Math.max(1, cols - 1)) * (zone.width * 0.9);
      const spikeX = zone.x + cx;
      const dx = playerX - spikeX;
      if (dx * dx + dz * dz <= spikeHitRadiusSq) {
        return true;
      }
    }
  }
  return false;
}

function buildSpikeTrapZone(
  id: string,
  stage: 2 | 3 | 4 | 5,
  label: string,
  x: number,
  z: number,
  width: number,
  lineCount: 3 | 4 | 5,
  direction: 'south' | 'north' = 'south'
): SpikeTrapZoneSpec {
  const lineDepth = SPIKE_LINE_DEPTH;
  const totalDepth = lineCount * lineDepth;
  const lines: SpikeTrapLineSpec[] = [];
  for (let i = 0; i < lineCount; i++) {
    const offsetIndex = i - (lineCount - 1) / 2;
    const centerZ = direction === 'south' ? z - offsetIndex * lineDepth : z + offsetIndex * lineDepth;
    lines.push({
      lineIndex: i,
      centerZ,
      minZ: centerZ - lineDepth * 0.46,
      maxZ: centerZ + lineDepth * 0.46,
    });
  }
  return {
    id,
    stage,
    label,
    x,
    z,
    span: width,
    width,
    axis: 'x',
    lineCount,
    lineDepth,
    totalDepth,
    damage: SPIKE_TRAP_DAMAGE,
    direction,
    lines,
  };
}

/**
 * Returns the Sequential Wave Spike Trap Zones (`Ловушка Шипы`) for each stage:
 * - Stage 1: 0 zones
 * - Stage 2: 2 zones, each with 3 lines of spikes (`[3, 3]`) spanning 100% of the 20m corridor
 * - Stage 3: 3 zones, each with 4 lines of spikes (`[4, 4, 4]`) spanning 100% of the 24m corridor
 * - Stage 4: 3 zones with 3, 4, and 5 lines of spikes (`[3, 4, 5]`) spanning 100% of the maze corridors
 * - Stage 5: 4 zones with 4, 4, 5, and 5 lines of spikes (`[4, 4, 5, 5]`) spanning 100% of the narrow 16m corridors
 */
export function getLabyrinthSpikeTrapZones(stage: 1 | 2 | 3 | 4 | 5): SpikeTrapZoneSpec[] {
  if (stage === 1) return [];
  if (stage === 2) {
    return [
      buildSpikeTrapZone('spike_s2_0', 2, 'Шипы Западного Коридора (3 ряда)', -28, 38, 20, 3, 'south'),
      buildSpikeTrapZone('spike_s2_1', 2, 'Шипы Восточного Коридора (3 ряда)', 28, -49, 20, 3, 'south'),
    ];
  }
  if (stage === 3) {
    return [
      buildSpikeTrapZone('spike_s3_0', 3, 'Северные Шипы (4 ряда)', 24, 102, 24, 4, 'south'),
      buildSpikeTrapZone('spike_s3_1', 3, 'Центральные Шипы (4 ряда)', -12, 22, 24, 4, 'south'),
      buildSpikeTrapZone('spike_s3_2', 3, 'Южные Шипы (4 ряда)', -38, -64, 24, 4, 'south'),
    ];
  }
  if (stage === 4) {
    return [
      buildSpikeTrapZone('spike_s4_0', 4, 'Шипы Входного Лабиринта (3 ряда)', 8, 127, 28, 3, 'south'),
      buildSpikeTrapZone('spike_s4_1', 4, 'Шипы Восточного Прохода (4 ряда)', 66, -12, 32, 4, 'south'),
      buildSpikeTrapZone('spike_s4_2', 4, 'Шипы Глубинного Святилища (5 рядов)', -64, -111, 36, 5, 'south'),
    ];
  }
  return [
    buildSpikeTrapZone('spike_s5_0', 5, 'Шипы Верхнего Узкого Прохода (4 ряда)', 52, 164, 16, 4, 'south'),
    buildSpikeTrapZone('spike_s5_1', 5, 'Шипы Центральной Теснины (4 ряда)', 24, 74, 16, 4, 'south'),
    buildSpikeTrapZone('spike_s5_2', 5, 'Шипы Среднего Лабиринта (4 ряда)', 26, 20, 24, 4, 'south'),
    buildSpikeTrapZone('spike_s5_3', 5, 'Шипы Восточного Каземата (5 рядов)', 60, -20, 16, 5, 'south'),
    buildSpikeTrapZone('spike_s5_4', 5, 'Шипы Глубинных Катакомб (5 рядов)', -52, -68, 16, 5, 'south'),
    buildSpikeTrapZone('spike_s5_5', 5, 'Шипы Преддверия Бездны (5 рядов)', 42, -128, 40, 5, 'south'),
  ];
}

// ============================================================================
// LABYRINTH TREASURE CHESTS (`Сундуки с ресурсами и артефактами`)
// ============================================================================

export interface LabyrinthChestSpec {
  id: string;
  stage: 1 | 2 | 3 | 4 | 5;
  label: string;
  x: number;
  z: number;
  isSecretRoom?: boolean;
  isSecretRoomChest?: boolean;
  reagentRewards: Partial<Record<ReagentId, number>>;
  artifactPool: ArtifactId[];
}

/**
 * Returns the Treasure Chests (`Сундуки`) on each stage:
 * - Stage 1: 3 chests (inside the 3 Secret Rooms; ONLY 2 chests drop a Tier-1 Artifact, and the 3rd chest drops resources only!)
 * - Stage 2: 4 chests (Tier-2 Artifacts only, fewer artifacts & fewer resources)
 * - Stage 3: 5 chests (Tier-3 and Tier-4 Artifacts only, fewer resources)
 * - Stage 4: 6 chests (Tier-3, Tier-4, and Tier-5 Artifacts as luck rolls, fewer resources)
 */
export function getLabyrinthChests(stage: 1 | 2 | 3 | 4 | 5): LabyrinthChestSpec[] {
  if (stage === 1) {
    return [
      {
        id: 'chest_s1_0',
        stage: 1,
        label: 'Тайный Сундук Огня (Секретная комната 1)',
        x: -45,
        z: 58,
        isSecretRoom: true,
        isSecretRoomChest: true,
        reagentRewards: { ancient_wood: 1, mandrake_root: 1 },
        artifactPool: ['robe_1', 'gloves_1', 'ring_1', 'boots_1'],
      },
      {
        id: 'chest_s1_1',
        stage: 1,
        label: 'Тайный Сундук Льда (Секретная комната 2)',
        x: 45,
        z: 18,
        isSecretRoom: true,
        isSecretRoomChest: true,
        reagentRewards: { ancient_wood: 1, rat_hair: 1 },
        artifactPool: ['robe_1', 'gloves_1', 'ring_1', 'boots_1'],
      },
      {
        id: 'chest_s1_2',
        stage: 1,
        label: 'Тайный Сундук Молнии (Секретная комната 3 — Припасы)',
        x: -45,
        z: -22,
        isSecretRoom: true,
        isSecretRoomChest: true,
        reagentRewards: { ancient_wood: 2, mandrake_root: 1, rat_hair: 1 },
        artifactPool: [], // 3rd chest on Stage 1 contains ONLY resources!
      },
    ];
  }

  if (stage === 2) {
    // Stage 2: 4 chests total, artifacts are strictly Tier 2 ('robe_2', 'gloves_2', 'ring_2', 'boots_2'), fewer artifacts & resources
    return [
      {
        id: 'chest_s2_0',
        stage: 2,
        label: 'Сундук Северо-Западного Тупика',
        x: -44,
        z: 74,
        reagentRewards: { ancient_wood: 1, gargoyle_heart: 1 },
        artifactPool: ['robe_2', 'gloves_2', 'ring_2', 'boots_2'],
      },
      {
        id: 'chest_s2_1',
        stage: 2,
        label: 'Сундук Восточного Ответвления (Ресурсы)',
        x: 8,
        z: 46,
        reagentRewards: { mandrake_root: 2, rat_hair: 1, gargoyle_heart: 1 },
        artifactPool: [],
      },
      {
        id: 'chest_s2_2',
        stage: 2,
        label: 'Сундук За Руническими Вратами',
        x: 46,
        z: -6,
        reagentRewards: { harpy_feather: 1, dark_core_shard: 1 },
        artifactPool: ['robe_2', 'gloves_2', 'ring_2', 'boots_2'],
      },
      {
        id: 'chest_s2_3',
        stage: 2,
        label: 'Сундук Преддверия Стража II (Ресурсы)',
        x: 48,
        z: -80,
        reagentRewards: { ancient_wood: 2, gargoyle_heart: 1, harpy_feather: 1 },
        artifactPool: [],
      },
    ];
  }

  if (stage === 3) {
    // Stage 3: 5 chests total, artifacts are strictly Tier 3 and Tier 4, fewer resources
    return [
      {
        id: 'chest_s3_0',
        stage: 3,
        label: 'Сундук Северо-Восточной Ниши',
        x: 52,
        z: 106,
        reagentRewards: { ancient_wood: 2, gargoyle_heart: 1 },
        artifactPool: ['robe_3', 'gloves_3', 'ring_3', 'boots_3', 'robe_4', 'gloves_4', 'ring_4', 'boots_4'],
      },
      {
        id: 'chest_s3_1',
        stage: 3,
        label: 'Сундук Северо-Западного Зала (Ресурсы)',
        x: -50,
        z: 108,
        reagentRewards: { mandrake_root: 2, harpy_feather: 1, boar_tusk: 1 },
        artifactPool: [],
      },
      {
        id: 'chest_s3_2',
        stage: 3,
        label: 'Сундук Рунической Камеры',
        x: 48,
        z: 58,
        reagentRewards: { dark_core_shard: 1, boar_tusk: 1 },
        artifactPool: ['robe_3', 'gloves_3', 'ring_3', 'boots_3', 'robe_4', 'gloves_4', 'ring_4', 'boots_4'],
      },
      {
        id: 'chest_s3_3',
        stage: 3,
        label: 'Сундук Западного Бастиона (Ресурсы)',
        x: -50,
        z: 26,
        reagentRewards: { ancient_wood: 2, dark_core_shard: 1, ice_dragon_scale: 1 },
        artifactPool: [],
      },
      {
        id: 'chest_s3_4',
        stage: 3,
        label: 'Сундук Южного Каземата',
        x: -4,
        z: -60,
        reagentRewards: { ice_dragon_scale: 1, boar_tusk: 1 },
        artifactPool: ['robe_3', 'gloves_3', 'ring_3', 'boots_3', 'robe_4', 'gloves_4', 'ring_4', 'boots_4'],
      },
    ];
  }

  // Stage 4 & Stage 5: 6 chests total, artifacts roll from Tier 3, Tier 4, and Tier 5 ("3,4,5 как повезёт"), fewer resources
  const stage4Pool: ArtifactId[] = [
    'robe_3',
    'gloves_3',
    'ring_3',
    'boots_3',
    'robe_4',
    'gloves_4',
    'ring_4',
    'boots_4',
    'robe_5',
    'gloves_5',
    'ring_5',
    'boots_5',
  ];

  if (stage === 4) {
    return [
      {
        id: 'chest_s4_0',
        stage: 4,
        label: 'Сундук Северо-Западного Свода',
        x: -64,
        z: 132,
        reagentRewards: { ancient_wood: 2, boar_tusk: 1 },
        artifactPool: stage4Pool,
      },
      {
        id: 'chest_s4_1',
        stage: 4,
        label: 'Сундук Северо-Восточного Свода (Ресурсы)',
        x: 64,
        z: 132,
        reagentRewards: { mandrake_root: 2, ice_dragon_scale: 1, water_essence: 1 },
        artifactPool: [],
      },
      {
        id: 'chest_s4_2',
        stage: 4,
        label: 'Сундук Озёрного Крыла Стихий',
        x: -68,
        z: 54,
        reagentRewards: { dark_core_shard: 1, fire_essence: 1 },
        artifactPool: stage4Pool,
      },
      {
        id: 'chest_s4_3',
        stage: 4,
        label: 'Сундук Центральной Сокровищницы (Ресурсы)',
        x: 24,
        z: 22,
        reagentRewards: { boar_tusk: 1, water_essence: 1, earth_essence: 1 },
        artifactPool: [],
      },
      {
        id: 'chest_s4_4',
        stage: 4,
        label: 'Сундук Юго-Западного Лабиринта',
        x: -66,
        z: -32,
        reagentRewards: { ice_dragon_scale: 1, earth_essence: 1 },
        artifactPool: stage4Pool,
      },
      {
        id: 'chest_s4_5',
        stage: 4,
        label: 'Королевский Сундук Святилища Стихий',
        x: 64,
        z: -116,
        reagentRewards: { fire_essence: 1, water_essence: 1, earth_essence: 1 },
        artifactPool: stage4Pool,
      },
    ];
  }

  // Stage 5: 6 chests (5 inside the 5 Secret Rooms + 1 in the Deep Sanctum)
  return [
    {
      id: 'chest_s5_0',
      stage: 5,
      label: 'Сундук Потайной Комнаты I (Огонь)',
      x: -85,
      z: 168,
      isSecretRoom: true,
      isSecretRoomChest: true,
      reagentRewards: { fire_essence: 1, ancient_wood: 2 },
      artifactPool: stage4Pool,
    },
    {
      id: 'chest_s5_1',
      stage: 5,
      label: 'Сундук Потайной Комнаты II (Лёд)',
      x: 85,
      z: 124,
      isSecretRoom: true,
      isSecretRoomChest: true,
      reagentRewards: { water_essence: 1, ice_dragon_scale: 1 },
      artifactPool: stage4Pool,
    },
    {
      id: 'chest_s5_2',
      stage: 5,
      label: 'Сундук Потайной Комнаты III (Молния — Ресурсы)',
      x: -85,
      z: 78,
      isSecretRoom: true,
      isSecretRoomChest: true,
      reagentRewards: { dark_core_shard: 2, boar_tusk: 1 },
      artifactPool: [],
    },
    {
      id: 'chest_s5_3',
      stage: 5,
      label: 'Сундук Потайной Комнаты IV (Камень)',
      x: -85,
      z: -16,
      isSecretRoom: true,
      isSecretRoomChest: true,
      reagentRewards: { earth_essence: 1, mandrake_root: 2 },
      artifactPool: stage4Pool,
    },
    {
      id: 'chest_s5_4',
      stage: 5,
      label: 'Сундук Потайной Комнаты V (Арканум)',
      x: 85,
      z: -64,
      isSecretRoom: true,
      isSecretRoomChest: true,
      reagentRewards: { fire_essence: 1, water_essence: 1, earth_essence: 1 },
      artifactPool: stage4Pool,
    },
    {
      id: 'chest_s5_5',
      stage: 5,
      label: 'Сундук Глубинных Катакомб (Ресурсы)',
      x: 78,
      z: -140,
      reagentRewards: { ice_dragon_scale: 1, dark_core_shard: 1, boar_tusk: 1 },
      artifactPool: [],
    },
  ];
}

/**
 * Picks a stage-scaled wearable artifact (or null if the chest is a resource-only chest) + reagents.
 */
export function rollChestLoot(
  chest: LabyrinthChestSpec,
  ownedArtifacts: ArtifactId[],
  randomValue = Math.random()
): {
  reagents: Partial<Record<ReagentId, number>>;
  artifactId: ArtifactId | null;
} {
  const pool = chest.artifactPool;
  if (!pool || pool.length === 0) {
    return {
      reagents: { ...chest.reagentRewards },
      artifactId: null,
    };
  }
  const unowned = pool.filter((id) => !ownedArtifacts.includes(id));
  const targetPool = unowned.length > 0 ? unowned : pool;
  const idx = Math.min(targetPool.length - 1, Math.max(0, Math.floor(randomValue * targetPool.length)));
  return {
    reagents: { ...chest.reagentRewards },
    artifactId: targetPool[idx],
  };
}

export type RuneButtonSpellId = 'incendio' | 'glacius' | 'expelliarmus' | 'stupefy';

export interface LabyrinthRuneButtonSpec {
  id: string;
  gateId: string;
  requiredSpellId: RuneButtonSpellId;
  spellLabel: string;
  color: string;
  colorHex: string;
  mount: 'floor' | 'wall';
  x: number;
  y: number;
  z: number;
}

export interface LabyrinthRuneGateSpec {
  id: string;
  stage: 1 | 2 | 3 | 4 | 5;
  label: string;
  isSecretRoom?: boolean;
  x: number;
  z: number;
  w: number;
  d: number;
  width: number;
  depth: number;
  wallBox: WallBox;
  buttons: LabyrinthRuneButtonSpec[];
}

/**
 * Returns the solid sliding Rune Gates (`Сплошные раздвижные стены / ворота`) and their Elemental Magic Buttons:
 * - Cannot be walked through OR teleported through while closed!
 * - Buttons use: `Огонь [1]` (#f97316), `Мороз [2]` (#38bdf8), `Ток / Удар [3]` (RED #ef4444 matching the [3] skill button!), and `Стоп (Кирпич) [4]` (#ec4899)
 *   so that GREEN (#22c55e) is strictly reserved for OPEN / ACTIVATED buttons!
 * - All buttons are 30% smaller (`RUNE_BUTTON_SCALE = 0.49`).
 */
export function getLabyrinthRuneGates(stage: 1 | 2 | 3 | 4 | 5): LabyrinthRuneGateSpec[] {
  if (stage === 1) {
    return [
      {
        id: 'secret_s1_0',
        stage: 1,
        isSecretRoom: true,
        label: 'Тайная Комната Огня (Запад I)',
        x: -45,
        z: 47,
        w: 18,
        d: 4.0,
        width: 18,
        depth: 4.0,
        wallBox: {
          minX: -55,
          maxX: -35,
          minZ: 44.5,
          maxZ: 49.5,
        },
        buttons: [
          {
            id: 'secret_s1_0_btn_0',
            gateId: 'secret_s1_0',
            requiredSpellId: 'incendio',
            spellLabel: 'Огонь [1]',
            color: '#f97316',
            colorHex: '#f97316',
            mount: 'floor',
            x: -28,
            y: 0.08,
            z: 42,
          },
        ],
      },
      {
        id: 'secret_s1_1',
        stage: 1,
        isSecretRoom: true,
        label: 'Тайная Комната Льда (Восток I)',
        x: 45,
        z: 7,
        w: 18,
        d: 4.0,
        width: 18,
        depth: 4.0,
        wallBox: {
          minX: 35,
          maxX: 55,
          minZ: 4.5,
          maxZ: 9.5,
        },
        buttons: [
          {
            id: 'secret_s1_1_btn_0',
            gateId: 'secret_s1_1',
            requiredSpellId: 'glacius',
            spellLabel: 'Мороз [2]',
            color: '#38bdf8',
            colorHex: '#38bdf8',
            mount: 'wall',
            x: 31,
            y: 2.1,
            z: 16,
          },
        ],
      },
      {
        id: 'secret_s1_2',
        stage: 1,
        isSecretRoom: true,
        label: 'Тайная Комната Молнии (Юго-Запад I)',
        x: -45,
        z: -33,
        w: 18,
        d: 4.0,
        width: 18,
        depth: 4.0,
        wallBox: {
          minX: -55,
          maxX: -35,
          minZ: -35.5,
          maxZ: -30.5,
        },
        buttons: [
          {
            id: 'secret_s1_2_btn_0',
            gateId: 'secret_s1_2',
            requiredSpellId: 'expelliarmus',
            spellLabel: 'Ток / Удар [3]',
            color: '#ef4444',
            colorHex: '#ef4444',
            mount: 'floor',
            x: -28,
            y: 0.08,
            z: -38,
          },
        ],
      },
    ];
  }

  if (stage === 2) {
    return [
      {
        id: 'gate_s2_0',
        stage: 2,
        label: 'Центральные Сплошные Ворота (Уровень 2)',
        x: 28,
        z: 10,
        w: 20,
        d: 4.5,
        width: 20,
        depth: 4.5,
        wallBox: {
          minX: -60,
          maxX: 60,
          minZ: 7.2,
          maxZ: 12.8,
        },
        buttons: [
          {
            id: 'gate_s2_0_btn_0',
            gateId: 'gate_s2_0',
            requiredSpellId: 'incendio',
            spellLabel: 'Огонь [1]',
            color: '#f97316',
            colorHex: '#f97316',
            mount: 'floor',
            x: 16,
            y: 0.08,
            z: 20,
          },
          {
            id: 'gate_s2_0_btn_1',
            gateId: 'gate_s2_0',
            requiredSpellId: 'glacius',
            spellLabel: 'Мороз [2]',
            color: '#38bdf8',
            colorHex: '#38bdf8',
            mount: 'wall',
            x: 34,
            y: 2.1,
            z: 30,
          },
        ],
      },
    ];
  }

  if (stage === 3) {
    // Stage 3: 2 Solid Sliding Walls, each requiring 4 Elemental Buttons (Огонь, Мороз, Ток/Удар [RED #ef4444], Стоп [4])
    return [
      {
        id: 'gate_s3_0',
        stage: 3,
        label: 'Первые Сплошные Ворота (Северные)',
        x: -12,
        z: 38,
        w: 24,
        d: 4.5,
        width: 24,
        depth: 4.5,
        wallBox: {
          minX: -66,
          maxX: 66,
          minZ: 35.2,
          maxZ: 40.8,
        },
        buttons: [
          {
            id: 'gate_s3_0_btn_0',
            gateId: 'gate_s3_0',
            requiredSpellId: 'incendio',
            spellLabel: 'Огонь [1]',
            color: '#f97316',
            colorHex: '#f97316',
            mount: 'floor',
            x: -36,
            y: 0.08,
            z: 106,
          },
          {
            id: 'gate_s3_0_btn_1',
            gateId: 'gate_s3_0',
            requiredSpellId: 'glacius',
            spellLabel: 'Мороз [2]',
            color: '#38bdf8',
            colorHex: '#38bdf8',
            mount: 'wall',
            x: -24,
            y: 2.1,
            z: 93,
          },
          {
            id: 'gate_s3_0_btn_2',
            gateId: 'gate_s3_0',
            requiredSpellId: 'expelliarmus',
            spellLabel: 'Ток / Удар [3]',
            color: '#ef4444',
            colorHex: '#ef4444',
            mount: 'floor',
            x: 38,
            y: 0.08,
            z: 56,
          },
          {
            id: 'gate_s3_0_btn_3',
            gateId: 'gate_s3_0',
            requiredSpellId: 'stupefy',
            spellLabel: 'Стоп (Кирпич) [4]',
            color: '#ec4899',
            colorHex: '#ec4899',
            mount: 'wall',
            x: -28,
            y: 2.1,
            z: 41,
          },
        ],
      },
      {
        id: 'gate_s3_1',
        stage: 3,
        label: 'Вторые Сплошные Ворота (Южные)',
        x: -38,
        z: -48,
        w: 24,
        d: 4.5,
        width: 24,
        depth: 4.5,
        wallBox: {
          minX: -66,
          maxX: 66,
          minZ: -50.8,
          maxZ: -45.2,
        },
        buttons: [
          {
            id: 'gate_s3_1_btn_0',
            gateId: 'gate_s3_1',
            requiredSpellId: 'incendio',
            spellLabel: 'Огонь [1]',
            color: '#f97316',
            colorHex: '#f97316',
            mount: 'floor',
            x: -44,
            y: 0.08,
            z: 18,
          },
          {
            id: 'gate_s3_1_btn_1',
            gateId: 'gate_s3_1',
            requiredSpellId: 'glacius',
            spellLabel: 'Мороз [2]',
            color: '#38bdf8',
            colorHex: '#38bdf8',
            mount: 'wall',
            x: 32,
            y: 2.1,
            z: 12,
          },
          {
            id: 'gate_s3_1_btn_2',
            gateId: 'gate_s3_1',
            requiredSpellId: 'expelliarmus',
            spellLabel: 'Ток / Удар [3]',
            color: '#ef4444',
            colorHex: '#ef4444',
            mount: 'floor',
            x: 8,
            y: 0.08,
            z: -24,
          },
          {
            id: 'gate_s3_1_btn_3',
            gateId: 'gate_s3_1',
            requiredSpellId: 'stupefy',
            spellLabel: 'Стоп (Кирпич) [4]',
            color: '#ec4899',
            colorHex: '#ec4899',
            mount: 'wall',
            x: -20,
            y: 2.1,
            z: -45,
          },
        ],
      },
    ];
  }

  if (stage === 4) {
    // Stage 4 True Maze: 2 Solid Sliding Walls, each unlocked by 4 buttons placed across the maze wings!
    return [
      {
        id: 'gate_s4_0',
        stage: 4,
        label: 'Северные Врата Лабиринта Стихий',
        x: -42,
        z: 40,
        w: 40,
        d: 4.5,
        width: 40,
        depth: 4.5,
        wallBox: {
          minX: -84,
          maxX: 84,
          minZ: 37.2,
          maxZ: 42.8,
        },
        buttons: [
          {
            id: 'gate_s4_0_btn_0',
            gateId: 'gate_s4_0',
            requiredSpellId: 'incendio',
            spellLabel: 'Огонь [1]',
            color: '#f97316',
            colorHex: '#f97316',
            mount: 'floor',
            x: -56,
            y: 0.08,
            z: 124,
          },
          {
            id: 'gate_s4_0_btn_1',
            gateId: 'gate_s4_0',
            requiredSpellId: 'glacius',
            spellLabel: 'Мороз [2]',
            color: '#38bdf8',
            colorHex: '#38bdf8',
            mount: 'wall',
            x: 56,
            y: 2.1,
            z: 141,
          },
          {
            id: 'gate_s4_0_btn_2',
            gateId: 'gate_s4_0',
            requiredSpellId: 'expelliarmus',
            spellLabel: 'Ток / Удар [3]',
            color: '#ef4444',
            colorHex: '#ef4444',
            mount: 'floor',
            x: 54,
            y: 0.08,
            z: 66,
          },
          {
            id: 'gate_s4_0_btn_3',
            gateId: 'gate_s4_0',
            requiredSpellId: 'stupefy',
            spellLabel: 'Стоп (Кирпич) [4]',
            color: '#ec4899',
            colorHex: '#ec4899',
            mount: 'wall',
            x: -18,
            y: 2.1,
            z: 43,
          },
        ],
      },
      {
        id: 'gate_s4_1',
        stage: 4,
        label: 'Южные Врата Святилища Стихий',
        x: 64,
        z: -44,
        w: 36,
        d: 4.5,
        width: 36,
        depth: 4.5,
        wallBox: {
          minX: -84,
          maxX: 84,
          minZ: -46.8,
          maxZ: -41.2,
        },
        buttons: [
          {
            id: 'gate_s4_1_btn_0',
            gateId: 'gate_s4_1',
            requiredSpellId: 'incendio',
            spellLabel: 'Огонь [1]',
            color: '#f97316',
            colorHex: '#f97316',
            mount: 'floor',
            x: -54,
            y: 0.08,
            z: -24,
          },
          {
            id: 'gate_s4_1_btn_1',
            gateId: 'gate_s4_1',
            requiredSpellId: 'glacius',
            spellLabel: 'Мороз [2]',
            color: '#38bdf8',
            colorHex: '#38bdf8',
            mount: 'wall',
            x: 24,
            y: 2.1,
            z: 7,
          },
          {
            id: 'gate_s4_1_btn_2',
            gateId: 'gate_s4_1',
            requiredSpellId: 'expelliarmus',
            spellLabel: 'Ток / Удар [3]',
            color: '#ef4444',
            colorHex: '#ef4444',
            mount: 'floor',
            x: 22,
            y: 0.08,
            z: -24,
          },
          {
            id: 'gate_s4_1_btn_3',
            gateId: 'gate_s4_1',
            requiredSpellId: 'stupefy',
            spellLabel: 'Стоп (Кирпич) [4]',
            color: '#ec4899',
            colorHex: '#ec4899',
            mount: 'wall',
            x: 36,
            y: 2.1,
            z: -41,
          },
        ],
      },
    ];
  }

  // Stage 5 Grand Catacombs: 3 Main 4-Button Closing Gates (`gate_s5_0`, `gate_s5_1`, `gate_s5_2`)
  // + 5 Secret Room Doors (`secret_s5_0` .. `secret_s5_4`)!
  return [
    // --- 3 MAIN CLOSING GATES (4 ELEMENTAL BUTTONS EACH) ---
    {
      id: 'gate_s5_0',
      stage: 5,
      label: 'Первые Врата Катакомб (Север-Запад)',
      x: -52,
      z: 136,
      w: 16,
      d: 4.5,
      width: 16,
      depth: 4.5,
      wallBox: {
        minX: -96,
        maxX: 96,
        minZ: 133.2,
        maxZ: 138.8,
      },
      buttons: [
        {
          id: 'gate_s5_0_btn_0',
          gateId: 'gate_s5_0',
          requiredSpellId: 'incendio',
          spellLabel: 'Огонь [1]',
          color: '#f97316',
          colorHex: '#f97316',
          mount: 'floor',
          x: -12,
          y: 0.08,
          z: 190,
        },
        {
          id: 'gate_s5_0_btn_1',
          gateId: 'gate_s5_0',
          requiredSpellId: 'glacius',
          spellLabel: 'Мороз [2]',
          color: '#38bdf8',
          colorHex: '#38bdf8',
          mount: 'wall',
          x: 78,
          y: 2.1,
          z: 183,
        },
        {
          id: 'gate_s5_0_btn_2',
          gateId: 'gate_s5_0',
          requiredSpellId: 'expelliarmus',
          spellLabel: 'Ток / Удар [3]',
          color: '#ef4444',
          colorHex: '#ef4444',
          mount: 'floor',
          x: 78,
          y: 0.08,
          z: 156,
        },
        {
          id: 'gate_s5_0_btn_3',
          gateId: 'gate_s5_0',
          requiredSpellId: 'stupefy',
          spellLabel: 'Стоп (Кирпич) [4]',
          color: '#ec4899',
          colorHex: '#ec4899',
          mount: 'wall',
          x: -36,
          y: 2.1,
          z: 139,
        },
      ],
    },
    {
      id: 'gate_s5_1',
      stage: 5,
      label: 'Вторые Врата Катакомб (Центр-Восток)',
      x: 60,
      z: -4,
      w: 16,
      d: 4.5,
      width: 16,
      depth: 4.5,
      wallBox: {
        minX: -96,
        maxX: 96,
        minZ: -6.8,
        maxZ: -1.2,
      },
      buttons: [
        {
          id: 'gate_s5_1_btn_0',
          gateId: 'gate_s5_1',
          requiredSpellId: 'incendio',
          spellLabel: 'Огонь [1]',
          color: '#f97316',
          colorHex: '#f97316',
          mount: 'floor',
          x: -72,
          y: 0.08,
          z: 112,
        },
        {
          id: 'gate_s5_1_btn_1',
          gateId: 'gate_s5_1',
          requiredSpellId: 'glacius',
          spellLabel: 'Мороз [2]',
          color: '#38bdf8',
          colorHex: '#38bdf8',
          mount: 'wall',
          x: 64,
          y: 2.1,
          z: 87,
        },
        {
          id: 'gate_s5_1_btn_2',
          gateId: 'gate_s5_1',
          requiredSpellId: 'expelliarmus',
          spellLabel: 'Ток / Удар [3]',
          color: '#ef4444',
          colorHex: '#ef4444',
          mount: 'floor',
          x: -72,
          y: 0.08,
          z: 18,
        },
        {
          id: 'gate_s5_1_btn_3',
          gateId: 'gate_s5_1',
          requiredSpellId: 'stupefy',
          spellLabel: 'Стоп (Кирпич) [4]',
          color: '#ec4899',
          colorHex: '#ec4899',
          mount: 'wall',
          x: 28,
          y: 2.1,
          z: -1,
        },
      ],
    },
    {
      id: 'gate_s5_2',
      stage: 5,
      label: 'Третьи Врата Катакомб (Глубинный Свод)',
      x: 44,
      z: -102,
      w: 16,
      d: 4.5,
      width: 16,
      depth: 4.5,
      wallBox: {
        minX: -96,
        maxX: 96,
        minZ: -104.8,
        maxZ: -99.2,
      },
      buttons: [
        {
          id: 'gate_s5_2_btn_0',
          gateId: 'gate_s5_2',
          requiredSpellId: 'incendio',
          spellLabel: 'Огонь [1]',
          color: '#f97316',
          colorHex: '#f97316',
          mount: 'floor',
          x: 82,
          y: 0.08,
          z: -24,
        },
        {
          id: 'gate_s5_2_btn_1',
          gateId: 'gate_s5_2',
          requiredSpellId: 'glacius',
          spellLabel: 'Мороз [2]',
          color: '#38bdf8',
          colorHex: '#38bdf8',
          mount: 'wall',
          x: -36,
          y: 2.1,
          z: -49,
        },
        {
          id: 'gate_s5_2_btn_2',
          gateId: 'gate_s5_2',
          requiredSpellId: 'expelliarmus',
          spellLabel: 'Ток / Удар [3]',
          color: '#ef4444',
          colorHex: '#ef4444',
          mount: 'floor',
          x: -78,
          y: 0.08,
          z: -78,
        },
        {
          id: 'gate_s5_2_btn_3',
          gateId: 'gate_s5_2',
          requiredSpellId: 'stupefy',
          spellLabel: 'Стоп (Кирпич) [4]',
          color: '#ec4899',
          colorHex: '#ec4899',
          mount: 'wall',
          x: 16,
          y: 2.1,
          z: -99,
        },
      ],
    },

    // --- 5 SECRET ROOM SLIDING DOORS (5 ПОТАЙНЫХ КОМНАТ) ---
    {
      id: 'secret_s5_0',
      stage: 5,
      isSecretRoom: true,
      label: 'Потайная Комната I (Северо-Запад)',
      x: -85,
      z: 157,
      w: 18,
      d: 4.0,
      width: 18,
      depth: 4.0,
      wallBox: {
        minX: -95,
        maxX: -75,
        minZ: 154.5,
        maxZ: 159.5,
      },
      buttons: [
        {
          id: 'secret_s5_0_btn_0',
          gateId: 'secret_s5_0',
          requiredSpellId: 'incendio',
          spellLabel: 'Огонь [1]',
          color: '#f97316',
          colorHex: '#f97316',
          mount: 'wall',
          x: -71,
          y: 2.1,
          z: 162,
        },
      ],
    },
    {
      id: 'secret_s5_1',
      stage: 5,
      isSecretRoom: true,
      label: 'Потайная Комната II (Северо-Восток)',
      x: 85,
      z: 113,
      w: 18,
      d: 4.0,
      width: 18,
      depth: 4.0,
      wallBox: {
        minX: 75,
        maxX: 95,
        minZ: 110.5,
        maxZ: 115.5,
      },
      buttons: [
        {
          id: 'secret_s5_1_btn_0',
          gateId: 'secret_s5_1',
          requiredSpellId: 'glacius',
          spellLabel: 'Мороз [2]',
          color: '#38bdf8',
          colorHex: '#38bdf8',
          mount: 'wall',
          x: 71,
          y: 2.1,
          z: 118,
        },
      ],
    },
    {
      id: 'secret_s5_2',
      stage: 5,
      isSecretRoom: true,
      label: 'Потайная Комната III (Западное Озеро)',
      x: -85,
      z: 67,
      w: 18,
      d: 4.0,
      width: 18,
      depth: 4.0,
      wallBox: {
        minX: -95,
        maxX: -75,
        minZ: 64.5,
        maxZ: 69.5,
      },
      buttons: [
        {
          id: 'secret_s5_2_btn_0',
          gateId: 'secret_s5_2',
          requiredSpellId: 'expelliarmus',
          spellLabel: 'Ток / Удар [3]',
          color: '#ef4444',
          colorHex: '#ef4444',
          mount: 'floor',
          x: -68,
          y: 0.08,
          z: 58,
        },
      ],
    },
    {
      id: 'secret_s5_3',
      stage: 5,
      isSecretRoom: true,
      label: 'Потайная Комната IV (Юго-Запад)',
      x: -85,
      z: -27,
      w: 18,
      d: 4.0,
      width: 18,
      depth: 4.0,
      wallBox: {
        minX: -95,
        maxX: -75,
        minZ: -29.5,
        maxZ: -24.5,
      },
      buttons: [
        {
          id: 'secret_s5_3_btn_0',
          gateId: 'secret_s5_3',
          requiredSpellId: 'stupefy',
          spellLabel: 'Стоп (Кирпич) [4]',
          color: '#ec4899',
          colorHex: '#ec4899',
          mount: 'wall',
          x: -71,
          y: 2.1,
          z: -20,
        },
      ],
    },
    {
      id: 'secret_s5_4',
      stage: 5,
      isSecretRoom: true,
      label: 'Потайная Комната V (Юго-Восток)',
      x: 85,
      z: -75,
      w: 18,
      d: 4.0,
      width: 18,
      depth: 4.0,
      wallBox: {
        minX: 75,
        maxX: 95,
        minZ: -77.5,
        maxZ: -72.5,
      },
      buttons: [
        {
          id: 'secret_s5_4_btn_0',
          gateId: 'secret_s5_4',
          requiredSpellId: 'expelliarmus',
          spellLabel: 'Ток / Удар [3]',
          color: '#ef4444',
          colorHex: '#ef4444',
          mount: 'floor',
          x: 68,
          y: 0.08,
          z: -84,
        },
      ],
    },
  ];
}

/**
 * Generates the guaranteed-passable Labyrinth layout for Stages 1, 2, 3, and 4:
 * - Stage 1: 4 alternating baffles + 3 Secret Rooms (unlocked by Fire, Ice, Lightning buttons) + 4 Chests
 * - Stage 2: Narrower (`20m`) multi-branching maze corridors, side vaults, 5 wall-to-wall lasers, 2x3 Spike Trap Zones, 1 Rune Gate, and 5 Chests
 * - Stage 3: Multi-branching `24m` maze corridors & chambers, 6 horizontal wall-to-wall lasers, 3x4 Spike Trap Zones, 2 Rune Gates, and 6 Chests
 * - Stage 4: Grand Multi-Branching Elemental Maze (`168m x 376m`), 8 wall-to-wall lasers, 3 Spike Trap Zones (`3, 4, 5` lines), 2 Rune Gates, and 6 Chests
 */
export function getLabyrinthStageLayout(stage: 1 | 2 | 3 | 4 | 5): {
  stage: 1 | 2 | 3 | 4 | 5;
  halfWidth: number;
  halfLength: number;
  startX: number;
  startZ: number;
  goalZ: number;
  wallSpecs: WallSpec[];
  wallBoxes: WallBox[];
  floorTraps: FloorTrapSpec[];
  laserTraps: LaserBeamTrapSpec[];
  spikeTrapZones: SpikeTrapZoneSpec[];
  chests: LabyrinthChestSpec[];
  runeGates: LabyrinthRuneGateSpec[];
  waterLake: WaterLakeSpec;
} {
  const floorTraps = getLabyrinthFloorTraps(stage);
  const laserTraps = getLabyrinthLaserTraps(stage);
  const spikeTrapZones = getLabyrinthSpikeTrapZones(stage);
  const chests = getLabyrinthChests(stage);
  const runeGates = getLabyrinthRuneGates(stage);
  const waterLake = getLabyrinthWaterLake(stage);

  if (stage === 1) {
    const halfWidth = 56;
    const halfLength = 108;
    const startX = -40;
    const startZ = 92;
    const goalZ = -96;
    const baffles: WallSpec[] = [
      { x: -18, z: 68, w: 72, d: 4.5 }, // East opening X in [+18..+54]
      { x: 18, z: 28, w: 72, d: 4.5 },  // West opening X in [-54..-18]
      { x: -18, z: -12, w: 72, d: 4.5 }, // East opening X in [+18..+54]
      { x: 18, z: -52, w: 72, d: 4.5 },  // West opening X in [-54..-18]
      // 3 Secret Room side partition walls (each sealed on its doorway side by a sliding secret rune door!)
      { x: -34, z: 57, w: 4, d: 18 },    // Secret Room 1 East wall (X = -34, Z in [48..66])
      { x: 34, z: 17, w: 4, d: 18 },     // Secret Room 2 West wall (X = 34, Z in [8..26])
      { x: -34, z: -23, w: 4, d: 18 },   // Secret Room 3 East wall (X = -34, Z in [-32..-14])
    ];
    const wallSpecs: WallSpec[] = [
      { x: -halfWidth, z: 0, w: 4, d: halfLength * 2 },
      { x: halfWidth, z: 0, w: 4, d: halfLength * 2 },
      { x: 0, z: halfLength, w: halfWidth * 2 + 4, d: 4 },
      { x: 0, z: -halfLength, w: halfWidth * 2 + 4, d: 4 },
      ...baffles,
    ];
    const wallBoxes = wallSpecs.map((ws) => ({
      minX: ws.x - ws.w / 2 - 0.85,
      maxX: ws.x + ws.w / 2 + 0.85,
      minZ: ws.z - ws.d / 2 - 0.85,
      maxZ: ws.z + ws.d / 2 + 0.85,
    }));
    return {
      stage,
      halfWidth,
      halfLength,
      startX,
      startZ,
      goalZ,
      wallSpecs,
      wallBoxes,
      floorTraps,
      laserTraps,
      spikeTrapZones,
      chests,
      runeGates,
      waterLake,
    };
  }

  if (stage === 2) {
    // Stage 2: Redesigned with narrower 20m corridors, vertical maze dividers, side vaults, and 2 wall-to-wall 3-line Spike Trap Zones
    const halfWidth = 60;
    const halfLength = 124;
    const startX = -44;
    const startZ = 106;
    const goalZ = -110;
    const mazeWalls2: WallSpec[] = [
      // Row 1 (z = 84): East doorway X in [38..58] (20m wide)
      { x: -10, z: 84, w: 96, d: 4.5 },
      // Band 1 vertical dividers (Z in [58..84])
      { x: 18, z: 76, w: 4.5, d: 14 },
      { x: -18, z: 66, w: 4.5, d: 14 },
      // Row 2 (z = 56): West-Center doorway X in [-38..-18] (20m wide)
      { x: -48, z: 56, w: 20, d: 4.5 },
      { x: 20, z: 56, w: 76, d: 4.5 },
      // Band 2 (Z in [10..56]): 20m West-Center Spike Chute (X in [-38..-18]) + East Maze Wing
      { x: -40, z: 33, w: 4.5, d: 42 },
      { x: -16, z: 38, w: 4.5, d: 32 },
      { x: 12, z: 33, w: 52, d: 4.5 },
      // Row 3 (z = 10): East-Center doorway X in [18..38] (20m wide, guarded by gate_s2_0)
      { x: -20, z: 10, w: 76, d: 4.5 },
      { x: 48, z: 10, w: 20, d: 4.5 },
      // Band 3 vertical dividers (Z in [-20..10])
      { x: 16, z: 0, w: 4.5, d: 16 },
      { x: -16, z: -10, w: 4.5, d: 16 },
      // Row 4 (z = -20): West-Center doorway X in [-38..-18] (20m wide)
      { x: -48, z: -20, w: 20, d: 4.5 },
      { x: 20, z: -20, w: 76, d: 4.5 },
      // Band 4 (Z in [-66..-20]): West Vault + Central Turn + 20m East-Center Spike Chute (X in [18..38])
      { x: -40, z: -36, w: 4.5, d: 28 },
      { x: 0, z: -36, w: 36, d: 4.5 },
      { x: 16, z: -49, w: 4.5, d: 30 },
      { x: 40, z: -43, w: 4.5, d: 42 },
      // Row 5 (z = -66): East-Center doorway X in [18..38] (20m wide)
      { x: -20, z: -66, w: 76, d: 4.5 },
      { x: 48, z: -66, w: 20, d: 4.5 },
      // Band 5 vertical divider (Z in [-92..-66])
      { x: 0, z: -74, w: 4.5, d: 12 },
      // Row 6 (z = -92): Center Boss Archway X in [-10..+10] (20m wide)
      { x: -34, z: -92, w: 48, d: 4.5 },
      { x: 34, z: -92, w: 48, d: 4.5 },
    ];
    const wallSpecs: WallSpec[] = [
      { x: -halfWidth, z: 0, w: 4, d: halfLength * 2 },
      { x: halfWidth, z: 0, w: 4, d: halfLength * 2 },
      { x: 0, z: halfLength, w: halfWidth * 2 + 4, d: 4 },
      { x: 0, z: -halfLength, w: halfWidth * 2 + 4, d: 4 },
      ...mazeWalls2,
    ];
    const wallBoxes = wallSpecs.map((ws) => ({
      minX: ws.x - ws.w / 2 - 0.85,
      maxX: ws.x + ws.w / 2 + 0.85,
      minZ: ws.z - ws.d / 2 - 0.85,
      maxZ: ws.z + ws.d / 2 + 0.85,
    }));
    return {
      stage,
      halfWidth,
      halfLength,
      startX,
      startZ,
      goalZ,
      wallSpecs,
      wallBoxes,
      floorTraps,
      laserTraps,
      spikeTrapZones,
      chests,
      runeGates,
      waterLake,
    };
  }

  if (stage === 3) {
    // Stage 3: Redesigned into a multi-branching 24m maze with side vaults, 6 horizontal wall-to-wall lasers, and 3x4 Spike Trap Zones
    const halfWidth = 66;
    const halfLength = 156;
    const startX = -48;
    const startZ = 138;
    const goalZ = -142;
    const mazeWalls3: WallSpec[] = [
      // Row 1 (z = 118): East-Center doorway X in [12..36] (24m wide)
      { x: -26, z: 118, w: 76, d: 4.5 },
      { x: 50, z: 118, w: 28, d: 4.5 },
      // Zone 1 (Z in [72..118]): 24m Spike Chute #1 (X in [12..36]) + West & East Maze Wings
      { x: 10, z: 102, w: 4.5, d: 28 },
      { x: 38, z: 102, w: 4.5, d: 28 },
      { x: -40, z: 96, w: 48, d: 4.5 },
      // Row 2 (z = 72): West-Center doorway X in [-40..-16] (24m wide)
      { x: -52, z: 72, w: 24, d: 4.5 },
      { x: 24, z: 72, w: 80, d: 4.5 },
      // Zone 2 (Z in [38..72]): Multi-Room Rune Hall
      { x: -42, z: 55, w: 4.5, d: 20 },
      { x: 14, z: 58, w: 4.5, d: 24 },
      // Row 3 (z = 38): Center-West doorway X in [-24..0] (24m wide, guarded by gate_s3_0)
      { x: -44, z: 38, w: 40, d: 4.5 },
      { x: 32, z: 38, w: 64, d: 4.5 },
      // Zone 3 (Z in [-8..38]): 24m Spike Chute #2 (X in [-24..0]) + West Bastion & East Alcove
      { x: -26, z: 22, w: 4.5, d: 28 },
      { x: 2, z: 22, w: 4.5, d: 28 },
      { x: 40, z: 15, w: 48, d: 4.5 },
      // Row 4 (z = -8): East doorway X in [40..64] (24m wide)
      { x: -12, z: -8, w: 104, d: 4.5 },
      // Zone 4 (Z in [-48..-8]): Cross-Labyrinth Maze
      { x: 24, z: -22, w: 4.5, d: 24 },
      { x: -10, z: -34, w: 4.5, d: 24 },
      // Row 5 (z = -48): West doorway X in [-50..-26] (24m wide, guarded by gate_s3_1)
      { x: -57, z: -48, w: 14, d: 4.5 },
      { x: 19, z: -48, w: 90, d: 4.5 },
      // Zone 5 (Z in [-92..-48]): 24m Spike Chute #3 (X in [-50..-26]) + Central Casemate
      { x: -52, z: -64, w: 4.5, d: 28 },
      { x: -24, z: -64, w: 4.5, d: 28 },
      { x: 16, z: -64, w: 4.5, d: 28 },
      // Row 6 (z = -92): East doorway X in [40..64] (24m wide)
      { x: -12, z: -92, w: 104, d: 4.5 },
      // Row 7 (z = -120): Center Boss Archway X in [-12..+12] (24m wide)
      { x: -38, z: -120, w: 52, d: 4.5 },
      { x: 38, z: -120, w: 52, d: 4.5 },
    ];
    const wallSpecs: WallSpec[] = [
      { x: -halfWidth, z: 0, w: 4, d: halfLength * 2 },
      { x: halfWidth, z: 0, w: 4, d: halfLength * 2 },
      { x: 0, z: halfLength, w: halfWidth * 2 + 4, d: 4 },
      { x: 0, z: -halfLength, w: halfWidth * 2 + 4, d: 4 },
      ...mazeWalls3,
    ];
    const wallBoxes = wallSpecs.map((ws) => ({
      minX: ws.x - ws.w / 2 - 0.85,
      maxX: ws.x + ws.w / 2 + 0.85,
      minZ: ws.z - ws.d / 2 - 0.85,
      maxZ: ws.z + ws.d / 2 + 0.85,
    }));
    return {
      stage,
      halfWidth,
      halfLength,
      startX,
      startZ,
      goalZ,
      wallSpecs,
      wallBoxes,
      floorTraps,
      laserTraps,
      spikeTrapZones,
      chests,
      runeGates,
      waterLake,
    };
  }

  if (stage === 4) {
    // Stage 4: True Multi-Branching Elemental Maze (`Лабиринт Стихий`, 168m x 376m)
    const halfWidth = 84;
    const halfLength = 188;
    const startX = -62;
    const startZ = 166;
    const goalZ = -172;
    const mazeWalls: WallSpec[] = [
      // Row A1 (z = 144): Center doorway X in [-6..+22] (28m wide)
      { x: -45, z: 144, w: 78, d: 4.5 },
      { x: 53, z: 144, w: 62, d: 4.5 },
      // Vertical dividers V1 & V2 (z in [112..142]) bounding the 28m Spike Chute #1 (`spike_s4_0`, 3 lines)
      { x: -8, z: 127, w: 4.5, d: 30 },
      { x: 24, z: 127, w: 4.5, d: 30 },
      // Row A2 (z = 92): East doorway X in [+42..+82] (40m wide)
      { x: -20, z: 92, w: 124, d: 4.5 },
      // Vertical divider V3 (x = 12, z in [54..90]) separating East Corridor from Northwest Lake Wing
      { x: 12, z: 72, w: 4.5, d: 36 },
      // Row A3 (z = 40): West doorway X in [-62..-22] (40m wide, guarded by gate_s4_0)
      { x: -72, z: 40, w: 20, d: 4.5 },
      { x: 30, z: 40, w: 104, d: 4.5 },
      // Zone 3 Central Maze Walls (Z in [-44..+40]):
      // V4 (x = -22, z in [-14..+38]) creating West Maze Lane
      { x: -22, z: 12, w: 4.5, d: 52 },
      // A4 (x in [0..+48], z = 4) creating North-Center & South-Center Vaults
      { x: 24, z: 4, w: 48, d: 4.5 },
      // V5 (x = 48, z in [-42..+22]) bounding East Elemental Corridor (`spike_s4_1`, 4 lines, 32m wide)
      { x: 48, z: -10, w: 4.5, d: 64 },
      // Row A5 (z = -44): East doorway X in [+46..+82] (36m wide, guarded by gate_s4_1)
      { x: -18, z: -44, w: 128, d: 4.5 },
      // Zone 4 Deep Sanctum (Z in [-132..-44]):
      // V6 (x = 0, z in [-76..-46]) splitting East & West Sanctum Halls
      { x: 0, z: -61, w: 4.5, d: 30 },
      // Row A6 (z = -92): West doorway X in [-82..-46] (36m wide)
      { x: 18, z: -92, w: 128, d: 4.5 },
      // Vertical divider V7 (x = -44, z in [-124..-96]) bounding West Sanctum Spike Chute #3 (`spike_s4_2`, 5 lines, 36m wide)
      { x: -44, z: -110, w: 4.5, d: 28 },
      // Row A7 (z = -132): Grand Center Boss Archway X in [-22..+22] (44m wide)
      { x: -52, z: -132, w: 60, d: 4.5 },
      { x: 52, z: -132, w: 60, d: 4.5 },
    ];
    const wallSpecs: WallSpec[] = [
      { x: -halfWidth, z: 0, w: 4, d: halfLength * 2 },
      { x: halfWidth, z: 0, w: 4, d: halfLength * 2 },
      { x: 0, z: halfLength, w: halfWidth * 2 + 4, d: 4 },
      { x: 0, z: -halfLength, w: halfWidth * 2 + 4, d: 4 },
      ...mazeWalls,
    ];
    const wallBoxes = wallSpecs.map((ws) => ({
      minX: ws.x - ws.w / 2 - 0.85,
      maxX: ws.x + ws.w / 2 + 0.85,
      minZ: ws.z - ws.d / 2 - 0.85,
      maxZ: ws.z + ws.d / 2 + 0.85,
    }));
    return {
      stage,
      halfWidth,
      halfLength,
      startX,
      startZ,
      goalZ,
      wallSpecs,
      wallBoxes,
      floorTraps,
      laserTraps,
      spikeTrapZones,
      chests,
      runeGates,
      waterLake,
    };
  }

  // Stage 5: Grand Ancient Catacombs (`Великие Катакомбы Древних`, 192m x 440m — larger than Stage 4,
  // narrower 16m passages, 8 horizontal rows, 18 vertical maze dividers, 3 Main 4-Button Gates, and 5 Secret Rooms!)
  const halfWidth5 = 96;
  const halfLength5 = 220;
  const startX5 = -76;
  const startZ5 = 204;
  const goalZ5 = -204;
  const mazeWalls5: WallSpec[] = [
    // Band 0 (Z in [180..220]) entrance labyrinth baffles
    { x: -36, z: 206, w: 4.5, d: 24 },
    { x: 12, z: 194, w: 4.5, d: 24 },
    // Row 1 (z = 180): 16m East doorway X in [44..60] (center x = 52)
    { x: -26, z: 180, w: 140, d: 4.5 },
    { x: 78, z: 180, w: 36, d: 4.5 },
    // Band 1 (Z in [136..180]): Secret Room 1 partition + 16m Spike Chute #1 (X in [44..60]) + S-curve dividers
    { x: -74, z: 168, w: 4, d: 18 }, // Secret Room 1 East partition (X = -74, Z in [159..177])
    { x: 42, z: 164, w: 4.5, d: 28 },
    { x: 62, z: 164, w: 4.5, d: 28 },
    { x: 12, z: 150, w: 4.5, d: 24 },
    { x: -24, z: 166, w: 4.5, d: 24 },
    // Row 2 (z = 136): 16m West doorway X in [-60..-44] (center x = -52, guarded by Main Rune Gate #1 `gate_s5_0`)
    { x: -78, z: 136, w: 36, d: 4.5 },
    { x: 26, z: 136, w: 140, d: 4.5 },
    // Band 2 (Z in [90..136]): Secret Room 2 partition + narrow winding corridors
    { x: 74, z: 124, w: 4, d: 18 }, // Secret Room 2 West partition (X = 74, Z in [115..133])
    { x: -32, z: 120, w: 4.5, d: 28 },
    { x: 0, z: 106, w: 4.5, d: 28 },
    { x: 44, z: 120, w: 4.5, d: 28 },
    // Row 3 (z = 90): 16m Center-East doorway X in [16..32] (center x = 24)
    { x: -40, z: 90, w: 112, d: 4.5 },
    { x: 64, z: 90, w: 64, d: 4.5 },
    // Band 3 (Z in [44..90]): Secret Room 3 partition + 16m Spike Chute #2 (X in [16..32]) + Lake Wing divider
    { x: -74, z: 78, w: 4, d: 18 }, // Secret Room 3 East partition (X = -74, Z in [69..87])
    { x: 14, z: 74, w: 4.5, d: 28 },
    { x: 34, z: 74, w: 4.5, d: 28 },
    { x: -16, z: 60, w: 4.5, d: 28 },
    // Row 4 (z = 44): 16m West-Center doorway X in [-48..-32] (center x = -40)
    { x: -72, z: 44, w: 48, d: 4.5 },
    { x: 32, z: 44, w: 128, d: 4.5 },
    // Band 4 (Z in [-4..44]): Multi-forked narrow labyrinth
    { x: -20, z: 28, w: 4.5, d: 28 },
    { x: 12, z: 12, w: 4.5, d: 28 },
    { x: 40, z: 28, w: 4.5, d: 28 },
    // Row 5 (z = -4): 16m East doorway X in [52..68] (center x = 60, guarded by Main Rune Gate #2 `gate_s5_1`)
    { x: -22, z: -4, w: 148, d: 4.5 },
    { x: 82, z: -4, w: 28, d: 4.5 },
    // Band 5 (Z in [-52..-4]): Secret Room 4 partition + 16m Spike Chute #3 (X in [52..68]) + maze dividers
    { x: -74, z: -16, w: 4, d: 18 }, // Secret Room 4 East partition (X = -74, Z in [-25..-7])
    { x: 50, z: -20, w: 4.5, d: 28 },
    { x: 70, z: -20, w: 4.5, d: 28 },
    { x: 16, z: -36, w: 4.5, d: 28 },
    { x: -20, z: -20, w: 4.5, d: 28 },
    // Row 6 (z = -52): 16m West doorway X in [-60..-44] (center x = -52)
    { x: -78, z: -52, w: 36, d: 4.5 },
    { x: 26, z: -52, w: 140, d: 4.5 },
    // Band 6 (Z in [-102..-52]): Secret Room 5 partition + 16m Spike Chute #4 (X in [-60..-44]) + maze dividers
    { x: 74, z: -64, w: 4, d: 18 }, // Secret Room 5 West partition (X = 74, Z in [-73..-55])
    { x: -62, z: -68, w: 4.5, d: 28 },
    { x: -42, z: -68, w: 4.5, d: 28 },
    { x: -8, z: -86, w: 4.5, d: 28 },
    { x: 24, z: -68, w: 4.5, d: 28 },
    // Row 7 (z = -102): 16m Center-East doorway X in [36..52] (center x = 44, guarded by Main Rune Gate #3 `gate_s5_2`)
    { x: -30, z: -102, w: 132, d: 4.5 },
    { x: 74, z: -102, w: 44, d: 4.5 },
    // Band 7 (Z in [-156..-102]): Deep Catacomb maze dividers
    { x: 20, z: -118, w: 4.5, d: 28 },
    { x: -20, z: -140, w: 4.5, d: 28 },
    { x: 64, z: -140, w: 4.5, d: 28 },
    // Row 8 (z = -156): Final 16m Sanctum Archway X in [-8..+8] (center x = 0)
    { x: -52, z: -156, w: 88, d: 4.5 },
    { x: 52, z: -156, w: 88, d: 4.5 },
  ];
  const wallSpecs5: WallSpec[] = [
    { x: -halfWidth5, z: 0, w: 4, d: halfLength5 * 2 },
    { x: halfWidth5, z: 0, w: 4, d: halfLength5 * 2 },
    { x: 0, z: halfLength5, w: halfWidth5 * 2 + 4, d: 4 },
    { x: 0, z: -halfLength5, w: halfWidth5 * 2 + 4, d: 4 },
    ...mazeWalls5,
  ];
  const wallBoxes5 = wallSpecs5.map((ws) => ({
    minX: ws.x - ws.w / 2 - 0.85,
    maxX: ws.x + ws.w / 2 + 0.85,
    minZ: ws.z - ws.d / 2 - 0.85,
    maxZ: ws.z + ws.d / 2 + 0.85,
  }));
  return {
    stage,
    halfWidth: halfWidth5,
    halfLength: halfLength5,
    startX: startX5,
    startZ: startZ5,
    goalZ: goalZ5,
    wallSpecs: wallSpecs5,
    wallBoxes: wallBoxes5,
    floorTraps,
    laserTraps,
    spikeTrapZones,
    chests,
    runeGates,
    waterLake,
  };
}

/**
 * Checks if a 2D line segment from (x0, z0) to (x1, z1) intersects any WallBox (expanded by projectile radius).
 * Used so neither player spells nor enemy/boss projectiles can shoot through walls!
 */
export function segmentHitsWall(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  walls: WallBox[],
  radius = 0.2
): boolean {
  const dx = x1 - x0;
  const dz = z1 - z0;

  for (let i = 0; i < walls.length; i++) {
    const b = walls[i];
    const minX = b.minX + 0.55 - radius;
    const maxX = b.maxX - 0.55 + radius;
    const minZ = b.minZ + 0.55 - radius;
    const maxZ = b.maxZ - 0.55 + radius;

    let tmin = 0;
    let tmax = 1;

    if (Math.abs(dx) < 1e-8) {
      if (x0 < minX || x0 > maxX) continue;
    } else {
      const invDx = 1 / dx;
      let t1 = (minX - x0) * invDx;
      let t2 = (maxX - x0) * invDx;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }

    if (Math.abs(dz) < 1e-8) {
      if (z0 < minZ || z0 > maxZ) continue;
    } else {
      const invDz = 1 / dz;
      let t1 = (minZ - z0) * invDz;
      let t2 = (maxZ - z0) * invDz;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }

    return true;
  }

  return false;
}

/**
 * Verifies via BFS grid pathfinding that a player can walk continuously from (startX, startZ) to (0, goalZ)
 * on the given Labyrinth stage without being blocked by any wall.
 */
export function isLabyrinthStageTraversable(stage: 1 | 2 | 3 | 4 | 5): boolean {
  const layout = getLabyrinthStageLayout(stage);
  const step = 4; // 4m grid resolution
  const isBlocked = (x: number, z: number) => {
    for (const b of layout.wallBoxes) {
      if (x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ) {
        return true;
      }
    }
    return false;
  };

  const sx = Math.round(layout.startX / step) * step;
  const sz = Math.round(layout.startZ / step) * step;
  const startKey = `${sx},${sz}`;
  const visited = new Set<string>([startKey]);
  const queue: Array<{ x: number; z: number }> = [{ x: sx, z: sz }];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (Math.hypot(curr.x - 0, curr.z - layout.goalZ) <= step * 1.5) {
      return true;
    }

    const dirs = [
      { dx: step, dz: 0 },
      { dx: -step, dz: 0 },
      { dx: 0, dz: step },
      { dx: 0, dz: -step },
    ];
    for (const d of dirs) {
      const nx = curr.x + d.dx;
      const nz = curr.z + d.dz;
      if (
        nx < -layout.halfWidth + 2 ||
        nx > layout.halfWidth - 2 ||
        nz < -layout.halfLength + 2 ||
        nz > layout.halfLength - 2
      ) {
        continue;
      }
      const key = `${nx},${nz}`;
      if (visited.has(key)) continue;
      if (
        !isBlocked(nx, nz) &&
        !segmentHitsWall(curr.x, curr.z, nx, nz, layout.wallBoxes, 0.4)
      ) {
        visited.add(key);
        queue.push({ x: nx, z: nz });
      }
    }
  }

  return false;
}

/**
 * Checks if player has enough reagents to craft an equipment item and returns updated inventory.
 */
export function canCraftEquipment(
  equipmentId: EquipmentId,
  inventory: Record<ReagentId, number>
): boolean {
  const equip = EQUIPMENT_CATALOG[equipmentId];
  if (!equip) return false;
  for (const [reagentId, required] of Object.entries(equip.recipe)) {
    const have = inventory[reagentId as ReagentId] || 0;
    if (have < (required || 0)) return false;
  }
  return true;
}

export function craftEquipmentItem(
  equipmentId: EquipmentId,
  inventory: Record<ReagentId, number>,
  ownedEquipment: EquipmentId[]
): {
  success: boolean;
  updatedInventory: Record<ReagentId, number>;
  updatedOwned: EquipmentId[];
} {
  if (ownedEquipment.includes(equipmentId)) {
    return {
      success: true,
      updatedInventory: { ...inventory },
      updatedOwned: [...ownedEquipment],
    };
  }
  if (!canCraftEquipment(equipmentId, inventory)) {
    return {
      success: false,
      updatedInventory: { ...inventory },
      updatedOwned: [...ownedEquipment],
    };
  }
  const equip = EQUIPMENT_CATALOG[equipmentId];
  const nextInv = { ...inventory };
  for (const [reagentId, required] of Object.entries(equip.recipe)) {
    nextInv[reagentId as ReagentId] = Math.max(
      0,
      (nextInv[reagentId as ReagentId] || 0) - (required || 0)
    );
  }
  return {
    success: true,
    updatedInventory: nextInv,
    updatedOwned: [...ownedEquipment, equipmentId],
  };
}

/**
 * Total count of all resources currently in the player's inventory.
 */
export function getTotalReagentCount(inventory: Record<ReagentId, number>): number {
  let sum = 0;
  for (const k of Object.keys(REAGENTS) as ReagentId[]) {
    sum += inventory[k] || 0;
  }
  return sum;
}

/**
 * Steeper Progressive Spell Upgrade Cost (Levels 1 -> 6):
 * - L1 -> L2: 4 ресурса
 * - L2 -> L3: 8 ресурсов
 * - L3 -> L4 (Открывает 2 снаряда!): 14 ресурсов (в т.ч. минимум 2 трофея неба: Сердце Горгульи или Перо Гарпии)
 * - L4 -> L5 (КД 3.0с!): 22 ресурса (в т.ч. минимум 3 трофея неба и 2 редких ядра/чешуи)
 * - L5 -> L6 (Пробуждение Стихий 6 ур.!): 30 ресурсов (в т.ч. минимум 3 эссенции стихий 4-го уровня: Огненная, Водная или Каменное ядро)
 */
export function getSpellUpgradeCost(currentLevel: number): {
  totalResources: number;
  requiresFlyingReagent: boolean;
  minFlyingReagents: number;
  requiresEliteReagent: boolean;
  minEliteReagents: number;
  requiresElementalReagent: boolean;
  minElementalReagents: number;
  label: string;
} {
  if (currentLevel <= 1) {
    return {
      totalResources: 4,
      requiresFlyingReagent: false,
      minFlyingReagents: 0,
      requiresEliteReagent: false,
      minEliteReagents: 0,
      requiresElementalReagent: false,
      minElementalReagents: 0,
      label: '4 ресурса',
    };
  }
  if (currentLevel === 2) {
    return {
      totalResources: 8,
      requiresFlyingReagent: false,
      minFlyingReagents: 0,
      requiresEliteReagent: false,
      minEliteReagents: 0,
      requiresElementalReagent: false,
      minElementalReagents: 0,
      label: '8 ресурсов',
    };
  }
  if (currentLevel === 3) {
    return {
      totalResources: 14,
      requiresFlyingReagent: true,
      minFlyingReagents: 2,
      requiresEliteReagent: false,
      minEliteReagents: 0,
      requiresElementalReagent: false,
      minElementalReagents: 0,
      label: '14 ресурсов (в т.ч. 2 трофея неба)',
    };
  }
  if (currentLevel === 4) {
    return {
      totalResources: 22,
      requiresFlyingReagent: true,
      minFlyingReagents: 3,
      requiresEliteReagent: true,
      minEliteReagents: 2,
      requiresElementalReagent: false,
      minElementalReagents: 0,
      label: '22 ресурса (в т.ч. 3 трофея неба и 2 ядра/чешуи)',
    };
  }
  return {
    totalResources: 30,
    requiresFlyingReagent: false,
    minFlyingReagents: 0,
    requiresEliteReagent: true,
    minEliteReagents: 2,
    requiresElementalReagent: true,
    minElementalReagents: 3,
    label: '30 ресурсов (в т.ч. 3 эссенции стихий 4-го ур. и 2 ядра/чешуи)',
  };
}

export function canAffordSpellUpgrade(
  currentLevel: number,
  inventory: Record<ReagentId, number>
): boolean {
  if (currentLevel >= MAX_SPELL_LEVEL) return false;
  const cost = getSpellUpgradeCost(currentLevel);
  const total = getTotalReagentCount(inventory);
  if (total < cost.totalResources) return false;

  if (cost.minFlyingReagents > 0) {
    const flyingCount = (inventory.gargoyle_heart || 0) + (inventory.harpy_feather || 0);
    if (flyingCount < cost.minFlyingReagents) return false;
  }
  if (cost.minEliteReagents > 0) {
    const eliteCount = (inventory.ice_dragon_scale || 0) + (inventory.dark_core_shard || 0);
    if (eliteCount < cost.minEliteReagents) return false;
  }
  if (cost.minElementalReagents > 0) {
    const elemCount =
      (inventory.fire_essence || 0) +
      (inventory.water_essence || 0) +
      (inventory.earth_essence || 0);
    if (elemCount < cost.minElementalReagents) return false;
  }
  return true;
}

export function consumeSpellUpgradeCost(
  currentLevel: number,
  inventory: Record<ReagentId, number>
): Record<ReagentId, number> {
  const cost = getSpellUpgradeCost(currentLevel);
  const next = { ...inventory };
  let remaining = cost.totalResources;

  let elemNeeded = cost.minElementalReagents;
  while (elemNeeded > 0 && remaining > 0) {
    if ((next.fire_essence || 0) > 0) {
      next.fire_essence -= 1;
      remaining -= 1;
      elemNeeded -= 1;
    } else if ((next.water_essence || 0) > 0) {
      next.water_essence -= 1;
      remaining -= 1;
      elemNeeded -= 1;
    } else if ((next.earth_essence || 0) > 0) {
      next.earth_essence -= 1;
      remaining -= 1;
      elemNeeded -= 1;
    } else {
      break;
    }
  }

  let flyingNeeded = cost.minFlyingReagents;
  while (flyingNeeded > 0 && remaining > 0) {
    if ((next.gargoyle_heart || 0) > 0) {
      next.gargoyle_heart -= 1;
      remaining -= 1;
      flyingNeeded -= 1;
    } else if ((next.harpy_feather || 0) > 0) {
      next.harpy_feather -= 1;
      remaining -= 1;
      flyingNeeded -= 1;
    } else {
      break;
    }
  }

  let eliteNeeded = cost.minEliteReagents;
  while (eliteNeeded > 0 && remaining > 0) {
    if ((next.dark_core_shard || 0) > 0) {
      next.dark_core_shard -= 1;
      remaining -= 1;
      eliteNeeded -= 1;
    } else if ((next.ice_dragon_scale || 0) > 0) {
      next.ice_dragon_scale -= 1;
      remaining -= 1;
      eliteNeeded -= 1;
    } else {
      break;
    }
  }

  const spendOrder: ReagentId[] = [
    'mandrake_root',
    'ancient_wood',
    'rat_hair',
    'gargoyle_heart',
    'harpy_feather',
    'dark_core_shard',
    'ice_dragon_scale',
    'fire_essence',
    'water_essence',
    'earth_essence',
  ];

  for (const rId of spendOrder) {
    while (remaining > 0 && (next[rId] || 0) > 0) {
      next[rId] -= 1;
      remaining -= 1;
    }
  }

  return next;
}

/**
 * Steeper Progressive Pet Training Step Cost (3 steps per level):
 * - Pet Level 1: 4 ресурса за шаг (12 за уровень)
 * - Pet Level 2: 7 ресурсов за шаг (21 за уровень)
 * - Pet Level 3: 11 ресурсов за шаг (в т.ч. 1 трофей летающего врага)
 * - Pet Level 4: 16 ресурсов за шаг (в т.ч. 2 трофея летающего врага и 1 ядро/чешуя)
 */
export function getPetTrainingStepCost(petLevel: number): {
  totalResources: number;
  requiresFlyingReagent: boolean;
  minFlyingReagents: number;
  minEliteReagents: number;
  label: string;
} {
  if (petLevel <= 1) {
    return {
      totalResources: 4,
      requiresFlyingReagent: false,
      minFlyingReagents: 0,
      minEliteReagents: 0,
      label: '4 ресурса',
    };
  }
  if (petLevel === 2) {
    return {
      totalResources: 7,
      requiresFlyingReagent: false,
      minFlyingReagents: 0,
      minEliteReagents: 0,
      label: '7 ресурсов',
    };
  }
  if (petLevel === 3) {
    return {
      totalResources: 11,
      requiresFlyingReagent: true,
      minFlyingReagents: 1,
      minEliteReagents: 0,
      label: '11 ресурсов (в т.ч. 1 трофей неба)',
    };
  }
  return {
    totalResources: 16,
    requiresFlyingReagent: true,
    minFlyingReagents: 2,
    minEliteReagents: 1,
    label: '16 ресурсов (в т.ч. 2 трофея неба и 1 ядро/чешуя)',
  };
}

export function canAffordPetTrainingStep(
  petLevel: number,
  inventory: Record<ReagentId, number>
): boolean {
  if (petLevel >= 5) return false;
  const cost = getPetTrainingStepCost(petLevel);
  if (getTotalReagentCount(inventory) < cost.totalResources) return false;
  if (cost.minFlyingReagents > 0) {
    const flyingCount = (inventory.gargoyle_heart || 0) + (inventory.harpy_feather || 0);
    if (flyingCount < cost.minFlyingReagents) return false;
  }
  if (cost.minEliteReagents > 0) {
    const eliteCount = (inventory.dark_core_shard || 0) + (inventory.ice_dragon_scale || 0);
    if (eliteCount < cost.minEliteReagents) return false;
  }
  return true;
}

export function consumePetTrainingStepCost(
  petLevel: number,
  inventory: Record<ReagentId, number>
): Record<ReagentId, number> {
  const cost = getPetTrainingStepCost(petLevel);
  const next = { ...inventory };
  let remaining = cost.totalResources;

  let flyingNeeded = cost.minFlyingReagents;
  while (flyingNeeded > 0 && remaining > 0) {
    if ((next.gargoyle_heart || 0) > 0) {
      next.gargoyle_heart -= 1;
      remaining -= 1;
      flyingNeeded -= 1;
    } else if ((next.harpy_feather || 0) > 0) {
      next.harpy_feather -= 1;
      remaining -= 1;
      flyingNeeded -= 1;
    } else {
      break;
    }
  }

  let eliteNeeded = cost.minEliteReagents;
  while (eliteNeeded > 0 && remaining > 0) {
    if ((next.dark_core_shard || 0) > 0) {
      next.dark_core_shard -= 1;
      remaining -= 1;
      eliteNeeded -= 1;
    } else if ((next.ice_dragon_scale || 0) > 0) {
      next.ice_dragon_scale -= 1;
      remaining -= 1;
      eliteNeeded -= 1;
    } else {
      break;
    }
  }

  const spendOrder: ReagentId[] = [
    'mandrake_root',
    'rat_hair',
    'ancient_wood',
    'gargoyle_heart',
    'harpy_feather',
    'dark_core_shard',
    'ice_dragon_scale',
  ];

  for (const rId of spendOrder) {
    while (remaining > 0 && (next[rId] || 0) > 0) {
      next[rId] -= 1;
      remaining -= 1;
    }
  }

  return next;
}

/**
 * Advances quest progress for matching eventType(s) without auto-claiming rewards.
 * Returns updated quests array and any quests that just reached completion (`completed: true, claimed: false`).
 */
export function advanceQuestProgress(
  quests: QuestDef[],
  events: Array<{ type: QuestEventType; amount?: number }>
): {
  updatedQuests: QuestDef[];
  newlyCompleted: QuestDef[];
} {
  const newlyCompleted: QuestDef[] = [];
  const updatedQuests = quests.map((q) => {
    if (q.completed) return q;
    let delta = 0;
    for (const ev of events) {
      if (q.eventType === ev.type) {
        delta += ev.amount ?? 1;
      }
    }
    if (delta <= 0) return q;

    const nextCount = Math.min(q.targetCount, q.currentCount + delta);
    const nowCompleted = nextCount >= q.targetCount;
    const updated: QuestDef = {
      ...q,
      currentCount: nextCount,
      completed: nowCompleted,
    };
    if (nowCompleted && !q.completed) {
      newlyCompleted.push(updated);
    }
    return updated;
  });

  return { updatedQuests, newlyCompleted };
}

/**
 * Claims a completed, unclaimed quest and returns the updated quests list, updated inventory, and stat bonuses.
 */
export function claimQuestReward(
  quests: QuestDef[],
  questId: string,
  inventory: Record<ReagentId, number>
): {
  claimedQuest: QuestDef | null;
  updatedQuests: QuestDef[];
  updatedInventory: Record<ReagentId, number>;
  rewardXp: number;
  rewardMaxHp: number;
  rewardMaxMp: number;
} {
  const target = quests.find((q) => q.id === questId);
  if (!target || !target.completed || target.claimed) {
    return {
      claimedQuest: null,
      updatedQuests: quests,
      updatedInventory: inventory,
      rewardXp: 0,
      rewardMaxHp: 0,
      rewardMaxMp: 0,
    };
  }

  const nextInv = { ...inventory };
  if (target.rewardReagent) {
    const rId = target.rewardReagent.id;
    nextInv[rId] = (nextInv[rId] || 0) + target.rewardReagent.count;
  }
  if (target.rewardReagents) {
    for (const [rId, qty] of Object.entries(target.rewardReagents)) {
      if (qty && qty > 0) {
        nextInv[rId as ReagentId] = (nextInv[rId as ReagentId] || 0) + qty;
      }
    }
  }

  const claimedQuest: QuestDef = { ...target, claimed: true };
  const updatedQuests = quests.map((q) => (q.id === questId ? claimedQuest : q));

  return {
    claimedQuest,
    updatedQuests,
    updatedInventory: nextInv,
    rewardXp: target.rewardXp,
    rewardMaxHp: target.rewardMaxHp || 0,
    rewardMaxMp: target.rewardMaxMp || 0,
  };
}

/**
 * Explosive Red Barrel damage calculation:
 * Strongly scales with the power of the `Тяни` (Wingardium Leviosa) spell used to throw it!
 * - Quick cast (`wingardiumDamage` ~2..3): ~50 AoE damage
 * - Voice cast (`wingardiumDamage` ~10..18): ~67..85 AoE damage
 * - High-accuracy drawn cast (`wingardiumDamage` ~30..50+): ~111..155+ AoE damage
 */
export function calculateExplosiveBarrelDamage(wingardiumDamage: number): number {
  const safeBase = Math.max(2, wingardiumDamage);
  return Math.round(45 + safeBase * 2.25);
}

/**
 * Campfire Drawing Templates for brewing Potions and cooking Rat Meat:
 * - `health_potion`: Alchemical Flask (горлышко и круглая колба)
 * - `mana_potion`: Arcane Drop / Star Crystal (капля эфира)
 * - `rat_food`: Roasting Skewer Wave / Flame Silhouette (жарка на вертеле)
 */
export const CRAFT_DRAW_TEMPLATES: Record<
  CampfireRecipeId,
  {
    id: CampfireRecipeId;
    title: string;
    subtitle: string;
    gestureLabel: string;
    color: string;
    costLabel: string;
    cost: Partial<Record<ReagentId, number>>;
    points: Point2D[];
  }
> = {
  health_potion: {
    id: 'health_potion',
    title: 'Зелье Здоровья',
    subtitle: 'Восстанавливает от 10 до 50 ОЗ в зависимости от точности рисунка колбы',
    gestureLabel: 'Колба Жизни (⚗)',
    color: '#ef4444',
    costLabel: '1 Корень мандрагоры',
    cost: { mandrake_root: 1 },
    points: [
      { x: 0.42, y: 0.14 },
      { x: 0.42, y: 0.34 },
      { x: 0.18, y: 0.68 },
      { x: 0.28, y: 0.86 },
      { x: 0.72, y: 0.86 },
      { x: 0.82, y: 0.68 },
      { x: 0.58, y: 0.34 },
      { x: 0.58, y: 0.14 },
      { x: 0.42, y: 0.14 },
    ],
  },
  mana_potion: {
    id: 'mana_potion',
    title: 'Зелье Маны',
    subtitle: 'Восстанавливает от 10 до 50 МП в зависимости от точности рисунка капли эфира',
    gestureLabel: 'Капля Эфира (💧)',
    color: '#38bdf8',
    costLabel: '1 Корень мандрагоры',
    cost: { mandrake_root: 1 },
    points: [
      { x: 0.5, y: 0.12 },
      { x: 0.22, y: 0.58 },
      { x: 0.32, y: 0.84 },
      { x: 0.5, y: 0.9 },
      { x: 0.68, y: 0.84 },
      { x: 0.78, y: 0.58 },
      { x: 0.5, y: 0.12 },
    ],
  },
  rat_food: {
    id: 'rat_food',
    title: 'Жареная Крыса на Костре',
    subtitle: 'Дает +10..50 Макс. ОЗ и +0.1..0.5 ОЗ/с на 1–5 минут от точности прорисовки',
    gestureLabel: 'Вертел Жарки (🍖)',
    color: '#f97316',
    costLabel: '2 Тушки теневой крысы',
    cost: { rat_meat: 2 },
    points: [
      { x: 0.14, y: 0.72 },
      { x: 0.28, y: 0.32 },
      { x: 0.5, y: 0.24 },
      { x: 0.72, y: 0.32 },
      { x: 0.86, y: 0.72 },
      { x: 0.5, y: 0.82 },
      { x: 0.14, y: 0.72 },
    ],
  },
  boar_food: {
    id: 'boar_food',
    title: 'Жаркое из Дикого Кабана (3–4 ур.)',
    subtitle: 'Сытная еда на ОЗ: +25..80 Макс. ОЗ и +0.3..0.9 ОЗ/с на 1.5–6 мин. от точности рисунка',
    gestureLabel: 'Королевский Окорок (🐗)',
    color: '#ea580c',
    costLabel: '2 Мяса дикого кабана',
    cost: { boar_meat: 2 },
    points: [
      { x: 0.16, y: 0.62 },
      { x: 0.24, y: 0.26 },
      { x: 0.52, y: 0.16 },
      { x: 0.82, y: 0.34 },
      { x: 0.86, y: 0.66 },
      { x: 0.52, y: 0.84 },
      { x: 0.16, y: 0.62 },
    ],
  },
  bear_food: {
    id: 'bear_food',
    title: 'Царское Жаркое из Медвежатины (5 ур.)',
    subtitle: 'Лучшая еда в игре: +45..120 Макс. ОЗ и +0.6..1.6 ОЗ/с на 2–7 мин. от точности рисунка!',
    gestureLabel: 'Медвежий Стейк (🐻)',
    color: '#d97706',
    costLabel: '2 Медвежатины (с 5 ур.)',
    cost: { bear_meat: 2 },
    points: [
      { x: 0.20, y: 0.76 },
      { x: 0.14, y: 0.42 },
      { x: 0.34, y: 0.18 },
      { x: 0.66, y: 0.18 },
      { x: 0.86, y: 0.42 },
      { x: 0.80, y: 0.76 },
      { x: 0.50, y: 0.86 },
      { x: 0.20, y: 0.76 },
    ],
  },
  bat_food: {
    id: 'bat_food',
    title: 'Еда на Ману: Мышь + Вода Глубин',
    subtitle: 'С Водой 4 ур. + Сырым мясом мыши дает +25..80 Макс. МП и +0.3..0.9 МП/с (или из 2 мышей: +10..50 МП)',
    gestureLabel: 'Крылья и Поток (🦇💧)',
    color: '#818cf8',
    costLabel: '1 Сырое мясо мыши + 1 Вода 4 ур. (или 2 мыши)',
    cost: { bat_meat: 1, water_essence: 1 },
    points: [
      { x: 0.12, y: 0.58 },
      { x: 0.26, y: 0.24 },
      { x: 0.42, y: 0.48 },
      { x: 0.5, y: 0.28 },
      { x: 0.58, y: 0.48 },
      { x: 0.74, y: 0.24 },
      { x: 0.88, y: 0.58 },
      { x: 0.5, y: 0.78 },
      { x: 0.12, y: 0.58 },
    ],
  },
};

/**
 * Evaluates a player's drawing on the Campfire Alchemy/Cooking canvas (`0..100%`).
 */
export function evaluateCampfireCraftDrawing(
  drawnPoints: Point2D[],
  recipeId: CampfireRecipeId,
  gestureMasteryBonus = 0
): { accuracy: number; completionRatio: number } {
  const tpl = CRAFT_DRAW_TEMPLATES[recipeId];
  if (!tpl || drawnPoints.length < 3) {
    return { accuracy: 0, completionRatio: 0 };
  }

  const templateResampled = resamplePath(tpl.points, 32);
  const { normalized: templateNorm, pathLength: templateLen } = normalizePath(templateResampled);

  const { normalized: drawnNormRaw, pathLength: rawLen } = normalizePath(drawnPoints);
  const drawnResampled = resamplePath(drawnNormRaw, 32);
  const { pathLength: drawnNormLen } = normalizePath(drawnResampled);

  const expectedNormLen = Math.max(1.15, templateLen * 0.8);
  const rawSpanFactor = rawLen > 1.5 ? Math.min(1, rawLen / 85) : Math.min(1, rawLen / 0.8);
  const completionRatio = Math.min(
    1,
    Math.max(0.15, Math.min(drawnNormLen / expectedNormLen, rawSpanFactor))
  );

  let distForward = 0;
  let distReverse = 0;
  const n = 32;
  for (let i = 0; i < n; i++) {
    distForward += Math.hypot(
      drawnResampled[i].x - templateNorm[i].x,
      drawnResampled[i].y - templateNorm[i].y
    );
    distReverse += Math.hypot(
      drawnResampled[n - 1 - i].x - templateNorm[i].x,
      drawnResampled[n - 1 - i].y - templateNorm[i].y
    );
  }

  const avgDist = Math.min(distForward, distReverse) / n;
  const rawShapeScore = Math.max(0.08, 1 - avgDist * 2.05);
  const combined = rawShapeScore * (0.3 + 0.7 * completionRatio) * 100 + gestureMasteryBonus;
  const accuracy = Math.round(Math.min(100, Math.max(0, combined)));

  return {
    accuracy,
    completionRatio: Number(completionRatio.toFixed(2)),
  };
}

/**
 * Calculates Health or Mana Potion restore amount (`10..50`) from drawing accuracy (`0..100%`).
 */
export function calculateCraftedPotionStats(
  kind: 'health' | 'mana',
  accuracyPercent: number
): CraftedPotionItem {
  const clamped = Math.max(0, Math.min(100, accuracyPercent));
  const restoreAmount = Math.round(10 + (clamped / 100) * 40);
  return {
    id: `pot_${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    kind,
    name: kind === 'health' ? `Зелье Здоровья (+${restoreAmount} ОЗ)` : `Зелье Маны (+${restoreAmount} МП)`,
    restoreAmount,
    accuracyPercent: Math.round(clamped),
  };
}

/**
 * Calculates Cooked Rat Food buff stats from drawing accuracy (`0..100%`):
 * - Requires 2 raw rat meat (`rat_meat: 2`)
 * - `bonusMaxHp`: 10 to 50 Max HP
 * - `hpRegenPerSec`: 0.1 to 0.5 HP/sec
 * - `durationSec`: 60 to 300 seconds (1 to 5 minutes)
 */
export function calculateCookedRatFoodStats(accuracyPercent: number): CookedRatFoodItem {
  const clamped = Math.max(0, Math.min(100, accuracyPercent));
  const ratio = clamped / 100;
  const bonusMaxHp = Math.round(10 + ratio * 40);
  const hpRegenPerSec = Number((0.1 + ratio * 0.4).toFixed(2));
  const durationSec = Math.round(60 + ratio * 240);
  return {
    id: `food_rat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: `Жареная крыса (+${bonusMaxHp} ОЗ, +${hpRegenPerSec}/с)`,
    bonusMaxHp,
    hpRegenPerSec,
    durationSec,
    accuracyPercent: Math.round(clamped),
  };
}

/**
 * Calculates Cooked Boar Food (`Жаркое из дикого кабана`) buff stats from drawing accuracy (`0..100%`):
 * - Requires 2 raw wild boar meat (`boar_meat: 2`) from Stages 3-4
 * - `bonusMaxHp`: 25 to 80 Max HP (significantly stronger than Rat Food!)
 * - `hpRegenPerSec`: 0.3 to 0.9 HP/sec
 * - `durationSec`: 90 to 360 seconds (1.5 to 6 minutes)
 */
export function calculateCookedBoarFoodStats(accuracyPercent: number): CookedBoarFoodItem {
  const clamped = Math.max(0, Math.min(100, accuracyPercent));
  const ratio = clamped / 100;
  const bonusMaxHp = Math.round(25 + ratio * 55);
  const hpRegenPerSec = Number((0.3 + ratio * 0.6).toFixed(2));
  const durationSec = Math.round(90 + ratio * 270);
  return {
    id: `food_boar_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: `Жаркое из кабана (+${bonusMaxHp} ОЗ, +${hpRegenPerSec}/с)`,
    bonusMaxHp,
    hpRegenPerSec,
    durationSec,
    accuracyPercent: Math.round(clamped),
  };
}

/**
 * Calculates Cooked Bear Food (`Царское Жаркое из Медвежатины`) buff stats from drawing accuracy (`0..100%`):
 * - Requires 2 raw cave bear meat (`bear_meat: 2`) from Stage 5 Cave Bears
 * - `bonusMaxHp`: 45 to 120 Max HP (strongest health food in the game!)
 * - `hpRegenPerSec`: 0.6 to 1.6 HP/sec
 * - `durationSec`: 120 to 420 seconds (2 to 7 minutes)
 */
export function calculateCookedBearFoodStats(accuracyPercent: number): CookedBearFoodItem {
  const clamped = Math.max(0, Math.min(100, accuracyPercent));
  const ratio = clamped / 100;
  const bonusMaxHp = Math.round(45 + ratio * 75);
  const hpRegenPerSec = Number((0.6 + ratio * 1.0).toFixed(2));
  const durationSec = Math.round(120 + ratio * 300);
  return {
    id: `food_bear_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: `Жаркое из медвежатины (+${bonusMaxHp} ОЗ, +${hpRegenPerSec}/с)`,
    bonusMaxHp,
    hpRegenPerSec,
    durationSec,
    accuracyPercent: Math.round(clamped),
  };
}

/**
 * Calculates Cooked Bat Mana Food (`Еда на ману из сырого мяса мыши и воды`) buff stats from drawing accuracy (`0..100%`):
 * - When cooked with Stage 4 Water Essence + Raw Bat Meat (`withWaterEssence = true`):
 *   - `bonusMaxMp`: 25 to 80 Max Mana
 *   - `mpRegenPerSec`: 0.3 to 0.9 MP/sec
 *   - `durationSec`: 90 to 360 seconds (1.5 to 6 minutes)
 * - Standard 2 Bat Meat (`withWaterEssence = false`):
 *   - `bonusMaxMp`: 10 to 50 Max Mana
 *   - `mpRegenPerSec`: 0.1 to 0.5 MP/sec
 *   - `durationSec`: 60 to 300 seconds (1 to 5 minutes)
 */
export function calculateCookedBatFoodStats(
  accuracyPercent: number,
  withWaterEssence = false
): CookedBatFoodItem {
  const clamped = Math.max(0, Math.min(100, accuracyPercent));
  const ratio = clamped / 100;
  const bonusMaxMp = withWaterEssence
    ? Math.round(25 + ratio * 55)
    : Math.round(10 + ratio * 40);
  const mpRegenPerSec = withWaterEssence
    ? Number((0.3 + ratio * 0.6).toFixed(2))
    : Number((0.1 + ratio * 0.4).toFixed(2));
  const durationSec = withWaterEssence
    ? Math.round(90 + ratio * 270)
    : Math.round(60 + ratio * 240);
  return {
    id: `food_bat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: withWaterEssence
      ? `Мышь на Живой Воде (+${bonusMaxMp} МП, +${mpRegenPerSec}/с)`
      : `Жареная мышь (+${bonusMaxMp} МП, +${mpRegenPerSec}/с)`,
    bonusMaxMp,
    mpRegenPerSec,
    durationSec,
    accuracyPercent: Math.round(clamped),
  };
}

/**
 * Contextual Water & Snow Gestures:
 * 1. `snowflake`: Aiming at Water with Ice (`glacius` [2]) -> freezes part of the water into a Snow patch.
 * 2. `water_two_spheres`: Aiming at Water with Growth (`engorgio` [6]) -> Two spheres (1 larger bottom, 1 smaller top) -> summons Water Helper (`Водяной помощник`).
 * 3. `snow_three_spheres`: Aiming at Snow with Growth (`engorgio` [6]) -> Three stacked circles -> summons Snowman (`Снеговик`).
 */
export const CONTEXT_GESTURE_TEMPLATES: Record<
  ContextualGestureId,
  {
    id: ContextualGestureId;
    gestureName: string;
    shortHint: string;
    color: string;
    points: Point2D[];
  }
> = {
  snowflake: {
    id: 'snowflake',
    gestureName: 'Снежинка (❄)',
    shortHint: 'Нарисуйте Снежинку по воде, чтобы превратить часть воды в Снег!',
    color: '#38bdf8',
    points: [
      { x: 0.5, y: 0.12 },
      { x: 0.5, y: 0.88 },
      { x: 0.5, y: 0.5 },
      { x: 0.17, y: 0.31 },
      { x: 0.83, y: 0.69 },
      { x: 0.5, y: 0.5 },
      { x: 0.83, y: 0.31 },
      { x: 0.17, y: 0.69 },
    ],
  },
  water_two_spheres: {
    id: 'water_two_spheres',
    gestureName: 'Два Шарика: Водяной (💧)',
    shortHint: 'Два шарика (большой внизу и поменьше сверху) — призыв Водяного помощника (1–3 мин)',
    color: '#0ea5e9',
    points: [
      // Bottom larger sphere (center ~0.5, 0.68, radius ~0.22)
      { x: 0.5, y: 0.46 },
      { x: 0.72, y: 0.68 },
      { x: 0.5, y: 0.9 },
      { x: 0.28, y: 0.68 },
      { x: 0.5, y: 0.46 },
      // Top smaller sphere (center ~0.5, 0.29, radius ~0.15)
      { x: 0.65, y: 0.29 },
      { x: 0.5, y: 0.14 },
      { x: 0.35, y: 0.29 },
      { x: 0.5, y: 0.46 },
    ],
  },
  snow_three_spheres: {
    id: 'snow_three_spheres',
    gestureName: 'Три Кружка: Снеговик (⛄)',
    shortHint: 'Три кружка друг на друге — призыв Снеговика из снега (1–3 мин)',
    color: '#e0f2fe',
    points: [
      // Bottom large circle (center 0.5, 0.76, r=0.17)
      { x: 0.5, y: 0.59 },
      { x: 0.67, y: 0.76 },
      { x: 0.5, y: 0.93 },
      { x: 0.33, y: 0.76 },
      { x: 0.5, y: 0.59 },
      // Middle medium circle (center 0.5, 0.45, r=0.13)
      { x: 0.63, y: 0.45 },
      { x: 0.5, y: 0.32 },
      { x: 0.37, y: 0.45 },
      { x: 0.5, y: 0.59 },
      { x: 0.5, y: 0.32 },
      // Top head circle (center 0.5, 0.20, r=0.10)
      { x: 0.6, y: 0.2 },
      { x: 0.5, y: 0.1 },
      { x: 0.4, y: 0.2 },
      { x: 0.5, y: 0.32 },
    ],
  },
};

/**
 * Returns the active gesture template and name for the given spell and aimed surface (`'none' | 'water' | 'snow'`).
 */
export function getActiveSpellGestureInfo(
  spellId: SpellId,
  aimSurfaceTarget: AimSurfaceTarget
): {
  isContextual: boolean;
  contextId: ContextualGestureId | null;
  gestureName: string;
  templatePoints: Point2D[];
  color: string;
  hintText: string;
} {
  if (spellId === 'glacius' && aimSurfaceTarget === 'water') {
    const tpl = CONTEXT_GESTURE_TEMPLATES.snowflake;
    return {
      isContextual: true,
      contextId: 'snowflake',
      gestureName: tpl.gestureName,
      templatePoints: tpl.points,
      color: tpl.color,
      hintText: tpl.shortHint,
    };
  }
  if (spellId === 'engorgio' && aimSurfaceTarget === 'water') {
    const tpl = CONTEXT_GESTURE_TEMPLATES.water_two_spheres;
    return {
      isContextual: true,
      contextId: 'water_two_spheres',
      gestureName: tpl.gestureName,
      templatePoints: tpl.points,
      color: tpl.color,
      hintText: tpl.shortHint,
    };
  }
  if (spellId === 'engorgio' && aimSurfaceTarget === 'snow') {
    const tpl = CONTEXT_GESTURE_TEMPLATES.snow_three_spheres;
    return {
      isContextual: true,
      contextId: 'snow_three_spheres',
      gestureName: tpl.gestureName,
      templatePoints: tpl.points,
      color: tpl.color,
      hintText: tpl.shortHint,
    };
  }

  const baseSpell = SPELLS[spellId];
  return {
    isContextual: false,
    contextId: null,
    gestureName: baseSpell.gestureName,
    templatePoints: baseSpell.templatePoints,
    color: baseSpell.color,
    hintText:
      spellId === 'engorgio'
        ? 'Прицел мимо воды и снега — «Рост» автоматически увеличит вашего Котика/питомца!'
        : baseSpell.roleClue,
  };
}

/**
 * Evaluates a contextual gesture drawing (`snowflake`, `water_two_spheres`, or `snow_three_spheres`) (`0..100%`).
 */
export function evaluateContextualGesture(
  drawnPoints: Point2D[],
  contextId: ContextualGestureId,
  gestureMasteryBonus = 0
): { accuracy: number; completionRatio: number } {
  const tpl = CONTEXT_GESTURE_TEMPLATES[contextId];
  if (!tpl || drawnPoints.length < 3) {
    return { accuracy: 0, completionRatio: 0 };
  }

  const templateResampled = resamplePath(tpl.points, 36);
  const { normalized: templateNorm, pathLength: templateLen } = normalizePath(templateResampled);

  const { normalized: drawnNormRaw, pathLength: rawLen } = normalizePath(drawnPoints);
  const drawnResampled = resamplePath(drawnNormRaw, 36);
  const { pathLength: drawnNormLen } = normalizePath(drawnResampled);

  const expectedNormLen = Math.max(1.2, templateLen * 0.72);
  const rawSpanFactor = rawLen > 1.5 ? Math.min(1, rawLen / 85) : Math.min(1, rawLen / 0.8);
  const completionRatio = Math.min(
    1,
    Math.max(0.15, Math.min(drawnNormLen / expectedNormLen, rawSpanFactor))
  );

  let distForward = 0;
  let distReverse = 0;
  const n = 36;
  for (let i = 0; i < n; i++) {
    distForward += Math.hypot(
      drawnResampled[i].x - templateNorm[i].x,
      drawnResampled[i].y - templateNorm[i].y
    );
    distReverse += Math.hypot(
      drawnResampled[n - 1 - i].x - templateNorm[i].x,
      drawnResampled[n - 1 - i].y - templateNorm[i].y
    );
  }

  const avgDist = Math.min(distForward, distReverse) / n;
  const rawShapeScore = Math.max(0.1, 1 - avgDist * 1.95);
  const combined = rawShapeScore * (0.3 + 0.7 * completionRatio) * 100 + gestureMasteryBonus;
  const accuracy = Math.round(Math.min(100, Math.max(0, combined)));

  return {
    accuracy,
    completionRatio: Number(completionRatio.toFixed(2)),
  };
}

/**
 * Calculates summoned Elemental Ally stats (`Водяной помощник` or `Снеговик`):
 * - Duration scales from 30 seconds (0.5 min) to 150 seconds (2.5 min) based on drawing quality (`0..100%`) (-30s from 60..180s)!
 * - `water_spirit`: Ranged Water Helper (shoots water balls, base damage 6..12).
 * - `snowman`: Strictly Melee Snowman (`projectileSpeed: 0`, approaches enemies in melee and deals higher damage 12..22!).
 */
export function calculateElementalAllyStats(
  kind: ElementalAllyKind,
  accuracyPercent: number,
  spellLevel = 1
): ElementalAllyStats {
  const clampedAcc = Math.max(0, Math.min(100, accuracyPercent));
  const ratio = clampedAcc / 100;
  const durationSec = Math.round(
    ELEMENTAL_ALLY_MIN_DURATION_SEC +
      ratio * (ELEMENTAL_ALLY_MAX_DURATION_SEC - ELEMENTAL_ALLY_MIN_DURATION_SEC)
  );
  const levelMult = 1 + (Math.max(1, Math.min(5, spellLevel)) - 1) * 0.15;
  const baseDmg = kind === 'snowman' ? 12 : 6;
  const maxBonusDmg = kind === 'snowman' ? 10 : 6;
  const attackDamage = Math.round((baseDmg + ratio * maxBonusDmg) * levelMult);
  const attackInterval = Number(((kind === 'snowman' ? 1.65 : 2.1) - ratio * 0.4).toFixed(2));
  const projectileSpeed = kind === 'snowman' ? 0 : 26;

  return {
    kind,
    name: kind === 'water_spirit' ? 'Водяной Помощник' : 'Боевой Снеговик',
    durationSec,
    attackDamage,
    attackInterval,
    projectileSpeed,
    accuracyPercent: Math.round(clampedAcc),
  };
}

// ============================================================================
// MULTIPLAYER LABYRINTH MODES:
// 1. 'shared'   — Co-op on the SAME map with SHARED enemies & Boss + Friendly Fire!
// 2. 'parallel' — Parallel worlds (own enemies & Boss) + PvP magic interference!
// ============================================================================

export type LabyrinthMultiplayerMode = 'shared' | 'parallel';

export interface LabyrinthMultiplayerModeSpec {
  id: LabyrinthMultiplayerMode;
  title: string;
  shortBadge: string;
  subtitle: string;
  description: string;
  sharedEnemies: boolean;
  sharedBoss: boolean;
  sharedStageTransition: boolean;
  friendlyFireEnabled: boolean;
}

export const LABYRINTH_MULTIPLAYER_MODES: Record<
  LabyrinthMultiplayerMode,
  LabyrinthMultiplayerModeSpec
> = {
  shared: {
    id: 'shared',
    title: 'Совместный Лабиринт (Одна карта · Общие враги и Босс)',
    shortBadge: '🤝 Одна карта (Общие враги + Урон по своим)',
    subtitle: 'Убивайте одних врагов и Босса вместе · Стреляйте аккуратнее — урон по своим включён!',
    description:
      'Вы проходите Лабиринт вместе на одной общей карте: бьёте одних и тех же врагов и общего Босса. Друг друга тоже можно задеть магией, поэтому цельтесь аккуратнее в бою!',
    sharedEnemies: true,
    sharedBoss: true,
    sharedStageTransition: true,
    friendlyFireEnabled: true,
  },
  parallel: {
    id: 'parallel',
    title: 'Параллельный Лабиринт (Свои миры + PvP помехи)',
    shortBadge: '🌀 Свои миры (Свои враги + PvP магия)',
    subtitle: 'У каждого свои враги и Босс, но вы видите друг друга и можете мешать магией',
    description:
      'Каждый маг проходит Лабиринт в своём мире со своими врагами и Боссом, но вы видите друг друга на карте и можете бить друг друга заклинаниями и мешать прохождению.',
    sharedEnemies: false,
    sharedBoss: false,
    sharedStageTransition: false,
    friendlyFireEnabled: true,
  },
};

/**
 * Generates a deterministic enemy ID for a given stage and spawn index so all players
 * in 'shared' Labyrinth mode and the authoritative server refer to the exact same enemy.
 */
export function getDeterministicEnemyId(
  stageOrWave: number,
  idx: number,
  isArena = false
): string {
  return isArena
    ? `arena_w${stageOrWave}_enemy_${idx}`
    : `stage_${stageOrWave}_enemy_${idx}`;
}

/**
 * Idempotently reconciles local or remote damage to a shared enemy in 'shared' Labyrinth mode.
 * Guarantees that an enemy already at 0 HP never triggers duplicate kills/loot.
 */
export function reconcileSharedEnemyDamage(
  currentHp: number,
  maxHp: number,
  incomingDamage: number,
  authoritativeHp?: number
): {
  nextHp: number;
  damageApplied: number;
  isFirstKill: boolean;
} {
  const safeMax = Math.max(1, maxHp);
  if (currentHp <= 0) {
    return {
      nextHp: 0,
      damageApplied: 0,
      isFirstKill: false,
    };
  }

  const dmg = Math.max(0, Math.round(incomingDamage));
  const computedHp = Math.max(0, currentHp - dmg);
  const nextHp =
    typeof authoritativeHp === 'number' && !Number.isNaN(authoritativeHp)
      ? Math.max(0, Math.min(safeMax, Math.min(computedHp, Math.round(authoritativeHp))))
      : computedHp;

  return {
    nextHp,
    damageApplied: Math.max(0, currentHp - nextHp),
    isFirstKill: currentHp > 0 && nextHp <= 0,
  };
}

export interface AggroCandidatePlayer {
  id: string;
  x: number;
  z: number;
  hp: number;
}

/**
 * Selects the nearest living player (`hp > 0`) for an enemy or Boss to target.
 * In 'shared' Labyrinth mode, enemies dynamically aggro onto whichever wizard is closer!
 */
export function selectEnemyAggroTarget(
  enemyPos: { x: number; z: number },
  candidates: AggroCandidatePlayer[],
  maxRange = Infinity
): { target: AggroCandidatePlayer; distance: number } | null {
  let best: AggroCandidatePlayer | null = null;
  let bestDist = maxRange;

  for (const c of candidates) {
    if (c.hp <= 0) continue;
    const dist = Math.hypot(c.x - enemyPos.x, c.z - enemyPos.z);
    if (dist <= bestDist) {
      bestDist = dist;
      best = c;
    }
  }

  if (!best) return null;
  return { target: best, distance: bestDist };
}

/**
 * In Shared Co-op mode ('shared'), all Labyrinth enemies have +30% more Health and deal +20% more Damage!
 */
export const SHARED_COOP_ENEMY_HP_MULTIPLIER = 1.3;
export const SHARED_COOP_ENEMY_DAMAGE_MULTIPLIER = 1.2;

export function getScaledEnemyStatsForMode(
  baseHp: number,
  baseDamage: number,
  mode: LabyrinthMultiplayerMode,
  isLabyrinth = true
): { maxHp: number; damage: number } {
  if (!isLabyrinth || mode !== 'shared') {
    return {
      maxHp: Math.round(baseHp),
      damage: Math.round(baseDamage),
    };
  }
  return {
    maxHp: Math.round(baseHp * SHARED_COOP_ENEMY_HP_MULTIPLIER),
    damage: Math.round(baseDamage * SHARED_COOP_ENEMY_DAMAGE_MULTIPLIER),
  };
}

export type Stage5WormBossArchetype =
  | 'boss_worm_5_p1'
  | 'boss_worm_5_p2_fire'
  | 'boss_worm_5_p2_melee'
  | 'boss_worm_5_p3_fire_bomber'
  | 'boss_worm_5_p3_fire_pool'
  | 'boss_worm_5_p3_burrower'
  | 'boss_worm_5_p3_leech';

export function isStage5WormBossArchetype(archetype: string): archetype is Stage5WormBossArchetype {
  return (
    archetype === 'boss_worm_5_p1' ||
    archetype === 'boss_worm_5_p2_fire' ||
    archetype === 'boss_worm_5_p2_melee' ||
    archetype === 'boss_worm_5_p3_fire_bomber' ||
    archetype === 'boss_worm_5_p3_fire_pool' ||
    archetype === 'boss_worm_5_p3_burrower' ||
    archetype === 'boss_worm_5_p3_leech'
  );
}

/**
 * Returns the 2 child Worm Boss archetypes spawned when a Phase 1 or Phase 2 Worm Boss
 * drops to <= 30% HP (`WORM_SPLIT_HP_RATIO`):
 * - Phase 1 (`boss_worm_5_p1`, 100% HP) -> splits into 2 Medium Phase 2 Worm Bosses:
 *   1. `boss_worm_5_p2_fire` (Fire AoE pool burning 4s + 2s player burn + 3-fireball spit)
 *   2. `boss_worm_5_p2_melee` (Fast boar-like melee rusher + burrows 2s / fights 4s)
 * - Phase 2 Fire Worm (`boss_worm_5_p2_fire`) -> splits into 2 Small Phase 3 Fire Worms:
 *   1. `boss_worm_5_p3_fire_bomber` (Crawls close and explodes + shoots fireballs)
 *   2. `boss_worm_5_p3_fire_pool` (Throws burning fire puddles onto the floor)
 * - Phase 2 Melee Worm (`boss_worm_5_p2_melee`) -> splits into 2 Small Phase 3 Tunnel Worms:
 *   1. `boss_worm_5_p3_burrower` (Same rapid burrow & rush mechanics)
 *   2. `boss_worm_5_p3_leech` (Glows red for 1s, jumps, and latches onto player for 4s dealing damage & healing itself!)
 */
export function getWormBossSplitChildren(
  archetype: string
): [Stage5WormBossArchetype, Stage5WormBossArchetype] | null {
  if (archetype === 'boss_worm_5_p1') {
    return ['boss_worm_5_p2_fire', 'boss_worm_5_p2_melee'];
  }
  if (archetype === 'boss_worm_5_p2_fire') {
    return ['boss_worm_5_p3_fire_bomber', 'boss_worm_5_p3_fire_pool'];
  }
  if (archetype === 'boss_worm_5_p2_melee') {
    return ['boss_worm_5_p3_burrower', 'boss_worm_5_p3_leech'];
  }
  return null;
}

export interface Stage5EntitySpawnSpec {
  trees: Array<{ x: number; z: number }>;
  herbs: Array<{ x: number; z: number }>;
  props: Array<{ x: number; z: number; kind: 'shield' | 'barrel'; name: string }>;
  enemies: Array<{
    x: number;
    z: number;
    arch:
      | 'mud_monster'
      | 'cave_bear'
      | 'skeleton_archer'
      | 'skeleton_hammer_shield'
      | 'fire_demon'
      | 'water_monster'
      | 'stone_crusher'
      | 'wild_boar'
      | 'frost_charger'
      | 'sky_dive_gargoyle'
      | 'storm_harpy_shooter'
      | 'boss_worm_5_p1';
  }>;
}

/**
 * Authoritative Stage 5 entity spawn coordinates verified to have zero overlap with any Stage 5 wall or gate.
 * Combines Stage 5 monsters (Mud Monster, Cave Bear, Skeleton Archer, Skeleton Hammer Shield) with
 * Stage 4 & 3 monsters (Fire Demon, Water Monster, Stone Crusher, Wild Boar, Frost Charger, Gargoyle, Harpy).
 */
export function getStage5SpawnSpecs(): Stage5EntitySpawnSpec {
  return {
    trees: [
      { x: -62, z: 210 },
      { x: -52, z: 196 },
      { x: -20, z: 210 },
      { x: -4, z: 196 },
      { x: 80, z: 162 },
      { x: -48, z: 162 },
      { x: -16, z: 124 },
      { x: 64, z: 68 },
      { x: -64, z: 20 },
      { x: 82, z: -28 },
      { x: -80, z: -76 },
      { x: 42, z: -124 },
    ],
    herbs: [
      { x: -66, z: 196 },
      { x: -50, z: 210 },
      { x: -22, z: 196 },
      { x: 28, z: 210 },
      { x: 76, z: 150 },
      { x: -48, z: 150 },
      { x: 22, z: 124 },
      { x: -48, z: 72 },
      { x: 72, z: 20 },
      { x: -48, z: -28 },
      { x: 52, z: -76 },
      { x: 0, z: -124 },
    ],
    props: [
      { x: -48, z: 204, kind: 'shield', name: 'Рунный щит стража' },
      { x: 28, z: 158, kind: 'barrel', name: 'Красная взрывная бочка' },
      { x: -16, z: 104, kind: 'barrel', name: 'Красная взрывная бочка' },
      { x: 0, z: 56, kind: 'barrel', name: 'Красная взрывная бочка' },
      { x: -4, z: 24, kind: 'shield', name: 'Щит Древних' },
      { x: 34, z: -28, kind: 'barrel', name: 'Красная взрывная бочка' },
      { x: 8, z: -76, kind: 'barrel', name: 'Красная взрывная бочка' },
      { x: 42, z: -138, kind: 'barrel', name: 'Красная взрывная бочка' },
      { x: -16, z: -168, kind: 'shield', name: 'Щит Против Древнего Червя' },
      { x: 16, z: -168, kind: 'barrel', name: 'Красная взрывная бочка' },
      { x: -28, z: -186, kind: 'barrel', name: 'Красная взрывная бочка' },
      { x: 28, z: -186, kind: 'barrel', name: 'Красная взрывная бочка' },
    ],
    enemies: [
      // Band 0 (East side past safe grove)
      { x: 36, z: 198, arch: 'mud_monster' },
      { x: 52, z: 204, arch: 'wild_boar' },
      { x: 68, z: 202, arch: 'skeleton_archer' },
      { x: 82, z: 196, arch: 'fire_demon' },
      // Band 1
      { x: 78, z: 166, arch: 'water_monster' },
      { x: 54, z: 162, arch: 'frost_charger' },
      { x: 28, z: 166, arch: 'cave_bear' },
      { x: 28, z: 146, arch: 'stone_crusher' },
      { x: -6, z: 166, arch: 'skeleton_archer' },
      { x: -8, z: 148, arch: 'fire_demon' },
      { x: -42, z: 156, arch: 'mud_monster' },
      { x: -56, z: 166, arch: 'skeleton_hammer_shield' },
      // Band 2
      { x: -56, z: 98, arch: 'mud_monster' },
      { x: -46, z: 118, arch: 'water_monster' },
      { x: -16, z: 114, arch: 'cave_bear' },
      { x: -16, z: 98, arch: 'wild_boar' },
      { x: 22, z: 110, arch: 'skeleton_archer' },
      { x: 22, z: 98, arch: 'fire_demon' },
      { x: 58, z: 114, arch: 'skeleton_hammer_shield' },
      { x: 60, z: 98, arch: 'stone_crusher' },
      // Band 3
      { x: 56, z: 74, arch: 'mud_monster' },
      { x: 76, z: 58, arch: 'storm_harpy_shooter' },
      { x: 0, z: 74, arch: 'skeleton_archer' },
      { x: 0, z: 54, arch: 'fire_demon' },
      { x: -36, z: 74, arch: 'cave_bear' },
      { x: -52, z: 58, arch: 'skeleton_hammer_shield' },
      { x: -64, z: 56, arch: 'water_monster' },
      // Band 4
      { x: -42, z: 16, arch: 'mud_monster' },
      { x: -58, z: 8, arch: 'stone_crusher' },
      { x: -4, z: 8, arch: 'cave_bear' },
      { x: -4, z: 34, arch: 'wild_boar' },
      { x: 26, z: 26, arch: 'skeleton_archer' },
      { x: 64, z: 24, arch: 'skeleton_hammer_shield' },
      { x: 78, z: 8, arch: 'fire_demon' },
      // Band 5
      { x: 82, z: -18, arch: 'water_monster' },
      { x: 34, z: -40, arch: 'mud_monster' },
      { x: 34, z: -16, arch: 'stone_crusher' },
      { x: 0, z: -16, arch: 'skeleton_archer' },
      { x: 0, z: -38, arch: 'fire_demon' },
      { x: -38, z: -20, arch: 'cave_bear' },
      { x: -54, z: -36, arch: 'skeleton_hammer_shield' },
      // Band 6
      { x: -78, z: -64, arch: 'frost_charger' },
      { x: -24, z: -68, arch: 'mud_monster' },
      { x: -24, z: -88, arch: 'water_monster' },
      { x: 8, z: -60, arch: 'cave_bear' },
      { x: 42, z: -68, arch: 'skeleton_archer' },
      { x: 46, z: -86, arch: 'skeleton_hammer_shield' },
      { x: 60, z: -68, arch: 'stone_crusher' },
      // Band 7
      { x: 42, z: -116, arch: 'mud_monster' },
      { x: 78, z: -118, arch: 'fire_demon' },
      { x: 0, z: -136, arch: 'skeleton_archer' },
      { x: -36, z: -116, arch: 'water_monster' },
      { x: -42, z: -144, arch: 'cave_bear' },
      { x: -6, z: -114, arch: 'skeleton_hammer_shield' },
      { x: -76, z: -144, arch: 'stone_crusher' },
      // Band 8 — Stage 5 Boss Sanctum: Giant Splitting Worm Boss (`БОСС 5: Древний Червь Катакомб`)
      { x: 0, z: -182, arch: 'boss_worm_5_p1' },
    ],
  };
}

/**
 * Returns true only if the main stage Boss (`boss_mage_1`, `boss_mage_2`, `boss_mage_3`, `boss_elemental_4`,
 * or ALL active Stage 5 Worm Boss forms) has been defeated (`state === 'ko'` or `hp <= 0`), unlocking the finish portal!
 */
export function isStageBossDefeated(
  enemies: Array<{ archetype: string; state: string; hp: number }>,
  stage: 1 | 2 | 3 | 4 | 5
): boolean {
  if (stage === 5) {
    const wormBosses = enemies.filter((e) => isStage5WormBossArchetype(e.archetype));
    if (wormBosses.length === 0) return true;
    return wormBosses.every((w) => w.state === 'ko' || w.hp <= 0);
  }
  const bossArchetype =
    stage === 1
      ? 'boss_mage_1'
      : stage === 2
      ? 'boss_mage_2'
      : stage === 3
      ? 'boss_mage_3'
      : 'boss_elemental_4';
  const mainBoss = enemies.find((e) => e.archetype === bossArchetype);
  if (!mainBoss) return true;
  return mainBoss.state === 'ko' || mainBoss.hp <= 0;
}

// ============================================================================
// DIABLO-STYLE DIFFICULTY SYSTEM (Difficulty 1 = Обычная, Difficulty 2 = Кошмар)
// Extensible for future Difficulty 3 (Ад) & Difficulty 4 (Инферно)
// ============================================================================
export type DifficultyTier = 1 | 2;

export interface DifficultyTierDef {
  tier: DifficultyTier;
  id: 'normal' | 'nightmare';
  name: string;
  shortName: string;
  subtitle: string;
  badgeColor: string;
  description: string;
}

export const DIFFICULTY_CATALOG: Record<DifficultyTier, DifficultyTierDef> = {
  1: {
    tier: 1,
    id: 'normal',
    name: 'Сложность I: Обычная (Normal)',
    shortName: 'I · Обычная',
    subtitle: 'Классическое прохождение 5 уровней Лабиринта',
    badgeColor: '#38bdf8',
    description:
      'Стандартная сила монстров и боссов с 1-го по 5-й уровень. Победите финального Босса-Червя на 5-м уровне, чтобы открыть Сложность II: Кошмар!',
  },
  2: {
    tier: 2,
    id: 'nightmare',
    name: 'Сложность II: Кошмар (Diablo Nightmare)',
    shortName: 'II · Кошмар 🔥',
    subtitle: 'Открывается после победы над Боссом-Червём 5-го уровня',
    badgeColor: '#ef4444',
    description:
      'Уже на 1-й карте все мобы сильнее и живучее, чем на 5-м уровне Обычной сложности, быстрее двигаются и стремительнее метают снаряды. С каждой картой (2..5) вплоть до финального Червя их мощь растёт ещё сильнее!',
  },
};

export interface DiabloDifficultyMultipliers {
  difficulty: DifficultyTier;
  stage: 1 | 2 | 3 | 4 | 5;
  hpMultiplier: number;
  damageMultiplier: number;
  moveSpeedMultiplier: number;
  projectileSpeedMultiplier: number;
  attackCadenceMultiplier: number;
  xpMultiplier: number;
}

/**
 * Computes the Diablo-style difficulty multipliers for a given DifficultyTier (1 or 2) and Stage (1..5):
 * - On Difficulty 1 (`Обычная`): all multipliers are `1.0`.
 * - On Difficulty 2 (`Кошмар / Nightmare`):
 *   - Even on Stage 1, every enemy is stronger in HP and attack damage than Stage 5 of Normal Difficulty!
 *   - Continues scaling progressively across Stages 2, 3, 4, and 5 up to the final Stage 5 Splitting Worm Boss.
 *   - Enemies also move faster (`moveSpeedMultiplier`), fire faster projectiles (`projectileSpeedMultiplier`),
 *     and attack more frequently (`attackCadenceMultiplier`).
 */
export function getDiabloDifficultyMultipliers(
  difficulty: DifficultyTier,
  stage: 1 | 2 | 3 | 4 | 5 = 1
): DiabloDifficultyMultipliers {
  const clampedStage = Math.max(1, Math.min(5, Math.round(stage))) as 1 | 2 | 3 | 4 | 5;
  if (difficulty <= 1) {
    return {
      difficulty: 1,
      stage: clampedStage,
      hpMultiplier: 1.0,
      damageMultiplier: 1.0,
      moveSpeedMultiplier: 1.0,
      projectileSpeedMultiplier: 1.0,
      attackCadenceMultiplier: 1.0,
      xpMultiplier: MAP_PROGRESSION_XP_MULTIPLIERS[clampedStage - 1] ?? 1.0,
    };
  }

  // Difficulty 2 (Nightmare):
  // Stage 1 starts above Stage 5 Normal and scales up through Stage 5 Nightmare (Map 6..10)!
  const hpTable: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 1.45,
    2: 1.75,
    3: 2.1,
    4: 2.5,
    5: 3.0,
  };
  const dmgTable: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 1.65,
    2: 1.85,
    3: 2.1,
    4: 2.4,
    5: 2.75,
  };
  const idx = clampedStage - 1;
  const mapIndex = 5 + clampedStage; // 6..10
  return {
    difficulty: 2,
    stage: clampedStage,
    hpMultiplier: hpTable[clampedStage],
    damageMultiplier: dmgTable[clampedStage],
    moveSpeedMultiplier: Number((1.28 + idx * 0.05).toFixed(2)),
    projectileSpeedMultiplier: Number((1.35 + idx * 0.05).toFixed(2)),
    attackCadenceMultiplier: Number((1.35 + idx * 0.05).toFixed(2)),
    xpMultiplier: MAP_PROGRESSION_XP_MULTIPLIERS[mapIndex - 1] ?? Number((2.7 + idx * 0.65).toFixed(2)),
  };
}

// 10-Map XP Gradation table across Map 1..5 (Difficulty I: Stages 1..5) and Map 6..10 (Difficulty II: Stages 1..5)
export const MAP_PROGRESSION_XP_MULTIPLIERS: readonly number[] = [
  1.0,  // Map 1 (Diff 1, Stage 1)
  1.25, // Map 2 (Diff 1, Stage 2)
  1.5,  // Map 3 (Diff 1, Stage 3)
  1.8,  // Map 4 (Diff 1, Stage 4)
  2.15, // Map 5 (Diff 1, Stage 5)
  2.7,  // Map 6 (Diff 2, Stage 1 - Nightmare / Diablo)
  3.25, // Map 7 (Diff 2, Stage 2 - Nightmare / Diablo)
  3.9,  // Map 8 (Diff 2, Stage 3 - Nightmare / Diablo)
  4.6,  // Map 9 (Diff 2, Stage 4 - Nightmare / Diablo)
  5.5,  // Map 10 (Diff 2, Stage 5 - Nightmare / Diablo)
];

export const ENEMY_BASE_KILL_XP: Record<string, number> = {
  boss_worm_5: 240,
  boss_worm_5_p1: 240,
  boss_worm_5_p2_fire: 120,
  boss_worm_5_p2_mage: 120,
  boss_worm_5_p2_melee: 120,
  boss_worm_5_p3_burrower: 70,
  boss_worm_5_p3_fire_bomber: 70,
  boss_worm_5_p3_fire_pool: 70,
  boss_worm_5_p3_leech: 70,
  boss_elemental_4: 180,
  boss_mage_1: 120,
  boss_mage_2: 120,
  boss_mage_3: 120,
  skeleton_hammer_shield: 32,
  cave_bear: 32,
  skeleton_archer: 25,
  mud_monster: 25,
  flying_gargoyle: 22,
  frost_charger: 22,
  storm_harpy_shooter: 22,
  storm_harpy_melee: 22,
  water_monster: 22,
  fire_demon: 22,
  earth_golem: 22,
};

/**
 * Calculates XP awarded for defeating an enemy on a given Labyrinth stage (1..5) and Diablo Difficulty (1..2),
 * forming a strict 10-step progression from Map 1 (Diff 1 Stage 1) to Map 10 (Diff 2 Stage 5).
 */
export function evaluateEnemyKillXp(
  archetype: string,
  stage: 1 | 2 | 3 | 4 | 5 = 1,
  difficulty: DifficultyTier = 1
): number {
  const baseXp = ENEMY_BASE_KILL_XP[archetype] ?? 15;
  const { xpMultiplier } = getDiabloDifficultyMultipliers(difficulty, stage);
  return Math.max(1, Math.round(baseXp * xpMultiplier));
}

/**
 * Calculates an enemy's base Max HP taking into account archetype, waveNum, Labyrinth stage (1..5), and Diablo Difficulty (1..2).
 * Guarantees that on Difficulty 2 (`Кошмар`), even Stage 1 enemies have strictly more HP than Stage 5 enemies on Difficulty 1 (`Обычная`),
 * and continue scaling across Stages 2..5!
 */
export function evaluateEnemyBaseMaxHp(
  arch: string,
  waveNum: number,
  stage: 1 | 2 | 3 | 4 | 5,
  difficulty: DifficultyTier,
  isLabyrinth = true
): number {
  // On Difficulty 2 (Nightmare), baseline wave scaling starts above Stage 5 Normal (waveNum = 8, stage 5x1.25)
  const effectiveWave =
    difficulty >= 2 ? Math.max(waveNum, 8) + stage * 2 : waveNum;

  const rawBaseMaxHp =
    arch === 'boss_worm_5_p1'
      ? WORM_PHASE1_MAX_HP
      : arch === 'boss_worm_5_p2_fire' || arch === 'boss_worm_5_p2_melee'
      ? WORM_PHASE2_MAX_HP
      : isStage5WormBossArchetype(arch)
      ? WORM_PHASE3_MAX_HP
      : arch === 'boss_elemental_4'
      ? 1280
      : arch === 'boss_mage_3'
      ? 700
      : arch === 'boss_mage_2'
      ? 480
      : arch === 'boss_mage_1'
      ? 360
      : arch === 'boss_totem'
      ? 145
      : arch === 'skeleton_hammer_shield'
      ? 275 + effectiveWave * 28
      : arch === 'cave_bear'
      ? 220 + effectiveWave * 24
      : arch === 'mud_monster'
      ? 175 + effectiveWave * 22
      : arch === 'skeleton_archer'
      ? 135 + effectiveWave * 18
      : arch === 'stone_crusher'
      ? 190 + effectiveWave * 28
      : arch === 'fire_demon'
      ? 155 + effectiveWave * 24
      : arch === 'water_monster'
      ? 150 + effectiveWave * 22
      : arch === 'wild_boar'
      ? 95 + effectiveWave * 20
      : arch === 'rat_swarmer'
      ? 45 + effectiveWave * 12
      : arch === 'sky_dive_gargoyle'
      ? 60 + effectiveWave * 16
      : arch === 'dark_kiter'
      ? 70 + effectiveWave * 18
      : arch === 'storm_harpy_shooter'
      ? 80 + effectiveWave * 18
      : 95 + effectiveWave * 24;

  const stageHpMult =
    isLabyrinth && (stage >= 4 || difficulty >= 2) && !isStage5WormBossArchetype(arch)
      ? 1.25
      : 1.0;

  // On Nightmare (Difficulty 2), earlier Stage Bosses (Boss 1..4) also scale above Stage 5 baseline
  const bossNightmareBoost =
    difficulty >= 2 &&
    (arch === 'boss_mage_1' ||
      arch === 'boss_mage_2' ||
      arch === 'boss_mage_3' ||
      arch === 'boss_elemental_4')
      ? 2.1
      : 1.0;

  const diffMult = getDiabloDifficultyMultipliers(difficulty, stage).hpMultiplier;
  return Math.round(rawBaseMaxHp * stageHpMult * bossNightmareBoost * diffMult);
}

// ============================================================================
// CHARACTER PROFILE & PROGRESSION PERSISTENCE (Account & Multi-Character System)
// ============================================================================
export const CHARACTER_NAME_MAX_LENGTH = 40;
export const CHARACTER_ID_MAX_LENGTH = 64;
export const CHARACTER_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

export interface CharacterProfileData {
  id: string;
  ownerId: string;
  name: string;
  playerLevel: number;
  playerXp: number;
  gestureMasteryLevel: number;
  highestUnlockedStage: 1 | 2 | 3 | 4 | 5;
  highestUnlockedDifficulty: DifficultyTier;
  selectedDifficulty: DifficultyTier;
  unlockedStageD1: 1 | 2 | 3 | 4 | 5;
  unlockedStageD2: 1 | 2 | 3 | 4 | 5;
  equippedStaffId: EquipmentId;
  ownedEquipment: EquipmentId[];
  ownedArtifacts: ArtifactId[];
  equippedArtifacts: Partial<Record<ArtifactSlot, ArtifactId>>;
  spellLevels: Record<SpellId, number>;
  reagentInventory: Record<ReagentId, number>;
  tamedPetSpecies: TameableSpeciesId | 'none';
  tamedPetLevel: number;
  tamedPetTrainingStep: number;
  tamedPetXp: number;
  claimedQuestIds: string[];
  updatedAtMs: number;
}

export function createDefaultCharacterProfile(
  ownerId: string,
  name = 'Магистр Арканума',
  customId?: string
): CharacterProfileData {
  const rawId =
    customId || `char_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const safeId = rawId.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, CHARACTER_ID_MAX_LENGTH) || 'char_1';
  const trimmedName = (name || 'Магистр Арканума').trim().slice(0, CHARACTER_NAME_MAX_LENGTH) || 'Магистр Арканума';

  return {
    id: safeId,
    ownerId: ownerId || 'local_guest',
    name: trimmedName,
    playerLevel: 1,
    playerXp: 0,
    gestureMasteryLevel: 1,
    highestUnlockedStage: 1,
    highestUnlockedDifficulty: 1,
    selectedDifficulty: 1,
    unlockedStageD1: 1,
    unlockedStageD2: 1,
    equippedStaffId: 'wand_ollivander',
    ownedEquipment: ['wand_ollivander'],
    ownedArtifacts: [],
    equippedArtifacts: {},
    spellLevels: {
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
    },
    reagentInventory: {
      ancient_wood: 9,
      mandrake_root: 2,
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
    },
    tamedPetSpecies: 'none',
    tamedPetLevel: 1,
    tamedPetTrainingStep: 0,
    tamedPetXp: 0,
    claimedQuestIds: [],
    updatedAtMs: Date.now(),
  };
}

/**
 * Returns the highest unlocked Labyrinth stage (1..5) for the character's currently selected difficulty.
 */
export function getUnlockedStageForDifficulty(
  profile: Pick<CharacterProfileData, 'unlockedStageD1' | 'unlockedStageD2'>,
  difficulty: DifficultyTier
): 1 | 2 | 3 | 4 | 5 {
  return difficulty === 2 ? profile.unlockedStageD2 : profile.unlockedStageD1;
}

/**
 * Unlocks the next Labyrinth stage (up to 5) on the given difficulty when the player clears a stage.
 */
export function unlockStageForCharacter(
  profile: CharacterProfileData,
  unlockedStage: 1 | 2 | 3 | 4 | 5,
  difficulty: DifficultyTier = profile.selectedDifficulty
): CharacterProfileData {
  const clamped = Math.max(1, Math.min(5, Math.round(unlockedStage))) as 1 | 2 | 3 | 4 | 5;
  const nextD1 =
    difficulty === 1
      ? (Math.max(profile.unlockedStageD1, clamped) as 1 | 2 | 3 | 4 | 5)
      : profile.unlockedStageD1;
  const nextD2 =
    difficulty === 2
      ? (Math.max(profile.unlockedStageD2, clamped) as 1 | 2 | 3 | 4 | 5)
      : profile.unlockedStageD2;
  const nextActiveHighest = difficulty === 2 ? nextD2 : nextD1;

  return {
    ...profile,
    unlockedStageD1: nextD1,
    unlockedStageD2: nextD2,
    highestUnlockedStage: nextActiveHighest,
    updatedAtMs: Date.now(),
  };
}

/**
 * Unlocks Difficulty 2 (`Кошмар / Nightmare`) when the player defeats the final Stage 5 Splitting Worm Boss!
 */
export function unlockDifficultyOnWormBossKill(
  profile: CharacterProfileData
): { updatedProfile: CharacterProfileData; newlyUnlockedDifficulty: boolean } {
  const alreadyUnlocked = profile.highestUnlockedDifficulty >= 2;
  const updatedProfile: CharacterProfileData = {
    ...profile,
    unlockedStageD1: 5,
    highestUnlockedStage: profile.selectedDifficulty === 1 ? 5 : profile.unlockedStageD2,
    highestUnlockedDifficulty: 2,
    updatedAtMs: Date.now(),
  };
  return {
    updatedProfile,
    newlyUnlockedDifficulty: !alreadyUnlocked,
  };
}

/**
 * Checks whether the player can build a new wooden wall (`WALL_WOOD_COST = 2`, `MAX_BUILT_WALLS = 12`).
 */
export function canBuildWoodenWall(
  woodCount: number,
  currentWallCount: number
): { allowed: boolean; reason?: string } {
  if (currentWallCount >= MAX_BUILT_WALLS) {
    return {
      allowed: false,
      reason: `Максимум ${MAX_BUILT_WALLS} стен на карте! Сломайте стену [N], чтобы вернуть +${WALL_DISMANTLE_WOOD_REFUND} дрова.`,
    };
  }
  if (woodCount < WALL_WOOD_COST) {
    return {
      allowed: false,
      reason: `Нужно ${WALL_WOOD_COST} дрова для постройки стены (сейчас: ${woodCount}).`,
    };
  }
  return { allowed: true };
}

/**
 * Counts how many completed (`isBuilt !== false`) player-built walls surround a campfire within `shelterRadius` (`6.5m`).
 */
export function countWallsSurroundingCampfire(
  campfirePos: { x: number; z: number },
  builtWalls: ReadonlyArray<{ x: number; z: number; isBuilt?: boolean }>,
  shelterRadius = CAMPFIRE_SHELTER_RADIUS
): number {
  let count = 0;
  for (const w of builtWalls) {
    if (w.isBuilt === false) continue;
    const dist = Math.hypot(w.x - campfirePos.x, w.z - campfirePos.z);
    if (dist <= shelterRadius) {
      count++;
    }
  }
  return count;
}

/**
 * Returns true if the campfire is surrounded by at least 3 built walls (`CAMPFIRE_SHELTER_MIN_WALLS = 3`).
 */
export function isCampfireShelteredByWalls(
  campfirePos: { x: number; z: number },
  builtWalls: ReadonlyArray<{ x: number; z: number; isBuilt?: boolean }>,
  shelterRadius = CAMPFIRE_SHELTER_RADIUS
): boolean {
  return (
    countWallsSurroundingCampfire(campfirePos, builtWalls, shelterRadius) >=
    CAMPFIRE_SHELTER_MIN_WALLS
  );
}

/**
 * Computes the effective HP/sec regeneration and MP regeneration multiplier at a lit campfire.
 * When surrounded by >= 3 built walls (`isSheltered === true`), both health and mana regeneration are doubled (x2)!
 */
export function getCampfireEffectiveRegen(isSheltered: boolean): {
  hpRegenPerSec: number;
  mpRegenMultiplier: number;
} {
  const mult = isSheltered ? CAMPFIRE_SHELTER_REGEN_MULTIPLIER : 1.0;
  return {
    hpRegenPerSec: Number((CAMPFIRE_HP_REGEN_PER_SEC * mult).toFixed(2)),
    mpRegenMultiplier: Number((CAMPFIRE_MP_REGEN_MULTIPLIER * mult).toFixed(2)),
  };
}

export const WALL_WIDTH = 3.6;
export const WALL_THICKNESS = 0.65;

/**
 * Finds the player-built Wooden Wall (`Стена`) that the player is aiming at with their crosshair ray (`aimDir`),
 * using 2D oriented bounding-box slab intersection in the horizontal XZ plane within `maxRange` (`11.5m`).
 * Returns the closest aimed wall's ID and index, or `null` if no wall is in the player's line of sight.
 */
export function findAimedWoodenWall<
  T extends { id: string; x: number; z: number; rotY: number }
>(
  playerPos: { x: number; z: number },
  aimDir: { x: number; z: number },
  builtWalls: ReadonlyArray<T>,
  maxRange = 11.5
): { wall: T; index: number; distance: number } | null {
  if (builtWalls.length === 0) return null;

  const dirLen = Math.hypot(aimDir.x, aimDir.z);
  if (dirLen < 1e-5) return null;
  const dx = aimDir.x / dirLen;
  const dz = aimDir.z / dirLen;

  const halfWidth = WALL_WIDTH * 0.5 + 0.45; // 2.25m generous aim half-width along wall planks
  const halfDepth = WALL_THICKNESS * 0.5 + 0.55; // 0.875m generous aim half-depth

  let bestIndex = -1;
  let bestDist = Infinity;

  for (let i = 0; i < builtWalls.length; i++) {
    const w = builtWalls[i];
    const relOriginX = playerPos.x - w.x;
    const relOriginZ = playerPos.z - w.z;
    const centerDist = Math.hypot(relOriginX, relOriginZ);
    if (centerDist > maxRange + halfWidth) continue;

    // Transform ray origin & direction into wall's local XZ space (rotated by -w.rotY)
    // Note: in Three.js, local (+X, +Z) rotated by rotY maps to world:
    // worldX = localX * cos(rotY) + localZ * sin(rotY)
    // worldZ = -localX * sin(rotY) + localZ * cos(rotY)
    // Therefore inverse rotation (world -> local) is:
    // localX = worldX * cos(rotY) - worldZ * sin(rotY)
    // localZ = worldX * sin(rotY) + worldZ * cos(rotY)
    const cosR = Math.cos(w.rotY);
    const sinR = Math.sin(w.rotY);

    const localOx = relOriginX * cosR - relOriginZ * sinR;
    const localOz = relOriginX * sinR + relOriginZ * cosR;
    const localDx = dx * cosR - dz * sinR;
    const localDz = dx * sinR + dz * cosR;

    // 2D ray-AABB slab intersection against [-halfWidth..halfWidth] x [-halfDepth..halfDepth]
    let tMin = 0;
    let tMax = maxRange;

    if (Math.abs(localDx) < 1e-6) {
      if (localOx < -halfWidth || localOx > halfWidth) continue;
    } else {
      const tx1 = (-halfWidth - localOx) / localDx;
      const tx2 = (halfWidth - localOx) / localDx;
      tMin = Math.max(tMin, Math.min(tx1, tx2));
      tMax = Math.min(tMax, Math.max(tx1, tx2));
    }

    if (Math.abs(localDz) < 1e-6) {
      if (localOz < -halfDepth || localOz > halfDepth) continue;
    } else {
      const tz1 = (-halfDepth - localOz) / localDz;
      const tz2 = (halfDepth - localOz) / localDz;
      tMin = Math.max(tMin, Math.min(tz1, tz2));
      tMax = Math.min(tMax, Math.max(tz1, tz2));
    }

    if (tMax >= tMin && tMin <= maxRange) {
      const hitDist = Math.max(0, tMin);
      if (hitDist < bestDist) {
        bestDist = hitDist;
        bestIndex = i;
      }
    }
  }

  if (bestIndex < 0) return null;
  return {
    wall: builtWalls[bestIndex],
    index: bestIndex,
    distance: Number(bestDist.toFixed(2)),
  };
}

export const ARCANE_SWORD_EXPIRING_WARNING_SEC = 5.0;
export const ARCANE_SWORD_EXPIRING_SOUND_URL =
  '/assets/aistudio/freesound_community-recharge-sound-99815_cbfa7c9e.mp3';
/** 30% quieter than original audio (1.0 - 0.30 = 0.70) */
export const ARCANE_SWORD_EXPIRING_VOLUME_SCALE = 0.7;

/**
 * Returns true when the Arcane Sword duration drops to <= 5.0 seconds and the expiring warning sound has not played yet.
 */
export function shouldTriggerArcaneSwordExpiringSound(
  remainingSec: number,
  warningAlreadyPlayed: boolean
): boolean {
  if (warningAlreadyPlayed) return false;
  return remainingSec > 0 && remainingSec <= ARCANE_SWORD_EXPIRING_WARNING_SEC;
}

/**
 * Computes updated player level, XP, and max vitals after gaining XP from a monster kill or quest.
 * Crucially, killing a monster NEVER restores missing HP or MP (nextHp === currentHp, nextMp === currentMp).
 */
export function computePlayerVitalsAfterXpGain(params: {
  currentLevel: number;
  currentXp: number;
  gainedXp: number;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
}): {
  nextLevel: number;
  nextXp: number;
  levelsGained: number;
  nextHp: number;
  nextMaxHp: number;
  nextMp: number;
  nextMaxMp: number;
} {
  const safeCurrentLevel = Math.max(1, Math.floor(params.currentLevel || 1));
  const nextXp = Math.max(0, Math.round((params.currentXp || 0) + Math.max(0, params.gainedXp || 0)));
  let nextLevel = safeCurrentLevel;
  while (nextXp >= nextLevel * 500 && nextLevel < 99) {
    nextLevel += 1;
  }
  const levelsGained = nextLevel - safeCurrentLevel;
  const nextMaxHp = params.maxHp + levelsGained * 15;
  const nextMaxMp = params.maxMp + levelsGained * 10;
  return {
    nextLevel,
    nextXp,
    levelsGained,
    nextHp: Math.min(nextMaxHp, params.currentHp),
    nextMaxHp,
    nextMp: Math.min(nextMaxMp, params.currentMp),
    nextMaxMp,
  };
}
