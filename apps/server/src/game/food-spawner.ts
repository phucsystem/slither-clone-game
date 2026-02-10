import { v4 as uuidv4 } from 'uuid';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  FOOD_RADIUS,
  MIN_FOOD_PER_ROOM,
  MAX_FOOD_PER_ROOM,
  FOOD_COLOR_WEIGHTS,
  FOOD_VALUES,
  FOOD_RESPAWN_MIN_MS,
  FOOD_RESPAWN_MAX_MS,
  BONUS_FOOD_RADIUS,
  BONUS_FOOD_SPAWN_INTERVAL_MS,
  MAX_BONUS_FOOD,
} from '../../../shared/constants';
import type { FoodItem, FoodColor, SnakeSegment } from '../../../shared/types';

export class FoodSpawner {
  private food = new Map<string, FoodItem>();
  private respawnTimers: ReturnType<typeof setTimeout>[] = [];
  private nextBonusSpawnTime = Date.now() + BONUS_FOOD_SPAWN_INTERVAL_MS;
  private bonusFoodCount = 0;

  initializeFood(): void {
    const count = MIN_FOOD_PER_ROOM + Math.floor(Math.random() * (MAX_FOOD_PER_ROOM - MIN_FOOD_PER_ROOM));
    for (let index = 0; index < count; index++) {
      this.spawnFood();
    }
  }

  spawnFood(): FoodItem {
    const color = this.randomColor();
    const foodItem: FoodItem = {
      id: uuidv4().slice(0, 12),
      x: Math.random() * MAP_WIDTH,
      y: Math.random() * MAP_HEIGHT,
      color,
      value: FOOD_VALUES[color],
      radius: FOOD_RADIUS,
    };

    this.food.set(foodItem.id, foodItem);
    return foodItem;
  }

  /** Call each tick to spawn bonus food periodically */
  update(): void {
    const now = Date.now();
    if (now >= this.nextBonusSpawnTime && this.bonusFoodCount < MAX_BONUS_FOOD) {
      this.spawnBonusFood();
      this.nextBonusSpawnTime = now + BONUS_FOOD_SPAWN_INTERVAL_MS;
    }
  }

  private spawnBonusFood(): void {
    const margin = 200;
    const foodItem: FoodItem = {
      id: uuidv4().slice(0, 12),
      x: margin + Math.random() * (MAP_WIDTH - margin * 2),
      y: margin + Math.random() * (MAP_HEIGHT - margin * 2),
      color: 'rainbow',
      value: FOOD_VALUES.rainbow,
      radius: BONUS_FOOD_RADIUS,
    };
    this.food.set(foodItem.id, foodItem);
    this.bonusFoodCount++;
  }

  collectFood(foodId: string): FoodItem | undefined {
    const item = this.food.get(foodId);
    if (!item) return undefined;

    if (item.color === 'rainbow') {
      this.bonusFoodCount = Math.max(0, this.bonusFoodCount - 1);
    }

    this.food.delete(foodId);

    // Schedule respawn
    const delay = FOOD_RESPAWN_MIN_MS + Math.random() * (FOOD_RESPAWN_MAX_MS - FOOD_RESPAWN_MIN_MS);
    const timer = setTimeout(() => {
      if (this.food.size < MAX_FOOD_PER_ROOM) {
        this.spawnFood();
      }
    }, delay);
    this.respawnTimers.push(timer);

    return item;
  }

  convertSnakeToFood(segments: SnakeSegment[]): void {
    // Drop food at every 3rd segment position
    for (let index = 0; index < segments.length; index += 3) {
      const segment = segments[index];
      const foodItem: FoodItem = {
        id: uuidv4().slice(0, 12),
        x: segment.x + (Math.random() - 0.5) * 20,
        y: segment.y + (Math.random() - 0.5) * 20,
        color: 'green',
        value: FOOD_VALUES.green,
        radius: FOOD_RADIUS,
      };
      this.food.set(foodItem.id, foodItem);
    }
  }

  getAllFood(): FoodItem[] {
    return Array.from(this.food.values());
  }

  getFoodById(foodId: string): FoodItem | undefined {
    return this.food.get(foodId);
  }

  getFoodNear(x: number, y: number, radius: number): FoodItem[] {
    const nearby: FoodItem[] = [];
    for (const [, item] of this.food) {
      const distX = item.x - x;
      const distY = item.y - y;
      if (distX * distX + distY * distY <= radius * radius) {
        nearby.push(item);
      }
    }
    return nearby;
  }

  getFoodCount(): number {
    return this.food.size;
  }

  cleanup(): void {
    for (const timer of this.respawnTimers) {
      clearTimeout(timer);
    }
    this.respawnTimers = [];
    this.food.clear();
  }

  private randomColor(): FoodColor {
    const roll = Math.random() * 100;
    if (roll < FOOD_COLOR_WEIGHTS.white) return 'white';
    if (roll < FOOD_COLOR_WEIGHTS.white + FOOD_COLOR_WEIGHTS.green) return 'green';
    if (roll < FOOD_COLOR_WEIGHTS.white + FOOD_COLOR_WEIGHTS.green + FOOD_COLOR_WEIGHTS.blue) return 'blue';
    return 'gold';
  }
}
