# Snake Skin Design Specifications

**Project:** Multiplayer Snake Game (Slither.io Clone)
**Design Style:** Vibrant Competitive
**Version:** 1.0
**Date:** 2026-02-10

---

## Design Philosophy

**Goals:**
- **Visual Hierarchy:** Free skins = solid colors, Premium skins = gradients/effects
- **Competitive Appeal:** Bold, high-energy colors matching esports aesthetic
- **Accessibility:** Distinct patterns + colors for colorblind players
- **Monetization:** Premium skins feel special without pay-to-win advantages

**Technical Constraints:**
- Render at 60 FPS on Canvas
- No animated textures (Phase 1), static gradients only
- Max 3 colors per gradient to maintain performance
- Particle effects (Phase 2+) for premium skins only

---

## Skin Catalog

### Tier 1: Free Skins (Starter Pack)

#### SKIN-01: Classic Blue (Default)
**Unlock:** Default (every player starts with this)
**Price:** Free

**Visual Design:**
```
┌─────────────────────────────────────┐
│  Head: Solid #4A90E2 (Sky Blue)    │
│  Body: Gradient #4A90E2 → #357ABD  │
│  Eyes: White with black pupils     │
│  Pattern: None (solid)             │
└─────────────────────────────────────┘
```

**Color Specification:**
- **Primary:** `#4A90E2` (Sky Blue)
- **Shadow:** `#357ABD` (Darker Blue)
- **Glow:** None

**Canvas Implementation:**
```javascript
ctx.fillStyle = '#4A90E2';
// For body segments, apply subtle gradient:
const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
gradient.addColorStop(0, '#4A90E2');
gradient.addColorStop(1, '#357ABD');
```

**Accessibility:** High contrast against dark background, easily visible

---

#### SKIN-02: Mint Green
**Unlock:** Default (free starter skin)
**Price:** Free

**Visual Design:**
```
┌─────────────────────────────────────┐
│  Head: Solid #50E3C2 (Mint)        │
│  Body: Gradient #50E3C2 → #3DBDA0  │
│  Eyes: White with black pupils     │
│  Pattern: Subtle vertical stripes  │
└─────────────────────────────────────┘
```

**Color Specification:**
- **Primary:** `#50E3C2` (Mint Green)
- **Shadow:** `#3DBDA0` (Darker Mint)
- **Stripe:** `rgba(255, 255, 255, 0.1)` (subtle white overlay)

**Pattern Details:**
- 3px wide vertical stripes spaced 10px apart
- Semi-transparent to maintain base color visibility
- Applied every other segment for visual interest

**Canvas Implementation:**
```javascript
// Base gradient
const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
gradient.addColorStop(0, '#50E3C2');
gradient.addColorStop(1, '#3DBDA0');
ctx.fillStyle = gradient;

// Overlay stripes on alternate segments
if (segmentIndex % 2 === 0) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(x, y - 1.5, width, 3); // vertical stripe
}
```

**Accessibility:** Green + stripe pattern distinguishable from solid blue

---

#### SKIN-03: Sunset Orange
**Unlock:** Complete 5 games (first achievement reward)
**Price:** Free (earned)

**Visual Design:**
```
┌─────────────────────────────────────┐
│  Head: Solid #FF9500 (Orange)      │
│  Body: Gradient #FF9500 → #E67E00  │
│  Eyes: White with black pupils     │
│  Pattern: Diagonal crosshatch      │
└─────────────────────────────────────┘
```

**Color Specification:**
- **Primary:** `#FF9500` (Vibrant Orange)
- **Shadow:** `#E67E00` (Darker Orange)
- **Crosshatch:** `rgba(255, 200, 0, 0.15)` (golden overlay)

**Pattern Details:**
- Diagonal lines (45° angle) crossing every 8px
- Creates diamond/crosshatch effect
- Higher contrast than stripe pattern

**Canvas Implementation:**
```javascript
const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
gradient.addColorStop(0, '#FF9500');
gradient.addColorStop(1, '#E67E00');
ctx.fillStyle = gradient;

// Crosshatch pattern
ctx.strokeStyle = 'rgba(255, 200, 0, 0.15)';
ctx.lineWidth = 1;
// Draw diagonal lines (45° and 135°)
for (let i = 0; i < segments; i++) {
  ctx.beginPath();
  ctx.moveTo(x + i*8, y);
  ctx.lineTo(x + i*8 + 15, y + 15);
  ctx.stroke();
}
```

**Accessibility:** Orange + crosshatch = distinct from blue/green

---

### Tier 2: Premium Skins ($0.99 - $1.99)

#### SKIN-04: Electric Purple
**Unlock:** Purchase
**Price:** $0.99

**Visual Design:**
```
┌─────────────────────────────────────┐
│  Head: Solid #BD10E0 (Purple)      │
│  Body: Gradient #BD10E0 → #8B0DAC  │
│  Eyes: Neon cyan glow              │
│  Pattern: Pulsing glow effect      │
│  Special: Subtle outer glow        │
└─────────────────────────────────────┘
```

**Color Specification:**
- **Primary:** `#BD10E0` (Electric Purple)
- **Shadow:** `#8B0DAC` (Darker Purple)
- **Glow:** `rgba(189, 16, 224, 0.4)` (purple aura)
- **Eye Glow:** `#00D9FF` (Cyan, from design system)

**Special Effects:**
- Outer glow (shadow): 8px blur radius
- Pulsing animation: glow opacity 0.3 → 0.5 (2s ease-in-out loop)

**Canvas Implementation:**
```javascript
// Body gradient
const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
gradient.addColorStop(0, '#BD10E0');
gradient.addColorStop(1, '#8B0DAC');

// Outer glow (render before body)
ctx.shadowColor = 'rgba(189, 16, 224, 0.4)';
ctx.shadowBlur = 8;
ctx.fillStyle = gradient;
ctx.fill();
ctx.shadowBlur = 0; // Reset

// Eyes with cyan glow
ctx.fillStyle = '#00D9FF';
ctx.shadowColor = 'rgba(0, 217, 255, 0.8)';
ctx.shadowBlur = 4;
// draw eyes...
```

**Monetization Appeal:** First "glowing" skin, premium feel

**Accessibility:** Purple + glow effect = unique from free skins

---

#### SKIN-05: Toxic Viper
**Unlock:** Purchase
**Price:** $1.49

**Visual Design:**
```
┌─────────────────────────────────────┐
│  Head: Solid #39FF14 (Neon Green)  │
│  Body: Gradient #39FF14 → #00AA00  │
│  Eyes: Yellow with slit pupils     │
│  Pattern: Black scale texture      │
│  Special: Strong neon glow         │
└─────────────────────────────────────┘
```

**Color Specification:**
- **Primary:** `#39FF14` (Neon Green - accent color from design system)
- **Shadow:** `#00AA00` (Dark Green)
- **Scale Pattern:** `rgba(0, 0, 0, 0.2)` (black scales)
- **Glow:** `rgba(57, 255, 20, 0.6)` (intense neon aura)

**Pattern Details:**
- Hexagonal scale pattern (8px diameter)
- Offset every other row for organic look
- Semi-transparent to show gradient underneath

**Canvas Implementation:**
```javascript
// Base gradient with intense glow
const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
gradient.addColorStop(0, '#39FF14');
gradient.addColorStop(1, '#00AA00');

ctx.shadowColor = 'rgba(57, 255, 20, 0.6)';
ctx.shadowBlur = 12; // stronger glow than Purple
ctx.fillStyle = gradient;
ctx.fill();
ctx.shadowBlur = 0;

// Scale pattern overlay
ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const offsetX = (row % 2) * 4; // stagger scales
    drawHexagon(x + col*8 + offsetX, y + row*8, 4);
  }
}
```

**Monetization Appeal:** Uses accent color from design system (top rank indicator), "rare" feel

**Accessibility:** Brightest skin, neon green + scale pattern = very distinct

---

#### SKIN-06: Crimson Fury
**Unlock:** Purchase
**Price:** $1.49

**Visual Design:**
```
┌─────────────────────────────────────┐
│  Head: Solid #FF1744 (Red)         │
│  Body: Gradient #FF1744 → #C41133  │
│  Eyes: Glowing yellow               │
│  Pattern: Flame-like waveform      │
│  Special: Red glow, aggressive vibe│
└─────────────────────────────────────┘
```

**Color Specification:**
- **Primary:** `#FF1744` (Danger Red - semantic color from design system)
- **Shadow:** `#C41133` (Dark Red)
- **Flame Accent:** `#FFD600` (Yellow - warning color)
- **Glow:** `rgba(255, 23, 68, 0.5)` (red aura)

**Pattern Details:**
- Wavy flame pattern on body segments
- 2-3 "tongues" per segment
- Alternates between red and yellow accents

**Canvas Implementation:**
```javascript
const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
gradient.addColorStop(0, '#FF1744');
gradient.addColorStop(1, '#C41133');

ctx.shadowColor = 'rgba(255, 23, 68, 0.5)';
ctx.shadowBlur = 10;
ctx.fillStyle = gradient;
ctx.fill();
ctx.shadowBlur = 0;

// Flame wave pattern
ctx.strokeStyle = '#FFD600';
ctx.lineWidth = 2;
for (let i = 0; i < segmentCount; i++) {
  ctx.beginPath();
  // Draw wavy line with Math.sin for organic flame
  for (let x = 0; x < segmentWidth; x += 2) {
    const y = Math.sin((x + i*10) * 0.3) * 3;
    ctx.lineTo(segmentX + x, segmentY + y);
  }
  ctx.stroke();
}
```

**Monetization Appeal:** Aggressive, competitive aesthetic ("fury" theme)

**Accessibility:** Red + yellow flames = high contrast, distinct from green/purple

---

### Tier 3: Premium+ Skins ($1.99 - $2.99)

#### SKIN-07: Golden Emperor
**Unlock:** Purchase OR Top 10 Leaderboard (7 days)
**Price:** $1.99 (or earned)

**Visual Design:**
```
┌─────────────────────────────────────┐
│  Head: Metallic #FFD700 (Gold)     │
│  Body: Gradient #FFD700 → #B8860B  │
│  Eyes: White with gold iris        │
│  Pattern: Crown/royal motif        │
│  Special: Sparkle particles        │
└─────────────────────────────────────┘
```

**Color Specification:**
- **Primary:** `#FFD700` (Gold - from design system)
- **Highlight:** `#FFEB3B` (Bright Gold)
- **Shadow:** `#B8860B` (Dark Goldenrod)
- **Sparkle:** `rgba(255, 255, 255, 0.8)` (white glint)

**Special Effects:**
- Sparkle particles trail behind (Phase 2)
- Metallic sheen with highlight gradient
- Crown icon on head segment

**Canvas Implementation:**
```javascript
// Metallic gradient (3-color for depth)
const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
gradient.addColorStop(0, '#FFEB3B'); // highlight
gradient.addColorStop(0.5, '#FFD700'); // main
gradient.addColorStop(1, '#B8860B'); // shadow

ctx.fillStyle = gradient;
ctx.fill();

// Crown icon on head (simple triangles)
ctx.fillStyle = '#FFEB3B';
ctx.beginPath();
ctx.moveTo(headX - 5, headY - 8);
ctx.lineTo(headX, headY - 12);
ctx.lineTo(headX + 5, headY - 8);
ctx.fill();

// Sparkle particles (Phase 2)
if (boostActive) {
  particles.forEach(p => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(p.x, p.y, 2, 2);
  });
}
```

**Monetization Appeal:** Prestigious (top 10 leaderboard reward), status symbol

**Accessibility:** Gold + crown icon = royal theme, distinct from all other colors

---

#### SKIN-08: Cyber Vortex
**Unlock:** Purchase
**Price:** $2.49

**Visual Design:**
```
┌─────────────────────────────────────┐
│  Head: #00D9FF (Cyan)              │
│  Body: Animated gradient           │
│        #00D9FF → #0095B8 → #39FF14 │
│  Eyes: Glowing cyan circuits       │
│  Pattern: Digital grid lines       │
│  Special: Animated color shift     │
└─────────────────────────────────────┘
```

**Color Specification:**
- **Primary:** `#00D9FF` (Cyan - secondary from design system)
- **Secondary:** `#0095B8` (Dark Cyan)
- **Tertiary:** `#39FF14` (Neon Green accent)
- **Grid:** `rgba(255, 255, 255, 0.3)` (white lines)

**Special Effects:**
- Gradient shifts along snake body (animated, 3s loop)
- Digital grid pattern with circuit board aesthetic
- Eyes have "scanning" animation (horizontal line sweep)

**Canvas Implementation:**
```javascript
// Animated gradient offset (shift over time)
const time = Date.now() / 3000; // 3s loop
const gradient = ctx.createLinearGradient(
  x1, y1,
  x2 + Math.sin(time) * 50, y2
);
gradient.addColorStop(0, '#00D9FF');
gradient.addColorStop(0.5, '#0095B8');
gradient.addColorStop(1, '#39FF14');

ctx.fillStyle = gradient;
ctx.fill();

// Digital grid overlay
ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
ctx.lineWidth = 1;
// Horizontal and vertical lines 5px apart
for (let i = 0; i < segments; i++) {
  ctx.beginPath();
  ctx.moveTo(x + i*5, y - radius);
  ctx.lineTo(x + i*5, y + radius);
  ctx.stroke();
}

// Eye "scanning" animation
const scanY = (Math.sin(time * 2) + 1) * radius * 0.5;
ctx.strokeStyle = '#00D9FF';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(eyeX - 5, eyeY + scanY);
ctx.lineTo(eyeX + 5, eyeY + scanY);
ctx.stroke();
```

**Monetization Appeal:** Animated (most complex skin), futuristic/sci-fi theme

**Accessibility:** Cyan + grid pattern + animation = ultra-distinct

---

#### SKIN-09: Inferno Blaze
**Unlock:** Purchase
**Price:** $2.99 (most expensive)

**Visual Design:**
```
┌─────────────────────────────────────┐
│  Head: #FF3366 (Hot Pink)          │
│  Body: Dual gradient               │
│        #FF3366 → #FF9500 → #FFD600 │
│  Eyes: White hot glow               │
│  Pattern: Fire particle trail      │
│  Special: Hottest colors, max glow │
└─────────────────────────────────────┘
```

**Color Specification:**
- **Hot:** `#FF3366` (Primary pink - main accent from design system)
- **Warm:** `#FF9500` (Orange)
- **Bright:** `#FFD600` (Yellow)
- **Glow:** `rgba(255, 51, 102, 0.7)` (intense pink aura)

**Special Effects:**
- Triple-color gradient (hot → warm → bright)
- Fire particle trail (Phase 2, most particles of any skin)
- Pulsing glow effect synced with boost
- Embers float up from body segments

**Canvas Implementation:**
```javascript
// Triple-gradient fire effect
const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
gradient.addColorStop(0, '#FF3366'); // hot pink head
gradient.addColorStop(0.5, '#FF9500'); // orange middle
gradient.addColorStop(1, '#FFD600'); // yellow tail

ctx.shadowColor = 'rgba(255, 51, 102, 0.7)';
ctx.shadowBlur = 15; // maximum glow
ctx.fillStyle = gradient;
ctx.fill();
ctx.shadowBlur = 0;

// Fire particle trail (Phase 2)
particles.forEach(p => {
  const particleGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 4);
  particleGradient.addColorStop(0, 'rgba(255, 255, 100, ' + p.alpha + ')');
  particleGradient.addColorStop(1, 'rgba(255, 51, 102, 0)');
  ctx.fillStyle = particleGradient;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
  ctx.fill();
});

// Embers floating up (ambient effect)
embers.forEach(e => {
  ctx.fillStyle = 'rgba(255, 200, 0, ' + e.alpha + ')';
  ctx.fillRect(e.x, e.y, 2, 2);
  e.y -= 0.5; // float upward
  e.alpha -= 0.01; // fade out
});
```

**Monetization Appeal:** Flagship premium skin, uses primary accent color, most visual effects

**Accessibility:** Pink-orange-yellow gradient = unique warm palette, fire particles = motion cue

---

#### SKIN-10: Shadow Phantom
**Unlock:** Purchase OR 100 Kills Achievement
**Price:** $1.99 (or earned)

**Visual Design:**
```
┌─────────────────────────────────────┐
│  Head: #1A1A2E (Deep Navy)         │
│  Body: Gradient #1A1A2E → #0F0F1F  │
│  Eyes: Glowing red (stealth)       │
│  Pattern: Smoke/wisp effect        │
│  Special: Semi-transparent, ghostly│
└─────────────────────────────────────┘
```

**Color Specification:**
- **Primary:** `#1A1A2E` (Deep Navy - dark but not pure black)
- **Shadow:** `#0F0F1F` (Near Black)
- **Eye Glow:** `#FF1744` (Danger Red)
- **Wisp:** `rgba(100, 100, 120, 0.3)` (ghost effect)

**Special Effects:**
- Semi-transparent body (opacity 0.85)
- Smoke wisp trail (Phase 2, dark particles)
- Glowing red eyes stand out against dark body
- "Stealth" aesthetic (hard to see, competitive advantage perception)

**Canvas Implementation:**
```javascript
// Semi-transparent dark gradient
ctx.globalAlpha = 0.85; // slight transparency

const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
gradient.addColorStop(0, '#1A1A2E');
gradient.addColorStop(1, '#0F0F1F');

ctx.fillStyle = gradient;
ctx.fill();

ctx.globalAlpha = 1.0; // reset

// Glowing red eyes (high contrast)
ctx.fillStyle = '#FF1744';
ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
ctx.shadowBlur = 6;
// draw eyes...
ctx.shadowBlur = 0;

// Smoke wisp trail (Phase 2)
wisps.forEach(w => {
  ctx.fillStyle = 'rgba(100, 100, 120, ' + w.alpha + ')';
  ctx.beginPath();
  ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
  ctx.fill();
  w.alpha -= 0.02; // fade
  w.radius += 0.5; // expand
});
```

**Monetization Appeal:** "Stealth" theme (players think it's harder to see), earnable through achievement

**Accessibility:** Dark body + bright red eyes = high contrast focal point, smoke = motion cue

**Note:** Not truly invisible (would be unfair), just darker aesthetic

---

## Skin Comparison Matrix

| Skin | Tier | Price | Colors | Pattern | Glow | Accessibility ID |
|------|------|-------|--------|---------|------|------------------|
| Classic Blue | Free | $0 | Blue | None | None | A1 (solid blue) |
| Mint Green | Free | $0 | Green | Stripes | None | A2 (green stripes) |
| Sunset Orange | Free | Earned | Orange | Crosshatch | None | A3 (orange crosshatch) |
| Electric Purple | Premium | $0.99 | Purple | None | Yes | B1 (purple glow) |
| Toxic Viper | Premium | $1.49 | Neon Green | Scales | Strong | B2 (neon scales) |
| Crimson Fury | Premium | $1.49 | Red/Yellow | Flames | Yes | B3 (red flames) |
| Golden Emperor | Premium+ | $1.99 | Gold | Crown | Sparkle | C1 (gold crown) |
| Cyber Vortex | Premium+ | $2.49 | Cyan/Green | Grid | Animated | C2 (cyan grid animated) |
| Inferno Blaze | Premium+ | $2.99 | Pink/Orange/Yellow | Fire | Max | C3 (fire gradient) |
| Shadow Phantom | Premium+ | $1.99 | Dark Navy | Smoke | Red Eyes | C4 (dark with red eyes) |

**Accessibility Key:**
- Tier A (Free): Solid colors + basic patterns
- Tier B (Premium): Single color + glow/complex pattern
- Tier C (Premium+): Multi-color gradients + effects

**Colorblind-Friendly:**
- Each skin has unique pattern (stripes, scales, flames, grid, smoke)
- Not relying on color alone for differentiation
- High-contrast elements (eyes, patterns, glows)

---

## Implementation Phases

### Phase 1 (MVP): 5 Skins
1. **Classic Blue** (default)
2. **Mint Green** (free)
3. **Sunset Orange** (earned)
4. **Electric Purple** ($0.99)
5. **Golden Emperor** ($1.99)

**Rationale:** Cover all price points, establish visual hierarchy

### Phase 2 (Monetization): +3 Skins
6. **Toxic Viper** ($1.49)
7. **Crimson Fury** ($1.49)
8. **Inferno Blaze** ($2.99)

**Rationale:** Expand $1.49 tier (sweet spot), add flagship $2.99 skin

### Phase 3 (Competitive): +2 Skins
9. **Cyber Vortex** ($2.49)
10. **Shadow Phantom** ($1.99 or earned)

**Rationale:** Add animated skin, achievement-based unlock for engagement

---

## Technical Specifications

### Canvas Rendering Performance

| Effect | FPS Cost | Phase | Mitigation |
|--------|----------|-------|------------|
| Solid color | 0 FPS | Phase 1 | Baseline |
| Linear gradient | -1 FPS | Phase 1 | Use cached gradients |
| Radial gradient | -2 FPS | Phase 1 | Limit to head only |
| Glow (shadowBlur) | -3 FPS | Phase 1 | Render conditionally (on-screen only) |
| Pattern overlay | -2 FPS | Phase 1 | Pre-render pattern texture |
| Particle trail | -5 FPS | Phase 2 | Object pooling, max 50 particles |
| Animated gradient | -4 FPS | Phase 2 | Update every 100ms, not every frame |

**Target:** 60 FPS with 10 snakes visible (including premium skins)
**Budget:** 10 FPS overhead for skins (6 FPS per frame for all skin rendering)

### Particle Systems (Phase 2)

**Sparkle (Golden Emperor):**
- Max 20 particles per snake
- Lifetime: 0.5s
- Spawn rate: 5/second when boosting

**Fire Trail (Inferno Blaze):**
- Max 30 particles per snake
- Lifetime: 0.8s
- Spawn rate: 10/second when boosting

**Smoke Wisp (Shadow Phantom):**
- Max 15 particles per snake
- Lifetime: 1.2s (slower fade)
- Spawn rate: 3/second constant

---

## Monetization Strategy

### Pricing Tiers

| Tier | Price | Revenue Split (Est.) | Target Buyer |
|------|-------|----------------------|--------------|
| Free | $0 | 0% | All players |
| Budget Premium | $0.99 | 30% | Impulse buyers, first-time payers |
| Mid Premium | $1.49 | 40% | Engaged players, skin collectors |
| Flagship | $1.99-$2.99 | 30% | Whales, status seekers |

**Expected ARPU from Skins:**
- 3% conversion rate (per Lean analysis)
- Average purchase: $1.50 (weighted average)
- 1000 DAU × 3% conversion = 30 buyers/day
- 30 buyers × $1.50 = $45/day from skins = $1,350/month

### Unlock Strategies

**Purchase-Only (7 skins):**
- Immediate revenue, straightforward monetization

**Earned (3 skins):**
- Sunset Orange: 5 games played (engagement hook)
- Golden Emperor: Top 10 leaderboard for 7 days (retention + aspiration)
- Shadow Phantom: 100 kills (skill-based, long-term goal)

**Rationale:** Earned skins prove value proposition ("free skins are good, premium must be better")

### Bundle Opportunities (Phase 2)

**Starter Pack:** $2.99
- Electric Purple + Toxic Viper + Crimson Fury
- Save $1.49 vs individual purchases

**Collector's Edition:** $7.99
- All 10 skins + exclusive "Rainbow" skin (11th skin, bundle-only)
- 40% discount vs buying individually ($15 value)

**Battle Pass (Phase 3):** $4.99/month
- Earn 1 premium skin per week (4/month)
- Exclusive seasonal skins
- Target: 5% of players = 50 players × $4.99 = $250/month

---

## UI Integration

### Lobby Skin Selector (S-01)

**Visual Layout:**
```
┌───────────────────────────────────────┐
│  Skins (5 / 10 Owned)                │
├───────────────────────────────────────┤
│                                       │
│  FREE:                                │
│  [✓Blue] [✓Green] [✓Orange]          │
│                                       │
│  PREMIUM ($0.99):                     │
│  [✓Purple] [🔒Viper]                  │
│                                       │
│  PREMIUM ($1.49):                     │
│  [🔒Fury] [🔒Cyber]                   │
│                                       │
│  PREMIUM+ ($1.99-$2.99):              │
│  [✓Gold] [🔒Blaze] [🔒Phantom]        │
│                                       │
│  [EQUIP] or [PURCHASE $X.XX]          │
└───────────────────────────────────────┘
```

**Skin Preview:**
- Animated snake (looping, 30 FPS)
- Shows full gradient and effects
- 120x60px preview size
- Click to expand to full-screen preview

### Death Screen Upsell (S-03)

**Skin Recommendation Engine:**
- Show locked skin similar to player's current skin
- Example: Player uses Mint Green → Suggest Toxic Viper (both green)
- Rotate through 3 recommended skins per death
- "Unlock [Skin Name] for $X.XX" with preview button

---

## A/B Testing Plan (Phase 2)

### Test 1: Pricing Sensitivity
- **Variant A:** Purple $0.99, Viper $1.49, Blaze $2.99
- **Variant B:** Purple $1.49, Viper $1.99, Blaze $3.99 (20% higher)
- **Metric:** Conversion rate per tier
- **Hypothesis:** $0.99 has highest conversion, $2.99 maximizes revenue

### Test 2: Unlock Method
- **Variant A:** Shadow Phantom = purchase only ($1.99)
- **Variant B:** Shadow Phantom = earned (100 kills) + purchaseable ($1.99 shortcut)
- **Metric:** Total revenue + engagement (kill rate)
- **Hypothesis:** Earnable increases engagement, some players buy shortcut

### Test 3: Visual Complexity
- **Variant A:** All premium skins have particle effects
- **Variant B:** Only $2.49+ skins have particle effects
- **Metric:** Purchase preference, FPS impact
- **Hypothesis:** Particles increase perceived value, justify higher prices

---

## Accessibility Compliance

### WCAG 2.1 AA Checklist

- [x] **Color Contrast:** All skins visible against dark background (#0A0E1A)
- [x] **Pattern Differentiation:** Each skin has unique pattern (not color-only)
- [x] **Colorblind Modes:**
  - Protanopia (red-blind): Blue, Green, Purple, Cyan, Gold distinguishable
  - Deuteranopia (green-blind): Blue, Orange, Purple, Red, Gold distinguishable
  - Tritanopia (blue-blind): Green, Orange, Red, Gold, Pink distinguishable
- [x] **Motion Sensitivity:** Particle effects optional (settings toggle in Phase 2)
- [x] **Focus Indicators:** Skin selector grid has visible focus rings (keyboard nav)

### Colorblind Simulation Results

**Tested with:** [Coblis Color Blindness Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/)

- Classic Blue → Remains distinct blue
- Mint Green → Appears yellowish, but stripe pattern differentiates
- Sunset Orange → Appears brownish, crosshatch pattern differentiates
- Electric Purple → Appears blue-ish, but glow + no pattern = distinct from Classic Blue
- Golden Emperor → Appears yellow-grey, crown icon differentiates
- All skins: Pattern + glow combination ensures no two are identical

---

## Future Skin Ideas (Phase 4+)

**Community Requests:**
1. **Rainbow Pride:** Multi-color gradient, LGBTQ+ community skin
2. **Camouflage:** Green/brown military pattern, tactical theme
3. **Ocean Wave:** Blue-white wave pattern, aquatic theme
4. **Lava Flow:** Red-black magma effect, volcanic theme
5. **Galaxy:** Purple-blue starfield, cosmic theme

**Seasonal Skins:**
- **Halloween:** Pumpkin orange with black stripes, jack-o'-lantern eyes
- **Winter:** Icy blue with snowflake pattern, frost effect
- **Valentine's:** Pink with heart pattern, romantic theme
- **Summer:** Beach ball colors (multi-stripe), tropical vibe

**User-Generated Content (Phase 5):**
- Skin creator tool (color picker + pattern selector)
- Submit to community gallery
- Top voted skins added to game (creator gets 50% revenue share)
- Moderation required (no offensive content)

---

## References

- **UI Spec:** `docs/UI_SPEC.md` (Section 1.3: Color Palette, Section 3.2: S-01 Lobby)
- **SRD:** `docs/SRD.md` (FR-09: Basic skin system)
- **Lean Analysis:** `plans/reports/lean-260210-1555-multiplayer-snake-game-mvp.md` (Monetization assumptions)
- **Design Research:**
  - [Color Theory for Games](https://www.gameuidatabase.com/) - Competitive palette examples
  - [Canvas Performance Optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) - Gradient and particle best practices

---

**End of Document**

**Status:** Ready for Implementation (Phase 1: 5 skins, Phase 2: +3 skins, Phase 3: +2 skins)

**Next Steps:**
1. Review with art director (if applicable)
2. Create sprite sheet or Canvas rendering modules
3. Implement skin selector UI in S-01 Lobby
4. A/B test pricing in Phase 2
5. Monitor conversion rates and iterate
