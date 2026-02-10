-- Initial schema for Multiplayer Snake Game
-- Tables: players, player_sessions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Players table (E-01)
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    owned_skins TEXT[] NOT NULL DEFAULT ARRAY['classic-blue'],
    ad_free_status BOOLEAN NOT NULL DEFAULT false,
    coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
    total_kills INTEGER NOT NULL DEFAULT 0 CHECK (total_kills >= 0),
    total_deaths INTEGER NOT NULL DEFAULT 0 CHECK (total_deaths >= 0),
    total_playtime INTEGER NOT NULL DEFAULT 0 CHECK (total_playtime >= 0),
    region VARCHAR(10) NOT NULL DEFAULT 'global',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Player indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_email ON players(email);
CREATE INDEX IF NOT EXISTS idx_players_region ON players(region);
CREATE INDEX IF NOT EXISTS idx_players_created_at ON players(created_at DESC);

-- Player sessions table (E-02)
CREATE TABLE IF NOT EXISTS player_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    room_id VARCHAR(20) NOT NULL,
    kills INTEGER NOT NULL DEFAULT 0 CHECK (kills >= 0),
    deaths INTEGER NOT NULL DEFAULT 0 CHECK (deaths >= 0),
    rank INTEGER NOT NULL CHECK (rank >= 1),
    max_length INTEGER NOT NULL CHECK (max_length >= 1),
    duration INTEGER NOT NULL CHECK (duration >= 0),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_player_sessions_user_id ON player_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_player_sessions_timestamp ON player_sessions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_player_sessions_user_timestamp ON player_sessions(user_id, timestamp DESC);

-- Trigger: update player aggregate stats after session insert
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE players
    SET
        total_kills = total_kills + NEW.kills,
        total_deaths = total_deaths + NEW.deaths,
        total_playtime = total_playtime + NEW.duration,
        updated_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_player_stats
AFTER INSERT ON player_sessions
FOR EACH ROW
EXECUTE FUNCTION update_player_stats();
