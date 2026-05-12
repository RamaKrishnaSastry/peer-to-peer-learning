# Peer Learning Platform - Contributing Guide

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Git
- PostgreSQL 14+

### Development Setup

1. **Clone the repository**

```bash
git clone <repo-url>
cd peer-to-peer-learning
```

2. **Backend Setup**

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run prisma:migrate
npm run dev
```

3. **Frontend Setup** (in another terminal)

```bash
cd frontend
npm install
npm run dev
```

## Project Architecture

### Backend

- Express.js API server on port 3001
- PostgreSQL database with Prisma ORM
- JWT-based authentication
- Modular route structure
- TypeScript for type safety

### Frontend

- React + TypeScript SPA
- Vite for fast development
- Tailwind CSS for styling
- React Query for data fetching
- React Router for navigation

## Development Workflow

### Creating a New Feature

1. Create a feature branch

```bash
git checkout -b feature/my-feature
```

2. Make your changes in the appropriate files
3. Test locally
4. Commit with descriptive messages
5. Push and create a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing code structure
- Use descriptive variable/function names
- Add comments for complex logic
- Run linting before committing

```bash
# Backend
cd backend
npm run lint
npm run lint:fix

# Frontend
cd frontend
npm run lint
npm run lint:fix
```

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests (to be implemented)
cd frontend
npm test
```

## API Development

### Adding a New Route

1. Create handler function in appropriate route file
2. Add TypeScript types for request/response
3. Add authentication middleware if needed
4. Document the endpoint

Example:

```typescript
// In src/routes/myfeature.ts
import { Router } from "express";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/:id", authMiddleware, (req, res) => {
  // Handler logic
});

export default router;
```

### Database Changes

1. Update schema in `backend/src/prisma/schema.prisma`
2. Create migration: `npm run prisma:migrate`
3. Generate updated types: `npm run prisma:generate`

## Frontend Development

### Creating a New Page

1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Style with Tailwind CSS
4. Use TypeScript for prop typing

### Creating a Component

1. Create component file in `src/components/`
2. Use TypeScript for prop types
3. Keep components focused and reusable
4. Document complex logic

## Debugging

### Backend

- Check server logs in terminal
- Use `console.log()` or debugger
- Check `.env` configuration
- Verify database connection

### Frontend

- Use React DevTools browser extension
- Check browser console for errors
- Use React Query DevTools
- Verify API connection with network tab

## Common Issues

### Database Connection Failed

- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

### Port Already in Use

- Backend: Change PORT in .env
- Frontend: Change port in vite.config.ts

### CORS Issues

- Check FRONTEND_URL in backend .env
- Verify proxy settings in vite.config.ts

## Performance Tips

- Use React Query for efficient data fetching
- Implement pagination for large lists
- Optimize images and assets
- Use code splitting for routes
- Monitor bundle size

## Security

- Never commit .env files
- Always use environment variables for secrets
- Validate input on both frontend and backend
- Use HTTPS in production
- Keep dependencies updated

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Questions?

Open an issue or discussion in the repository for questions or suggestions.
