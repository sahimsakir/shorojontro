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
