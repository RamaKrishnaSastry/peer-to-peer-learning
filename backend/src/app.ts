import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import contentRoutes from './routes/content';
import discussionRoutes from './routes/discussions';
import answerRoutes from './routes/answers';
import commentRoutes from './routes/comments';
import userRoutes from './routes/users';
import dailyQuestionRoutes from './routes/dailyQuestions';
import searchRoutes from './routes/search';
import notificationRoutes from './routes/notifications';
import leaderboardRoutes from './routes/leaderboard';
import reportRoutes from './routes/reports';

// Middleware
import { errorHandler, corsOptions } from './middleware/auth';
import { apiLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

dotenv.config();

export const createApp = (): Express => {
  const app: Express = express();

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Request logging
  app.use((req: Request, _res: Response, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API Routes (general rate limit guards all API traffic)
  app.use('/api', apiLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/discussions', discussionRoutes);
  app.use('/api/answers', answerRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/daily-questions', dailyQuestionRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/reports', reportRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  return app;
};

export default createApp;
