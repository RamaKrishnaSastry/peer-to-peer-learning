import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import { authMiddleware } from '../middleware/auth';
import prisma from '../db';
import { toggleVote } from '../services/votes';

const router = Router();

// Create a comment on any parent (content, answer, discussion)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { parentId, parentType, text } = req.body;

    if (!parentId || !parentType || !text) {
      return res.status(400).json({
        success: false,
        error: 'parentId, parentType, and text are required',
      });
    }

    if (!['content', 'answer', 'discussion'].includes(parentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parentType',
      });
    }

    const comment = await prisma.comment.create({
      data: {
        parentId,
        parentType,
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
    console.error('Create comment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add comment',
    });
  }
});

// Upvote a comment (toggles)
router.post('/:id/upvote', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    const result = await toggleVote(req.userId!, id, 'comment');

    const updated = await prisma.comment.findUnique({ where: { id }, select: { upvoteCount: true } });

    return res.json({
      success: true,
      data: { voted: result.voted, count: updated?.upvoteCount ?? 0 },
    });
  } catch (error) {
    console.error('Upvote comment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upvote comment',
    });
  }
});

// Delete own comment
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    if (comment.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment',
      });
    }

    await prisma.comment.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Comment deleted',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete comment',
    });
  }
});

export default router;
