import { v4 as uuidv4 } from 'uuid';
import { MAP_WIDTH, MAP_HEIGHT, SNAKE_HEAD_RADIUS, SERVER_TICK_RATE } from '../../../shared/constants';
import type { PlayerInput } from '../../../shared/types';
import { SnakeManager } from './snake-manager';

interface BotState {
  botId: string;
  username: string;
  nextDirectionChangeTime: number;
  nextBoostTime: number;
  targetDirection: number;
  isChangingDirection: boolean;
}

const BOT_NAMES = [
  'Slithery Sam',
  'Danger Noodle',
  'Snek Lord',
  'Hiss-tory',
  'Python Pete',
  'Cobra Commander',
  'Sidewinder Sue',
  'Viper Val',
  'Rattlesnake Rick',
  'Anaconda Andy',
  'Mamba Max',
  'Boa Bob',
];

const EDGE_MARGIN = 400; // Distance from edge to trigger avoidance
const DIRECTION_CHANGE_MIN_MS = 1000; // 1 second
const DIRECTION_CHANGE_MAX_MS = 3000; // 3 seconds
const BOOST_CHANCE_PER_CHECK = 0.02; // 2% chance to boost each check
const BOOST_MIN_INTERVAL_MS = 5000; // Minimum 5 seconds between boosts
const BOT_SPAWN_INTERVAL_MS = 7000; // 7 seconds between bot spawns
const MAX_BOTS = 4;

export class BotManager {
  private bots = new Map<string, BotState>();
  private snakeManager: SnakeManager;
  private nextBotSpawnTime: number;
  private botsSpawned = 0;
  private usedNames = new Set<string>();

  constructor(snakeManager: SnakeManager) {
    this.snakeManager = snakeManager;
    this.nextBotSpawnTime = Date.now() + BOT_SPAWN_INTERVAL_MS;
  }

  update(): void {
    const currentTime = Date.now();

    // Spawn bots gradually
    if (this.botsSpawned < MAX_BOTS && currentTime >= this.nextBotSpawnTime) {
      this.spawnBot();
      this.botsSpawned++;
      this.nextBotSpawnTime = currentTime + BOT_SPAWN_INTERVAL_MS;
    }

    // Update each bot's AI
    for (const [botId, botState] of this.bots) {
      this.updateBotAI(botId, botState);
    }
  }

  private spawnBot(): void {
    const botId = uuidv4();
    const username = this.getRandomUniqueName();
    const skinId = this.getRandomSkinId();

    this.snakeManager.spawnSnake(botId, username, skinId);

    const initialDirection = Math.random() * Math.PI * 2;
    const botState: BotState = {
      botId,
      username,
      nextDirectionChangeTime: Date.now() + this.randomDirectionChangeInterval(),
      nextBoostTime: Date.now() + BOOST_MIN_INTERVAL_MS,
      targetDirection: initialDirection,
      isChangingDirection: false,
    };

    this.bots.set(botId, botState);
    console.log(`[BotManager] Spawned bot: ${username} (${botId})`);
  }

  private updateBotAI(botId: string, botState: BotState): void {
    const snake = this.snakeManager.getSnake(botId);
    if (!snake) {
      // Bot died, clean up
      this.bots.delete(botId);
      this.usedNames.delete(botState.username);
      console.log(`[BotManager] Bot ${botState.username} died`);
      return;
    }

    const currentTime = Date.now();
    const head = snake.segments[0];

    // Check if near edges and adjust direction to avoid
    const edgeAvoidanceDirection = this.getEdgeAvoidanceDirection(head.x, head.y, snake.direction);
    if (edgeAvoidanceDirection !== null) {
      botState.targetDirection = edgeAvoidanceDirection;
      botState.nextDirectionChangeTime = currentTime + this.randomDirectionChangeInterval();
    } else if (currentTime >= botState.nextDirectionChangeTime) {
      // Random direction change
      botState.targetDirection = this.getRandomDirection();
      botState.nextDirectionChangeTime = currentTime + this.randomDirectionChangeInterval();
    }

    // Smooth direction transition (turn gradually)
    const currentDirection = snake.direction;
    let newDirection = this.smoothTurn(currentDirection, botState.targetDirection);

    // Decide whether to boost
    const shouldBoost = this.shouldBoost(botState, currentTime);

    // Queue input for this bot
    const input: PlayerInput = {
      direction: newDirection,
      boostActive: shouldBoost,
      timestamp: currentTime,
      sequenceNumber: 0, // Bots don't need sequence tracking
    };

    this.snakeManager.queueInput(botId, input);
  }

  private getEdgeAvoidanceDirection(
    xPos: number,
    yPos: number,
    currentDirection: number
  ): number | null {
    let avoidX = 0;
    let avoidY = 0;

    // Check proximity to edges
    if (xPos < EDGE_MARGIN) {
      avoidX = 1; // Move right
    } else if (xPos > MAP_WIDTH - EDGE_MARGIN) {
      avoidX = -1; // Move left
    }

    if (yPos < EDGE_MARGIN) {
      avoidY = 1; // Move down
    } else if (yPos > MAP_HEIGHT - EDGE_MARGIN) {
      avoidY = -1; // Move up
    }

    // If near edge, compute escape direction
    if (avoidX !== 0 || avoidY !== 0) {
      return Math.atan2(avoidY, avoidX);
    }

    return null;
  }

  private smoothTurn(current: number, target: number): number {
    const turnSpeed = 0.1; // Radians per tick
    let diff = target - current;

    // Normalize to [-π, π]
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    if (Math.abs(diff) < turnSpeed) {
      return target;
    }

    return current + Math.sign(diff) * turnSpeed;
  }

  private shouldBoost(botState: BotState, currentTime: number): boolean {
    if (currentTime < botState.nextBoostTime) {
      return false;
    }

    if (Math.random() < BOOST_CHANCE_PER_CHECK) {
      botState.nextBoostTime = currentTime + BOOST_MIN_INTERVAL_MS;
      return true;
    }

    return false;
  }

  private getRandomDirection(): number {
    return Math.random() * Math.PI * 2;
  }

  private randomDirectionChangeInterval(): number {
    return DIRECTION_CHANGE_MIN_MS + Math.random() * (DIRECTION_CHANGE_MAX_MS - DIRECTION_CHANGE_MIN_MS);
  }

  private getRandomUniqueName(): string {
    const availableNames = BOT_NAMES.filter((name) => !this.usedNames.has(name));

    if (availableNames.length === 0) {
      // All names used, generate a numbered variant
      const baseName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      const uniqueName = `${baseName} ${Math.floor(Math.random() * 1000)}`;
      this.usedNames.add(uniqueName);
      return uniqueName;
    }

    const name = availableNames[Math.floor(Math.random() * availableNames.length)];
    this.usedNames.add(name);
    return name;
  }

  private getRandomSkinId(): string {
    const skins = ['classic-blue', 'neon-green', 'hot-pink', 'royal-purple', 'sunset-orange'];
    return skins[Math.floor(Math.random() * skins.length)];
  }

  cleanup(): void {
    // Remove all bots when room shuts down
    for (const [botId] of this.bots) {
      this.snakeManager.removeSnake(botId);
    }
    this.bots.clear();
    this.usedNames.clear();
    console.log('[BotManager] Cleaned up all bots');
  }

  getBotCount(): number {
    return this.bots.size;
  }
}
