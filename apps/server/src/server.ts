import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { PORT, CORS_ORIGINS } from './config/constants';
import { authRouter } from './routes/auth-routes';
import { roomRouter } from './routes/room-routes';
import { userRouter } from './routes/user-routes';
import { setupSocketHandler } from './websocket/socket-handler';
import { generalLimiter } from './middleware/rate-limiter';
import type { ClientToServerEvents, ServerToClientEvents } from '../../shared/types';

const app = express();
const server = http.createServer(app);

const socketServer = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Middleware
app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json());
app.use(generalLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// REST routes
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/users', userRouter);

// WebSocket setup
setupSocketHandler(socketServer);

// Start server
async function start(): Promise<void> {
  try {
    await connectDatabase();
    await connectRedis();

    server.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

start();

export { app, server, socketServer };
