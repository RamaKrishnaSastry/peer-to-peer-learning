import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import { authMiddleware } from '../middleware/auth';
import { ApiResponse, Content, UploadContentRequest } from '../types/index';

const router = Router();

// Mock content data
const contents: Content[] = [];

// Get all content
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, limit = 10, offset = 0, sort = 'newest' } = req.query;

    let filtered = [...contents];

    if (categoryId) {
      filtered = filtered.filter((c) => c.categoryId === parseInt(categoryId as string));
    }

    if (sort === 'rating') {
      filtered.sort((a, b) => b.avgRating - a.avgRating);
    } else {
      filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const paged = filtered.slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string));

    return res.json({
      success: true,
      data: paged,
      total: filtered.length,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: parseInt(offset as string) + parseInt(limit as string) < filtered.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch content',
    });
  }
});

// Get single content
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const content = contents.find((c) => c.id === id);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    return res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch content',
    });
  }
});

// Upload content (requires authentication)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, type, contentUrl, categoryId }: UploadContentRequest = req.body;

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

    const newContent: Content = {
      id: crypto.randomUUID(),
      creatorId: req.userId!,
      categoryId,
      title,
      description,
      type,
      contentUrl,
      version: 1,
      avgRating: 0,
      ratingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    contents.push(newContent);

    return res.status(201).json({
      success: true,
      data: newContent,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to upload content',
    });
  }
});

// Update content
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const content = contents.find((c) => c.id === id);

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

    if (title) content.title = title;
    if (description) content.description = description;
    if (contentUrl) content.contentUrl = contentUrl;
    content.updatedAt = new Date();
    content.version += 1;

    return res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to update content',
    });
  }
});

// Delete content
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const index = contents.findIndex((c) => c.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    if (contents[index].creatorId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this content',
      });
    }

    contents.splice(index, 1);

    return res.json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to delete content',
    });
  }
});

export default router;
