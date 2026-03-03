# Data Model

All tables are Supabase-managed Postgres.
Every user-facing table includes `user_id` and enforces RLS.
All `id` columns are `uuid` with `gen_random_uuid()` default.
All timestamps are `timestamptz` defaulting to `now()`.

---

## Tables

### profiles

User profile, linked 1:1 with `auth.users`.

```sql
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  display_name text,
  tier        text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

---

### operational_profiles

Persistent AI-generated user profile (PRO only).
One per user. Editable by user.

```sql
CREATE TABLE operational_profiles (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operational_traits       jsonb NOT NULL DEFAULT '[]',
  sustainable_rule_capacity int NOT NULL DEFAULT 3,
  priority_areas           text[] NOT NULL DEFAULT '{}',
  behavioral_triggers      jsonb NOT NULL DEFAULT '[]',
  tone_preference          text NOT NULL DEFAULT 'neutral',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX idx_operational_profiles_user ON operational_profiles(user_id);

ALTER TABLE operational_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own operational profile"
  ON operational_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

### sprints

Sprint definitions.

```sql
CREATE TABLE sprints (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            text,
  category         text,
  duration_days    int NOT NULL DEFAULT 7 CHECK (duration_days IN (7, 14)),
  start_date       date NOT NULL,
  end_date         date NOT NULL,
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  calibration_done boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sprints_user ON sprints(user_id);
CREATE INDEX idx_sprints_user_status ON sprints(user_id, status);

ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sprints"
  ON sprints FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Constraints enforced at application level:**
- FREE: max 1 active sprint
- PRO: max 3 active sprints
- First sprint per user must be 7 days

---

### sprint_rules

Rules within a sprint. Max 3 per sprint.

```sql
CREATE TABLE sprint_rules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id    uuid NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        text NOT NULL,
  type         text NOT NULL CHECK (type IN ('binary', 'numeric')),
  target_value int,
  position     int NOT NULL CHECK (position BETWEEN 1 AND 3),
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sprint_id, position)
);

CREATE INDEX idx_sprint_rules_sprint ON sprint_rules(sprint_id);
CREATE INDEX idx_sprint_rules_user ON sprint_rules(user_id);

ALTER TABLE sprint_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sprint rules"
  ON sprint_rules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Application-level constraints:**
- Max 3 rules per sprint
- Rules can only be added/dropped/modified at end of Day 1 (if `calibration_done = false`)
- After calibration, rules are locked

---

### daily_checks

Daily rule completion records. One per rule per day.

```sql
CREATE TABLE daily_checks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id   uuid NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  rule_id     uuid NOT NULL REFERENCES sprint_rules(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_number  int NOT NULL CHECK (day_number >= 1),
  date        date NOT NULL,
  completed   boolean NOT NULL DEFAULT false,
  value       int,
  synced      boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rule_id, date)
);

CREATE INDEX idx_daily_checks_sprint ON daily_checks(sprint_id);
CREATE INDEX idx_daily_checks_user ON daily_checks(user_id);
CREATE INDEX idx_daily_checks_date ON daily_checks(user_id, date);
CREATE INDEX idx_daily_checks_sync ON daily_checks(user_id, synced) WHERE synced = false;

ALTER TABLE daily_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily checks"
  ON daily_checks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Offline-first:** Written to MMKV first, synced to Supabase when online.

---

### daily_entries

One-line daily entries. One per sprint day. No edit. No delete.

```sql
CREATE TABLE daily_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id   uuid NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_number  int NOT NULL CHECK (day_number >= 1),
  date        date NOT NULL,
  content     text NOT NULL,
  synced      boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sprint_id, day_number)
);

CREATE INDEX idx_daily_entries_sprint ON daily_entries(sprint_id);
CREATE INDEX idx_daily_entries_user ON daily_entries(user_id);
CREATE INDEX idx_daily_entries_sync ON daily_entries(user_id, synced) WHERE synced = false;

ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own entries"
  ON daily_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own entries"
  ON daily_entries FOR SELECT
  USING (auth.uid() = user_id);

-- No UPDATE or DELETE policies: entries are immutable
```

**Offline-first:** Written to MMKV first, synced to Supabase when online.

---

### ai_sessions

AI session records (PRO only).

```sql
CREATE TABLE ai_sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sprint_id          uuid REFERENCES sprints(id) ON DELETE SET NULL,
  type               text NOT NULL CHECK (type IN ('story', 'sprint_planning', 'calibration', 'sprint_review', 'weekly_meeting')),
  status             text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  time_limit_minutes int NOT NULL,
  started_at         timestamptz NOT NULL DEFAULT now(),
  ended_at           timestamptz,
  total_tokens       int NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_sessions_user ON ai_sessions(user_id);
CREATE INDEX idx_ai_sessions_user_status ON ai_sessions(user_id, status);

ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON ai_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Gateway can manage sessions"
  ON ai_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

### ai_session_outputs

Structured outputs from completed AI sessions.

```sql
CREATE TABLE ai_session_outputs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  output_type text NOT NULL,
  data        jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_session_outputs_session ON ai_session_outputs(session_id);
CREATE INDEX idx_ai_session_outputs_user ON ai_session_outputs(user_id);

ALTER TABLE ai_session_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own session outputs"
  ON ai_session_outputs FOR SELECT
  USING (auth.uid() = user_id);
```

---

## Relationships

```
auth.users (Supabase managed)
  └── profiles (1:1)
       ├── operational_profiles (1:1, PRO)
       ├── sprints (1:many)
       │    ├── sprint_rules (1:many, max 3)
       │    │    └── daily_checks (1:many, 1 per rule per day)
       │    └── daily_entries (1:many, 1 per day)
       ├── ai_sessions (1:many, PRO)
       │    └── ai_session_outputs (1:many)
       └── daily_checks (denormalized user_id for RLS)
```

---

## RLS Summary

| Table                  | SELECT         | INSERT         | UPDATE         | DELETE         |
|------------------------|---------------|----------------|----------------|----------------|
| profiles               | own           | own            | own            | —              |
| operational_profiles   | own           | own            | own            | own            |
| sprints                | own           | own            | own            | own            |
| sprint_rules           | own           | own            | own            | own            |
| daily_checks           | own           | own            | own            | own            |
| daily_entries          | own           | own            | —              | —              |
| ai_sessions            | own           | own            | own            | own            |
| ai_session_outputs     | own           | own            | —              | —              |

"own" = `auth.uid() = user_id` (or `auth.uid() = id` for profiles).

---

## Offline-First Tables

| Table         | Local Store | Sync Field | Sync Direction   |
|---------------|------------|------------|------------------|
| daily_checks  | MMKV       | `synced`   | Local → Supabase |
| daily_entries | MMKV       | `synced`   | Local → Supabase |

Sync strategy:
1. Write to MMKV immediately.
2. On network availability, push unsynced records to Supabase.
3. Mark `synced = true` locally after successful push.
4. On app open, pull latest from Supabase and reconcile.

---

## Sprint History Retention

| Tier | Sprint History |
|------|---------------|
| FREE | Last 3 sprints |
| PRO  | Unlimited      |

Application-level enforcement. Old sprints are soft-archived (status = 'completed'), not deleted.
