import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface PlayerSessionAttributes {
  id: string;
  userId: string;
  roomId: string;
  kills: number;
  deaths: number;
  rank: number;
  maxLength: number;
  duration: number;
  timestamp: Date;
}

export class PlayerSession extends Model<PlayerSessionAttributes> implements PlayerSessionAttributes {
  declare id: string;
  declare userId: string;
  declare roomId: string;
  declare kills: number;
  declare deaths: number;
  declare rank: number;
  declare maxLength: number;
  declare duration: number;
  declare timestamp: Date;
}

PlayerSession.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    roomId: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'room_id',
    },
    kills: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    deaths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    maxLength: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'max_length',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'player_sessions',
    timestamps: false,
  }
);
