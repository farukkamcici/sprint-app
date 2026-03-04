# Sprint Design System

> Warm precision. Premium instrument aesthetic.

---

## Brand Identity

**Sprint** is a personal execution system — not a habit tracker, not gamification. The design reflects this: intentional, confident, refined. Every element serves a purpose.

### Design Philosophy
- **Warm minimalism** — not cold tech, not playful
- **Precision instrument** — like a high-end watch or premium journal
- **Intentional confidence** — bold choices, no visual noise
- **Functional beauty** — clarity over decoration

### Tagline
`Execute. Don't negotiate.`

---

## Color System

### Dark Mode (Primary)

The primary experience. Warm near-black backgrounds with amber/caramel accent — like a study desk lit by warm light.

| Token | Value | Usage |
|---|---|---|
| `bg` | `#0C0A09` | Screen backgrounds |
| `bgCard` | `#1C1917` | Card surfaces |
| `bgElevated` | `#292524` | Elevated elements, inputs |
| `bgInput` | `#1C1917` | Input backgrounds |
| `text` | `#FAFAF9` | Primary text |
| `textSecondary` | `#A8A29E` | Secondary text |
| `textMuted` | `#78716C` | Tertiary/hint text |
| `primary` | `#C4956A` | Brand accent — warm amber |
| `primaryHover` | `#D4A574` | Hover/pressed accent |
| `primaryMuted` | `rgba(196,149,106,0.15)` | Subtle accent backgrounds |
| `border` | `#292524` | Default borders |
| `success` | `#86EFAC` | Success states |
| `error` | `#FCA5A5` | Error states |
| `warning` | `#FCD34D` | Warning states |

### Light Mode (Latte)

Warm cream/coffee tones. Like a premium Italian café.

| Token | Value | Usage |
|---|---|---|
| `bg` | `#FAF7F2` | Screen backgrounds |
| `bgCard` | `#FFFFFF` | Card surfaces |
| `bgElevated` | `#F3EDE6` | Elevated elements |
| `text` | `#1C1917` | Primary text (espresso) |
| `textSecondary` | `#78716C` | Secondary text |
| `primary` | `#B07D4F` | Brand accent — richer amber |
| `border` | `#E8E0D7` | Warm gray borders |
| `success` | `#22C55E` | Success states |
| `error` | `#EF4444` | Error states |

### Accent Color

The brand signature: **warm amber/caramel** (`#C4956A` dark / `#B07D4F` light).

Like polished wood, aged leather, or an espresso crema. It conveys:
- Warmth without playfulness
- Premium without coldness
- Confidence without aggression

---

## Typography

**Font: DM Sans** — geometric, warm, premium.

Clean geometric sans-serif with enough humanist character to feel warm. Not as cold as Inter, not as generic as Roboto. Distinctive without distraction.

### Scale

| Variant | Size | Weight | Tracking | Usage |
|---|---|---|---|---|
| `display` | 34 | Bold (700) | -1.0 | Hero numbers, splash |
| `h1` | 28 | Bold (700) | -0.5 | Screen titles |
| `h2` | 22 | SemiBold (600) | -0.3 | Section headers |
| `h3` | 18 | SemiBold (600) | 0 | Card titles |
| `body` | 16 | Regular (400) | 0 | Default text |
| `bodyMedium` | 16 | Medium (500) | 0 | Emphasized body |
| `bodySemibold` | 16 | SemiBold (600) | 0 | Strong body |
| `small` | 14 | Regular (400) | 0 | Secondary text |
| `smallMedium` | 14 | Medium (500) | 0 | Labels, metadata |
| `caption` | 12 | Medium (500) | 0.3 | Timestamps, hints |
| `label` | 13 | SemiBold (600) | 0.5 | Form labels, tags |
| `number` | 40 | Bold (700) | -1.5 | Day indicators, streaks |

---

## Spacing

Base unit: **4px**

| Token | Value | Usage |
|---|---|---|
| `1` | 4px | Minimal gap |
| `2` | 8px | Tight spacing |
| `3` | 12px | Item gap |
| `4` | 16px | Standard padding |
| `6` | 24px | Section padding |
| `8` | 32px | Section gap |
| `10` | 40px | Large gap |
| `16` | 64px | Screen top padding |

### Layout Constants

| Token | Value | Purpose |
|---|---|---|
| `screenPaddingHorizontal` | 24px | Screen horizontal padding |
| `inputHeight` | 48px | Standard input height |
| `buttonHeight` | 48px | Standard button height |
| `buttonHeightLg` | 52px | Large button height |
| `cardPadding` | 20px | Card internal padding |
| `checkboxSize` | 26px | Checkbox dimensions |

### Border Radius

| Token | Value |
|---|---|
| `xs` | 4px |
| `sm` | 6px |
| `md` | 10px |
| `lg` | 14px |
| `xl` | 18px |
| `full` | 9999px |

---

## Components

All components are in `src/components/ui/` and exported from `src/components/ui/index.ts`.

### Text
Themed text component with typography variants.
```tsx
<Text variant="h1">Title</Text>
<Text variant="small" secondary>Subtitle</Text>
<Text variant="caption" muted>Hint</Text>
<Text variant="body" color={colors.primary}>Custom color</Text>
```

### Button
Variants: `primary`, `secondary`, `outline`, `ghost`, `destructive`
Sizes: `sm`, `md`, `lg`
```tsx
<Button label="Start Sprint" variant="primary" size="lg" onPress={...} />
<Button label="Cancel" variant="ghost" onPress={...} />
<Button label="Abandon" variant="destructive" onPress={...} />
<Button label="Loading..." loading onPress={...} />
```

### Card
Themed surface with optional press interaction.
```tsx
<Card>
  <Text variant="bodyMedium">Content</Text>
</Card>
<Card onPress={() => navigate()} elevated>
  <Text>Pressable card</Text>
</Card>
```

### Input
Themed text input with label and error state.
```tsx
<Input label="EMAIL" placeholder="you@email.com" value={...} onChangeText={...} />
<Input error="Required" value="" />
```

### Header
Screen navigation header with back button.
```tsx
<Header title="Settings" />
<Header showBack={false} rightAction={<Avatar />} />
```

### Badge
Status indicators.
```tsx
<Badge label="Completed" variant="success" />
<Badge label="Abandoned" variant="error" />
<Badge label="Active" variant="primary" />
```

### Checkbox
Binary toggle with haptic feedback.
```tsx
<Checkbox checked={value} onToggle={() => toggle()} />
```

### Screen
Safe area wrapper with themed background.
```tsx
<Screen scroll keyboard>
  {/* scrollable, keyboard-avoiding content */}
</Screen>
<Screen padding={false}>
  {/* edge-to-edge content */}
</Screen>
```

### Avatar
Initials-based avatar.
```tsx
<Avatar name="John Doe" size="lg" />
<Avatar name="user@email.com" onPress={() => openProfile()} />
```

### SegmentedControl
Toggle between options.
```tsx
<SegmentedControl
  options={['Yes / No', 'Numeric']}
  selectedIndex={0}
  onSelect={(i) => setType(i)}
/>
```

### Divider
Horizontal separator.
```tsx
<Divider />
<Divider label="or" />
```

---

## Theme System

### Provider Setup
```tsx
// app/_layout.tsx
import { ThemeProvider } from '@/theme';

<ThemeProvider>
  <App />
</ThemeProvider>
```

### Usage in Components
```tsx
import { useTheme, useThemeColors } from '@/theme';

// Full theme access
const { theme, isDark, toggleTheme } = useTheme();

// Just colors (most common)
const colors = useThemeColors();
```

### Dark Mode (Default)
Dark mode is the primary experience. Stored in MMKV, persisted across launches.

### Theme Toggle
Available in the Profile screen. Uses MMKV for persistence.

---

## App Flow

```
App Launch
  ├── First time → Onboarding (3 slides) → Login
  ├── Not authenticated → Login
  └── Authenticated → Home
        ├── No sprint → Empty state + "Start a Sprint"
        ├── Active sprint → Sprint card → Active Sprint
        │     ├── Daily Check (rule check-in)
        │     ├── Daily Entry (one-line reflection)
        │     ├── Complete Sprint
        │     └── Abandon Sprint
        ├── History (streaks + past sprints)
        └── Profile (avatar, theme, sign out)
```

---

## File Structure

```
src/
  theme/
    colors.ts          # Color palettes (dark + light)
    typography.ts      # Font scale + families
    spacing.ts         # Spacing, radius, shadows
    theme.ts           # Theme composition
    theme-context.tsx  # React context + provider
    index.ts           # Public API
  components/
    ui/
      text.tsx           # Themed text
      button.tsx         # Button variants
      card.tsx           # Card surface
      input.tsx          # Form input
      header.tsx         # Navigation header
      badge.tsx          # Status badge
      checkbox.tsx       # Toggle checkbox
      screen.tsx         # Screen wrapper
      avatar.tsx         # Initials avatar
      segmented-control.tsx  # Option toggle
      divider.tsx        # Separator
      index.ts           # Barrel export
```

---

## Design Principles

1. **Every pixel intentional** — no decoration without purpose
2. **Warm, not cold** — amber accent, stone neutrals, cream tones
3. **Confidence through restraint** — fewer elements, bigger impact
4. **Premium touch** — haptic feedback, smooth press states
5. **Dark-first** — the primary experience is warm darkness
6. **Type-driven** — DM Sans carries the visual identity
7. **Space is a feature** — generous whitespace creates calm
