import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import { authMiddleware } from '../middleware/auth';
import prisma from '../db';
import { toggleVote } from '../services/votes';
import { recalculateUserStats } from '../services/engagement';

const router = Router();

// Upvote an answer (positive-only, toggles)
router.post('/:id/upvote', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const answer = await prisma.answer.findUnique({ where: { id } });

    if (!answer) {
      return res.status(404).json({
        success: false,
        error: 'Answer not found',
      });
    }

    const result = await toggleVote(req.userId!, id, 'answer');
    await recalculateUserStats(answer.creatorId);

    const updated = await prisma.answer.findUnique({ where: { id }, select: { upvoteCount: true } });

    return res.json({
      success: true,
      data: { voted: result.voted, count: updated?.upvoteCount ?? 0 },
    });
  } catch (error) {
    console.error('Upvote answer error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upvote answer',
    });
  }
});

// Comment on an answer
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

    const answer = await prisma.answer.findUnique({ where: { id } });
    if (!answer) {
      return res.status(404).json({
        success: false,
        error: 'Answer not found',
      });
    }

    const comment = await prisma.comment.create({
      data: {
        parentId: id,
        parentType: 'answer',
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
    console.error('Comment on answer error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add comment',
    });
  }
});

export default router;
