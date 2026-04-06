ALTER TABLE surveys
  ADD COLUMN status TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN max_responses INT,
  ADD COLUMN expires_at TIMESTAMPTZ;

ALTER TABLE surveys
  ADD CONSTRAINT surveys_status_check CHECK (status IN ('open', 'closed'));
