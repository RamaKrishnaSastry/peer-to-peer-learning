# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript + Tailwind CSS                        │
│  - Pages: Home, Login, Signup, Categories, Content, etc.     │
│  - Components: Navbar, Footer, Loading, Cards, Forms         │
│  - Hooks: useAuth, useFetch, useLocalStorage                 │
│  - Context: AuthContext for user authentication              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTP/REST API
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                      SERVER LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Express.js + TypeScript                                      │
│  - Routes: auth, categories, content, discussions, users      │
│  - Middleware: JWT auth, error handling, CORS                 │
│  - Services: LLM verification (Claude), database queries       │
│  - Types: Comprehensive TypeScript interfaces                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ ORM/SQL
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    DATABASE LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL 14+ with Prisma ORM                              │
│  - Users, Categories, Content, Discussions                   │
│  - Answers, Comments, Ratings, Streaks                       │
│  - Badges, UserStats                                         │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Authentication Flow

```
User Input (Login/Signup)
    ↓
Frontend validates input
    ↓
POST /api/auth/login | /api/auth/signup
    ↓
Backend validates credentials
    ↓
Hash password with bcrypt
    ↓
Create JWT token
    ↓
Store in localStorage
    ↓
Add to API request headers
```

### Content Creation Flow

```
User uploads content
    ↓
Frontend validates form
    ↓
POST /api/content
    ↓
Backend validates input
    ↓
Check user authentication
    ↓
Store in database
    ↓
Return created content
    ↓
Update frontend
```

### Discussion & Answer Flow

```
User creates discussion
    ↓
POST /api/discussions
    ↓
Stored in DB with creator ID
    ↓

User posts answer
    ↓
POST /api/discussions/:id/answers
    ↓
Optional: Send to Claude for verification
    ↓
Store in DB
    ↓
Update leaderboard
    ↓
Update streak
```

## API Structure

All endpoints follow RESTful conventions:

```
GET    /api/resource           - List resources
GET    /api/resource/:id       - Get single resource
POST   /api/resource           - Create resource (auth required)
PUT    /api/resource/:id       - Update resource (auth required)
DELETE /api/resource/:id       - Delete resource (auth required)
```

## Database Schema Highlights

### Core Tables

- **users**: User accounts and profiles
- **categories**: 4-level hierarchical structure
- **content**: Shared educational material
- **discussions**: Q&A threads
- **answers**: Responses to discussions

### Engagement Tables

- **streaks**: Track user engagement
- **ratings**: Content ratings (1-5 stars)
- **badges**: User achievements

### Relationship Tables

- **comments**: On content or answers
- **user_badges**: Awards given to users

## Authentication

### Token-Based (JWT)

1. User logs in with email/password
2. Backend returns JWT token
3. Token stored in localStorage
4. Included in all authenticated requests
5. Validated on backend for protected routes

### Security

- Passwords hashed with bcryptjs
- JWT tokens expire after 7 days
- CORS configured for frontend domain
- Input validation on all endpoints

## Real-Time Features (Future)

Consider WebSockets for:

- Live discussion notifications
- Real-time leaderboard updates
- Instant answer verification
- User presence indicators

## Scalability Considerations

### Current (MVP)

- Single backend server
- PostgreSQL database
- In-memory caching (future)

### Future Improvements

- Redis caching layer
- Read replicas for database
- Load balancing
- CDN for static assets
- Message queue for async tasks

## Security Layers

1. **Frontend**: Input validation, XSS prevention
2. **Network**: HTTPS, CORS
3. **Authentication**: JWT tokens, password hashing
4. **Database**: SQL injection prevention via ORM
5. **API**: Rate limiting, request validation

## Monitoring & Logging

Setup recommendations:

- Error tracking (Sentry)
- Performance monitoring (New Relic)
- Application logs (Winston)
- Database monitoring (Datadog)

## Deployment Architecture

```
Client Browser
    ↓
Vercel CDN (Frontend)
    ↓
Railway (Backend)
    ↓
PostgreSQL (Railway)
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup.
