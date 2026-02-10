import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth-service';
import { loginLimiter, registerLimiter } from '../middleware/rate-limiter';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', registerLimiter, async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || typeof username !== 'string' || username.length < 3 || username.length > 50) {
      res.status(400).json({ error: 'Validation', message: 'Username must be 3-50 characters' });
      return;
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Validation', message: 'Valid email required' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Validation', message: 'Password must be at least 8 characters' });
      return;
    }

    const { player, token } = await AuthService.register(username, email, password);

    res.status(201).json({
      user: {
        id: player.id,
        username: player.username,
        email: player.email,
        createdAt: player.createdAt,
        ownedSkins: player.ownedSkins,
      },
      token,
    });
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ error: 'Conflict', message: 'Username or email already exists' });
      return;
    }
    console.error('[Auth] Register error:', error);
    res.status(500).json({ error: 'Internal', message: 'Registration failed' });
  }
});

// POST /api/auth/login
authRouter.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Validation', message: 'Email and password required' });
      return;
    }

    const { player, token } = await AuthService.login(email, password);

    res.json({
      user: {
        id: player.id,
        username: player.username,
        email: player.email,
        ownedSkins: player.ownedSkins,
        adFreeStatus: player.adFreeStatus,
      },
      token,
    });
  } catch (error: any) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
  }
});

// POST /api/auth/logout (stateless JWT, just acknowledge)
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});
