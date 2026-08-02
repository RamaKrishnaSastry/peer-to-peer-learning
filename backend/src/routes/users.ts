import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import { authMiddleware } from '../middleware/auth';
import { validateUsername, comparePasswords } from '../utils/helpers';
import prisma from '../db';
import { getStatsWithStreak } from '../services/engagement';

const router = Router();

// Get current user profile
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        badges: {
          select: { earnedAt: true, badge: { select: { id: true, name: true, slug: true } } },
        },
      },
    });
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
        domain: user.domain,
        verified: user.verified,
        createdAt: user.createdAt,
        stats,
        badges: user.badges.map((ub) => ({ ...ub.badge, earnedAt: ub.earnedAt })),
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
    const { bio, avatarUrl, username, domain } = req.body;

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

    const VALID_DOMAINS = ['UPSC', 'JEE', 'Finance'];
    let newDomain: string | undefined;
    if (domain !== undefined) {
      if (!VALID_DOMAINS.includes(domain)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid domain. Choose UPSC, JEE, or Finance',
        });
      }
      newDomain = domain;
    }

    let user;
    try {
      user = await prisma.user.update({
        where: { id: req.userId },
        data: {
          ...(username !== undefined ? { username: newUsername } : {}),
          ...(bio !== undefined ? { bio } : {}),
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
          ...(domain !== undefined ? { domain: newDomain } : {}),
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
        domain: user.domain,
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

// Delete current user account (danger zone). Requires the current password.
// All related rows cascade (content, discussions, answers, comments, etc.).
router.delete('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required to delete your account',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || !(await comparePasswords(password, user.password))) {
      return res.status(401).json({
        success: false,
        error: 'Password is incorrect',
      });
    }

    await prisma.user.delete({ where: { id: user.id } });

    return res.json({
      success: true,
      message: 'Account permanently deleted',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete account',
    });
  }
});

// Get public profile by username
router.get('/:username', async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        badges: {
          select: { earnedAt: true, badge: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

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
        domain: user.domain,
        verified: user.verified,
        createdAt: user.createdAt,
        stats,
        badges: user.badges.map((ub) => ({ ...ub.badge, earnedAt: ub.earnedAt })),
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

// Get a unified recent-activity feed for a user (content, discussions, answers, comments).
router.get('/:username/activity', async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const [content, discussions, answers, comments] = await Promise.all([
      prisma.content.findMany({
        where: { creatorId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, type: true, createdAt: true },
        take: 10,
      }),
      prisma.discussion.findMany({
        where: { creatorId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, createdAt: true },
        take: 10,
      }),
      prisma.answer.findMany({
        where: { creatorId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, text: true, createdAt: true, discussion: { select: { id: true, title: true } } },
        take: 10,
      }),
      prisma.comment.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, text: true, createdAt: true, parentType: true, parentId: true },
        take: 10,
      }),
    ]);

    const events = [
      ...content.map((c) => ({
        kind: 'content',
        id: c.id,
        title: c.title,
        meta: c.type,
        createdAt: c.createdAt,
        href: `/content/${c.id}`,
      })),
      ...discussions.map((d) => ({
        kind: 'discussion',
        id: d.id,
        title: d.title,
        meta: 'started a discussion',
        createdAt: d.createdAt,
        href: `/discussions/${d.id}`,
      })),
      ...answers.map((a) => ({
        kind: 'answer',
        id: a.id,
        title: a.discussion.title,
        meta: a.text,
        createdAt: a.createdAt,
        href: `/discussions/${a.discussion.id}`,
      })),
      ...comments.map((c) => ({
        kind: 'comment',
        id: c.id,
        title: c.parentType === 'content' ? 'commented on content' : `commented on ${c.parentType}`,
        meta: c.text,
        createdAt: c.createdAt,
        href: c.parentType === 'content' ? `/content/${c.parentId}` : undefined,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20);

    return res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('User activity error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user activity',
    });
  }
});

export default router;
