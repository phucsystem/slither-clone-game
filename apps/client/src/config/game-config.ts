import Phaser from 'phaser';
import { BootScene } from '../scenes/boot-scene';
import { LobbyScene } from '../scenes/lobby-scene';
import { GameScene } from '../scenes/game-scene';
import { DeathScene } from '../scenes/death-scene';
import { COLORS } from './design-tokens';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1920,
  height: 1080,
  backgroundColor: COLORS.bgPrimary,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, LobbyScene, GameScene, DeathScene],
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
};
