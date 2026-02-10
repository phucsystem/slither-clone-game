import Phaser from 'phaser';
import { FOOD_COLORS } from '../config/design-tokens';
import type { FoodItem } from '../../../shared/types';

export class FoodPool {
  private scene: Phaser.Scene;
  private sprites = new Map<string, Phaser.GameObjects.Image>();
  private glows = new Map<string, Phaser.GameObjects.Arc>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  updateFromState(foodItems: FoodItem[]): void {
    const currentIds = new Set<string>();

    for (const item of foodItems) {
      currentIds.add(item.id);

      let sprite = this.sprites.get(item.id);
      if (!sprite) {
        const isBonus = item.color === 'rainbow';
        const tintColor = FOOD_COLORS[item.color] || 0xffffff;

        // Neon glow circle behind food
        const glowRadius = isBonus ? 24 : 12;
        const glowAlpha = isBonus ? 0.4 : 0.2;
        const glow = this.scene.add.circle(item.x, item.y, glowRadius, tintColor, glowAlpha);
        glow.setDepth(1);
        this.glows.set(item.id, glow);

        // Glow pulse animation
        this.scene.tweens.add({
          targets: glow,
          alpha: { from: glowAlpha, to: glowAlpha * 2.5 },
          scaleX: { from: 1, to: isBonus ? 1.4 : 1.2 },
          scaleY: { from: 1, to: isBonus ? 1.4 : 1.2 },
          duration: isBonus ? 800 : 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        // Food sprite
        sprite = this.scene.add.image(item.x, item.y, 'food');
        sprite.setTint(tintColor);
        sprite.setDepth(2);
        sprite.setScale(item.radius / 8);
        this.sprites.set(item.id, sprite);

        // Food pulse tween
        this.scene.tweens.add({
          targets: sprite,
          alpha: { from: 0.8, to: 1 },
          scale: { from: sprite.scaleX * 0.9, to: sprite.scaleX * 1.15 },
          duration: isBonus ? 600 : 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        // Bonus rainbow: cycle tint colors
        if (isBonus) {
          const rainbowColors = [0xff0000, 0xff8800, 0xffff00, 0x00ff44, 0x00ddff, 0xff00ff];
          let colorIndex = 0;
          this.scene.time.addEvent({
            delay: 200,
            loop: true,
            callback: () => {
              if (!sprite || !sprite.active) return;
              sprite.setTint(rainbowColors[colorIndex]);
              glow.setFillStyle(rainbowColors[colorIndex], glowAlpha);
              colorIndex = (colorIndex + 1) % rainbowColors.length;
            },
          });
        }
      }
    }

    // Remove food that's no longer in state
    for (const [foodId, sprite] of this.sprites) {
      if (!currentIds.has(foodId)) {
        sprite.destroy();
        this.sprites.delete(foodId);
        const glow = this.glows.get(foodId);
        if (glow) {
          glow.destroy();
          this.glows.delete(foodId);
        }
      }
    }
  }

  destroy(): void {
    for (const [, sprite] of this.sprites) {
      sprite.destroy();
    }
    for (const [, glow] of this.glows) {
      glow.destroy();
    }
    this.sprites.clear();
    this.glows.clear();
  }
}
