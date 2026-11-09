import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DuelPlayer {
  id: string;
  name: string;
  room: string;
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
  ws: WebSocket;
}

interface SharedEnemyRecord {
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

export interface SharedWorldEvent {
  eventId: string;
  senderId: string;
  stage: number;
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
    | 'chest_open'
    | 'rune_button';
  targetId: string;
  gateId?: string;
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
  isLit?: boolean;
  timestamp: number;
}

interface RoomSession {
  players: Map<string, DuelPlayer>;
  labyrinthMode: 'shared' | 'parallel';
  labyrinthStage: 1 | 2 | 3 | 4 | 5;
  enemies: Map<string, SharedEnemyRecord>;
  worldEvents: SharedWorldEvent[];
  deadPlayers: Set<string>;
}

interface CastEventPayload {
  castId: string;
  casterId: string;
  casterName: string;
  spellId: string;
  spellName: string;
  power: number;
  accuracy: number;
  origin: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  color: string;
}

const rooms = new Map<string, RoomSession>();
const processedCastIds = new Set<string>();

function rememberEventId(id: string): boolean {
  if (!id) return false;
  if (processedCastIds.has(id)) return true;
  processedCastIds.add(id);
  if (processedCastIds.size > 3000) {
    const first = processedCastIds.values().next().value;
    if (first) processedCastIds.delete(first);
  }
  return false;
}

function getRoomSession(roomName: string): RoomSession {
  let session = rooms.get(roomName);
  if (!session) {
    session = {
      players: new Map<string, DuelPlayer>(),
      labyrinthMode: 'shared',
      labyrinthStage: 1,
      enemies: new Map<string, SharedEnemyRecord>(),
      worldEvents: [],
      deadPlayers: new Set<string>(),
    };
    rooms.set(roomName, session);
  }
  return session;
}

function serializeRoomState(roomName: string) {
  const session = getRoomSession(roomName);
  return Array.from(session.players.values()).map((p) => ({
    id: p.id,
    name: p.name,
    room: p.room,
    x: p.x,
    y: p.y,
    z: p.z,
    rotY: p.rotY,
    hp: p.hp,
    maxHp: p.maxHp,
    level: p.level,
    staffId: p.staffId,
    shieldActive: p.shieldActive,
    wins: p.wins,
  }));
}

function serializeRoomEnemies(roomName: string) {
  const session = getRoomSession(roomName);
  return Array.from(session.enemies.values()).filter(
    (e) => e.stage === session.labyrinthStage
  );
}

function broadcastToRoom(roomName: string, message: unknown, excludeId?: string) {
  const session = rooms.get(roomName);
  if (!session) return;
  const payload = JSON.stringify(message);
  for (const [id, player] of session.players.entries()) {
    if (excludeId && id === excludeId) continue;
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(payload);
    }
  }
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const PORT = 3000;

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      activeRooms: Array.from(rooms.entries()).map(([name, session]) => ({
        name,
        players: session.players.size,
        labyrinthMode: session.labyrinthMode,
        labyrinthStage: session.labyrinthStage,
      })),
    });
  });

  // Authoritative WebSocket Server for Multiplayer Co-op & PvP Labyrinth / Arena
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    let currentPlayerId = '';
    let currentRoom = '';

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        const { type, data } = msg;

        if (type === 'room:join') {
          const playerId = String(data.id || `wiz_${Math.random().toString(36).slice(2, 8)}`);
          const roomName = String(data.room || 'arena-1').trim().slice(0, 24) || 'arena-1';
          const name = String(data.name || 'Арканист').trim().slice(0, 20) || 'Арканист';

          if (currentRoom && currentPlayerId) {
            const prevSession = rooms.get(currentRoom);
            prevSession?.players.delete(currentPlayerId);
            broadcastToRoom(currentRoom, {
              type: 'user:left',
              data: { id: currentPlayerId, players: serializeRoomState(currentRoom) },
            });
          }

          currentPlayerId = playerId;
          currentRoom = roomName;
          const session = getRoomSession(roomName);

          // If this is the first player in the room and they specified a labyrinthMode, set it
          if (
            session.players.size === 0 &&
            (data.labyrinthMode === 'shared' || data.labyrinthMode === 'parallel')
          ) {
            session.labyrinthMode = data.labyrinthMode;
          }

          const existing = session.players.get(playerId);
          const spawnIndex = session.players.size % 2;
          const playerObj: DuelPlayer = {
            id: playerId,
            name,
            room: roomName,
            x: existing ? existing.x : spawnIndex === 0 ? -40 : -36,
            y: 0,
            z: existing ? existing.z : 92,
            rotY: 0,
            hp: Number(data.maxHp) || 100,
            maxHp: Number(data.maxHp) || 100,
            level: Number(data.level) || 1,
            staffId: String(data.staffId || 'wand_ollivander'),
            shieldActive: false,
            wins: existing ? existing.wins : 0,
            ws,
          };

          session.players.set(playerId, playerObj);

          // Send initial authoritative state to joining client
          ws.send(
            JSON.stringify({
              type: 'room:init',
              data: {
                selfId: playerId,
                room: roomName,
                labyrinthMode: session.labyrinthMode,
                labyrinthStage: session.labyrinthStage,
                enemies: serializeRoomEnemies(roomName),
                worldEvents: session.worldEvents.filter(
                  (ev) => ev.stage === session.labyrinthStage
                ),
                players: serializeRoomState(roomName),
              },
            })
          );

          // Notify other players in the room
          broadcastToRoom(
            roomName,
            {
              type: 'user:joined',
              data: {
                player: {
                  id: playerObj.id,
                  name: playerObj.name,
                  room: playerObj.room,
                  x: playerObj.x,
                  y: playerObj.y,
                  z: playerObj.z,
                  rotY: playerObj.rotY,
                  hp: playerObj.hp,
                  maxHp: playerObj.maxHp,
                  level: playerObj.level,
                  staffId: playerObj.staffId,
                  shieldActive: playerObj.shieldActive,
                  wins: playerObj.wins,
                },
                labyrinthMode: session.labyrinthMode,
                labyrinthStage: session.labyrinthStage,
                players: serializeRoomState(roomName),
              },
            },
            playerId
          );
        } else if (type === 'room:set_mode' && currentRoom) {
          const session = rooms.get(currentRoom);
          if (!session) return;
          const nextMode = data.labyrinthMode === 'parallel' ? 'parallel' : 'shared';
          session.labyrinthMode = nextMode;
          if (data.resetStage) {
            session.labyrinthStage = 1;
            session.enemies.clear();
            session.worldEvents = [];
          }
          broadcastToRoom(currentRoom, {
            type: 'room:mode_changed',
            data: {
              labyrinthMode: session.labyrinthMode,
              labyrinthStage: session.labyrinthStage,
              enemies: serializeRoomEnemies(currentRoom),
              players: serializeRoomState(currentRoom),
            },
          });
        } else if (type === 'room:start_game' && currentRoom && currentPlayerId) {
          const session = rooms.get(currentRoom);
          if (!session) return;
          session.labyrinthMode = 'shared';
          const reqStage = Number(data.stage);
          const startStage = (
            reqStage === 2 ? 2 : reqStage === 3 ? 3 : reqStage === 4 ? 4 : reqStage === 5 ? 5 : 1
          ) as 1 | 2 | 3 | 4 | 5;
          session.labyrinthStage = startStage;
          session.enemies.clear();
          session.worldEvents = [];
          session.deadPlayers.clear();
          broadcastToRoom(currentRoom, {
            type: 'room:game_started',
            data: {
              room: currentRoom,
              labyrinthMode: session.labyrinthMode,
              labyrinthStage: session.labyrinthStage,
              hostId: currentPlayerId,
              players: serializeRoomState(currentRoom),
            },
          });
        } else if (type === 'player:died' && currentRoom && currentPlayerId) {
          const session = rooms.get(currentRoom);
          if (!session || session.labyrinthMode !== 'shared') return;
          session.deadPlayers.add(currentPlayerId);
          const p = session.players.get(currentPlayerId);
          if (p) p.hp = 0;

          const totalPlayers = session.players.size;
          const allDead =
            totalPlayers > 0 &&
            Array.from(session.players.keys()).every((pid) => session.deadPlayers.has(pid));

          if (allDead) {
            session.enemies.clear();
            session.deadPlayers.clear();
            for (const pl of session.players.values()) {
              pl.hp = pl.maxHp;
            }
            broadcastToRoom(currentRoom, {
              type: 'room:all_dead_reset',
              data: {
                stage: session.labyrinthStage,
              },
            });
          } else {
            broadcastToRoom(currentRoom, {
              type: 'player:downed',
              data: {
                playerId: currentPlayerId,
                deadCount: session.deadPlayers.size,
                totalPlayers,
              },
            });
          }
        } else if (type === 'player:respawn' && currentRoom && currentPlayerId) {
          const session = rooms.get(currentRoom);
          if (!session) return;
          session.deadPlayers.delete(currentPlayerId);
          const p = session.players.get(currentPlayerId);
          if (p) p.hp = p.maxHp;
        } else if (type === 'player:move' && currentRoom && currentPlayerId) {
          const session = rooms.get(currentRoom);
          const p = session?.players.get(currentPlayerId);
          if (p) {
            if (typeof data.name === 'string' && data.name.trim()) {
              p.name = data.name.trim().slice(0, 24);
            }
            p.x = Number(data.x) || 0;
            p.y = Number(data.y) || 0;
            p.z = Number(data.z) || 0;
            p.rotY = Number(data.rotY) || 0;
            p.shieldActive = Boolean(data.shieldActive);
            p.staffId = String(data.staffId || p.staffId);
            p.level = Number(data.level) || p.level;
            if (typeof data.hp === 'number') {
              p.hp = Math.max(0, Math.min(p.maxHp, Math.round(data.hp)));
              if (p.hp > 0) {
                session?.deadPlayers.delete(currentPlayerId);
              }
            }
            if (typeof data.maxHp === 'number' && data.maxHp > 0) {
              p.maxHp = Math.round(data.maxHp);
            }
            broadcastToRoom(
              currentRoom,
              {
                type: 'player:moved',
                data: {
                  id: p.id,
                  name: p.name,
                  x: p.x,
                  y: p.y,
                  z: p.z,
                  rotY: p.rotY,
                  hp: p.hp,
                  maxHp: p.maxHp,
                  shieldActive: p.shieldActive,
                  staffId: p.staffId,
                  level: p.level,
                },
              },
              currentPlayerId
            );
          }
        } else if (type === 'spell:cast' && currentRoom && currentPlayerId) {
          const castId = String(data.castId || '');
          if (rememberEventId(castId)) return;

          const payload: CastEventPayload = {
            castId,
            casterId: currentPlayerId,
            casterName: String(data.casterName || 'Арканист'),
            spellId: String(data.spellId || 'incendio'),
            spellName: String(data.spellName || 'Инсендио'),
            power: Math.min(250, Math.max(5, Number(data.power) || 25)),
            accuracy: Math.min(100, Math.max(10, Number(data.accuracy) || 80)),
            origin: {
              x: Number(data.origin?.x) || 0,
              y: Number(data.origin?.y) || 1.5,
              z: Number(data.origin?.z) || 0,
            },
            direction: {
              x: Number(data.direction?.x) || 0,
              y: Number(data.direction?.y) || 0,
              z: Number(data.direction?.z) || -1,
            },
            color: String(data.color || '#f97316'),
          };

          broadcastToRoom(currentRoom, {
            type: 'spell:spawned',
            data: payload,
          });
        } else if (type === 'enemy:hit' && currentRoom && currentPlayerId) {
          const session = rooms.get(currentRoom);
          if (!session || session.labyrinthMode !== 'shared') return;

          const hitId = String(data.hitId || '');
          if (rememberEventId(hitId)) return;

          const enemyId = String(data.enemyId || '');
          if (!enemyId) return;
          const stage = Number(data.stage) || session.labyrinthStage;
          const maxHp = Math.max(1, Number(data.maxHp) || 100);
          const damage = Math.min(500, Math.max(1, Math.round(Number(data.damage) || 10)));

          let enemy = session.enemies.get(enemyId);
          if (!enemy) {
            enemy = {
              id: enemyId,
              stage,
              hp: maxHp,
              maxHp,
              x: Number(data.x) || 0,
              y: Number(data.y) || 0,
              z: Number(data.z) || 0,
              state: 'seek',
              killed: false,
            };
            session.enemies.set(enemyId, enemy);
          }

          if (enemy.killed || enemy.hp <= 0) return;

          enemy.hp = Math.max(0, enemy.hp - damage);
          enemy.killed = enemy.hp <= 0;
          if (typeof data.x === 'number') enemy.x = data.x;
          if (typeof data.z === 'number') enemy.z = data.z;

          broadcastToRoom(currentRoom, {
            type: 'enemy:damaged',
            data: {
              hitId,
              enemyId: enemy.id,
              stage: enemy.stage,
              hp: enemy.hp,
              maxHp: enemy.maxHp,
              damage,
              attackerId: currentPlayerId,
              spellId: String(data.spellId || 'incendio'),
              stunSec: Number(data.stunSec) || 0,
              freezeSec: Number(data.freezeSec) || 0,
              killed: enemy.killed,
              x: enemy.x,
              z: enemy.z,
            },
          });
        } else if (type === 'enemy:sync' && currentRoom && currentPlayerId) {
          const session = rooms.get(currentRoom);
          if (!session || session.labyrinthMode !== 'shared') return;
          const stage = Number(data.stage) || session.labyrinthStage;
          if (stage !== session.labyrinthStage) return;

          const list = Array.isArray(data.enemies) ? data.enemies : [];
          const synced: SharedEnemyRecord[] = [];
          for (const item of list) {
            if (!item || !item.id) continue;
            const id = String(item.id);
            const maxHp = Math.max(1, Number(item.maxHp) || 100);
            const incomingHp = Math.max(0, Math.min(maxHp, Number(item.hp) ?? maxHp));
            let rec = session.enemies.get(id);
            if (!rec) {
              rec = {
                id,
                stage,
                hp: incomingHp,
                maxHp,
                x: Number(item.x) || 0,
                y: Number(item.y) || 0,
                z: Number(item.z) || 0,
                state: String(item.state || 'idle'),
                killed: incomingHp <= 0,
              };
              session.enemies.set(id, rec);
            } else if (!rec.killed) {
              rec.hp = Math.min(rec.hp, incomingHp);
              rec.killed = rec.hp <= 0;
              rec.x = Number(item.x) || rec.x;
              rec.y = Number(item.y) || rec.y;
              rec.z = Number(item.z) || rec.z;
              rec.state = String(item.state || rec.state);
            }
            synced.push(rec);
          }

          broadcastToRoom(
            currentRoom,
            {
              type: 'enemy:synced',
              data: {
                stage,
                senderId: currentPlayerId,
                enemies: synced,
              },
            },
            currentPlayerId
          );
        } else if (type === 'world:event' && currentRoom && currentPlayerId) {
          const session = rooms.get(currentRoom);
          if (!session || session.labyrinthMode !== 'shared') return;

          const eventId = String(
            data.eventId || `wev_${currentPlayerId}_${Date.now()}_${Math.random()}`
          );
          if (rememberEventId(eventId)) return;

          const worldEv: SharedWorldEvent = {
            eventId,
            senderId: currentPlayerId,
            stage: Number(data.stage) || session.labyrinthStage,
            kind: data.kind,
            targetId: String(data.targetId || ''),
            gateId: data.gateId ? String(data.gateId) : undefined,
            x: typeof data.x === 'number' ? data.x : undefined,
            y: typeof data.y === 'number' ? data.y : undefined,
            z: typeof data.z === 'number' ? data.z : undefined,
            rotY: typeof data.rotY === 'number' ? data.rotY : undefined,
            vx: typeof data.vx === 'number' ? data.vx : undefined,
            vy: typeof data.vy === 'number' ? data.vy : undefined,
            vz: typeof data.vz === 'number' ? data.vz : undefined,
            isHeld: typeof data.isHeld === 'boolean' ? data.isHeld : undefined,
            isThrown: typeof data.isThrown === 'boolean' ? data.isThrown : undefined,
            throwDamage: typeof data.throwDamage === 'number' ? data.throwDamage : undefined,
            isLit: typeof data.isLit === 'boolean' ? data.isLit : undefined,
            timestamp: Date.now(),
          };

          if (worldEv.kind === 'wall_dismantle') {
            session.worldEvents = session.worldEvents.filter(
              (ev) => !(ev.kind === 'wall_place' && ev.targetId === worldEv.targetId)
            );
          } else if (worldEv.kind === 'wall_place') {
            const currentWalls = session.worldEvents.filter(
              (ev) => ev.stage === worldEv.stage && ev.kind === 'wall_place'
            );
            if (currentWalls.length >= 12) {
              return;
            }
            session.worldEvents.push(worldEv);
          } else if (worldEv.kind !== 'prop_sync') {
            session.worldEvents.push(worldEv);
            if (session.worldEvents.length > 400) {
              session.worldEvents.shift();
            }
          }

          broadcastToRoom(
            currentRoom,
            {
              type: 'world:event',
              data: worldEv,
            },
            currentPlayerId
          );
        } else if (type === 'stage:advance' && currentRoom && currentPlayerId) {
          const session = rooms.get(currentRoom);
          if (!session || session.labyrinthMode !== 'shared') return;
          const sNum = Number(data.stage);
          const nextStage = (
            sNum === 2 ? 2 : sNum === 3 ? 3 : sNum === 4 ? 4 : sNum === 5 ? 5 : 1
          ) as 1 | 2 | 3 | 4 | 5;
          session.labyrinthStage = nextStage;
          session.enemies.clear();
          session.worldEvents = [];
          session.deadPlayers.clear();

          broadcastToRoom(
            currentRoom,
            {
              type: 'stage:advanced',
              data: {
                stage: nextStage,
                victory: Boolean(data.victory),
                reset: Boolean(data.reset),
                triggeredBy: currentPlayerId,
              },
            },
            currentPlayerId
          );
        } else if (type === 'player:hit' && currentRoom && currentPlayerId) {
          const session = rooms.get(currentRoom);
          if (!session) return;
          const targetId = String(data.targetId || '');
          const target = session.players.get(targetId);
          const attacker = session.players.get(currentPlayerId);
          if (!target) return;

          const rawDamage = Math.min(120, Math.max(1, Number(data.damage) || 20));
          const finalDamage = target.shieldActive
            ? Math.round(rawDamage * 0.5)
            : Math.round(rawDamage);
          target.hp = Math.max(0, target.hp - finalDamage);

          let roundWinnerId: string | null = null;
          if (target.hp <= 0) {
            if (attacker && attacker.id !== target.id) {
              attacker.wins += 1;
              roundWinnerId = attacker.id;
            }
            // Respawn target after KO
            target.hp = target.maxHp;
          }

          broadcastToRoom(currentRoom, {
            type: 'player:damaged',
            data: {
              targetId: target.id,
              attackerId: currentPlayerId,
              attackerName: attacker ? attacker.name : 'Союзник',
              damage: finalDamage,
              hp: target.hp,
              maxHp: target.maxHp,
              blockedByShield: target.shieldActive,
              roundWinnerId,
              players: serializeRoomState(currentRoom),
            },
          });
        } else if (type === 'duel:reset' && currentRoom) {
          const session = rooms.get(currentRoom);
          if (!session) return;
          for (const p of session.players.values()) {
            p.hp = p.maxHp;
          }
          if (session.labyrinthMode === 'shared') {
            session.enemies.clear();
          }
          broadcastToRoom(currentRoom, {
            type: 'room:sync',
            data: {
              labyrinthMode: session.labyrinthMode,
              labyrinthStage: session.labyrinthStage,
              enemies: serializeRoomEnemies(currentRoom),
              players: serializeRoomState(currentRoom),
            },
          });
        }
      } catch {
        // Ignore malformed packets
      }
    });

    ws.on('close', () => {
      if (currentRoom && currentPlayerId) {
        const session = rooms.get(currentRoom);
        if (session) {
          session.players.delete(currentPlayerId);
          if (session.players.size === 0) {
            rooms.delete(currentRoom);
          } else {
            broadcastToRoom(currentRoom, {
              type: 'user:left',
              data: { id: currentPlayerId, players: serializeRoomState(currentRoom) },
            });
          }
        }
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Vox Arcanum server listening on http://localhost:${PORT}`);
  });
}

startServer();
