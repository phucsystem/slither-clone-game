import Phaser from 'phaser';
import { COLORS } from '../config/design-tokens';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(COLORS.bgTertiary, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 15, 320, 30);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '20px',
      color: '#FFFFFF',
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(COLORS.primary, 1);
      progressBar.fillRect(width / 2 - 155, height / 2 - 10, 310 * value, 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Generate textures programmatically (no external assets needed)
    this.createGameTextures();
  }

  create(): void {
    this.scene.start('LobbyScene');
  }

  private createGameTextures(): void {
    // Snake head texture
    const headGfx = this.make.graphics({ x: 0, y: 0 });
    headGfx.fillStyle(0xffffff, 1);
    headGfx.fillCircle(20, 20, 20);
    headGfx.generateTexture('snake-head', 40, 40);
    headGfx.destroy();

    // Snake segment texture
    const segGfx = this.make.graphics({ x: 0, y: 0 });
    segGfx.fillStyle(0xffffff, 1);
    segGfx.fillCircle(16, 16, 16);
    segGfx.generateTexture('snake-segment', 32, 32);
    segGfx.destroy();

    // Food texture
    const foodGfx = this.make.graphics({ x: 0, y: 0 });
    foodGfx.fillStyle(0xffffff, 1);
    foodGfx.fillCircle(8, 8, 8);
    foodGfx.generateTexture('food', 16, 16);
    foodGfx.destroy();
  }
}
