// Shared constants for client and server

export const MAP_WIDTH = 5000;
export const MAP_HEIGHT = 5000;
export const MAX_PLAYERS_PER_ROOM = 50;

// Tick rates
export const SERVER_TICK_RATE = 60; // Hz
export const CLIENT_UPDATE_RATE = 20; // Hz (state broadcast)
export const TICK_INTERVAL_MS = 1000 / SERVER_TICK_RATE;
export const BROADCAST_EVERY_N_TICKS = SERVER_TICK_RATE / CLIENT_UPDATE_RATE; // every 3rd tick

// Snake physics
export const BASE_SPEED = 2.5;
export const BOOST_SPEED = 5.0;
export const BOOST_MASS_COST_PER_TICK = 1;
export const INITIAL_SNAKE_LENGTH = 10;
export const SNAKE_HEAD_RADIUS = 20;
export const SNAKE_SEGMENT_SPACING = 12;
export const MIN_BOOST_LENGTH = 5; // minimum length to allow boosting

// Food
export const FOOD_RADIUS = 8;
export const MIN_FOOD_PER_ROOM = 500;
export const MAX_FOOD_PER_ROOM = 800;
export const FOOD_RESPAWN_MIN_MS = 1000;
export const FOOD_RESPAWN_MAX_MS = 3000;

// Food color weights (must sum to 100)
export const FOOD_COLOR_WEIGHTS = {
  white: 60,
  green: 20,
  blue: 15,
  gold: 5,
} as const;

// Food values per color
export const FOOD_VALUES: Record<string, number> = {
  white: 1,
  green: 2,
  blue: 3,
  gold: 5,
  rainbow: 25,
};

// Bonus food config
export const BONUS_FOOD_RADIUS = 16;
export const BONUS_FOOD_SPAWN_INTERVAL_MS = 15000; // every 15s
export const MAX_BONUS_FOOD = 5;

// Network
export const INTERPOLATION_LERP = 0.12;
export const EXTRAPOLATION_THRESHOLD_MS = 100;
export const RECONNECT_ATTEMPTS = 3;
export const RECONNECT_INTERVAL_MS = 3000;

// Leaderboard
export const LEADERBOARD_SIZE = 10;
export const LEADERBOARD_UPDATE_RATE_HZ = 1;
