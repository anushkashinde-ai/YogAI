# YogAI — Smart Yoga Companion

> **Find Your Balance. Master Every Pose.**

YogAI is a complete, production-shaped **MERN stack** wellness platform for learning yoga poses, practising with a camera-based posture coach, generating personalised routines, doing guided breathing/meditation, and tracking real progress.

It was built as a final-year engineering project and portfolio piece: every visible button is wired to a real API call and a real MongoDB write — there is no hardcoded "fake" data behind persistent features.

---

## Table of contents

1. [Feature overview](#1-feature-overview)
2. [Tech stack](#2-tech-stack)
3. [Project structure](#3-project-structure)
4. [Quick start](#4-quick-start)
5. [Environment variables](#5-environment-variables)
6. [MongoDB Atlas setup](#6-mongodb-atlas-setup)
7. [Seeding the database](#7-seeding-the-database)
8. [Demo accounts](#8-demo-accounts)
9. [Available scripts](#9-available-scripts)
10. [REST API reference](#10-rest-api-reference)
11. [Data models](#11-data-models)
12. [Authentication & security](#12-authentication--security)
13. [AI assistant: live vs demo mode](#13-ai-assistant-live-vs-demo-mode)
14. [Camera & pose detection: privacy and limits](#14-camera--pose-detection-privacy-and-limits)
15. [Production build](#15-production-build)
16. [Deployment](#16-deployment)
17. [Known limitations](#17-known-limitations)

---

## 1. Feature overview

| # | Feature | Where | Notes |
|---|---------|-------|-------|
| 1 | Marketing homepage | `/` | Hero, featured poses, popular routines, AI coach intro, benefits, testimonials, FAQ, footer |
| 2 | Authentication | `/login`, `/signup` | Register, login, logout, forgot/reset password, profile |
| 3 | Yoga pose library | `/poses`, `/poses/:id` | Search, category + difficulty filters, sorting, pagination, favourites |
| 4 | AI Yoga Coach | `/coach` | MediaPipe Pose Landmarker, skeleton overlay, joint-angle checks, confidence, camera-free mode |
| 5 | Personalised routine generator | `/plans` | Rule-based engine (`rule-based-v1`), save/start/complete routines |
| 6 | Smart Yoga Timer | `/plans` | Prep countdown, pose/rest phases, pause, skip, restart, chimes, completion summary |
| 7 | Yogi Assistant chatbot | `/assistant` | Backend-proxied AI, suggested questions, history, demo mode fallback |
| 8 | Mood-based recommendations | `/mood` | 6 moods, transparent rule-based engine, non-diagnostic disclaimer |
| 9 | Breathing & meditation studio | `/breathing` | Box breathing, diaphragmatic breathing, guided meditations, ambient sound |
| 10 | Progress dashboard | `/progress` | Totals, streaks, weekly chart (Recharts), pose balance, favourites, history |
| 11 | Gamification | `/progress`, `/community` | 8 achievements, badge progress, weekly goal |
| 12 | Community & challenges | `/community` | Weekly challenges, posts, likes, reporting, privacy control |
| 13 | Profile management | `/profile` | Details, preferences, favourites, history, password change |
| 14 | Legal pages | `/privacy`, `/terms`, `/safety` | Written to match what the app actually does |

---

## 2. Tech stack

**Frontend**
- React 18 + Vite 5 (JavaScript, ESM)
- Tailwind CSS 3 (custom `sage` / `lavender` / `cream` palette, `darkMode: 'class'`)
- React Router 6, Axios, Framer Motion, Lucide React icons, Recharts
- React Context API (`AuthContext`, `ThemeContext`, `ToastContext`)
- `@mediapipe/tasks-vision` for on-device pose landmark detection

**Backend**
- Node.js 18+ (verified on Node 22) + Express 4 (ESM)
- JWT auth (httpOnly cookie) + bcryptjs hashing
- express-validator, Helmet, CORS allow-list, express-rate-limit, hpp, express-mongo-sanitize
- Multer (pose image uploads only)

**Database**
- MongoDB (Atlas or local) with Mongoose 8

---

## 3. Project structure

```
yogai/
├── client/                      # React + Vite frontend
│   ├── public/
│   └── src/
│       ├── components/          # Navbar, Footer, PoseCard, SmartTimer, ui.jsx, …
│       ├── config/              # appConfig.js — nav links, enum mirrors, breathing patterns
│       ├── context/             # AuthContext, ThemeContext, ToastContext
│       ├── hooks/               # useDebounce
│       ├── layouts/             # MainLayout, AuthLayout
│       ├── pages/               # Home, ExplorePoses, AICoach, YogaPlans, …
│       ├── services/            # api.js (axios), authService.js, yogaService.js
│       ├── utils/               # format.js
│       ├── App.jsx
│       └── main.jsx
│
├── server/                      # Express REST API
│   ├── config/                  # env.js, db.js, constants.js
│   ├── controllers/
│   ├── middleware/              # auth, csrf, validate, rateLimit, upload, errorHandler
│   ├── models/                  # Mongoose schemas
│   ├── routes/
│   ├── services/                # aiService, recommendationService, progressService, …
│   ├── utils/                   # seed.js, poseData.js, token.js, apiResponse.js, …
│   ├── app.js
│   └── server.js
│
├── .gitignore
└── README.md
```

---

## 4. Quick start

**Prerequisites:** Node.js **18 or newer** (Node 22 recommended), npm, and either a local MongoDB server or a MongoDB Atlas cluster.

```bash
# 1. Clone / open the project
cd yogai

# 2. Install backend dependencies
cd server
npm install
cp .env.example .env          # Windows PowerShell: copy .env.example .env
#   → edit .env and set MONGODB_URI + a strong JWT_SECRET

# 3. Install frontend dependencies
cd ../client
npm install
cp .env.example .env          # leave VITE_API_BASE_URL empty for local dev
```

**Run both apps in two terminals** (from the project root):

```bash
# Terminal 1 — API on http://localhost:5000
cd server
npm run dev

# Terminal 2 — web app on http://localhost:5173
cd client
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*` to `http://localhost:5000`, so cookies stay same-origin during development.

Verify the API is alive:

```bash
curl http://localhost:5000/api/health
# {"success":true,"message":"YogAI API is running.","data":{"status":"ok",...}}
```

Then seed the pose library and demo accounts:

```bash
cd server
npm run seed
```

---

## 5. Environment variables

Never commit real `.env` files — only `.env.example` is tracked.

### `server/.env`

| Variable | Default | Purpose |
|----------|---------|---------|
| `NODE_ENV` | `development` | Set to `production` when deployed |
| `PORT` | `5000` | API port |
| `API_BASE_URL` | `http://localhost:5000` | Public URL of the API (used in reset links) |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/yogai` | MongoDB / Atlas connection string |
| `JWT_SECRET` | insecure dev default | **Must be ≥ 32 chars in production** |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `COOKIE_SECURE` | `false` (auto `true` in prod) | Requires HTTPS when `true` |
| `COOKIE_DOMAIN` | *(empty)* | Set when the API and web app share a parent domain |
| `COOKIE_SAMESITE` | `lax` (`none` in prod) | Cross-site cookie policy |
| `CLIENT_ORIGINS` | `http://localhost:5173,http://localhost:4173` | Comma-separated CORS allow-list |
| `RATE_LIMIT_WINDOW_MINUTES` | `15` | Global rate-limit window |
| `RATE_LIMIT_MAX` | `300` | Requests per window per IP |
| `AUTH_RATE_LIMIT_MAX` | `20` | Auth-endpoint requests per window per IP |
| `AI_API_KEY` | *(empty)* | Leave empty to run the chatbot in **demo mode** |
| `AI_API_BASE` | `https://api.openai.com/v1` | Any OpenAI-compatible base URL |
| `AI_MODEL` | `gpt-4o-mini` | Model name |
| `AI_TIMEOUT_MS` | `20000` | Upstream request timeout |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | `admin@yogai.app` / `Admin@12345` | Seeded admin |
| `SEED_DEMO_EMAIL` / `SEED_DEMO_PASSWORD` | `demo@yogai.app` / `Demo@12345` | Seeded demo user |

`server/config/env.js` refuses to boot in production if `JWT_SECRET` is missing/short, `MONGODB_URI` is absent, cookies are not secure, or `CLIENT_ORIGINS` still contains `localhost`.

### `client/.env`

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | *(empty)* | Empty in dev → use the Vite proxy. In production set it to your deployed API origin, e.g. `https://yogai-api.onrender.com` |

Only `VITE_*` variables reach the browser — **never put secrets in the frontend env**.

---

## 6. MongoDB Atlas setup

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. **Database Access** → add a user with *Read and write to any database*.
3. **Network Access** → add your IP (or `0.0.0.0/0` for demo deployments only).
4. **Connect → Drivers** → copy the connection string and append the database name:

   ```
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/yogai?retryWrites=true&w=majority
   ```

5. Paste it into `server/.env`, then run `npm run seed` once to create the collections, indexes and demo content.

Collections are created automatically by Mongoose on first write; `npm run seed` also syncs the achievement catalogue.

---

## 7. Seeding the database

```bash
cd server
npm run seed           # idempotent — safe to run repeatedly
npm run seed:destroy   # wipes seeded poses, routines, achievements and demo users
```

The seeder creates:

- **13 yoga poses** — Mountain, Tree, Downward-Facing Dog, Warrior I, Warrior II, Child's Pose, Cobra, Cat-Cow, Bridge, Corpse, Legs-Up-the-Wall, Supine Spinal Twist, Seated Forward Bend. Each with difficulty, benefits, step-by-step instructions, breathing cues, common mistakes, modifications, precautions, duration, category and related poses.
- **3 system routines** — a beginner full-body flow, a gentle evening wind-down, and a strength/balance flow.
- **8 achievement definitions** — kept in sync with `server/config/constants.js` on every boot.
- **2 users** — one admin and one demo practitioner (see below).

---

## 8. Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@yogai.app` | `Admin@12345` |
| Demo user | `demo@yogai.app` | `Demo@12345` |

The admin account is the only role allowed to create, update or delete poses. Change these credentials via `SEED_*` env vars before any public deployment.

---

## 9. Available scripts

**Backend (`server/`)**

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with nodemon (auto-restart) |
| `npm start` | Start with plain Node (production) |
| `npm run seed` | Seed poses, routines, achievements and demo users |
| `npm run seed:destroy` | Remove seeded data |

**Frontend (`client/`)**

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server on port 5173 |
| `npm run build` | Production build into `client/dist` |
| `npm run preview` | Preview the production build locally on port 4173 |
| `npm run lint` | ESLint (requires an ESLint config file) |

---

## 10. REST API reference

All routes are prefixed with `/api`. Every response uses a consistent envelope:

```jsonc
// success
{ "success": true, "message": "…", "data": { … }, "meta": { … } }

// failure
{ "success": false, "message": "…", "errors": [ { "field": "email", "message": "…" } ] }
```

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | — | Uptime probe |

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create an account (rate-limited) |
| POST | `/api/auth/login` | — | Sign in; sets `yogai_token` + `yogai_csrf` cookies |
| POST | `/api/auth/logout` | — | Clear auth cookies |
| POST | `/api/auth/forgot-password` | — | Issue a reset token (returned in the response in demo mode) |
| POST | `/api/auth/reset-password` | — | Consume the token and set a new password |
| GET | `/api/auth/me` | ✅ | Current user + fresh CSRF token |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me` | ✅ | Profile with favourite/session counts |
| PATCH | `/api/users/me` | ✅ | Update name, email, experience level, goals |
| PATCH | `/api/users/me/preferences` | ✅ | Theme, practice duration, intensity, weekly goal, toggles |
| POST | `/api/users/me/change-password` | ✅ | Change password |

### Yoga poses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/poses` | optional | `?search=&category=&difficulty=&sort=&page=&limit=&ids=` |
| GET | `/api/poses/:id` | optional | Accepts an id **or** a slug; populates related poses |
| POST | `/api/poses` | admin | Create a pose |
| PUT | `/api/poses/:id` | admin | Update a pose |
| DELETE | `/api/poses/:id` | admin | Delete a pose |
| POST | `/api/poses/:id/image` | admin | Upload an image (`multipart/form-data`, field `image`, ≤ 2 MB) |

### Yoga routines

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/routines` | optional | `?scope=all\|mine\|public&goal=&difficulty=` |
| GET | `/api/routines/:id` | optional | Visibility-checked |
| POST | `/api/routines/generate` | optional | Run the recommendation engine (`save:true` needs auth) |
| POST | `/api/routines` | ✅ | Save a hand-built routine |
| PUT | `/api/routines/:id` | ✅ owner | Update |
| DELETE | `/api/routines/:id` | ✅ owner | Delete |
| POST | `/api/routines/:id/publish` | ✅ owner | Toggle `isPublic` |

### Progress

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/progress` | ✅ | Totals, streaks, weekly series, badges, favourites |
| GET | `/api/progress/weekly` | ✅ | `?days=7…30` activity series |
| GET | `/api/progress/history` | ✅ | `?page=&limit=` completed sessions |
| POST | `/api/progress/sessions` | ✅ | Log a completed session; returns newly earned badges |

### Favourites

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/favorites` | ✅ | Populated favourite poses |
| POST | `/api/favorites/:poseId` | ✅ | Add |
| DELETE | `/api/favorites/:poseId` | ✅ | Remove |

### Achievements, mood, AI, community

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/achievements` | ✅ | Badge board with per-badge progress |
| GET | `/api/mood/options` | — | Available moods |
| POST | `/api/mood/recommend` | — | `{ moods: [...] }` → poses + routine + breathing |
| GET | `/api/ai/status` | — | `live` or `demo` |
| POST | `/api/ai/chat` | optional | `{ message, history }` (rate-limited) |
| GET | `/api/community/posts` | optional | `?mine=true` for your own posts |
| POST | `/api/community/posts` | ✅ | Share a note/achievement/routine (private by default) |
| DELETE | `/api/community/posts/:id` | ✅ owner/admin | Delete |
| POST | `/api/community/posts/:id/like` | ✅ | Toggle like |
| POST | `/api/community/posts/:id/report` | ✅ | Report (3 reports → flagged) |
| GET | `/api/community/challenges` | optional | Weekly challenges with live progress |
| POST / DELETE | `/api/community/challenges/:key/join` | ✅ | Join / leave |

---

## 11. Data models

| Model | Purpose | Notes |
|-------|---------|-------|
| `User` | Account, profile, preferences | `passwordHash` is `select:false`; reset tokens stored hashed (sha256, 30 min) |
| `YogaPose` | Pose library | Unique slug, text index, `difficulty + category` index |
| `YogaRoutine` | Routines (system/generated/manual) | Ownership + visibility helpers |
| `PracticeSession` | Completed sessions | Compound index `{ userId, completedAt }`; denormalised categories |
| `Achievement` | Badge definitions | Synced from `config/constants.js` on boot |
| `UserAchievement` | Earned badges | Unique `{ userId, achievementId }` |
| `CommunityPost` | Posts + moderation | `pending / approved / flagged / removed` |

---

## 12. Authentication & security

- **JWT in an httpOnly cookie** (`yogai_token`) — never in `localStorage`.
- **Double-submit CSRF**: a readable `yogai_csrf` cookie must be echoed in the `X-CSRF-Token` header on every non-GET request. Comparison uses `crypto.timingSafeEqual`.
- **bcryptjs** with 12 salt rounds.
- **Rate limiting**: global limiter, a stricter auth limiter (successful requests are skipped), and a 20/min limiter on the AI endpoint.
- **Helmet** security headers, **restricted CORS** allow-list with credentials, `express-mongo-sanitize`, `hpp`, and a 1 MB JSON body cap.
- **Validation** on every mutating route via express-validator, with field-level error messages surfaced in the UI.
- Generic responses on login/forgot-password so accounts cannot be enumerated.
- Uploads are limited to JPEG/PNG/WEBP/AVIF and 2 MB.

---

## 13. AI assistant: live vs demo mode

The Yogi Assistant always talks to **your own backend** at `POST /api/ai/chat` — the AI provider key never reaches the browser.

- **No `AI_API_KEY` set** → the endpoint answers from a curated set of yoga responses and returns `mode: "demo"`. The UI shows a clearly labelled **Demo mode** badge. This is the default.
- **`AI_API_KEY` set** → requests are proxied to any OpenAI-compatible chat-completions endpoint (`AI_API_BASE` + `AI_MODEL`) and the UI shows a **Live AI** badge.
- If the upstream provider fails or times out, the API degrades to a demo reply (`mode: "demo-fallback"`) and says so in the message rather than pretending it answered.

Both the assistant page and the floating chat widget display the active mode, plus a persistent disclaimer that the assistant is not a medical professional.

---

## 14. Camera & pose detection: privacy and limits

The AI Yoga Coach uses **MediaPipe Pose Landmarker**, loaded from a public CDN and executed **entirely in the browser** on the user's device (WASM/GPU).

- Camera access is only requested after an explicit button press, and the app explains the usage beforehand.
- **Frames are never uploaded, stored or recorded.** No frame data leaves the device; only a completed practice *session summary* (duration, pose names) is ever sent to the API.
- A **camera-free practice mode** is always available; if the model cannot load (offline/CDN blocked) or permission is denied, the app explains this and offers that mode instead.
- The coach provides **basic joint-angle observations only**. It explicitly does **not** guarantee correct posture and is **not** a medical assessment. The UI states these limitations and advises users to stop immediately if they feel pain.
- Lying-down shapes (Child's Pose, Bridge, Corpse) are intentionally **not scored**, because a single camera cannot judge them reliably.

See `/safety` and `/privacy` in the app for the user-facing versions of these statements.

---

## 15. Production build

```bash
cd client
npm run build      # outputs client/dist
npm run preview    # optional: serve the build locally on :4173
```

```bash
cd server
NODE_ENV=production npm start
```

Before going to production, make sure that on the server:

- `NODE_ENV=production`
- `JWT_SECRET` is a long random string (≥ 32 characters)
- `MONGODB_URI` points at Atlas
- `COOKIE_SECURE=true` (HTTPS required)
- `CLIENT_ORIGINS` lists only your real frontend origin(s) — no `localhost`

And on the client:

- `VITE_API_BASE_URL` points at your deployed API origin

The app will refuse to start with an unsafe production config rather than silently running insecurely.

---

## 16. Deployment

### 16.1 MongoDB Atlas
Create the cluster, database user and network rule, then copy the SRV connection string into the backend host's `MONGODB_URI`.

### 16.2 Backend — Node.js host (Render / Railway / Fly.io / a VPS)

| Setting | Value |
|---------|-------|
| Root directory | `server` |
| Build command | `npm install` |
| Start command | `npm start` |
| Health check path | `/api/health` |
| Node version | 18+ |

Set all `server/.env` variables in the host's dashboard. If the frontend and API live on **different** domains, set `COOKIE_SAMESITE=none` and `COOKIE_SECURE=true` (both require HTTPS) and add the frontend origin to `CLIENT_ORIGINS`. On hosts with an ephemeral filesystem, note that uploaded pose images (`server/uploads/`) will not persist — use external object storage for long-lived uploads.

### 16.3 Frontend — Vercel

| Setting | Value |
|---------|-------|
| Framework preset | Vite |
| Root directory | `client` |
| Build command | `npm run build` |
| Output directory | `dist` |

Environment variable:

```
VITE_API_BASE_URL=https://your-api-host.example.com
```

**SPA routing:** add a rewrite so client-side routes resolve to `index.html` (Vercel → Project → Settings → Rewrites, or a `vercel.json` with a catch-all to `/index.html`).

---

## 17. Known limitations

- **AI assistant** runs in demo mode until `AI_API_KEY` is configured — the UI says so rather than overstating capability.
- **Password reset** has no email provider wired up. In development the API returns the reset link in the response and the UI labels it as a demo; wire an SMTP/transactional-email service for production.
- **Pose detection** is a guidance aid, not an instructor or a medical device — see [section 14](#14-camera--pose-detection-privacy-and-limits).
- **Uploaded images** are written to the local filesystem, which does not survive redeploys on ephemeral hosts.
- The `lint` script expects an ESLint config file that is not included in the repository.

---

## Licence & attribution

Built for educational and portfolio purposes. Yoga is a physical activity — practise within your limits and consult a qualified professional if you have any health concerns.
