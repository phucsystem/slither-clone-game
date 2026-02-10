import Phaser from 'phaser';
import { FOOD_COLORS } from '../config/design-tokens';
import type { FoodItem } from '../../../shared/types';

export class FoodPool {
  private scene: Phaser.Scene;
  private sprites = new Map<string, Phaser.GameObjects.Image>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  updateFromState(foodItems: FoodItem[]): void {
    const currentIds = new Set<string>();

    for (const item of foodItems) {
      currentIds.add(item.id);

      let sprite = this.sprites.get(item.id);
      if (!sprite) {
        sprite = this.scene.add.image(item.x, item.y, 'food');
        sprite.setTint(FOOD_COLORS[item.color] || 0xffffff);
        sprite.setDepth(2);
        sprite.setScale(item.radius / 8);
        this.sprites.set(item.id, sprite);

        // Pulsing glow tween
        this.scene.tweens.add({
          targets: sprite,
          alpha: { from: 0.7, to: 1 },
          scale: { from: sprite.scaleX * 0.9, to: sprite.scaleX * 1.1 },
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }

    // Remove food that's no longer in state
    for (const [foodId, sprite] of this.sprites) {
      if (!currentIds.has(foodId)) {
        sprite.destroy();
        this.sprites.delete(foodId);
      }
    }
  }

  destroy(): void {
    for (const [, sprite] of this.sprites) {
      sprite.destroy();
    }
    this.sprites.clear();
  }
}
