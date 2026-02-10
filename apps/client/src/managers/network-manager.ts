import { io, Socket } from 'socket.io-client';
import { RECONNECT_ATTEMPTS, RECONNECT_INTERVAL_MS } from '../../../shared/constants';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  PlayerInput,
  JoinRoomPayload,
} from '../../../shared/types';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export class NetworkManager extends Phaser.Events.EventEmitter {
  private static instance: NetworkManager;
  private socket: GameSocket | null = null;

  private constructor() {
    super();
  }

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  connect(token?: string): void {
    if (this.socket?.connected) return;

    const serverUrl = window.location.origin;

    this.socket = io(serverUrl, {
      auth: token ? { token } : {},
      reconnectionAttempts: RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_INTERVAL_MS,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.emit('disconnected', reason);
    });

    this.socket.on('game-state', (state) => {
      this.emit('game-state', state);
    });

    this.socket.on('player-death', (payload) => {
      this.emit('player-death', payload);
    });

    this.socket.on('room-joined', (response) => {
      this.emit('room-joined', response);
    });

    this.socket.on('player-joined', (data) => {
      this.emit('player-joined', data);
    });

    this.socket.on('player-left', (data) => {
      this.emit('player-left', data);
    });

    this.socket.on('error', (data) => {
      this.emit('error', data);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinRoom(username: string, skinId: string): void {
    const payload: JoinRoomPayload = { username, skinId };
    this.socket?.emit('join-room', payload);
  }

  sendInput(input: PlayerInput): void {
    this.socket?.volatile.emit('player-input', input);
  }

  leaveRoom(): void {
    this.socket?.emit('leave-room');
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
