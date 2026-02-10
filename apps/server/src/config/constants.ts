// Server-specific constants (extends shared/constants.ts)

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
export const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
export const PORT = parseInt(process.env.PORT || '3000', 10);
export const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:8080',
  'http://localhost:80',
  'http://localhost',
];

// Rate limiting
export const RATE_LIMIT_GENERAL = 100; // requests per minute
export const RATE_LIMIT_LOGIN = 10; // per hour
export const RATE_LIMIT_REGISTER = 5; // per hour

// WebSocket input rate limit
export const WS_INPUT_RATE_LIMIT = 60; // events per second

// Password hashing
export const BCRYPT_ROUNDS = 12;
