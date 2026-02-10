# Phaser.js Multiplayer Best Practices Research (2026)

**Date:** 2026-02-10 | **Focus:** Server-authoritative architecture, state sync, interpolation, TypeScript patterns

---

## 1. Server-Authoritative Architecture

**Pattern:** Express + Socket.IO + Phaser (client rendering only)

Server runs the authoritative game state (positions, collisions, scores). Clients render & predict.

```typescript
// Server (Node.js)
const players = new Map();

io.on('connection', (socket) => {
  socket.on('move', (input) => {
    const player = players.get(socket.id);
    // Validate + update position server-side
    player.x += input.vx * 0.016; // 60fps tick
    player.y += input.vy * 0.016;

    // Broadcast authoritative state
    io.emit('state-update', {
      players: Array.from(players.values()),
      timestamp: Date.now()
    });
  });
});
```

**Why:** Prevents speed hacks, teleport cheats. Client can't modify its own state.

---

## 2. Phaser + Socket.IO Integration

**Client-side flow:**
1. Player presses key → emit input to server (no local update yet)
2. Receive server state → reconcile local prediction with truth
3. Interpolate other players between last two positions

```typescript
// Phaser scene (client)
class GameScene extends Phaser.Scene {
  preUpdate() {
    // Collect input locally
    if (this.cursors.left.isDown) {
      this.socket.emit('move', { vx: -200, vy: 0 });
    }
  }

  update() {
    // Interpolate remote players smoothly
    this.remoteSnakes.children.entries.forEach(sprite => {
      const target = this.positions.get(sprite.id);
      if (target) {
        sprite.x = Phaser.Math.Linear(sprite.x, target.x, 0.1);
        sprite.y = Phaser.Math.Linear(sprite.y, target.y, 0.1);
      }
    });
  }
}

socket.on('state-update', (data) => {
  // Update positions for interpolation
  data.players.forEach(p => {
    this.positions.set(p.id, { x: p.x, y: p.y });
  });
});
```

---

## 3. TypeScript Project Structure

```
src/
├── client/
│   ├── scenes/
│   │   ├── GameScene.ts       (main game loop, rendering)
│   │   └── UIScene.ts         (overlay, scores)
│   ├── network/
│   │   ├── SocketManager.ts   (emit/receive events)
│   │   └── types.ts           (Player, GameState, etc)
│   ├── physics/
│   │   ├── CollisionHandler.ts (client-side validation only)
│   │   └── Interpolator.ts    (smooth remote positions)
│   └── main.ts
├── server/
│   ├── game/
│   │   ├── GameState.ts       (authoritative state)
│   │   ├── SnakeLogic.ts      (physics, collisions)
│   │   └── FoodSpawner.ts
│   ├── network/
│   │   └── SocketManager.ts
│   └── index.ts
└── shared/
    ├── types.ts               (Player, Vec2, GameConfig)
    └── constants.ts
```

**Key:** Separate client rendering from server logic. Share only type definitions.

---

## 4. Network Interpolation (Smooth Multiplayer)

**Linear Interpolation:** Smoothly transition between two positions.

```typescript
class Interpolator {
  private lastPos: { x: number; y: number };
  private targetPos: { x: number; y: number };
  private lerpFactor = 0.15; // Adjust for network jitter

  update(sprite: Phaser.Physics.Arcade.Sprite) {
    sprite.x = Phaser.Math.Linear(sprite.x, this.targetPos.x, this.lerpFactor);
    sprite.y = Phaser.Math.Linear(sprite.y, this.targetPos.y, this.lerpFactor);
  }

  onStateUpdate(newPos: { x: number; y: number }) {
    this.lastPos = { ...this.targetPos };
    this.targetPos = newPos;
  }
}
```

**Jitter Reduction:**
- Keep `lerpFactor` between 0.08–0.15 (depends on server tick rate)
- Server sends updates at fixed rate (60Hz or 30Hz)
- Client extrapolates if packet delayed >50ms

---

## 5. Arcade Physics for Multiplayer

**Collision Detection (Server-Side):**

Arcade Physics handles AABB (rectangle) collision. For snake vs snake, snake vs food:

```typescript
// Server physics
this.physics.add.overlap(
  this.snakes,
  this.food,
  (snake, food) => {
    snake.length += 1;
    food.destroy();
    this.spawnFood();
  }
);

// Snake-to-snake collision
this.physics.add.overlap(
  this.snakes,
  this.snakes,
  (snake1, snake2) => {
    if (snake1.id !== snake2.id) {
      this.eliminateSnake(snake1.id);
    }
  }
);
```

**Client-Side:** Don't trust local collisions. Render only; server authorizes elimination.

```typescript
// Client: visual only, no game logic
this.physics.add.overlap(
  this.localSnake,
  this.remoteSnakes,
  () => {
    // Don't apply logic here. Wait for server confirmation.
    console.log('Visual collision detected');
  }
);
```

---

## 6. Client Prediction + Server Reconciliation

**Desync Problem:** Client predicts position, server computes differently.

**Solution:** Snapshot-based reconciliation.

```typescript
class PredictionEngine {
  private predictions: Array<{ tick: number; x: number; y: number }> = [];

  predictMovement(input: { vx: number; vy: number }) {
    const next = {
      tick: this.tick++,
      x: this.x + input.vx * 0.016,
      y: this.y + input.vy * 0.016
    };
    this.predictions.push(next);
    return next; // Show to player immediately
  }

  reconcile(serverSnapshot: { x: number; y: number; tick: number }) {
    // Server tick is authoritative
    this.x = serverSnapshot.x;
    this.y = serverSnapshot.y;

    // Discard stale predictions
    this.predictions = this.predictions.filter(p => p.tick > serverSnapshot.tick);

    // Replay remaining predictions
    this.predictions.forEach(p => {
      this.x += p.vx * 0.016;
      this.y += p.vy * 0.016;
    });
  }
}
```

---

## 7. 2026 Best Practices Summary

| Practice | Why | Implementation |
|----------|-----|-----------------|
| **Server Authority** | Prevents cheating | Validate all actions server-side |
| **Input Buffering** | 60Hz client, 30Hz server | Queue input; emit only changes |
| **Fixed Tick Rate** | Determinism | Use `setFixedTimestep(1/60)` |
| **TypeScript** | Type safety | Shared types in `/shared` folder |
| **Snapshot Sync** | Resync after prediction drift | Send full state every 2s or on major events |
| **Colyseus Alternative** | Managed multiplayer framework | Consider if building MMO-scale (100+ players) |

---

## 8. Recommended Stack for Snake Game

```
Client:  Phaser 3 (or v4 beta) + TypeScript + Socket.IO
Server:  Node.js + Express + Socket.IO + Arcade Physics (or custom)
Deploy:  Vercel (client), Railway/Heroku (server)
```

**Why Arcade Physics on Server?** Simple geometry (rectangles), fast, matches client rendering.

---

## Sources

- [Phaser - Creating a Multiplayer Phaser 3 Game](https://phaser.io/news/2019/03/creating-a-multiplayer-phaser-3-game-tutorial)
- [Phaser Socket.IO Multiplayer Tutorial](https://phaser.io/news/2017/03/socketio-multiplayer-tutorial)
- [Client Rendering from Authoritative Server - Phaser Discourse](https://phaser.discourse.group/t/client-rendering-from-authoritative-server/6486)
- [GitHub: Multiplayer Phaser3 TypeScript Template](https://github.com/TimTCrouch/Multiplayer-phaser3-typescript)
- [Arcade Physics API Docs](https://docs.phaser.io/api-documentation/class/physics-arcade-arcadephysics)
- [Phaser 3 - Real-Time Multiplayer Game with Physics](https://phaser.discourse.group/t/phaser-3-real-time-multiplayer-game-with-physics/1739)

---

## Unresolved Questions

1. **Tick rate strategy:** Should server run at 30Hz or 60Hz? (60Hz = more responsive but higher bandwidth)
2. **Colyseus vs Socket.IO:** Worth adopting Colyseus for automatic state sync, or stick with Socket.IO for simplicity?
3. **Physics engine:** Use Arcade Physics on server or custom snake logic?
