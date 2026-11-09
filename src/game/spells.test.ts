import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceQuestProgress,
  BOAR_SLOW_DURATION_SEC,
  BOAR_SLOW_FACTOR,
  BOAR_SLOW_PERCENT,
  calculateCookedBatFoodStats,
  calculateCookedBoarFoodStats,
  calculateCookedRatFoodStats,
  calculateCraftedPotionStats,
  calculateElementalAllyStats,
  calculateExplosiveBarrelDamage,
  calculateSpellCastStats,
  CAMPFIRE_WOOD_COST,
  EQUIPMENT_CATALOG,
  SHIELD_BASE_DAMAGE_MULTIPLIER,
  canAffordPetTrainingStep,
  canAffordSpellUpgrade,
  claimQuestReward,
  consumePetTrainingStepCost,
  consumeSpellUpgradeCost,
  CONTEXT_GESTURE_TEMPLATES,
  CRAFT_DRAW_TEMPLATES,
  craftEquipmentItem,
  evaluateCampfireCraftDrawing,
  evaluateContextualGesture,
  evaluateGestureAccuracy,
  FLOOR_TRAP_DAMAGE,
  FLOOR_TRAP_SCALE_MULTIPLIER,
  FLOOR_TRAP_TRIGGER_RADIUS,
  getActiveSpellGestureInfo,
  getLabyrinthFloorTraps,
  getLabyrinthLaserTraps,
  getLabyrinthWaterLake,
  getPetTrainingStepCost,
  getSpellCooldownForLevel,
  getSpellHotkeyLabel,
  getSpellUpgradeCost,
  getTeleportMaxRange,
  GLACIUS_SLOW_DURATION_SEC,
  GLACIUS_SLOW_FACTOR,
  GLACIUS_SLOW_PERCENT,
  HARVEST_NODE_RESPAWN_SEC,
  INITIAL_QUESTS,
  LASER_TRAP_DAMAGE,
  LASER_TRAP_RESPAWN_SEC,
  matchVoiceSpell,
  ReagentId,
  SPELLS,
  SPELL_ORDER,
  SPECIAL_COOLDOWN_SEC,
  SPECIAL_MANA_COST,
  TELEPORT_BASE_COOLDOWN_SEC,
  TELEPORT_BLAST_RADIUS,
  UNIFORM_MANA_COST,
  WINGARDIUM_MANA_COST,
  ENGORGIO_BUFF_DURATION_SEC,
  getLabyrinthStageLayout,
  isLabyrinthStageTraversable,
  segmentHitsWall,
  LABYRINTH_MULTIPLAYER_MODES,
  getDeterministicEnemyId,
  getLabyrinthRuneGates,
  getScaledEnemyStatsForMode,
  isStageBossDefeated,
  reconcileSharedEnemyDamage,
  selectEnemyAggroTarget,
  SHARED_COOP_ENEMY_DAMAGE_MULTIPLIER,
  SHARED_COOP_ENEMY_HP_MULTIPLIER,
  BARREL_RESPAWN_SEC,
  RUNE_BUTTON_SCALE,
  MAX_SPELL_LEVEL,
  SPELL_LEVEL_6_EFFECTS,
  ARTIFACT_CATALOG,
  ArtifactId,
  canCraftArtifact,
  collectChestArtifact,
  craftArtifactItem,
  evaluateSpikeLineWaveState,
  isPlayerTouchingSpikeLine,
  getArtifactOwnedCount,
  getArtifactSalvageRefund,
  getCombinedArtifactBonuses,
  getLabyrinthChests,
  getLabyrinthSpikeTrapZones,
  rollChestLoot,
  salvageArtifactItem,
  SPIKE_TRAP_DAMAGE,
  CAMPFIRE_TELEPORT_COOLDOWN_SEC,
  CAMPFIRE_TELEPORT_MANA_COST,
  calculateCampfireTeleportCastDuration,
  ARCANE_SWORD_COOLDOWN_SEC,
  ARCANE_SWORD_SWING_COOLDOWN_SEC,
  ARCANE_SWORD_LV6_SWING_COOLDOWN_SEC,
  SPIKE_HITBOX_RADIUS,
  SPIKE_VISUAL_BASE_RADIUS,
  evaluateEnemyKillXp,
  MAP_PROGRESSION_XP_MULTIPLIERS,
  BEAR_CLEAVE_RADIUS,
  BEAR_FEAR_DURATION_SEC,
  BEAR_ROAR_RADIUS,
  calculateArcaneSwordStats,
  calculateCooldownResetStats,
  applyCooldownResetToSpellCooldowns,
  ARCANE_SWORD_EXPIRING_WARNING_SEC,
  ARCANE_SWORD_EXPIRING_SOUND_URL,
  ARCANE_SWORD_EXPIRING_VOLUME_SCALE,
  shouldTriggerArcaneSwordExpiringSound,
  computePlayerVitalsAfterXpGain,
  upgradeAllSpellsByOneLevel,
  SpellId,
  calculateCookedBearFoodStats,
  evaluateArcaneSwordSpellControl,
  getLabyrinthWaterLakes,
  getStage5SpawnSpecs,
  getWormBossSplitChildren,
  isStage5WormBossArchetype,
  MUD_BALL_SCALE_MULTIPLIER,
  MUD_BALL_SLOW_PERCENT,
  MUD_PUDDLE_DURATION_SEC,
  MUD_PUDDLE_SLOW_PERCENT,
  SKELETON_ARROW_SPEED,
  SKELETON_VOLLEY_ARROW_SPEED,
  SKELETON_SHIELD_DAMAGE_MULTIPLIER,
  FROST_WIND_COOLDOWN_SEC,
  FROST_WIND_DURATION_SEC,
  FROST_WIND_PULL_SPEED,
  FROST_WIND_RADIUS,
  FROST_WIND_TELEGRAPH_SEC,
  WORM_BURROW_DURATION_SEC,
  WORM_EMERGE_STUN_SEC,
  WORM_FIRE_BURN_DURATION_SEC,
  WORM_FIRE_ZONE_DURATION_SEC,
  WORM_LEECH_JUMP_COOLDOWN_SEC,
  WORM_LEECH_LAND_RADIUS,
  WORM_LEECH_LATCH_DURATION_SEC,
  WORM_LEECH_TELEGRAPH_SEC,
  WORM_MELEE_FIGHT_DURATION_SEC,
  WORM_SPLIT_HP_RATIO,
  CAMPFIRE_SHELTER_MIN_WALLS,
  CAMPFIRE_SHELTER_REGEN_MULTIPLIER,
  MAX_BUILT_WALLS,
  WALL_BUILD_DURATION_SEC,
  WALL_DISMANTLE_WOOD_REFUND,
  WALL_WOOD_COST,
  canBuildWoodenWall,
  countWallsSurroundingCampfire,
  createDefaultCharacterProfile,
  evaluateEnemyBaseMaxHp,
  getCampfireEffectiveRegen,
  getDiabloDifficultyMultipliers,
  getUnlockedStageForDifficulty,
  isCampfireShelteredByWalls,
  unlockDifficultyOnWormBossKill,
  unlockStageForCharacter,
  calculatePracticeGestureXp,
  findAimedWoodenWall,
} from './spells';

test('SPELL_ORDER includes [1..8], [Ё] Teleport, [F] Домой, and [G] Перезарядка (Cooldown Reset), updated shortWords, and CAMPFIRE_WOOD_COST is 3', () => {
  assert.equal(CAMPFIRE_WOOD_COST, 3);
  assert.equal(SPELL_ORDER.length, 11);
  assert.equal(SPELL_ORDER[0], 'incendio');
  assert.equal(SPELL_ORDER[1], 'glacius');
  assert.equal(SPELL_ORDER[2], 'expelliarmus');
  assert.equal(SPELL_ORDER[3], 'stupefy');
  assert.equal(SPELL_ORDER[4], 'wingardium');
  assert.equal(SPELL_ORDER[5], 'engorgio');
  assert.equal(SPELL_ORDER[6], 'vera_verto');
  assert.equal(SPELL_ORDER[7], 'arcane_sword');
  assert.equal(SPELL_ORDER[8], 'teleport');
  assert.equal(SPELL_ORDER[9], 'campfire_teleport');
  assert.equal(SPELL_ORDER[10], 'cooldown_reset');
  assert.equal(SPELLS.glacius.shortWord, 'Мороз');
  assert.equal(SPELLS.wingardium.shortWord, 'Левиоса');
  assert.equal(SPELLS.vera_verto.shortWord, 'Лечение');
  assert.equal(SPELLS.campfire_teleport.name, 'Домой');
  assert.equal(SPELLS.campfire_teleport.shortWord, 'Домой');
  assert.equal(SPELLS.cooldown_reset.name, 'Перезарядка способностей');
  assert.equal(SPELLS.cooldown_reset.shortWord, 'Перезарядка');
  assert.equal(SPELLS.cooldown_reset.gestureId, 'hourglass');
  assert.equal(SPELLS.cooldown_reset.cooldown, 70);
  assert.equal(SPELLS.stupefy.gestureId, 'rect_brick');
  assert.equal(SPELLS.campfire_teleport.gestureId, 'spiral_in');
  assert.equal(SPELLS.campfire_teleport.manaCost, 10);
  assert.equal(SPELLS.campfire_teleport.cooldown, 120);
  assert.equal(getSpellHotkeyLabel('incendio'), '1');
  assert.equal(getSpellHotkeyLabel('vera_verto'), '7');
  assert.equal(getSpellHotkeyLabel('teleport'), 'Ё');
  assert.equal(getSpellHotkeyLabel('campfire_teleport'), 'F');
  assert.equal(getSpellHotkeyLabel('cooldown_reset'), 'G');
});

test('matchVoiceSpell recognizes short Russian words including Мороз, Левиоса, Лечение, Рост, Прыжок/Телепорт, Домой, and Перезарядка (while Костёр is strictly physical campfire)', () => {
  assert.equal(matchVoiceSpell('огонь').spellId, 'incendio');
  assert.equal(matchVoiceSpell('левиоса').spellId, 'wingardium');
  assert.equal(matchVoiceSpell('тяни').spellId, 'wingardium');
  assert.equal(matchVoiceSpell('удар').spellId, 'expelliarmus');
  assert.equal(matchVoiceSpell('стоп').spellId, 'stupefy');
  assert.equal(matchVoiceSpell('хил').spellId, 'vera_verto');
  assert.equal(matchVoiceSpell('лечение').spellId, 'vera_verto');
  assert.equal(matchVoiceSpell('рост').spellId, 'engorgio');
  assert.equal(matchVoiceSpell('мороз').spellId, 'glacius');
  assert.equal(matchVoiceSpell('лед').spellId, 'glacius');
  assert.equal(matchVoiceSpell('прыжок').spellId, 'teleport');
  assert.equal(matchVoiceSpell('телепорт').spellId, 'teleport');
  assert.equal(matchVoiceSpell('домой').spellId, 'campfire_teleport');
  assert.equal(matchVoiceSpell('возврат').spellId, 'campfire_teleport');
  assert.equal(matchVoiceSpell('перезарядка').spellId, 'cooldown_reset');
  assert.equal(matchVoiceSpell('время').spellId, 'cooldown_reset');
  assert.equal(matchVoiceSpell('костер').spellId, null);
  assert.equal(matchVoiceSpell('просто шум ветра').spellId, null);
});

test('evaluateGestureAccuracy rewards complete accurate trace including Heart for Heal, Brick Rectangle for Stop, Circle for Teleport, and Inward Spiral for Campfire Teleport', () => {
  const fullHeart = SPELLS.vera_verto.templatePoints.map((p) => ({
    x: p.x * 200,
    y: p.y * 200,
  }));
  const fullEval = evaluateGestureAccuracy(fullHeart, 'vera_verto');
  assert.ok(
    fullEval.accuracy >= 85,
    `Expected full heart accuracy >= 85, got ${fullEval.accuracy}`
  );
  assert.equal(fullEval.isComplete, true);

  const fullBrick = SPELLS.stupefy.templatePoints.map((p) => ({
    x: p.x * 200,
    y: p.y * 200,
  }));
  const brickEval = evaluateGestureAccuracy(fullBrick, 'stupefy');
  assert.ok(
    brickEval.accuracy >= 85,
    `Expected full brick rectangle accuracy >= 85, got ${brickEval.accuracy}`
  );

  const fullCircle = SPELLS.teleport.templatePoints.map((p) => ({
    x: p.x * 200,
    y: p.y * 200,
  }));
  const circleEval = evaluateGestureAccuracy(fullCircle, 'teleport');
  assert.ok(
    circleEval.accuracy >= 85,
    `Expected full circle accuracy >= 85, got ${circleEval.accuracy}`
  );

  const fullSpiral = SPELLS.campfire_teleport.templatePoints.map((p) => ({
    x: p.x * 200,
    y: p.y * 200,
  }));
  const spiralEval = evaluateGestureAccuracy(fullSpiral, 'campfire_teleport');
  assert.ok(
    spiralEval.accuracy >= 85,
    `Expected full inward spiral accuracy >= 85, got ${spiralEval.accuracy}`
  );

  const partialPoints = [
    { x: 100, y: 24 },
    { x: 65, y: 95 },
  ];
  const partialEval = evaluateGestureAccuracy(partialPoints, 'incendio');
  assert.ok(partialEval.accuracy < fullEval.accuracy);
  assert.equal(partialEval.isComplete, false);
});

test('calculateSpellCastStats enforces 4.0s->3.0s cooldowns, Teleport 10s CD/range/damage scaling, Stupefy 4..20/5, and Lv4+ 2 projectiles', () => {
  // 1. Quick unprepared attack shot -> strictly 2 damage, 15 MP, 4.0s cooldown at Level 1
  const quickShot = calculateSpellCastStats({
    spellId: 'incendio',
    castMode: 'quick',
    gestureAccuracy: 0,
    voiceMatched: false,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
  });
  assert.equal(quickShot.rawBaseDamage, 2);
  assert.equal(quickShot.finalDamage, 2);
  assert.equal(quickShot.manaCost, UNIFORM_MANA_COST);
  assert.equal(quickShot.cooldownSec, 4.0);
  assert.equal(quickShot.projectileCount, 1);

  // 2. Wingardium ("Тяни") costs 10 MP
  const wingardiumCast = calculateSpellCastStats({
    spellId: 'wingardium',
    castMode: 'voice',
    gestureAccuracy: 0,
    voiceMatched: true,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
  });
  assert.equal(wingardiumCast.manaCost, WINGARDIUM_MANA_COST);
  assert.equal(wingardiumCast.manaCost, 10);

  // 3. Cooldown scales from 4.0s (Level 1) down to 3.0s (Level 5), and Level 4+ fires 2 projectiles for combat spells
  assert.equal(getSpellCooldownForLevel('incendio', 1), 4.0);
  assert.equal(getSpellCooldownForLevel('incendio', 2), 3.75);
  assert.equal(getSpellCooldownForLevel('incendio', 3), 3.5);
  assert.equal(getSpellCooldownForLevel('incendio', 4), 3.25);
  assert.equal(getSpellCooldownForLevel('incendio', 5), 3.0);

  const lv1FireVoice = calculateSpellCastStats({
    spellId: 'incendio',
    castMode: 'voice',
    gestureAccuracy: 0,
    voiceMatched: true,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
  });
  const lv1StrikeVoice = calculateSpellCastStats({
    spellId: 'expelliarmus',
    castMode: 'voice',
    gestureAccuracy: 0,
    voiceMatched: true,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
  });
  assert.equal(lv1FireVoice.rawBaseDamage, 14);
  assert.equal(lv1FireVoice.finalDamage, 14);
  assert.equal(lv1StrikeVoice.rawBaseDamage, 14);
  assert.equal(lv1StrikeVoice.finalDamage, 14);

  const lv4CombatCast = calculateSpellCastStats({
    spellId: 'incendio',
    castMode: 'voice',
    gestureAccuracy: 0,
    voiceMatched: true,
    playerLevel: 1,
    spellLevel: 4,
    staffId: 'wand_ollivander',
  });
  assert.equal(lv4CombatCast.finalDamage, 22);
  assert.equal(lv4CombatCast.cooldownSec, 3.25);
  assert.equal(lv4CombatCast.projectileCount, 2);

  // 4. Teleport ('teleport' on [Ё]): 10s base cooldown, voice gives 14 damage & medium cooldown, high-accuracy circle gives faster cooldown & higher AoE damage
  assert.equal(TELEPORT_BASE_COOLDOWN_SEC, 10.0);
  assert.equal(TELEPORT_BLAST_RADIUS, 6.0);
  assert.equal(getTeleportMaxRange(1), 16);
  assert.equal(getTeleportMaxRange(5), 32);

  const tpQuick = calculateSpellCastStats({
    spellId: 'teleport',
    castMode: 'quick',
    gestureAccuracy: 0,
    voiceMatched: false,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
  });
  const tpVoice = calculateSpellCastStats({
    spellId: 'teleport',
    castMode: 'voice',
    gestureAccuracy: 0,
    voiceMatched: true,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
  });
  const tpPerfectDraw = calculateSpellCastStats({
    spellId: 'teleport',
    castMode: 'drawn',
    gestureAccuracy: 100,
    voiceMatched: false,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
  });
  const tpLv5Perfect = calculateSpellCastStats({
    spellId: 'teleport',
    castMode: 'drawn',
    gestureAccuracy: 100,
    voiceMatched: false,
    playerLevel: 1,
    spellLevel: 5,
    staffId: 'wand_ollivander',
  });
  assert.equal(tpQuick.cooldownSec, 10.0);
  assert.equal(tpQuick.finalDamage, 2);
  assert.equal(tpVoice.finalDamage, 14);
  assert.ok(tpVoice.cooldownSec < tpQuick.cooldownSec && tpVoice.cooldownSec > tpPerfectDraw.cooldownSec);
  assert.equal(tpPerfectDraw.finalDamage, 30);
  assert.ok(tpPerfectDraw.cooldownSec <= 6.5);
  assert.ok(tpLv5Perfect.finalDamage > tpPerfectDraw.finalDamage);
  assert.ok(tpLv5Perfect.cooldownSec < tpPerfectDraw.cooldownSec);
  assert.equal(tpLv5Perfect.teleportRange, 32);

  // 5. Stupefy ("Остолбеней"): 8 on voice, 4..20 on drawn gesture
  const stupefyVoice = calculateSpellCastStats({
    spellId: 'stupefy',
    castMode: 'voice',
    gestureAccuracy: 0,
    voiceMatched: true,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
  });
  const stupefyPoorDraw = calculateSpellCastStats({
    spellId: 'stupefy',
    castMode: 'drawn',
    gestureAccuracy: 10,
    voiceMatched: false,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
  });
  const stupefyPerfectDraw = calculateSpellCastStats({
    spellId: 'stupefy',
    castMode: 'drawn',
    gestureAccuracy: 100,
    voiceMatched: false,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
  });
  assert.equal(stupefyVoice.rawBaseDamage, 8);
  assert.equal(stupefyVoice.finalDamage, 8);
  assert.equal(stupefyPoorDraw.rawBaseDamage, 4);
  assert.equal(stupefyPerfectDraw.rawBaseDamage, 20);

  // 5b. Glacius ("Мороз"): 10 on voice, 4..26 drawn and 30% slow for 2s
  assert.equal(GLACIUS_SLOW_PERCENT, 30);
  assert.equal(GLACIUS_SLOW_FACTOR, 0.7);
  assert.equal(GLACIUS_SLOW_DURATION_SEC, 2.0);
  const glaciusVoice = calculateSpellCastStats({
    spellId: 'glacius',
    castMode: 'voice',
    gestureAccuracy: 0,
    voiceMatched: true,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
  });
  const glaciusPoorDraw = calculateSpellCastStats({
    spellId: 'glacius',
    castMode: 'drawn',
    gestureAccuracy: 10,
    voiceMatched: false,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
  });
  const glaciusPerfectDraw = calculateSpellCastStats({
    spellId: 'glacius',
    castMode: 'drawn',
    gestureAccuracy: 100,
    voiceMatched: false,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
  });
  assert.equal(glaciusVoice.rawBaseDamage, 10);
  assert.equal(glaciusVoice.finalDamage, 10);
  assert.equal(glaciusPoorDraw.rawBaseDamage, 4);
  assert.equal(glaciusPerfectDraw.rawBaseDamage, 26);

  // 6. Heal ('vera_verto' -> Лечение): 25 on voice & Growth ('engorgio' -> Рост): 30 MP, 30s CD
  const healVoice = calculateSpellCastStats({
    spellId: 'vera_verto',
    castMode: 'voice',
    gestureAccuracy: 0,
    voiceMatched: true,
    playerLevel: 1,
    staffId: 'wand_ollivander',
  });
  assert.equal(healVoice.healAmount, 25);
  assert.equal(healVoice.manaCost, SPECIAL_MANA_COST);
  assert.equal(healVoice.cooldownSec, SPECIAL_COOLDOWN_SEC);

  const growthPerfect = calculateSpellCastStats({
    spellId: 'engorgio',
    castMode: 'drawn',
    gestureAccuracy: 100,
    voiceMatched: false,
    playerLevel: 1,
    staffId: 'wand_ollivander',
  });
  assert.equal(growthPerfect.petDurationSec, ENGORGIO_BUFF_DURATION_SEC);

  // 7. Campfire Teleport ('campfire_teleport' on [F]): 10 MP, 120s CD (Lv1), 3.0s quick / 2.0s voice / 2.2..1.5s drawn
  assert.equal(CAMPFIRE_TELEPORT_MANA_COST, 10);
  assert.equal(CAMPFIRE_TELEPORT_COOLDOWN_SEC, 120.0);
  assert.equal(calculateCampfireTeleportCastDuration('quick', 0), 3.0);
  assert.equal(calculateCampfireTeleportCastDuration('voice', 0), 2.0);
  assert.equal(calculateCampfireTeleportCastDuration('drawn', 0), 2.2);
  assert.equal(calculateCampfireTeleportCastDuration('drawn', 100), 1.5);

  const cfQuick = calculateSpellCastStats({
    spellId: 'campfire_teleport',
    castMode: 'quick',
    gestureAccuracy: 0,
    voiceMatched: false,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
  });
  const cfVoice = calculateSpellCastStats({
    spellId: 'campfire_teleport',
    castMode: 'voice',
    gestureAccuracy: 0,
    voiceMatched: true,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
  });
  const cfDrawnPerfect = calculateSpellCastStats({
    spellId: 'campfire_teleport',
    castMode: 'drawn',
    gestureAccuracy: 100,
    voiceMatched: false,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
  });
  assert.equal(cfQuick.manaCost, 10);
  assert.equal(cfQuick.cooldownSec, 120.0);
  assert.equal(cfQuick.castDurationSec, 3.0);
  assert.equal(cfVoice.castDurationSec, 2.0);
  assert.equal(cfDrawnPerfect.castDurationSec, 1.5);
});

test('Labyrinth Stages 1, 2, and 3 have 14, 18, and 24 floor traps, 5 Stage-2 & 6 horizontal Stage-3 Blue Laser Beams, and Stage 2/3 Solid Sliding Rune Gates', () => {
  assert.equal(isLabyrinthStageTraversable(1), true, 'Stage 1 must be passable from start to goal');
  assert.equal(isLabyrinthStageTraversable(2), true, 'Stage 2 must be passable from start to goal');
  assert.equal(isLabyrinthStageTraversable(3), true, 'Stage 3 must be passable from start to goal');

  const s1 = getLabyrinthStageLayout(1);
  const s2 = getLabyrinthStageLayout(2);
  const s3 = getLabyrinthStageLayout(3);
  assert.ok(s1.startX <= -35 && s1.startZ >= 88, 'Stage 1 spawns in the safe beginning corner');
  assert.ok(s2.startX <= -40 && s2.startZ >= 100, 'Stage 2 spawns in the safe beginning corner');
  assert.ok(s3.startX <= -44 && s3.startZ >= 132, 'Stage 3 spawns in the safe beginning corner');

  // Verify +4 traps per map (14 on Stage 1, 18 on Stage 2, 24 on Stage 3) and +20% wider size (1.44x)
  assert.equal(FLOOR_TRAP_SCALE_MULTIPLIER, 1.44);
  assert.equal(FLOOR_TRAP_TRIGGER_RADIUS, 2.38);
  assert.equal(getLabyrinthFloorTraps(1).length, 14);
  assert.equal(getLabyrinthFloorTraps(2).length, 18);
  assert.equal(getLabyrinthFloorTraps(3).length, 24);

  // Verify 5 Blue Laser Beam Traps on Stage 2 (20m full-corridor span) and 6 Horizontal Laser Beam Traps on Stage 3 (24m full-corridor span)
  assert.equal(LASER_TRAP_DAMAGE, 45);
  assert.equal(LASER_TRAP_RESPAWN_SEC, 60.0);
  assert.equal(getLabyrinthLaserTraps(1).length, 0);
  assert.equal(getLabyrinthLaserTraps(2).length, 5);
  assert.equal(getLabyrinthLaserTraps(3).length, 6);
  for (const beam of s2.laserTraps) {
    assert.equal(beam.damage, 45);
    assert.equal(beam.respawnSec, 60);
    assert.equal(
      beam.span,
      beam.axis === 'x' ? 20 : 25.5,
      'Stage 2 laser beam must span the entire passage width wall-to-wall'
    );
  }
  for (const beam of s3.laserTraps) {
    assert.equal(beam.axis, 'x', 'Stage 3 laser beams must be horizontal (axis: x)');
    assert.equal(beam.damage, 45);
    assert.equal(beam.respawnSec, 60);
    assert.equal(beam.span, 24, 'Stage 3 laser beam must span the entire 24m corridor width wall-to-wall');
  }

  // Verify Solid Sliding Rune Gates & Elemental Magic Buttons:
  // Stage 1: 3 Secret Room doors, each opened by 1 nearby button with 3 different elements (Огонь, Мороз, Ток/Удар)
  // Stage 2: 1 gate in the middle with 2 nearby buttons (floor & wall)
  // Stage 3: 2 gates, each with 4 buttons (Огонь, Мороз, Ток/Удар, Стоп on floor & walls)
  const gates1 = getLabyrinthRuneGates(1);
  assert.equal(gates1.length, 3);
  const s1SecretSpells = gates1.map((g) => g.buttons[0].requiredSpellId).sort();
  assert.deepEqual(
    s1SecretSpells,
    ['expelliarmus', 'glacius', 'incendio'],
    'All 3 Stage 1 Secret Room buttons must use different elements'
  );

  const gates2 = getLabyrinthRuneGates(2);
  assert.equal(gates2.length, 1);
  assert.equal(gates2[0].buttons.length, 2);
  assert.equal(gates2[0].buttons[0].mount, 'floor');
  assert.equal(gates2[0].buttons[1].mount, 'wall');

  const gates3 = getLabyrinthRuneGates(3);
  assert.equal(gates3.length, 2);
  for (const g of gates3) {
    assert.equal(g.buttons.length, 4);
    const spells = g.buttons.map((b) => b.requiredSpellId).sort();
    assert.deepEqual(spells, ['expelliarmus', 'glacius', 'incendio', 'stupefy']);
    const mounts = new Set(g.buttons.map((b) => b.mount));
    assert.equal(mounts.has('floor'), true);
    assert.equal(mounts.has('wall'), true);
  }

  // Verify Stage 4 True Maze ("Лабиринт Стихий"): larger map, passable via BFS, 28 floor traps, 8 lasers, 2 Rune Gates with stupefy buttons
  assert.equal(isLabyrinthStageTraversable(4), true, 'Stage 4 True Maze must be passable from start to goal');
  const s4 = getLabyrinthStageLayout(4);
  assert.equal(s4.halfWidth, 84);
  assert.equal(s4.halfLength, 188);
  assert.equal(getLabyrinthFloorTraps(4).length, 28);
  assert.equal(getLabyrinthLaserTraps(4).length, 8);
  const gates4 = getLabyrinthRuneGates(4);
  assert.equal(gates4.length, 2);
  for (const g of gates4) {
    assert.equal(g.buttons.length, 4);
    const spells = g.buttons.map((b) => b.requiredSpellId).sort();
    assert.deepEqual(spells, ['expelliarmus', 'glacius', 'incendio', 'stupefy']);
  }

  // Verify Rune Button scale is reduced by an additional 30% (0.49), all expelliarmus buttons are RED (#ef4444), and Barrel Respawn is 60s
  assert.equal(RUNE_BUTTON_SCALE, 0.49);
  assert.equal(BARREL_RESPAWN_SEC, 60.0);
  for (const g of [...gates1, ...gates2, ...gates3, ...gates4]) {
    for (const b of g.buttons) {
      if (b.requiredSpellId === 'expelliarmus') {
        assert.equal(
          b.colorHex,
          '#ef4444',
          `Rune button ${b.id} for expelliarmus must be red (#ef4444)`
        );
      }
    }
  }

  // Verify shallow water lakes placement & distinct sizes
  const lake1 = getLabyrinthWaterLake(1);
  const lake2 = getLabyrinthWaterLake(2);
  const lake3 = getLabyrinthWaterLake(3);
  const lake4 = getLabyrinthWaterLake(4);
  assert.ok(Math.abs(lake1.z) <= 15, 'Stage 1 lake should be in the center of the map');
  assert.ok(lake2.z >= 50, 'Stage 2 lake should be closer to the start of the map');
  assert.ok(lake3.z <= -90, 'Stage 3 lake should be closer to the end of the map');
  assert.ok(lake4.radiusX > 0 && lake4.radiusZ > 0, 'Stage 4 lake exists');
  assert.notEqual(lake1.radiusX, lake2.radiusX);
  assert.notEqual(lake2.radiusX, lake3.radiusX);

  for (const layout of [s1, s2, s3, s4]) {
    let backHalfCount = 0;
    for (const trap of layout.floorTraps) {
      assert.equal(trap.damage, FLOOR_TRAP_DAMAGE);
      assert.equal(trap.damage, 30);
      assert.equal(trap.radius, 2.38);
      if (trap.z < 0) backHalfCount += 1;
      for (const wb of layout.wallBoxes) {
        const insideWall =
          trap.x > wb.minX && trap.x < wb.maxX && trap.z > wb.minZ && trap.z < wb.maxZ;
        assert.equal(insideWall, false, `Trap ${trap.id} overlaps wall on stage ${layout.stage}`);
      }
    }
    assert.ok(
      backHalfCount >= Math.ceil(layout.floorTraps.length * 0.55),
      `Expected majority of traps in back half closer to Boss on stage ${layout.stage}`
    );
  }

  assert.equal(segmentHitsWall(-18, 80, -18, 55, s1.wallBoxes, 0.25), true);
  assert.equal(segmentHitsWall(36, 80, 36, 55, s1.wallBoxes, 0.25), false);
});

test('Steeper upgrade and crafting costs require 4/8/14/22 for spells, 4/7/11/16 for pets, and large recipes for staffs', () => {
  assert.equal(MAX_SPELL_LEVEL, 6);
  assert.equal(getSpellUpgradeCost(1).totalResources, 4);
  assert.equal(getSpellUpgradeCost(2).totalResources, 8);
  assert.equal(getSpellUpgradeCost(3).totalResources, 14);
  assert.equal(getSpellUpgradeCost(4).totalResources, 22);
  assert.equal(getSpellUpgradeCost(5).totalResources, 30);
  assert.equal(getSpellUpgradeCost(5).minElementalReagents, 3);

  assert.equal(getPetTrainingStepCost(1).totalResources, 4);
  assert.equal(getPetTrainingStepCost(2).totalResources, 7);
  assert.equal(getPetTrainingStepCost(3).totalResources, 11);
  assert.equal(getPetTrainingStepCost(4).totalResources, 16);

  const inv: Record<ReagentId, number> = {
    ancient_wood: 14,
    mandrake_root: 8,
    rat_hair: 0,
    rat_meat: 4,
    bat_meat: 2,
    boar_meat: 4,
    bear_meat: 2,
    boar_tusk: 5,
    gargoyle_heart: 7,
    harpy_feather: 6,
    dark_core_shard: 6,
    ice_dragon_scale: 8,
    fire_essence: 3,
    water_essence: 3,
    earth_essence: 3,
  };

  assert.equal(canAffordSpellUpgrade(1, inv), true);
  const afterLv2 = consumeSpellUpgradeCost(1, inv);
  assert.equal(afterLv2.mandrake_root, 4);

  assert.equal(canAffordPetTrainingStep(1, afterLv2), true);
  const afterPetStep = consumePetTrainingStepCost(1, afterLv2);
  assert.equal(afterPetStep.mandrake_root, 0);

  // Verify 4th and 5th staffs require boar_tusk (Клык лютого кабана)
  assert.equal(EQUIPMENT_CATALOG.staff_frost_dragon.recipe.boar_tusk, 4);
  assert.equal(EQUIPMENT_CATALOG.staff_tri_elemental.recipe.boar_tusk, 5);

  const craftInv: Record<ReagentId, number> = {
    ...inv,
    mandrake_root: 12,
    boar_tusk: 4,
  };
  const craftRes = craftEquipmentItem('staff_frost_dragon', craftInv, ['wand_ollivander']);
  assert.equal(craftRes.success, true);
  assert.equal(craftRes.updatedInventory.ancient_wood, 0);
  assert.equal(craftRes.updatedInventory.ice_dragon_scale, 0);
  assert.equal(craftRes.updatedInventory.boar_tusk, 0);
  assert.ok(craftRes.updatedOwned.includes('staff_frost_dragon'));

  // Verify Level 6 spell upgrade requires elemental essences and unlocks SPELL_LEVEL_6_EFFECTS
  assert.equal(canAffordSpellUpgrade(5, inv), true);
  for (const spellId of SPELL_ORDER) {
    assert.ok(SPELL_LEVEL_6_EFFECTS[spellId].length > 0);
  }
});

test('42 categorized quests (including Stage 3-5 elite quests, Bosses 1-5, Walls, and Flawless Run) require manual claimQuestReward', () => {
  assert.equal(INITIAL_QUESTS.length, 42);
  const categories = new Set(INITIAL_QUESTS.map((q) => q.category));
  assert.deepEqual(
    Array.from(categories).sort(),
    ['combat', 'exploration', 'magic', 'survival']
  );

  // Verify new Stage 3-4 quests exist
  const questIds = new Set(INITIAL_QUESTS.map((q) => q.id));
  assert.equal(questIds.has('quest_kill_boars_6'), true);
  assert.equal(questIds.has('quest_kill_elementals_10'), true);
  assert.equal(questIds.has('quest_kill_all_bosses_4'), true);
  assert.equal(questIds.has('quest_cook_boar_3'), true);
  assert.equal(questIds.has('quest_cook_bat_water_3'), true);
  assert.equal(questIds.has('quest_spell_lv6_1'), true);
  assert.equal(questIds.has('quest_teleport_casts_12'), true);
  assert.equal(questIds.has('quest_rune_buttons_8'), true);

  const emptyInv: Record<ReagentId, number> = {
    ancient_wood: 0,
    mandrake_root: 0,
    rat_hair: 0,
    rat_meat: 0,
    bat_meat: 0,
    boar_meat: 0,
    bear_meat: 0,
    boar_tusk: 0,
    gargoyle_heart: 0,
    harpy_feather: 0,
    dark_core_shard: 0,
    ice_dragon_scale: 0,
    fire_essence: 0,
    water_essence: 0,
    earth_essence: 0,
  };

  const step1 = advanceQuestProgress(INITIAL_QUESTS, [{ type: 'cast_any', amount: 11 }]);
  assert.equal(step1.newlyCompleted.length, 0);
  const step2 = advanceQuestProgress(step1.updatedQuests, [{ type: 'cast_any', amount: 1 }]);
  assert.equal(step2.newlyCompleted.length, 1);
  assert.equal(step2.newlyCompleted[0].id, 'quest_cast_any_5');

  const completedQuest = step2.updatedQuests.find((q) => q.id === 'quest_cast_any_5')!;
  assert.equal(completedQuest.completed, true);
  assert.equal(completedQuest.claimed, false);
  assert.equal(completedQuest.rewardXp, 16);

  const claimRes = claimQuestReward(step2.updatedQuests, 'quest_cast_any_5', emptyInv);
  assert.ok(claimRes.claimedQuest);
  assert.equal(claimRes.claimedQuest!.id, 'quest_cast_any_5');
  assert.equal(claimRes.rewardXp, 16);
  assert.equal(claimRes.updatedInventory.ancient_wood, 1);
  assert.equal(claimRes.updatedInventory.mandrake_root, 1);
  const afterClaim = claimRes.updatedQuests.find((q) => q.id === 'quest_cast_any_5')!;
  assert.equal(afterClaim.claimed, true);

  const doubleClaim = claimQuestReward(claimRes.updatedQuests, 'quest_cast_any_5', claimRes.updatedInventory);
  assert.equal(doubleClaim.claimedQuest, null);
});

test('Red barrel explosion, potions, rat food (+HP), and bat food (+MP) scale 10..50 and 1..5 min', () => {
  const weakThrow = calculateExplosiveBarrelDamage(2);
  const voiceThrow = calculateExplosiveBarrelDamage(10);
  const perfectThrow = calculateExplosiveBarrelDamage(36);
  assert.ok(weakThrow >= 45);
  assert.ok(voiceThrow > weakThrow);
  assert.ok(perfectThrow > voiceThrow);
  assert.equal(perfectThrow, Math.round(45 + 36 * 2.25));

  const hpMin = calculateCraftedPotionStats('health', 0);
  const hpMid = calculateCraftedPotionStats('health', 50);
  const hpMax = calculateCraftedPotionStats('health', 100);
  assert.equal(hpMin.restoreAmount, 10);
  assert.equal(hpMid.restoreAmount, 30);
  assert.equal(hpMax.restoreAmount, 50);

  const mpMin = calculateCraftedPotionStats('mana', 0);
  const mpMax = calculateCraftedPotionStats('mana', 100);
  assert.equal(mpMin.restoreAmount, 10);
  assert.equal(mpMax.restoreAmount, 50);

  const ratMin = calculateCookedRatFoodStats(0);
  const ratMid = calculateCookedRatFoodStats(50);
  const ratMax = calculateCookedRatFoodStats(100);
  assert.equal(ratMin.bonusMaxHp, 10);
  assert.equal(ratMin.hpRegenPerSec, 0.1);
  assert.equal(ratMin.durationSec, 60);

  assert.equal(ratMid.bonusMaxHp, 30);
  assert.equal(ratMid.hpRegenPerSec, 0.3);
  assert.equal(ratMid.durationSec, 180);

  assert.equal(ratMax.bonusMaxHp, 50);
  assert.equal(ratMax.hpRegenPerSec, 0.5);
  assert.equal(ratMax.durationSec, 300);

  const batMin = calculateCookedBatFoodStats(0);
  const batMid = calculateCookedBatFoodStats(50);
  const batMax = calculateCookedBatFoodStats(100);
  assert.equal(batMin.bonusMaxMp, 10);
  assert.equal(batMin.mpRegenPerSec, 0.1);
  assert.equal(batMin.durationSec, 60);

  assert.equal(batMid.bonusMaxMp, 30);
  assert.equal(batMid.mpRegenPerSec, 0.3);
  assert.equal(batMid.durationSec, 180);

  assert.equal(batMax.bonusMaxMp, 50);
  assert.equal(batMax.mpRegenPerSec, 0.5);
  assert.equal(batMax.durationSec, 300);

  const tracePts = CRAFT_DRAW_TEMPLATES.rat_food.points.map((p) => ({
    x: p.x * 220,
    y: p.y * 220,
  }));
  const drawEval = evaluateCampfireCraftDrawing(tracePts, 'rat_food');
  assert.ok(drawEval.accuracy >= 80, `Expected accuracy >= 80, got ${drawEval.accuracy}`);
  assert.ok(drawEval.completionRatio >= 0.8);

  const batTracePts = CRAFT_DRAW_TEMPLATES.bat_food.points.map((p) => ({
    x: p.x * 220,
    y: p.y * 220,
  }));
  const batDrawEval = evaluateCampfireCraftDrawing(batTracePts, 'bat_food');
  assert.ok(batDrawEval.accuracy >= 80, `Expected bat accuracy >= 80, got ${batDrawEval.accuracy}`);

  // Boar food (+25..80 Max HP, +0.3..0.9 HP/s, 90..360s) and Bat+Water food (+25..80 Max MP, +0.3..0.9 MP/s)
  const boarMin = calculateCookedBoarFoodStats(0);
  const boarMax = calculateCookedBoarFoodStats(100);
  assert.equal(boarMin.bonusMaxHp, 25);
  assert.equal(boarMin.hpRegenPerSec, 0.3);
  assert.equal(boarMin.durationSec, 90);
  assert.equal(boarMax.bonusMaxHp, 80);
  assert.equal(boarMax.hpRegenPerSec, 0.9);
  assert.equal(boarMax.durationSec, 360);

  const batWaterMin = calculateCookedBatFoodStats(0, true);
  const batWaterMax = calculateCookedBatFoodStats(100, true);
  assert.equal(batWaterMin.bonusMaxMp, 25);
  assert.equal(batWaterMin.mpRegenPerSec, 0.3);
  assert.equal(batWaterMin.durationSec, 90);
  assert.equal(batWaterMax.bonusMaxMp, 80);
  assert.equal(batWaterMax.mpRegenPerSec, 0.9);
  assert.equal(batWaterMax.durationSec, 360);

  const boarTracePts = CRAFT_DRAW_TEMPLATES.boar_food.points.map((p) => ({
    x: p.x * 220,
    y: p.y * 220,
  }));
  const boarDrawEval = evaluateCampfireCraftDrawing(boarTracePts, 'boar_food');
  assert.ok(boarDrawEval.accuracy >= 80, `Expected boar accuracy >= 80, got ${boarDrawEval.accuracy}`);

  // Boar 15% slow and Base Held Shield 50% damage reduction
  assert.equal(BOAR_SLOW_PERCENT, 15);
  assert.equal(BOAR_SLOW_FACTOR, 0.85);
  assert.equal(BOAR_SLOW_DURATION_SEC, 3.0);
  assert.equal(SHIELD_BASE_DAMAGE_MULTIPLIER, 0.5);
});

test('Contextual Water & Snow gestures, 1..3 min Elemental Allies (melee Snowman vs ranged Water Helper), and 60s Harvest respawn', () => {
  assert.equal(HARVEST_NODE_RESPAWN_SEC, 60.0);

  const iceOnWater = getActiveSpellGestureInfo('glacius', 'water');
  assert.equal(iceOnWater.isContextual, true);
  assert.equal(iceOnWater.contextId, 'snowflake');

  const growthOnWater = getActiveSpellGestureInfo('engorgio', 'water');
  assert.equal(growthOnWater.isContextual, true);
  assert.equal(growthOnWater.contextId, 'water_two_spheres');

  const growthOnSnow = getActiveSpellGestureInfo('engorgio', 'snow');
  assert.equal(growthOnSnow.isContextual, true);
  assert.equal(growthOnSnow.contextId, 'snow_three_spheres');

  const growthOnNone = getActiveSpellGestureInfo('engorgio', 'none');
  assert.equal(growthOnNone.isContextual, false);
  assert.equal(growthOnNone.contextId, null);

  for (const ctxId of ['snowflake', 'water_two_spheres', 'snow_three_spheres'] as const) {
    const pts = CONTEXT_GESTURE_TEMPLATES[ctxId].points.map((p) => ({
      x: p.x * 200,
      y: p.y * 200,
    }));
    const res = evaluateContextualGesture(pts, ctxId);
    assert.ok(res.accuracy >= 80, `Expected ${ctxId} accuracy >= 80, got ${res.accuracy}`);
  }

  // Elemental Ally duration scales from 30s (0.5 min) to 150s (2.5 min) (-30s); Snowman is melee-only (projectileSpeed=0) and deals higher damage
  const waterMin = calculateElementalAllyStats('water_spirit', 0, 1);
  const waterMid = calculateElementalAllyStats('water_spirit', 50, 1);
  const waterMax = calculateElementalAllyStats('water_spirit', 100, 1);
  assert.equal(waterMin.durationSec, 30);
  assert.equal(waterMid.durationSec, 90);
  assert.equal(waterMax.durationSec, 150);
  assert.equal(waterMin.attackDamage, 6);
  assert.equal(waterMax.attackDamage, 12);
  assert.ok(waterMax.projectileSpeed > 0);

  const snowmanMin = calculateElementalAllyStats('snowman', 0, 1);
  const snowmanMax = calculateElementalAllyStats('snowman', 100, 1);
  assert.equal(snowmanMin.durationSec, 30);
  assert.equal(snowmanMax.durationSec, 150);
  assert.equal(snowmanMin.attackDamage, 12);
  assert.equal(snowmanMax.attackDamage, 22);
  assert.equal(snowmanMin.projectileSpeed, 0, 'Snowman fights strictly in melee');
  assert.ok(snowmanMin.attackDamage > waterMin.attackDamage, 'Snowman deals higher damage than Water Helper');
  assert.ok(snowmanMax.attackDamage > waterMax.attackDamage, 'Snowman max damage exceeds Water Helper max damage');
});

test('Labyrinth multiplayer modes support Shared Co-op (+30% enemy HP, +20% enemy damage, Boss-locked portal) and Parallel Worlds', () => {
  // 1. Both modes exist with Friendly Fire enabled; 'shared' shares enemies/boss/stage, 'parallel' keeps independent worlds
  const shared = LABYRINTH_MULTIPLAYER_MODES.shared;
  const parallel = LABYRINTH_MULTIPLAYER_MODES.parallel;
  assert.equal(shared.sharedEnemies, true);
  assert.equal(shared.sharedBoss, true);
  assert.equal(shared.sharedStageTransition, true);
  assert.equal(shared.friendlyFireEnabled, true);

  assert.equal(parallel.sharedEnemies, false);
  assert.equal(parallel.sharedBoss, false);
  assert.equal(parallel.sharedStageTransition, false);
  assert.equal(parallel.friendlyFireEnabled, true);

  // 2. Shared Co-op scales enemy HP by +30% (1.3x) and enemy damage by +20% (1.2x)
  assert.equal(SHARED_COOP_ENEMY_HP_MULTIPLIER, 1.3);
  assert.equal(SHARED_COOP_ENEMY_DAMAGE_MULTIPLIER, 1.2);
  const coopBoss = getScaledEnemyStatsForMode(700, 20, 'shared', true);
  assert.equal(coopBoss.maxHp, 910); // 700 * 1.3
  assert.equal(coopBoss.damage, 24); // 20 * 1.2
  const parallelBoss = getScaledEnemyStatsForMode(700, 20, 'parallel', true);
  assert.equal(parallelBoss.maxHp, 700);
  assert.equal(parallelBoss.damage, 20);

  // 3. Boss-locked portal check (isStageBossDefeated)
  assert.equal(
    isStageBossDefeated([{ archetype: 'boss_mage_1', state: 'seek', hp: 120 }], 1),
    false,
    'Portal must remain locked while Stage 1 Boss is alive'
  );
  assert.equal(
    isStageBossDefeated([{ archetype: 'boss_mage_1', state: 'ko', hp: 0 }], 1),
    true,
    'Portal unlocks once Stage 1 Boss is defeated'
  );
  assert.equal(
    isStageBossDefeated([{ archetype: 'boss_mage_3', state: 'seek', hp: 350 }], 3),
    false,
    'Stage 3 Portal must remain locked while Stage 3 Boss is alive'
  );
  assert.equal(
    isStageBossDefeated([], 3),
    true,
    'Stage 3 Portal unlocks when Boss is removed after KO'
  );

  // 4. Deterministic enemy IDs match across clients for the same stage & index
  assert.equal(getDeterministicEnemyId(1, 0, false), 'stage_1_enemy_0');
  assert.equal(getDeterministicEnemyId(1, 18, false), 'stage_1_enemy_18');
  assert.equal(getDeterministicEnemyId(2, 20, false), 'stage_2_enemy_20');
  assert.equal(getDeterministicEnemyId(3, 27, false), 'stage_3_enemy_27');

  // 5. Shared enemy damage reconciliation is idempotent and prevents duplicate kills
  const hit1 = reconcileSharedEnemyDamage(260, 260, 60);
  assert.equal(hit1.nextHp, 200);
  assert.equal(hit1.damageApplied, 60);
  assert.equal(hit1.isFirstKill, false);

  const hit2 = reconcileSharedEnemyDamage(hit1.nextHp, 260, 40, 150);
  assert.equal(hit2.nextHp, 150);
  assert.equal(hit2.isFirstKill, false);

  const fatalHit = reconcileSharedEnemyDamage(hit2.nextHp, 260, 160, 0);
  assert.equal(fatalHit.nextHp, 0);
  assert.equal(fatalHit.isFirstKill, true);

  const duplicateFatalHit = reconcileSharedEnemyDamage(fatalHit.nextHp, 260, 50, 0);
  assert.equal(duplicateFatalHit.nextHp, 0);
  assert.equal(duplicateFatalHit.damageApplied, 0);
  assert.equal(duplicateFatalHit.isFirstKill, false, 'Already-dead enemy must not trigger a second kill');

  // 6. Multi-player aggro selects the nearest living wizard
  const aggro = selectEnemyAggroTarget(
    { x: 0, z: -80 },
    [
      { id: 'wiz_1', x: -20, z: -60, hp: 100 },
      { id: 'wiz_2', x: 3, z: -76, hp: 85 },
      { id: 'wiz_dead', x: 0, z: -79, hp: 0 },
    ],
    45
  );
  assert.ok(aggro);
  assert.equal(aggro!.target.id, 'wiz_2');
});

test('Sequential Wave Spike Trap Zones (Stage 2: [3,3], Stage 3: [4,4,4], Stage 4: [3,4,5]), Treasure Chests (4/5/6/6), and 20 Wearable Artifacts + 50% Salvage', () => {
  // 1. Spike Trap Zones per stage & 30 damage
  assert.equal(SPIKE_TRAP_DAMAGE, 30);
  assert.equal(getLabyrinthSpikeTrapZones(1).length, 0);
  const spikes2 = getLabyrinthSpikeTrapZones(2);
  const spikes3 = getLabyrinthSpikeTrapZones(3);
  const spikes4 = getLabyrinthSpikeTrapZones(4);
  assert.deepEqual(
    spikes2.map((z) => z.lineCount),
    [3, 3]
  );
  assert.deepEqual(
    spikes3.map((z) => z.lineCount),
    [4, 4, 4]
  );
  assert.deepEqual(
    spikes4.map((z) => z.lineCount),
    [3, 4, 5]
  );
  for (const z of [...spikes2, ...spikes3, ...spikes4]) {
    assert.equal(z.damage, 30);
    assert.ok(z.span >= 18, 'Spike trap zone must span the full corridor width');
  }

  // Verify sequential Enshrouded-style wave timing: when Line 0 is extended at t=0.4s, Line 1 and Line 2 are retracted;
  // when Line 1 is extended at t=1.2s, Line 0 and Line 2 are retracted!
  const l0At04 = evaluateSpikeLineWaveState(0.4, 0, 3);
  const l1At04 = evaluateSpikeLineWaveState(0.4, 1, 3);
  const l2At04 = evaluateSpikeLineWaveState(0.4, 2, 3);
  assert.equal(l0At04.isHazardActive, true);
  assert.equal(l1At04.isHazardActive, false);
  assert.equal(l2At04.isHazardActive, false);

  const l0At12 = evaluateSpikeLineWaveState(1.2, 0, 3);
  const l1At12 = evaluateSpikeLineWaveState(1.2, 1, 3);
  const l2At12 = evaluateSpikeLineWaveState(1.2, 2, 3);
  assert.equal(l0At12.isHazardActive, false);
  assert.equal(l1At12.isHazardActive, true);
  assert.equal(l2At12.isHazardActive, false);

  // 2. Treasure Chest counts per stage: 3 on Stage 1 (2 with Tier 1 artifacts, 1 with resources only), 4 on Stage 2 (Tier 2 artifacts), 5 on Stage 3 (Tier 3-4 artifacts), 6 on Stage 4 (Tier 3-5 artifacts)
  const chests1 = getLabyrinthChests(1);
  const chests2 = getLabyrinthChests(2);
  const chests3 = getLabyrinthChests(3);
  const chests4 = getLabyrinthChests(4);
  assert.equal(chests1.length, 3);
  assert.equal(chests1.filter((c) => c.artifactPool.length > 0).length, 2);
  assert.equal(chests1.filter((c) => c.artifactPool.length === 0).length, 1);
  assert.equal(chests2.length, 4);
  assert.equal(chests3.length, 5);
  assert.equal(chests4.length, 6);

  // Verify Stage-specific Artifact Tiers in Chest Pools:
  // Stage 1: Tier 1 only
  for (const c of chests1) {
    for (const aId of c.artifactPool) {
      assert.equal(ARTIFACT_CATALOG[aId].tier, 1);
    }
  }
  // Stage 2: Tier 2 only
  for (const c of chests2) {
    for (const aId of c.artifactPool) {
      assert.equal(ARTIFACT_CATALOG[aId].tier, 2);
    }
  }
  // Stage 3: Tier 3 and Tier 4 only
  for (const c of chests3) {
    for (const aId of c.artifactPool) {
      assert.ok(
        ARTIFACT_CATALOG[aId].tier === 3 || ARTIFACT_CATALOG[aId].tier === 4,
        `Stage 3 chest ${c.id} has invalid tier ${ARTIFACT_CATALOG[aId].tier}`
      );
    }
  }
  // Stage 4: Tier 3, Tier 4, and Tier 5
  for (const c of chests4) {
    for (const aId of c.artifactPool) {
      assert.ok(
        ARTIFACT_CATALOG[aId].tier >= 3 && ARTIFACT_CATALOG[aId].tier <= 5,
        `Stage 4 chest ${c.id} has invalid tier ${ARTIFACT_CATALOG[aId].tier}`
      );
    }
  }

  // Verify no chest overlaps any wall box on Stages 1..4 and resource counts are reduced
  for (const stage of [1, 2, 3, 4] as const) {
    const layout = getLabyrinthStageLayout(stage);
    for (const chest of layout.chests) {
      for (const wb of layout.wallBoxes) {
        const inside =
          chest.x > wb.minX && chest.x < wb.maxX && chest.z > wb.minZ && chest.z < wb.maxZ;
        assert.equal(inside, false, `Chest ${chest.id} overlaps wall on stage ${stage}`);
      }
    }
    const lootSample = rollChestLoot(layout.chests[0], []);
    assert.ok(lootSample.artifactId, 'First chest on each stage must drop a wearable artifact');
    const totalReagents = Object.values(lootSample.reagents).reduce((a, b) => a + (b || 0), 0);
    assert.ok(
      totalReagents >= 2 && totalReagents <= 6,
      `Chest must drop a smaller amount of crafting reagents (got ${totalReagents})`
    );
  }
  // Verify 3rd chest on Stage 1 drops ONLY resources and NO artifact
  const resourceOnlyChestLoot = rollChestLoot(chests1[2], []);
  assert.equal(resourceOnlyChestLoot.artifactId, null);

  // 3. Verify all 20 Wearable Artifacts (5 Robes, 5 Gloves, 5 Rings, 5 Boots)
  const allArtifacts = Object.values(ARTIFACT_CATALOG);
  assert.equal(allArtifacts.length, 20);
  assert.equal(allArtifacts.filter((a) => a.slot === 'robe').length, 5);
  assert.equal(allArtifacts.filter((a) => a.slot === 'gloves').length, 5);
  assert.equal(allArtifacts.filter((a) => a.slot === 'ring').length, 5);
  assert.equal(allArtifacts.filter((a) => a.slot === 'boots').length, 5);

  // Robe Tier 1 -> Tier 5: +3..15% defense, 3..15% evasion, +30..140 Max HP
  assert.equal(ARTIFACT_CATALOG.robe_1.damageReductionPercent, 3);
  assert.equal(ARTIFACT_CATALOG.robe_1.evasionPercent, 3);
  assert.equal(ARTIFACT_CATALOG.robe_1.bonusMaxHp, 30);
  assert.equal(ARTIFACT_CATALOG.robe_5.damageReductionPercent, 15);
  assert.equal(ARTIFACT_CATALOG.robe_5.evasionPercent, 15);
  assert.equal(ARTIFACT_CATALOG.robe_5.bonusMaxHp, 140);

  // Gloves Tier 1 -> Tier 5: +0.2..1.0 MP/s, +30..100 Max MP, +5/+10/+15% spell damage on Tiers 3..5
  assert.equal(ARTIFACT_CATALOG.gloves_1.mpRegenBonus, 0.2);
  assert.equal(ARTIFACT_CATALOG.gloves_1.bonusMaxMp, 30);
  assert.equal(ARTIFACT_CATALOG.gloves_1.spellDamageBonusPercent, 0);
  assert.equal(ARTIFACT_CATALOG.gloves_2.spellDamageBonusPercent, 0);
  assert.equal(ARTIFACT_CATALOG.gloves_3.spellDamageBonusPercent, 5);
  assert.equal(ARTIFACT_CATALOG.gloves_4.spellDamageBonusPercent, 10);
  assert.equal(ARTIFACT_CATALOG.gloves_5.spellDamageBonusPercent, 15);
  assert.equal(ARTIFACT_CATALOG.gloves_5.mpRegenBonus, 1.0);
  assert.equal(ARTIFACT_CATALOG.gloves_5.bonusMaxMp, 100);

  // Ring Tier 1 -> Tier 5: -0.3..1.2s cooldown reduction, +2..5m teleport range
  assert.equal(ARTIFACT_CATALOG.ring_1.cooldownReductionSec, 0.3);
  assert.equal(ARTIFACT_CATALOG.ring_1.teleportRangeBonus, 2);
  assert.equal(ARTIFACT_CATALOG.ring_5.cooldownReductionSec, 1.2);
  assert.equal(ARTIFACT_CATALOG.ring_5.teleportRangeBonus, 5);

  // Boots Tier 1 -> Tier 5: +6..22% move speed, +2..10% defense
  assert.equal(ARTIFACT_CATALOG.boots_1.moveSpeedBonusPercent, 6);
  assert.equal(ARTIFACT_CATALOG.boots_1.damageReductionPercent, 2);
  assert.equal(ARTIFACT_CATALOG.boots_5.moveSpeedBonusPercent, 22);
  assert.equal(ARTIFACT_CATALOG.boots_5.damageReductionPercent, 10);

  // Combined bonuses & spell cast integration
  const maxSetBonuses = getCombinedArtifactBonuses({
    robe: 'robe_5',
    gloves: 'gloves_5',
    ring: 'ring_5',
    boots: 'boots_5',
  });
  assert.equal(maxSetBonuses.damageReductionPercent, 25); // 15% robe + 10% boots
  assert.equal(maxSetBonuses.evasionPercent, 15);
  assert.equal(maxSetBonuses.bonusMaxHp, 140);
  assert.equal(maxSetBonuses.bonusMaxMp, 100);
  assert.equal(maxSetBonuses.mpRegenBonus, 1.0);
  assert.equal(maxSetBonuses.spellDamageBonusPercent, 15);
  assert.equal(maxSetBonuses.cooldownReductionSec, 1.2);
  assert.equal(maxSetBonuses.teleportRangeBonus, 5);
  assert.equal(maxSetBonuses.moveSpeedBonusPercent, 22);

  const castWithArtifacts = calculateSpellCastStats({
    spellId: 'teleport',
    castMode: 'voice',
    gestureAccuracy: 0,
    voiceMatched: true,
    playerLevel: 1,
    spellLevel: 1,
    staffId: 'wand_ollivander',
    equippedArtifacts: { gloves: 'gloves_5', ring: 'ring_5' },
  });
  assert.equal(castWithArtifacts.teleportRange, 21); // 16m base + 5m Ring V

  // 4. Crafting & 50% Salvage Refund
  const inv: Record<ReagentId, number> = {
    ancient_wood: 4,
    mandrake_root: 4,
    rat_hair: 2,
    rat_meat: 0,
    bat_meat: 0,
    boar_meat: 0,
    bear_meat: 0,
    boar_tusk: 0,
    gargoyle_heart: 0,
    harpy_feather: 0,
    dark_core_shard: 0,
    ice_dragon_scale: 0,
    fire_essence: 0,
    water_essence: 0,
    earth_essence: 0,
  };
  assert.equal(canCraftArtifact('robe_1', inv), true);
  const crafted = craftArtifactItem('robe_1', inv, []);
  assert.equal(crafted.success, true);
  assert.equal(crafted.updatedInventory.ancient_wood, 0);
  assert.equal(crafted.updatedInventory.mandrake_root, 0);
  assert.equal(crafted.updatedInventory.rat_hair, 0);
  assert.deepEqual(crafted.updatedOwned, ['robe_1']);

  // Salvaging robe_1 (cost: 4 ancient_wood, 4 mandrake_root, 2 rat_hair) refunds 50% -> 2 ancient_wood, 2 mandrake_root, 1 rat_hair
  const refundPreview = getArtifactSalvageRefund('robe_1');
  assert.equal(refundPreview.ancient_wood, 2);
  assert.equal(refundPreview.mandrake_root, 2);
  assert.equal(refundPreview.rat_hair, 1);

  const salvaged = salvageArtifactItem(
    'robe_1',
    crafted.updatedInventory,
    crafted.updatedOwned as ArtifactId[],
    { robe: 'robe_1' }
  );
  assert.equal(salvaged.success, true);
  assert.equal(salvaged.updatedInventory.ancient_wood, 2);
  assert.equal(salvaged.updatedInventory.mandrake_root, 2);
  assert.equal(salvaged.updatedInventory.rat_hair, 1);
  assert.equal(salvaged.updatedOwned.length, 0);
  assert.equal(salvaged.updatedEquipped.robe, undefined);

  // Receiving a 2nd identical artifact from a chest records it as a duplicate and allows salvaging the duplicate while keeping the equipped copy!
  const firstPick = collectChestArtifact('ring_2', []);
  assert.equal(firstPick.isDuplicate, false);
  assert.equal(firstPick.newCount, 1);
  assert.equal(firstPick.duplicateCount, 0);

  const secondPick = collectChestArtifact('ring_2', firstPick.updatedOwned);
  assert.equal(secondPick.isDuplicate, true);
  assert.equal(secondPick.newCount, 2);
  assert.equal(secondPick.duplicateCount, 1);
  assert.equal(getArtifactOwnedCount('ring_2', secondPick.updatedOwned), 2);

  const salvagedDuplicate = salvageArtifactItem(
    'ring_2',
    salvaged.updatedInventory,
    secondPick.updatedOwned,
    { ring: 'ring_2' }
  );
  assert.equal(salvagedDuplicate.success, true);
  assert.equal(salvagedDuplicate.remainingCopies, 1);
  assert.deepEqual(salvagedDuplicate.updatedOwned, ['ring_2']);
  assert.equal(salvagedDuplicate.updatedEquipped.ring, 'ring_2');
});

test('Stage 5 Great Catacombs is larger than Stage 4 (192x440m), passable via BFS, and has 5 Secret Rooms, 3 Main 4-Button Gates, and full traps', () => {
  const s4 = getLabyrinthStageLayout(4);
  const s5 = getLabyrinthStageLayout(5);

  // Larger than Stage 4 (192m x 440m vs 168m x 376m)
  assert.equal(s5.halfWidth, 96);
  assert.equal(s5.halfLength, 220);
  assert.ok(s5.halfWidth > s4.halfWidth, 'Stage 5 must be wider than Stage 4');
  assert.ok(s5.halfLength > s4.halfLength, 'Stage 5 must be longer than Stage 4');

  // Verify BFS traversability from start (-76, 204) to goal (0, -204)
  assert.equal(isLabyrinthStageTraversable(5), true, 'Stage 5 maze must be traversable from start to goal');

  // Verify 8 Rune Gates total = 3 Main Closing Gates (4 buttons each) + 5 Secret Room Doors (1 button each)
  const gates5 = getLabyrinthRuneGates(5);
  assert.equal(gates5.length, 8);
  const mainGates5 = gates5.filter((g) => !g.isSecretRoom);
  const secretRooms5 = gates5.filter((g) => g.isSecretRoom);
  assert.equal(mainGates5.length, 3, 'Stage 5 must have 3 main closing rune gates');
  assert.equal(secretRooms5.length, 5, 'Stage 5 must have 5 secret rooms');

  for (const mg of mainGates5) {
    assert.equal(mg.buttons.length, 4, `Main gate ${mg.id} must have 4 elemental buttons`);
    const spells = mg.buttons.map((b) => b.requiredSpellId).sort();
    assert.deepEqual(spells, ['expelliarmus', 'glacius', 'incendio', 'stupefy']);
    for (const b of mg.buttons) {
      if (b.requiredSpellId === 'expelliarmus') {
        assert.equal(b.colorHex, '#ef4444');
      }
    }
  }

  for (const sr of secretRooms5) {
    assert.equal(sr.buttons.length, 1, `Secret room ${sr.id} must have 1 nearby elemental button`);
  }

  // Verify 6 Chests on Stage 5 (5 inside the 5 Secret Rooms + 1 in the deep catacombs)
  const chests5 = getLabyrinthChests(5);
  assert.equal(chests5.length, 6);
  assert.equal(chests5.filter((c) => c.isSecretRoom).length, 5);

  // Verify Traps on Stage 5: 34 floor traps, 14 wall-to-wall lasers, and 6 sequential spike trap zones ([4, 4, 4, 5, 5, 5])
  assert.equal(getLabyrinthFloorTraps(5).length, 34);
  assert.equal(getLabyrinthLaserTraps(5).length, 14);
  const spikes5 = getLabyrinthSpikeTrapZones(5);
  assert.equal(spikes5.length, 6);
  assert.deepEqual(
    spikes5.map((z) => z.lineCount),
    [4, 4, 4, 5, 5, 5]
  );

  // Verify no floor trap or chest overlaps a static wall on Stage 5
  for (const trap of s5.floorTraps) {
    for (const wb of s5.wallBoxes) {
      const inside =
        trap.x > wb.minX && trap.x < wb.maxX && trap.z > wb.minZ && trap.z < wb.maxZ;
      assert.equal(inside, false, `Stage 5 trap ${trap.id} overlaps wall`);
    }
  }
  for (const chest of chests5) {
    for (const wb of s5.wallBoxes) {
      const inside =
        chest.x > wb.minX && chest.x < wb.maxX && chest.z > wb.minZ && chest.z < wb.maxZ;
      assert.equal(inside, false, `Stage 5 chest ${chest.id} overlaps wall`);
    }
  }

  // Empty Stage 5 allows portal exit for inspection
  assert.equal(isStageBossDefeated([], 5), true);
});

test('Stage 5 Splitting Worm Boss (1 -> 2 -> 4 at <=30% HP), 4 New Stage 5 Mob Archetypes, 2 Water Lakes, Zero Wall Overlap, Bear Food, and Arcane Sword [8]', () => {
  const s5 = getLabyrinthStageLayout(5);
  const lakes5 = getLabyrinthWaterLakes(5);
  assert.equal(lakes5.length, 2, 'Stage 5 must have 2 water lakes');
  for (const lake of lakes5) {
    for (const wb of s5.wallBoxes) {
      const inside =
        lake.x > wb.minX && lake.x < wb.maxX && lake.z > wb.minZ && lake.z < wb.maxZ;
      assert.equal(inside, false, `Stage 5 water lake ${lake.id} overlaps wall`);
    }
  }

  assert.equal(WORM_SPLIT_HP_RATIO, 0.3);
  assert.equal(WORM_BURROW_DURATION_SEC, 2.0);
  assert.equal(WORM_EMERGE_STUN_SEC, 1.0);
  assert.equal(WORM_FIRE_ZONE_DURATION_SEC, 4.0);
  assert.equal(WORM_FIRE_BURN_DURATION_SEC, 2.0);
  assert.equal(WORM_MELEE_FIGHT_DURATION_SEC, 4.0);
  assert.equal(WORM_LEECH_TELEGRAPH_SEC, 1.0);
  assert.equal(WORM_LEECH_JUMP_COOLDOWN_SEC, 25.0);
  assert.equal(WORM_LEECH_LAND_RADIUS, 2.5);
  assert.equal(WORM_LEECH_LATCH_DURATION_SEC, 4.0);
  assert.equal(FROST_WIND_COOLDOWN_SEC, 7.0);
  assert.equal(FROST_WIND_TELEGRAPH_SEC, 1.0);
  assert.equal(FROST_WIND_DURATION_SEC, 3.0);
  assert.equal(FROST_WIND_RADIUS, 4.6);
  assert.ok(FROST_WIND_PULL_SPEED > 0 && FROST_WIND_PULL_SPEED < 7.6);

  assert.deepEqual(getWormBossSplitChildren('boss_worm_5_p1'), [
    'boss_worm_5_p2_fire',
    'boss_worm_5_p2_melee',
  ]);
  assert.deepEqual(getWormBossSplitChildren('boss_worm_5_p2_fire'), [
    'boss_worm_5_p3_fire_bomber',
    'boss_worm_5_p3_fire_pool',
  ]);
  assert.deepEqual(getWormBossSplitChildren('boss_worm_5_p2_melee'), [
    'boss_worm_5_p3_burrower',
    'boss_worm_5_p3_leech',
  ]);
  assert.equal(getWormBossSplitChildren('boss_worm_5_p3_leech'), null);

  assert.equal(
    isStageBossDefeated([{ archetype: 'boss_worm_5_p1', state: 'seek', hp: 900 }], 5),
    false
  );
  assert.equal(
    isStageBossDefeated([{ archetype: 'boss_worm_5_p2_fire', state: 'seek', hp: 500 }], 5),
    false
  );
  assert.equal(
    isStageBossDefeated([{ archetype: 'boss_worm_5_p3_leech', state: 'seek', hp: 100 }], 5),
    false
  );
  assert.equal(
    isStageBossDefeated([{ archetype: 'boss_worm_5_p3_leech', state: 'ko', hp: 0 }], 5),
    true
  );

  assert.equal(MUD_PUDDLE_DURATION_SEC, 5.0);
  assert.equal(MUD_PUDDLE_SLOW_PERCENT, 50);
  assert.equal(MUD_BALL_SCALE_MULTIPLIER, 5.0);
  assert.equal(MUD_BALL_SLOW_PERCENT, 30);
  assert.equal(BEAR_FEAR_DURATION_SEC, 1.5);
  assert.ok(BEAR_ROAR_RADIUS >= 8.0);
  assert.ok(BEAR_CLEAVE_RADIUS >= 5.0);
  assert.ok(SKELETON_ARROW_SPEED > 13.0);
  assert.ok(SKELETON_VOLLEY_ARROW_SPEED < SKELETON_ARROW_SPEED);
  assert.equal(SKELETON_VOLLEY_ARROW_SPEED, 11.5);
  assert.equal(SKELETON_SHIELD_DAMAGE_MULTIPLIER, 0.15);

  const specs5 = getStage5SpawnSpecs();
  assert.ok(specs5.enemies.some((s) => s.arch === 'mud_monster'));
  assert.ok(specs5.enemies.some((s) => s.arch === 'cave_bear'));
  assert.ok(specs5.enemies.some((s) => s.arch === 'skeleton_archer'));
  assert.ok(specs5.enemies.some((s) => s.arch === 'skeleton_hammer_shield'));
  assert.ok(specs5.enemies.some((s) => s.arch === 'fire_demon'));
  assert.ok(specs5.enemies.some((s) => s.arch === 'water_monster'));
  assert.ok(specs5.enemies.some((s) => s.arch === 'stone_crusher'));
  assert.ok(specs5.enemies.some((s) => s.arch === 'wild_boar'));
  assert.ok(specs5.enemies.some((s) => s.arch === 'frost_charger'));
  assert.ok(specs5.enemies.some((s) => isStage5WormBossArchetype(s.arch)));

  // Verify ZERO wall overlap for all Stage 5 enemies, trees, herbs, and props
  for (const sp of specs5.enemies) {
    for (const wb of s5.wallBoxes) {
      const inside =
        sp.x > wb.minX - 1.1 &&
        sp.x < wb.maxX + 1.1 &&
        sp.z > wb.minZ - 1.1 &&
        sp.z < wb.maxZ + 1.1;
      assert.equal(
        inside,
        false,
        `Stage 5 monster ${sp.arch} at (${sp.x}, ${sp.z}) overlaps wall`
      );
    }
  }
  for (const node of [...specs5.trees, ...specs5.herbs, ...specs5.props]) {
    for (const wb of s5.wallBoxes) {
      const inside =
        node.x > wb.minX - 0.5 &&
        node.x < wb.maxX + 0.5 &&
        node.z > wb.minZ - 0.5 &&
        node.z < wb.maxZ + 0.5;
      assert.equal(
        inside,
        false,
        `Stage 5 prop/node at (${node.x}, ${node.z}) overlaps wall`
      );
    }
  }

  const bearMin = calculateCookedBearFoodStats(0);
  const bearMax = calculateCookedBearFoodStats(100);
  const boarMax = calculateCookedBoarFoodStats(100);
  assert.equal(bearMin.bonusMaxHp, 45);
  assert.equal(bearMax.bonusMaxHp, 120);
  assert.ok(bearMax.bonusMaxHp > boarMax.bonusMaxHp);
  assert.ok(bearMax.hpRegenPerSec > boarMax.hpRegenPerSec);

  assert.equal(getSpellHotkeyLabel('arcane_sword'), '8');
  assert.equal(ARCANE_SWORD_COOLDOWN_SEC, 60.0);
  assert.equal(ARCANE_SWORD_SWING_COOLDOWN_SEC, 1.0);
  assert.equal(getSpellCooldownForLevel('arcane_sword', 1), 60.0);

  const swQuick = calculateArcaneSwordStats('quick', 0, 1);
  const swVoice = calculateArcaneSwordStats('voice', 0, 1);
  const swDrawnMin = calculateArcaneSwordStats('drawn', 10, 1);
  const swDrawnMax = calculateArcaneSwordStats('drawn', 100, 1);
  assert.equal(swQuick.durationSec, 3.0);
  assert.equal(swQuick.damage, 10);
  assert.equal(swVoice.durationSec, 10.0);
  assert.equal(swVoice.damage, 25);
  assert.equal(swDrawnMin.durationSec, 7.0);
  assert.equal(swDrawnMin.damage, 20);
  assert.equal(swDrawnMax.durationSec, 20.0);
  assert.equal(swDrawnMax.damage, 40);

  const swLvl4 = calculateArcaneSwordStats('voice', 0, 4);
  const swLvl6 = calculateArcaneSwordStats('voice', 0, 6);
  assert.equal(swLvl4.ignitesOnHit, true);
  assert.equal(swLvl4.dualWield, false);
  assert.equal(swLvl4.swingCooldownSec, ARCANE_SWORD_SWING_COOLDOWN_SEC);
  assert.equal(swLvl6.stunDurationSec, 0);
  assert.equal(swLvl6.stunsOnHitSec, 0);
  assert.equal(swLvl6.dualWield, true);
  assert.equal(swLvl6.swingCooldownSec, ARCANE_SWORD_LV6_SWING_COOLDOWN_SEC);
  assert.equal(ARCANE_SWORD_LV6_SWING_COOLDOWN_SEC, 0.7);

  const incVoice = evaluateArcaneSwordSpellControl(true, 'incendio', 'voice');
  assert.equal(incVoice.allowCast, true);
  assert.equal(incVoice.dismissSword, false);

  const leviosaVoice = evaluateArcaneSwordSpellControl(true, 'wingardium', 'voice');
  assert.equal(leviosaVoice.allowCast, false);

  const incDrawn = evaluateArcaneSwordSpellControl(true, 'incendio', 'drawn');
  assert.equal(incDrawn.allowCast, true);
  assert.equal(incDrawn.dismissSword, true);

  const glacQuick = evaluateArcaneSwordSpellControl(true, 'glacius', 'quick');
  assert.equal(glacQuick.allowCast, true);
  assert.equal(glacQuick.dismissSword, true);
});

test('Diablo Difficulty (Difficulty II: Nightmare) makes Stage 1 mobs stronger in HP & damage than Stage 5 Normal mobs, scales across Stages 1..5, and Character Profiles unlock stages 1..5 & Nightmare on Worm Boss kill', () => {
  // 1. Normal difficulty multipliers are 1.0
  const d1s1 = getDiabloDifficultyMultipliers(1, 1);
  const d1s5 = getDiabloDifficultyMultipliers(1, 5);
  assert.equal(d1s1.hpMultiplier, 1.0);
  assert.equal(d1s1.damageMultiplier, 1.0);
  assert.equal(d1s1.moveSpeedMultiplier, 1.0);
  assert.equal(d1s1.projectileSpeedMultiplier, 1.0);
  assert.equal(d1s5.hpMultiplier, 1.0);

  // 2. Nightmare (Difficulty 2) multipliers increase move speed, projectile speed, attack cadence, HP, and damage progressively across Stages 1..5
  const d2s1 = getDiabloDifficultyMultipliers(2, 1);
  const d2s2 = getDiabloDifficultyMultipliers(2, 2);
  const d2s3 = getDiabloDifficultyMultipliers(2, 3);
  const d2s4 = getDiabloDifficultyMultipliers(2, 4);
  const d2s5 = getDiabloDifficultyMultipliers(2, 5);

  assert.ok(d2s1.hpMultiplier > 1.0);
  assert.ok(d2s1.damageMultiplier > 1.0);
  assert.ok(d2s1.moveSpeedMultiplier > 1.2);
  assert.ok(d2s1.projectileSpeedMultiplier > 1.3);
  assert.ok(d2s1.attackCadenceMultiplier > 1.3);

  assert.ok(d2s2.hpMultiplier > d2s1.hpMultiplier);
  assert.ok(d2s3.hpMultiplier > d2s2.hpMultiplier);
  assert.ok(d2s4.hpMultiplier > d2s3.hpMultiplier);
  assert.ok(d2s5.hpMultiplier > d2s4.hpMultiplier);

  assert.ok(d2s2.damageMultiplier > d2s1.damageMultiplier);
  assert.ok(d2s3.damageMultiplier > d2s2.damageMultiplier);
  assert.ok(d2s4.damageMultiplier > d2s3.damageMultiplier);
  assert.ok(d2s5.damageMultiplier > d2s4.damageMultiplier);

  // 3. Even on Stage 1 of Difficulty 2 (Nightmare), every mob has strictly more HP than on Stage 5 of Normal Difficulty (Difficulty 1)!
  const testArchetypes = [
    'rat_swarmer',
    'wild_boar',
    'dark_kiter',
    'frost_charger',
    'sky_dive_gargoyle',
    'storm_harpy_shooter',
    'fire_demon',
    'water_monster',
    'stone_crusher',
    'mud_monster',
    'cave_bear',
    'skeleton_archer',
    'skeleton_hammer_shield',
    'boss_worm_5_p1',
  ];

  for (const arch of testArchetypes) {
    const normalStage5Hp = evaluateEnemyBaseMaxHp(arch, 8, 5, 1, true);
    const nightmareStage1Hp = evaluateEnemyBaseMaxHp(arch, 1, 1, 2, true);
    const nightmareStage2Hp = evaluateEnemyBaseMaxHp(arch, 2, 2, 2, true);
    const nightmareStage5Hp = evaluateEnemyBaseMaxHp(arch, 8, 5, 2, true);

    assert.ok(
      nightmareStage1Hp > normalStage5Hp,
      `Expected ${arch} on Nightmare Stage 1 (${nightmareStage1Hp}) > Normal Stage 5 (${normalStage5Hp})`
    );
    assert.ok(
      nightmareStage2Hp > nightmareStage1Hp,
      `Expected ${arch} on Nightmare Stage 2 (${nightmareStage2Hp}) > Nightmare Stage 1 (${nightmareStage1Hp})`
    );
    assert.ok(
      nightmareStage5Hp > nightmareStage2Hp,
      `Expected ${arch} on Nightmare Stage 5 (${nightmareStage5Hp}) > Nightmare Stage 2 (${nightmareStage2Hp})`
    );

    // Verify 10-step XP gradation across Maps 1..5 (Difficulty 1) and Maps 6..10 (Difficulty 2)
    const xpAcross10Maps = [
      evaluateEnemyKillXp(arch, 1, 1),
      evaluateEnemyKillXp(arch, 2, 1),
      evaluateEnemyKillXp(arch, 3, 1),
      evaluateEnemyKillXp(arch, 4, 1),
      evaluateEnemyKillXp(arch, 5, 1),
      evaluateEnemyKillXp(arch, 1, 2),
      evaluateEnemyKillXp(arch, 2, 2),
      evaluateEnemyKillXp(arch, 3, 2),
      evaluateEnemyKillXp(arch, 4, 2),
      evaluateEnemyKillXp(arch, 5, 2),
    ];
    for (let m = 1; m < xpAcross10Maps.length; m++) {
      assert.ok(
        xpAcross10Maps[m] > xpAcross10Maps[m - 1],
        `Expected ${arch} XP on Map ${m + 1} (${xpAcross10Maps[m]}) > Map ${m} (${xpAcross10Maps[m - 1]})`
      );
    }
  }
  assert.equal(MAP_PROGRESSION_XP_MULTIPLIERS.length, 10);

  // 4. Character Profile Creation, Stage Unlocking (1 -> 2 -> 3 -> 4 -> 5), and Worm Boss Difficulty II Unlocking
  const char0 = createDefaultCharacterProfile('user_abc', 'Архимаг Вокс', 'char_test_1');
  assert.equal(char0.id, 'char_test_1');
  assert.equal(char0.ownerId, 'user_abc');
  assert.equal(char0.name, 'Архимаг Вокс');
  assert.equal(char0.unlockedStageD1, 1);
  assert.equal(char0.unlockedStageD2, 1);
  assert.equal(char0.highestUnlockedDifficulty, 1);
  assert.equal(getUnlockedStageForDifficulty(char0, 1), 1);

  const charSt2 = unlockStageForCharacter(char0, 2, 1);
  assert.equal(charSt2.unlockedStageD1, 2);
  assert.equal(charSt2.highestUnlockedStage, 2);

  const charSt5 = unlockStageForCharacter(charSt2, 5, 1);
  assert.equal(charSt5.unlockedStageD1, 5);
  assert.equal(getUnlockedStageForDifficulty(charSt5, 1), 5);

  const wormKill = unlockDifficultyOnWormBossKill(charSt5);
  assert.equal(wormKill.newlyUnlockedDifficulty, true);
  assert.equal(wormKill.updatedProfile.highestUnlockedDifficulty, 2);
  assert.equal(wormKill.updatedProfile.unlockedStageD1, 5);

  const wormKillRepeat = unlockDifficultyOnWormBossKill(wormKill.updatedProfile);
  assert.equal(wormKillRepeat.newlyUnlockedDifficulty, false);
});

test('Wooden Wall building (cost 2 wood, 2s build time, max 12 walls, 1 wood dismantle refund) and Campfire 3-Wall Shelter 2x HP/MP regeneration', () => {
  assert.equal(WALL_WOOD_COST, 2);
  assert.equal(WALL_BUILD_DURATION_SEC, 2.0);
  assert.equal(MAX_BUILT_WALLS, 12);
  assert.equal(WALL_DISMANTLE_WOOD_REFUND, 1);
  assert.equal(CAMPFIRE_SHELTER_MIN_WALLS, 3);
  assert.equal(CAMPFIRE_SHELTER_REGEN_MULTIPLIER, 2.0);

  // Insufficient wood (< 2) cannot build
  assert.equal(canBuildWoodenWall(1, 0).allowed, false);
  assert.equal(canBuildWoodenWall(2, 0).allowed, true);
  assert.equal(canBuildWoodenWall(5, 11).allowed, true);

  // Max 12 walls on the map
  assert.equal(canBuildWoodenWall(10, 12).allowed, false);

  // Campfire surrounded by < 3 walls vs >= 3 walls
  const campfirePos = { x: 10, z: -20 };
  const twoWalls = [
    { x: 10, z: -23, isBuilt: true },
    { x: 13, z: -20, isBuilt: true },
  ];
  assert.equal(countWallsSurroundingCampfire(campfirePos, twoWalls), 2);
  assert.equal(isCampfireShelteredByWalls(campfirePos, twoWalls), false);

  // A 3rd wall still under construction (`isBuilt: false`) does not count until its 2s build finishes
  const twoBuiltOneBuilding = [
    ...twoWalls,
    { x: 7, z: -20, isBuilt: false },
  ];
  assert.equal(countWallsSurroundingCampfire(campfirePos, twoBuiltOneBuilding), 2);
  assert.equal(isCampfireShelteredByWalls(campfirePos, twoBuiltOneBuilding), false);

  // Once the 3rd wall finishes building (`isBuilt: true`), the campfire is sheltered!
  const threeBuiltWalls = [
    ...twoWalls,
    { x: 7, z: -20, isBuilt: true },
  ];
  assert.equal(countWallsSurroundingCampfire(campfirePos, threeBuiltWalls), 3);
  assert.equal(isCampfireShelteredByWalls(campfirePos, threeBuiltWalls), true);

  // Regeneration doubles (2x) when campfire is surrounded by >= 3 walls
  const baseRegen = getCampfireEffectiveRegen(false);
  const shelteredRegen = getCampfireEffectiveRegen(true);
  assert.equal(baseRegen.hpRegenPerSec, 0.5);
  assert.equal(baseRegen.mpRegenMultiplier, 1.5);
  assert.equal(shelteredRegen.hpRegenPerSec, 1.0);
  assert.equal(shelteredRegen.mpRegenMultiplier, 3.0);

  // Aim-based wall dismantling (`findAimedWoodenWall`): dismantles only the wall aimed at by crosshair
  const wallsForAim = [
    { id: 'wall_front', x: 0, z: -4, rotY: 0 },
    { id: 'wall_behind', x: 0, z: 2.5, rotY: 0 },
  ];
  // Looking North (0, -1) -> hits `wall_front`, ignores `wall_behind` even though `wall_behind` is closer!
  const aimedNorth = findAimedWoodenWall({ x: 0, z: 0 }, { x: 0, z: -1 }, wallsForAim);
  assert.ok(aimedNorth);
  assert.equal(aimedNorth.wall.id, 'wall_front');

  // Looking East (1, 0) where there is no wall -> returns null (never dismantles a random wall!)
  const aimedEast = findAimedWoodenWall({ x: 0, z: 0 }, { x: 1, z: 0 }, wallsForAim);
  assert.equal(aimedEast, null);

  // Strict Gesture Training (`canvasSize = 240`, bonus = 0, forgiveness = 0):
  // Exact trace scores >= 90%, sloppy/wrong stroke does NOT get 100%, and XP scales with accuracy!
  const exactTrainHeart = SPELLS.vera_verto.templatePoints.map((p) => ({
    x: p.x * 240,
    y: p.y * 240,
  }));
  const sloppyHorizontalLine = Array.from({ length: 16 }, (_, i) => ({
    x: 20 + i * 12,
    y: 200,
  }));
  const exactRes = evaluateGestureAccuracy(exactTrainHeart, 'vera_verto', 0, 0, 240);
  const sloppyRes = evaluateGestureAccuracy(sloppyHorizontalLine, 'vera_verto', 0, 0, 240);
  assert.ok(exactRes.accuracy >= 90, `Expected exact trace >= 90%, got ${exactRes.accuracy}%`);
  assert.ok(sloppyRes.accuracy < 60, `Expected wrong stroke < 60%, got ${sloppyRes.accuracy}%`);
  assert.equal(calculatePracticeGestureXp(30), 0);
  assert.ok(calculatePracticeGestureXp(50) >= 2);
  assert.ok(calculatePracticeGestureXp(80) > calculatePracticeGestureXp(55));
  assert.equal(calculatePracticeGestureXp(100), 15);

  // Verify new Quests: wall build/dismantle, Stage 5 mobs, Bosses 1..5, and Flawless Stage Clear (250 XP)
  const flawlessQuest = INITIAL_QUESTS.find((q) => q.id === 'quest_flawless_stage_clear');
  assert.ok(flawlessQuest);
  assert.equal(flawlessQuest.rewardXp, 250);
  assert.equal(flawlessQuest.eventType, 'flawless_stage_clear');

  for (const stageNum of [1, 2, 3, 4, 5] as const) {
    const bossQ = INITIAL_QUESTS.find((q) => q.id === `quest_boss_stage_${stageNum}`);
    assert.ok(bossQ, `Expected boss quest for stage ${stageNum}`);
    assert.equal(bossQ.eventType, `defeat_boss_${stageNum}`);
  }

  const buildWallQ = INITIAL_QUESTS.find((q) => q.id === 'quest_build_wall_3');
  const dismantleWallQ = INITIAL_QUESTS.find((q) => q.id === 'quest_dismantle_wall_3');
  const stage5MobQ = INITIAL_QUESTS.find((q) => q.id === 'quest_stage5_mobs_12');
  assert.ok(buildWallQ && dismantleWallQ && stage5MobQ);

  const progressed = advanceQuestProgress(INITIAL_QUESTS, [
    { type: 'flawless_stage_clear', amount: 1 },
  ]);
  assert.equal(
    progressed.newlyCompleted.some((q) => q.id === 'quest_flawless_stage_clear'),
    true
  );

  // Verify Spike Trap Row Hitbox accuracy (strictly smaller than visual spike model to prevent accidental hits)
  assert.ok(SPIKE_HITBOX_RADIUS < SPIKE_VISUAL_BASE_RADIUS);
  const testZone = getLabyrinthSpikeTrapZones(2)[0];
  assert.ok(testZone);
  const line0Z = testZone.lines[0].centerZ;
  const line1Z = testZone.lines[1].centerZ;
  const line2Z = testZone.lines[2].centerZ;
  const cols = Math.max(6, Math.floor(testZone.width / 1.65));
  const firstSpikeX = testZone.x - testZone.width * 0.45 + (0 / Math.max(1, cols - 1)) * (testZone.width * 0.9);
  const firstSpikeZ = line0Z - 0.5 * (testZone.lineDepth * 0.46);
  // Standing directly on the center of a spike in row 0 triggers row 0, NOT row 2
  assert.equal(isPlayerTouchingSpikeLine(testZone, 0, firstSpikeX, 0, firstSpikeZ), true);
  assert.equal(isPlayerTouchingSpikeLine(testZone, 2, firstSpikeX, 0, firstSpikeZ), false);
  // Standing near the sloped outer visual base edge of the spike (0.19m < 0.21m visual radius, but > 0.16m hitbox) does NOT cause accidental damage!
  assert.equal(
    isPlayerTouchingSpikeLine(testZone, 0, firstSpikeX + 0.19, 0, firstSpikeZ),
    false
  );
  // Standing visually between the two sub-rows of row 0 (at line0Z) does NOT trigger damage
  assert.equal(isPlayerTouchingSpikeLine(testZone, 0, firstSpikeX, 0, line0Z), false);
  // Standing visually between row 0 and row 1 does NOT trigger row 0 or row 1
  const midRow01Z = (line0Z + line1Z) * 0.5;
  assert.equal(isPlayerTouchingSpikeLine(testZone, 0, firstSpikeX, 0, midRow01Z), false);
  assert.equal(isPlayerTouchingSpikeLine(testZone, 1, firstSpikeX, 0, midRow01Z), false);
  // Standing on row 2 while row 0 is active does NOT trigger row 0
  assert.equal(isPlayerTouchingSpikeLine(testZone, 0, firstSpikeX, 0, line2Z), false);
  // Jumping over the spike (playerY > 0.72) does NOT trigger damage
  assert.equal(isPlayerTouchingSpikeLine(testZone, 0, firstSpikeX, 0.8, firstSpikeZ), false);
  // Standing in the gap between two spike columns does NOT trigger damage
  const colSpacing = (testZone.width * 0.9) / Math.max(1, cols - 1);
  if (colSpacing > 0.95) {
    assert.equal(
      isPlayerTouchingSpikeLine(testZone, 0, firstSpikeX + colSpacing * 0.5, 0, firstSpikeZ),
      false
    );
  }
  // Verify Stage 1 Boss HP increased by +100 to 360
  assert.equal(evaluateEnemyBaseMaxHp('boss_mage_1', 1, 1, 1), 360);

  // Verify simplified guardless single-line Arcane Sword ('arcane_sword') gesture:
  // Upper blade + handle without crossguard can be drawn in 1 continuous line (closed, open-bottom, or top-tip start) with >85% accuracy!
  const closedSwordStroke = SPELLS.arcane_sword.templatePoints.map((p) => ({
    x: p.x * 240,
    y: p.y * 240,
  }));
  const openOneLineSwordStroke = [
    { x: 0.43 * 240, y: 0.88 * 240 },
    { x: 0.43 * 240, y: 0.60 * 240 },
    { x: 0.41 * 240, y: 0.28 * 240 },
    { x: 0.50 * 240, y: 0.08 * 240 },
    { x: 0.59 * 240, y: 0.28 * 240 },
    { x: 0.57 * 240, y: 0.60 * 240 },
    { x: 0.57 * 240, y: 0.88 * 240 },
  ];
  const closedSwordAcc = evaluateGestureAccuracy(closedSwordStroke, 'arcane_sword', 0, 0, 240);
  const openSwordAcc = evaluateGestureAccuracy(openOneLineSwordStroke, 'arcane_sword', 0, 0, 240);
  const liveCombatSwordAcc = evaluateGestureAccuracy(openOneLineSwordStroke, 'arcane_sword', 0, 0, 0);
  assert.ok(
    closedSwordAcc.accuracy >= 90,
    `Expected closed guardless sword >= 90%, got ${closedSwordAcc.accuracy}%`
  );
  assert.ok(
    openSwordAcc.accuracy >= 85,
    `Expected single-line open-bottom sword >= 85%, got ${openSwordAcc.accuracy}%`
  );
  assert.ok(
    liveCombatSwordAcc.accuracy >= 90,
    `Expected live combat single-line sword >= 90%, got ${liveCombatSwordAcc.accuracy}%`
  );

  // Verify Level 6 Arcane Sword removes stun, adds left-hand dual-wield sword, and hits every 0.7s
  const lv5Sword = calculateArcaneSwordStats('drawn', 95, 5);
  const lv6Sword = calculateArcaneSwordStats('drawn', 95, 6);
  assert.equal(lv5Sword.dualWield, false);
  assert.equal(lv5Sword.swingCooldownSec, ARCANE_SWORD_SWING_COOLDOWN_SEC);
  assert.equal(lv6Sword.dualWield, true);
  assert.equal(lv6Sword.stunsOnHitSec, 0);
  assert.equal(lv6Sword.swingCooldownSec, ARCANE_SWORD_LV6_SWING_COOLDOWN_SEC);
  assert.equal(ARCANE_SWORD_LV6_SWING_COOLDOWN_SEC, 0.7);

  // Verify 10-Map Mob XP Gradation (Maps 1..5 on Diff 1 and Maps 6..10 on Diff 2 Diablo)
  assert.equal(MAP_PROGRESSION_XP_MULTIPLIERS.length, 10);
  let prevRatXp = 0;
  for (const diff of [1, 2] as const) {
    for (const stage of [1, 2, 3, 4, 5] as const) {
      const xp = evaluateEnemyKillXp('rat', stage, diff);
      assert.ok(xp > prevRatXp, `Expected Map (diff=${diff}, stage=${stage}) XP ${xp} > ${prevRatXp}`);
      prevRatXp = xp;
    }
  }

  // Verify Cooldown Reset ('cooldown_reset' [G]) cooldowns (70, 65, 60, 55, 50) & level gradation (Lv1: 30% voice, 20-50% drawn -> Lv6: 100% drawn)
  assert.equal(getSpellCooldownForLevel('cooldown_reset', 1), 70);
  assert.equal(getSpellCooldownForLevel('cooldown_reset', 2), 65);
  assert.equal(getSpellCooldownForLevel('cooldown_reset', 3), 60);
  assert.equal(getSpellCooldownForLevel('cooldown_reset', 4), 55);
  assert.equal(getSpellCooldownForLevel('cooldown_reset', 5), 50);
  assert.equal(getSpellCooldownForLevel('cooldown_reset', 6), 50);

  const cdLv1Voice = calculateCooldownResetStats('voice', 0, 1);
  const cdLv1DrawnMin = calculateCooldownResetStats('drawn', 10, 1);
  const cdLv1DrawnMax = calculateCooldownResetStats('drawn', 100, 1);
  const cdLv6DrawnMax = calculateCooldownResetStats('drawn', 100, 6);
  assert.equal(cdLv1Voice.reductionPercent, 30);
  assert.equal(cdLv1DrawnMin.reductionPercent, 20);
  assert.equal(cdLv1DrawnMax.reductionPercent, 50);
  assert.equal(cdLv6DrawnMax.reductionPercent, 100);

  const hourglassStroke = SPELLS.cooldown_reset.templatePoints.map((p) => ({
    x: p.x * 240,
    y: p.y * 240,
  }));
  const hgAcc = evaluateGestureAccuracy(hourglassStroke, 'cooldown_reset', 0, 0, 240);
  assert.ok(hgAcc.accuracy >= 90, `Expected hourglass gesture accuracy >= 90%, got ${hgAcc.accuracy}%`);

  const sampleCds: Record<SpellId, number> = {
    incendio: 4,
    glacius: 0,
    expelliarmus: 0,
    stupefy: 0,
    wingardium: 0,
    engorgio: 30,
    vera_verto: 30,
    arcane_sword: 60,
    teleport: 10,
    campfire_teleport: 120,
    cooldown_reset: 70,
  };
  const reduced50 = applyCooldownResetToSpellCooldowns(sampleCds, {}, 50);
  assert.equal(reduced50.arcane_sword, 30);
  assert.equal(reduced50.campfire_teleport, 60);
  assert.equal(reduced50.cooldown_reset, 70); // Self cooldown unchanged

  const reduced100 = applyCooldownResetToSpellCooldowns(sampleCds, {}, 100);
  assert.equal(reduced100.arcane_sword, 0);
  assert.equal(reduced100.campfire_teleport, 0);
  assert.equal(reduced100.vera_verto, 0);
  assert.equal(reduced100.cooldown_reset, 70);

  // Verify [X] test hotkey helper upgrades all spells by +1 level, reaching max Level 6 in 5 presses
  let testLevels = createDefaultCharacterProfile('u1').spellLevels;
  for (let i = 0; i < 5; i++) {
    testLevels = upgradeAllSpellsByOneLevel(testLevels);
  }
  for (const spId of SPELL_ORDER) {
    assert.equal(testLevels[spId], MAX_SPELL_LEVEL);
  }
});

test('Arcane Sword 5-second expiring warning sound (30% quieter) and preserving HP/MP after monster kills', () => {
  assert.equal(ARCANE_SWORD_EXPIRING_WARNING_SEC, 5.0);
  assert.equal(ARCANE_SWORD_EXPIRING_VOLUME_SCALE, 0.7);
  assert.equal(
    ARCANE_SWORD_EXPIRING_SOUND_URL,
    '/assets/aistudio/freesound_community-recharge-sound-99815_cbfa7c9e.mp3'
  );

  assert.equal(shouldTriggerArcaneSwordExpiringSound(5.2, false), false);
  assert.equal(shouldTriggerArcaneSwordExpiringSound(5.0, false), true);
  assert.equal(shouldTriggerArcaneSwordExpiringSound(4.8, false), true);
  assert.equal(shouldTriggerArcaneSwordExpiringSound(4.8, true), false);
  assert.equal(shouldTriggerArcaneSwordExpiringSound(0, false), false);

  // Killing a monster without leveling up preserves wounded HP (42/100) and spent MP (35/100)
  const afterKill = computePlayerVitalsAfterXpGain({
    currentLevel: 1,
    currentXp: 100,
    gainedXp: 50,
    currentHp: 42,
    maxHp: 100,
    currentMp: 35,
    maxMp: 100,
  });
  assert.equal(afterKill.nextLevel, 1);
  assert.equal(afterKill.nextXp, 150);
  assert.equal(afterKill.levelsGained, 0);
  assert.equal(afterKill.nextHp, 42);
  assert.equal(afterKill.nextMaxHp, 100);
  assert.equal(afterKill.nextMp, 35);
  assert.equal(afterKill.nextMaxMp, 100);

  // Even when a monster kill levels the player up, missing HP and MP are NEVER restored to full!
  const afterLevelUpKill = computePlayerVitalsAfterXpGain({
    currentLevel: 1,
    currentXp: 460,
    gainedXp: 60,
    currentHp: 42,
    maxHp: 100,
    currentMp: 35,
    maxMp: 100,
  });
  assert.equal(afterLevelUpKill.nextLevel, 2);
  assert.equal(afterLevelUpKill.nextXp, 520);
  assert.equal(afterLevelUpKill.levelsGained, 1);
  assert.equal(afterLevelUpKill.nextMaxHp, 115);
  assert.equal(afterLevelUpKill.nextMaxMp, 110);
  assert.equal(afterLevelUpKill.nextHp, 42);
  assert.equal(afterLevelUpKill.nextMp, 35);
});
