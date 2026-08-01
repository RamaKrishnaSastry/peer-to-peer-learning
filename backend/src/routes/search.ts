import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import prisma from '../db';

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

// Search content, discussions, and categories
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const q = String(req.query.q ?? '').trim();
    const domain = req.query.domain as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);

    if (!q) {
      return res.json({ success: true, data: { q, content: [], discussions: [], categories: [], total: 0 } });
    }

    const domainWhere = domain ? { domain } : undefined;
    const contentWhere = {
      AND: [
        { OR: [{ title: { contains: q } }, { description: { contains: q } }] },
        ...(domain ? [{ category: { domain } }] : []),
      ],
    };
    const discussionWhere = {
      AND: [
        { OR: [{ title: { contains: q } }, { description: { contains: q } }] },
        ...(domain ? [{ category: { domain } }] : []),
      ],
    };

    const [contentRows, discussionRows, categoryRows] = await Promise.all([
      prisma.content.findMany({
        where: contentWhere,
        orderBy: [{ avgRating: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        include: {
          creator: { select: { id: true, username: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.discussion.findMany({
        where: discussionWhere,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          creator: { select: { id: true, username: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.category.findMany({
        where: { AND: [{ OR: [{ name: { contains: q } }, { path: { contains: q } }] }, ...(domainWhere ? [domainWhere] : [])] },
        take: limit,
      }),
    ]);

    const [voteCounts, commentCounts] = await Promise.all([
      getVoteCounts(contentRows.map((c) => c.id)),
      getCommentCounts(contentRows.map((c) => c.id)),
    ]);

    const content = contentRows.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      type: c.type,
      contentUrl: c.contentUrl,
      avgRating: c.avgRating,
      ratingCount: c.ratingCount,
      commentCount: commentCounts.get(c.id) ?? 0,
      upvoteCount: voteCounts.get(c.id) ?? 0,
      createdAt: c.createdAt,
      creator: c.creator,
      category: c.category,
    }));

    const discussions = discussionRows.map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      answerCount: d.answerCount,
      isClosed: d.isClosed,
      createdAt: d.createdAt,
      creator: d.creator,
      category: d.category,
    }));

    const categories = categoryRows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      domain: c.domain,
      level: c.level,
      path: c.path,
    }));

    return res.json({
      success: true,
      data: { q, content, discussions, categories, total: content.length + discussions.length + categories.length },
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search',
    });
  }
});

export default router;
