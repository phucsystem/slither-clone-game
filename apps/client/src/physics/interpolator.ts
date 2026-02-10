import Phaser from 'phaser';
import { INTERPOLATION_LERP, EXTRAPOLATION_THRESHOLD_MS } from '../../../shared/constants';
import type { SnakeState, SnakeSegment } from '../../../shared/types';

interface InterpolationState {
  previous: SnakeState;
  target: SnakeState;
  lastUpdateTime: number;
}

export class Interpolator {
  private states = new Map<string, InterpolationState>();

  updateTarget(playerId: string, newState: SnakeState): void {
    const existing = this.states.get(playerId);
    this.states.set(playerId, {
      previous: existing?.target || newState,
      target: newState,
      lastUpdateTime: Date.now(),
    });
  }

  getInterpolated(playerId: string): SnakeState | null {
    const interpState = this.states.get(playerId);
    if (!interpState) return null;

    const timeSinceUpdate = Date.now() - interpState.lastUpdateTime;
    const target = interpState.target;

    // If update is too old, extrapolate
    if (timeSinceUpdate > EXTRAPOLATION_THRESHOLD_MS) {
      return this.extrapolate(target, timeSinceUpdate);
    }

    // Lerp between previous and target
    const interpolated: SnakeState = {
      ...target,
      segments: target.segments.map((targetSeg, index) => {
        const prevSeg = interpState.previous.segments[index];
        if (!prevSeg) return targetSeg;
        return {
          x: Phaser.Math.Linear(prevSeg.x, targetSeg.x, INTERPOLATION_LERP),
          y: Phaser.Math.Linear(prevSeg.y, targetSeg.y, INTERPOLATION_LERP),
        };
      }),
    };

    // Update previous to current interpolated for next frame
    interpState.previous = interpolated;

    return interpolated;
  }

  private extrapolate(state: SnakeState, elapsedMs: number): SnakeState {
    const elapsedSec = elapsedMs / 1000;
    const head = state.segments[0];
    if (!head) return state;

    const extrapolatedHead: SnakeSegment = {
      x: head.x + Math.cos(state.direction) * state.speed * elapsedSec * 60,
      y: head.y + Math.sin(state.direction) * state.speed * elapsedSec * 60,
    };

    return {
      ...state,
      segments: [extrapolatedHead, ...state.segments.slice(1)],
    };
  }

  removePlayer(playerId: string): void {
    this.states.delete(playerId);
  }

  clear(): void {
    this.states.clear();
  }
}
