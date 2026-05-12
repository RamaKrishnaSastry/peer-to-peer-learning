# Setup & Installation Guide

## Quick Start (5 minutes)

### Option 1: Using Docker (Recommended)

```bash
# Clone and navigate
git clone <repo-url>
cd peer-to-peer-learning

# Start all services
docker-compose up

# Access the platform
# Frontend: http://localhost:3000
# Backend: http://localhost:3001/health
```

### Option 2: Manual Setup

#### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (running on localhost:5432)
- npm/yarn

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Edit .env file
nano .env
# Add your database URL and configuration

# Run migrations
npm run prisma:migrate

# Start development server
npm run dev

# Server will run on http://localhost:3001
```

#### Frontend Setup (separate terminal)

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start development server
npm run dev

# Frontend will run on http://localhost:3000
```

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://app_user:password@localhost:5432/learning_platform"

# JWT
JWT_SECRET="your_super_secret_jwt_key"
JWT_EXPIRY="7d"

# Claude API (optional, for verification)
CLAUDE_API_KEY="sk-ant-..."

# Cloudinary (optional, for file uploads)
CLOUDINARY_NAME="your_name"
CLOUDINARY_API_KEY="your_key"
CLOUDINARY_API_SECRET="your_secret"

# Server
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME="Peer Learning Platform"
```

## Database Setup

### Using Docker

Database is automatically setup with docker-compose

### Manual Setup

```bash
# Create PostgreSQL user and database
psql -U postgres

CREATE USER app_user WITH PASSWORD 'password';
CREATE DATABASE learning_platform OWNER app_user;
GRANT ALL PRIVILEGES ON DATABASE learning_platform TO app_user;
\q
```

### Run Migrations

```bash
cd backend
npm run prisma:migrate
npm run prisma:studio  # Optional: Visual database browser
```

## Verification

### Backend Health Check

```bash
curl http://localhost:3001/health
# Expected response: { "status": "ok", "timestamp": "...", "uptime": ... }
```

### Frontend Health Check

- Open http://localhost:3000 in browser
- Should see the home page

### API Test

```bash
# Signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get categories
curl http://localhost:3001/api/categories
```

## Troubleshooting

### Port Already in Use

**Backend (Port 3001)**

```bash
# Find process using port 3001
lsof -i :3001
# Kill process
kill -9 <PID>
```

**Frontend (Port 3000)**

```bash
# Find process using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Database Connection Issues

1. Verify PostgreSQL is running

```bash
psql -U app_user -d learning_platform
```

2. Check DATABASE_URL in .env

```env
DATABASE_URL="postgresql://app_user:password@localhost:5432/learning_platform"
```

3. Run migrations

```bash
npm run prisma:migrate
```

### CORS Errors

1. Check FRONTEND_URL in backend .env
2. Ensure it matches your frontend URL
3. Restart backend server

### Dependencies Issues

```bash
# Clear node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# For backend Prisma issues
npm run prisma:generate
```

## Development Commands

### Backend

```bash
# Development server with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run production server
npm start

# Run tests
npm test
npm run test:watch

# Linting
npm run lint
npm run lint:fix

# Database
npm run prisma:migrate    # Create migration
npm run prisma:generate   # Generate Prisma client
npm run prisma:studio     # Open Prisma Studio
```

### Frontend

```bash
# Development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
```

## Production Deployment

### Backend to Railway

```bash
# Install Railway CLI
npm install -g railway

# Login
railway login

# Initialize project
railway init

# Set environment variables
railway add DATABASE_URL
railway add JWT_SECRET
railway add CLAUDE_API_KEY

# Deploy
railway up
```

### Frontend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

## File Structure Reference

```
peer-to-peer-learning/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Main server
│   │   ├── routes/                # API routes
│   │   ├── middleware/            # Express middleware
│   │   ├── services/              # Business logic
│   │   ├── types/                 # TypeScript definitions
│   │   ├── utils/                 # Helper functions
│   │   ├── prisma/
│   │   │   └── schema.prisma      # Database schema
│   │   └── tests/                 # Test files
│   ├── .env.example               # Environment template
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx               # React entry
│   │   ├── App.tsx                # Root component
│   │   ├── pages/                 # Page components
│   │   ├── components/            # UI components
│   │   ├── contexts/              # React contexts
│   │   ├── hooks/                 # Custom hooks
│   │   ├── utils/                 # Utilities
│   │   └── styles/                # Styling
│   ├── index.html
│   ├── .env.example               # Environment template
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── docs/                          # Documentation
├── docker-compose.yml             # Docker orchestration
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

## Next Steps

1. Install dependencies for both backend and frontend
2. Setup your .env files
3. Run database migrations
4. Start development servers
5. Open http://localhost:3000 in your browser
6. Begin development!

## Support

For issues or questions:

1. Check this guide's troubleshooting section
2. Review backend/README.md or frontend/README.md
3. Check project documentation in /docs
4. Open an issue on GitHub
