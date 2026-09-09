CREATE TABLE IF NOT EXISTS rooms (
 code TEXT PRIMARY KEY, name TEXT NOT NULL,
 private INTEGER NOT NULL CHECK (private IN (0,1)), password TEXT,
 state TEXT NOT NULL CHECK (jsonb_typeof(state::jsonb) = 'object'),
 revision INTEGER NOT NULL DEFAULT 0, updated BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rooms_public_updated ON rooms(private, updated);
CREATE TABLE IF NOT EXISTS sessions (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, created BIGINT NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0, window_start BIGINT NOT NULL DEFAULT 0
);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS last_active BIGINT;
CREATE INDEX IF NOT EXISTS idx_rooms_last_active ON rooms(last_active);
CREATE TABLE IF NOT EXISTS accounts (
 username TEXT PRIMARY KEY, player_id TEXT NOT NULL UNIQUE REFERENCES sessions(id),
 password_hash TEXT NOT NULL, salt TEXT NOT NULL, created BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS login_tokens (
 token_hash TEXT PRIMARY KEY, player_id TEXT NOT NULL REFERENCES sessions(id), expires BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_tokens_player ON login_tokens(player_id);
CREATE INDEX IF NOT EXISTS idx_login_tokens_expiry ON login_tokens(expires);
CREATE TABLE IF NOT EXISTS auth_limits (key TEXT PRIMARY KEY,attempts INTEGER NOT NULL,window_start BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS player_results (
 round_id TEXT NOT NULL, player_id TEXT NOT NULL, room_code TEXT NOT NULL,
 won INTEGER NOT NULL, bluffs INTEGER NOT NULL, challenges INTEGER NOT NULL,
 challenge_wins INTEGER NOT NULL, finished BIGINT NOT NULL,
 PRIMARY KEY (round_id,player_id)
);
CREATE INDEX IF NOT EXISTS idx_player_results_player ON player_results(player_id);
CREATE TABLE IF NOT EXISTS maintenance (name TEXT PRIMARY KEY,last_run BIGINT NOT NULL DEFAULT 0);
INSERT INTO maintenance (name) VALUES ('rooms') ON CONFLICT DO NOTHING;
