# Progress Log

## Phase 1 — Scaffold
- [x] Initialize Expo app with Expo Router and TypeScript
- [x] Configure project structure (src/, app/, lib/, components/, stores/)
- [x] Install core dependencies (TanStack Query, Zustand, MMKV, Supabase)
- [x] Set up MMKV storage singleton
- [x] Set up TanStack Query provider
- [x] Set up Zustand store skeletons (useAuthStore, useSprintStore)

## Phase 2 — Auth
- [x] Supabase project setup (dev environment)
- [x] Supabase Auth integration (email/password)
- [x] Auth state management (Zustand + secure token storage)
- [x] Protected route layout in Expo Router

## Phase 3 — Data Model
- [x] Create Supabase tables
- [x] Apply all RLS policies
- [x] Create database indexes
- [x] Supabase typed client setup in app

## Phase 4 — Sprint System (Core)
- [x] Sprint CRUD (create, read, complete, abandon)
- [x] Sprint rules CRUD (max 3, position-based)
- [x] Day 1 calibration flow (add/drop/adjust before lock)
- [x] Active sprint screen with day indicator

## Phase 5 — Daily Flow (Offline-First)
- [x] Daily check UI (binary toggle, numeric input)
- [x] MMKV write-first for daily checks
- [x] Daily one-line entry UI
- [x] MMKV write-first for daily entries
- [x] Background sync to Supabase (push unsynced, reconcile)

## Phase 6 — Streaks & History
- [x] Daily streak calculation (simple text display)
- [x] Sprint streak (completed sprint count)
- [x] Sprint history list (last 3 for FREE)

## Phase 6.1 — Revisions
- [x] Remove "abandon sprint" button from main screen — moved to ⚙ Settings modal
- [x] Remove "one line" section from main screen — converted to ✎ note button → modal
- [x] Remove "add rule" button from main screen — ⚙ Settings modal handles add/edit rules, lock, abandon, complete
- [x] Create custom AlertDialog component — no device native Alert used
- [x] Calibration banner text fixed — fits screen properly with flex layout
- [x] Replace SprintArc radial bar with horizontal progress bar — Day X / Y + thin amber fill bar
- [x] 2nd/3rd sprint flow — after abandon/complete, home resets to EmptyState with "Start a Sprint" + "View past sprints" buttons
- [x] Up to 3 simultaneous active sprints — sprint-service limit raised from 1 → 3, getActiveSprints() added
- [x] Swipeable looping sprint carousel on home — horizontal FlatList with [last, ...all, first] wrap + pagination dots
- [x] Settings (⚙) and note (✎) buttons moved into each sprint tile header — clearly belongs to that sprint
- [x] Daily note redesigned as inline NoteRow at bottom of rules — time-sensitive: amber highlight after 18:00 with "How was today?" prompt

- [x] Lucide React Native icons — all emoji icons replaced (Pencil, SettingsIcon, X, ArrowRight, Plus, ChevronRight)
- [x] Sprint carousel now shows a tab bar at top with sprint titles — much more discoverable than bottom dots
- [] today's note kısmı klavyenin üstünde oluşuyor fakat üzerine dokunuca klavye yapanıyor ve titriyor aşağı iniyor baya glistch oluyor not input componenti, fixle onu
- [] Font değiştir
- []


## Phase 7 — AI Integration (POST-MVP)
- [ ] LLM Gateway service scaffold
- [ ] Gateway endpoints
- [ ] Story Session flow
- [ ] Sprint Planning Session flow
- [ ] Day 1 Calibration AI flow
- [ ] Sprint End Review flow
- [ ] Weekly Meeting flow
- [ ] Operational Profile management UI
