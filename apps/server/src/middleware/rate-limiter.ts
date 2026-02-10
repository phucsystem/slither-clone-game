import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_GENERAL, RATE_LIMIT_LOGIN, RATE_LIMIT_REGISTER } from '../config/constants';

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: RATE_LIMIT_GENERAL,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', message: 'Please try again later' },
});

export const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: RATE_LIMIT_LOGIN,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts', message: 'Please try again later' },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: RATE_LIMIT_REGISTER,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts', message: 'Please try again later' },
});
