import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import prisma from '../db';
import { recalculateUserStats, awardBadge } from '../services/engagement';
import { notify } from '../services/notifications';

const router = Router();

// List discussions with pagination + sorting
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, sort = 'newest', domain } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    const where = {
      ...(categoryId ? { categoryId: parseInt(categoryId as string) } : {}),
      ...(domain ? { category: { domain: domain as string } } : {}),
    };

    const orderBy =
      sort === 'top'
        ? [{ answerCount: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];

    const [total, items] = await Promise.all([
      prisma.discussion.count({ where }),
      prisma.discussion.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          creator: { select: { id: true, username: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { answers: true } },
        },
      }),
    ]);

    const data = items.map((d) => ({
      ...d,
      answerCount: d._count.answers,
      _count: undefined,
    }));

    return res.json({
      success: true,
      data,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('List discussions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch discussions',
    });
  }
});

// Get single discussion with answers
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const discussion = await prisma.discussion.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, username: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!discussion) {
      return res.status(404).json({
        success: false,
        error: 'Discussion not found',
      });
    }

    await prisma.discussion.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const answers = await prisma.answer.findMany({
      where: { discussionId: id },
      orderBy: [{ upvoteCount: 'desc' }, { createdAt: 'asc' }],
      include: {
        creator: { select: { id: true, username: true } },
      },
    });

    const commentCounts = await prisma.comment.groupBy({
      by: ['parentId'],
      where: { parentType: 'answer', parentId: { in: answers.map((a) => a.id) } },
      _count: { _all: true },
    });
    const commentCountMap = new Map(commentCounts.map((c) => [c.parentId, c._count._all]));

    const answerIds = answers.map((a) => a.id);
    const myVotedAnswerIds = req.userId
      ? await prisma.vote.findMany({
          where: { parentType: 'answer', parentId: { in: answerIds }, userId: req.userId },
          select: { parentId: true },
        })
      : [];
    const myVoteSet = new Set(myVotedAnswerIds.map((v) => v.parentId));

    return res.json({
      success: true,
      data: {
        ...discussion,
        viewCount: discussion.viewCount + 1,
        answers: answers.map((a) => ({
          ...a,
          commentCount: commentCountMap.get(a.id) ?? 0,
          myVote: myVoteSet.has(a.id),
        })),
      },
    });
  } catch (error) {
    console.error('Get discussion error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch discussion',
    });
  }
});

// Create discussion
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, categoryId } = req.body;

    if (!title || !description || !categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const category = await prisma.category.findUnique({ where: { id: parseInt(categoryId) } });
    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category',
      });
    }

    const discussion = await prisma.discussion.create({
      data: {
        creatorId: req.userId!,
        categoryId: category.id,
        title,
        description,
      },
      include: {
        creator: { select: { id: true, username: true } },
      },
    });

    return res.status(201).json({
      success: true,
      data: discussion,
    });
  } catch (error) {
    console.error('Create discussion error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create discussion',
    });
  }
});

// Close a discussion (creator only) so no further answers can be posted
router.post('/:id/close', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) {
      return res.status(404).json({
        success: false,
        error: 'Discussion not found',
      });
    }
    if (discussion.creatorId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the discussion starter can end this discussion',
      });
    }

    const updated = await prisma.discussion.update({
      where: { id },
      data: { isClosed: true },
      select: { id: true, isClosed: true },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Close discussion error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to close discussion',
    });
  }
});

// Reopen a discussion (creator only)
router.post('/:id/reopen', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) {
      return res.status(404).json({
        success: false,
        error: 'Discussion not found',
      });
    }
    if (discussion.creatorId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the discussion starter can reopen this discussion',
      });
    }

    const updated = await prisma.discussion.update({
      where: { id },
      data: { isClosed: false },
      select: { id: true, isClosed: true },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Reopen discussion error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reopen discussion',
    });
  }
});

// Post answer
router.post('/:id/answers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Answer text is required',
      });
    }

    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) {
      return res.status(404).json({
        success: false,
        error: 'Discussion not found',
      });
    }
    if (discussion.isClosed) {
      return res.status(403).json({
        success: false,
        error: 'This discussion has ended. No more answers can be posted.',
      });
    }

    const answer = await prisma.$transaction(async (tx) => {
      const created = await tx.answer.create({
        data: {
          discussionId: id,
          creatorId: req.userId!,
          text,
        },
        include: { creator: { select: { id: true, username: true } } },
      });
      await tx.discussion.update({
        where: { id },
        data: { answerCount: { increment: 1 } },
      });
      return created;
    });

    await recalculateUserStats(req.userId!);
    await awardBadge(req.userId!, 'helper');

    const actor = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { username: true },
    });
    await notify(discussion.creatorId, req.userId!, {
      type: 'answer_on_discussion',
      message: `${actor?.username ?? 'Someone'} answered your discussion "${discussion.title.slice(0, 60)}"`,
      targetType: 'discussion',
      targetId: id,
      actorName: actor?.username,
    });

    return res.status(201).json({
      success: true,
      data: answer,
    });
  } catch (error) {
    console.error('Post answer error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to post answer',
    });
  }
});

// Comment on a discussion
router.post('/:id/comment', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required',
      });
    }

    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) {
      return res.status(404).json({
        success: false,
        error: 'Discussion not found',
      });
    }

    const comment = await prisma.comment.create({
      data: {
        parentId: id,
        parentType: 'discussion',
        userId: req.userId!,
        text,
      },
      include: { user: { select: { id: true, username: true } } },
    });

    await notify(discussion.creatorId, req.userId!, {
      type: 'comment_on_discussion',
      message: `${comment.user.username} commented on your discussion "${discussion.title.slice(0, 60)}"`,
      targetType: 'discussion',
      targetId: id,
      actorName: comment.user.username,
    });

    return res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error('Comment on discussion error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add comment',
    });
  }
});

export default router;
