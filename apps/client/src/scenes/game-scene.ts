import Phaser from 'phaser';
import { COLORS, COLORS_CSS, FONTS } from '../config/design-tokens';
import { MAP_WIDTH, MAP_HEIGHT } from '../../../shared/constants';
import { NetworkManager } from '../managers/network-manager';
import { InputManager } from '../managers/input-manager';
import { CameraManager } from '../managers/camera-manager';
import { Interpolator } from '../physics/interpolator';
import { PredictionEngine } from '../physics/prediction-engine';
import { Snake } from '../entities/snake';
import { FoodPool } from '../entities/food';
import type { GameState, SnakeState, LeaderboardEntry, PlayerDeathPayload } from '../../../shared/types';

interface SceneData {
  playerId: string;
  roomId: string;
  username: string;
  spawnPosition: { x: number; y: number };
}

export class GameScene extends Phaser.Scene {
  private network!: NetworkManager;
  private inputManager!: InputManager;
  private cameraManager!: CameraManager;
  private interpolator!: Interpolator;
  private predictionEngine!: PredictionEngine;
  private foodPool!: FoodPool;

  private snakeEntities = new Map<string, Snake>();
  private localPlayerId = '';
  private localSnakeState: SnakeState | null = null;

  // HUD elements
  private leaderboardDiv!: HTMLDivElement;
  private scoreText!: Phaser.GameObjects.Text;
  private boostBar!: Phaser.GameObjects.Graphics;
  private minimapCanvas!: HTMLCanvasElement;
  private killNotification!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: SceneData): void {
    this.localPlayerId = data.playerId;
  }

  create(data: SceneData): void {
    this.network = NetworkManager.getInstance();
    this.inputManager = new InputManager(this);
    this.cameraManager = new CameraManager(this);
    this.interpolator = new Interpolator();
    this.predictionEngine = new PredictionEngine();
    this.foodPool = new FoodPool(this);

    // Draw background grid
    this.drawBackground();

    // HUD
    this.createHUD();

    // Network events
    this.network.on('game-state', this.handleGameState, this);
    this.network.on('player-death', this.handleDeath, this);
    this.network.on('player-left', this.handlePlayerLeft, this);
    this.network.on('disconnected', this.handleDisconnect, this);

    // Set initial camera position
    this.cameraManager.setTarget(data.spawnPosition.x, data.spawnPosition.y);
  }

  update(): void {
    // Process input
    if (this.localSnakeState) {
      this.inputManager.setSnakeHeadPosition(
        this.localSnakeState.segments[0].x,
        this.localSnakeState.segments[0].y
      );
    }
    this.inputManager.update();

    // Send input to server
    const input = this.inputManager.getInput();
    this.network.sendInput(input);

    // Client-side prediction for local snake
    if (this.localSnakeState) {
      this.localSnakeState = this.predictionEngine.applyInput(this.localSnakeState, input);
      const localEntity = this.snakeEntities.get(this.localPlayerId);
      if (localEntity) {
        localEntity.updateFromState(this.localSnakeState);
        const headPos = localEntity.getHeadPosition();
        this.cameraManager.setTarget(headPos.x, headPos.y);
        this.cameraManager.adjustZoom(this.localSnakeState.length);
      }
    }

    this.cameraManager.update();
    this.updateBoostBar();
    this.updateMinimap();
  }

  private handleGameState(state: GameState): void {
    const currentSnakeIds = new Set<string>();

    for (const snakeState of state.snakes) {
      currentSnakeIds.add(snakeState.playerId);

      if (snakeState.playerId === this.localPlayerId) {
        // Reconcile with server for local snake
        this.localSnakeState = this.predictionEngine.reconcile(snakeState, state.tick);
      } else {
        // Interpolate remote snakes
        this.interpolator.updateTarget(snakeState.playerId, snakeState);
        const interpolated = this.interpolator.getInterpolated(snakeState.playerId);
        const displayState = interpolated || snakeState;

        let entity = this.snakeEntities.get(snakeState.playerId);
        if (!entity) {
          entity = new Snake(this, displayState, false);
          this.snakeEntities.set(snakeState.playerId, entity);
        }
        entity.updateFromState(displayState);
      }
    }

    // Ensure local snake entity exists
    if (this.localSnakeState && !this.snakeEntities.has(this.localPlayerId)) {
      const entity = new Snake(this, this.localSnakeState, true);
      this.snakeEntities.set(this.localPlayerId, entity);
    }

    // Remove snakes that are no longer in state
    for (const [snakeId, entity] of this.snakeEntities) {
      if (!currentSnakeIds.has(snakeId) && snakeId !== this.localPlayerId) {
        entity.destroy();
        this.snakeEntities.delete(snakeId);
        this.interpolator.removePlayer(snakeId);
      }
    }

    // Update food
    this.foodPool.updateFromState(state.food);

    // Update leaderboard HUD
    this.updateLeaderboard(state.leaderboard);

    // Update score
    if (this.localSnakeState) {
      this.scoreText.setText(`Score: ${Math.ceil(this.localSnakeState.score)}`);
    }
  }

  private handleDeath(payload: PlayerDeathPayload): void {
    // Red flash
    this.cameras.main.flash(100, 255, 0, 0);

    // Cleanup
    this.cleanup();

    this.time.delayedCall(300, () => {
      this.scene.start('DeathScene', { stats: payload.stats });
    });
  }

  private handlePlayerLeft(data: { playerId: string }): void {
    const entity = this.snakeEntities.get(data.playerId);
    if (entity) {
      entity.destroy();
      this.snakeEntities.delete(data.playerId);
    }
    this.interpolator.removePlayer(data.playerId);
  }

  private handleDisconnect(): void {
    this.cleanup();
    this.scene.start('LobbyScene');
  }

  private drawBackground(): void {
    const graphics = this.add.graphics();

    // Base background
    graphics.fillStyle(COLORS.bgPrimary, 1);
    graphics.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Grid lines
    graphics.lineStyle(1, COLORS.gridLine, 0.3);
    const gridSpacing = 50;

    for (let x = 0; x <= MAP_WIDTH; x += gridSpacing) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, MAP_HEIGHT);
    }
    for (let y = 0; y <= MAP_HEIGHT; y += gridSpacing) {
      graphics.moveTo(0, y);
      graphics.lineTo(MAP_WIDTH, y);
    }
    graphics.strokePath();
    graphics.setDepth(0);

    // Map boundary
    const borderGfx = this.add.graphics();
    borderGfx.lineStyle(4, COLORS.danger, 0.6);
    borderGfx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    borderGfx.setDepth(1);
  }

  private createHUD(): void {
    // Leaderboard overlay (DOM)
    this.leaderboardDiv = document.createElement('div');
    this.leaderboardDiv.style.cssText = `
      position: fixed; top: 10px; left: 10px; width: 220px;
      background: rgba(21,27,46,0.85); border: 1px solid ${COLORS_CSS.border};
      border-radius: 8px; padding: 10px; font-family: ${FONTS.body};
      color: ${COLORS_CSS.textPrimary}; font-size: 14px; z-index: 100;
    `;
    this.leaderboardDiv.innerHTML = '<div style="font-family:Orbitron;font-size:16px;margin-bottom:8px;">Leaderboard</div>';
    document.body.appendChild(this.leaderboardDiv);

    // Score display
    this.scoreText = this.add.text(this.cameras.main.width - 20, this.cameras.main.height - 20, 'Score: 0', {
      fontFamily: FONTS.heading,
      fontSize: '28px',
      color: COLORS_CSS.textPrimary,
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(100);

    // Boost bar
    this.boostBar = this.add.graphics().setScrollFactor(0).setDepth(100);

    // Minimap
    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.width = 120;
    this.minimapCanvas.height = 120;
    this.minimapCanvas.style.cssText = `
      position: fixed; top: 10px; right: 10px;
      border: 1px solid ${COLORS_CSS.border}; border-radius: 4px;
      z-index: 100;
    `;
    document.body.appendChild(this.minimapCanvas);

    // Instructions overlay (fades after 10s)
    const instructionText = this.add.text(this.cameras.main.width / 2, 60,
      'Mouse to steer  |  WASD for direction  |  Click or SPACE to boost', {
      fontFamily: FONTS.body,
      fontSize: '22px',
      color: COLORS_CSS.textSecondary,
      backgroundColor: 'rgba(10,14,26,0.75)',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.time.delayedCall(10000, () => {
      this.tweens.add({
        targets: instructionText,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => instructionText.destroy(),
      });
    });

    // Kill notification
    this.killNotification = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 3, '', {
      fontFamily: FONTS.heading,
      fontSize: '36px',
      color: COLORS_CSS.accentNeon,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);
  }

  private updateLeaderboard(entries: LeaderboardEntry[]): void {
    if (!this.leaderboardDiv) return;

    let html = `<div style="font-family:Orbitron;font-size:14px;margin-bottom:6px;color:${COLORS_CSS.secondary}">Leaderboard</div>`;
    for (const entry of entries) {
      const isLocal = entry.playerId === this.localPlayerId;
      const color = isLocal ? COLORS_CSS.accentNeon : COLORS_CSS.textPrimary;
      const name = entry.username.length > 15 ? entry.username.slice(0, 15) + '...' : entry.username;
      html += `<div style="display:flex;justify-content:space-between;color:${color};padding:2px 0;">
        <span>#${entry.rank} ${name}</span><span>${Math.ceil(entry.length)}</span>
      </div>`;
    }
    this.leaderboardDiv.innerHTML = html;
  }

  private updateBoostBar(): void {
    if (!this.localSnakeState || !this.boostBar) return;

    this.boostBar.clear();
    const barWidth = 200;
    const barHeight = 12;
    const barX = 20;
    const barY = this.cameras.main.height - 30;
    const boostPercent = Math.min(1, this.localSnakeState.length / 100);

    // Background
    this.boostBar.fillStyle(COLORS.bgTertiary, 0.8);
    this.boostBar.fillRoundedRect(barX, barY, barWidth, barHeight, 4);

    // Fill
    const fillColor = this.localSnakeState.boosting ? COLORS.primary :
      boostPercent < 0.2 ? COLORS.warning : COLORS.secondary;
    this.boostBar.fillStyle(fillColor, 1);
    this.boostBar.fillRoundedRect(barX, barY, barWidth * boostPercent, barHeight, 4);
  }

  private updateMinimap(): void {
    if (!this.minimapCanvas) return;
    const ctx = this.minimapCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0A0E1A';
    ctx.fillRect(0, 0, 120, 120);

    // Draw border
    ctx.strokeStyle = '#2D3654';
    ctx.strokeRect(0, 0, 120, 120);

    const scaleX = 120 / MAP_WIDTH;
    const scaleY = 120 / MAP_HEIGHT;

    // Draw other snakes as small dots
    for (const [snakeId, entity] of this.snakeEntities) {
      const pos = entity.getHeadPosition();
      const isLocal = snakeId === this.localPlayerId;
      ctx.fillStyle = isLocal ? '#39FF14' : '#FF3366';
      ctx.beginPath();
      ctx.arc(pos.x * scaleX, pos.y * scaleY, isLocal ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  showKillNotification(): void {
    this.killNotification.setText('+1 KILL');
    this.killNotification.setAlpha(1);
    this.tweens.add({
      targets: this.killNotification,
      y: this.cameras.main.height / 3 - 30,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        this.killNotification.y = this.cameras.main.height / 3;
      },
    });
  }

  private cleanup(): void {
    this.network.off('game-state', this.handleGameState, this);
    this.network.off('player-death', this.handleDeath, this);
    this.network.off('player-left', this.handlePlayerLeft, this);
    this.network.off('disconnected', this.handleDisconnect, this);

    for (const [, entity] of this.snakeEntities) {
      entity.destroy();
    }
    this.snakeEntities.clear();
    this.foodPool.destroy();
    this.interpolator.clear();
    this.predictionEngine.clear();
    this.localSnakeState = null;

    // Remove DOM elements
    this.leaderboardDiv?.remove();
    this.minimapCanvas?.remove();
  }
}
