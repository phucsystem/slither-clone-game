# SNAKE.IO Prototypes

Production-ready HTML/CSS/JS prototypes generated from `docs/UI_SPEC.md`.

**Design Style:** Vibrant Competitive
**Version:** 1.0
**Date:** 2026-02-10

---

## Screen Index

| Screen | File | CJX Stage | Description |
|--------|------|-----------|-------------|
| **S-01** | [s01-lobby.html](s01-lobby.html) | Discovery, Expansion | Pre-game hub with customization and navigation |
| **S-02** | [s02-game.html](s02-game.html) | Onboarding, Usage | Real-time gameplay canvas with HUD overlays |
| **S-03** | [s03-death-screen.html](s03-death-screen.html) | Retention, Expansion | Post-game stats with ad placement and skin upsell |
| **S-04** | [s04-leaderboards.html](s04-leaderboards.html) | Expansion | Global and regional competitive rankings |
| **S-05** | [s05-profile.html](s05-profile.html) | Expansion, Advocacy | Player stats, owned skins, and session history |

---

## Shared Resources

| File | Description |
|------|-------------|
| [styles.css](styles.css) | Design tokens and global styles from UI_SPEC |
| [components.css](components.css) | Reusable UI components (buttons, cards, modals, tables) |
| [interactions.js](interactions.js) | CJX animations and interactive behaviors |

---

## Functional Requirements Mapping

### S-01: Lobby

| UI Element | FR Mapping | Description |
|------------|------------|-------------|
| Play Button | FR-01 | Join room and start game |
| Skins Card | FR-09 | Access skin gallery and customization |
| Leaderboard Card | FR-12 | View global/regional rankings |
| Rewards Card | FR-11 | Daily login rewards and streaks |
| Profile Icon | FR-13 | Access player profile and stats |
| Recent Stats | FR-13 | Display session performance summary |

### S-02: Game

| UI Element | FR Mapping | Description |
|------------|------------|-------------|
| Game Canvas | FR-02, FR-03 | Core gameplay rendering at 60 FPS |
| Leaderboard Overlay | FR-05 | Real-time top 10 player rankings |
| Boost UI | FR-02 | Speed boost mechanic with energy bar |
| Score Display | FR-05 | Current player length/score |
| Kill Notification | FR-04 | Visual feedback for eliminating opponents |
| Minimap | - | Overview of player positions on map |
| Spectator Mode | FR-14 | (Phase 3) Watch top players |

### S-03: Death Screen

| UI Element | FR Mapping | Description |
|------------|------------|-------------|
| Stats Display | FR-06 | Final rank, kills, length, time alive, score |
| Video Ad Container | FR-08 | Google AdSense video ads (Phase 2) |
| Play Again Button | FR-01, FR-06 | Restart game with new session |
| View Leaderboards Link | FR-12 | Navigate to leaderboard screen |
| Unlock Skins Link | FR-09 | Access premium skin purchase flow |
| Skin Upsell | FR-09 | Rotating premium skin promotions (Phase 2) |

### S-04: Leaderboards

| UI Element | FR Mapping | Description |
|------------|------------|-------------|
| Region Tabs | FR-12 | Switch between Global, North America, Europe, Asia |
| Leaderboard Table | FR-12 | Display top 100 players with rank, score, K/D, games |
| Player Name Links | FR-13 | Navigate to individual player profiles |
| Current Player Highlight | FR-12 | Visual emphasis on user's row |
| View My Profile Button | FR-13 | Quick access to own profile |

### S-05: Profile

| UI Element | FR Mapping | Description |
|------------|------------|-------------|
| Avatar & Username | E-01 | Player identity and account info |
| Premium Badge | FR-10 | Indicates ad-free subscription status |
| Stats Card | FR-13, E-01, E-02 | Total kills, deaths, K/D, avg rank, playtime, best score |
| Owned Skins Grid | FR-09, E-01 | Display owned and locked cosmetic skins |
| Session History Table | FR-13, E-02 | Last 20 game sessions with performance data |

---

## Design System Reference

All screens implement the **Vibrant Competitive** design system from `docs/UI_SPEC.md`:

### Color Palette
- **Primary:** `#FF3366` (Neon pink for CTAs and competitive elements)
- **Secondary:** `#00D9FF` (Cyan for info and highlights)
- **Accent Neon:** `#39FF14` (Bright green for top ranks and success states)
- **Background:** `#0A0E1A` (Dark base for reduced eye strain)

### Typography
- **Primary Font:** Rajdhani (geometric sans-serif for UI)
- **Display Font:** Orbitron (futuristic for scores and rankings)
- **Type Scale:** 12px (caption) → 48px (display)

### Layout System
- **Desktop-first:** Minimum width 1280px
- **Responsive breakpoints:** 1920px, 1400px, 1280px
- **Spacing base unit:** 4px (scales 4px → 64px)

---

## CJX Framework

All screens use Customer Journey Experience (CJX) animations:

- **Discovery (S-01):** Fade-in entrance, scale-up on hover
- **Onboarding (S-02):** Progressive HUD reveal, smooth camera follow
- **Usage (S-02):** Minimal UI distraction, responsive feedback
- **Retention (S-03):** Immediate stats visibility, clear replay CTA
- **Expansion (S-01, S-04, S-05):** Engagement with skins, leaderboards, profile
- **Advocacy (S-05):** Achievement display for social sharing (future)

### CJX Stage Implementation

Each HTML file includes `<body class="cjx-{stage}">` and entrance animations via `data-cjx-entrance` attribute.

---

## Technical Features

### Canvas Rendering (S-02)
- **60 FPS gameplay** with `requestAnimationFrame`
- **Grid background** with subtle texture
- **Food particles** with pulsing glow animation
- **Snake rendering** with dynamic segments and eyes
- **Camera system** with smooth lerp follow
- **Mouse controls** for snake movement

### Interactive Components
- **Modal system** with overlay, focus trap, keyboard support
- **Tab switching** with slide animation
- **Progress bars** with color-coded states
- **Button ripple effects** on click
- **Card hover animations** with elevation
- **Toast notifications** for system messages

### Accessibility
- **WCAG 2.1 AA compliance** for color contrast
- **Keyboard navigation** for all interactive elements
- **Focus indicators** with 2px primary color outline
- **ARIA labels** on icon buttons and modals
- **Semantic HTML** with proper heading hierarchy
- **Reduced motion support** via CSS media query

---

## Browser Support

Tested and optimized for:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Requirements:**
- WebSocket support (Socket.io)
- HTML5 Canvas API
- CSS Grid and Flexbox
- ES6 JavaScript

---

## File Structure

```
prototypes/
├── README.md                    # This file
├── styles.css                   # Design tokens (48 CSS variables)
├── components.css               # Reusable components (buttons, cards, modals, etc.)
├── interactions.js              # CJX animations and event handlers
├── s01-lobby.html              # Pre-game hub (Discovery)
├── s02-game.html               # Real-time gameplay (Usage)
├── s03-death-screen.html       # Post-game stats (Retention)
├── s04-leaderboards.html       # Rankings (Expansion)
└── s05-profile.html            # Player profile (Advocacy)
```

---

## Usage Instructions

### Local Development

1. **Open any HTML file directly in a browser** (no server required for prototypes)
2. **Navigate between screens** using in-app links
3. **Test interactions:**
   - Click Play button (S-01 → S-02)
   - Watch auto-death after 30s (S-02 → S-03)
   - Click Play Again (S-03 → S-02)
   - View Leaderboards (S-01/S-03 → S-04)
   - View Profile (S-04 → S-05)

### Prototype Review Checklist

- [ ] All 5 screens render correctly
- [ ] Navigation links work between screens
- [ ] Modals open/close properly (Escape key, overlay click, close button)
- [ ] Tab switching works on S-04 Leaderboards
- [ ] Canvas animations play smoothly on S-02 Game
- [ ] CJX entrance animations trigger on page load
- [ ] Button hover effects and ripples work
- [ ] Responsive breakpoints scale correctly (test at 1920px, 1400px, 1280px)
- [ ] Color contrast meets WCAG AA standards
- [ ] Keyboard navigation works (Tab key, focus indicators visible)

---

## Next Steps (Post-Prototype)

1. **User Testing (GATE 3):**
   - Test with 5+ users
   - Collect feedback on UI clarity, navigation flow, visual appeal
   - Address critical usability issues

2. **Implementation Planning:**
   - Run `/ipa:detail` to generate API_SPEC.md and DB_DESIGN.md
   - Create development plan with `/plan @docs/ @prototypes/`
   - Begin Phase 1 implementation (core gameplay loop)

3. **Integration:**
   - Replace static data with WebSocket connections
   - Implement game loop with server-authoritative logic
   - Add authentication and persistent player profiles
   - Integrate Google AdSense for video ads (Phase 2)

---

## Design Validation Report

### Spec Adherence
- **UI_SPEC screens:** 5
- **Generated screens:** 5
- **Match:** ✅ Yes

### Screens Generated

| Screen | File | CJX Stage | Matches Spec |
|--------|------|-----------|--------------|
| S-01 | s01-lobby.html | cjx-discovery | ✅ Yes |
| S-02 | s02-game.html | cjx-usage | ✅ Yes |
| S-03 | s03-death-screen.html | cjx-retention | ✅ Yes |
| S-04 | s04-leaderboards.html | cjx-expansion | ✅ Yes |
| S-05 | s05-profile.html | cjx-expansion | ✅ Yes |

### Quality Checks
- [x] All screens match UI_SPEC content exactly
- [x] Layout classes correct (`app-layout`, `main-content`)
- [x] CJX animations present (body class + data attributes)
- [x] Real SVG graphics (minimap, icons)
- [x] Real Canvas rendering (S-02 game with animated snakes and food)
- [x] Design tokens applied from UI_SPEC
- [x] Responsive breakpoints implemented
- [x] Accessibility standards met (WCAG AA)
- [x] FR mapping complete and documented

### Component Inventory
- [x] Button component (primary, secondary, large, disabled states)
- [x] Card component (with hover effects)
- [x] Modal component (with overlay, close handlers, keyboard support)
- [x] Input component (with focus states)
- [x] Table component (with striped rows, hover, sorting)
- [x] Tab component (with active state indicators)
- [x] Progress bar component (with color coding)
- [x] Badge component (premium, success variants)

---

## Performance Notes

### Optimization Checklist
- [x] Google Fonts preloaded (`<link rel="preconnect">`)
- [x] CSS animations use `transform` and `opacity` (GPU-accelerated)
- [x] Canvas uses `requestAnimationFrame` for 60 FPS
- [x] Event handlers debounced where appropriate
- [x] No jQuery or heavy frameworks (vanilla JS only)
- [x] Minimal DOM manipulation (efficient selectors)
- [x] Assets embedded as inline SVG (no external image requests)

### Load Time Targets
- **First Paint:** <500ms (critical CSS inline)
- **Interactive:** <1s (modals, buttons responsive)
- **Game Start:** <2s (canvas initialized, assets loaded)

---

## Known Limitations (Prototype Phase)

These are **intentional simplifications** for prototype validation:

1. **Static Data:** All leaderboards, stats, and scores are hardcoded (not live)
2. **No Backend:** No WebSocket connection, authentication, or database
3. **Simulated Gameplay:** S-02 game uses placeholder rendering (not full physics engine)
4. **No Real Ads:** S-03 ad container is a placeholder (Google AdSense integration in Phase 2)
5. **No Skin Purchases:** Payment flow not implemented (Stripe integration in Phase 2)
6. **No Form Validation:** Input fields accept all values without server-side checks
7. **Auto-Death Timer:** S-02 automatically redirects to S-03 after 30 seconds (for demo purposes)

These will be addressed during implementation phases after GATE 3 validation.

---

## Support & Feedback

- **Design Questions:** Refer to `docs/UI_SPEC.md`
- **Functional Requirements:** See `docs/SRD.md`
- **Implementation Planning:** Run `/ipa:detail` and `/plan @docs/ @prototypes/`
- **Issues & Suggestions:** Document in project issue tracker

---

**Status:** ✅ Ready for GATE 3 User Testing
**Next Command:** `/ipa:validate` (after user testing) or `/ipa:detail` (proceed to detailed design)
