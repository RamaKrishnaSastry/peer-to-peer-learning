# Peer Learning Platform

A community-driven learning platform where students solve daily exam questions, get peer feedback, and learn through verified knowledge sharing organized by curriculum.

## Overview

This platform addresses a specific problem: students spend excessive time finding reliable explanations for exam preparation topics. Instead of relying on algorithm-driven feeds or single-expert videos, this platform organizes knowledge by official curricula (UPSC, JEE, Finance) and enables peer-to-peer learning with community verification.

## Core Features

### Phase 1 (Weeks 1-4)
- User authentication (password login + email OTP registration + Google OAuth)
- Custom usernames with public profiles
- Curriculum hierarchy (4-level categorization)
- Daily questions with immediate AI verification
- Peer comments and discussion threads (starters can end a thread)
- User profiles with statistics and badges
- Positive-only feedback system (upvotes only, no downvotes)
- Streak tracking for daily engagement

### Phase 2 (Weeks 5-8)
- Study groups for accountability
- Leaderboards (global, weekly, category-specific)
- Badge system for contributions
- In-app notifications
- Extended discussions (Q&A format)

### Phase 3 (Weeks 9-12)
- Group-specific leaderboards
- Extended AI verification (essays, discussions)
- Group milestones and achievements
- Email notifications
- User analytics dashboard

## Technical Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- React Query for state management
- React Router for navigation

**Backend:**
- Node.js 18+ with Express
- TypeScript for type safety
- Prisma ORM for database operations
- PostgreSQL 14+ as primary database

**External Services:**
- Gemini API (free-tier answer verification)
- YouTube API (video embedding)
- Cloudinary (file storage - Phase 2+)

**Hosting:**
- Frontend: Vercel (free tier)
- Backend: Railway or Heroku (~$5-10/month)
- Database: PostgreSQL on Railway (included)

## Architecture

### Database Schema
- 14 core tables for Phase 1 including users, categories, content, daily questions, discussions, answers, and streaks
- Indexed for performance at scale
- Normalized design for data integrity

### API Design
- RESTful endpoints (~35 total)
- JWT-based authentication
- Request/response validation
- Error handling with appropriate HTTP status codes

### Project Structure
```
backend/
├── src/
│   ├── routes/          (API endpoints)
│   ├── services/        (Business logic)
│   ├── middleware/      (Authentication, error handling)
│   ├── types/           (TypeScript interfaces)
│   └── prisma/          (Database schema)

frontend/
├── src/
│   ├── pages/           (Route pages)
│   ├── components/      (Reusable components)
│   ├── contexts/        (Auth context)
│   ├── hooks/           (Custom hooks)
│   ├── utils/           (Helpers)
│   └── types/           (TypeScript interfaces)
```

## Development Setup

### Prerequisites
- Node.js 18 or higher
- Git

> No local database server is required for development. The backend runs on
> SQLite (a local file) by default and can be switched to PostgreSQL for
> production with a one-line change to `DATABASE_URL` and the Prisma provider.

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd learning-platform
```

2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials (SQLite works out of the box)
npx prisma migrate dev
npm run db:seed
npm run dev
```

3. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Backend runs on `http://localhost:3001` (health check: `/health`)
Frontend runs on `http://localhost:3000` (dev server proxies `/api` to the backend)

### Environment Variables

**Backend (.env):**
```
# SQLite (default, no server needed)
DATABASE_URL="file:./dev.db"
# Production (PostgreSQL):
# DATABASE_URL=postgresql://user:password@localhost:5432/learning_platform

JWT_SECRET=your-secret-key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Learning Platform
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

> **Google OAuth:** to enable "Sign in with Google" on the Login and Signup
> pages, create an OAuth 2.0 Client ID in the
> [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
> then set `GOOGLE_CLIENT_ID` in `backend/.env` and `VITE_GOOGLE_CLIENT_ID` in
> `frontend/.env`. When unset, the Google button is hidden and the endpoint
> returns 503.
>
> **Gemini verification:** answer verification uses the free tier of the
> Gemini API (`gemini-flash-lite-latest`, set `GEMINI_MODEL` to override). If
> `GEMINI_API_KEY` is empty, verification falls back to deterministic
> correct/incorrect checks so the core flow works without the API key.

## Database Setup

```bash
# Apply migrations
npx prisma migrate dev

# Seed categories, daily questions, and badges
npm run db:seed

# View database in browser
npx prisma studio

# Reset database (development only)
npx prisma migrate reset
```

## API Endpoints

### Authentication
- `POST /api/auth/otp/request` - Request a 6-digit email OTP (dev: code logged to console + returned as `devOtp`)
- `POST /api/auth/otp/verify` - Verify the code to create an account (accepts `password` ≥8 chars and optional `username`), returns a JWT
- `POST /api/auth/login` - Password login by email or username
- `POST /api/auth/google` - Google OAuth login (requires a registered account; links `googleId`)
- `GET /api/auth/me` - Get current user with stats

### Categories
- `GET /api/categories` - List root categories
- `GET /api/categories/all` - List all categories flattened (for cascading selects)
- `GET /api/categories/:slug` - Get specific category with children
- `GET /api/categories/:id/tree` - Get full category tree
- `GET /api/categories/:id/breadcrumb` - Get category breadcrumb

### Content
- `GET /api/content` - List content (filter by `categoryId`, sort by `newest`/`rating`)
- `GET /api/content/:id` - View content with comments (includes comment `upvoteCount`/`myVote`)
- `POST /api/content` - Upload study material
- `PUT /api/content/:id` - Update content (owner only)
- `DELETE /api/content/:id` - Delete content (owner only)
- `POST /api/content/:id/comment` - Add comment
- `POST /api/content/:id/rate` - Rate content (1-5 stars)
- `POST /api/content/:id/upvote` - Upvote content (positive-only, toggles)
- `POST /api/comments/:id/upvote` - Upvote a comment (toggles)
- `DELETE /api/comments/:id` - Delete own comment

### Daily Questions
- `GET /api/daily-questions/today/:type` - Get today's question (UPSC/JEE/Finance)
- `GET /api/daily-questions/history/:type` - View past questions with attempts
- `POST /api/daily-questions/:id/submit` - Submit answer (updates streak)

### Discussions
- `POST /api/discussions` - Create discussion
- `GET /api/discussions` - List discussions (filter by `categoryId`, sort by `newest`/`top`)
- `GET /api/discussions/:id` - View discussion with answers (includes `commentCount`/`myVote` per answer)
- `POST /api/discussions/:id/answers` - Add answer (403 when the discussion is ended)
- `POST /api/discussions/:id/comment` - Comment on a discussion
- `POST /api/discussions/:id/close` - End a discussion (starter only)
- `POST /api/discussions/:id/reopen` - Reopen a discussion (starter only)
- `POST /api/answers/:id/upvote` - Upvote answer
- `POST /api/answers/:id/comment` - Comment on an answer

### Users
- `GET /api/users/me` - Current user profile with stats + badges
- `PUT /api/users/me` - Update username / bio / avatarUrl
- `GET /api/users/:username` - Public profile with stats + badges
- `GET /api/users/:username/content` - User's content
- `GET /api/users/:username/answers` - User's answers

## Key Design Decisions

1. **UPSC-Only Launch:** Start with UPSC domain only to maintain interaction density. Add JEE and Finance in later phases.

2. **YouTube Video Embedding:** Users upload videos to YouTube (unlisted) and paste the link. This avoids hosting infrastructure costs while maintaining content control.

3. **Positive-Only Feedback:** No public downvotes. Only upvotes, helpful marks, and constructive comments to maintain psychological safety in the learning community.

4. **AI Verification in Phase 1:** Immediate Gemini API (free tier) integration for MCQ verification to build user trust from day one.

5. **4-Level Category Hierarchy:** Matches official exam curricula structure (Domain → Subject → Topic → Sub-topic) for easy navigation.

## Engagement Mechanics

### Daily Streaks
- Tracks consecutive days of activity
- Displayed prominently on user profile
- Resets after 24 hours of inactivity
- No penalty for breaking streak; can rebuild immediately

### Leaderboards
- Global leaderboard by reputation score
- Weekly leaderboard by daily question performance
- Category-specific leaderboards for experts
- Updated daily

### Answer Verification
Five-layer validation system:
1. Peer comments (community discussion)
2. AI verification (immediate, objective)
3. Crowd consensus (80%+ agreement badge)
4. Expert review (Phase 2, optional)
5. Reputation score (cumulative signal)

## Success Metrics

**Week 4 Target:**
- 500 active users
- 30+ daily questions answered
- 70%+ day-2 retention
- Vibrant discussions per category

**Week 8 Target:**
- 2,000 active users
- 3x engagement lift
- 40% users on 5+ day streaks

**Week 12 Target:**
- 5,000+ active users
- 80% day-2 retention
- 60% on active streaks

## Deployment

### Production Build
```bash
# Backend
npm run build
npm run start

# Frontend (Vercel handles this)
npm run build
```

### Deployment Steps

**Backend (Railway):**
1. Create Railway project
2. Connect GitHub repository
3. Add environment variables
4. Deploy on push

**Frontend (Vercel):**
1. Import GitHub repository
2. Set environment variables
3. Deploy on push

**Database (Railway PostgreSQL):**
1. Create PostgreSQL database
2. Run `npx prisma migrate deploy`
3. Database is ready

## Testing

### Backend Tests
```bash
npm run test
npm run test:watch
npm run test:coverage
```

### Frontend Tests
```bash
npm run test
npm run test:coverage
```

## Performance Considerations

- Database queries optimized with indexes on frequently accessed columns
- Frontend uses React.memo for expensive components
- Lazy loading for routes
- Pagination for large lists (20-50 items per page)
- Connection pooling for database

## Security

- JWT tokens with 7-day expiration
- Email OTP auth: 6-digit codes stored only as sha256 hashes, 10-minute TTL, 5-attempt cap, 60s resend cooldown
- Google OAuth ID-token verification via `google-auth-library`
- CORS configured to allow only frontend origin
- Input validation and sanitization
- Rate limiting on authentication endpoints
- SQL injection prevention via Prisma ORM

## Monitoring & Maintenance

### Key Metrics to Track
- Daily active users
- Day-2 retention rate
- Average session duration
- Question answer rate
- Community engagement (comments, upvotes)

### Regular Maintenance
- Review error logs weekly
- Monitor database performance
- Check API response times
- Update dependencies monthly
- Backup database daily

## Phase Timeline

**Phase 1 (4 weeks):** Core platform with daily questions and basic community features

**Phase 2 (4 weeks):** Study groups, leaderboards, badges, and expanded discussions

**Phase 3 (4 weeks):** Advanced features, extended AI verification, analytics

**Phase 4+ (Ongoing):** Mobile app, additional domains, creator marketplace, advanced features

## Domains Supported

### UPSC (Launch Priority 1)
- 4-level hierarchy matching official UPSC syllabus
- Daily Prelims MCQ questions
- Weekly Mains essay questions

### JEE (Launch Priority 2)
- Physics, Chemistry, Mathematics branches
- Daily PYQ problems
- Multi-part solution submissions

### Finance (Launch Priority 3)
- Stock market basics
- Fundamental and technical analysis
- Personal finance

## Roadmap

- Q1: UPSC launch with 50+ beta users
- Q2: Add study groups and extended leaderboards
- Q3: Launch JEE domain
- Q4: Add analytics and creator tools

## Contributing

1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Include tests for new functionality
4. Submit pull request with description
5. Ensure all tests pass before merge

## Code Style

- TypeScript strict mode enabled
- ESLint configuration enforced
- Prettier for code formatting
- Commit messages follow conventional commits

## Troubleshooting

**Database Connection Failed:**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

**Gemini API Errors:**
- Verify GEMINI_API_KEY is valid
- Check free-tier rate limits (may return 429; verification falls back on failure)
- Review error logs

**Frontend Not Connecting:**
- Verify backend is running on port 3000
- Check VITE_API_URL in .env
- Clear browser cache

## Support

For detailed implementation guides, refer to:
- `UPDATED_COMPLETE_ROADMAP_v2.md` - Technical roadmap
- `COMPLETE_TECHNICAL_SPECIFICATION.md` - Complete specifications
- `ACTION_PLAN_NEXT_STEPS.md` - Weekly breakdown
- `TYPESCRIPT_COMPLETE_GUIDE.md` - Code patterns

## License

MIT License - Open for educational use

## Contact

For questions about the platform concept or implementation, refer to the comprehensive documentation in the `/docs` folder.

---

**Status:** Development (Phase 1)
**Last Updated:** Current session
**Target Launch:** 4 weeks from start
