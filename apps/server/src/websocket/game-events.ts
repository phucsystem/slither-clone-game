import { Socket } from 'socket.io';
import { RoomManager } from '../game/room-manager';
import { WS_INPUT_RATE_LIMIT } from '../config/constants';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  JoinRoomPayload,
  PlayerInput,
} from '../../../shared/types';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function setupGameEvents(socket: GameSocket, playerId: string): void {
  let lastInputTime = 0;
  const minInputInterval = 1000 / WS_INPUT_RATE_LIMIT;

  // join-room: find/create room and spawn snake
  socket.on('join-room', (payload: JoinRoomPayload) => {
    try {
      const username = payload.username?.slice(0, 50) || `Player ${playerId.slice(0, 6)}`;
      const skinId = payload.skinId || 'classic-blue';

      const room = RoomManager.joinRoom(playerId, socket);
      const spawnPos = room.gameState.snakeManager.spawnSnake(playerId, username, skinId);

      socket.emit('room-joined', {
        roomId: room.roomId,
        playerId,
        spawnPosition: spawnPos,
      });

      // Notify other players
      socket.to(room.roomId).emit('player-joined', { playerId, username });
    } catch (error) {
      console.error(`[GameEvents] join-room error for ${playerId}:`, error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // player-input: validate and queue movement input
  socket.on('player-input', (input: PlayerInput) => {
    // Rate limit: max 60 events/s
    const now = Date.now();
    if (now - lastInputTime < minInputInterval) return;
    lastInputTime = now;

    // Validate input
    if (
      typeof input.direction !== 'number' ||
      input.direction < 0 ||
      input.direction > Math.PI * 2
    ) {
      return;
    }

    const room = RoomManager.getRoomForPlayer(playerId);
    if (!room) return;

    room.gameState.snakeManager.queueInput(playerId, {
      direction: input.direction,
      boostActive: !!input.boostActive,
      timestamp: input.timestamp || Date.now(),
      sequenceNumber: input.sequenceNumber || 0,
    });
  });

  // leave-room: gracefully exit
  socket.on('leave-room', () => {
    RoomManager.leaveRoom(playerId);
  });
}
