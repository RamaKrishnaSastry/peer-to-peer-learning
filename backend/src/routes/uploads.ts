import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import { authMiddleware } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimiter';
import { upload } from '../middleware/upload';

const router = Router();

// Upload a file for content (returns a URL to the saved file)
router.post(
  '/',
  writeLimiter,
  authMiddleware,
  upload.single('file'),
  (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      const url = `/uploads/${req.file.filename}`;
      return res.status(201).json({
        success: true,
        data: {
          url,
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Failed to upload file',
      });
    }
  },
);

export default router;
