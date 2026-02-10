import { Router, Request, Response } from 'express';
import { RoomManager } from '../game/room-manager';

export const roomRouter = Router();

// GET /api/rooms/available
roomRouter.get('/available', (_req: Request, res: Response) => {
  try {
    const rooms = RoomManager.getAvailableRooms();
    res.json({ rooms });
  } catch (error) {
    console.error('[Rooms] Error fetching rooms:', error);
    res.status(500).json({ error: 'Internal', message: 'Failed to fetch rooms' });
  }
});
