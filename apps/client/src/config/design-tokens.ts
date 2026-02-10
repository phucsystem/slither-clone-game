// Design tokens from UI_SPEC - Vibrant Competitive theme

export const COLORS = {
  primary: 0xff3366,
  primaryDark: 0xcc0033,
  primaryLight: 0xff6699,
  secondary: 0x00d9ff,
  accentNeon: 0x39ff14,

  success: 0x00e676,
  warning: 0xffd600,
  danger: 0xff1744,
  info: 0x00b8d4,

  bgPrimary: 0x0a0e1a,
  bgSecondary: 0x151b2e,
  bgTertiary: 0x1e2842,

  textPrimary: 0xffffff,
  textSecondary: 0xb0b8d4,
  textMuted: 0x6b7394,

  border: 0x2d3654,
  borderGlow: 0x4a5580,

  gridLine: 0x2d3654,
} as const;

export const COLORS_CSS = {
  primary: '#FF3366',
  primaryDark: '#CC0033',
  secondary: '#00D9FF',
  accentNeon: '#39FF14',
  success: '#00E676',
  warning: '#FFD600',
  danger: '#FF1744',
  bgPrimary: '#0A0E1A',
  bgSecondary: '#151B2E',
  bgTertiary: '#1E2842',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B8D4',
  textMuted: '#6B7394',
  border: '#2D3654',
} as const;

export const FOOD_COLORS: Record<string, number> = {
  white: 0xffffff,
  green: 0x00e676,
  blue: 0x00d9ff,
  gold: 0xffd600,
  rainbow: 0xff00ff,
};

export const SNAKE_SKINS: Record<string, number[]> = {
  'classic-blue': [0x00d9ff, 0x0099cc],
  'neon-green': [0x39ff14, 0x00cc00],
  'hot-pink': [0xff3366, 0xcc0033],
  'royal-purple': [0x9c27b0, 0x6a1b9a],
  'sunset-orange': [0xff6d00, 0xe65100],
};

export const FONTS = {
  heading: 'Orbitron, sans-serif',
  body: 'Rajdhani, sans-serif',
} as const;
