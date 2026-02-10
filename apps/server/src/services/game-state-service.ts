import { redis } from '../config/redis';
import type { RoomInfo } from '../../../shared/types';

// Redis-based game state persistence for room metadata
// Actual game state (snakes, food) is held in-memory for performance
export class GameStateService {
  static async setRoomInfo(roomId: string, info: RoomInfo): Promise<void> {
    await redis.hset(`room:${roomId}`, {
      roomId: info.roomId,
      playerCount: info.playerCount.toString(),
      maxPlayers: info.maxPlayers.toString(),
    });
    await redis.expire(`room:${roomId}`, 3600); // 1 hour TTL
  }

  static async getRoomInfo(roomId: string): Promise<RoomInfo | null> {
    const data = await redis.hgetall(`room:${roomId}`);
    if (!data.roomId) return null;
    return {
      roomId: data.roomId,
      playerCount: parseInt(data.playerCount, 10),
      maxPlayers: parseInt(data.maxPlayers, 10),
    };
  }

  static async deleteRoom(roomId: string): Promise<void> {
    await redis.del(`room:${roomId}`);
  }

  static async trackPlayerSession(
    playerId: string,
    roomId: string
  ): Promise<void> {
    await redis.set(`player:${playerId}:room`, roomId, 'EX', 3600);
  }

  static async getPlayerRoom(playerId: string): Promise<string | null> {
    return redis.get(`player:${playerId}:room`);
  }

  static async removePlayerSession(playerId: string): Promise<void> {
    await redis.del(`player:${playerId}:room`);
  }
}
