import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { AuthRequest } from '../types/express';
import {
  hashPassword,
  comparePasswords,
  validatePassword,
  validateUsername,
} from '../utils/helpers';
import { requestOtp, verifyOtp } from '../services/otp';
import prisma from '../db';
import { getStatsWithStreak } from '../services/engagement';
import { authMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const JWT_EXPIRY = (process.env.JWT_EXPIRY || '7d') as jwt.SignOptions['expiresIn'];

const signToken = (userId: string): string =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

const toSafeUser = (user: any) => {
  const { password, ...safe } = user;
  return safe;
};

const generateUniqueUsername = async (email: string): Promise<string> => {
  const base =
    email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20) || 'user';

  let username = base;
  let suffix = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${suffix++}`;
  }
  return username;
};

// Request an email OTP (dev: code is logged to the console and echoed back)
router.post('/otp/request', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;
    const { devOtp } = await requestOtp(email);
    return res.json({
      success: true,
      data: { devOtp },
    });
  } catch (error: any) {
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to send verification code',
    });
  }
});

// Verify the email OTP and create the account with the chosen password.
// OTP is used only for registration; login is password-based.
router.post('/otp/verify', async (req: AuthRequest, res: Response) => {
  try {
    const { email, code, password, username, domain } = req.body;

    if (!password || !validatePassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }

    const VALID_DOMAINS = ['UPSC', 'JEE', 'Finance'];
    if (!domain || !VALID_DOMAINS.includes(domain)) {
      return res.status(400).json({
        success: false,
        error: 'Please select a valid exam domain (UPSC, JEE, or Finance)',
      });
    }

    const customUsername =
      typeof username === 'string' && username.trim() !== ''
        ? username.trim().toLowerCase()
        : undefined;

    if (customUsername !== undefined) {
      if (!validateUsername(customUsername)) {
        return res.status(400).json({
          success: false,
          error: 'Username must be 3-20 characters: letters, numbers, or underscores',
        });
      }
      const taken = await prisma.user.findUnique({ where: { username: customUsername } });
      if (taken) {
        return res.status(409).json({
          success: false,
          error: 'Username is already taken',
        });
      }
    }

    await verifyOtp(email, code);

    const normalized = (email as string).trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalized } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account already exists for this email. Please login.',
      });
    }

    const finalUsername =
      customUsername ?? (await generateUniqueUsername(normalized));
    const hashedPassword = await hashPassword(password);

    let user;
    try {
      user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: normalized,
            username: finalUsername,
            password: hashedPassword,
            domain,
            verified: true,
          },
        });
        await tx.userStats.create({ data: { userId: created.id } });
        return created;
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: 'Username is already taken',
        });
      }
      throw error;
    }

    const token = signToken(user.id);

    return res.json({
      success: true,
      data: {
        token,
        user: toSafeUser(user),
      },
    });
  } catch (error: any) {
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to verify code',
    });
  }
});

// Login with the password chosen at registration (accepts email or username)
router.post('/login', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const identifier = (email as string).trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    });

    if (!user || !(await comparePasswords(password, user.password))) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const token = signToken(user.id);

    return res.json({
      success: true,
      data: {
        token,
        user: toSafeUser(user),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

// Request a password-reset OTP. Always returns success (no user enumeration);
// the account is validated at reset time.
router.post('/forgot-password', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;
    const { devOtp } = await requestOtp(email);
    return res.json({
      success: true,
      data: { devOtp },
    });
  } catch (error: any) {
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to send reset code',
    });
  }
});

// Verify the reset OTP and set a new password
router.post('/reset-password', authLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!newPassword || !validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }

    await verifyOtp(email, code);

    const normalized = (email as string).trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account found for this email',
      });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res.json({
      success: true,
      message: 'Password reset successfully. You can now login.',
    });
  } catch (error: any) {
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to reset password',
    });
  }
});

// Google OAuth (register or login with a Google ID token)
router.post('/google', async (req: AuthRequest, res: Response) => {
  try {
    const { idToken } = req.body;
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'idToken is required',
      });
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        success: false,
        error: 'Google sign-in is not configured on the server',
      });
    }

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.email_verified || !payload.sub) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Google token',
      });
    }

    const googleEmail = payload.email;
    const googleSub = payload.sub;
    const googlePicture = payload.picture ?? null;

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: googleSub }, { email: googleEmail }] },
    });

    if (!user) {
      // No auto-create: Google sign-in requires a registered account.
      return res.status(401).json({
        success: false,
        error: 'No account found for this email. Please register first.',
      });
    }

    if (!user.googleId) {
      // Existing email/password account signing in with Google for the first time
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleSub,
          verified: true,
          ...(user.avatarUrl ? {} : { avatarUrl: googlePicture }),
        },
      });
    }

    const token = signToken(user.id);

    return res.json({
      success: true,
      data: {
        token,
        user: toSafeUser(user),
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid Google token',
    });
  }
});

// Change password while logged in (verifies the current password).
router.post(
  '/change-password',
  authLimiter,
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current and new password are required',
        });
      }

      if (!validatePassword(newPassword)) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 8 characters',
        });
      }

      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user || !(await comparePasswords(currentPassword, user.password))) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect',
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { password: await hashPassword(newPassword) },
      });

      return res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Failed to change password',
      });
    }
  },
);

// Get current user with stats
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const stats = await getStatsWithStreak(user.id);

    return res.json({
      success: true,
      data: {
        ...toSafeUser(user),
        stats,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

export default router;
