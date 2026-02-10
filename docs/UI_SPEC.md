# Basic Design (UI Specification)

**Project:** Multiplayer Snake Game (Slither.io Clone)
**Version:** 1.0
**Date:** 2026-02-10
**Status:** Draft (Awaiting GATE 2 Validation)
**Design Style:** Vibrant Competitive

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|-----------|---------|
| 1.0 | 2026-02-10 | Systems Analyst | Initial draft with Vibrant Competitive design system |

---

## 1. Design System

### 1.1 Design Philosophy

**Vibrant Competitive** style emphasizes:
- **High-energy esports aesthetic** with bold colors and strong contrast
- **Neon accent colors** to highlight competitive elements (leaderboards, stats)
- **Performance-focused UI** that doesn't distract from gameplay
- **Clear visual hierarchy** for quick information scanning during intense sessions
- **Accessibility** with colorblind-friendly palettes and high contrast ratios

### 1.2 Reference Sources

**Design Research:**
- Competitive gaming UI trends 2026: Real-time leaderboards, WebSocket-powered dashboards ([System Design Resources](https://systemdesign.one/leaderboard-system-design/))
- Modern .io game design: Clean overlays with minimal gameplay obstruction ([Game UI Trends](https://www.weetechsolution.com/blog/video-game-ui-ux-trends))
- HTML5 Canvas best practices: Performance-optimized rendering, DOM vs Canvas UI ([GameDev Academy](https://gamedevacademy.org/create-a-game-ui-with-the-html5-canvas/))

**Key Insights:**
- Modern competitive games blend UI seamlessly with gameplay environment
- Color-coded systems with distinct shapes ensure colorblind accessibility
- Real-time stats require WebSocket integration for instant updates
- Canvas-based UI gives better control for game loop integration

### 1.3 Color Palette

**Primary Colors (Competitive Accent)**

| Token | Hex | RGB | Usage | Contrast Ratio |
|-------|-----|-----|-------|----------------|
| `--color-primary` | `#FF3366` | rgb(255, 51, 102) | Primary actions, CTA buttons, boost UI | 4.6:1 (AA) |
| `--color-primary-dark` | `#CC0033` | rgb(204, 0, 51) | Hover states, active elements | 6.8:1 (AAA) |
| `--color-primary-light` | `#FF6699` | rgb(255, 102, 153) | Highlights, selected skins | 3.5:1 |
| `--color-secondary` | `#00D9FF` | rgb(0, 217, 255) | Secondary actions, info elements, leaderboard highlights | 5.2:1 (AA) |
| `--color-accent-neon` | `#39FF14` | rgb(57, 255, 20) | Top rank indicator, kill notifications, success states | 7.3:1 (AAA) |

**Semantic Colors**

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-success` | `#00E676` | rgb(0, 230, 118) | Victory states, positive feedback, rank up |
| `--color-warning` | `#FFD600` | rgb(255, 214, 0) | Caution, low boost energy |
| `--color-danger` | `#FF1744` | rgb(255, 23, 68) | Death, collision imminent, errors |
| `--color-info` | `#00B8D4` | rgb(0, 184, 212) | Informational messages, tooltips |

**Neutral Greys (Dark Theme Base)**

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-bg-primary` | `#0A0E1A` | rgb(10, 14, 26) | Main background, canvas background |
| `--color-bg-secondary` | `#151B2E` | rgb(21, 27, 46) | Cards, panels, modals |
| `--color-bg-tertiary` | `#1E2842` | rgb(30, 40, 66) | Input fields, inactive buttons |
| `--color-text-primary` | `#FFFFFF` | rgb(255, 255, 255) | Primary text, headings |
| `--color-text-secondary` | `#B0B8D4` | rgb(176, 184, 212) | Secondary text, descriptions |
| `--color-text-muted` | `#6B7394` | rgb(107, 115, 148) | Disabled text, placeholders |
| `--color-border` | `#2D3654` | rgb(45, 54, 84) | Borders, dividers |
| `--color-border-glow` | `#4A5580` | rgb(74, 85, 128) | Glowing borders on hover/focus |

**Gameplay Colors (Snake Skins)**

| Token | Hex | Purpose |
|-------|-----|---------|
| `--skin-default` | `#4A90E2` | Default blue snake (free) |
| `--skin-green` | `#50E3C2` | Green snake (free) |
| `--skin-orange` | `#FF9500` | Orange snake (free) |
| `--skin-purple` | `#BD10E0` | Purple snake (premium) |
| `--skin-gold` | `#FFD700` | Gold snake (premium - leaderboard top 10) |
| `--skin-fire` | Gradient: `#FF3366 → #FF9500` | Fire snake (premium) |
| `--skin-neon` | Gradient: `#39FF14 → #00D9FF` | Neon snake (premium) |
| `--skin-shadow` | `#1A1A2E` | Shadow snake (premium - stealth aesthetic) |

**Food Colors (Visual Variety)**

| Color | Hex | Rarity |
|-------|-----|--------|
| White | `#FFFFFF` | Common (60%) |
| Green | `#50E3C2` | Common (20%) |
| Blue | `#4A90E2` | Common (15%) |
| Gold | `#FFD700` | Rare (5%) - worth 2x value |

### 1.4 Typography

**Font Stack**

```css
--font-primary: 'Rajdhani', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-display: 'Orbitron', 'Rajdhani', monospace;
```

**Rationale:**
- **Rajdhani**: Bold, geometric sans-serif perfect for competitive gaming UI (Google Fonts)
- **Orbitron**: Futuristic display font for headlines and scores (esports aesthetic)
- **System fallbacks**: Ensure performance on systems without web fonts loaded

**Type Scale**

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-display` | 48px | 700 (Bold) | 1.1 | Death screen stats, leaderboard titles |
| `--text-h1` | 36px | 700 (Bold) | 1.2 | Screen titles (e.g., "Leaderboards") |
| `--text-h2` | 28px | 600 (SemiBold) | 1.3 | Section headers, player names in profile |
| `--text-h3` | 22px | 600 (SemiBold) | 1.4 | Card titles, modal headers |
| `--text-h4` | 18px | 600 (SemiBold) | 1.4 | Leaderboard column headers |
| `--text-body` | 16px | 400 (Regular) | 1.5 | Default body text, descriptions |
| `--text-small` | 14px | 400 (Regular) | 1.5 | Labels, secondary info |
| `--text-caption` | 12px | 500 (Medium) | 1.4 | Timestamps, meta info, legal text |

**Special Text Styles**

| Token | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| `--text-score` | Orbitron | 32px | 700 | Live scores, kill counts |
| `--text-rank` | Orbitron | 24px | 700 | Player rank numbers |
| `--text-mono` | Courier New, monospace | 14px | 400 | Debug info, timestamps |

### 1.5 Spacing Scale

**Base Unit:** 4px

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Icon padding, tight spacing |
| `--space-sm` | 8px | Button padding (vertical), input padding |
| `--space-md` | 16px | Card padding, section spacing |
| `--space-lg` | 24px | Panel padding, screen margins |
| `--space-xl` | 32px | Screen padding, large sections |
| `--space-2xl` | 48px | Between major UI sections |
| `--space-3xl` | 64px | Top/bottom screen padding |

### 1.6 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small buttons, input fields |
| `--radius-md` | 8px | Cards, panels, modals |
| `--radius-lg` | 12px | Large panels, overlays |
| `--radius-full` | 9999px | Circular elements (player avatars, food) |

### 1.7 Shadows & Glows

**Elevation Shadows (Dark Theme)**

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 2px 8px rgba(0, 0, 0, 0.4)` | Buttons, small cards |
| `--shadow-md` | `0 4px 16px rgba(0, 0, 0, 0.5)` | Modals, dropdown menus |
| `--shadow-lg` | `0 8px 32px rgba(0, 0, 0, 0.6)` | Overlays, important panels |

**Neon Glows (Competitive Accent)**

| Token | Value | Usage |
|-------|-------|-------|
| `--glow-primary` | `0 0 20px rgba(255, 51, 102, 0.6)` | Primary button hover, boost UI |
| `--glow-secondary` | `0 0 20px rgba(0, 217, 255, 0.6)` | Secondary highlights |
| `--glow-neon` | `0 0 30px rgba(57, 255, 20, 0.8)` | Top rank indicator, kill streaks |
| `--glow-danger` | `0 0 20px rgba(255, 23, 68, 0.7)` | Death flash, collision warning |

### 1.8 Animation Timings

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `--transition-fast` | 150ms | ease-out | Hover states, button clicks |
| `--transition-base` | 300ms | ease-in-out | Modals, overlays, screen transitions |
| `--transition-slow` | 500ms | ease-in-out | Page loads, major state changes |
| `--animation-pulse` | 2s infinite | ease-in-out | Live indicators, notifications |

### 1.9 Component Patterns

**Buttons**

```css
/* Primary Button (CTA) */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-primary);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: var(--text-body);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}
.btn-primary:hover {
  background: var(--color-primary-dark);
  box-shadow: var(--glow-primary);
  transform: translateY(-2px);
}
```

**Cards**

```css
.card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  box-shadow: var(--shadow-md);
}
```

**Inputs**

```css
.input {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  font-size: var(--text-body);
}
.input:focus {
  border-color: var(--color-primary);
  box-shadow: var(--glow-primary);
  outline: none;
}
```

### 1.10 CJX Stage Mapping

**Customer Journey Experience (CJX) stages aligned with game screens:**

| CJX Stage | Screen | User Goal | Key Metrics |
|-----------|--------|-----------|-------------|
| **Discovery** | S-01 (Lobby) | First impression, understand gameplay | Time to first click on "Play" |
| **Onboarding** | S-02 (Game) first 30 seconds | Learn controls, survive first encounter | % completing 1st session >2 min |
| **Usage** | S-02 (Game) repeated sessions | Master mechanics, improve rank | Average session length, games/day |
| **Retention** | S-03 (Death), S-01 (return) | Come back for more sessions | D1/D7/D30 retention, replay rate |
| **Expansion** | S-01 (Skin Gallery), S-04 (Leaderboards) | Engage with monetization, compete | Skin conversion %, leaderboard views |
| **Advocacy** | S-05 (Profile), Social Sharing | Share achievements, refer friends | Social shares, K-factor |

---

## 2. Screen Flow

### 2.1 High-Level Navigation

```
[App Launch]
    ↓
[S-01: Lobby] ←─────────────────────┐
    ↓                                 │
    ├─→ [Play Button] → [S-02: Game] │
    │        ↓                        │
    │    [Death Event]                │
    │        ↓                        │
    │   [S-03: Death Screen]          │
    │        ↓                        │
    │   [Play Again] ─────────────────┤
    │   [View Leaderboards] ──┐       │
    │                         ↓       │
    ├─→ [Leaderboards Link] → [S-04: Leaderboards]
    │                              ↓
    │                         [Click Player Name]
    │                              ↓
    ├─→ [Profile Icon] ──────→ [S-05: Profile]
    │                              ↓
    │                         [Back to Lobby] ──→┘
    │
    └─→ [Settings Icon] → [Settings Modal] → [Close] ──→┘
```

### 2.2 Phase-Specific Flows

**Phase 1: Core Gameplay Loop**
```
S-01 → S-02 → S-03 → (Replay) S-02
```

**Phase 2: Monetization Flow**
```
S-01 → [Skin Selector] → [Payment Modal] → [Confirmation] → S-01
S-03 → [Video Ad] → [Stats Display] → [Skin Upsell] → S-01
```

**Phase 3: Competitive Engagement**
```
S-01 → S-04 → [Select Player] → S-05 → S-01
S-02 → [Spectator Mode] → [Watch Top Player] → [Exit] → S-02
```

---

## 3. Screen Specifications

### S-01: Lobby (Pre-Game Hub)

**Purpose:** Central hub for matchmaking, customization, and navigation

**Layout:** Center-aligned with vertical stacking

**Wireframe:**
```
┌─────────────────────────────────────────────────────────┐
│  [Logo: "SNAKE.IO"]              [Profile] [Settings]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│               ┌───────────────────────┐                │
│               │   [Current Skin]      │                │
│               │   [Snake Preview]     │                │
│               └───────────────────────┘                │
│                                                         │
│        ┌─────────────────────────────────┐            │
│        │    [▶ PLAY]   <-- Primary CTA   │            │
│        └─────────────────────────────────┘            │
│                                                         │
│   ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│   │ [Skins]      │  │[Leaderboard] │  │  [Rewards]  ││
│   │  3 Owned     │  │  Your Rank   │  │  Day 3/7    ││
│   │              │  │   #1,234     │  │             ││
│   └──────────────┘  └──────────────┘  └─────────────┘│
│                                                         │
│              [Recent Stats: 12 Kills, 3 Deaths]        │
└─────────────────────────────────────────────────────────┘
```

**Elements:**

| Element | Type | Style | Interaction | FR Mapping |
|---------|------|-------|-------------|------------|
| **Logo** | Text | `--text-display`, Orbitron, neon glow | None | - |
| **Profile Icon** | Button (icon) | Circular, `--color-bg-secondary`, avatar if logged in | Click → S-05 Profile | FR-13 |
| **Settings Icon** | Button (icon) | Gear icon, `--color-text-secondary` | Click → Settings Modal | - |
| **Snake Preview** | Canvas | 200x100px, animated snake with current skin | Rotates slowly (idle animation) | FR-09 |
| **Play Button** | Button (primary) | Large (180x60px), `--btn-primary`, neon glow on hover | Click → FR-01 (Join Room) → S-02 | FR-01 |
| **Skins Card** | Card | `--card`, shows owned/total count | Click → Skin Gallery Modal | FR-09 |
| **Leaderboard Card** | Card | `--card`, shows player's current rank | Click → S-04 Leaderboards | FR-12 |
| **Rewards Card** | Card | `--card`, shows daily login streak | Click → Rewards Modal | FR-11 |
| **Recent Stats** | Text | `--text-small`, `--color-text-secondary`, inline display | None | FR-13 |

**Skin Gallery Modal (Phase 2):**
```
┌──────────────────────────────────────┐
│  Skins                     [X Close] │
├──────────────────────────────────────┤
│  Free Skins:                         │
│  [✓Blue] [✓Green] [✓Orange]         │
│                                      │
│  Premium Skins:                      │
│  [Purple]  [Gold]   [Fire]           │
│  $0.99     $1.99    $2.99            │
│                                      │
│  [Equip] or [Purchase $X.XX]         │
└──────────────────────────────────────┘
```

**Transitions:**
- **Fade-in** (300ms) on app launch
- **Scale-up animation** (150ms) on button hover
- **Slide-up modal** (300ms) for skin gallery, settings, rewards

**Responsive Behavior:**
- Min width: 1280px (desktop-first)
- Elements stack vertically below 1400px
- Font sizes scale down 10% on smaller viewports

**CJX Stage:** Discovery (first impression), Expansion (skins/rewards)

---

### S-02: Game (Real-Time Gameplay Canvas)

**Purpose:** Core multiplayer gameplay experience

**Layout:** Full-screen canvas with HUD overlays

**Wireframe:**
```
┌─────────────────────────────────────────────────────────┐
│ [Leaderboard Overlay]              [Minimap]   [⚙]    │
│  1. PlayerX - 2451                    ┌─────┐           │
│  2. You    - 2103                     │  •  │           │
│  3. PlayerY - 1987                    │ • • │           │
│  ...                                  └─────┘           │
│                                                         │
│                                                         │
│              [CANVAS - 60 FPS GAMEPLAY]                │
│               - Snake rendering                         │
│               - Food particles                          │
│               - Other players                           │
│                                                         │
│                                                         │
│                                                         │
│  [Boost UI: ██████░░░░ 60%]         [Score: 2103]     │
└─────────────────────────────────────────────────────────┘
```

**Canvas Layers (Z-Index Order):**

1. **Background Layer** (z-index: 0)
   - Dark grid pattern: `--color-bg-primary` with `--color-border` grid lines
   - Subtle noise texture (5% opacity) for depth

2. **Food Layer** (z-index: 1)
   - Small circles (8px radius), colors from Food Colors table
   - Pulsing glow animation (1.5s ease-in-out infinite)

3. **Snake Layer** (z-index: 2)
   - Snake segments: circles connected by gradients
   - Head: larger circle (20px radius), eyes for directionality
   - Body: decreasing sizes (18px → 12px for tail)
   - Current skin color applied
   - Shadow: `rgba(0,0,0,0.3)` offset by 4px

4. **Effect Layer** (z-index: 3)
   - Boost trail: particle effect with `--color-primary-light`
   - Collision sparks: burst animation on death
   - Kill notifications: "+1 KILL" text that fades up (2s animation)

5. **HUD Layer** (z-index: 10)
   - Semi-transparent overlays (DOM elements, not canvas)

**HUD Elements:**

| Element | Position | Style | Interaction | FR Mapping |
|---------|----------|-------|-------------|------------|
| **Leaderboard Overlay** | Top-left | Semi-transparent card, `background: rgba(21,27,46,0.85)`, max 10 entries | None (read-only) | FR-05 |
| **Minimap** | Top-right | 120x120px, shows player position on map, other snakes as dots | None | - |
| **Settings Gear** | Top-right corner | Icon button, opens pause menu | Click → Pause Modal | - |
| **Boost UI** | Bottom-left | Progress bar, `--color-primary` fill, `--glow-primary` when active | Spacebar or mouse hold to boost | FR-02 |
| **Score Display** | Bottom-right | Large text, Orbitron font, `--text-score`, shows current length | None | FR-05 |
| **Kill Notification** | Center (fades up) | "+1 KILL", `--color-accent-neon`, `--text-h2`, appears on collision kill | None | FR-04 |

**Boost UI Details:**
```
[⚡ Boost: ██████░░░░░░░░ 45%]
         ↑ Active: neon glow
         ↑ Low (<20%): warning color
```

**Leaderboard Overlay Format:**
```
┌───────────────────────────┐
│  🏆 LEADERBOARD           │
├───────────────────────────┤
│  1. PlayerX    2451  ← you│
│  2. PlayerY    2103       │
│  3. PlayerZ    1987       │
│  ...                      │
│ 10. PlayerQ    1234       │
└───────────────────────────┘
```

**Rendering Strategy:**

| Technique | Implementation | Rationale |
|-----------|----------------|-----------|
| **Double Buffering** | Use two canvas elements, swap on render | Prevents flickering |
| **Viewport Culling** | Only render entities within camera bounds + 200px margin | Performance optimization |
| **Object Pooling** | Reuse food/particle objects instead of creating new | Reduce GC pauses |
| **Delta Time** | Use `requestAnimationFrame` delta for smooth 60 FPS | Frame-independent physics |
| **Dirty Rectangles** | Only redraw changed regions (advanced, Phase 2 optimization) | Reduce canvas draw calls |

**Camera:**
- Follows player snake (smooth lerp)
- Zoom level: fits ~1500x1500 game units on 1920x1080 screen
- Max zoom out: 1.5x (when snake is very long)

**Transitions:**
- **Instant** entry from S-01 (no transition, gameplay starts immediately)
- **Flash red** on death (100ms) before transitioning to S-03
- **Fade-in HUD** (500ms) on first load

**Responsive Behavior:**
- Canvas scales to maintain aspect ratio (16:9 preferred)
- HUD elements reposition on smaller screens (stack vertically if <1400px width)

**CJX Stage:** Onboarding (first 30s), Usage (repeated sessions)

**FR Mapping:** FR-02, FR-03, FR-04, FR-05, FR-07, FR-14 (spectator)

---

### S-03: Death Screen (Post-Game Stats & Monetization)

**Purpose:** Show session stats, serve ads, incentivize replay or purchases

**Layout:** Center modal with stats card

**Wireframe:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│           [Blurred Game Background]                     │
│                                                         │
│        ┌─────────────────────────────┐                │
│        │   YOU DIED                  │                │
│        ├─────────────────────────────┤                │
│        │  Final Rank:  #12 / 47      │                │
│        │  Kills:       8              │                │
│        │  Max Length:  423            │                │
│        │  Time Alive:  4:32           │                │
│        │  Score:       1,847          │                │
│        └─────────────────────────────┘                │
│                                                         │
│        [VIDEO AD CONTAINER]  <-- Phase 2               │
│        [Skip Ad (5s)]                                  │
│                                                         │
│        ┌─────────────────────────────────┐            │
│        │    [▶ PLAY AGAIN]               │            │
│        └─────────────────────────────────┘            │
│                                                         │
│        [View Leaderboards] [Unlock Skins]              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Elements:**

| Element | Type | Style | Interaction | FR Mapping |
|---------|------|-------|-------------|------------|
| **Blurred Background** | Overlay | Canvas frozen frame with blur filter | None | - |
| **Death Modal** | Card (large) | `--card`, `--shadow-lg`, center-aligned | None | - |
| **"YOU DIED" Header** | Text | `--text-display`, `--color-danger`, pulsing glow | None | - |
| **Stats Grid** | Text rows | `--text-body`, key-value pairs, icons for each stat | None | FR-06 |
| **Video Ad Container** | Iframe/Video | 640x360px (16:9), Google AdSense video ad | Plays automatically (Phase 2) | FR-08 |
| **Skip Ad Button** | Button (secondary) | Small, top-right of ad, appears after 5s | Click → Skip ad | FR-08 |
| **Play Again Button** | Button (primary) | Large, `--btn-primary`, neon glow | Click → FR-01 (join new room) → S-02 | FR-01, FR-06 |
| **View Leaderboards Link** | Link (text) | `--color-secondary`, underline on hover | Click → S-04 | FR-12 |
| **Unlock Skins Link** | Link (text) | `--color-primary`, "Premium" badge | Click → Skin Gallery Modal | FR-09 |

**Stats Display Format:**
```
┌─────────────────────────────┐
│   💀 YOU DIED                │
├─────────────────────────────┤
│  🏆 Final Rank:  #12 / 47   │
│  ⚔️ Kills:       8           │
│  📏 Max Length:  423         │
│  ⏱️ Time Alive:  4:32        │
│  ⭐ Score:       1,847       │
└─────────────────────────────┘
```

**Video Ad Flow (Phase 2):**
1. Death event triggers
2. Show stats immediately (no delay)
3. Load video ad asynchronously (1-2 second delay)
4. Ad plays (5-15 seconds)
5. "Skip Ad" button appears after 5 seconds
6. User can click "Play Again" after skipping or ad completes
7. **Premium users (ad-free):** Skip steps 3-6 entirely

**Skin Upsell (Phase 2):**
- Below "Play Again" button
- Small card: "Unlock [Premium Skin Preview] for $1.99"
- Rotates between premium skins each death

**Transitions:**
- **Fade-in modal** (300ms) on death event
- **Red flash** (100ms) before modal appears
- **Instant** transition to S-02 on "Play Again" click

**Responsive Behavior:**
- Modal scales down on smaller screens (maintain padding)
- Video ad resizes to fit (maintain 16:9 aspect ratio)
- Buttons stack vertically below 1400px width

**CJX Stage:** Retention (incentivize replay), Expansion (ad monetization, skin upsell)

**FR Mapping:** FR-06 (stats), FR-08 (ads)

---

### S-04: Leaderboards (Global & Regional Rankings)

**Purpose:** Display competitive rankings to drive engagement

**Layout:** Full-width table with tabs

**Wireframe:**
```
┌─────────────────────────────────────────────────────────┐
│  [← Back]        🏆 LEADERBOARDS                        │
├─────────────────────────────────────────────────────────┤
│  [Global] [North America] [Europe] [Asia]  <-- Tabs    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───┬──────────────┬─────────┬──────────┬───────────┐│
│  │ # │ Player       │ Score   │ K/D      │ Games     ││
│  ├───┼──────────────┼─────────┼──────────┼───────────┤│
│  │ 1 │ ProGamer42   │ 12,451  │ 4.2      │ 1,234     ││
│  │ 2 │ SnakeKing    │ 11,987  │ 3.8      │ 987       ││
│  │ 3 │ You          │ 9,103   │ 2.5      │ 456   ← HL││
│  │...│              │         │          │           ││
│  │100│ Player100    │ 1,234   │ 1.1      │ 78        ││
│  └───┴──────────────┴─────────┴──────────┴───────────┘│
│                                                         │
│              [View My Profile]                          │
└─────────────────────────────────────────────────────────┘
```

**Elements:**

| Element | Type | Style | Interaction | FR Mapping |
|---------|------|-------|-------------|------------|
| **Back Button** | Button (icon) | Arrow icon, top-left | Click → S-01 | - |
| **Header** | Text | `--text-h1`, Orbitron, trophy icon | None | - |
| **Region Tabs** | Tabs | Horizontal tabs, active tab has `--color-primary` underline | Click → Switch region | FR-12 |
| **Leaderboard Table** | Table | Striped rows, hover highlight, `--card` background | None | FR-12 |
| **Rank Column** | Text | `--text-rank`, Orbitron, top 3 have gold/silver/bronze icons | None | FR-12 |
| **Player Name** | Link | `--color-text-primary`, underline on hover | Click → S-05 (player profile) | FR-13 |
| **Score Column** | Text | `--text-body`, comma-separated | None | FR-12 |
| **K/D Column** | Text | `--text-body`, color-coded (green if >2, red if <1) | None | FR-12, FR-13 |
| **Games Column** | Text | `--text-small`, muted | None | FR-13 |
| **Current Player Row** | Table row | Highlighted with `--color-bg-tertiary`, `--glow-secondary` border | None | FR-12 |
| **View My Profile Button** | Button (secondary) | Bottom center, medium size | Click → S-05 (own profile) | FR-13 |

**Table Formatting:**
- **Top 3 ranks**: Gold/silver/bronze background gradient
- **Player's own row**: Highlighted with neon glow border
- **Striped rows**: Alternate row colors (`--color-bg-secondary` / `--color-bg-primary`)
- **Hover effect**: Row brightens slightly, cursor pointer on player name

**Region Tab Behavior:**
- Active tab: underline, `--color-primary`, bold
- Inactive tabs: `--color-text-secondary`, hover brightens
- Fetch data on tab click (cached for 5 minutes)

**Pagination:**
- Show top 100 players only
- If player rank >100, show "Your Rank: #1,234" below table

**Transitions:**
- **Fade-in** (300ms) on screen load
- **Slide animation** (200ms) when switching region tabs

**Responsive Behavior:**
- Table scrolls horizontally on narrow screens (<1280px)
- Font sizes scale down 10% on smaller viewports
- Games column hidden below 1400px width

**CJX Stage:** Expansion (competitive engagement)

**FR Mapping:** FR-12 (regional leaderboards), FR-13 (player stats link)

---

### S-05: Profile (Player Stats & Achievements)

**Purpose:** Show player's performance history and owned cosmetics

**Layout:** Two-column layout (stats + session history)

**Wireframe:**
```
┌─────────────────────────────────────────────────────────┐
│  [← Back]                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────┐   ┌────────────────────────┐│
│  │  [Avatar]            │   │  STATS                 ││
│  │  Username            │   │  ────────────────────  ││
│  │  Rank: #1,234        │   │  Total Kills:  1,234   ││
│  │  Joined: Jan 2026    │   │  Total Deaths: 789     ││
│  │                      │   │  K/D Ratio:    1.56    ││
│  │  [Premium Badge]     │   │  Avg Rank:     #45     ││
│  │                      │   │  Play Time:    12h 34m ││
│  └──────────────────────┘   │  Best Score:   5,678   ││
│                              └────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┤
│  │  OWNED SKINS (5/8)                                  │
│  │  [Blue] [Green] [Orange] [Purple] [Gold]            │
│  └─────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────────┤
│  │  SESSION HISTORY (Last 20)                          │
│  ├─────────┬─────┬────────┬────────┬──────────────────┤
│  │ Date    │Rank │ Kills  │ Deaths │ Duration         │
│  ├─────────┼─────┼────────┼────────┼──────────────────┤
│  │ 2/10 3pm│ #12 │   8    │   1    │ 4:32             │
│  │ 2/10 2pm│ #5  │  15    │   1    │ 8:12             │
│  │ ...     │ ... │  ...   │  ...   │ ...              │
│  └─────────┴─────┴────────┴────────┴──────────────────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Elements:**

| Element | Type | Style | Interaction | FR Mapping |
|---------|------|-------|-------------|------------|
| **Back Button** | Button (icon) | Arrow icon, top-left | Click → S-01 or previous screen | - |
| **Avatar** | Image | Circular, 120x120px, default if no custom avatar | None (Phase 1) | E-01 |
| **Username** | Text | `--text-h2`, editable icon if own profile | Click → Edit modal (Phase 2) | E-01 |
| **Rank Display** | Text | `--text-rank`, Orbitron, with rank icon | None | FR-13, E-06 |
| **Joined Date** | Text | `--text-small`, muted | None | E-01 |
| **Premium Badge** | Badge | Small pill, `--color-primary` background, "PREMIUM" text | None (if user has ad-free) | FR-10 |
| **Stats Card** | Card | `--card`, key-value pairs with icons | None | FR-13, E-01, E-02 |
| **Owned Skins Grid** | Grid | 5 columns, skin preview circles, checkmark on owned | None | FR-09, E-01 |
| **Session History Table** | Table | Striped rows, scrollable (max 20 rows), sortable columns | Click column header → Sort | FR-13, E-02 |

**Stats Card Details:**
- Each stat has an icon (⚔️ kills, 💀 deaths, 📊 K/D, 🏆 rank, ⏱️ time, ⭐ best score)
- K/D ratio color-coded: green if >2, yellow if 1-2, red if <1
- Best score in large Orbitron font with glow effect

**Owned Skins Display:**
- Circular skin previews (60px diameter)
- Owned skins: full color, checkmark badge
- Locked skins: greyed out, lock icon, price tag on hover
- Click locked skin → Skin Gallery Modal (purchase flow)

**Session History Table:**
- Most recent sessions at top
- Date format: "MM/DD HH:mm" (relative time if <24h ago: "2 hours ago")
- Sortable by clicking column headers
- Highlight best rank in green, worst rank in red
- Pagination: "Load More" button at bottom if >20 sessions

**Transitions:**
- **Fade-in** (300ms) on screen load
- **Expand animation** (200ms) when clicking "Load More" sessions

**Responsive Behavior:**
- Two-column layout switches to single column below 1400px
- Session history table scrolls horizontally on narrow screens
- Skin grid reduces to 3 columns on smaller viewports

**CJX Stage:** Expansion (stats tracking), Advocacy (share achievements - future)

**FR Mapping:** FR-13 (player stats), FR-09 (owned skins), E-01 (player entity), E-02 (session history)

---

## 4. Design Rationale

### 4.1 Why Vibrant Competitive Style?

**Target Audience Alignment:**
- Desktop competitive gamers (18-35) expect **high-energy, esports aesthetics**
- Bold neon accents create **excitement and urgency** fitting fast-paced gameplay
- Dark theme reduces eye strain during long gaming sessions (30min+ sessions common)

**Differentiation:**
- Most .io games use **soft, minimal designs** (Agar.io, Slither.io)
- **Vibrant Competitive** positions this game as **skill-based and competitive**, not casual
- Attracts **content creators** seeking visually striking gameplay for streams

**Performance Justification:**
- Dark backgrounds = **less pixel rendering** on OLED screens (battery saving)
- High contrast = **faster visual scanning** of leaderboards/stats during gameplay
- Neon glows = **clear affordances** for interactive elements (no confusion on clickability)

### 4.2 Canvas vs DOM for HUD

**Decision:** Hybrid approach (Canvas for game, DOM for HUD)

**Rationale:**
- **Canvas for game**: Full control over 60 FPS rendering, custom particle effects, no DOM reflows
- **DOM for HUD**: Easier accessibility (screen readers), native text rendering (sharper fonts), easier styling with CSS

**Performance Trade-Off:**
- DOM overlays = minimal performance impact (<1% FPS drop)
- Alternative (all-canvas UI) = harder to maintain, worse text readability

**Reference:** [GameDev Academy: Canvas vs DOM UI](https://gamedevacademy.org/create-a-game-ui-with-the-html5-canvas/)

### 4.3 Leaderboard Update Frequency

**Decision:** 1-second throttled updates (not real-time)

**Rationale:**
- **60Hz updates** = unnecessary bandwidth (leaderboard changes slowly)
- **1-second updates** = feels "live" without performance cost
- Players focus on gameplay, not leaderboard micro-changes

**Technical Implementation:**
- Server broadcasts leaderboard delta every 1 second (not full snapshot)
- Client merges deltas with local state
- Smooth transition animation (300ms) when ranks change

**Reference:** [Real-Time Leaderboard Design](https://systemdesign.one/leaderboard-system-design/)

### 4.4 Death Screen Ad Placement

**Decision:** 5-15 second video ad AFTER showing stats (not before)

**Rationale:**
- **User frustration mitigation**: Show stats immediately (player wants closure)
- **Ad tolerance**: Players accept ads after death (natural break point)
- **Skip button after 5s**: Respects player time, increases goodwill

**Monetization Impact:**
- 100% ad serve rate on death (every death = 1 ad impression)
- Average session: 3 deaths = 3 ad impressions
- Estimated CPM: $5-10 = $0.015-0.03 per session
- 1000 DAU × 3 sessions/day = 3000 sessions = $45-90/day from ads

**Competitive Benchmark:**
- Slither.io uses same pattern (ad on death screen)
- Industry standard for .io games

**Reference:** [Slither.io Monetization](https://www.playbite.com/q/how-does-a-game-like-slither-io-make-money)

### 4.5 Mobile-First vs Desktop-First

**Decision:** Desktop-first design (16:9 aspect ratio optimized)

**Rationale:**
- Target audience = **desktop competitive gamers** (per Lean analysis)
- Mouse controls = **core mechanic** (touch controls inferior for precision)
- Phase 1 budget = limited, can't support dual UX development

**Post-MVP Consideration:**
- If analytics show >30% mobile traffic, prioritize mobile-first redesign in Phase 4
- Separate mobile app with touch-optimized controls (not responsive web)

### 4.6 Colorblind Accessibility

**Decision:** Combine color + shape for critical UI elements

**Implementation:**
- Leaderboard ranks: numbers + icons (not just color)
- K/D ratios: green/red color + up/down arrows
- Snake skins: distinct patterns (stripes, dots, gradients) + colors

**Compliance:** WCAG 2.1 AA contrast ratios (4.5:1 for body text, 3:1 for large text)

**Reference:** [Video Game UI/UX Trends 2025](https://www.weetechsolution.com/blog/video-game-ui-ux-trends) - mentions colorblind-friendly systems with distinct shapes

---

## 5. Interaction Patterns

### 5.1 Button States

| State | Visual Change | Timing |
|-------|---------------|--------|
| **Default** | Base colors, subtle shadow | - |
| **Hover** | Neon glow, brightness +10%, translateY(-2px) | 150ms ease-out |
| **Active (pressed)** | Brightness -10%, translateY(0px) | Instant |
| **Disabled** | Opacity 0.5, greyscale filter, no hover | - |
| **Loading** | Spinner icon, "..." text, pulse animation | - |

### 5.2 Modal Behavior

**Open Animation:**
1. Overlay fades in (background: `rgba(10, 14, 26, 0.9)`, 300ms)
2. Modal scales up from 0.9 to 1.0 (300ms ease-out)
3. Focus trap: Tab key cycles through modal elements only

**Close Methods:**
- Click [X] close button
- Press Escape key
- Click overlay background (optional, depends on context)

**Accessibility:**
- Focus moves to first interactive element on open
- Focus returns to trigger button on close
- ARIA labels: `role="dialog"`, `aria-modal="true"`

### 5.3 Loading States

**Initial Load (S-01 Lobby):**
1. Show logo with pulsing animation
2. "Loading..." text below logo
3. Progress bar (if assets >1MB)
4. Fade to lobby once ready

**Room Join (FR-01):**
1. "Play" button → "Joining..." with spinner
2. Transition to S-02 once WebSocket connected
3. If timeout (>5s), show error: "Room full, retrying..."

**Leaderboard Fetch (S-04):**
1. Skeleton loading state (grey boxes in table rows)
2. Fade-in actual data once loaded (stagger animation for rows)

### 5.4 Error Handling

**Network Errors:**
- Show toast notification (top-right corner)
- Red background, white text, error icon
- Auto-dismiss after 5 seconds
- "Retry" button if action failed

**Validation Errors:**
- Inline error messages (below input field)
- Red text, shake animation (100ms)
- Focus moves to first invalid field

**Critical Errors (e.g., server crash):**
- Full-screen overlay: "Connection lost. Reconnecting..."
- Auto-retry every 3 seconds (max 5 attempts)
- If all retries fail: "Server unavailable. Please try again later."

---

## 6. Accessibility Checklist

| Category | Requirement | Implementation |
|----------|-------------|----------------|
| **Keyboard Navigation** | All interactive elements accessible via Tab | Proper focus order, visible focus indicators |
| **Screen Readers** | Semantic HTML, ARIA labels for icons | `aria-label`, `role` attributes, alt text |
| **Color Contrast** | WCAG 2.1 AA compliance (4.5:1 for text) | Tested with contrast checker, dark theme helps |
| **Focus Indicators** | Visible focus rings on all interactive elements | 2px solid `--color-primary` outline on focus |
| **Text Scaling** | UI readable at 200% browser zoom | Relative units (rem, em), responsive layout |
| **Motion Reduction** | Respect `prefers-reduced-motion` CSS media query | Disable animations if user preference set |
| **Error Identification** | Clear error messages with suggested fixes | Inline validation, descriptive error text |

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| **Desktop (default)** | 1920px+ | Full layout, two-column where applicable |
| **Laptop** | 1400-1920px | Slightly tighter spacing, single column for S-05 |
| **Small Laptop** | 1280-1400px | Font sizes scale down 10%, HUD elements reposition |
| **Minimum** | 1280px | Hard minimum, below this shows "Please use larger screen" message |

**Note:** Mobile support deferred to Phase 4+ per scope decision.

---

## 8. Performance Optimizations

### 8.1 Asset Loading Strategy

| Asset Type | Loading Method | Rationale |
|------------|----------------|-----------|
| **Fonts** | Preload via `<link rel="preload">` | Prevent FOIT (flash of invisible text) |
| **Critical CSS** | Inline in `<head>` | Render lobby immediately without blocking |
| **Game Assets** | Lazy load after lobby renders | Don't block initial UI |
| **Ad Scripts** | Async, defer, load on S-03 only | Don't slow down gameplay |

### 8.2 Rendering Optimizations

| Technique | Benefit | Implementation Phase |
|-----------|---------|---------------------|
| **RequestAnimationFrame** | 60 FPS cap, battery-efficient | Phase 1 |
| **Viewport Culling** | Only render visible entities | Phase 1 |
| **Object Pooling** | Reduce GC pauses | Phase 1 |
| **Delta Compression** | Reduce bandwidth by 60-70% | Phase 2 |
| **Dirty Rectangles** | Redraw only changed regions | Phase 3 (if needed) |
| **WebGL** | Hardware-accelerated rendering | Post-MVP (if Canvas hits limits) |

### 8.3 Metrics Monitoring

**Client-Side:**
- FPS counter (hidden by default, shown with Ctrl+Shift+D)
- Network latency indicator (ping)
- Memory usage (in dev mode only)

**Server-Side:**
- Average tick time (target <16ms)
- Dropped frames per second
- Memory per room

---

## 9. Development Notes

### 9.1 Tech Stack Recommendations

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Vanilla JS + HTML5 Canvas | No framework overhead, full game loop control |
| **Build Tool** | Vite | Fast dev server, efficient bundling |
| **CSS** | CSS Modules or Styled Components | Scoped styles, design token support |
| **Linting** | ESLint + Prettier | Code consistency |

### 9.2 Design Token Export

```css
/* tokens.css - Import this in all stylesheets */
:root {
  /* Colors */
  --color-primary: #FF3366;
  --color-primary-dark: #CC0033;
  /* ... (all tokens from section 1.3-1.7) */
}
```

**Usage in JavaScript:**
```javascript
const primaryColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary');
```

### 9.3 Component Checklist (Phase 1)

- [ ] Button component (primary, secondary, disabled states)
- [ ] Card component (with shadow variants)
- [ ] Modal component (with overlay, close button)
- [ ] Input component (text, password, with validation)
- [ ] Leaderboard row component
- [ ] Canvas renderer module
- [ ] HUD overlay module

---

## 10. Future Enhancements (Post-MVP)

| Feature | Phase | UI Changes Required |
|---------|-------|---------------------|
| **Dark/Light Mode Toggle** | Phase 4 | Settings modal, additional color tokens |
| **Custom Avatars** | Phase 4 | Avatar uploader in S-05, crop/resize UI |
| **Achievements System** | Phase 4 | Achievements page, toast notifications |
| **Friends List** | Phase 5 | Social panel in S-01, friend request modals |
| **Spectator Chat** | Phase 3 | Chat overlay in S-02 spectator mode |
| **Tournament UI** | Phase 5 | Bracket visualization, prize pool display |
| **Mobile App** | Phase 4 | Complete redesign for touch (not responsive) |

---

## 🚦 GATE 2: Requirements Validation

Before proceeding to `/ipa:design`, complete this checklist:

### Design System Review
- [ ] Stakeholders reviewed and approved Vibrant Competitive style
- [ ] Color palette tested for accessibility (WCAG AA compliance)
- [ ] Typography legible at target screen sizes (1280px minimum)
- [ ] Design tokens exported to CSS variables file

### Screen Specifications Review
- [ ] All 5 screens mapped to functional requirements (FR-xx)
- [ ] Screen flows align with user journeys from Lean analysis
- [ ] HUD elements don't obstruct gameplay (S-02)
- [ ] Death screen ad placement approved by stakeholders (FR-08)

### Technical Feasibility
- [ ] Canvas rendering achievable at 60 FPS on target hardware
- [ ] Hybrid Canvas+DOM approach accepted by dev team
- [ ] WebSocket bandwidth usage within budget (<3 KB/s per player)
- [ ] Asset loading strategy won't block initial render

### Scope Confirmation
- [ ] All screens within Phase 1-3 scope (no scope creep)
- [ ] Mobile support confirmed as out-of-scope for MVP
- [ ] Desktop-first approach approved (1280px minimum width)
- [ ] Phase 2 monetization UI (ads, skins) aligned with business goals

### Unresolved Design Questions
- [ ] **Snake skin patterns**: Should premium skins have animated effects (particle trails)? → Decide in Phase 2 based on performance
- [ ] **Leaderboard update animation**: Smooth transition vs instant update? → A/B test in Phase 1
- [ ] **Death screen delay**: Show ad immediately or after 2-second delay? → User feedback in Phase 2

**⚠️ BLOCKER:** Do NOT proceed if:
- Color contrast ratios fail WCAG AA (<4.5:1 for body text)
- Canvas rendering FPS <50 on mid-tier hardware in prototypes
- Stakeholders request design changes (must update this doc first)

---

## Next Steps

1. **Stakeholder Sign-Off:** Review this document with product owner and dev team
2. **Export Design Tokens:** Create `tokens.css` with all CSS variables
3. **Run `/ipa:design`:** Generate HTML mockups for all 5 screens
4. **User Testing (GATE 3):** Test mockups with 5+ users, collect feedback
5. **Iterate if needed:** Update UI_SPEC.md based on user feedback
6. **Proceed to `/ipa:detail`:** Generate API_SPEC.md + DB_DESIGN.md

---

## References

- **Design Research**:
  - [Game UI Database](https://www.gameuidatabase.com/) - Competitive game UI examples
  - [System Design: Leaderboards](https://systemdesign.one/leaderboard-system-design/) - Real-time leaderboard architecture
  - [GameDev Academy: Canvas UI](https://gamedevacademy.org/create-a-game-ui-with-the-html5-canvas/) - Canvas vs DOM strategies
  - [Video Game UI/UX Trends 2026](https://www.weetechsolution.com/blog/video-game-ui-ux-trends) - Seamless UI integration, colorblind accessibility
  - [.io Game UI Best Practices](https://livemusicblog.com/blogs/video-gaming-blog/best-browser-io-games-2025-ultimate-guide-free-multiplayer-gaming/) - Minimal UI for gameplay focus

- **Related Documents**:
  - Lean MVP Analysis: `plans/reports/lean-260210-1555-multiplayer-snake-game-mvp.md`
  - SRD (System Requirements): `docs/SRD.md`

---

**End of Document**

---

## Approval & Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | [TBD] | ________ | __/__/__ |
| UX Designer | [TBD] | ________ | __/__/__ |
| Technical Lead | [TBD] | ________ | __/__/__ |

**Status:** ⏳ Awaiting GATE 2 Validation

**Next Command:** `/ipa:design` (after GATE 2 approval)
