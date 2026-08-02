import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import { authMiddleware, requireRole } from '../middleware/auth';
import prisma from '../db';

const router = Router();

const VALID_TYPES = ['content', 'discussion', 'answer', 'comment'];
const VALID_REASONS = ['spam', 'abuse', 'misinformation', 'other'];
const VALID_STATUSES = ['open', 'reviewed', 'dismissed'];

const targetExists = async (targetType: string, targetId: string): Promise<boolean> => {
  switch (targetType) {
    case 'content':
      return !!(await prisma.content.findUnique({ where: { id: targetId } }));
    case 'discussion':
      return !!(await prisma.discussion.findUnique({ where: { id: targetId } }));
    case 'answer':
      return !!(await prisma.answer.findUnique({ where: { id: targetId } }));
    case 'comment':
      return !!(await prisma.comment.findUnique({ where: { id: targetId } }));
    default:
      return false;
  }
};

// Submit a report on content/discussion/answer/comment
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { targetType, targetId, reason, details } = req.body;

    if (!VALID_TYPES.includes(targetType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid target type',
      });
    }
    if (!targetId || typeof targetId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Target id is required',
      });
    }
    if (!VALID_REASONS.includes(reason)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report reason',
      });
    }

    if (!(await targetExists(targetType, targetId))) {
      return res.status(404).json({
        success: false,
        error: 'Target not found',
      });
    }

    const report = await prisma.report.upsert({
      where: {
        reporterId_targetType_targetId: {
          reporterId: req.userId!,
          targetType,
          targetId,
        },
      },
      update: { reason, details: details ?? null },
      create: {
        reporterId: req.userId!,
        targetType,
        targetId,
        reason,
        details: details ?? null,
      },
    });

    return res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Create report error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit report',
    });
  }
});

// List reports (moderation queue) - only 'open' by default. Moderators/admin only.
router.get('/', authMiddleware, requireRole('moderator'), async (req: AuthRequest, res: Response) => {
  try {
    const status = (req.query.status as string) || 'open';
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const [total, items] = await Promise.all([
      prisma.report.count({ where: { status } }),
      prisma.report.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          reporter: { select: { id: true, username: true } },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: items,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('List reports error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
    });
  }
});

// Update report status (reviewed / dismissed). Moderators/admin only.
router.patch('/:id', authMiddleware, requireRole('moderator'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
    }

    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: {
        status,
        ...(reviewNote !== undefined ? { reviewNote } : {}),
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update report error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update report',
    });
  }
});

export default router;
