# System Architecture

---

# Mobile Layer

- Expo (React Native)
- TypeScript
- Expo Router
- TanStack Query
- Zustand
- React Native MMKV

Requirements:
- Daily sprint actions must work offline
- Background sync enabled
- No direct LLM provider calls from mobile

---

# Backend Layer

- Supabase
- Postgres
- Row Level Security mandatory
- Supabase Auth
- Supabase Storage if needed

All user tables must:
- Include user_id
- Enforce RLS
- Be scoped per authenticated user

---

# LLM Gateway

A dedicated LLM gateway service must be implemented.

Responsibilities:
- Handle all LLM provider calls
- Enforce time limits
- Apply per-user rate limiting
- Track token usage
- Validate authenticated user identity
- Return structured typed responses
- Abstract provider implementation

The mobile app must never call an LLM provider directly.

LLM provider must be pluggable.
Provider can be swapped without mobile changes.

---

# AI Context Architecture

Two-layer memory model:

## Layer 1: Persistent Profile

- Operational traits
- Sustainable rule capacity
- Priority areas
- Behavioral triggers
- Tone preferences

Editable and visible by user.

---

## Layer 2: Sprint Context

- Active sprint rules
- Daily one-line entries
- Completion rates
- Calibration decisions

Archived after sprint completion.

---

# Environment Separation

- Separate dev and production environments
- Separate Supabase projects
- Separate LLM provider API keys
- Separate gateway deployments

Never mix environments.