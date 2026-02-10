# Phase 2: Monetization Foundation (Weeks 9-12)

## Context Links

- [SRD](../../docs/SRD.md) - FR-08 to FR-11, NFR-LEGAL
- [UI_SPEC](../../docs/UI_SPEC.md) - S-01 (Skin Gallery Modal), S-03 (Video Ad + Skin Upsell)
- [API_SPEC](../../docs/API_SPEC.md) - Skin endpoints, transaction endpoints, ad-view logging
- [DB_DESIGN](../../docs/DB_DESIGN.md) - transactions table (E-07), player owned_skins/coins
- [Phase 1](./phase-01-core-gameplay.md) - Prerequisite: complete game loop, auth, Docker stack
- [Docker Setup](../../docs/DOCKER-SETUP.md) - Existing Docker stack to extend

## Overview

- **Priority:** P2 (High)
- **Status:** pending
- **Duration:** 5 weeks (Weeks 8-12) <!-- Updated: Validation Session 1 - Added full auth from Phase 1, +1 week -->
- **Description:** Add full authentication system (email/password, registration, JWT), revenue streams (video ads on death screen), cosmetic skin system with Stripe/PayPal purchases, ad-free premium option, daily login rewards with virtual currency, and guest-to-registered account migration. Target: $0.30 revenue/DAU.

## Key Insights

1. **Ad placement timing:** Show stats immediately on death (user wants closure), THEN load ad asynchronously. "Skip Ad" after 5 seconds. Industry standard for .io games
2. **Skin pricing:** Free tier (3 skins) + premium ($0.99-$2.99). One-time purchase model. Avoid loot boxes (regulatory risk). Direct purchase = higher trust
3. **Ad-free conversion:** $3.99 one-time purchase. Target 1-3% of active users. Premium badge in leaderboard as social incentive
4. **Daily login rewards:** Escalating coins (Day 1: 100, Day 7: 500). Streak resets on miss. Drives D7 retention. Coins usable for future skin discounts (Phase 3+)
5. **Revenue split target:** 50% ads, 30% skins, 20% ad-free subscriptions

## Requirements

| FR | Feature | Implementation Tasks |
|----|---------|---------------------|
| FR-08 | Video ads on death | Google AdSense integration, ad container in DeathScene, 5-15s video, skip after 5s, fallback to static, track impressions via POST /transactions/ad-view, skip for premium users |
| FR-09 | Skin system | 3 free + 5-8 premium skins, Skin Gallery Modal in Lobby, preview before purchase, Stripe/PayPal checkout, POST /skins/purchase, POST /skins/equip, render in-game |
| FR-10 | Ad-free option | $3.99 one-time, POST /transactions/ad-free, update player.ad_free_status, premium badge in leaderboard, skip ad on death |
| FR-11 | Daily login rewards | Escalating coin rewards (100-500), streak tracking, popup on lobby entry, visual calendar, update player.coins |

## Architecture

### Client Additions

```
client/src/
  scenes/
    LobbyScene.ts        - MODIFY: Add skin selector card, rewards card, login reward popup
    DeathScene.ts         - MODIFY: Add video ad container, skip button, skin upsell
  managers/
    SkinManager.ts        - NEW: Skin catalog, equip logic, preview rendering
    AdManager.ts          - NEW: Google AdSense integration, ad loading, impression tracking
    RewardManager.ts      - NEW: Daily login streak tracking, coin display
  ui/
    SkinGalleryModal.ts   - NEW: Grid of skins, purchase flow, equip button
    RewardCalendar.ts     - NEW: 7-day streak calendar popup
    PaymentModal.ts       - NEW: Stripe/PayPal payment form wrapper
    PremiumBadge.ts       - NEW: Badge component for leaderboard
  assets/
    skins/                - NEW: 8 snake skin sprite sheets (PNG)
```

### Server Additions

```
server/src/
  routes/
    skin-routes.ts        - NEW: GET /skins, POST /skins/purchase, POST /skins/equip
    transaction-routes.ts - NEW: POST /transactions/ad-free, POST /transactions/ad-view
  services/
    SkinService.ts        - NEW: Skin catalog, purchase validation, equip logic
    PaymentService.ts     - NEW: Stripe/PayPal integration, webhook handling
    RewardService.ts      - NEW: Daily login streak, coin distribution
  models/
    Transaction.ts        - NEW: Sequelize model (E-07)
  config/
    skins-catalog.ts      - NEW: Skin definitions (id, name, tier, price, colors)
```

## Related Code Files

### Files to Create

| File | Purpose | Lines (est.) |
|------|---------|-------------|
| `client/src/managers/SkinManager.ts` | Skin catalog + equip/preview | ~100 |
| `client/src/managers/AdManager.ts` | AdSense integration + tracking | ~80 |
| `client/src/managers/RewardManager.ts` | Daily login reward logic | ~60 |
| `client/src/ui/SkinGalleryModal.ts` | Skin grid + purchase UI | ~150 |
| `client/src/ui/RewardCalendar.ts` | 7-day streak popup | ~80 |
| `client/src/ui/PaymentModal.ts` | Stripe Elements wrapper | ~100 |
| `client/src/ui/PremiumBadge.ts` | Leaderboard premium indicator | ~30 |
| `client/src/assets/skins/*.png` | 8 skin sprite sheets | N/A |
| `server/src/routes/skin-routes.ts` | Skin REST endpoints | ~80 |
| `server/src/routes/transaction-routes.ts` | Transaction endpoints | ~60 |
| `server/src/services/SkinService.ts` | Skin business logic | ~80 |
| `server/src/services/PaymentService.ts` | Stripe/PayPal wrapper | ~120 |
| `server/src/services/RewardService.ts` | Daily reward logic | ~80 |
| `server/src/models/Transaction.ts` | Sequelize Transaction model | ~50 |
| `server/src/config/skins-catalog.ts` | Static skin definitions | ~60 |
| `migrations/002_transactions_table.sql` | transactions table + indexes | ~40 |

### Files to Modify

| File | Changes |
|------|---------|
| `client/src/scenes/LobbyScene.ts` | Add skin selector card, rewards card, daily reward popup |
| `client/src/scenes/DeathScene.ts` | Add ad container, skip button, skin upsell card |
| `client/src/scenes/GameScene.ts` | Render premium badge on leaderboard overlay |
| `client/src/entities/Snake.ts` | Support all 8 skin color configs + premium glow effects |
| `server/src/server.ts` | Register new routes (skins, transactions) |
| `server/src/websocket/game-events.ts` | Include skin in snake spawn data |
| `server/src/game/LeaderboardManager.ts` | Include is_premium flag in leaderboard entries |
| `docker-compose.yml` | Add Stripe webhook endpoint config if needed |

## Implementation Steps

### Week 9: Skin System

1. **Skin catalog:** Write `server/src/config/skins-catalog.ts`. Define 8 skins: 3 free (Classic Blue #4A90E2, Mint Green #50E3C2, Sunset Orange #FF9500) + 5 premium (Electric Purple #BD10E0 $0.99, Golden Emperor #FFD700 $1.99, Fire gradient $2.99, Neon gradient $1.99, Shadow #1A1A2E $0.99)
2. **Skin routes:** Write `server/src/routes/skin-routes.ts`. GET /skins: return catalog with owned/equipped status if authenticated. POST /skins/equip: validate ownership, update player equipped_skin
3. **Skin service:** Write `server/src/services/SkinService.ts`. getSkins(userId), equipSkin(userId, skinId), purchaseSkin(userId, skinId, transactionId)
4. **Client SkinManager:** Write `client/src/managers/SkinManager.ts`. Fetch skin catalog on lobby load. Track owned/equipped state. Preview rendering (animate snake with selected skin)
5. **Skin Gallery Modal:** Write `client/src/ui/SkinGalleryModal.ts`. Grid layout per UI_SPEC wireframe. Free skins: checkmark if owned. Premium skins: price tag, lock icon if not owned. Click to preview. "Equip" button for owned. "Purchase $X.XX" button for locked
6. **Snake entity update:** Modify `client/src/entities/Snake.ts`. Support all 8 color configs. Premium skins: add postFX glow. Fire/Neon skins: gradient rendering across segments
7. **Lobby integration:** Modify `client/src/scenes/LobbyScene.ts`. Add "Skins" card showing owned count. Click opens Skin Gallery Modal. Show equipped skin in snake preview
8. **Verify:** Browse skins in gallery. Equip free skin. See skin in-game. Premium skins show locked

### Week 10: Payment Integration

9. **Transaction model:** Write `server/src/models/Transaction.ts` (Sequelize). Match E-07 schema: id, user_id, type (ad_view|skin_purchase|ad_free), item_id, amount, timestamp, metadata
10. **Migration:** Write `migrations/002_transactions_table.sql`. Create transactions table with indexes
11. **Payment service:** Write `server/src/services/PaymentService.ts`. Stripe integration: create PaymentIntent, confirm payment, webhook handler. PayPal integration: create order, capture payment. Validate amounts match catalog prices
12. **Skin purchase route:** Write POST /skins/purchase handler. Validate: skin exists, not already owned, payment token valid. Create Stripe PaymentIntent or PayPal order. On success: add skin to player.owned_skins, create Transaction record
13. **Ad-free purchase:** Write `server/src/routes/transaction-routes.ts`. POST /transactions/ad-free: validate not already purchased, process $3.99 payment. Update player.ad_free_status = true. Create Transaction
14. **Payment modal:** Write `client/src/ui/PaymentModal.ts`. Embed Stripe Elements (card input). Or PayPal button. Show total, skin name, confirm button. Handle success/error states
15. **Premium badge:** Write `client/src/ui/PremiumBadge.ts`. Small pill component ("PREMIUM", primary color bg). Modify LeaderboardManager to include is_premium flag. Show badge next to premium usernames in HUD leaderboard and DeathScene
16. **Verify:** Purchase skin via Stripe test mode. Verify transaction in DB. Skin appears in owned list. Purchase ad-free. Verify ad_free_status = true

### Week 11: Ads + Death Screen Monetization

17. **Ad manager:** Write `client/src/managers/AdManager.ts`. Load Google AdSense script asynchronously (defer, load only on S-03). Request video ad on death event. Handle ad load success/failure. Track impression start/end times
18. **Death scene ads:** Modify `client/src/scenes/DeathScene.ts`. After showing stats (immediate): load ad container (640x360px, 16:9). Play video ad (5-15s). Show "Skip Ad" button after 5s countdown. Premium users: skip entire ad flow
19. **Ad-view logging:** On ad completion or skip: POST /transactions/ad-view with {ad_network, ad_id, duration}. Server creates Transaction record for analytics
20. **Fallback ads:** If video ad fails to load (no fill): show static banner ad (320x250). If all ads fail: skip ad entirely (don't block replay)
21. **Skin upsell on death:** Below "Play Again" button: small card "Unlock [Random Premium Skin Preview] for $X.XX". Rotate displayed skin each death. Click opens Skin Gallery
22. **Ad frequency control:** One ad per death (100% serve rate). No ads between consecutive deaths <30s apart (prevents frustration during bad streaks)
23. **Verify:** Die. See stats immediately. Ad loads after 1-2s. Skip after 5s. Click Play Again. Premium user: no ad shown

### Week 12: Daily Rewards + Polish

24. **Reward service:** Write `server/src/services/RewardService.ts`. Track last_login_date and streak_count on player. On lobby load: check if new day. If yes: increment streak (or reset if missed day). Award coins: Day 1=100, Day 2=150, Day 3=200, Day 4=250, Day 5=300, Day 6=400, Day 7=500. After Day 7: restart cycle
25. **Reward calendar UI:** Write `client/src/ui/RewardCalendar.ts`. 7-day grid popup. Show current streak day highlighted. Past days with checkmarks. Future days with coin amounts. Animation on claim (coins fly in)
26. **Lobby rewards card:** Modify `client/src/scenes/LobbyScene.ts`. Add "Rewards" card showing "Day X/7" streak. Click opens RewardCalendar. On first lobby entry of day: auto-show reward popup
27. **Player model update:** Add `last_login_date`, `streak_count` to players table (migration 003). Modify Player model
28. **Revenue analytics endpoint:** Add GET /admin/revenue (admin-only). Return: total ad views, total skin purchases, total ad-free purchases, revenue by day. Basic analytics for tracking Phase 2 success criteria
29. **Stripe webhook handler:** Add webhook endpoint for async payment confirmations. Handle: payment_intent.succeeded, payment_intent.payment_failed. Ensure idempotent processing
30. **End-to-end monetization test:** Full flow: play game -> die -> see ad -> skip -> buy skin -> equip -> play with skin -> die -> no duplicate ad charge. Test premium: buy ad-free -> die -> no ad shown
31. **Verify:** Log in, receive daily reward. Check coins updated. Buy skin with coins (future feature placeholder). All payment flows working in Stripe test mode

## Todo List

### Skin System (Week 9)
- [ ] Write skins-catalog.ts (8 skins: 3 free, 5 premium) [FR-09]
- [ ] Write skin-routes.ts (GET /skins, POST /equip) [FR-09]
- [ ] Write SkinService.ts [FR-09]
- [ ] Write client SkinManager.ts [FR-09]
- [ ] Write SkinGalleryModal.ts (grid, preview, equip) [FR-09]
- [ ] Update Snake.ts for all 8 skins + glow effects [FR-09]
- [ ] Update LobbyScene.ts (skins card, gallery trigger) [FR-09]
- [ ] Verify: browse, equip, see in-game

### Payments (Week 10)
- [ ] Write Transaction model [FR-09, FR-10]
- [ ] Write migrations/002_transactions_table.sql [FR-09, FR-10]
- [ ] Write PaymentService.ts (Stripe + PayPal) [FR-09, FR-10]
- [ ] Write POST /skins/purchase handler [FR-09]
- [ ] Write POST /transactions/ad-free handler [FR-10]
- [ ] Write PaymentModal.ts (Stripe Elements) [FR-09, FR-10]
- [ ] Write PremiumBadge.ts [FR-10]
- [ ] Update LeaderboardManager for is_premium [FR-10]
- [ ] Verify: purchase skin, purchase ad-free (Stripe test)

### Ads (Week 11)
- [ ] Write AdManager.ts (Google AdSense) [FR-08]
- [ ] Update DeathScene.ts (ad container, skip, fallback) [FR-08]
- [ ] Write POST /transactions/ad-view handler [FR-08]
- [ ] Implement ad fallback (static banner) [FR-08]
- [ ] Add skin upsell on death screen [FR-09]
- [ ] Ad frequency control (no spam) [FR-08]
- [ ] Verify: ad plays, skip works, premium skips ads

### Daily Rewards (Week 12)
- [ ] Write RewardService.ts (streak, coins) [FR-11]
- [ ] Write RewardCalendar.ts (7-day popup) [FR-11]
- [ ] Write migrations/003_player_rewards.sql [FR-11]
- [ ] Update LobbyScene.ts (rewards card, auto-popup) [FR-11]
- [ ] Revenue analytics endpoint [admin]
- [ ] Stripe webhook handler [FR-09, FR-10]
- [ ] End-to-end monetization test [all Phase 2 FRs]

## Success Criteria

1. **Ad fill rate:** >50% of death events show video ad
2. **Ad impressions:** 1.5-2.0 per session (avg 2-3 deaths per session)
3. **Skin purchase conversion:** >2% of registered users buy at least 1 skin
4. **Ad-free conversion:** >1% of active users purchase ad-free
5. **Revenue per DAU:** >$0.30 blended (ads + purchases)
6. **Daily reward engagement:** >60% of returning users claim daily reward
7. **No gameplay impact:** Skins are cosmetic-only, no pay-to-win

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Google AdSense approval delayed | High | Medium | Apply in Week 6 (Phase 1). Have fallback: self-hosted static ads initially |
| Low ad fill rate (<30%) | High | Medium | Multiple ad networks (AdSense + alternative). Static ad fallback |
| Stripe integration complexity | Medium | Low | Use Stripe Checkout (hosted) instead of custom Elements if needed |
| Skin sales below 1% | Medium | Medium | A/B test pricing. Add free skins via daily rewards. Featured skin rotations |
| Payment fraud/chargebacks | Medium | Low | Stripe Radar (built-in fraud detection). Limit purchases per hour |
| Ad blocker prevalence (30-40% of gamers) | High | High | Detect adblocker -> show soft prompt. Never block gameplay. Accept lost ad revenue |

## Security Considerations

- **Payment processing:** Never store card data. All through Stripe/PayPal tokens [NFR-SEC-07]
- **Purchase validation:** Server validates skin prices match catalog. No client-side price manipulation
- **Webhook verification:** Stripe webhook signatures verified. Idempotent transaction processing
- **Ad fraud prevention:** Server logs all ad-view events. Rate limit: max 1 ad-view per 10 seconds per user
- **Coin manipulation:** Server-side only. Client cannot set coin balance. All rewards server-validated
- **Transaction integrity:** All purchases wrapped in DB transactions. Rollback on payment failure

## Next Steps

- After Phase 2 complete: begin Phase 3 (Competitive Features)
- Monitor ad revenue daily. If below target: add second ad network (Week 13)
- A/B test skin pricing after 2 weeks of data (Week 14)
- Collect user feedback on ad frequency and placement
