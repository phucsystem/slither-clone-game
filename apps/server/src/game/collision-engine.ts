import { SNAKE_HEAD_RADIUS, FOOD_RADIUS } from '../../../shared/constants';
import { SnakeManager } from './snake-manager';
import { FoodSpawner } from './food-spawner';
import type { DeathStats } from '../../../shared/types';

export class CollisionEngine {
  checkAll(snakeManager: SnakeManager, foodSpawner: FoodSpawner): DeathStats[] {
    const deaths: DeathStats[] = [];
    const allSnakes = snakeManager.getAllSnakes();
    const snakeEntries = Array.from(allSnakes.entries());

    for (const [playerId] of snakeEntries) {
      const snake = snakeManager.getSnake(playerId);
      if (!snake) continue;

      const head = snake.segments[0];

      // Head-to-food collision
      this.checkFoodCollision(head.x, head.y, playerId, snakeManager, foodSpawner);

      // Head-to-body collision (other snakes)
      for (const [otherPlayerId] of snakeEntries) {
        if (playerId === otherPlayerId) continue;
        const otherSnake = snakeManager.getSnake(otherPlayerId);
        if (!otherSnake) continue;

        // Check head vs other body segments (skip head, index 0)
        for (let segIndex = 1; segIndex < otherSnake.segments.length; segIndex++) {
          const segment = otherSnake.segments[segIndex];
          const segmentRadius = Math.max(8, SNAKE_HEAD_RADIUS - segIndex * 0.1);
          const collisionDist = SNAKE_HEAD_RADIUS + segmentRadius;

          const distX = head.x - segment.x;
          const distY = head.y - segment.y;
          const distSquared = distX * distX + distY * distY;

          if (distSquared < collisionDist * collisionDist) {
            // This snake dies
            snakeManager.addKill(otherPlayerId);
            const rank = snakeManager.getSnakeCount();

            deaths.push({
              playerId,
              rank,
              kills: snake.kills,
              maxLength: Math.ceil(snake.length),
              timeAlive: snakeManager.getTimeAlive(playerId),
              score: snake.score,
              killedBy: otherSnake.username,
            });
            break;
          }
        }

        // If this snake already died, skip further checks
        if (deaths.some((death) => death.playerId === playerId)) break;
      }

      // Skip head-to-head if already dead
      if (deaths.some((death) => death.playerId === playerId)) continue;

      // Head-to-head collision
      for (const [otherPlayerId] of snakeEntries) {
        if (playerId === otherPlayerId) continue;
        const otherSnake = snakeManager.getSnake(otherPlayerId);
        if (!otherSnake) continue;

        const otherHead = otherSnake.segments[0];
        const distX = head.x - otherHead.x;
        const distY = head.y - otherHead.y;
        const distSquared = distX * distX + distY * distY;
        const collisionDist = SNAKE_HEAD_RADIUS * 2;

        if (distSquared < collisionDist * collisionDist) {
          // Smaller snake dies; if equal, both die
          if (snake.length <= otherSnake.length) {
            const rank = snakeManager.getSnakeCount();
            if (snake.length < otherSnake.length) {
              snakeManager.addKill(otherPlayerId);
            }
            deaths.push({
              playerId,
              rank,
              kills: snake.kills,
              maxLength: Math.ceil(snake.length),
              timeAlive: snakeManager.getTimeAlive(playerId),
              score: snake.score,
              killedBy: snake.length < otherSnake.length ? otherSnake.username : null,
            });
            break;
          }
        }
      }
    }

    return deaths;
  }

  private checkFoodCollision(
    headX: number,
    headY: number,
    playerId: string,
    snakeManager: SnakeManager,
    foodSpawner: FoodSpawner
  ): void {
    const collectionRadius = SNAKE_HEAD_RADIUS + FOOD_RADIUS;
    const nearbyFood = foodSpawner.getFoodNear(headX, headY, collectionRadius);

    for (const food of nearbyFood) {
      const collected = foodSpawner.collectFood(food.id);
      if (collected) {
        snakeManager.growSnake(playerId, collected.value);
      }
    }
  }
}
