import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/express';
import {
  validateEmail,
  validatePassword,
  hashPassword,
  comparePasswords,
} from '../utils/helpers';
import { SignupRequest, LoginRequest, ApiResponse, AuthResponse } from '../types/index';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

// Mock database (replace with Prisma)
const users: any[] = [];

// Signup
router.post('/signup', async (req: AuthRequest, res: Response) => {
  try {
    const { email, username, password }: SignupRequest = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, username, and password are required',
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }

    // Check if user exists
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = {
      id: crypto.randomUUID(),
      email,
      username,
      password: hashedPassword,
      bio: null,
      avatarUrl: null,
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.push(newUser);

    // Generate token
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        token,
        user: { ...newUser, password: undefined },
      },
    };

    return res.status(201).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error during signup',
    });
  }
});

// Login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const passwordMatch = await comparePasswords(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        token,
        user: { ...user, password: undefined },
      },
    };

    return res.json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error during login',
    });
  }
});

// Get current user
router.get('/me', (req: AuthRequest, res: Response) => {
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
      error: 'Server error',
    });
  }
});

export default router;
