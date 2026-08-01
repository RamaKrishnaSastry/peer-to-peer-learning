import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { AuthRequest } from '../types/express';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Reject tokens whose user no longer exists (e.g. after a DB reset),
    // otherwise writes fail with confusing FK errors.
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true },
    });
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Session expired, please log in again',
      });
      return;
    }

    req.userId = decoded.userId;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

// Authenticate when a token is present, but allow anonymous access otherwise.
export const optionalAuth = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    next();
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    req.token = token;
  } catch (error) {
    // Invalid token on a public route: treat as anonymous.
  }
  next();
};

export const errorHandler = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', error);

  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: error.message,
    });
    return;
  }

  if (error.name === 'UnauthorizedError') {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
    return;
  }

  if (error.code === 'P2025') {
    res.status(404).json({
      success: false,
      error: 'Resource not found',
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
};

export const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
