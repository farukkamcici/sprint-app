# Product Constraints

---

# Security Constraints

- No LLM provider keys in mobile client
- All LLM calls must go through gateway
- All database tables must enforce RLS
- Every row must contain user_id
- All AI endpoints require authenticated user
- Gateway must validate all requests

---

# Privacy Constraints

- Do not store raw Story Session transcripts by default
- Store structured summaries only
- Provide user ability to:
  - View profile data
  - Edit profile data
  - Delete profile
  - Reset context
- Context Vault must be transparent

---

# LLM Constraints

- AI sessions must be time-limited
- No unlimited always-on chat
- No hidden persistent memory
- LLM provider must be abstracted
- Gateway must enforce provider quotas
- Gateway must enforce provider rate limits
- Token usage must be logged per endpoint

---

# Cost Control Constraints

- Per-user rate limiting
- Time limits enforced server-side
- Token tracking required
- Hard cap for abnormal usage if needed

---

# Product Constraints

- Max 3 rules per sprint
- First sprint always 7 days
- Only Day 1 allows add/drop
- No gamification
- No badges
- No social features
- No motivational spam

System must reduce decisions, not increase them.

---

# UX Constraints

- Minimal interface
- No feature bloat
- No unnecessary analytics dashboards
- Daily sprint screen must be instant
- Core flow must not depend on AI availability