import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth-middleware';
import { Player } from '../models/player';
import { PlayerSession } from '../models/player-session';

export const userRouter = Router();

// GET /api/users/me
userRouter.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const player = await Player.findByPk(req.user!.userId);
    if (!player) {
      res.status(404).json({ error: 'NotFound', message: 'Player not found' });
      return;
    }

    res.json({
      id: player.id,
      username: player.username,
      email: player.email,
      ownedSkins: player.ownedSkins,
      adFreeStatus: player.adFreeStatus,
      coins: player.coins,
      totalKills: player.totalKills,
      totalDeaths: player.totalDeaths,
      totalPlaytime: player.totalPlaytime,
      region: player.region,
      createdAt: player.createdAt,
    });
  } catch (error) {
    console.error('[Users] Error fetching profile:', error);
    res.status(500).json({ error: 'Internal', message: 'Failed to fetch profile' });
  }
});

// PATCH /api/users/me
userRouter.patch('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== 'string' || username.length < 3 || username.length > 50) {
      res.status(400).json({ error: 'Validation', message: 'Username must be 3-50 characters' });
      return;
    }

    await Player.update({ username }, { where: { id: req.user!.userId } });
    res.json({ message: 'Profile updated' });
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ error: 'Conflict', message: 'Username already taken' });
      return;
    }
    console.error('[Users] Error updating profile:', error);
    res.status(500).json({ error: 'Internal', message: 'Failed to update profile' });
  }
});

// GET /api/users/me/sessions
userRouter.get('/me/sessions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    const sessions = await PlayerSession.findAll({
      where: { userId: req.user!.userId },
      order: [['timestamp', 'DESC']],
      limit,
      offset,
    });

    res.json({ sessions });
  } catch (error) {
    console.error('[Users] Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal', message: 'Failed to fetch sessions' });
  }
});

// GET /api/users/me/stats
userRouter.get('/me/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const player = await Player.findByPk(req.user!.userId, {
      attributes: ['totalKills', 'totalDeaths', 'totalPlaytime', 'coins'],
    });

    if (!player) {
      res.status(404).json({ error: 'NotFound', message: 'Player not found' });
      return;
    }

    res.json({
      totalKills: player.totalKills,
      totalDeaths: player.totalDeaths,
      totalPlaytime: player.totalPlaytime,
      coins: player.coins,
      kdr: player.totalDeaths > 0
        ? (player.totalKills / player.totalDeaths).toFixed(2)
        : player.totalKills.toString(),
    });
  } catch (error) {
    console.error('[Users] Error fetching stats:', error);
    res.status(500).json({ error: 'Internal', message: 'Failed to fetch stats' });
  }
});
