import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { AuthRequest } from '../types/express';
import { hashPassword } from '../utils/helpers';
import { requestOtp, verifyOtp } from '../services/otp';
import prisma from '../db';
import { getStatsWithStreak } from '../services/engagement';
import { authMiddleware } from '../middleware/auth';

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
router.post('/otp/request', async (req: AuthRequest, res: Response) => {
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

// Verify the OTP and log in / create the account
router.post('/otp/verify', async (req: AuthRequest, res: Response) => {
  try {
    const { email, code } = req.body;
    await verifyOtp(email, code);

    const normalized = (email as string).trim().toLowerCase();

    let user = await prisma.user.findUnique({ where: { email: normalized } });

    if (!user) {
      const username = await generateUniqueUsername(normalized);
      const hashedPassword = await hashPassword(crypto.randomBytes(32).toString('hex'));
      user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: normalized,
            username,
            password: hashedPassword,
            verified: true,
          },
        });
        await tx.userStats.create({ data: { userId: created.id } });
        return created;
      });
    } else if (!user.verified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { verified: true },
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
  } catch (error: any) {
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to verify code',
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
      const username = await generateUniqueUsername(googleEmail);
      const hashedPassword = await hashPassword(crypto.randomBytes(32).toString('hex'));

      user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: googleEmail,
            username,
            password: hashedPassword,
            googleId: googleSub,
            avatarUrl: googlePicture,
            verified: true,
          },
        });
        await tx.userStats.create({ data: { userId: created.id } });
        return created;
      });
    } else if (!user.googleId) {
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
