# Phase 3: Competitive Features (Weeks 13-16)

## Context Links

- [SRD](../../docs/SRD.md) - FR-12 to FR-15, NFR-SCALE, NFR-AVAIL
- [UI_SPEC](../../docs/UI_SPEC.md) - S-04 (Leaderboards), S-05 (Profile)
- [API_SPEC](../../docs/API_SPEC.md) - Leaderboard endpoints, user stats endpoints
- [DB_DESIGN](../../docs/DB_DESIGN.md) - leaderboard_entries table (E-06), Redis sorted sets
- [Phase 1](./phase-01-core-gameplay.md) - Prerequisite: game loop, auth, sessions
- [Phase 2](./phase-02-monetization.md) - Prerequisite: transactions, skins, player accounts

## Overview

- **Priority:** P2/P3
- **Status:** pending
- **Duration:** 4 weeks (Weeks 13-16)
- **Description:** Add competitive engagement: regional leaderboards (S-04), player profile with stats and session history (S-05), spectator mode for top players, and server-side anti-cheat validation. Launch-ready polish.

## Key Insights

1. **Leaderboard caching:** Redis sorted sets for real-time rankings, synced to PostgreSQL every 5 minutes. Region detection via IP geolocation (MaxMind GeoIP2 lite - free)
2. **Profile as retention driver:** Session history and K/D ratio give players a reason to return. "Best score" creates personal goals
3. **Spectator mode:** 5-10 second delay prevents "ghosting" (spectator feeding info to player). Follow camera with smooth pan between top players
4. **Anti-cheat priority:** Speed validation (reject >5.0), teleport detection (reject >100px/tick jumps), rate limiting (max 60 inputs/s). Flag + auto-ban after 3 violations
5. **Launch readiness:** This phase must end with production deployment on DigitalOcean, SSL, monitoring, and basic auto-scaling script

## Requirements

| FR | Feature | Implementation Tasks |
|----|---------|---------------------|
| FR-12 | Regional leaderboards | S-04 screen with Global/NA/EU/Asia tabs. GET /leaderboard/{region}. IP geolocation for auto-region. Redis sorted sets, 5-min sync to PG. Top 100 per region |
| FR-13 | Player stats | S-05 screen: total kills/deaths, K/D ratio, avg rank, total playtime, best score, session history (last 20). GET /users/me/stats, GET /users/me/sessions. Owned skins grid |
| FR-14 | Spectator mode | "Spectate" button in lobby (top 10 players). Camera follows selected snake. Smooth pan between players. 5-10s delay buffer. Exit anytime. WS `spectate-join` + `spectate-state` events |
| FR-15 | Basic anti-cheat | Server validates: speed bounds [2.5, 5.0], position delta per tick (<max_speed * dt * 1.1 tolerance), boost mass consumption. Flag violations. Auto-ban after 3 flags. Log all violations |

## Architecture

### Client Additions

```
client/src/
  scenes/
    LeaderboardScene.ts   - NEW: S-04 full screen, region tabs, top 100 table
    ProfileScene.ts       - NEW: S-05 two-column layout, stats + session history
    LobbyScene.ts         - MODIFY: Add leaderboard card, spectate button
    GameScene.ts          - MODIFY: Add spectator camera mode
  managers/
    SpectatorManager.ts   - NEW: Spectator camera, player switching, delay buffer
  ui/
    LeaderboardTable.ts   - NEW: Sortable table component, top 3 gold/silver/bronze
    StatsCard.ts          - NEW: Stats display with icons and color-coded K/D
    SessionHistoryTable.ts - NEW: Paginated session list
    RegionTabs.ts         - NEW: Tab bar for region switching
```

### Server Additions

```
server/src/
  routes/
    leaderboard-routes.ts - NEW: GET /leaderboard, GET /leaderboard/{region}
  services/
    LeaderboardService.ts - NEW: Redis sorted sets, PG sync, region caching
    GeoipService.ts       - NEW: MaxMind GeoIP2 Lite integration
    AntiCheatService.ts   - NEW: Movement validation, violation tracking, auto-ban
  websocket/
    spectator-events.ts   - NEW: spectate-join, spectate-leave, spectate-state
  game/
    SpectatorManager.ts   - NEW: Server-side spectator state, delay buffer
  models/
    LeaderboardEntry.ts   - NEW: Sequelize model (E-06)
```

## Related Code Files

### Files to Create

| File | Purpose | Lines (est.) |
|------|---------|-------------|
| `client/src/scenes/LeaderboardScene.ts` | S-04: Region tabs + top 100 table | ~180 |
| `client/src/scenes/ProfileScene.ts` | S-05: Stats + session history | ~180 |
| `client/src/managers/SpectatorManager.ts` | Spectator camera + player switching | ~100 |
| `client/src/ui/LeaderboardTable.ts` | Sortable table with rank styling | ~120 |
| `client/src/ui/StatsCard.ts` | Stats grid with icons | ~60 |
| `client/src/ui/SessionHistoryTable.ts` | Paginated session list | ~80 |
| `client/src/ui/RegionTabs.ts` | Tab bar component | ~50 |
| `server/src/routes/leaderboard-routes.ts` | Leaderboard REST endpoints | ~60 |
| `server/src/services/LeaderboardService.ts` | Redis sorted sets + PG sync | ~120 |
| `server/src/services/GeoipService.ts` | IP-to-region lookup | ~50 |
| `server/src/services/AntiCheatService.ts` | Movement validation + ban logic | ~120 |
| `server/src/websocket/spectator-events.ts` | Spectator WS events | ~80 |
| `server/src/game/SpectatorManager.ts` | Server spectator state | ~80 |
| `server/src/models/LeaderboardEntry.ts` | Sequelize model | ~40 |
| `migrations/004_leaderboard_entries.sql` | leaderboard_entries table | ~30 |

### Files to Modify

| File | Changes |
|------|---------|
| `client/src/scenes/LobbyScene.ts` | Add leaderboard card (rank display), spectate button, profile icon link |
| `client/src/scenes/GameScene.ts` | Spectator camera mode toggle, spectator HUD (player name, switch buttons) |
| `client/src/scenes/DeathScene.ts` | "View Leaderboards" link -> navigate to S-04 |
| `server/src/server.ts` | Register leaderboard routes |
| `server/src/websocket/socket-handler.ts` | Route spectator events |
| `server/src/game/GameLoop.ts` | Integrate anti-cheat validation per tick |
| `server/src/game/SnakeManager.ts` | Add speed/position validation hooks |
| `server/src/routes/user-routes.ts` | Ensure stats endpoint returns computed fields |
| `docker-compose.yml` | Add GeoIP database volume mount |
| `docker-compose.prod.yml` | Production resource limits, health checks, SSL config |

## Implementation Steps

### Week 13: Regional Leaderboards (S-04)

1. **Leaderboard model:** Write `server/src/models/LeaderboardEntry.ts` (Sequelize). Match E-06 schema. Write `migrations/004_leaderboard_entries.sql`
2. **Leaderboard service:** Write `server/src/services/LeaderboardService.ts`. Redis sorted sets: `ZADD leaderboard:{region} {score} {user_id}`. Sync to PostgreSQL every 5 minutes via cron job. Score = best session max_length (or composite: kills * 10 + max_length)
3. **Leaderboard routes:** Write `server/src/routes/leaderboard-routes.ts`. GET /leaderboard: global top 100. GET /leaderboard/{region}: regional top 100. Validate region (NA, EU, Asia). Cache response 5 minutes
4. **GeoIP service:** Write `server/src/services/GeoipService.ts`. Download MaxMind GeoIP2 Lite database (free, updated monthly). On user registration or first login: detect region from IP. Store in player.region. Allow manual override later
5. **Region tabs UI:** Write `client/src/ui/RegionTabs.ts`. Horizontal tab bar: Global | North America | Europe | Asia. Active tab: underline + primary color. Click triggers data fetch (cached 5 min client-side)
6. **Leaderboard table UI:** Write `client/src/ui/LeaderboardTable.ts`. Columns: Rank, Player, Score, K/D, Games. Top 3: gold/silver/bronze gradient row. Current player: highlighted with neon glow border. Striped rows. Player name clickable -> S-05
7. **Leaderboard scene (S-04):** Write `client/src/scenes/LeaderboardScene.ts`. Back button -> S-01. Header: trophy icon + "LEADERBOARDS" (Orbitron). RegionTabs. LeaderboardTable. "View My Profile" button at bottom. If player rank >100: show "Your Rank: #X" below table
8. **Lobby integration:** Modify `client/src/scenes/LobbyScene.ts`. Add "Leaderboard" card showing player's current rank. Click navigates to S-04. Modify DeathScene: "View Leaderboards" link navigates to S-04
9. **Verify:** View leaderboard in all 4 regions. See own rank highlighted. Navigate from lobby and death screen

### Week 14: Player Profile (S-05)

10. **Stats endpoint enhancement:** Ensure GET /users/me/stats returns all fields: total_kills, total_deaths, kd_ratio (computed), total_playtime, avg_rank (computed from sessions), best_score (max of max_length from sessions), games_played (count of sessions), win_rate (top 3 finish rate)
11. **Sessions endpoint enhancement:** Ensure GET /users/me/sessions returns: id, kills, deaths, rank, max_length, duration, timestamp. Paginated (limit/offset). Default last 20, sorted by timestamp DESC
12. **Stats card UI:** Write `client/src/ui/StatsCard.ts`. Key-value grid with icons. K/D color-coded: green if >2, yellow if 1-2, red if <1. Best score in large Orbitron font with glow. Total playtime formatted "Xh Ym"
13. **Session history table:** Write `client/src/ui/SessionHistoryTable.ts`. Columns: Date, Rank, Kills, Deaths, Duration. Date format: relative (<24h: "2 hours ago") or "MM/DD HH:mm". Best rank row highlighted green, worst red. "Load More" button for pagination
14. **Profile scene (S-05):** Write `client/src/scenes/ProfileScene.ts`. Two-column layout (stats left, history right -> single column below 1400px). Top: avatar placeholder (120x120px circle), username, rank, join date, premium badge. Stats card. Owned skins grid (5 cols, 60px circles, checkmark on owned, lock on locked). Session history table
15. **Profile navigation:** Lobby: profile icon (top-right) -> S-05. Leaderboard: click player name -> S-05 (other player's profile, read-only). Back button -> previous screen
16. **Public profiles:** GET /users/:id/stats (public, read-only). Only show: username, total_kills, total_deaths, kd_ratio, games_played, best_score. Hide: email, coins, owned_skins
17. **Verify:** View own profile. See stats. See session history. Click player name on leaderboard -> view their profile

### Week 15: Spectator Mode + Anti-Cheat

18. **Anti-cheat service:** Write `server/src/services/AntiCheatService.ts`. Per-tick validation: (a) Speed check: reject if speed > 5.0 or < 0. (b) Position delta: reject if distance moved > max_speed * dt * 1.1 (10% tolerance for float precision). (c) Boost validation: reject boost if mass <= 0. (d) Input rate: reject if >60 inputs/second. On violation: increment player violation_count. If count >= 3: auto-ban (set player.banned = true), disconnect socket, log
19. **Anti-cheat integration:** Modify `server/src/game/GameLoop.ts`. Before applying player input: run through AntiCheatService.validate(). If invalid: discard input, increment violation. Add `violation_count` and `banned` fields to players table (migration 005)
20. **Ban enforcement:** On socket connect: check if player.banned. If true: reject connection with error "Account suspended". In game events: skip banned players
21. **Spectator events (server):** Write `server/src/websocket/spectator-events.ts`. `spectate-join`: subscribe socket to room state broadcasts (read-only). `spectate-leave`: unsubscribe. `spectate-state`: same as game-state but with 5-10 second delay buffer
22. **Spectator manager (server):** Write `server/src/game/SpectatorManager.ts`. Maintain circular buffer of last 300 game states (5 seconds at 60Hz). Serve delayed states to spectators. Track which player spectator is following
23. **Spectator manager (client):** Write `client/src/managers/SpectatorManager.ts`. Camera follows selected snake (smooth lerp). UI: player name display, "< Prev" / "Next >" buttons to switch between top 10. "Exit Spectator" button. No input sent (read-only)
24. **GameScene spectator mode:** Modify `client/src/scenes/GameScene.ts`. If spectator mode: disable InputManager, show spectator HUD, use SpectatorManager for camera. Hide boost bar. Show "SPECTATING: [PlayerName]" label
25. **Lobby spectate button:** Modify `client/src/scenes/LobbyScene.ts`. If a room has players: show "Spectate" button. Click: join room as spectator (no snake spawned). Show list of top players in room
26. **Verify:** Spectate a game. Switch between players. 5s delay working. Exit to lobby. Anti-cheat: send invalid speed -> verify rejection + violation logged

### Week 16: Launch Preparation + Polish

27. **Production Docker stack:** Update `docker-compose.prod.yml`. Resource limits: backend 2 CPU / 2GB RAM, postgres 1 CPU / 2GB, redis 1 CPU / 1GB. Health checks on all services. Backend replicas: 1 (start, scale to 3 later)
28. **SSL setup:** Add Let's Encrypt certificate generation (certbot container or use Nginx Proxy Manager). Enforce HTTPS/WSS. Update nginx.conf for SSL termination
29. **Monitoring basics:** Add /health endpoint with service checks (PG connected, Redis connected, game loop running). PM2 monitoring. Log aggregation (Winston -> file). Error tracking (Sentry integration if budget allows)
30. **Auto-scaling script:** Write `scripts/scale-up.sh`. Monitor CPU/memory via Docker stats. If backend CPU >80% for 5 min: `docker-compose up -d --scale backend=N+1`. Max scale: 5 backends on single droplet
31. **Database optimization:** Run EXPLAIN ANALYZE on critical queries. Verify indexes used. Add connection pooling (PgBouncer config). Test with 1000 rows in each table
32. **Load testing:** Use Artillery or k6. Simulate 200 concurrent WebSocket connections. Verify: tick time <16ms, memory stable, no disconnects. Test reconnection under load
33. **Browser compatibility final check:** Test all 5 screens on Chrome, Firefox, Safari, Edge. Verify 1280x720 min resolution. Check font loading (Rajdhani, Orbitron). Test 1920x1080 optimal layout
34. **Privacy + legal pages:** Create privacy policy page (GDPR/CCPA). Terms of service. Cookie consent banner (opt-out). 13+ age gate (simple checkbox). Link from lobby footer
35. **Soft launch checklist:** Domain configured. SSL active. Docker stack on DigitalOcean. Database migrated. Seed data cleared. .env.production configured. Monitoring active. Backup script scheduled
36. **Deploy to DigitalOcean:** Create $40/mo droplet (4GB RAM, 2 CPU). Install Docker + Docker Compose. Clone repo. Configure .env.production. Run production stack. Verify via domain

## Todo List

### Regional Leaderboards (Week 13)
- [ ] Write LeaderboardEntry model + migration [FR-12]
- [ ] Write LeaderboardService.ts (Redis + PG sync) [FR-12]
- [ ] Write leaderboard-routes.ts (global + regional) [FR-12]
- [ ] Write GeoipService.ts (MaxMind integration) [FR-12]
- [ ] Write RegionTabs.ts (tab bar UI) [FR-12]
- [ ] Write LeaderboardTable.ts (sortable, styled) [FR-12]
- [ ] Write LeaderboardScene.ts (S-04 full screen) [FR-12]
- [ ] Update LobbyScene + DeathScene (nav links) [FR-12]
- [ ] Verify: all 4 regions, own rank highlight

### Player Profile (Week 14)
- [ ] Enhance stats + sessions endpoints [FR-13]
- [ ] Write StatsCard.ts (icons, color-coded K/D) [FR-13]
- [ ] Write SessionHistoryTable.ts (paginated) [FR-13]
- [ ] Write ProfileScene.ts (S-05 two-column) [FR-13]
- [ ] Profile navigation (lobby, leaderboard) [FR-13]
- [ ] Public profile endpoint (read-only) [FR-13]
- [ ] Verify: own profile, other profile, session history

### Spectator + Anti-Cheat (Week 15)
- [ ] Write AntiCheatService.ts (validation, ban) [FR-15]
- [ ] Integrate anti-cheat into GameLoop [FR-15]
- [ ] Write migration 005 (violation_count, banned) [FR-15]
- [ ] Ban enforcement on connect [FR-15]
- [ ] Write spectator-events.ts (server WS) [FR-14]
- [ ] Write SpectatorManager.ts (server delay buffer) [FR-14]
- [ ] Write SpectatorManager.ts (client camera) [FR-14]
- [ ] Update GameScene for spectator mode [FR-14]
- [ ] Update LobbyScene (spectate button) [FR-14]
- [ ] Verify: spectate with delay, anti-cheat rejects bad input

### Launch Prep (Week 16)
- [ ] Update docker-compose.prod.yml (resources, health) [NFR-AVAIL]
- [ ] SSL setup (Let's Encrypt + nginx) [NFR-SEC-06]
- [ ] Monitoring (health checks, logging) [NFR-MAINT-03]
- [ ] Auto-scaling script [NFR-SCALE-04]
- [ ] Database optimization (indexes, pooling) [NFR-SCALE-03]
- [ ] Load testing (200 CCU) [NFR-SCALE-01]
- [ ] Browser compatibility final check [NFR-USE-03]
- [ ] Privacy policy + ToS + cookie consent [NFR-LEGAL]
- [ ] Deploy to DigitalOcean production [NFR-AVAIL-01]
- [ ] Verify: full game flow on production domain

## Success Criteria

1. **Leaderboards:** 4 region tabs working. Top 100 loads in <1s. Updates every 5 min. Own rank visible
2. **Profile:** All stats accurate. Session history paginated. Public profiles accessible from leaderboard
3. **Spectator:** Can watch top 10 players. 5s delay enforced. Camera smooth. Switch between players
4. **Anti-cheat:** Speed hacks detected and rejected. Teleport detected. Auto-ban after 3 violations. <2% sessions with cheat reports post-launch
5. **Launch readiness:** Production on DigitalOcean. SSL active. 200 CCU stable. Monitoring working. Legal pages live
6. **Retention targets:** D1 >35%, D7 >18%. 30%+ users view leaderboards. Avg 3+ games/user/day

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| MaxMind GeoIP accuracy issues | Low | Medium | Allow manual region override in profile. Default to "Global" |
| Spectator delay buffer memory usage | Medium | Low | Circular buffer capped at 5s (300 states). Purge on spectator leave |
| Anti-cheat false positives | High | Medium | 10% tolerance on speed/position. Log all violations for manual review. Appeal process (Phase 4) |
| Load test reveals bottleneck | High | Medium | Profile early. Common fixes: reduce state broadcast size, increase tick interval, add Redis cluster |
| SSL certificate renewal automation | Low | Low | Use certbot with auto-renewal cron. Monitor cert expiry via health check |
| Launch day traffic spike | High | Low | Auto-scaling script ready. DigitalOcean Spaces for static CDN. Can upgrade droplet in <5 min |

## Security Considerations

- **Anti-cheat validation:** All movement validated server-side. No trust in client-reported positions [FR-15, NFR-SEC-03]
- **Spectator isolation:** Spectators cannot send game inputs. Read-only room access. Delay prevents information leaking [FR-14]
- **Rate limiting on leaderboard:** Cache responses 5 min. Prevent scraping with 100 req/min limit [NFR-SEC-05]
- **Public profile data:** Only expose non-sensitive fields (username, stats). Never expose email, coins, payment info [NFR-SEC]
- **Ban system:** Auto-ban is reversible (admin can unban). Violation logs stored for review. No permanent data deletion on ban [NFR-LEGAL-04]
- **SSL/TLS 1.3:** All traffic encrypted. HTTP redirects to HTTPS. WSS enforced [NFR-SEC-06]
- **GDPR compliance:** Account deletion cascades all data. Data export available. Privacy policy linked [NFR-LEGAL-02]

## Next Steps (Post-Launch)

- **Month 1-2:** Monitor retention, revenue, server costs. A/B test skin pricing, ad frequency
- **Month 3:** If 5000 DAU target met, begin Phase 4 planning (mobile app, ranked matchmaking, friends list)
- **Ongoing:** Weekly leaderboard resets (if decided), monthly GeoIP database update, security patches
- **Phase 4 candidates:** Ranked matchmaking (ELO), friends/party system, private rooms, custom skins, tournament mode
