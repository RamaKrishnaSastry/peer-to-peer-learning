import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import { authMiddleware } from '../middleware/auth';
import { ApiResponse, UserProfile } from '../types/index';

const router = Router();

// Mock users data
const users: any[] = [];

// Get user profile by username
router.get('/:username', (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const user = users.find((u) => u.username === username);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const profile = {
      ...user,
      password: undefined,
      stats: {
        reputationScore: 150,
        upvotesReceived: 45,
        contentCount: 12,
        answerCount: 28,
        currentStreak: 5,
        longestStreak: 15,
      },
    };

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
    });
  }
});

// Get current user profile
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const user = users.find((u) => u.id === req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: { ...user, password: undefined },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
    });
  }
});

// Update user profile
router.put('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const user = users.find((u) => u.id === req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const { bio, avatarUrl } = req.body;

    if (bio !== undefined) user.bio = bio;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    user.updatedAt = new Date();

    return res.json({
      success: true,
      data: { ...user, password: undefined },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
    });
  }
});

// Get user's content
router.get('/:username/content', (req: AuthRequest, res: Response) => {
  try {
    // Implementation would fetch user's content from database
    return res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user content',
    });
  }
});

export default router;
