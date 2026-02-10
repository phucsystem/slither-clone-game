import {
  BASE_SPEED,
  BOOST_SPEED,
  BOOST_MASS_COST_PER_TICK,
  INITIAL_SNAKE_LENGTH,
  SNAKE_HEAD_RADIUS,
  SNAKE_SEGMENT_SPACING,
  MAP_WIDTH,
  MAP_HEIGHT,
  MIN_BOOST_LENGTH,
} from '../../../shared/constants';
import type { SnakeState, SnakeSegment, PlayerInput } from '../../../shared/types';

interface InternalSnake {
  playerId: string;
  username: string;
  segments: SnakeSegment[];
  direction: number;
  speed: number;
  length: number;
  skinId: string;
  boosting: boolean;
  score: number;
  kills: number;
  joinedAt: number;
  pendingInputs: PlayerInput[];
}

export class SnakeManager {
  private snakes = new Map<string, InternalSnake>();

  spawnSnake(playerId: string, username: string, skinId: string): SnakeSegment {
    // Random spawn position away from edges
    const margin = 500;
    const spawnX = margin + Math.random() * (MAP_WIDTH - margin * 2);
    const spawnY = margin + Math.random() * (MAP_HEIGHT - margin * 2);
    const direction = Math.random() * Math.PI * 2;

    const segments: SnakeSegment[] = [];
    for (let index = 0; index < INITIAL_SNAKE_LENGTH; index++) {
      segments.push({
        x: spawnX - Math.cos(direction) * index * SNAKE_SEGMENT_SPACING,
        y: spawnY - Math.sin(direction) * index * SNAKE_SEGMENT_SPACING,
      });
    }

    this.snakes.set(playerId, {
      playerId,
      username,
      segments,
      direction,
      speed: BASE_SPEED,
      length: INITIAL_SNAKE_LENGTH,
      skinId,
      boosting: false,
      score: 0,
      kills: 0,
      joinedAt: Date.now(),
      pendingInputs: [],
    });

    return { x: spawnX, y: spawnY };
  }

  queueInput(playerId: string, input: PlayerInput): void {
    const snake = this.snakes.get(playerId);
    if (!snake) return;

    // Validate direction (0-2π)
    if (input.direction < 0 || input.direction > Math.PI * 2) return;

    snake.pendingInputs.push(input);
    // Keep only the latest input per tick
    if (snake.pendingInputs.length > 3) {
      snake.pendingInputs = snake.pendingInputs.slice(-1);
    }
  }

  updateAll(deltaTime: number): void {
    for (const [, snake] of this.snakes) {
      this.updateSnake(snake, deltaTime);
    }
  }

  private updateSnake(snake: InternalSnake, deltaTime: number): void {
    // Process latest input
    const latestInput = snake.pendingInputs.pop();
    if (latestInput) {
      snake.direction = latestInput.direction;
      snake.boosting = latestInput.boostActive && snake.length > MIN_BOOST_LENGTH;
      snake.pendingInputs = [];
    }

    // Calculate speed
    snake.speed = snake.boosting ? BOOST_SPEED : BASE_SPEED;

    // Boost consumes mass
    if (snake.boosting) {
      snake.length = Math.max(MIN_BOOST_LENGTH, snake.length - BOOST_MASS_COST_PER_TICK * deltaTime);
    }

    // Move head
    const head = snake.segments[0];
    const newHeadX = head.x + Math.cos(snake.direction) * snake.speed;
    const newHeadY = head.y + Math.sin(snake.direction) * snake.speed;

    // Clamp to map bounds
    const clampedX = Math.max(SNAKE_HEAD_RADIUS, Math.min(MAP_WIDTH - SNAKE_HEAD_RADIUS, newHeadX));
    const clampedY = Math.max(SNAKE_HEAD_RADIUS, Math.min(MAP_HEIGHT - SNAKE_HEAD_RADIUS, newHeadY));

    // Insert new head position
    snake.segments.unshift({ x: clampedX, y: clampedY });

    // Trim tail to match current length
    const targetSegments = Math.ceil(snake.length);
    while (snake.segments.length > targetSegments) {
      snake.segments.pop();
    }
  }

  growSnake(playerId: string, amount: number): void {
    const snake = this.snakes.get(playerId);
    if (!snake) return;
    snake.length += amount;
    snake.score += amount;
  }

  addKill(playerId: string): void {
    const snake = this.snakes.get(playerId);
    if (snake) {
      snake.kills++;
    }
  }

  getSnake(playerId: string): InternalSnake | undefined {
    return this.snakes.get(playerId);
  }

  removeSnake(playerId: string): void {
    this.snakes.delete(playerId);
  }

  getAllStates(): SnakeState[] {
    const states: SnakeState[] = [];
    for (const [, snake] of this.snakes) {
      states.push({
        playerId: snake.playerId,
        username: snake.username,
        segments: snake.segments,
        direction: snake.direction,
        speed: snake.speed,
        length: snake.length,
        skinId: snake.skinId,
        boosting: snake.boosting,
        score: snake.score,
        kills: snake.kills,
      });
    }
    return states;
  }

  getAllSnakes(): Map<string, InternalSnake> {
    return this.snakes;
  }

  getSnakeCount(): number {
    return this.snakes.size;
  }

  getTimeAlive(playerId: string): number {
    const snake = this.snakes.get(playerId);
    if (!snake) return 0;
    return Math.floor((Date.now() - snake.joinedAt) / 1000);
  }
}
