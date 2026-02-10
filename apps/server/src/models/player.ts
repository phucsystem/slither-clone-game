import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export interface PlayerAttributes {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  ownedSkins: string[];
  adFreeStatus: boolean;
  coins: number;
  totalKills: number;
  totalDeaths: number;
  totalPlaytime: number;
  region: string;
  updatedAt: Date;
}

export class Player extends Model<PlayerAttributes> implements PlayerAttributes {
  declare id: string;
  declare username: string;
  declare email: string;
  declare passwordHash: string;
  declare createdAt: Date;
  declare ownedSkins: string[];
  declare adFreeStatus: boolean;
  declare coins: number;
  declare totalKills: number;
  declare totalDeaths: number;
  declare totalPlaytime: number;
  declare region: string;
  declare updatedAt: Date;
}

Player.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    ownedSkins: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: ['classic-blue'],
      field: 'owned_skins',
    },
    adFreeStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'ad_free_status',
    },
    coins: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalKills: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'total_kills',
    },
    totalDeaths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'total_deaths',
    },
    totalPlaytime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'total_playtime',
    },
    region: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'global',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'players',
    timestamps: false,
  }
);
