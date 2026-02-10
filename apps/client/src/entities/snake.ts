import Phaser from 'phaser';
import { SNAKE_SKINS, COLORS } from '../config/design-tokens';
import type { SnakeState } from '../../../shared/types';

export class Snake {
  private scene: Phaser.Scene;
  private headSprite: Phaser.GameObjects.Image;
  private segments: Phaser.GameObjects.Image[] = [];
  private eyeLeft: Phaser.GameObjects.Arc;
  private eyeRight: Phaser.GameObjects.Arc;
  private pupilLeft: Phaser.GameObjects.Arc;
  private pupilRight: Phaser.GameObjects.Arc;
  private nameText: Phaser.GameObjects.Text;
  private skinColors: number[];
  private isLocal: boolean;

  constructor(scene: Phaser.Scene, state: SnakeState, isLocal: boolean) {
    this.scene = scene;
    this.isLocal = isLocal;
    this.skinColors = SNAKE_SKINS[state.skinId] || SNAKE_SKINS['classic-blue'];

    // Head
    this.headSprite = scene.add.image(state.segments[0].x, state.segments[0].y, 'snake-head');
    this.headSprite.setTint(this.skinColors[0]);
    this.headSprite.setDepth(10);

    // Username label above head
    const displayName = state.username.length > 12 ? state.username.slice(0, 12) + '...' : state.username;
    this.nameText = scene.add.text(state.segments[0].x, state.segments[0].y - 30, displayName, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(13);

    // Eyes
    this.eyeLeft = scene.add.circle(0, 0, 5, 0xffffff).setDepth(11);
    this.eyeRight = scene.add.circle(0, 0, 5, 0xffffff).setDepth(11);
    this.pupilLeft = scene.add.circle(0, 0, 2.5, 0x000000).setDepth(12);
    this.pupilRight = scene.add.circle(0, 0, 2.5, 0x000000).setDepth(12);

    // Body segments
    for (let index = 1; index < state.segments.length; index++) {
      const seg = state.segments[index];
      const sprite = scene.add.image(seg.x, seg.y, 'snake-segment');
      const colorIndex = index % 2 === 0 ? 0 : 1;
      sprite.setTint(this.skinColors[colorIndex]);
      sprite.setDepth(5);
      // Gradually shrink segments
      const scale = Math.max(0.6, 1 - index * 0.005);
      sprite.setScale(scale);
      this.segments.push(sprite);
    }
  }

  updateFromState(state: SnakeState): void {
    // Update head
    if (state.segments.length > 0) {
      this.headSprite.setPosition(state.segments[0].x, state.segments[0].y);
      this.headSprite.setRotation(state.direction);

      // Update name position above head
      this.nameText.setPosition(state.segments[0].x, state.segments[0].y - 30);

      // Update eyes relative to head
      const eyeOffset = 8;
      const eyeSpread = 6;
      const headX = state.segments[0].x;
      const headY = state.segments[0].y;
      const cosDir = Math.cos(state.direction);
      const sinDir = Math.sin(state.direction);

      this.eyeLeft.setPosition(
        headX + cosDir * eyeOffset - sinDir * eyeSpread,
        headY + sinDir * eyeOffset + cosDir * eyeSpread
      );
      this.eyeRight.setPosition(
        headX + cosDir * eyeOffset + sinDir * eyeSpread,
        headY + sinDir * eyeOffset - cosDir * eyeSpread
      );
      this.pupilLeft.setPosition(
        this.eyeLeft.x + cosDir * 2,
        this.eyeLeft.y + sinDir * 2
      );
      this.pupilRight.setPosition(
        this.eyeRight.x + cosDir * 2,
        this.eyeRight.y + sinDir * 2
      );
    }

    // Update body segments — add or remove as needed
    while (this.segments.length < state.segments.length - 1) {
      const sprite = this.scene.add.image(0, 0, 'snake-segment');
      sprite.setTint(this.skinColors[this.segments.length % 2]);
      sprite.setDepth(5);
      this.segments.push(sprite);
    }

    while (this.segments.length > state.segments.length - 1) {
      const removed = this.segments.pop();
      removed?.destroy();
    }

    for (let index = 0; index < this.segments.length; index++) {
      const seg = state.segments[index + 1];
      if (seg) {
        this.segments[index].setPosition(seg.x, seg.y);
        const scale = Math.max(0.6, 1 - (index + 1) * 0.005);
        this.segments[index].setScale(scale);
      }
    }

    // Boost visual effect
    if (state.boosting) {
      this.headSprite.setTint(COLORS.primary);
    } else {
      this.headSprite.setTint(this.skinColors[0]);
    }
  }

  getHeadPosition(): { x: number; y: number } {
    return { x: this.headSprite.x, y: this.headSprite.y };
  }

  destroy(): void {
    this.headSprite.destroy();
    this.nameText.destroy();
    this.eyeLeft.destroy();
    this.eyeRight.destroy();
    this.pupilLeft.destroy();
    this.pupilRight.destroy();
    for (const seg of this.segments) {
      seg.destroy();
    }
    this.segments = [];
  }
}
