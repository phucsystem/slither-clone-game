import Phaser from 'phaser';
import type { PlayerInput } from '../../../shared/types';

export class InputManager {
  private scene: Phaser.Scene;
  private boostActive = false;
  private direction = 0;
  private sequenceNumber = 0;
  private snakeHeadX = 0;
  private snakeHeadY = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Spacebar for boost
    scene.input.keyboard!.on('keydown-SPACE', () => {
      this.boostActive = true;
    });
    scene.input.keyboard!.on('keyup-SPACE', () => {
      this.boostActive = false;
    });
  }

  setSnakeHeadPosition(x: number, y: number): void {
    this.snakeHeadX = x;
    this.snakeHeadY = y;
  }

  update(): void {
    const pointer = this.scene.input.activePointer;
    const camera = this.scene.cameras.main;

    // Convert screen pointer to world coordinates
    const worldX = pointer.x + camera.scrollX;
    const worldY = pointer.y + camera.scrollY;

    // Calculate direction from snake head to cursor
    this.direction = Math.atan2(
      worldY - this.snakeHeadY,
      worldX - this.snakeHeadX
    );

    // Normalize to 0-2π
    if (this.direction < 0) {
      this.direction += Math.PI * 2;
    }

    // WASD overrides
    const keys = this.scene.input.keyboard!;
    if (keys.addKey('W').isDown) this.direction = Math.PI * 1.5; // up
    if (keys.addKey('S').isDown) this.direction = Math.PI * 0.5; // down
    if (keys.addKey('A').isDown) this.direction = Math.PI;       // left
    if (keys.addKey('D').isDown) this.direction = 0;             // right
  }

  getInput(): PlayerInput {
    this.sequenceNumber++;
    return {
      direction: this.direction,
      boostActive: this.boostActive,
      timestamp: Date.now(),
      sequenceNumber: this.sequenceNumber,
    };
  }

  isBoosting(): boolean {
    return this.boostActive;
  }
}
