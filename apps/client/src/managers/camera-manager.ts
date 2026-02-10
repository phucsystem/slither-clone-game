import Phaser from 'phaser';
import { MAP_WIDTH, MAP_HEIGHT } from '../../../shared/constants';

export class CameraManager {
  private camera: Phaser.Cameras.Scene2D.Camera;
  private targetX = 0;
  private targetY = 0;
  private lerpFactor = 0.1;

  constructor(scene: Phaser.Scene) {
    this.camera = scene.cameras.main;
    this.camera.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
  }

  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  update(): void {
    const currentX = this.camera.scrollX + this.camera.width / 2;
    const currentY = this.camera.scrollY + this.camera.height / 2;

    const newX = Phaser.Math.Linear(currentX, this.targetX, this.lerpFactor);
    const newY = Phaser.Math.Linear(currentY, this.targetY, this.lerpFactor);

    this.camera.centerOn(newX, newY);
  }

  adjustZoom(snakeLength: number): void {
    // Zoom out slightly for longer snakes
    const minZoom = 0.6;
    const maxZoom = 1.0;
    const zoomThreshold = 50;

    if (snakeLength > zoomThreshold) {
      const zoomFactor = Math.max(minZoom, maxZoom - (snakeLength - zoomThreshold) * 0.002);
      this.camera.setZoom(zoomFactor);
    } else {
      this.camera.setZoom(maxZoom);
    }
  }
}
