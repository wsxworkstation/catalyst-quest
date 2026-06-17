-- Run this once in your Supabase SQL editor to create all tables

CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  assessments JSONB DEFAULT '[]'::jsonb,
  grade_bands JSONB DEFAULT '[]'::jsonb,
  fail_grades JSONB DEFAULT '[]'::jsonb,
  xp_config JSONB DEFAULT '{}'::jsonb,
  blind_box_probabilities JSONB DEFAULT '[]'::jsonb,
  teacher_password_hash TEXT NOT NULL,
  CONSTRAINT single_row CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  form INTEGER DEFAULT 4,
  class TEXT DEFAULT '',
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  box_pity INTEGER DEFAULT 0,
  companion_stage TEXT DEFAULT 'spark',
  targets JSONB DEFAULT '{}'::jsonb,
  inventory JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scores (
  id BIGSERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  assessment TEXT NOT NULL,
  date TEXT,
  marks NUMERIC,
  max NUMERIC DEFAULT 100,
  absent BOOLEAN DEFAULT FALSE,
  UNIQUE(student_id, subject, assessment)
);

CREATE TABLE IF NOT EXISTS strategies (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  topic_hint TEXT,
  text TEXT NOT NULL,
  source TEXT
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL,
  emoji TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  student_id TEXT,
  action_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb
);

-- Index for fast activity log lookups
CREATE INDEX IF NOT EXISTS idx_activity_log_student ON activity_log(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_student ON scores(student_id);
