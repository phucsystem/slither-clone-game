import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Player } from '../models/player';
import { JWT_SECRET, JWT_EXPIRY, BCRYPT_ROUNDS } from '../config/constants';

export interface TokenPayload {
  userId: string;
  username: string;
  adFree: boolean;
  ownedSkins: string[];
}

export class AuthService {
  static async register(
    username: string,
    email: string,
    password: string
  ): Promise<{ player: Player; token: string }> {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const player = await Player.create({
      username,
      email,
      passwordHash,
    } as any);

    const token = AuthService.generateToken(player);
    return { player, token };
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ player: Player; token: string }> {
    const player = await Player.findOne({ where: { email } });
    if (!player) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, player.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const token = AuthService.generateToken(player);
    return { player, token };
  }

  static generateToken(player: Player): string {
    const payload: TokenPayload = {
      userId: player.id,
      username: player.username,
      adFree: player.adFreeStatus,
      ownedSkins: player.ownedSkins,
    };

    // 7 days in seconds
    return jwt.sign(payload, JWT_SECRET, { expiresIn: 7 * 24 * 60 * 60 });
  }

  static verifyToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }
}
