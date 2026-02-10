import Phaser from 'phaser';
import { gameConfig } from './config/game-config';

// Load Google Fonts
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;700&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

// Wait for fonts to load, then start game
document.fonts.ready.then(() => {
  new Phaser.Game(gameConfig);
});
