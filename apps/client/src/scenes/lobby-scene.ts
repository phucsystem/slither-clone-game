import Phaser from 'phaser';
import { COLORS, COLORS_CSS, FONTS, SNAKE_SKINS } from '../config/design-tokens';
import { NetworkManager } from '../managers/network-manager';

export class LobbyScene extends Phaser.Scene {
  private usernameInput!: HTMLInputElement;
  private playButton!: Phaser.GameObjects.Container;
  private statusText!: Phaser.GameObjects.Text;
  private particles: Phaser.GameObjects.Arc[] = [];

  constructor() {
    super({ key: 'LobbyScene' });
  }

  create(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Background
    this.cameras.main.setBackgroundColor(COLORS.bgPrimary);

    // Animated floating particles
    this.createBackgroundParticles();

    // Neon glow ring behind title
    const glowRing = this.add.graphics();
    glowRing.lineStyle(2, COLORS.primary, 0.3);
    glowRing.strokeCircle(centerX, centerY - 180, 180);
    glowRing.lineStyle(1, COLORS.secondary, 0.15);
    glowRing.strokeCircle(centerX, centerY - 180, 220);
    this.tweens.add({
      targets: glowRing,
      alpha: { from: 0.4, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Title with neon glow effect
    const titleShadow = this.add.text(centerX, centerY - 200, 'SLITHER ARENA', {
      fontFamily: FONTS.heading,
      fontSize: '68px',
      fontStyle: 'bold',
      color: COLORS_CSS.primary,
    }).setOrigin(0.5).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD);

    const title = this.add.text(centerX, centerY - 200, 'SLITHER ARENA', {
      fontFamily: FONTS.heading,
      fontSize: '68px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: COLORS_CSS.primary,
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Title glow pulse
    this.tweens.add({
      targets: titleShadow,
      alpha: { from: 0.2, to: 0.5 },
      scaleX: { from: 1, to: 1.02 },
      scaleY: { from: 1, to: 1.02 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle with secondary neon color
    const subtitle = this.add.text(centerX, centerY - 130, 'Eat. Grow. Dominate.', {
      fontFamily: FONTS.body,
      fontSize: '26px',
      color: COLORS_CSS.secondary,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: subtitle,
      alpha: { from: 0.6, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    // Username input (DOM element) with neon border glow
    this.usernameInput = document.createElement('input');
    this.usernameInput.type = 'text';
    this.usernameInput.placeholder = 'Enter username...';
    this.usernameInput.maxLength = 50;
    this.usernameInput.value = localStorage.getItem('snake_username') || '';
    this.usernameInput.style.cssText = `
      position: absolute;
      width: 320px;
      padding: 14px 18px;
      font-family: ${FONTS.body};
      font-size: 20px;
      color: ${COLORS_CSS.textPrimary};
      background: rgba(30, 40, 66, 0.8);
      border: 2px solid ${COLORS_CSS.border};
      border-radius: 12px;
      outline: none;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: 0 0 10px rgba(0, 217, 255, 0.1);
    `;
    this.usernameInput.addEventListener('focus', () => {
      this.usernameInput.style.borderColor = COLORS_CSS.secondary;
      this.usernameInput.style.boxShadow = `0 0 20px rgba(0, 217, 255, 0.4), 0 0 40px rgba(0, 217, 255, 0.1)`;
    });
    this.usernameInput.addEventListener('blur', () => {
      this.usernameInput.style.borderColor = COLORS_CSS.border;
      this.usernameInput.style.boxShadow = '0 0 10px rgba(0, 217, 255, 0.1)';
    });

    const inputElement = this.add.dom(centerX, centerY - 30, this.usernameInput);
    inputElement.setOrigin(0.5);

    // Play button with neon glow
    this.playButton = this.createPlayButton(centerX, centerY + 70);

    // Status text
    this.statusText = this.add.text(centerX, centerY + 150, '', {
      fontFamily: FONTS.body,
      fontSize: '18px',
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

  private createBackgroundParticles(): void {
    const colors = [COLORS.primary, COLORS.secondary, COLORS.accentNeon, COLORS.warning];
    for (let index = 0; index < 30; index++) {
      const xPos = Math.random() * this.cameras.main.width;
      const yPos = Math.random() * this.cameras.main.height;
      const radius = 1 + Math.random() * 3;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const particle = this.add.circle(xPos, yPos, radius, color, 0.2 + Math.random() * 0.3);
      particle.setDepth(0);

      // Float animation
      this.tweens.add({
        targets: particle,
        y: yPos - 50 - Math.random() * 100,
        alpha: { from: particle.alpha, to: 0 },
        duration: 3000 + Math.random() * 4000,
        repeat: -1,
        onRepeat: () => {
          particle.x = Math.random() * this.cameras.main.width;
          particle.y = this.cameras.main.height + 20;
          particle.alpha = 0.2 + Math.random() * 0.3;
        },
      });
      this.particles.push(particle);
    }
  }

  private createPlayButton(xPos: number, yPos: number): Phaser.GameObjects.Container {
    const container = this.add.container(xPos, yPos);

    // Outer glow
    const outerGlow = this.add.graphics();
    outerGlow.fillStyle(COLORS.primary, 0.15);
    outerGlow.fillRoundedRect(-100, -38, 200, 76, 16);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.primary, 1);
    bg.fillRoundedRect(-90, -30, 180, 60, 12);

    // Neon border
    bg.lineStyle(2, 0xff6699, 0.8);
    bg.strokeRoundedRect(-90, -30, 180, 60, 12);

    const text = this.add.text(0, 0, 'PLAY', {
      fontFamily: FONTS.heading,
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    container.add([outerGlow, bg, text]);
    container.setSize(200, 76);
    container.setInteractive({ useHandCursor: true });

    // Glow pulse
    this.tweens.add({
      targets: outerGlow,
      alpha: { from: 0.5, to: 1 },
      scaleX: { from: 1, to: 1.05 },
      scaleY: { from: 1, to: 1.05 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.primaryDark, 1);
      bg.fillRoundedRect(-90, -30, 180, 60, 12);
      bg.lineStyle(2, 0xff99bb, 1);
      bg.strokeRoundedRect(-90, -30, 180, 60, 12);
      container.setScale(1.08);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.primary, 1);
      bg.fillRoundedRect(-90, -30, 180, 60, 12);
      bg.lineStyle(2, 0xff6699, 0.8);
      bg.strokeRoundedRect(-90, -30, 180, 60, 12);
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
