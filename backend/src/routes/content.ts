import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import prisma from '../db';
import { toggleVote } from '../services/votes';
import { recalculateUserStats } from '../services/engagement';

const router = Router();

const getVoteCounts = async (contentIds: string[]): Promise<Map<string, number>> => {
  if (contentIds.length === 0) return new Map();
  const votes = await prisma.vote.groupBy({
    by: ['parentId'],
    where: { parentType: 'content', parentId: { in: contentIds } },
    _count: { _all: true },
  });
  return new Map(votes.map((v) => [v.parentId, v._count._all]));
};

const getCommentCounts = async (contentIds: string[]): Promise<Map<string, number>> => {
  if (contentIds.length === 0) return new Map();
  const comments = await prisma.comment.groupBy({
    by: ['parentId'],
    where: { parentType: 'content', parentId: { in: contentIds } },
    _count: { _all: true },
  });
  return new Map(comments.map((c) => [c.parentId, c._count._all]));
};

// List content with filters + pagination
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
      sort === 'rating'
        ? [{ avgRating: 'desc' as const }, { ratingCount: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];

    const [total, items] = await Promise.all([
      prisma.content.count({ where }),
      prisma.content.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          creator: { select: { id: true, username: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);

    const [voteCounts, commentCounts] = await Promise.all([
      getVoteCounts(items.map((c) => c.id)),
      getCommentCounts(items.map((c) => c.id)),
    ]);

    const data = items.map((c) => ({
      id: c.id,
      creatorId: c.creatorId,
      creator: c.creator,
      categoryId: c.categoryId,
      category: c.category,
      title: c.title,
      description: c.description,
      type: c.type,
      contentUrl: c.contentUrl,
      version: c.version,
      avgRating: c.avgRating,
      ratingCount: c.ratingCount,
      commentCount: commentCounts.get(c.id) ?? 0,
      upvoteCount: voteCounts.get(c.id) ?? 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
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
    console.error('List content error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch content',
    });
  }
});

// Get single content with comments + ratings
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [content, comments, voteCount] = await Promise.all([
      prisma.content.findUnique({
        where: { id },
        include: {
          creator: { select: { id: true, username: true } },
          category: { select: { id: true, name: true, slug: true } },
          ratings: { select: { id: true, userId: true, stars: true } },
        },
      }),
      prisma.comment.findMany({
        where: { parentType: 'content', parentId: id },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, username: true } } },
      }),
      prisma.vote.count({ where: { parentType: 'content', parentId: id } }),
    ]);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    let myRating: number | null = null;
    if (req.userId) {
      const mine = content.ratings.find((r) => r.userId === req.userId);
      myRating = mine ? mine.stars : null;
    }

    const commentIds = comments.map((c) => c.id);
    const myVotedCommentIds = req.userId
      ? await prisma.vote.findMany({
          where: { parentType: 'comment', parentId: { in: commentIds }, userId: req.userId },
          select: { parentId: true },
        })
      : [];
    const myVoteSet = new Set(myVotedCommentIds.map((v) => v.parentId));

    return res.json({
      success: true,
      data: {
        ...content,
        comments: comments.map((c) => ({ ...c, myVote: myVoteSet.has(c.id) })),
        upvoteCount: voteCount,
        myRating,
        ratings: undefined,
      },
    });
  } catch (error) {
    console.error('Get content error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch content',
    });
  }
});

// Upload content
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, type, contentUrl, categoryId } = req.body;

    if (!title || !description || !type || !contentUrl || !categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    if (!['video', 'notes'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid content type',
      });
    }

    const category = await prisma.category.findUnique({ where: { id: parseInt(categoryId) } });
    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category',
      });
    }

    const content = await prisma.content.create({
      data: {
        creatorId: req.userId!,
        categoryId: category.id,
        title,
        description,
        type,
        contentUrl,
      },
    });

    await recalculateUserStats(req.userId!);

    return res.status(201).json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error('Upload content error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload content',
    });
  }
});

// Update content
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const content = await prisma.content.findUnique({ where: { id } });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    if (content.creatorId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this content',
      });
    }

    const { title, description, contentUrl } = req.body;

    const updated = await prisma.content.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(contentUrl ? { contentUrl } : {}),
        version: { increment: 1 },
      },
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update content error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update content',
    });
  }
});

// Delete content
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const content = await prisma.content.findUnique({ where: { id } });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    if (content.creatorId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this content',
      });
    }

    await prisma.content.delete({ where: { id } });
    await recalculateUserStats(req.userId!);

    return res.json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error) {
    console.error('Delete content error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete content',
    });
  }
});

// Comment on content
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

    const content = await prisma.content.findUnique({ where: { id } });
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    const comment = await prisma.comment.create({
      data: {
        parentId: id,
        parentType: 'content',
        userId: req.userId!,
        text,
      },
      include: { user: { select: { id: true, username: true } } },
    });

    return res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error('Comment on content error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add comment',
    });
  }
});

// Rate content (1-5 stars)
router.post('/:id/rate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const stars = parseInt(req.body.stars);

    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5',
      });
    }

    const content = await prisma.content.findUnique({ where: { id } });
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    await prisma.rating.upsert({
      where: { contentId_userId: { contentId: id, userId: req.userId! } },
      update: { stars },
      create: { contentId: id, userId: req.userId!, stars },
    });

    const aggregate = await prisma.rating.aggregate({
      where: { contentId: id },
      _avg: { stars: true },
      _count: { stars: true },
    });

    const updated = await prisma.content.update({
      where: { id },
      data: {
        avgRating: aggregate._avg.stars ?? 0,
        ratingCount: aggregate._count.stars,
      },
    });

    return res.json({
      success: true,
      data: {
        avgRating: updated.avgRating,
        ratingCount: updated.ratingCount,
        myRating: stars,
      },
    });
  } catch (error) {
    console.error('Rate content error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to rate content',
    });
  }
});

// Upvote content (positive-only feedback, toggles)
router.post('/:id/upvote', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const content = await prisma.content.findUnique({ where: { id } });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    const result = await toggleVote(req.userId!, id, 'content');
    await recalculateUserStats(content.creatorId);

    const count = await prisma.vote.count({ where: { parentType: 'content', parentId: id } });

    return res.json({
      success: true,
      data: { voted: result.voted, count },
    });
  } catch (error) {
    console.error('Upvote content error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upvote content',
    });
  }
});

export default router;
