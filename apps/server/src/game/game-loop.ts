import { SERVER_TICK_RATE, TICK_INTERVAL_MS, BROADCAST_EVERY_N_TICKS } from '../../../shared/constants';
import { RoomManager } from './room-manager';
import { SnakeManager } from './snake-manager';
import { FoodSpawner } from './food-spawner';
import { CollisionEngine } from './collision-engine';
import { LeaderboardManager } from './leaderboard-manager';
import { BotManager } from './bot-manager';
import type { GameState } from '../../../shared/types';

export interface RoomGameState {
  roomId: string;
  snakeManager: SnakeManager;
  foodSpawner: FoodSpawner;
  collisionEngine: CollisionEngine;
  leaderboardManager: LeaderboardManager;
  botManager: BotManager;
  tickCount: number;
  intervalId: ReturnType<typeof setInterval> | null;
}

// Stores per-room game state
const roomStates = new Map<string, RoomGameState>();

export class GameLoop {
  static createRoom(roomId: string): RoomGameState {
    const snakeManager = new SnakeManager();
    const foodSpawner = new FoodSpawner();
    const collisionEngine = new CollisionEngine();
    const leaderboardManager = new LeaderboardManager();
    const botManager = new BotManager(snakeManager);

    foodSpawner.initializeFood();

    const state: RoomGameState = {
      roomId,
      snakeManager,
      foodSpawner,
      collisionEngine,
      leaderboardManager,
      botManager,
      tickCount: 0,
      intervalId: null,
    };

    roomStates.set(roomId, state);
    return state;
  }

  static startRoom(roomId: string): void {
    const state = roomStates.get(roomId);
    if (!state || state.intervalId) return;

    state.intervalId = setInterval(() => {
      GameLoop.tick(state);
    }, TICK_INTERVAL_MS);

    console.log(`[GameLoop] Room ${roomId} started at ${SERVER_TICK_RATE}Hz`);
  }

  static stopRoom(roomId: string): void {
    const state = roomStates.get(roomId);
    if (!state) return;

    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }

    // Clean up bots before removing room
    state.botManager.cleanup();

    roomStates.delete(roomId);
    console.log(`[GameLoop] Room ${roomId} stopped`);
  }

  static getRoomState(roomId: string): RoomGameState | undefined {
    return roomStates.get(roomId);
  }

  static tick(state: RoomGameState): void {
    const deltaTime = 1 / SERVER_TICK_RATE;
    state.tickCount++;

    // Update bot AI and bonus food spawning
    state.botManager.update();
    state.foodSpawner.update();

    // Update snake positions
    state.snakeManager.updateAll(deltaTime);

    // Check collisions
    const deaths = state.collisionEngine.checkAll(
      state.snakeManager,
      state.foodSpawner
    );

    // Process deaths: convert dead snakes to food
    for (const death of deaths) {
      const deadSnake = state.snakeManager.getSnake(death.playerId);
      if (deadSnake) {
        state.foodSpawner.convertSnakeToFood(deadSnake.segments);
        state.snakeManager.removeSnake(death.playerId);
      }

      // Notify via RoomManager (which holds socket references)
      RoomManager.notifyDeath(state.roomId, death);
    }

    // Broadcast state at CLIENT_UPDATE_RATE (every 3rd tick)
    if (state.tickCount % BROADCAST_EVERY_N_TICKS === 0) {
      const leaderboard = state.leaderboardManager.compute(state.snakeManager);
      const gameState: GameState = {
        snakes: state.snakeManager.getAllStates(),
        food: state.foodSpawner.getAllFood(),
        leaderboard,
        tick: state.tickCount,
        timestamp: Date.now(),
      };

      RoomManager.broadcastState(state.roomId, gameState);
    }
  }
}
