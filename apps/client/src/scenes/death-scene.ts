import Phaser from 'phaser';
import { COLORS, COLORS_CSS, FONTS } from '../config/design-tokens';
import { NetworkManager } from '../managers/network-manager';
import type { DeathStats } from '../../../shared/types';

interface DeathSceneData {
  stats: DeathStats;
}

export class DeathScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DeathScene' });
  }

  create(data: DeathSceneData): void {
    const { stats } = data;
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Semi-transparent dark overlay
    this.cameras.main.setBackgroundColor('rgba(10, 14, 26, 0.9)');

    // "YOU DIED" header
    const deathText = this.add.text(centerX, centerY - 180, 'YOU DIED', {
      fontFamily: FONTS.heading,
      fontSize: '56px',
      fontStyle: 'bold',
      color: COLORS_CSS.danger,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Pulsing glow
    this.tweens.add({
      targets: deathText,
      alpha: { from: 0.8, to: 1 },
      scale: { from: 0.98, to: 1.02 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Killed by
    if (stats.killedBy) {
      this.add.text(centerX, centerY - 120, `Killed by: ${stats.killedBy}`, {
        fontFamily: FONTS.body,
        fontSize: '20px',
        color: COLORS_CSS.textSecondary,
      }).setOrigin(0.5);
    }

    // Stats grid
    const statsData = [
      { label: 'Rank', value: `#${stats.rank}` },
      { label: 'Kills', value: `${stats.kills}` },
      { label: 'Max Length', value: `${stats.maxLength}` },
      { label: 'Time Alive', value: this.formatTime(stats.timeAlive) },
      { label: 'Score', value: `${stats.score}` },
    ];

    const startY = centerY - 60;
    statsData.forEach((stat, index) => {
      const yPos = startY + index * 40;

      this.add.text(centerX - 100, yPos, stat.label, {
        fontFamily: FONTS.body,
        fontSize: '20px',
        color: COLORS_CSS.textSecondary,
      }).setOrigin(0, 0.5);

      this.add.text(centerX + 100, yPos, stat.value, {
        fontFamily: FONTS.heading,
        fontSize: '22px',
        color: COLORS_CSS.textPrimary,
      }).setOrigin(1, 0.5);
    });

    // Play Again button
    const playAgainContainer = this.add.container(centerX, centerY + 160);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(COLORS.primary, 1);
    btnBg.fillRoundedRect(-100, -25, 200, 50, 10);

    const btnText = this.add.text(0, 0, 'PLAY AGAIN', {
      fontFamily: FONTS.heading,
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    playAgainContainer.add([btnBg, btnText]);
    playAgainContainer.setSize(200, 50);
    playAgainContainer.setInteractive({ useHandCursor: true });

    playAgainContainer.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(COLORS.primaryDark, 1);
      btnBg.fillRoundedRect(-100, -25, 200, 50, 10);
      playAgainContainer.setScale(1.05);
    });

    playAgainContainer.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(COLORS.primary, 1);
      btnBg.fillRoundedRect(-100, -25, 200, 50, 10);
      playAgainContainer.setScale(1);
    });

    playAgainContainer.on('pointerdown', () => {
      this.handlePlayAgain();
    });

    // Back to lobby link
    const lobbyText = this.add.text(centerX, centerY + 220, 'Back to Lobby', {
      fontFamily: FONTS.body,
      fontSize: '16px',
      color: COLORS_CSS.textMuted,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    lobbyText.on('pointerover', () => lobbyText.setColor(COLORS_CSS.secondary));
    lobbyText.on('pointerout', () => lobbyText.setColor(COLORS_CSS.textMuted));
    lobbyText.on('pointerdown', () => {
      NetworkManager.getInstance().leaveRoom();
      this.scene.start('LobbyScene');
    });
  }

  private handlePlayAgain(): void {
    const username = localStorage.getItem('snake_username') || 'Player';
    const network = NetworkManager.getInstance();

    if (network.isConnected()) {
      network.joinRoom(username, 'classic-blue');
      network.once('room-joined', (data: any) => {
        this.scene.start('GameScene', {
          playerId: data.playerId,
          roomId: data.roomId,
          username,
          spawnPosition: data.spawnPosition,
        });
      });
    } else {
      this.scene.start('LobbyScene');
    }
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }
}
