import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthService } from '../services/auth-service';
import { RoomManager } from '../game/room-manager';
import { setupGameEvents } from './game-events';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Map socket.id -> playerId
const socketPlayerMap = new Map<string, string>();

export function setupSocketHandler(
  server: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
): void {
  RoomManager.init(server);

  server.on('connection', (socket: GameSocket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Try to authenticate (optional for guest play)
    let playerId = `guest-${socket.id.slice(0, 8)}`;
    const token = socket.handshake.auth?.token as string | undefined;

    if (token) {
      try {
        const payload = AuthService.verifyToken(token);
        playerId = payload.userId;
      } catch {
        // Continue as guest if token invalid
        console.log(`[Socket] Invalid token for ${socket.id}, continuing as guest`);
      }
    }

    socketPlayerMap.set(socket.id, playerId);

    // Setup game event handlers
    setupGameEvents(socket, playerId);

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id} (${playerId})`);
      RoomManager.leaveRoom(playerId);
      socketPlayerMap.delete(socket.id);
    });
  });
}

export function getPlayerIdForSocket(socketId: string): string | undefined {
  return socketPlayerMap.get(socketId);
}
