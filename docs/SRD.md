# System Requirement Definition (SRD)

**Project:** Multiplayer Snake Game (Slither.io Clone)
**Version:** 1.0
**Date:** 2026-02-10
**Status:** Draft (Awaiting GATE 2 Validation)

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-10 | Systems Analyst | Initial draft from Lean MVP analysis |

---

## 1. System Overview

### 1.1 Project Purpose

Build a **browser-based multiplayer snake game** targeting desktop competitive gamers. The system delivers fast-paced, skill-based gameplay with fair monetization through cosmetic-only purchases and non-intrusive advertising.

### 1.2 Business Goals

- **Primary:** Generate revenue through ads (50%), skin purchases (30%), and ad-free subscriptions (20%)
- **Secondary:** Achieve 5000 DAU by Month 6 with >18% D7 retention
- **Tertiary:** Build competitive gaming community around leaderboards and skill-based play

### 1.3 Target Audience

| User Segment | Age | Platform | Motivation | Play Pattern |
|--------------|-----|----------|------------|--------------|
| Competitive Casual | 18-35 | Desktop | Skill-based competition during breaks | 2-5 sessions/day, 5-15 min each |
| Leaderboard Climbers | 18-40 | Desktop | Achievement and ranking | 3-10 sessions/day, focused grinding |
| Skin Collectors | 16-35 | Desktop | Self-expression through customization | Regular play, willing to pay |
| Content Creators | 20-40 | Desktop | Streaming/video content creation | Long sessions, spectator mode users |

### 1.4 Scope

**In-Scope (MVP):**
- Real-time multiplayer gameplay (50 players/room)
- HTML5 Canvas rendering (60 FPS target)
- WebSocket-based communication (Socket.io)
- Desktop browser support (Chrome, Firefox, Safari, Edge)
- Cosmetic skin system with microtransactions
- Video ads on death screen
- Global and regional leaderboards
- Player stats and profile system

**Out of Scope (Post-MVP):**
- Mobile app (iOS/Android native)
- Private/custom rooms
- Voice chat or text messaging
- Power-ups or gameplay modifiers
- Campaign/story mode
- User-generated content (custom skins, maps)
- Ranked matchmaking (ELO/MMR system)

### 1.5 Technical Constraints

| Constraint | Requirement | Rationale |
|------------|-------------|-----------|
| Hosting Budget | $300-500/mo at launch | Cost-effective scaling for small team |
| Server Performance | 60Hz game loop, <50ms server latency | Smooth gameplay, fair collision detection |
| Client Performance | 60 FPS on mid-tier hardware (2018+) | Accessibility for broader audience |
| Bandwidth | <3 KB/s per player (50GB/mo per server) | Cost control, scalability |
| Browser Support | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ | Modern WebSocket/Canvas support |

### 1.6 Key Technical Decisions

| ID | Decision | Choice | Rationale |
|----|----------|--------|-----------|
| D-01 | WebSocket Library | Socket.io | Built-in room management, easier debugging |
| D-02 | State Sync | Full snapshots (20Hz) → Delta updates (Phase 2) | Start simple, optimize later |
| D-03 | Client Prediction | Local player only | Reduces complexity, avoids rubber-banding |
| D-04 | Hosting | DigitalOcean Droplets + Docker | Predictable pricing, containerized deployment, environment consistency |
| D-05 | Anti-Cheat | Server-authoritative | Prevents 90% of common cheats |
| D-06 | Frontend | Phaser.js 3.70+ | Faster development (2-3 weeks saved), team expertise, built-in physics/scenes/animations |
| D-07 | Database | PostgreSQL + Redis | Relational data + fast leaderboard queries |
| D-08 | Ads | Google AdSense (video) | Easy web integration, 50-70% fill rate |

---

## 2. Actors (User Roles)

| Actor ID | Actor Name | Description | Access Level |
|----------|------------|-------------|--------------|
| A-01 | Anonymous Visitor | User browsing without account | Read-only (view leaderboards) |
| A-02 | Guest Player | User playing without creating account | Play games, temporary session tracking |
| A-03 | Registered Player | User with email/password account | Full gameplay, persistent stats, purchases |
| A-04 | Premium Player | Registered player who purchased ad-free | Ad-free experience + full gameplay features |
| A-05 | Content Creator | Player using spectator mode | Spectate top players, record gameplay |
| A-06 | Administrator | System admin (internal) | Backend access, moderation tools |

**Note:** MVP focuses on A-02 (Guest) and A-03 (Registered). A-04 (Premium) added in Phase 2. A-05 (Spectator) and A-06 (Admin) are Phase 3.

---

## 3. Functional Requirements (FR-xx)

### 3.1 Phase 1: Core Gameplay (Priority P1)

| ID | Feature | User Story | Acceptance Criteria | Screen | Related Entities |
|----|---------|------------|---------------------|--------|------------------|
| FR-01 | Room-based matchmaking | As a player, I want to join a game instantly without waiting in queue | - Click "Play" button joins available room within 2 seconds<br>- Rooms support max 50 concurrent players<br>- New room created when all rooms are full<br>- Display "Joining game..." loading state | S-01, S-02 | E-05 (Room), E-01 (Player) |
| FR-02 | Snake movement | As a player, I want to control my snake smoothly using mouse/keyboard | - Mouse cursor controls snake direction (follows cursor)<br>- WASD keys as alternative control method<br>- Spacebar activates boost (consumes mass)<br>- Smooth 60 FPS rendering with network interpolation<br>- Visual trail effect during boost | S-02 | E-03 (Snake) |
| FR-03 | Food spawning | As a player, I want to collect food to grow my snake | - 500-800 food entities spawn across map<br>- Food respawns 1-3 seconds after collection<br>- Collecting food increases snake length by 1 segment<br>- Food has different colors (cosmetic variety)<br>- Food density higher near edges (strategic positioning) | S-02 | E-04 (Food), E-03 (Snake) |
| FR-04 | Collision detection | As a player, I want fair collision detection that determines deaths | - Snake dies when head hits another snake's body<br>- Larger snake "kills" smaller snake on head-to-head collision<br>- Dead snake converts to food (all segments become collectible)<br>- Server-authoritative collision (no client-side manipulation)<br>- 60Hz server tick rate for accuracy | S-02 | E-03 (Snake), E-04 (Food) |
| FR-05 | Real-time leaderboard | As a player, I want to see top players during gameplay | - Overlay displays top 10 players by length<br>- Updates every 1 second (throttled)<br>- Shows: rank, username, length/score<br>- Highlights player's own rank if in top 10<br>- Semi-transparent to avoid blocking gameplay | S-02 | E-03 (Snake), E-06 (LeaderboardEntry) |
| FR-06 | Death screen with stats | As a player, I want to see my performance after dying | - Display: final rank, kills, survival time, max length<br>- Show "Play Again" button (instant restart)<br>- Show "View Leaderboards" link<br>- Calculate and display session score<br>- Optional: Save session to history (if registered) | S-03 | E-02 (PlayerSession) |
| FR-07 | Network interpolation | As a player, I want smooth gameplay despite network latency | - Client predicts local snake movement<br>- Other snakes use interpolation between server updates<br>- Server sends 20Hz updates (optimized bandwidth)<br>- Client-side dead reckoning for smooth motion<br>- Server reconciliation for corrections | S-02 | E-03 (Snake) |

### 3.2 Phase 2: Monetization Foundation (Priority P2)

| ID | Feature | User Story | Acceptance Criteria | Screen | Related Entities |
|----|---------|------------|---------------------|--------|------------------|
| FR-08 | Video ads on death | As a developer, I want to monetize through non-intrusive ads | - 5-15 second video ad plays on death screen<br>- "Skip Ad" button appears after 5 seconds<br>- Ad frequency: 1 per death (100% rate)<br>- Fallback to static ad if video unavailable<br>- No ads for premium (ad-free) users<br>- Track ad impressions and clicks | S-03 | E-07 (Transaction), E-01 (Player) |
| FR-09 | Basic skin system | As a player, I want to customize my snake's appearance | - 3 free skins (default, blue, green)<br>- 5-8 premium skins ($0.99-$2.99 each)<br>- Skin selector in lobby (grid layout)<br>- Preview skin before purchase<br>- One-time purchase (permanent unlock)<br>- Skin applies immediately in-game | S-01, S-02 | E-01 (Player), E-07 (Transaction) |
| FR-10 | Ad-free option | As a player, I want to remove ads permanently | - $3.99 one-time purchase<br>- Removes all video and display ads<br>- Labeled as "Premium" in UI<br>- Badge/indicator on username in leaderboard<br>- Persistent across devices (account-based) | S-01, S-03 | E-01 (Player), E-07 (Transaction) |
| FR-11 | Daily login rewards | As a player, I want incentives to play regularly | - Day 1: 100 coins, Day 2: 150 coins, ... Day 7: 500 coins<br>- Streak resets if missed a day<br>- Popup on lobby entry showing reward<br>- Coins used for future skin purchases (discount)<br>- Visual calendar showing streak progress | S-01 | E-01 (Player) |

### 3.3 Phase 3: Competitive Features (Priority P2/P3)

| ID | Feature | User Story | Acceptance Criteria | Screen | Related Entities |
|----|---------|------------|---------------------|--------|------------------|
| FR-12 | Regional leaderboards | As a player, I want to compete regionally | - Tabs: Global, North America, Europe, Asia<br>- Display top 100 players per region<br>- Auto-detect player region via IP geolocation<br>- Update every 5 minutes (cached)<br>- Show: rank, username, top score, play count | S-04 | E-06 (LeaderboardEntry) |
| FR-13 | Player stats | As a player, I want to track my performance | - Display: Total kills, total deaths, K/D ratio<br>- Average rank per session<br>- Total play time<br>- Best score / longest snake<br>- Session history (last 20 games)<br>- Achievement badges (e.g., "100 Kills Club") | S-05 | E-02 (PlayerSession), E-01 (Player) |
| FR-14 | Spectator mode | As a content creator, I want to watch top players | - "Spectate" button in lobby (enabled for top 10)<br>- Spectate view follows selected player<br>- Camera pans smoothly<br>- Can switch between top players<br>- Exit spectator mode anytime<br>- Optional: delay (5-10 seconds) to prevent ghosting | S-02 | E-03 (Snake), E-05 (Room) |
| FR-15 | Basic anti-cheat | As a player, I want fair competition | - Server validates all movement (speed, boost consumption)<br>- Detect impossible jumps/teleports<br>- Flag suspicious accounts (auto-ban if >3 violations)<br>- Rate limiting on actions (prevent spam)<br>- Log all violations for review | Backend | E-01 (Player), E-03 (Snake) |

---

## 4. Screen List (S-xx)

| ID | Screen Name | Description | User Actors | Functional Requirements |
|----|-------------|-------------|-------------|-------------------------|
| S-01 | Lobby | Pre-game hub for customization and matchmaking | A-02, A-03, A-04 | FR-01, FR-09, FR-10, FR-11 |
| S-02 | Game | Real-time multiplayer gameplay canvas | A-02, A-03, A-04, A-05 | FR-02, FR-03, FR-04, FR-05, FR-07, FR-14 |
| S-03 | Death Screen | Post-game stats and monetization | A-02, A-03, A-04 | FR-06, FR-08 |
| S-04 | Leaderboards | Global and regional rankings | A-01, A-02, A-03, A-04 | FR-05, FR-12 |
| S-05 | Profile | Player stats and achievement tracking | A-03, A-04 | FR-13 |

---

## 5. Entity List (E-xx)

| ID | Entity Name | Description | Key Attributes | Storage Type | Related FR |
|----|-------------|-------------|----------------|--------------|------------|
| E-01 | Player | Persistent user account | `user_id` (PK), `username`, `email`, `password_hash`, `created_at`, `owned_skins[]`, `ad_free_status`, `coins`, `total_kills`, `total_deaths`, `total_playtime`, `region` | PostgreSQL | FR-01, FR-08, FR-09, FR-10, FR-11, FR-13, FR-15 |
| E-02 | PlayerSession | Single game session record | `session_id` (PK), `user_id` (FK), `room_id` (FK), `kills`, `deaths`, `rank`, `max_length`, `duration`, `timestamp` | PostgreSQL | FR-06, FR-13 |
| E-03 | Snake | Real-time game entity (ephemeral) | `snake_id` (PK), `user_id` (FK), `position` (x, y), `segments[]` (array of positions), `length`, `speed`, `boost_active`, `direction`, `alive` | In-memory (Redis) | FR-02, FR-03, FR-04, FR-05, FR-07, FR-14 |
| E-04 | Food | Collectible game entity (ephemeral) | `food_id` (PK), `position` (x, y), `value`, `color` | In-memory (game server) | FR-03, FR-04 |
| E-05 | Room | Game instance container | `room_id` (PK), `players[]` (array of user_ids), `max_players`, `status` (active/full/closed), `created_at` | In-memory (Redis) | FR-01, FR-14 |
| E-06 | LeaderboardEntry | Cached leaderboard rankings | `entry_id` (PK), `user_id` (FK), `score`, `rank`, `region`, `updated_at` | PostgreSQL + Redis cache | FR-05, FR-12 |
| E-07 | Transaction | Purchase and ad interaction record | `transaction_id` (PK), `user_id` (FK), `type` (ad_view/skin_purchase/ad_free), `item_id`, `amount`, `timestamp` | PostgreSQL | FR-08, FR-09, FR-10 |

---

## 6. Non-Functional Requirements

### 6.1 Performance (NFR-PERF)

| ID | Requirement | Target | Measurement Method |
|----|-------------|--------|-------------------|
| NFR-PERF-01 | Client frame rate | 60 FPS on mid-tier hardware (Intel i5-8th gen, 8GB RAM) | Performance profiler, user telemetry |
| NFR-PERF-02 | Server tick rate | 60 Hz game loop | Server logs, monitoring dashboard |
| NFR-PERF-03 | Server latency | <50ms median response time | APM tools (e.g., New Relic, Datadog) |
| NFR-PERF-04 | Room join time | <2 seconds from click to gameplay | Analytics event tracking |
| NFR-PERF-05 | Bandwidth per player | <3 KB/s (full snapshots), <1 KB/s (delta updates) | Network monitoring |

### 6.2 Scalability (NFR-SCALE)

| ID | Requirement | Target | Strategy |
|----|-------------|--------|----------|
| NFR-SCALE-01 | Concurrent users per server | 150-200 CCU (3-4 rooms) per $40/mo droplet | Horizontal scaling with load balancer |
| NFR-SCALE-02 | Room capacity | 50 players per room | Fixed limit, create new rooms dynamically |
| NFR-SCALE-03 | Database queries | <10ms for leaderboard fetch, <5ms for user lookup | Redis caching, PostgreSQL indexes |
| NFR-SCALE-04 | Horizontal scaling | Add servers programmatically during traffic spikes | Auto-scaling script (Phase 3) |

### 6.3 Security (NFR-SEC)

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-SEC-01 | Password storage | bcrypt hashing (cost factor 12) |
| NFR-SEC-02 | Session management | JWT tokens with 7-day expiry, HttpOnly cookies |
| NFR-SEC-03 | Input validation | Server-side validation for all client inputs (position, speed, boost) |
| NFR-SEC-04 | SQL injection prevention | Parameterized queries, ORM usage (Sequelize/TypeORM) |
| NFR-SEC-05 | Rate limiting | Max 100 actions/second per player, 10 login attempts/hour |
| NFR-SEC-06 | HTTPS enforcement | TLS 1.3, Let's Encrypt certificates |
| NFR-SEC-07 | Payment security | PCI-DSS compliance via Stripe/PayPal (no direct card storage) |

### 6.4 Usability (NFR-USE)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-USE-01 | Time to first game | <30 seconds from landing page to gameplay |
| NFR-USE-02 | Control responsiveness | <16ms input lag (at 60 FPS) |
| NFR-USE-03 | Browser compatibility | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| NFR-USE-04 | Screen resolution support | 1280x720 minimum, 1920x1080 optimal, 4K supported |
| NFR-USE-05 | Accessibility | Color-blind friendly UI, keyboard-only navigation support |

### 6.5 Availability (NFR-AVAIL)

| ID | Requirement | Target | Strategy |
|----|-------------|--------|----------|
| NFR-AVAIL-01 | Uptime | 99.5% (max 3.6 hours downtime/month) | Load balancer, health checks, auto-restart |
| NFR-AVAIL-02 | Graceful degradation | System continues with reduced capacity if one server fails | Multi-server architecture (Phase 3) |
| NFR-AVAIL-03 | Maintenance windows | <2 hours/month, scheduled during low-traffic hours | Blue-green deployment |

### 6.6 Maintainability (NFR-MAINT)

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-MAINT-01 | Code modularity | Separate modules for game logic, networking, rendering (<200 lines/file) |
| NFR-MAINT-02 | Documentation | Inline JSDoc comments, README with setup instructions, API documentation |
| NFR-MAINT-03 | Error logging | Centralized logging (Winston/Bunyan), error tracking (Sentry) |
| NFR-MAINT-04 | Monitoring | Real-time dashboards (Grafana), alerting for downtime/errors |

### 6.7 Legal & Compliance (NFR-LEGAL)

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-LEGAL-01 | Age restriction | 13+ age gate (COPPA compliance) |
| NFR-LEGAL-02 | Privacy policy | GDPR/CCPA compliant, no tracking without consent |
| NFR-LEGAL-03 | Terms of service | Clear ToS regarding cheating, refunds, account bans |
| NFR-LEGAL-04 | Data retention | User data deleted within 30 days of account deletion request |

---

## 7. System Interfaces

### 7.1 External Integrations

| Interface | Type | Purpose | Provider | Phase |
|-----------|------|---------|----------|-------|
| Payment Gateway | REST API | Process skin and ad-free purchases | Stripe / PayPal | Phase 2 |
| Ad Network | JavaScript SDK | Serve video ads on death screen | Google AdSense | Phase 2 |
| Analytics | JavaScript SDK | Track user behavior and retention | Mixpanel / Amplitude | Phase 1 |
| Error Tracking | JavaScript SDK | Monitor client-side errors | Sentry | Phase 1 |
| Email Service | REST API | Send account verification emails | SendGrid / Mailgun | Phase 2 |
| Geolocation | REST API | Detect player region for leaderboards | MaxMind GeoIP2 | Phase 3 |

### 7.2 Internal APIs

| API | Protocol | Purpose | Endpoints |
|-----|----------|---------|-----------|
| Game Server | WebSocket (Socket.io) | Real-time game state sync | `/connect`, `/join-room`, `/player-input`, `/game-update` |
| REST API | HTTP/JSON | User management, stats, purchases | `/auth/register`, `/auth/login`, `/user/profile`, `/user/stats`, `/leaderboard`, `/purchase` |
| Admin API | HTTP/JSON (auth required) | Moderation and analytics | `/admin/users`, `/admin/ban`, `/admin/analytics` |

---

## 8. Data Flow Diagrams

### 8.1 Primary User Flow: Quick Play Session

```
Player → [S-01 Lobby]
    ↓ (Click "Play")
    ↓
[FR-01: Matchmaking] → Join or create room
    ↓
[S-02 Game Canvas]
    ↓ (Gameplay loop)
    ↓
[FR-02: Snake Movement] ← [FR-07: Network Interpolation]
[FR-03: Food Collection]
[FR-04: Collision Detection]
[FR-05: Leaderboard Updates]
    ↓ (Death event)
    ↓
[S-03 Death Screen]
    ↓ (Phase 2)
    ↓
[FR-08: Video Ad] → [FR-06: Show Stats]
    ↓ (Click "Play Again")
    ↓
[Back to S-02 Game]
```

### 8.2 Monetization Flow: Skin Purchase

```
Player → [S-01 Lobby]
    ↓ (Click skin icon)
    ↓
[Skin Gallery Modal] (FR-09)
    ↓ (Select premium skin)
    ↓
[Payment Modal] → Stripe/PayPal
    ↓ (Payment success)
    ↓
[Update E-01 Player.owned_skins]
[Create E-07 Transaction record]
    ↓
[Equip skin in S-01 Lobby]
[Apply skin in S-02 Game]
```

### 8.3 Real-Time Game Loop (Server-Side)

```
[Game Server @ 60Hz]
    ↓
FOR each room:
    1. Process player inputs (FR-02)
    2. Update snake positions
    3. Check collisions (FR-04)
        - Snake-to-snake → Death
        - Snake-to-food → Growth (FR-03)
    4. Update leaderboard (FR-05)
    5. Broadcast game state (20Hz) (FR-07)
    ↓
[Send state to all clients via WebSocket]
```

---

## 9. Assumptions & Constraints

### 9.1 Assumptions

1. **Target hardware**: Players have devices capable of 60 FPS HTML5 Canvas rendering (2018+ hardware)
2. **Network**: Average player latency <150ms (US/EU regions)
3. **Browser support**: 95%+ users on modern browsers (Chrome, Firefox, Edge, Safari)
4. **Monetization**: 50% revenue from ads, 30% from skins, 20% from ad-free subscriptions
5. **Retention**: D1=40%, D7=20%, D30=10% (industry benchmark for .io games)
6. **Conversion**: 3-5% of players convert to paid features
7. **Room capacity**: 50 players sufficient for engaging gameplay (not 100+)
8. **Server capacity**: One $40/mo droplet handles 150-200 CCU (3-4 rooms)
9. **Cheating**: Server-authoritative design prevents 90%+ of common cheats
10. **Desktop-first**: 70%+ users on desktop browsers (not mobile)

### 9.2 Constraints

1. **Budget**: $300-500/mo hosting at launch (can spike to $1000+ if viral)
2. **Timeline**: 16 weeks for MVP (3 phases)
3. **Team**: 2-4 developers (no dedicated DevOps or QA initially)
4. **Technology**: Must use Socket.io (WebSocket abstraction) per decision D-01
5. **Database**: PostgreSQL + Redis only (no MongoDB or other NoSQL)
6. **Frontend**: Vanilla JS (no React/Vue/Angular frameworks)
7. **No mobile app**: Browser-only for MVP (deferred to Phase 4+)
8. **No voice chat**: Text-only (voice chat post-MVP due to moderation cost)
9. **50 players/room**: Fixed limit (not configurable by users)
10. **English-only**: Internationalization (i18n) deferred to post-MVP

---

## 10. Success Criteria (GATE 2 Validation)

### 10.1 Phase 1 Completion Criteria

- [ ] 70%+ alpha testers complete 3+ sessions
- [ ] Average session length >5 minutes
- [ ] <5 critical bugs (P0/P1)
- [ ] Server response time <50ms median
- [ ] Client FPS >50 on mid-tier hardware

### 10.2 Phase 2 Completion Criteria

- [ ] Ad fill rate >50%
- [ ] 1.5-2.0 ad impressions per session
- [ ] Skin purchase conversion >2%
- [ ] Ad-free conversion >1%
- [ ] Revenue per DAU >$0.30

### 10.3 Phase 3 (Launch) Completion Criteria

- [ ] D1 retention >35%
- [ ] D7 retention >18%
- [ ] Average 3+ games per user per day
- [ ] 30%+ users view leaderboards
- [ ] <2% sessions with cheat reports

### 10.4 Post-Launch (Month 3) Targets

- [ ] 5000 DAU
- [ ] Monthly revenue >$500
- [ ] Net Promoter Score (NPS) >30
- [ ] Virality (K-factor) >0.3
- [ ] Server uptime >99.5%

---

## 11. Risks & Mitigation (Summary)

| Risk | Impact | Mitigation |
|------|--------|------------|
| Viral spike crashes servers | High | Auto-scaling script, load balancer ready by Phase 3 |
| Cheaters ruin competitive integrity | High | Server-authoritative design, basic detection in Phase 3 |
| Hosting costs exceed budget | Medium | Monitor bandwidth daily, implement delta compression if needed |
| Retention below 15% D7 | Critical | Weekly A/B tests, fast-track daily rewards |
| Skin sales flop | High | A/B test pricing, add free skins via daily login rewards |

---

## 12. Open Questions (Resolved in Future Phases)

1. **Region selection**: Auto-detect via IP or manual user selection? → Decide in Phase 3 UX testing
2. **Boost mechanic balance**: Linear or exponential mass consumption? → Playtesting in Phase 1
3. **Leaderboard reset**: Daily/weekly/all-time? → User preference survey in Phase 3
4. **Mobile browser support**: Block mobile users or provide degraded experience? → Analytics after soft launch
5. **Account system**: Email/password, social login, or anonymous guest? → A/B test in Phase 2

---

## 13. References

- **Lean MVP Analysis**: `plans/reports/lean-260210-1555-multiplayer-snake-game-mvp.md`
- **Market Research**:
  - [Slither.io monetization](https://www.playbite.com/q/how-does-a-game-like-slither-io-make-money)
  - [Scalable WebSocket multiplayer](https://medium.com/@dragonblade9x/making-a-multiplayer-web-game-with-websocket-that-can-be-scalable-to-millions-of-users-923cc8bd4d3b)
  - [Socket.io + Redis architecture](https://dev.to/dowerdev/building-a-real-time-multiplayer-game-server-with-socketio-and-redis-architecture-and-583m)
  - [HTML5 game trends 2026](https://www.juegostudio.com/blog/emerging-trends-for-modern-html5-game-development-in-2025)

---

## 14. Traceability Matrix

| Lean Feature | SRD FR-xx | Screen | Entity | Phase |
|--------------|-----------|--------|--------|-------|
| Room-based matchmaking (50 players) | FR-01 | S-01, S-02 | E-05, E-01 | Phase 1 |
| Snake movement (mouse/WASD) | FR-02 | S-02 | E-03 | Phase 1 |
| Food spawning system | FR-03 | S-02 | E-04, E-03 | Phase 1 |
| Collision detection | FR-04 | S-02 | E-03, E-04 | Phase 1 |
| Real-time leaderboard (top 10) | FR-05 | S-02 | E-03, E-06 | Phase 1 |
| Death screen with stats | FR-06 | S-03 | E-02 | Phase 1 |
| Network interpolation | FR-07 | S-02 | E-03 | Phase 1 |
| Video ads on death screen | FR-08 | S-03 | E-07, E-01 | Phase 2 |
| Basic skin system (5-8 skins) | FR-09 | S-01, S-02 | E-01, E-07 | Phase 2 |
| Ad-free option ($3.99) | FR-10 | S-01, S-03 | E-01, E-07 | Phase 2 |
| Daily login rewards | FR-11 | S-01 | E-01 | Phase 2 |
| Regional leaderboards | FR-12 | S-04 | E-06 | Phase 3 |
| Player stats (K/D, avg rank) | FR-13 | S-05 | E-02, E-01 | Phase 3 |
| Spectator mode | FR-14 | S-02 | E-03, E-05 | Phase 3 |
| Basic anti-cheat | FR-15 | Backend | E-01, E-03 | Phase 3 |

---

**End of Document**

---

## Approval & Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | [TBD] | ________ | __/__/__ |
| Technical Lead | [TBD] | ________ | __/__/__ |
| Stakeholder | [TBD] | ________ | __/__/__ |

**Next Step**: Proceed to UI_SPEC.md generation, then GATE 2 validation before `/ipa:design`.
