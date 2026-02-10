import { BASE_SPEED, BOOST_SPEED, MAP_WIDTH, MAP_HEIGHT, SNAKE_HEAD_RADIUS } from '../../../shared/constants';
import type { PlayerInput, SnakeState, SnakeSegment } from '../../../shared/types';

interface PredictionRecord {
  input: PlayerInput;
  predictedPosition: SnakeSegment;
}

export class PredictionEngine {
  private predictions: PredictionRecord[] = [];
  private lastConfirmedState: SnakeState | null = null;

  applyInput(currentState: SnakeState, input: PlayerInput): SnakeState {
    const speed = input.boostActive ? BOOST_SPEED : BASE_SPEED;
    const head = currentState.segments[0];

    const newHeadX = Math.max(
      SNAKE_HEAD_RADIUS,
      Math.min(MAP_WIDTH - SNAKE_HEAD_RADIUS, head.x + Math.cos(input.direction) * speed)
    );
    const newHeadY = Math.max(
      SNAKE_HEAD_RADIUS,
      Math.min(MAP_HEIGHT - SNAKE_HEAD_RADIUS, head.y + Math.sin(input.direction) * speed)
    );

    const newSegments = [{ x: newHeadX, y: newHeadY }, ...currentState.segments];
    const targetLength = Math.ceil(currentState.length);
    while (newSegments.length > targetLength) {
      newSegments.pop();
    }

    const predicted: SnakeState = {
      ...currentState,
      segments: newSegments,
      direction: input.direction,
      speed,
      boosting: input.boostActive,
    };

    // Store prediction
    this.predictions.push({
      input,
      predictedPosition: { x: newHeadX, y: newHeadY },
    });

    // Cap prediction buffer
    if (this.predictions.length > 120) {
      this.predictions = this.predictions.slice(-60);
    }

    return predicted;
  }

  reconcile(serverState: SnakeState, serverTick: number): SnakeState {
    this.lastConfirmedState = serverState;

    // Discard predictions older than server tick
    this.predictions = this.predictions.filter(
      (pred) => pred.input.sequenceNumber > serverTick
    );

    // Replay remaining predictions on top of server state
    let reconciled = serverState;
    for (const pred of this.predictions) {
      reconciled = this.applyInput(reconciled, pred.input);
    }

    return reconciled;
  }

  getLastConfirmedState(): SnakeState | null {
    return this.lastConfirmedState;
  }

  clear(): void {
    this.predictions = [];
    this.lastConfirmedState = null;
  }
}
