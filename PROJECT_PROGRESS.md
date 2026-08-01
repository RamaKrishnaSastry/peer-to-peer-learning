# Project Progress & Development Log

A living record of everything built in this repo: features, the requirements behind them, what was implemented, key decisions, bugs found, and insights from development chats. Update this file as the project grows so nothing is lost.

Last updated: 2026-08-01

---

## 1. Project Overview

Peer-to-peer learning platform for competitive exam prep (UPSC, JEE, Finance). Users answer daily questions, maintain streaks, earn badges, and share/upvote content and discussions. AI (Gemini) verifies MCQ answers.

**Why it exists:** competitive platforms give single-source AI answers with no community or accountability. This platform is peer-driven — learn from others, debate answers, build streaks.

### Tech Stack
| Layer | Tech |
|---|---|
| Frontend | React (Vite), TypeScript, React Router, @tanstack/react-query 5.x, Tailwind |
| Backend | Node.js, Express 4.x, TypeScript, Prisma ORM 5.x |
| Database | SQLite (local dev) → PostgreSQL (production, one-line switch) |
| Auth | Email OTP verification (JWT) + Google OAuth (ID token) |
| AI | Google Gemini free tier (answer verification) |
| Tests | Jest + supertest (backend integration tests) |

### Environment facts
- OS: Windows (PowerShell). No Docker installed. No PostgreSQL installed.
- Node 22.15.1, npm 10.9.2, Prisma 5.22.0, Express 4.22.2, Vite 8.0.12, react-query 5.100.10.
- Backend dev port `3001`, frontend dev port `3000` (Vite proxies `/api` → `3001`).

---

## 2. Feature Progress Log

Each entry = requirement → what we did → key files → status.

### 2.1 Database layer (SQLite + Prisma)
- **Requirement:** Replace template mock arrays with a real database so data actually persists.
- **Decision:** SQLite for local dev (no server, zero setup) with a documented one-line switch to PostgreSQL for production (`provider = "sqlite"` → `"postgresql"` + new `DATABASE_URL`).
- **What we did:**
  - Moved Prisma schema from `backend/src/prisma/schema.prisma` to `backend/prisma/schema.prisma` (standard location).
  - Created 14 models: `User`, `UserStats`, `Category`, `Content`, `Discussion`, `Answer`, `Comment`, `Rating`, `Vote`, `Streak`, `Badge`, `UserBadge`, `DailyQuestion`, `QuestionAttempt`.
  - Added `googleId String? @unique` to User for OAuth.
  - Created `backend/src/db.ts` (PrismaClient singleton).
  - Migration: `backend/prisma/migrations/20260731170322_init/`.
- **Seed data** (`backend/prisma/seed.ts`): 27 categories forming UPSC/JEE/Finance trees (Domain → Subject → Topic → Sub-topic), 9 daily questions (3 per domain), 5 badges (`first-step`, `rising-star`, `helper`, `streak-7`, `top-contributor`).
- **Key files:** `backend/prisma/schema.prisma`, `backend/prisma/seed.ts`, `backend/src/db.ts`.
- **Status:** Done.
- **Insight:** A Prisma `migrate dev` step initially failed on ambiguous relations — fixed by removing redundant `comments Comment[]` relations from `Content` and `Answer` (Comment is polymorphic via a `parentType` field).

### 2.2 Auth — password login + OTP-verified registration + custom usernames
- **Requirement:** Users sign in with a password; email verification (OTP) is used at registration.
- **Decision:** Password-based login (`POST /api/auth/login`, accepts email or username) with **OTP required only when creating an account** — `POST /api/auth/otp/verify` now also accepts a `password` (≥8 chars) and an optional custom `username`. OTP is delivered via a dev console log plus a `devOtp` echo while in development — no mail provider (Resend/Brevo) wired up yet.
- **What we did:**
  - `OtpVerification` model (email, codeHash, expiresAt, attempts, used, `@@index([email, createdAt])`); migration `20260801092509_add_otp_verification`.
  - `POST /api/auth/otp/request` — 6-digit code, sha256-hashed, 10-minute TTL, 60s resend cooldown, max 5 verify attempts.
  - `POST /api/auth/otp/verify` — marks code used, creates the account with the chosen password + optional username in a `$transaction` (email/username uniqueness → 409; P2002 race handled). Returns a JWT.
  - `POST /api/auth/login` — password login by email or username.
  - `GET /api/auth/me` (auth-protected) unchanged.
- **Custom usernames:** `User.username @unique`. Username rules `^[a-z0-9_]{3,20}$` (`validateUsername`); uniqueness enforced 3 ways: DB `@unique`, pre-check (409), and P2002 race catch (409). `PUT /api/users/me` can change username, bio, and avatarUrl.
- **Key files:** `backend/src/services/otp.ts`, `backend/src/routes/auth.ts`, `backend/src/routes/users.ts`, `backend/prisma/schema.prisma`.
- **Status:** Done (console delivery only; swap in a mail provider later via env var).
- **Insight:** storing only `codeHash` keeps OTP safe even if the DB leaks; `@unique` + P2002 catch closes the TOCTOU gap between the pre-check and the insert.

### 2.3 Google OAuth
- **Requirement:** "Sign in with Google" on Login and Signup screens.
- **What we did:**
  - Backend: `POST /api/auth/google` verifies the ID token with `google-auth-library` (`OAuth2Client.verifyIdToken`, audience = `GOOGLE_CLIENT_ID`). **Requires a registered account** — an unknown email returns `401 No account found for this email. Please register first.` (no auto-create anymore). First Google sign-in for an existing email/password account just links `googleId`. Returns 503 if `GOOGLE_CLIENT_ID` unset, 401 on invalid token.
  - Frontend: `GoogleButton.tsx` loads the GSI script (`https://accounts.google.com/gsi/client`), renders the button only when `VITE_GOOGLE_CLIENT_ID` is set; `AuthContext.loginWithGoogle` posts the credential.
- **Key files:** `backend/src/routes/auth.ts`, `frontend/src/components/GoogleButton.tsx`, `frontend/src/contexts/AuthContext.tsx`, `frontend/src/pages/Login.tsx`, `Signup.tsx`.
- **Status:** Done (needs the Google Cloud Console OAuth client to have `http://localhost:3000` as an authorized JavaScript origin).
- **Insights:**
  - The button is hidden when `VITE_GOOGLE_CLIENT_ID` is unset — looked like a bug but was intended.
  - **Vite reads `.env` at dev-server startup.** After adding/changing `frontend/.env`, you MUST restart `npm run dev` (and hard-refresh the browser) or the change won't appear.
  - Frontend and backend `GOOGLE_CLIENT_ID` values must match exactly.
  - **Decision:** Google sign-in no longer auto-creates accounts — it would let anyone claim a username/email without going through OTP, which defeats the email-verification goal.

### 2.4 Categories
- **Requirement:** Navigable exam curricula (UPSC, JEE, Finance) as hierarchical categories.
- **What we did:** Seeded 4-level trees. Routes: root list, all flattened (`/all`, for cascading selects), by slug, subtree (`/:id/tree`), breadcrumb (`/:id/breadcrumb`).
- **Key files:** `backend/src/routes/categories.ts`.
- **Status:** Done.

### 2.5 Daily questions, streaks, badges
- **Requirement:** A question every day per domain, user answers once, tracked as streak + badges + reputation.
- **What we did:**
  - `GET /api/daily-questions/today/:type` (uses `optionalAuth` so anonymous reads work and `attempted`/`myAttempt` are returned for logged-in users). Priority: scheduled row for today → **lazy LLM variant generation** grounded in a sourced bank question → **deterministic rotation** through the pool (`pool[dayNumber % pool.length]`) when generation is unavailable.
  - `GET /api/daily-questions/history/:type`.
  - `POST /api/daily-questions/:id/submit` — rejects duplicates (409), runs AI verification, creates `QuestionAttempt`, updates streak + stats, awards badges (`first-step` on first attempt, `streak-7` at 7+).
  - `backend/src/services/engagement.ts`: `updateStreak`, `recalculateUserStats`, `awardBadge`, `getStatsWithStreak`.
- **Sourced question bank (new):** `DailyQuestion.source String?` added (migration `20260801093833_add_question_source`). Seed expanded to **22 questions** (7 UPSC, 8 JEE, 7 Finance) each carrying a real source: NCERT (History/Themes, Polity, Geography, Economy, PCM), Laxmikanth Indian Polity, Spectrum Modern India, Ramesh Singh, HC Verma, NSE Academy, NISM, The Intelligent Investor. First 3 per domain land on today/tomorrow/day-after, the rest on distinct past dates to enrich the pool.
- **Lazy LLM generation (new):** `llm.ts` gains `generateQuestionVariant(exemplar)` — asks Gemini to write a fresh, original MCQ on the same topic/difficulty as a trusted sourced question (never a verbatim copy), JSON-enforced, validates 4 options. `services/dailyQuestions.ts` `getTodaysQuestion` triggers it when today has no row, persists the result with `source: "AI variant grounded in: <original source>"`, and falls back to rotation on any error or missing key.
- **Key files:** `backend/src/routes/dailyQuestions.ts`, `backend/src/services/dailyQuestions.ts`, `backend/src/services/engagement.ts`, `backend/prisma/seed.ts`.
- **Status:** Done (verified live: deleting today's UPSC row then calling the API produced a generated Laxmikanth-grounded variant).
- **Insights / bug fixed:**
  - **Streak bug:** the streak row was created at signup with `lastActivityDate = now`, so the first submission still returned streak 0. Fixed by creating the streak lazily inside `updateStreak` (only on first activity), so day-1 counts as streak 1.
  - The `/today/:type` route originally never ran auth middleware, so `req.userId` was undefined for logged-in users (caught by a test). Fixed by adding `optionalAuth`.
  - Seed `upsert` with `update: {}` leaves pre-existing rows untouched, so re-seeding after schema changes **does not** refresh today's questions — wipe with `prisma migrate reset --force` instead.

### 2.6 AI answer verification — Claude → Gemini
- **Requirement:** Verify whether a submitted answer is correct; provide confidence + explanation.
- **First attempt:** Claude API via `backend/src/services/llm.ts` (`verifyAnswer`, `verifyAnswerWithClaude`, `generateDailyQuestion`), with a deterministic offline fallback (exact match when no API key).
- **Problem:** Claude is paid (~$5 trial then pay-as-you-go) — not feasible for a personal project.
- **Decision:** Switch to **Google Gemini free tier** (no credit card, permanent free tier).
- **What we did:**
  - Rewrote `backend/src/services/llm.ts` to call Gemini REST via `axios` (no new dependency). JSON output enforced with `responseMimeType: "application/json"`; robust `extractJson` strips code fences.
  - Model: `gemini-flash-lite-latest` (alias that tracks the newest lite model → best free quota, never "retired"). Override with `GEMINI_MODEL`.
  - Env var renamed `CLAUDE_API_KEY` → `GEMINI_API_KEY` (code falls back to `CLAUDE_API_KEY` for compatibility).
  - Updated `.env.example`, `tests/setup.ts`, README.
- **Key files:** `backend/src/services/llm.ts`.
- **Status:** Done, verified live (real verdict + explanation returned).
- **Insights:**
  - Gemini keys start with `AIza...` but Google now issues keys with other prefixes (ours starts `AQ.Ab...`) — it still authenticated fine.
  - `gemini-2.5-flash-lite` returns a model-level 404 "no longer available to new users" — use the `...-latest` aliases instead. The correct way to discover available models: `GET /v1beta/models?key=YOUR_KEY`.
  - Free tier: roughly 250–1,500 requests/day depending on model, 10–15 RPM; quotas reset at midnight PT; returns 429 when exhausted. Free-tier prompts may be used for training (irrelevant for quiz answers).
  - The offline deterministic fallback means the core flow works even with no key or rate-limit errors.

### 2.7 Community — discussions, answers, comments, votes, ratings
- **Requirement:** Users discuss topics, answer discussions, comment, upvote, and rate content — with reputation from upvotes received.
- **What we did:**
  - Routes: `discussions.ts` (CRUD + answers + comment + viewCount + **close/reopen**), `answers.ts` (upvote/comment), `comments.ts` (create/upvote/delete, polymorphic via `parentType`), `content.ts` (CRUD + comment/rate/upvote with grouped vote + comment counts).
  - `backend/src/services/votes.ts`: `toggleVote` + counter increments.
  - Stats aggregation recomputes `upvotesReceived`, `reputationScore`, `contentCount`, `answerCount`.
  - **Discussion lifecycle (new):** `Discussion.isClosed Boolean @default(false)` (migration `20260801112739_add_discussion_closed`). `POST /discussions/:id/close` + `/reopen` (starter-only, 403 otherwise); posting answers to a closed discussion → 403. List endpoint supports `?sort=newest|top` (top = most answered).
  - **Richer detail responses:** `GET /content/:id` comments include `upvoteCount` + `myVote`; `GET /discussions/:id` answers include `commentCount` + `myVote` (via `optionalAuth`).
- **Key files:** `backend/src/routes/discussions.ts`, `answers.ts`, `comments.ts`, `content.ts`, `backend/src/services/votes.ts`.
- **Status:** Done.

### 2.8 Frontend pages
- **Requirement:** UI for all of the above.
- **What we did:** Reworked template pages + added new ones.
  - Auth: `Login.tsx` (password only), `Signup.tsx` (email → OTP via `EmailOtpForm.tsx` with password + optional username fields, Google button + divider), `AuthContext.tsx` (localStorage session, `requestOtp`, `register`, `login`, `loginWithGoogle`, `updateUser`).
  - `DailyQuestion.tsx` — daily question with domain tabs, submit, streak display.
  - `Discussions.tsx` / `DiscussionDetail.tsx` — list, create, answers, upvotes, end/reopen.
  - `Content.tsx` / `ContentDetail.tsx` — list, upload, YouTube embed, star rating, comments, comment upvotes, open-resource link.
  - `Profile.tsx` (stats + badges + username change), `Settings.tsx` (username + bio + avatar), `UserProfile.tsx` (public profile by username).
  - `Home.tsx`, `Navbar.tsx` (reordered tabs + active state + mobile menu), `App.tsx` (routes), `utils/api.ts` (axios instance + token interceptor + 401 redirect), `utils/constants.ts` (endpoint map), `hooks/useFetch.ts`.
  - Shared components: `Avatar.tsx` (deterministic color initials), `CategorySelect.tsx` (cascading Domain → Subject → Topic selects), `ChangeUsernameForm.tsx`, `GoogleButton.tsx`.
- **Key files:** `frontend/src/pages/*`, `frontend/src/contexts/AuthContext.tsx`, `frontend/src/components/*`.
- **Status:** Done (all builds green).

### 2.9 UI/UX polish
- **Requirement:** Navigate and browse like a real product; fix dead ends; sensible defaults.
- **What we did:**
  - **Navbar tab order** → `Browse · Daily · Discussions · Content` (curriculum first, practice next, then community). Active tab is highlighted via `NavLink`; a hamburger menu handles small screens.
  - **Public user profiles** — `/users/:username` route + page (avatar, bio, verified, badges, stats, their content & answers). Fixes dead links: usernames everywhere (discussion creators, answer authors, content creators) previously pointed at a route that didn't exist.
  - **Content resources are reachable** — notes (non-video) now show an "Open resource ↗" button; before, only videos embedded and the URL was never displayed.
  - **Cascading category filter** — `CategorySelect` replaces the flat 27-item dropdown with Domain → Subject → Topic selects on Discussions/Content (filter + create forms). Requires `GET /categories/all`.
  - **Sorting** — Discussions: Newest / Most answered; Content: Newest / Top rated.
  - **Richer lists** — YouTube thumbnails (`img.youtube.com/vi/<id>/mqdefault.jpg`) or a 📄 icon for notes; creator initial avatars on every card; comment counts on answers; empty states with a real CTA (open the form / login).
  - **Profile depth** — badges displayed on your profile and public profiles; "View public profile ↗" link; bio + avatar URL editing in Settings.
  - **Content comments are upvoteable** (was: backend supported it, UI didn't).
  - **Success feedback** — green banners after posting a discussion/content, ending/reopening a discussion, posting a comment, saving profile.
  - **Footer year** is now dynamic (was hard-coded 2024).
- **Key files:** `frontend/src/components/Navbar.tsx`, `CategorySelect.tsx`, `Avatar.tsx`, `pages/UserProfile.tsx`, `pages/Content.tsx`, `pages/Discussions.tsx`, `pages/ContentDetail.tsx`, `pages/DiscussionDetail.tsx`, `pages/Settings.tsx`, `pages/Profile.tsx`, `components/Footer.tsx`, `backend/src/routes/categories.ts`.
- **Status:** Done.

### 2.10 Testing
- **Requirement:** Integration tests so we don't break the core flows.
- **What we did:** Jest + supertest. Test DB = `file:./test.db` set in `tests/setup.ts`; `tests/global-setup.ts` runs `prisma migrate deploy` + `prisma db seed` against it. `GEMINI_API_KEY` and `GOOGLE_CLIENT_ID` forced empty in tests so AI/Google paths use fallbacks.
- **Suites:** `tests/auth.test.ts`, `tests/dailyQuestions.test.ts`, `tests/community.test.ts` — **3 suites / 30 tests, all passing.** Shared helper `tests/helpers.ts::signupAndGetToken` drives the OTP flow.
- **Coverage:** OTP request/verify (valid, wrong code, repeated/cooldown, expired flow), password registration, login by email/username, /me, Google 503-when-unconfigured, today's question, correct/incorrect submit, 409 resubmit, streak = 1, content comment/rate/upvote, discussion/answer/upvote, discussion close/reopen + 403 stranger, stats aggregation.
- **Status:** Done.

### 2.11 Docs
- **Requirement:** Setup + API docs.
- **What we did:** Updated `README.md` (SQLite setup, Google OAuth, Gemini verification, API reference, env vars). Left the historical planning docs in `docs/`, `ARCHITECTURE.md`, `SETUP.md`, etc. as-is (they still reference Claude/PostgreSQL and are out of date but serve as planning history).

---

## 3. Commands cheat sheet

```bash
# Backend (port 3001)
cd backend
npm run dev            # ts-node src/server.ts
npm run build          # tsc
npx jest               # integration tests
npm run lint           # NOTE: broken, no eslint config in backend (pre-existing)

# Frontend (port 3000)
cd frontend
npm run dev
npm run build
npm run lint           # clean

# Prisma
cd backend
npx prisma studio               # GUI browser at http://localhost:5555
npx prisma migrate dev          # create/apply migration
npx prisma migrate reset --force # wipe + reseed dev.db
npx prisma db seed              # rerun seed

# Raw DB access (SQLite)
sqlite3 backend/prisma/dev.db
```

---

## 4. Environment variables

**`backend/.env`**
```
DATABASE_URL="file:./dev.db"            # SQLite; switch to postgresql://... for prod
JWT_SECRET=...                          # REQUIRED in prod
JWT_EXPIRY="7d"
GEMINI_API_KEY=...                      # free tier via Google AI Studio
GEMINI_MODEL=gemini-flash-lite-latest   # optional override
GOOGLE_CLIENT_ID=...                    # Google Cloud Console OAuth 2.0 Client ID
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

**`frontend/.env`**
```
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Peer Learning Platform
VITE_GOOGLE_CLIENT_ID=...               # must match backend GOOGLE_CLIENT_ID
```

`.env` files are gitignored; `.env.example` files are committed and stay in sync.

---

## 5. Database access

- File: `backend/prisma/dev.db` (SQLite).
- Best tool: `npx prisma studio` (GUI).
- Alternative: VS Code "SQLite" extension or `sqlite3` CLI.
- Test DB: `backend/prisma/test.db` (created/destroyed by jest runs, gitignored).

---

## 6. Git history

All work is committed on `main` as focused, topic-scoped commits (~24 commits, not pushed):

```
7fada98 feat(frontend): revamp discussions/content pages with collapsible forms; end/reopen UI for discussion starter
73f52df feat(backend): discussion starter can end/reopen a discussion; block answers when ended
089c9df fix(frontend): open account menu on click; only redirect on 401 with a token attached
38eabd1 feat(backend): Google sign-in requires a registered account, no auto-create
dc21017 feat(frontend): password login, custom username, avatar dropdown menu, logout confirmation
0345533 feat(backend): password login, custom username at registration, unique username enforcement
b926653 docs: note stale-token and AI-verification fixes
2bf5e94 fix(backend): send option text to AI verification so verdicts are meaningful
7db6a4f fix(backend): reject tokens for deleted users with 401 instead of a 500 on writes
04bedbd docs: track OTP auth, sourced question bank, and lazy LLM generation
4fa5112 feat(frontend): show question source on daily question page
1d00b59 feat(backend): sourced question bank with lazy LLM variant generation
e618caa feat(frontend): add email OTP login/signup flow
0058254 feat(backend): replace password auth with email OTP verification
d90fdd6 feat(backend): replace Claude API with free-tier Gemini for answer verification
6ddd8ef docs: update README for SQLite setup, Google OAuth, and API reference
aa7a13a chore(frontend): update deps and Vite/postcss config
e42684a feat(frontend): add daily question, community, content, and profile pages
4285dc1 feat(frontend): add Google OAuth sign-in via GSI button
36b96c3 test(backend): add integration tests for auth, daily questions, and community
0f52f77 feat(backend): replace mock APIs with Prisma-backed routes and app factory
f46029d feat(backend): add Google OAuth and Prisma-backed auth endpoints
224c2c5 feat(backend): harden auth middleware with typed errors and optionalAuth
2ff3e1a feat(backend): add engagement, votes, daily-question, and LLM services
39d87ee feat(backend): add SQLite Prisma data layer, migrations, and seed data
cfdc984 chore(backend): update deps for Prisma, Google OAuth, and testing
```
Replace `<latest>` with the real hash from `git log --oneline -2` the next time this file is updated.

Convention going forward: small commits, one issue/feature each.

---

## 7. Current status

- Backend tsc build: clean. Frontend build: clean. Frontend lint: clean.
- Tests: 30/30 passing (3 suites).
- Gemini verification: verified live (works with the key in `backend/.env`).
- Gemini question-variant generation: verified live (generates a fresh grounded question when today has no scheduled one).
- Google OAuth: key configured in both `.env` files; needs frontend restart to appear.
- Working tree: clean; ~24 commits ahead of `origin/main`.

---

## 8. Known issues / notes

- **OTP delivery is dev-only:** codes print to the backend console + `devOtp` in the response. A real mail provider (Resend/Brevo) is not wired yet — future env-var work.
- **Backend lint script is broken** (`eslint src/**/*.ts`, no ESLint config present) — pre-existing, not addressed.
- **Bug fixed — stale tokens:** `authMiddleware` now checks the user still exists in the DB and returns 401 (was: JWT-valid but deleted user → FK error → 500 "Failed to submit answer"). Happens whenever `prisma migrate reset` wipes users; the frontend logs out automatically.
- **Bug fixed — AI verdict meaningless:** submit now sends the selected option text (`"B) option text"`) to Gemini, not just the bare letter `"B"` (was: `REQUIRES_CONTEXT` "answer refers to an option letter..."). Offline fallback compares the leading option letter.
- **Bug fixed — dead username links:** every card linked to `/users/:username` but no route existed → blank page. Added `UserProfile` page + route.
- **Bug fixed — notes unreachable:** non-video content never displayed its `contentUrl`; added an "Open resource ↗" button on the content detail page.
- **CategorySelect depth:** the cascading filter stops at the deepest populated level (seeded tree is 4 levels); leaf-level items will only appear under their full path.
- **Vite 8 deprecation warnings** (`optimizeDeps.rollupOptions`, `esbuild`) — harmless.
- **`npm audit`:** 13 vulnerabilities (2 low, 1 moderate, 10 high) reported, not yet addressed.
- **Docs drift:** `docs/`, `ARCHITECTURE.md`, `SETUP.md`, `TEMPLATE_SUMMARY.md` still describe Claude + PostgreSQL; kept as planning history only.
- Google free tier: prompts may train Google's models; rate-limited (429) — the offline fallback handles it.
- In prod, switch Prisma `provider` to `"postgresql"` and change `DATABASE_URL`; nothing else in query code needs to change.

---

## 9. Useful insights (from development chats)

1. **Vite caches `.env` at startup** — always restart the dev server after editing env vars.
2. **Prisma schema location matters** — keep it at `prisma/schema.prisma`; `migrate`/`studio` look there.
3. **Polymorphic relations can break Prisma migrations** — drop redundant `Comment[]` back-relations when a model is polymorphic.
4. **Create derived rows lazily** (streaks, stats) instead of at signup to avoid off-by-one streak bugs.
5. **`optionalAuth` for GET endpoints** lets anonymous + authed users share a route while still capturing `req.userId` when present.
6. **Test against a separate DB** (`file:./test.db`) and force AI/Google env vars to empty so tests are deterministic and offline.
7. **Use model aliases (`...-latest`)** on Gemini to avoid model retirements; discover models via `/v1beta/models?key=`.
8. **Deterministic offline fallback** for AI keeps the core flow usable with no key or during rate limits.
9. **Lint hygiene:** type errors as `unknown` and use a `getErrorMessage` helper (AxiosError-aware) instead of `catch (err: any)`; escape apostrophes as `&apos;` in JSX.
10. **Committing secrets:** `.env` and `*.db` are gitignored; only `.env.example` is committed.

---

## 10. Next steps / roadmap

- [ ] Push the ~24 commits to `origin/main`.
- [ ] Wire an email provider (Resend/Brevo) for real OTP delivery via env var; keep the console fallback in dev.
- [ ] Expand the sourced question bank (more PYQs, toppers notes, coaching-institute questions with sources).
- [ ] Verify Google sign-in end-to-end once the frontend dev server is restarted.
- [ ] Add leaderboards (reputation ranking) — planned for Phase 2.
- [ ] Add more domains/categories and more seed questions.
- [ ] Address `npm audit` findings and the backend lint config.
- [ ] Production deploy: switch Prisma to PostgreSQL, set real secrets, host frontend (Vercel) + backend (Railway/Heroku).
```
