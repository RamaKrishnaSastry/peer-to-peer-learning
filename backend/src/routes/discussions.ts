import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import { authMiddleware } from '../middleware/auth';
import { ApiResponse, Discussion, Answer, PostAnswerRequest } from '../types/index';

const router = Router();

// Mock data
const discussions: Discussion[] = [];
const answers: Answer[] = [];

// Get all discussions
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, limit = 10, offset = 0 } = req.query;

    let filtered = [...discussions];

    if (categoryId) {
      filtered = filtered.filter((d) => d.categoryId === parseInt(categoryId as string));
    }

    const paged = filtered.slice(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string)
    );

    return res.json({
      success: true,
      data: paged,
      total: filtered.length,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore:
        parseInt(offset as string) + parseInt(limit as string) < filtered.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch discussions',
    });
  }
});

// Get single discussion with answers
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const discussion = discussions.find((d) => d.id === id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        error: 'Discussion not found',
      });
    }

    const discussionAnswers = answers.filter((a) => a.discussionId === id);

    return res.json({
      success: true,
      data: {
        ...discussion,
        answers: discussionAnswers,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch discussion',
    });
  }
});

// Create discussion
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { title, description, categoryId } = req.body;

    if (!title || !description || !categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const newDiscussion: Discussion = {
      id: crypto.randomUUID(),
      creatorId: req.userId!,
      categoryId,
      title,
      description,
      answerCount: 0,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    discussions.push(newDiscussion);

    return res.status(201).json({
      success: true,
      data: newDiscussion,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to create discussion',
    });
  }
});

// Post answer
router.post('/:id/answers', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text }: PostAnswerRequest = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Answer text is required',
      });
    }

    const discussion = discussions.find((d) => d.id === id);
    if (!discussion) {
      return res.status(404).json({
        success: false,
        error: 'Discussion not found',
      });
    }

    const newAnswer: Answer = {
      id: crypto.randomUUID(),
      discussionId: id,
      creatorId: req.userId!,
      text,
      verified: false,
      verdict: null,
      upvoteCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    answers.push(newAnswer);
    discussion.answerCount += 1;

    return res.status(201).json({
      success: true,
      data: newAnswer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to post answer',
    });
  }
});

export default router;
