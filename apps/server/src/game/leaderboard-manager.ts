import { LEADERBOARD_SIZE } from '../../../shared/constants';
import { SnakeManager } from './snake-manager';
import type { LeaderboardEntry } from '../../../shared/types';

export class LeaderboardManager {
  private lastLeaderboard: LeaderboardEntry[] = [];
  private lastComputeTime = 0;

  compute(snakeManager: SnakeManager): LeaderboardEntry[] {
    // Throttle to ~1Hz (1000ms)
    const now = Date.now();
    if (now - this.lastComputeTime < 1000 && this.lastLeaderboard.length > 0) {
      return this.lastLeaderboard;
    }
    this.lastComputeTime = now;

    const allStates = snakeManager.getAllStates();

    // Sort by length descending
    allStates.sort((first, second) => second.length - first.length);

    this.lastLeaderboard = allStates
      .slice(0, LEADERBOARD_SIZE)
      .map((snake, index) => ({
        playerId: snake.playerId,
        username: snake.username,
        length: Math.ceil(snake.length),
        kills: snake.kills,
        rank: index + 1,
      }));

    return this.lastLeaderboard;
  }
}
