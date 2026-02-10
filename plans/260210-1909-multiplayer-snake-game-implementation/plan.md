---
title: "Multiplayer Snake Game (Slither.io Clone) Implementation"
description: "16-week implementation plan: core gameplay, monetization, and competitive features using Phaser.js + Node.js + Docker"
status: in_progress
priority: P1
effort: 16w
branch: main
tags: [multiplayer, phaser, nodejs, docker, websocket, game]
created: 2026-02-10
---

# Multiplayer Snake Game - Implementation Plan

## Overview

Browser-based multiplayer snake game (slither.io clone) for desktop competitive gamers. Server-authoritative, 50 players/room, 60 FPS client, 60Hz server tick.

**Stack:** Phaser.js 3.70+ (TS) | Node.js 18 + Express + Socket.IO | PostgreSQL 14 | Redis 7 | Docker Compose | Nginx

## Phases

| Phase | Name | Duration | FRs | Status |
|-------|------|----------|-----|--------|
| 1 | [Core Gameplay](./phase-01-core-gameplay.md) | 7 weeks | FR-01 to FR-07 (guest-only auth) | in_progress (infrastructure complete, remaining: testing, polish, load testing) |
| 2 | [Monetization](./phase-02-monetization.md) | 5 weeks | FR-08 to FR-11 + full auth | pending |
| 3 | [Competitive](./phase-03-competitive.md) | 4 weeks | FR-12 to FR-15 | pending |

## Key Dependencies

- Phase 2 depends on Phase 1 completion (game loop, auth, Docker stack)
- Phase 3 depends on Phase 2 (player accounts must exist for stats/leaderboards)
- Stripe/PayPal integration (Phase 2) requires merchant account setup (~1 week lead)
- Google AdSense approval (Phase 2) requires live site with content (~2 week lead)

## Budget

- Hosting: $40/mo (Phase 1 dev), scaling to $300-500/mo at launch
- Domain + SSL: ~$15/yr
- Stripe fees: 2.9% + $0.30/transaction

## Related Docs

- [SRD](../../docs/SRD.md) | [UI_SPEC](../../docs/UI_SPEC.md) | [API_SPEC](../../docs/API_SPEC.md) | [DB_DESIGN](../../docs/DB_DESIGN.md)
- [Docker Setup](../../docs/DOCKER-SETUP.md)
- [Phaser Research](./reports/researcher-01-phaser-multiplayer.md)
- [Docker Research](./research/researcher-02-docker-nodejs.md)

## Success Criteria

- Phase 1: 60 FPS client, <50ms server latency, 50 CCU/room stable
- Phase 2: Ad fill >50%, skin conversion >2%, revenue/DAU >$0.30
- Phase 3: D7 retention >18%, <2% cheat reports, 5000 DAU by Month 6

---

## Validation Log

### Session 1 — 2026-02-10
**Trigger:** Initial plan creation after IPA documentation complete
**Questions asked:** 7

#### Questions & Answers

1. **[Architecture]** The plan uses a 60Hz server tick rate for physics. Research suggests 30Hz may suffice with better bandwidth efficiency. What's your priority?
   - Options: 60Hz as planned (Recommended) | 30Hz to save bandwidth | Start 60Hz, profile and optimize
   - **Answer:** 60Hz as planned (Recommended)
   - **Rationale:** Higher collision accuracy critical for competitive gameplay fairness. Matches SRD NFR-PERF-02. Easier debugging with higher tick rate.

2. **[Infrastructure]** Docker deployment: Self-hosted PostgreSQL in container (Phase 1) or DigitalOcean Managed Database from start?
   - Options: Self-hosted in Docker (Recommended) | DO Managed DB from start | Self-hosted MVP, managed for production
   - **Answer:** Self-hosted in Docker (Recommended)
   - **Rationale:** Cost-effective for MVP ($0 vs $15/mo). Can migrate to managed DB in Phase 3 if scaling demands it. Full control for development.

3. **[Scope]** Authentication: The plan includes full email/password auth in Phase 1. Do you need guest play (no account) first?
   - Options: Guest play only in Phase 1 (Recommended) | Full auth in Phase 1 as planned | Guest + optional registration
   - **Answer:** Guest play only in Phase 1 (Recommended)
   - **Rationale:** Reduces Phase 1 complexity by 1-2 weeks. Focus on core gameplay loop validation first. Add persistent accounts in Phase 2 with monetization.

4. **[Architecture]** Phaser Physics: Plan uses custom circle collision over Arcade Physics. Confirm this approach for Week 2-3 implementation?
   - Options: Custom circle collision (Recommended) | Phaser Arcade Physics AABB | Hybrid: Arcade for food, custom for snakes
   - **Answer:** Custom circle collision (Recommended)
   - **Rationale:** More accurate for snake head-to-body detection. Server-authoritative design requires custom logic anyway (Phaser physics runs client-side).

5. **[Quality]** Testing strategy: The plan doesn't explicitly mention automated tests. What's your approach for quality assurance?
   - Options: Manual testing only (MVP) | Unit tests for critical paths (Recommended) | E2E tests with Playwright
   - **Answer:** Unit tests for critical paths (Recommended)
   - **Rationale:** Test collision detection, room management, auth (Phase 2). Prevents regressions. Adds 1-2 weeks but improves stability.

6. **[Infrastructure]** SSL/HTTPS: How should SSL certificates be handled in Docker deployment?
   - Options: Let's Encrypt in container (Recommended) | DigitalOcean managed certificate | Cloudflare proxy
   - **Answer:** Let's Encrypt in container (Recommended)
   - **Rationale:** Free, auto-renewal with certbot sidecar. Self-managed for learning. Can switch to DO managed cert if ops burden too high.

7. **[Game Design]** Boost mechanic balance: Should boosting consume mass linearly or exponentially?
   - Options: Linear consumption (Recommended) | Exponential consumption | Decide after playtesting
   - **Answer:** Linear consumption (Recommended)
   - **Rationale:** Predictable for players, easier to balance initially. Implement in Week 2, can adjust formula in Week 7-8 based on alpha feedback.

#### Confirmed Decisions
- **Server tick rate:** 60Hz (per SRD, prioritizes accuracy over bandwidth)
- **Database hosting:** Self-hosted PostgreSQL in Docker (Phase 1-2), consider managed in Phase 3
- **Authentication:** Guest-only in Phase 1, defer full auth to Phase 2 (saves 1-2 weeks)
- **Collision detection:** Custom circle-based (server-authoritative)
- **Testing:** Add unit tests for collision, room, auth (Jest, +1-2 weeks to timeline)
- **SSL:** Let's Encrypt certbot in container (free, auto-renew)
- **Boost balance:** Linear mass consumption (simple, predictable)

#### Action Items
- [ ] Update Phase 1: Remove email/password auth, add guest username only (localStorage)
- [ ] Update Phase 1: Add Jest setup task (Week 1), unit tests for CollisionEngine (Week 3)
- [ ] Update Phase 1: Add Let's Encrypt certbot Docker service + nginx SSL config (Week 8)
- [ ] Update Phase 2: Add full email/password registration + login (move from Phase 1)
- [ ] Update Phase 2: Add guest-to-registered migration logic (preserve stats)
- [ ] Update timeline: Phase 1 now 7 weeks (saved 1 week from removing auth), Phase 2 now 5 weeks (added auth)

#### Impact on Phases
- **Phase 1:** Remove email/password auth routes, models, and JWT middleware. Replace with simple guest username (client-side localStorage). Add Jest + testing tasks for collision, room manager. Add Let's Encrypt certbot service to docker-compose.yml. Reduce duration: 8 weeks → 7 weeks.
- **Phase 2:** Add full authentication system (email/password, registration, login, JWT). Add migration endpoint to convert guest sessions to registered account. Increase duration: 4 weeks → 5 weeks.
- **Phase 3:** No changes (auth complete in Phase 2).
