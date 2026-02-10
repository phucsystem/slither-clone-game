import Phaser from 'phaser';
import { COLORS, COLORS_CSS, FONTS, SNAKE_SKINS } from '../config/design-tokens';
import { NetworkManager } from '../managers/network-manager';

export class LobbyScene extends Phaser.Scene {
  private usernameInput!: HTMLInputElement;
  private playButton!: Phaser.GameObjects.Container;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'LobbyScene' });
  }

  create(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Background
    this.cameras.main.setBackgroundColor(COLORS.bgPrimary);

    // Title
    const title = this.add.text(centerX, centerY - 200, 'SLITHER ARENA', {
      fontFamily: FONTS.heading,
      fontSize: '64px',
      fontStyle: 'bold',
      color: COLORS_CSS.primary,
      stroke: COLORS_CSS.primaryDark,
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    // Subtitle
    this.add.text(centerX, centerY - 140, 'Eat. Grow. Dominate.', {
      fontFamily: FONTS.body,
      fontSize: '24px',
      color: COLORS_CSS.textSecondary,
    }).setOrigin(0.5);

    // Username input (DOM element)
    this.usernameInput = document.createElement('input');
    this.usernameInput.type = 'text';
    this.usernameInput.placeholder = 'Enter username...';
    this.usernameInput.maxLength = 50;
    this.usernameInput.value = localStorage.getItem('snake_username') || '';
    this.usernameInput.style.cssText = `
      position: absolute;
      width: 300px;
      padding: 12px 16px;
      font-family: ${FONTS.body};
      font-size: 18px;
      color: ${COLORS_CSS.textPrimary};
      background: ${COLORS_CSS.bgTertiary};
      border: 2px solid ${COLORS_CSS.border};
      border-radius: 8px;
      outline: none;
      text-align: center;
    `;
    this.usernameInput.addEventListener('focus', () => {
      this.usernameInput.style.borderColor = COLORS_CSS.primary;
    });
    this.usernameInput.addEventListener('blur', () => {
      this.usernameInput.style.borderColor = COLORS_CSS.border;
    });

    const inputElement = this.add.dom(centerX, centerY - 40, this.usernameInput);
    inputElement.setOrigin(0.5);

    // Play button
    this.playButton = this.createPlayButton(centerX, centerY + 60);

    // Status text
    this.statusText = this.add.text(centerX, centerY + 140, '', {
      fontFamily: FONTS.body,
      fontSize: '16px',
      color: COLORS_CSS.danger,
    }).setOrigin(0.5);

    // Author credit
    const screenHeight = this.cameras.main.height;
    this.add.text(centerX, screenHeight - 40, 'by Phil Dang  |  phucsystemlabs.com', {
      fontFamily: FONTS.body,
      fontSize: '16px',
      color: COLORS_CSS.textMuted,
    }).setOrigin(0.5);

    // Enter key to play
    this.input.keyboard!.on('keydown-ENTER', () => {
      this.handlePlay();
    });
  }

  private createPlayButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.primary, 1);
    bg.fillRoundedRect(-90, -30, 180, 60, 12);

    const text = this.add.text(0, 0, 'PLAY', {
      fontFamily: FONTS.heading,
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(180, 60);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.primaryDark, 1);
      bg.fillRoundedRect(-90, -30, 180, 60, 12);
      container.setScale(1.05);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.primary, 1);
      bg.fillRoundedRect(-90, -30, 180, 60, 12);
      container.setScale(1);
    });

    container.on('pointerdown', () => {
      this.handlePlay();
    });

    return container;
  }

  private handlePlay(): void {
    const username = this.usernameInput.value.trim() || `Player${Math.floor(Math.random() * 9999)}`;
    localStorage.setItem('snake_username', username);

    this.statusText.setText('Connecting...');
    this.playButton.disableInteractive();

    const network = NetworkManager.getInstance();
    network.connect();

    network.once('connected', () => {
      const skinKeys = Object.keys(SNAKE_SKINS);
      const randomSkin = skinKeys[Math.floor(Math.random() * skinKeys.length)];
      network.joinRoom(username, randomSkin);
    });

    network.once('room-joined', (data: any) => {
      this.scene.start('GameScene', {
        playerId: data.playerId,
        roomId: data.roomId,
        username,
        spawnPosition: data.spawnPosition,
      });
    });

    network.once('error', (data: any) => {
      this.statusText.setText(data.message || 'Connection failed');
      this.playButton.setInteractive({ useHandCursor: true });
    });

    // Timeout
    this.time.delayedCall(5000, () => {
      if (this.scene.isActive('LobbyScene')) {
        this.statusText.setText('Connection timed out. Try again.');
        this.playButton.setInteractive({ useHandCursor: true });
      }
    });
  }
}
