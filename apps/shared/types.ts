// Shared type definitions for client and server

export interface PlayerInput {
  direction: number; // radians 0-2π
  boostActive: boolean;
  timestamp: number;
  sequenceNumber: number;
}

export interface SnakeSegment {
  x: number;
  y: number;
}

export interface SnakeState {
  playerId: string;
  username: string;
  segments: SnakeSegment[];
  direction: number;
  speed: number;
  length: number;
  skinId: string;
  boosting: boolean;
  score: number;
  kills: number;
}

export interface FoodItem {
  id: string;
  x: number;
  y: number;
  color: FoodColor;
  value: number;
  radius: number;
}

export type FoodColor = 'white' | 'green' | 'blue' | 'gold' | 'rainbow';

export interface RoomInfo {
  roomId: string;
  playerCount: number;
  maxPlayers: number;
}

export interface GameState {
  snakes: SnakeState[];
  food: FoodItem[];
  leaderboard: LeaderboardEntry[];
  tick: number;
  timestamp: number;
}

export interface LeaderboardEntry {
  playerId: string;
  username: string;
  length: number;
  kills: number;
  rank: number;
}

export interface DeathStats {
  playerId: string;
  rank: number;
  kills: number;
  maxLength: number;
  timeAlive: number;
  score: number;
  killedBy: string | null;
}

export interface PlayerProfile {
  id: string;
  username: string;
  ownedSkins: string[];
  totalKills: number;
  totalDeaths: number;
  totalPlaytime: number;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  roomId: string;
  kills: number;
  rank: number;
  maxLength: number;
  duration: number;
  timestamp: string;
}

// WebSocket event payloads
export interface JoinRoomPayload {
  username: string;
  skinId: string;
}

export interface JoinRoomResponse {
  roomId: string;
  playerId: string;
  spawnPosition: SnakeSegment;
}

export interface PlayerDeathPayload {
  stats: DeathStats;
}

// Server -> Client events
export interface ServerToClientEvents {
  'game-state': (state: GameState) => void;
  'player-death': (payload: PlayerDeathPayload) => void;
  'player-joined': (data: { playerId: string; username: string }) => void;
  'player-left': (data: { playerId: string }) => void;
  'room-joined': (response: JoinRoomResponse) => void;
  'error': (data: { message: string }) => void;
}

// Client -> Server events
export interface ClientToServerEvents {
  'join-room': (payload: JoinRoomPayload) => void;
  'player-input': (input: PlayerInput) => void;
  'leave-room': () => void;
}
