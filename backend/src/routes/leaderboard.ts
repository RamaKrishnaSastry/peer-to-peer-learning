import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import prisma from '../db';

const router = Router();

// Leaderboard ranked by reputation score or streak
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type = 'reputation', domain } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const userWhere = domain ? { domain: domain as string } : {};

    const userRows = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        domain: true,
        verified: true,
        stats: { select: { reputationScore: true, upvotesReceived: true, contentCount: true, answerCount: true } },
        streak: { select: { currentStreak: true, longestStreak: true } },
      },
      orderBy:
        type === 'streak'
          ? [{ streak: { currentStreak: 'desc' } }, { streak: { longestStreak: 'desc' } }]
          : [{ stats: { reputationScore: 'desc' } }, { stats: { upvotesReceived: 'desc' } }],
      take: limit,
    });

    const data = userRows.map((u) => ({
      id: u.id,
      username: u.username,
      bio: u.bio,
      avatarUrl: u.avatarUrl,
      domain: u.domain,
      verified: u.verified,
      stats: {
        reputationScore: u.stats?.reputationScore ?? 0,
        upvotesReceived: u.stats?.upvotesReceived ?? 0,
        contentCount: u.stats?.contentCount ?? 0,
        answerCount: u.stats?.answerCount ?? 0,
        currentStreak: u.streak?.currentStreak ?? 0,
        longestStreak: u.streak?.longestStreak ?? 0,
      },
    }));

    return res.json({
      success: true,
      data,
      type,
      limit,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
    });
  }
});

export default router;
