import { v4 as uuidv4 } from 'uuid';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { MAX_PLAYERS_PER_ROOM } from '../../../shared/constants';
import { GameLoop, RoomGameState } from './game-loop';
import type {
  GameState,
  DeathStats,
  RoomInfo,
  ServerToClientEvents,
  ClientToServerEvents,
} from '../../../shared/types';

interface RoomData {
  roomId: string;
  players: Map<string, Socket<ClientToServerEvents, ServerToClientEvents>>;
  gameState: RoomGameState;
}

const rooms = new Map<string, RoomData>();

// Map playerId -> roomId for quick lookup
const playerRoomMap = new Map<string, string>();

export class RoomManager {
  private static socketServer: SocketIOServer;

  static init(server: SocketIOServer): void {
    RoomManager.socketServer = server;
  }

  static findOrCreateRoom(): RoomData {
    // Find room with space
    for (const [, room] of rooms) {
      if (room.players.size < MAX_PLAYERS_PER_ROOM) {
        return room;
      }
    }

    // Create new room
    const roomId = `room-${uuidv4().slice(0, 8)}`;
    const gameState = GameLoop.createRoom(roomId);
    GameLoop.startRoom(roomId);

    const room: RoomData = {
      roomId,
      players: new Map(),
      gameState,
    };

    rooms.set(roomId, room);
    console.log(`[RoomManager] Created room ${roomId}`);
    return room;
  }

  static joinRoom(
    playerId: string,
    socket: Socket<ClientToServerEvents, ServerToClientEvents>
  ): RoomData {
    const room = RoomManager.findOrCreateRoom();
    room.players.set(playerId, socket);
    playerRoomMap.set(playerId, room.roomId);
    socket.join(room.roomId);

    console.log(`[RoomManager] Player ${playerId} joined ${room.roomId} (${room.players.size} players)`);
    return room;
  }

  static leaveRoom(playerId: string): void {
    const roomId = playerRoomMap.get(playerId);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const socket = room.players.get(playerId);
    if (socket) {
      socket.leave(roomId);
    }

    room.players.delete(playerId);
    playerRoomMap.delete(playerId);

    // Remove snake from game
    room.gameState.snakeManager.removeSnake(playerId);

    // Notify others
    RoomManager.socketServer?.to(roomId).emit('player-left', { playerId });

    console.log(`[RoomManager] Player ${playerId} left ${roomId} (${room.players.size} players)`);

    // Destroy empty room
    if (room.players.size === 0) {
      GameLoop.stopRoom(roomId);
      rooms.delete(roomId);
      console.log(`[RoomManager] Destroyed empty room ${roomId}`);
    }
  }

  static getAvailableRooms(): RoomInfo[] {
    const available: RoomInfo[] = [];
    for (const [, room] of rooms) {
      available.push({
        roomId: room.roomId,
        playerCount: room.players.size,
        maxPlayers: MAX_PLAYERS_PER_ROOM,
      });
    }
    return available;
  }

  static broadcastState(roomId: string, state: GameState): void {
    RoomManager.socketServer?.to(roomId).emit('game-state', state);
  }

  static notifyDeath(roomId: string, death: DeathStats): void {
    const room = rooms.get(roomId);
    if (!room) return;

    const socket = room.players.get(death.playerId);
    if (socket) {
      socket.emit('player-death', { stats: death });
    }
  }

  static getRoomForPlayer(playerId: string): RoomData | undefined {
    const roomId = playerRoomMap.get(playerId);
    if (!roomId) return undefined;
    return rooms.get(roomId);
  }

  static getPlayerCount(roomId: string): number {
    return rooms.get(roomId)?.players.size ?? 0;
  }
}
