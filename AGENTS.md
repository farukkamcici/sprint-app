# Agent Operating Rules

---

## System Architecture

### Mobile Layer
- **Framework:** Expo (React Native) + TypeScript
- **Routing:** Expo Router
- **Server state:** TanStack Query
- **Client state:** Zustand
- **Local persistence:** React Native MMKV
- **Auth & DB:** Supabase (Auth + Postgres + RLS)

### Backend Layer
- **Database:** Supabase Postgres with RLS on all tables
- **Auth:** Supabase Auth (JWT-based)
- **AI:** Dedicated LLM Gateway service (server-side only, provider-agnostic)

### Data Flow
```
Mobile App → Supabase (Auth, CRUD, Sync)
Mobile App → LLM Gateway → LLM Provider
```

The mobile app never contacts an LLM provider directly.

---

## Hard Constraints

### Security
- No LLM provider API keys in the mobile app.
- All LLM calls go through the gateway.
- Gateway validates Supabase JWT on every request.

### Data
- RLS required on every user-facing table.
- Every row must include `user_id`.
- Offline-first for `daily_checks` and `daily_entries`.
- `daily_entries` are immutable (no edit, no delete).

### Product
- Max 3 rules per sprint.
- First sprint is always 7 days.
- Only end of Day 1 allows add/drop and target tweaks.
- Rules are locked from Day 2 onward.
- Minimal UI. No gamification. No badges. No social.
- Core flows must not depend on AI availability.

### AI
- All AI sessions are time-limited (server-enforced).
- No unlimited chat. No always-on AI.
- No hidden persistent memory.
- Provider is abstracted and pluggable.
- Token usage is logged per session.

---

## MVP Build Roadmap

### Phase 1 — Scaffold
1. Initialize Expo app with Expo Router and TypeScript.
2. Configure project structure (src/, app/, lib/, components/, stores/).
3. Set up MMKV storage.
4. Set up TanStack Query provider.
5. Set up Zustand stores skeleton.

### Phase 2 — Auth
6. Supabase project setup (dev environment).
7. Supabase Auth integration (email/password or magic link).
8. Auth state management (Zustand + secure token storage).
9. Protected route layout in Expo Router.

### Phase 3 — Data Model
10. Create Supabase tables (see docs/data-model.md).
11. Apply all RLS policies.
12. Create database indexes.
13. Supabase client setup in app (typed client).

### Phase 4 — Sprint System (Core)
14. Sprint CRUD (create, read, complete, abandon).
15. Sprint rules CRUD (max 3, position-based).
16. Day 1 calibration flow (add/drop/adjust before lock).
17. Active sprint screen with day indicator.

### Phase 5 — Daily Flow (Offline-First)
18. Daily check UI (binary toggle, numeric input).
19. MMKV write-first for daily checks.
20. Daily one-line entry UI.
21. MMKV write-first for daily entries.
22. Background sync to Supabase (push unsynced, reconcile).

### Phase 6 — Streaks & History
23. Daily streak calculation (simple text display).
24. Sprint streak (completed sprint count).
25. Sprint history list (last 3 for FREE).

### Phase 7 — AI Integration (POST-MVP)
26. LLM Gateway service scaffold.
27. Gateway endpoints (see docs/ai-contracts.md).
28. Story Session flow.
29. Sprint Planning Session flow.
30. Day 1 Calibration AI flow.
31. Sprint End Review flow.
32. Weekly Meeting flow.
33. Operational Profile management UI.

---

## Skill Preferences

Use these skills (in priority order) when generating or reviewing code:

1. **frontend-design** — Distinctive, non-generic UI. Bold aesthetic direction.
2. **vercel-react-native-skills** — RN + Expo patterns, performance, platform APIs
3. **building-native-ui** — Expo Router layouts, styling, components, navigation
4. **native-data-fetching** — TanStack Query, fetch, caching, offline, sync
5. **vercel-react-best-practices** — React performance, composition, state
6. **web-design-guidelines** — Accessibility, UX review, design audit
7. **vercel-composition-patterns** — Component decomposition, scaling patterns

---

## Design Identity

Sprint's visual language is **warm precision** — a refined instrument, not a toy.
Every screen must feel intentional, not generated. Follow these rules:

### Signature Elements
- **Amber accent bar/slash** — a 3px vertical amber bar appears before key content blocks (onboarding, login brand, empty states). This is THE brand mark in UI.
- **SprintArc** — circular progress ring is the centerpiece of the active sprint view. Always animated.
- **Amber dot** — small 8px circle used as a subtle brand presence in top bars.

### Design Rules
- **No generic layouts.** Every screen needs at least one distinctive composition choice. Avoid cookie-cutter card lists.
- **Typography creates hierarchy.** Oversized display text for hero moments, paired with restrained body text. Never use uniform sizing.
- **Dark mode is primary.** Light mode (coffee/cream/latte tones) is secondary.
- **Warm neutrals only.** Stone family (#0C0A09 → #FAFAF9). No cold grays.
- **Amber/caramel accent (#C4956A dark, #B07D4F light).** This is the brand color. Use intentionally — not everywhere, but at key moments.
- **Animations are premium.** Fade-in on slide transitions, animated arc progress, presses scale down. Never jarring.
- **Inline over navigation.** Prefer showing content inline (daily checks, entries) over pushing to separate screens.
- **No email auth in MVP.** Google-only. Apple later. Email only if app stores require it.
- **Logo placeholder.** The amber vertical bar + "Sprint" text serves as the logo until a proper one is designed.

### Anti-Patterns (Never Do)
- Generic card grids with no visual hierarchy
- System font defaults (Inter, Roboto, Arial)
- Purple gradients, neon colors, or cold-toned palettes
- Gamification elements (badges, points, leaderboards)
- Cluttered navigation with many tabs/buttons

---

## Reference Documents

| Document               | Purpose                                |
|------------------------|----------------------------------------|
| docs/product.md        | Product requirements and feature scope |
| docs/architecture.md   | System architecture overview           |
| docs/constraints.md    | All product and technical constraints  |
| docs/data-model.md     | Database schema, RLS, indexes          |
| docs/ai-contracts.md   | LLM Gateway API contracts and types    |
| docs/design-system.md  | Design tokens, components, app flow    |