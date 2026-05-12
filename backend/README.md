# Learning Platform - Backend

TypeScript/Node.js backend for the peer-to-peer learning platform.

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Database Setup

```bash
# Run Prisma migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

## Development

```bash
npm run dev
```

Server runs on `http://localhost:3001`

## Building

```bash
npm run build
```

## Testing

```bash
npm test
npm run test:watch
```

## Linting

```bash
npm run lint
npm run lint:fix
```

## API Documentation

See `docs/API.md` for complete API reference.

## Project Structure

```
src/
├── server.ts              # Main entry point
├── middleware/            # Express middleware
├── routes/               # API route handlers
├── services/             # Business logic
├── types/                # TypeScript interfaces
├── utils/                # Helper functions
└── prisma/               # Prisma schema & migrations
```

## Deployment

### Railway

```bash
# Connect your GitHub repo to Railway
# Select Node.js environment
# Add environment variables
# Deploy
```

See `docs/DEPLOYMENT.md` for detailed instructions.
