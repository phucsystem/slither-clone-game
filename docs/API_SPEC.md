# Interface Specification (API)

**Project:** Multiplayer Snake Game (Slither.io Clone)
**Version:** 1.0
**Date:** 2026-02-10
**Protocols:** REST API (HTTP/JSON) + WebSocket (Socket.io)

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-10 | Systems Architect | Initial API design from SRD requirements |

---

## 1. API Overview

### 1.1 Architecture

**Two Communication Layers:**

1. **REST API** (HTTP/JSON)
   - Base URL: `https://api.snakegame.com/v1`
   - Purpose: User management, persistence, monetization
   - Auth: JWT Bearer tokens
   - Rate Limit: 100 req/min per user

2. **WebSocket API** (Socket.io)
   - URL: `wss://game.snakegame.com`
   - Purpose: Real-time game state synchronization
   - Auth: JWT token in handshake
   - Update Rate: 20 Hz (server → client), 60 Hz (client → server)

### 1.2 Authentication

**JWT Token Structure:**
```json
{
  "user_id": "uuid",
  "username": "string",
  "ad_free": boolean,
  "owned_skins": ["string"],
  "exp": timestamp
}
```

**Token Lifetime:** 7 days
**Refresh:** Automatic on each API call (rolling window)

---

## 2. REST API Endpoints

### 2.1 Endpoint Matrix

| Method | URL | Feature (FR-xx) | Screen (S-xx) | Auth Required |
|--------|-----|-----------------|---------------|---------------|
| POST | `/auth/register` | - | S-01 | No |
| POST | `/auth/login` | - | S-01 | No |
| POST | `/auth/logout` | - | S-01 | Yes |
| GET | `/users/me` | FR-13 | S-01, S-05 | Yes |
| PATCH | `/users/me` | FR-13 | S-05 | Yes |
| GET | `/users/me/sessions` | FR-06, FR-13 | S-05 | Yes |
| GET | `/users/me/stats` | FR-13 | S-05 | Yes |
| GET | `/leaderboard` | FR-05, FR-12 | S-04 | No |
| GET | `/leaderboard/{region}` | FR-12 | S-04 | No |
| GET | `/skins` | FR-09 | S-01 | No |
| POST | `/skins/purchase` | FR-09 | S-01 | Yes |
| POST | `/skins/equip` | FR-09 | S-01 | Yes |
| POST | `/transactions/ad-free` | FR-10 | S-01 | Yes |
| POST | `/transactions/ad-view` | FR-08 | S-03 | Yes |
| GET | `/rooms/available` | FR-01 | S-01 | No |

---

### 2.2 Endpoint Details

#### POST /auth/register

**Description:** Create new user account

**Request:**
```json
{
  "username": "string (3-50 chars, alphanumeric + _ -)",
  "email": "string (valid email)",
  "password": "string (min 8 chars)"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "created_at": "ISO8601 timestamp",
    "owned_skins": ["classic-blue"],
    "ad_free_status": false,
    "coins": 0
  },
  "token": "JWT string"
}
```

**Errors:**
- `400` - Validation error (username taken, invalid email, weak password)
- `500` - Server error

**Related:** S-01 (Lobby), user account creation

---

#### POST /auth/login

**Description:** Authenticate user and return JWT

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "owned_skins": ["classic-blue", "mint-green"],
    "ad_free_status": false
  },
  "token": "JWT string"
}
```

**Errors:**
- `401` - Invalid credentials
- `429` - Rate limit exceeded (10 attempts/hour)

**Related:** S-01 (Lobby)

---

#### GET /users/me

**Description:** Get current user profile

**Auth:** Bearer token required

**Response (200 OK):**
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "created_at": "ISO8601",
  "owned_skins": ["string"],
  "ad_free_status": boolean,
  "coins": integer,
  "total_kills": integer,
  "total_deaths": integer,
  "total_playtime": integer (seconds),
  "region": "string (global|NA|EU|Asia)",
  "kd_ratio": float
}
```

**Related:** FR-13 (player stats), S-01 (Lobby), S-05 (Profile)

---

#### PATCH /users/me

**Description:** Update user profile (username only for MVP)

**Auth:** Bearer token required

**Request:**
```json
{
  "username": "string (optional, 3-50 chars)"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "username": "string (updated)",
  "updated_at": "ISO8601"
}
```

**Errors:**
- `400` - Validation error (username taken, invalid format)
- `401` - Unauthorized

**Related:** FR-13 (profile edit), S-05 (Profile)

---

#### GET /users/me/sessions

**Description:** Get player's recent game sessions

**Auth:** Bearer token required

**Query Params:**
- `limit` (optional, default 20, max 100)
- `offset` (optional, default 0)

**Response (200 OK):**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "room_id": "string",
      "kills": integer,
      "deaths": integer,
      "rank": integer,
      "max_length": integer,
      "duration": integer (seconds),
      "timestamp": "ISO8601"
    }
  ],
  "total": integer,
  "limit": integer,
  "offset": integer
}
```

**Related:** FR-06 (session stats), FR-13 (profile history), S-05 (Profile)

---

#### GET /users/me/stats

**Description:** Get aggregated player statistics

**Auth:** Bearer token required

**Response (200 OK):**
```json
{
  "user_id": "uuid",
  "total_kills": integer,
  "total_deaths": integer,
  "kd_ratio": float,
  "total_playtime": integer (seconds),
  "avg_rank": float,
  "best_score": integer,
  "games_played": integer,
  "win_rate": float (top 3 finish rate)
}
```

**Related:** FR-13 (player stats), S-05 (Profile)

---

#### GET /leaderboard

**Description:** Get global leaderboard (top 100 players)

**Auth:** Optional (public endpoint)

**Query Params:**
- `limit` (optional, default 100, max 100)

**Response (200 OK):**
```json
{
  "region": "global",
  "entries": [
    {
      "rank": integer,
      "user_id": "uuid",
      "username": "string",
      "score": integer,
      "kd_ratio": float,
      "games_played": integer,
      "is_premium": boolean
    }
  ],
  "updated_at": "ISO8601"
}
```

**Related:** FR-05 (leaderboard overlay), FR-12 (global leaderboard), S-04 (Leaderboards)

---

#### GET /leaderboard/{region}

**Description:** Get regional leaderboard (NA, EU, Asia)

**Path Params:**
- `region` (NA, EU, Asia)

**Auth:** Optional (public endpoint)

**Response (200 OK):**
```json
{
  "region": "string (NA|EU|Asia)",
  "entries": [
    {
      "rank": integer,
      "user_id": "uuid",
      "username": "string",
      "score": integer,
      "kd_ratio": float
    }
  ],
  "updated_at": "ISO8601"
}
```

**Errors:**
- `400` - Invalid region code

**Related:** FR-12 (regional leaderboards), S-04 (Leaderboards)

---

#### GET /skins

**Description:** Get list of all available skins with ownership status

**Auth:** Optional (if token provided, includes owned status)

**Response (200 OK):**
```json
{
  "skins": [
    {
      "id": "string (classic-blue)",
      "name": "string (Classic Blue)",
      "tier": "string (free|premium|premium+)",
      "price": float (USD, 0 if free),
      "description": "string",
      "colors": {
        "primary": "#4A90E2",
        "secondary": "#357ABD"
      },
      "owned": boolean (if authenticated),
      "equipped": boolean (if authenticated)
    }
  ]
}
```

**Related:** FR-09 (skin system), S-01 (Lobby skin gallery)

---

#### POST /skins/purchase

**Description:** Purchase a premium skin

**Auth:** Bearer token required

**Request:**
```json
{
  "skin_id": "string",
  "payment_method": "stripe|paypal",
  "payment_token": "string (from Stripe/PayPal SDK)"
}
```

**Response (200 OK):**
```json
{
  "transaction_id": "uuid",
  "skin_id": "string",
  "amount": float,
  "timestamp": "ISO8601",
  "user": {
    "owned_skins": ["classic-blue", "electric-purple"]
  }
}
```

**Errors:**
- `400` - Invalid skin_id, already owned, payment failed
- `402` - Payment required (insufficient funds)

**Related:** FR-09 (skin purchase), S-01 (Lobby)

---

#### POST /skins/equip

**Description:** Equip an owned skin

**Auth:** Bearer token required

**Request:**
```json
{
  "skin_id": "string"
}
```

**Response (200 OK):**
```json
{
  "equipped_skin": "string",
  "updated_at": "ISO8601"
}
```

**Errors:**
- `400` - Skin not owned or invalid skin_id
- `401` - Unauthorized

**Related:** FR-09 (skin selection), S-01 (Lobby)

---

#### POST /transactions/ad-free

**Description:** Purchase ad-free experience ($3.99)

**Auth:** Bearer token required

**Request:**
```json
{
  "payment_method": "stripe|paypal",
  "payment_token": "string"
}
```

**Response (200 OK):**
```json
{
  "transaction_id": "uuid",
  "type": "ad_free",
  "amount": 3.99,
  "timestamp": "ISO8601",
  "user": {
    "ad_free_status": true
  }
}
```

**Errors:**
- `400` - Already purchased, payment failed
- `402` - Payment required

**Related:** FR-10 (ad-free purchase), S-01 (Lobby)

---

#### POST /transactions/ad-view

**Description:** Log ad view event (for analytics)

**Auth:** Bearer token required

**Request:**
```json
{
  "ad_network": "string (google-adsense)",
  "ad_id": "string",
  "duration": integer (seconds watched)
}
```

**Response (200 OK):**
```json
{
  "transaction_id": "uuid",
  "coins_earned": integer (0 for now, future reward)
}
```

**Related:** FR-08 (video ads), S-03 (Death Screen)

---

#### GET /rooms/available

**Description:** Get list of available rooms (not full)

**Auth:** Optional

**Response (200 OK):**
```json
{
  "rooms": [
    {
      "room_id": "string",
      "player_count": integer,
      "max_players": 50,
      "status": "active",
      "avg_ping": integer (ms, estimated)
    }
  ]
}
```

**Related:** FR-01 (room matchmaking), S-01 (Lobby)

**Note:** In MVP, client auto-joins first available room. This endpoint supports future custom room selection.

---

## 3. WebSocket API (Socket.io)

### 3.1 Connection & Authentication

**Connect:**
```javascript
const socket = io('wss://game.snakegame.com', {
  auth: {
    token: 'JWT_TOKEN_HERE'
  }
});
```

**Events:**
- `connect` - Connection established
- `authenticated` - Server confirmed JWT valid
- `error` - Authentication or connection error
- `disconnect` - Connection lost

---

### 3.2 Client → Server Events

#### Event: `join-room`

**Description:** Join or create a game room

**Payload:**
```json
{
  "user_id": "uuid",
  "username": "string",
  "equipped_skin": "string"
}
```

**Response Event:** `room-joined`
```json
{
  "room_id": "string",
  "player_count": integer,
  "players": [
    {
      "user_id": "uuid",
      "username": "string",
      "skin": "string"
    }
  ]
}
```

**Related:** FR-01 (room matchmaking), S-02 (Game)

---

#### Event: `player-input`

**Description:** Send player movement input

**Frequency:** 60 Hz (every ~16ms)

**Payload:**
```json
{
  "direction": float (radians, 0-2π),
  "boost_active": boolean,
  "timestamp": integer (client timestamp for reconciliation)
}
```

**No Direct Response** (server broadcasts state updates via `game-state`)

**Related:** FR-02 (snake movement), FR-07 (client prediction), S-02 (Game)

---

#### Event: `leave-room`

**Description:** Gracefully leave current room

**Payload:**
```json
{
  "room_id": "string"
}
```

**Response Event:** `room-left`

**Related:** S-03 (Death Screen) → S-01 (Lobby)

---

### 3.3 Server → Client Events

#### Event: `game-state`

**Description:** Broadcast full game state to all players in room

**Frequency:** 20 Hz (every 50ms)

**Payload:**
```json
{
  "room_id": "string",
  "timestamp": integer (server timestamp),
  "snakes": [
    {
      "user_id": "uuid",
      "username": "string",
      "position": {"x": float, "y": float},
      "segments": [{"x": float, "y": float}],
      "length": integer,
      "speed": float,
      "direction": float,
      "boost_active": boolean,
      "alive": boolean,
      "skin": "string"
    }
  ],
  "food": [
    {
      "id": "string",
      "position": {"x": float, "y": float},
      "value": integer,
      "color": "string"
    }
  ],
  "leaderboard": [
    {
      "user_id": "uuid",
      "username": "string",
      "length": integer
    }
  ]
}
```

**Related:** FR-02 (movement), FR-03 (food), FR-04 (collision), FR-05 (leaderboard), FR-07 (interpolation), S-02 (Game)

**Optimization:** Use delta updates in Phase 2 to reduce bandwidth

---

#### Event: `player-death`

**Description:** Notify specific player of their death

**Payload:**
```json
{
  "user_id": "uuid",
  "killer_id": "uuid (or null if self-collision)",
  "killer_username": "string (or null)",
  "stats": {
    "rank": integer,
    "kills": integer,
    "deaths": 1,
    "max_length": integer,
    "duration": integer (seconds)
  }
}
```

**Related:** FR-04 (collision detection), FR-06 (death stats), S-03 (Death Screen)

---

#### Event: `food-collected`

**Description:** Broadcast food collection event

**Payload:**
```json
{
  "user_id": "uuid",
  "food_id": "string",
  "new_length": integer
}
```

**Related:** FR-03 (food spawning), FR-04 (collision)

---

#### Event: `player-joined`

**Description:** Broadcast when new player joins room

**Payload:**
```json
{
  "user_id": "uuid",
  "username": "string",
  "skin": "string"
}
```

**Related:** FR-01 (matchmaking)

---

#### Event: `player-left`

**Description:** Broadcast when player leaves room

**Payload:**
```json
{
  "user_id": "uuid",
  "reason": "string (disconnect|death|quit)"
}
```

**Related:** S-03 (Death Screen)

---

#### Event: `error`

**Description:** Send error message to client

**Payload:**
```json
{
  "code": "string (ROOM_FULL|INVALID_INPUT|SERVER_ERROR)",
  "message": "string"
}
```

---

### 3.4 WebSocket Protocol Flow

**Typical Game Session:**

```
Client                          Server
  |                               |
  |--- connect (JWT) ------------>|
  |<-- authenticated --------------|
  |                               |
  |--- join-room ----------------->|
  |<-- room-joined ----------------|
  |                               |
  |--- player-input (60Hz) ------->|
  |<-- game-state (20Hz) ----------|
  |<-- game-state (20Hz) ----------|
  |                               |
  |<-- player-death --------------|
  |                               |
  |--- leave-room ---------------->|
  |<-- room-left ------------------|
  |                               |
  |--- disconnect ---------------->|
```

---

## 4. Rate Limiting

### 4.1 REST API Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/register` | 5 req | 1 hour |
| `/auth/login` | 10 req | 1 hour |
| All other endpoints | 100 req | 1 minute |

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1707567600 (Unix timestamp)
```

**Error (429 Too Many Requests):**
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retry_after": 60 (seconds)
}
```

### 4.2 WebSocket Limits

| Event | Limit | Action |
|-------|-------|--------|
| `player-input` | 60 Hz | Discard excess events |
| `join-room` | 5 / minute | Disconnect on abuse |
| Connection attempts | 10 / minute | IP ban for 10 min |

---

## 5. Error Handling

### 5.1 Standard Error Response

**REST API:**
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "username",
    "reason": "already_taken"
  }
}
```

**WebSocket:**
```json
{
  "event": "error",
  "code": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### 5.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Action not allowed |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `ROOM_FULL` | WS | Room at capacity (50 players) |
| `INVALID_INPUT` | WS | Malformed WebSocket message |

---

## 6. Data Models

### 6.1 User Model

```typescript
interface User {
  id: string; // UUID
  username: string; // 3-50 chars
  email: string;
  created_at: string; // ISO8601
  owned_skins: string[]; // skin IDs
  ad_free_status: boolean;
  coins: number; // virtual currency
  total_kills: number;
  total_deaths: number;
  total_playtime: number; // seconds
  region: 'global' | 'NA' | 'EU' | 'Asia';
  kd_ratio: number; // computed
}
```

### 6.2 Session Model

```typescript
interface PlayerSession {
  id: string; // UUID
  user_id: string; // FK to User
  room_id: string;
  kills: number;
  deaths: number;
  rank: number;
  max_length: number;
  duration: number; // seconds
  timestamp: string; // ISO8601
}
```

### 6.3 Snake Model (WebSocket)

```typescript
interface Snake {
  user_id: string;
  username: string;
  position: {x: number, y: number};
  segments: Array<{x: number, y: number}>;
  length: number;
  speed: number;
  direction: number; // radians
  boost_active: boolean;
  alive: boolean;
  skin: string;
}
```

### 6.4 Skin Model

```typescript
interface Skin {
  id: string;
  name: string;
  tier: 'free' | 'premium' | 'premium+';
  price: number; // USD
  description: string;
  colors: {
    primary: string; // hex
    secondary: string; // hex
  };
  owned?: boolean; // only if authenticated
  equipped?: boolean; // only if authenticated
}
```

---

## 7. Security Measures

### 7.1 Input Validation

**Server-Side Validation (ALL inputs):**
- Username: 3-50 chars, `^[a-zA-Z0-9_-]+$`
- Email: RFC 5322 compliant
- Password: Min 8 chars, complexity check
- Snake position: Within map bounds (0-5000)
- Snake speed: Within valid range (2.5-5.0)

**Anti-Cheat Validation:**
- Server validates ALL snake movements (FR-15)
- Detect impossible speeds/jumps
- Flag suspicious accounts (>3 violations = auto-ban)

### 7.2 CORS Policy

**Allowed Origins:**
```
https://snakegame.com
https://www.snakegame.com
http://localhost:3000 (dev only)
```

**Headers:**
```
Access-Control-Allow-Origin: https://snakegame.com
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400
```

### 7.3 HTTPS/WSS Enforcement

- All REST API calls MUST use HTTPS
- All WebSocket connections MUST use WSS (TLS 1.3)
- HTTP/WS connections redirected to HTTPS/WSS

---

## 8. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| REST API response time | <100ms (p95) | Server logs |
| WebSocket message latency | <50ms (p95) | Client→Server→Client roundtrip |
| WebSocket broadcast delay | <50ms | Server timestamp in payload |
| Concurrent connections | 500 CCU/server | Load balancer metrics |
| Room state update rate | 20 Hz | Server game loop |

---

## 9. API Versioning

**Strategy:** URL-based versioning

**Current:** `/v1/*`

**Future:** `/v2/*` (backward incompatible changes)

**Deprecation Policy:**
- v1 supported for 6 months after v2 launch
- Clients warned via `X-API-Version-Deprecated` header

---

## 10. Traceability Matrix

| Endpoint/Event | FR-xx | Screen | Entity |
|----------------|-------|--------|--------|
| `POST /auth/register` | - | S-01 | E-01 (Player) |
| `POST /auth/login` | - | S-01 | E-01 |
| `GET /users/me` | FR-13 | S-01, S-05 | E-01 |
| `GET /users/me/sessions` | FR-06, FR-13 | S-05 | E-02 (PlayerSession) |
| `GET /leaderboard` | FR-05, FR-12 | S-04 | E-06 (LeaderboardEntry) |
| `POST /skins/purchase` | FR-09 | S-01 | E-07 (Transaction) |
| `POST /transactions/ad-free` | FR-10 | S-01 | E-07 |
| `POST /transactions/ad-view` | FR-08 | S-03 | E-07 |
| `WS: join-room` | FR-01 | S-02 | E-05 (Room) |
| `WS: player-input` | FR-02 | S-02 | E-03 (Snake) |
| `WS: game-state` | FR-02-07 | S-02 | E-03, E-04, E-06 |
| `WS: player-death` | FR-04, FR-06 | S-03 | E-02 |

**Coverage:** 13/15 FR requirements have API support (93%)
- FR-14 (Spectator) - Phase 3
- FR-15 (Anti-cheat) - Server-side validation, not explicit API

---

## 11. Sample API Calls

### 11.1 Complete Game Flow

**1. Register/Login:**
```bash
curl -X POST https://api.snakegame.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"player@example.com","password":"secret123"}'

# Response: {"user":{...},"token":"eyJhbGc..."}
```

**2. Get Profile:**
```bash
curl -X GET https://api.snakegame.com/v1/users/me \
  -H "Authorization: Bearer eyJhbGc..."

# Response: {"id":"...","username":"ProGamer","owned_skins":[...]}
```

**3. Connect to Game (WebSocket):**
```javascript
const socket = io('wss://game.snakegame.com', {
  auth: {token: 'eyJhbGc...'}
});

socket.on('authenticated', () => {
  socket.emit('join-room', {
    user_id: 'uuid',
    username: 'ProGamer',
    equipped_skin: 'electric-purple'
  });
});

socket.on('game-state', (state) => {
  // Render snakes, food, leaderboard
});
```

**4. Purchase Skin:**
```bash
curl -X POST https://api.snakegame.com/v1/skins/purchase \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"skin_id":"electric-purple","payment_method":"stripe","payment_token":"tok_123"}'

# Response: {"transaction_id":"...","amount":0.99}
```

---

## 12. Next Steps

**After API Design Approval:**
1. **Generate OpenAPI/Swagger Spec** → Auto-generate API docs
2. **Set Up API Gateway** → Rate limiting, CORS, logging
3. **Implement REST Endpoints** → Express.js routes
4. **Implement WebSocket Server** → Socket.io event handlers
5. **Run `/plan`** → Generate implementation tasks

---

**End of Document**

**Status:** Ready for Review
**Next Command:** `/plan @docs/ @prototypes/` to create implementation plan
