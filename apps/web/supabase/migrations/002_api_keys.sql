CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  key_hash TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

ALTER TABLE surveys
  ALTER COLUMN result_id DROP NOT NULL,
  ADD COLUMN api_key_id TEXT REFERENCES api_keys(id) ON DELETE SET NULL;
