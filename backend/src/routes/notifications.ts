import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import { authMiddleware } from '../middleware/auth';
import prisma from '../db';

const router = Router();

// List current user's notifications with unread count
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    const where = { userId: req.userId! };
    const [total, unreadCount, items] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, read: false } }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    ]);

    return res.json({
      success: true,
      data: items,
      total,
      unreadCount,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('List notifications error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
});

// Mark all as read
router.post('/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId!, read: false },
      data: { read: true },
    });
    return res.json({ success: true, data: { count: undefined } });
  } catch (error) {
    console.error('Mark all read error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read',
    });
  }
});

// Mark a single notification as read
router.post('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
      select: { id: true, read: true },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
});

export default router;
