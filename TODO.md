# TODO

Tracked alongside `PROJECT_PROGRESS.md` §2.13 (product review) + §2.14 (implementation-layer review) + §10 (roadmap). Update this file as items are completed.

Status legend: `[ ]` pending · `[~]` in progress · `[x]` done

## Product gaps (from PM review, in priority order)
- [x] **#1 Search** — backend `GET /api/search` (content/discussions/categories, domain-aware) + navbar search box + results page.
- [x] **#2 Pagination / load-more** — Content + Discussions pages paginate (Load More) using backend `limit`/`offset`.
- [x] **#3 Forgot-password flow** — OTP-based reset routes + Login page link + reset UI.
- [x] **#4 In-app notifications** — `Notification` model, triggers (answer/comment), bell + unread count, notifications page. Email/push later (needs a provider).
- [x] **#5 Leaderboard** — `GET /api/leaderboard` (reputation + streak, domain filter) + page with tabs and medals.
- [x] **#6 File upload for content** — multer multipart upload → local `uploads/` served statically; returns absolute URL via `PUBLIC_URL` (required in prod). **Follow-up:** swap to R2/S3 for durable storage (deploy platforms have ephemeral filesystems).
- [x] **#7 Reporting/moderation** — `Report` model + report buttons on content/discussions/comments/answers; post rate limiting.
- [x] **#8 Discussion edit/delete** — `PUT`/`DELETE /api/discussions/:id` (starter only) + UI.
- [ ] **#9 Follow + bookmarks** — `Follow`/`Bookmark` models, follow button on profiles, bookmark buttons, bookmarks page.
- [ ] **#10 Subjective/Mains-style questions** — open-ended daily question type + AI essay grading.

## Backend hardening (implementation-layer review)
- [x] **Rate limiting** (`express-rate-limit`) — general API limiter (600/15min), auth limiter on OTP/login/reset (20/15min), write limiter on content/discussion creation (60/15min). Disabled under NODE_ENV=test.
- [x] **Security headers** — `helmet()` in `app.ts` (X-Content-Type-Options, X-Frame-Options, CSP, etc.).
- [ ] **Request validation layer** — Zod/Joi/express-validator instead of per-route `if (!x)`. Audit less-visited routes (URL format on `POST /content`, answer length cap, etc.).
- [ ] **API versioning** — mount routes under `/api/v1/` before any external client depends on the API.
- [ ] **Soft-delete / audit trail** — `deletedAt` on comments/content so moderation disputes have an evidence trail.
- [ ] **File/media layer** — server-side counterpart of #6: multipart endpoint + storage + thumbnailing.
- [ ] **Background job/queue** — streak/badge/notifications currently run inline in request handlers; a queue (BullMQ) will be needed for email, bulk AI generation, leaderboard recalcs.
- [ ] **Caching layer** — category tree, badges, today's question are identical for many users; Redis/in-memory cache candidates.
- [ ] **Structured logging** — request IDs, status, latency, error-level logs; current logger is just `${method} ${path}`.

## Frontend polish (implementation-layer review)
- [ ] **Daily question history page** — `GET /daily-questions/history/:type` is fully built but never wired into any page; add a "past questions" page for revision.
- [ ] **Streak history / calendar view** — GitHub-style 30-day contribution graph; schema already has `Streak`/`QuestionAttempt`.
- [ ] **Shared error/toast component** — pages hand-roll red-banner errors; add auto-dismissing shared component.
- [ ] **Client-side form validation** — inline hints (username rules, password min length) before hitting the server.
- [ ] **Skeleton loading states** — card grids pop in; skeletons would feel smoother than a single spinner.
- [ ] **Mobile nav pass** — hamburger/off-canvas, tap targets, 4-level breadcrumb on small screens.
- [ ] **Optimistic UI on upvote/rate** — flip counts instantly, roll back on failure.
- [ ] **Delete confirmations** — destructive actions (content/comment delete) lack an "are you sure?"
- [ ] **Link preview before submit** — validate YouTube URL + show thumbnail before posting content.

## Previously planned
- [ ] Push commits to `origin/main`.
- [ ] Wire an email provider (Resend/Brevo) for real OTP delivery via env var; keep console fallback in dev.
- [ ] Expand the sourced question bank (more PYQs, toppers notes, coaching-institute questions with sources).
- [ ] Verify Google sign-in end-to-end once the frontend dev server is restarted.
- [ ] Add more domains/categories and more seed questions.
- [ ] Address `npm audit` findings and the backend lint config.
- [ ] Production deploy: switch Prisma to PostgreSQL, set real secrets, host frontend (Vercel) + backend (Railway/Heroku).
- [ ] Flat comments → threaded replies (reply-to-a-comment).
- [ ] Dark mode, PWA manifest, avatar upload UI, email digest, basic analytics.
