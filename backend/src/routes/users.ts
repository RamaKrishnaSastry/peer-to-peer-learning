import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import { authMiddleware } from '../middleware/auth';
import { validateUsername } from '../utils/helpers';
import prisma from '../db';
import { getStatsWithStreak } from '../services/engagement';

const router = Router();

// Get current user profile
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
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        verified: user.verified,
        createdAt: user.createdAt,
        stats,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
    });
  }
});

// Update current user profile
router.put('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { bio, avatarUrl, username } = req.body;

    let newUsername: string | undefined;
    if (username !== undefined) {
      newUsername = (username as string).trim().toLowerCase();
      if (!validateUsername(newUsername)) {
        return res.status(400).json({
          success: false,
          error: 'Username must be 3-20 characters: letters, numbers, or underscores',
        });
      }
      const taken = await prisma.user.findFirst({
        where: { username: newUsername, NOT: { id: req.userId } },
      });
      if (taken) {
        return res.status(409).json({
          success: false,
          error: 'Username is already taken',
        });
      }
    }

    let user;
    try {
      user = await prisma.user.update({
        where: { id: req.userId },
        data: {
          ...(username !== undefined ? { username: newUsername } : {}),
          ...(bio !== undefined ? { bio } : {}),
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        },
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

    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Update me error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
    });
  }
});

// Get public profile by username
router.get('/:username', async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({ where: { username } });

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
        id: user.id,
        username: user.username,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        verified: user.verified,
        createdAt: user.createdAt,
        stats,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
    });
  }
});

// Get user's content
router.get('/:username/content', async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const content = await prisma.content.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('User content error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user content',
    });
  }
});

// Get user's answers
router.get('/:username/answers', async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const answers = await prisma.answer.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        discussion: { select: { id: true, title: true } },
      },
    });

    return res.json({
      success: true,
      data: answers,
    });
  } catch (error) {
    console.error('User answers error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user answers',
    });
  }
});

export default router;
