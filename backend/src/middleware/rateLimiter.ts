import rateLimit from 'express-rate-limit';
import { Response } from 'express';

const isTest = process.env.NODE_ENV === 'test';

const jsonLimiterMessage = (message: string) =>
  (_req: any, res: Response) => {
    res.status(429).json({ success: false, error: message });
  };

// In tests, rate limits are disabled so the suite can exercise endpoints freely.
const baseConfig = (message: string, limit: number, windowMs: number) =>
  isTest
    ? { skip: () => true, windowMs: 1, limit: 1, standardHeaders: false, legacyHeaders: false }
    : {
        windowMs,
        limit,
        standardHeaders: true,
        legacyHeaders: false,
        handler: jsonLimiterMessage(message),
      };

// General API limiter: protects every /api route from burst abuse.
export const apiLimiter = rateLimit(
  baseConfig('Too many requests. Please try again later.', 600, 15 * 60 * 1000),
);

// Auth-sensitive endpoints (OTP, login, password reset): brute-force protection.
export const authLimiter = rateLimit(
  baseConfig(
    'Too many authentication attempts. Please wait a while and try again.',
    20,
    15 * 60 * 1000,
  ),
);

// Write endpoints (content/discussion creation): slow down spam while allowing normal usage.
export const writeLimiter = rateLimit(
  baseConfig('Too many requests. Please try again later.', 60, 15 * 60 * 1000),
);

