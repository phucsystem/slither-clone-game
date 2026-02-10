import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../services/auth-service';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid token' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    req.user = AuthService.verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}

// Optional auth - doesn't reject if no token, but populates user if valid
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = AuthService.verifyToken(authHeader.slice(7));
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }

  next();
}
