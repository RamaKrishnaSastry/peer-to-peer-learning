import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import { authMiddleware } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimiter';
import { upload } from '../middleware/upload';

const router = Router();

// Absolute base URL for uploaded files. Set PUBLIC_URL in production
// (e.g. https://api.example.com); defaults to localhost in dev.
const PUBLIC_URL =
  process.env.PUBLIC_URL ||
  `http://localhost:${process.env.PORT || 3001}`;

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

      const url = `${PUBLIC_URL}/uploads/${req.file.filename}`;
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
