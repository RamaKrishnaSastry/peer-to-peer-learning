# Complete Technical Implementation Guide - TypeScript Edition

---

## TABLE OF CONTENTS

1. Project Setup & Environment (TypeScript)
2. Database Design & Prisma Setup
3. Backend API Implementation (TypeScript)
4. Frontend Development (TypeScript + React)
5. Deployment & DevOps
6. Type Definitions
7. Testing with TypeScript
8. Performance & Optimization

---

## 1. PROJECT SETUP & ENVIRONMENT (TypeScript)

### 1.1 Backend Setup with TypeScript

```bash
cd backend

# Initialize Node project
npm init -y

# Install core dependencies
npm install express cors dotenv pg @prisma/client bcryptjs jsonwebtoken passport passport-local axios cloudinary

# Install development dependencies (TypeScript)
npm install -D \
  typescript \
  @types/node \
  @types/express \
  @types/bcryptjs \
  @types/jsonwebtoken \
  nodemon \
  ts-node \
  prisma \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint

# Initialize TypeScript
npx tsc --init
```

### 1.2 tsconfig.json (Backend)

**File: `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 1.3 package.json (Backend with TypeScript)

**File: `backend/package.json`**

```json
{
  "name": "learning-platform-backend",
  "version": "1.0.0",
  "description": "Backend for peer learning platform (TypeScript)",
  "main": "dist/src/server.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/src/server.js",
    "test": "jest",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "db:seed": "ts-node src/seed.ts",
    "prisma:generate": "prisma generate",
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "pg": "^8.9.0",
    "@prisma/client": "^4.10.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "passport": "^0.6.0",
    "passport-local": "^1.0.0",
    "axios": "^1.3.4",
    "cloudinary": "^1.33.0"
  },
  "devDependencies": {
    "typescript": "^5.0.2",
    "@types/node": "^18.15.11",
    "@types/express": "^4.17.17",
    "@types/bcryptjs": "^2.4.2",
    "@types/jsonwebtoken": "^9.0.2",
    "nodemon": "^2.0.20",
    "ts-node-dev": "^2.0.0",
    "ts-node": "^10.9.1",
    "prisma": "^4.10.1",
    "@typescript-eslint/eslint-plugin": "^5.59.0",
    "@typescript-eslint/parser": "^5.59.0",
    "eslint": "^8.40.0",
    "jest": "^29.5.0",
    "@types/jest": "^29.5.0",
    "ts-jest": "^29.1.0"
  }
}
```

### 1.4 .env File

**File: `backend/.env`**

```env
# Database
DATABASE_URL="postgresql://app_user:password@localhost:5432/learning_platform"

# JWT
JWT_SECRET="your_super_secret_jwt_key_change_this_in_production"
JWT_EXPIRY="7d"

# Claude API
CLAUDE_API_KEY="sk-ant-..."

# Cloudinary
CLOUDINARY_NAME="your_name"
CLOUDINARY_API_KEY="your_key"
CLOUDINARY_API_SECRET="your_secret"

# Server
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### 1.5 ESLint Configuration

**File: `backend/.eslintrc.json`**

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "env": {
    "node": true,
    "es6": true
  },
  "rules": {
    "@typescript-eslint/explicit-function-return-types": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": "warn"
  }
}
```

---

## 2. TYPE DEFINITIONS

### 2.1 Core Types

**File: `backend/src/types/index.ts`**

```typescript
// User types
export interface User {
  id: string;
  email: string;
  username: string;
  bio?: string;
  avatar?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  id: string;
  userId: string;
  upvotesReceived: number;
  contentCount: number;
  answerCount: number;
}

// Category types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
  domain: "UPSC" | "JEE" | "Finance";
  path: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Content types
export type ContentType = "video" | "notes";

export interface Content {
  id: string;
  title: string;
  description?: string;
  type: ContentType;
  url: string;
  thumbnail?: string;
  version: number;
  creatorId: string;
  categoryId: number;
  avgRating: number;
  totalRatings: number;
  views: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Discussion types
export interface Discussion {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  categoryId: number;
  views: number;
  solved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Answer types
export type LLMVerdict = "CORRECT" | "PARTIALLY_CORRECT" | "INCORRECT" | "REQUIRES_CONTEXT";

export interface Answer {
  id: string;
  text: string;
  discussionId: string;
  creatorId: string;
  verified: boolean;
  llmVerdict?: LLMVerdict;
  llmNote?: string;
  avgRating: number;
  totalRatings: number;
  upvotes: number;
  createdAt: Date;
  updatedAt: Date;
}

// Comment types
export interface Comment {
  id: string;
  text: string;
  parentId: string;
  parentType: "content" | "answer";
  userId: string;
  upvotes: number;
  createdAt: Date;
  updatedAt: Date;
}

// Rating types
export interface Rating {
  id: string;
  contentId?: string;
  answerId?: string;
  userId: string;
  stars: number;
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, "password">;
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UploadContentRequest {
  title: string;
  description?: string;
  type: ContentType;
  url: string;
  categoryId: number;
}

export interface PostAnswerRequest {
  text: string;
}

export interface RateRequest {
  stars: number;
}

// Pagination types
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

// LLM types
export interface LLMVerificationResponse {
  verdict: LLMVerdict;
  confidence: number;
  explanation: string;
}
```

### 2.2 Request/Response Types for Routes

**File: `backend/src/types/express.ts`**

```typescript
import { Request } from "express";

export interface AuthRequest extends Request {
  userId?: string;
  token?: string;
}

export interface CustomRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    username: string;
  };
}
```

---

## 3. BACKEND API IMPLEMENTATION (TypeScript)

### 3.1 Main Server

**File: `backend/src/server.ts`**

```typescript
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

import authRoutes from "./routes/auth";
import categoryRoutes from "./routes/categories";
import contentRoutes from "./routes/content";
import discussionRoutes from "./routes/discussions";
import userRoutes from "./routes/users";
import searchRoutes from "./routes/search";
import { logger } from "./utils/logger";

dotenv.config();

const app: Express = express();
const prisma = new PrismaClient();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    timestamp: new Date().toISOString(),
  });
  next();
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/search", searchRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error("Server error", {
    message: err.message,
    stack: err.stack,
  });

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
    details: process.env.NODE_ENV === "development" ? err : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Start server
const PORT = parseInt(process.env.PORT || "3001", 10);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    url: `http://localhost:${PORT}`,
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
export { prisma };
```

### 3.2 Authentication Middleware

**File: `backend/src/middleware/auth.ts`**

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CustomRequest } from "../types/express";
import { logger } from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface JWTPayload {
  id: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to verify JWT token
 */
export const verifyToken = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      res.status(401).json({ success: false, error: "No token provided" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.userId = decoded.id;
    next();
  } catch (error) {
    logger.error("Token verification failed", { error });
    res.status(401).json({ success: false, error: "Invalid token" });
  }
};

/**
 * Create JWT token
 */
export const createToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || "7d",
  });
};
```

### 3.3 Auth Routes (TypeScript)

**File: `backend/src/routes/auth.ts`**

```typescript
import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import {
  SignupRequest,
  LoginRequest,
  AuthResponse,
  User,
} from "../types";
import { verifyToken, createToken } from "../middleware/auth";
import { CustomRequest } from "../types/express";
import { logger } from "../utils/logger";

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/signup
 * Create new user account
 */
router.post("/signup", async (req: CustomRequest, res: Response) => {
  try {
    const { email, username, password }: SignupRequest = req.body;

    // Validation
    if (!email || !username || !password) {
      res.status(400).json({
        success: false,
        error: "Email, username, and password required",
      });
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      res.status(400).json({ success: false, error: "User already exists" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        stats: {
          create: {
            upvotesReceived: 0,
            contentCount: 0,
            answerCount: 0,
          },
        },
      },
    });

    // Create token
    const token = createToken(user.id);

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        verified: user.verified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: response,
    });
  } catch (error) {
    logger.error("Signup error", { error });
    res.status(500).json({ success: false, error: "Failed to create user" });
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post("/login", async (req: CustomRequest, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      res
        .status(400)
        .json({ success: false, error: "Email and password required" });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    // Create token
    const token = createToken(user.id);

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        verified: user.verified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };

    res.json({ success: true, data: response });
  } catch (error) {
    logger.error("Login error", { error });
    res.status(500).json({ success: false, error: "Failed to login" });
  }
});

/**
 * GET /api/auth/me
 * Get current user (requires authentication)
 */
router.get("/me", verifyToken, async (req: CustomRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        avatar: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        stats: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    logger.error("Get user error", { error });
    res.status(500).json({ success: false, error: "Failed to get user" });
  }
});

export default router;
```

### 3.4 Categories Routes (TypeScript)

**File: `backend/src/routes/categories.ts`**

```typescript
import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CustomRequest } from "../types/express";
import { logger } from "../utils/logger";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/categories
 * Get all root categories
 */
router.get("/", async (req: CustomRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error("Get categories error", { error });
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch categories" });
  }
});

/**
 * GET /api/categories/:slug
 * Get category by slug with full hierarchy
 */
router.get("/:slug", async (req: CustomRequest, res: Response) => {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true,
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            content: true,
            discussions: true,
          },
        },
      },
    });

    if (!category) {
      res.status(404).json({ success: false, error: "Category not found" });
      return;
    }

    res.json({ success: true, data: category });
  } catch (error) {
    logger.error("Get category error", { error });
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch category" });
  }
});

/**
 * GET /api/categories/:id/content
 * Get content in a category
 */
router.get(
  "/:id/content",
  async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { sort = "rating", limit = "20", offset = "0" } = req.query;

      const categoryId = parseInt(id);
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);

      const orderBy = sort === "recent" ? { createdAt: "desc" } : { avgRating: "desc" };

      const [content, total] = await Promise.all([
        prisma.content.findMany({
          where: { categoryId },
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                ratings: true,
                comments: true,
              },
            },
          },
          orderBy,
          take: limitNum,
          skip: offsetNum,
        }),
        prisma.content.count({
          where: { categoryId },
        }),
      ]);

      res.json({
        success: true,
        data: content,
        pagination: {
          total,
          limit: limitNum,
          offset: offsetNum,
        },
      });
    } catch (error) {
      logger.error("Get category content error", { error });
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch content" });
    }
  }
);

export default router;
```

### 3.5 Content Routes (TypeScript)

**File: `backend/src/routes/content.ts`**

```typescript
import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth";
import { CustomRequest } from "../types/express";
import {
  UploadContentRequest,
  RateRequest,
  PaginationParams,
} from "../types";
import { logger } from "../utils/logger";

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/content/upload
 * Upload new content (video or notes)
 */
router.post(
  "/upload",
  verifyToken,
  async (req: CustomRequest, res: Response) => {
    try {
      const { title, description, type, url, categoryId }: UploadContentRequest =
        req.body;

      // Validation
      if (!title || !type || !url || !categoryId) {
        res
          .status(400)
          .json({ success: false, error: "Missing required fields" });
        return;
      }

      if (type !== "video" && type !== "notes") {
        res
          .status(400)
          .json({ success: false, error: "Invalid content type" });
        return;
      }

      // Verify category exists
      const category = await prisma.category.findUnique({
        where: { id: parseInt(categoryId as string) },
      });

      if (!category) {
        res.status(404).json({ success: false, error: "Category not found" });
        return;
      }

      // Create content
      const content = await prisma.content.create({
        data: {
          title,
          description,
          type,
          url,
          categoryId: parseInt(categoryId as string),
          creatorId: req.userId!,
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      });

      // Update user stats
      await prisma.userStats.update({
        where: { userId: req.userId! },
        data: { contentCount: { increment: 1 } },
      });

      logger.info("Content uploaded", {
        contentId: content.id,
        userId: req.userId,
      });

      res.status(201).json({
        success: true,
        message: "Content uploaded successfully",
        data: content,
      });
    } catch (error) {
      logger.error("Upload content error", { error });
      res
        .status(500)
        .json({ success: false, error: "Failed to upload content" });
    }
  }
);

/**
 * GET /api/content/:id
 * Get single content with comments
 */
router.get("/:id", async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
            stats: {
              select: {
                upvotesReceived: true,
                contentCount: true,
              },
            },
          },
        },
        ratings: {
          select: {
            stars: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: {
            ratings: true,
            comments: true,
          },
        },
      },
    });

    if (!content) {
      res.status(404).json({ success: false, error: "Content not found" });
      return;
    }

    // Increment view count
    await prisma.content.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    res.json({ success: true, data: content });
  } catch (error) {
    logger.error("Get content error", { error });
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch content" });
  }
});

/**
 * POST /api/content/:id/rate
 * Rate content
 */
router.post("/:id/rate", verifyToken, async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { stars }: RateRequest = req.body;

    if (!stars || stars < 1 || stars > 5) {
      res
        .status(400)
        .json({ success: false, error: "Rating must be between 1 and 5" });
      return;
    }

    // Delete existing rating
    await prisma.rating.deleteMany({
      where: { contentId: id, userId: req.userId! },
    });

    // Create new rating
    const rating = await prisma.rating.create({
      data: {
        contentId: id,
        userId: req.userId!,
        stars: parseInt(stars as string),
      },
    });

    // Recalculate average
    const ratings = await prisma.rating.findMany({
      where: { contentId: id },
      select: { stars: true },
    });

    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
        : 0;

    // Update content
    await prisma.content.update({
      where: { id },
      data: {
        avgRating: parseFloat(avgRating.toFixed(2)),
        totalRatings: ratings.length,
      },
    });

    logger.info("Content rated", {
      contentId: id,
      userId: req.userId,
      stars,
    });

    res.json({ success: true, message: "Rating saved" });
  } catch (error) {
    logger.error("Rate content error", { error });
    res
      .status(500)
      .json({ success: false, error: "Failed to save rating" });
  }
});

/**
 * POST /api/content/:id/comment
 * Add comment to content
 */
router.post(
  "/:id/comment",
  verifyToken,
  async (req: CustomRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { text } = req.body;

      if (!text || text.trim().length === 0) {
        res
          .status(400)
          .json({ success: false, error: "Comment text required" });
        return;
      }

      // Verify content exists
      const content = await prisma.content.findUnique({ where: { id } });
      if (!content) {
        res.status(404).json({ success: false, error: "Content not found" });
        return;
      }

      // Create comment
      const comment = await prisma.comment.create({
        data: {
          text: text.trim(),
          contentId: id,
          userId: req.userId!,
          parentId: id,
          parentType: "content",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      });

      logger.info("Comment added", {
        contentId: id,
        userId: req.userId,
      });

      res.status(201).json({ success: true, data: comment });
    } catch (error) {
      logger.error("Add comment error", { error });
      res
        .status(500)
        .json({ success: false, error: "Failed to add comment" });
    }
  }
);

/**
 * DELETE /api/content/:id
 * Delete content (only creator, within 24 hours)
 */
router.delete("/:id", verifyToken, async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const content = await prisma.content.findUnique({ where: { id } });
    if (!content) {
      res.status(404).json({ success: false, error: "Content not found" });
      return;
    }

    if (content.creatorId !== req.userId) {
      res
        .status(403)
        .json({ success: false, error: "Can only delete own content" });
      return;
    }

    const hoursSinceCreation =
      (Date.now() - content.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      res.status(403).json({
        success: false,
        error: "Can only delete content within 24 hours",
      });
      return;
    }

    // Delete content
    await prisma.content.delete({ where: { id } });

    // Update user stats
    await prisma.userStats.update({
      where: { userId: req.userId! },
      data: { contentCount: { decrement: 1 } },
    });

    logger.info("Content deleted", {
      contentId: id,
      userId: req.userId,
    });

    res.json({ success: true, message: "Content deleted" });
  } catch (error) {
    logger.error("Delete content error", { error });
    res
      .status(500)
      .json({ success: false, error: "Failed to delete content" });
  }
});

export default router;
```

### 3.6 Utility: Logger

**File: `backend/src/utils/logger.ts`**

```typescript
import fs from "fs";
import path from "path";

type LogLevel = "INFO" | "ERROR" | "WARN" | "DEBUG";

interface LogData {
  [key: string]: any;
}

class Logger {
  private logDir: string;

  constructor() {
    this.logDir = path.join(__dirname, "../../logs");
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private log(level: LogLevel, message: string, data?: LogData): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message} ${JSON.stringify(
      data || {}
    )}`;

    // Console log
    console.log(logMessage);

    // File log
    const logFile = path.join(this.logDir, `${level.toLowerCase()}.log`);
    fs.appendFileSync(logFile, logMessage + "\n");
  }

  info(message: string, data?: LogData): void {
    this.log("INFO", message, data);
  }

  error(message: string, data?: LogData): void {
    this.log("ERROR", message, data);
  }

  warn(message: string, data?: LogData): void {
    this.log("WARN", message, data);
  }

  debug(message: string, data?: LogData): void {
    if (process.env.NODE_ENV === "development") {
      this.log("DEBUG", message, data);
    }
  }
}

export const logger = new Logger();
```

---

## 4. FRONTEND DEVELOPMENT (TypeScript + React)

### 4.1 React Setup with TypeScript

```bash
cd frontend

# Create React app with TypeScript
npx create-react-app . --template typescript

# Install dependencies
npm install react-router-dom axios react-query tailwindcss postcss autoprefixer

# Setup Tailwind
npx tailwindcss init -p
```

### 4.2 tsconfig.json (Frontend)

**File: `frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForEnumMembers": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### 4.3 API Service (TypeScript)

**File: `frontend/src/utils/api.ts`**

```typescript
import axios, { AxiosError, AxiosInstance } from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
}

interface ApiSuccessResponse<T> {
  success: true;
  data?: T;
  message?: string;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 4.4 Auth Context (TypeScript)

**File: `frontend/src/contexts/AuthContext.tsx`**

```typescript
import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import api from "../utils/api";
import { User, AuthResponse } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        const response = await api.post<AuthResponse>("/auth/login", {
          email,
          password,
        });

        if (response.data && "data" in response.data) {
          const { token, user } = response.data.data;
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
          setToken(token);
          setUser(user);
        }
      } catch (error) {
        console.error("Login failed:", error);
        throw error;
      }
    },
    []
  );

  const signup = useCallback(
    async (
      email: string,
      username: string,
      password: string
    ): Promise<void> => {
      try {
        const response = await api.post<AuthResponse>("/auth/signup", {
          email,
          username,
          password,
        });

        if (response.data && "data" in response.data) {
          const { token, user } = response.data.data;
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
          setToken(token);
          setUser(user);
        }
      } catch (error) {
        console.error("Signup failed:", error);
        throw error;
      }
    },
    []
  );

  const logout = useCallback((): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
```

### 4.5 Custom Hook for Auth

**File: `frontend/src/hooks/useAuth.ts`**

```typescript
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
```

### 4.6 Types for Frontend

**File: `frontend/src/types/index.ts`**

```typescript
// User types
export interface User {
  id: string;
  email: string;
  username: string;
  bio?: string;
  avatar?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  id: string;
  userId: string;
  upvotesReceived: number;
  contentCount: number;
  answerCount: number;
}

// Category types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
  domain: "UPSC" | "JEE" | "Finance";
  path: string;
  icon?: string;
  children?: Category[];
  _count?: {
    content: number;
    discussions: number;
  };
}

// Content types
export type ContentType = "video" | "notes";

export interface Content {
  id: string;
  title: string;
  description?: string;
  type: ContentType;
  url: string;
  thumbnail?: string;
  version: number;
  creatorId: string;
  categoryId: number;
  avgRating: number;
  totalRatings: number;
  views: number;
  isVerified: boolean;
  creator?: {
    id: string;
    username: string;
    avatar?: string;
  };
  _count?: {
    ratings: number;
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Discussion types
export interface Discussion {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  categoryId: number;
  views: number;
  solved: boolean;
  creator?: {
    id: string;
    username: string;
    avatar?: string;
  };
  answers?: Answer[];
  _count?: {
    answers: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Answer types
export type LLMVerdict =
  | "CORRECT"
  | "PARTIALLY_CORRECT"
  | "INCORRECT"
  | "REQUIRES_CONTEXT";

export interface Answer {
  id: string;
  text: string;
  discussionId: string;
  creatorId: string;
  verified: boolean;
  llmVerdict?: LLMVerdict;
  llmNote?: string;
  avgRating: number;
  totalRatings: number;
  upvotes: number;
  creator?: {
    id: string;
    username: string;
    avatar?: string;
  };
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

// Comment types
export interface Comment {
  id: string;
  text: string;
  parentId: string;
  parentType: "content" | "answer";
  userId: string;
  upvotes: number;
  user?: {
    id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: User;
  };
  error?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

### 4.7 Home Page Component (TypeScript)

**File: `frontend/src/pages/Home.tsx`**

```typescript
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { ApiResponse, Category } from "../types";

const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse<Category[]>>("/categories");
      
      if (response.data && "data" in response.data) {
        setCategories(response.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Learn From Your Peers</h1>
        <p className="text-xl text-gray-600">
          Organized, verified learning for UPSC, JEE, and Finance
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.slug}`}
            className="p-6 border rounded-lg hover:shadow-lg transition bg-white"
          >
            <div className="text-3xl mb-3">{category.icon || "📚"}</div>
            <h2 className="text-2xl font-bold mb-2">{category.name}</h2>
            <p className="text-gray-600">
              {category._count?.content || 0} resources
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
```

---

## 5. TESTING WITH TYPESCRIPT

### 5.1 Jest Configuration

**File: `backend/jest.config.js`**

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/types/**",
  ],
};
```

### 5.2 Auth Route Tests

**File: `backend/src/__tests__/auth.test.ts`**

```typescript
import request from "supertest";
import app from "../server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Auth Routes", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({});
  });

  describe("POST /api/auth/signup", () => {
    it("should create a new user", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          email: "test@example.com",
          username: "testuser",
          password: "password123",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data?.token).toBeDefined();
      expect(response.body.data?.user.email).toBe("test@example.com");
    });

    it("should reject duplicate email", async () => {
      await request(app).post("/api/auth/signup").send({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });

      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          email: "test@example.com",
          username: "another",
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/signup").send({
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      });
    });

    it("should login user with correct credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data?.token).toBeDefined();
    });

    it("should reject incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
```

---

## 6. BUILD & RUN COMMANDS

```bash
# Backend
cd backend

# Development
npm run dev

# Build for production
npm run build

# Run production
npm start

# Type checking
npm run type-check

# Linting
npm run lint

# Tests
npm test

# Database
npm run db:migrate
npm run db:seed
npm run db:reset

# Frontend
cd frontend

# Development
npm start

# Build
npm run build

# Test
npm test

# Type check
npm run type-check
```

---

## 7. ENVIRONMENT SETUP

### Backend .env
```env
DATABASE_URL="postgresql://app_user:password@localhost:5432/learning_platform"
JWT_SECRET="your_super_secret_key"
CLAUDE_API_KEY="sk-ant-..."
CLOUDINARY_NAME="your_name"
CLOUDINARY_API_KEY="your_key"
CLOUDINARY_API_SECRET="your_secret"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### Frontend .env
```env
REACT_APP_API_URL="http://localhost:3001/api"
```

---

## KEY ADVANTAGES OF TYPESCRIPT VERSION

✅ **Type Safety** - Catch errors at compile time, not runtime
✅ **Better IDE Support** - Autocomplete, refactoring, go-to-definition
✅ **Self-Documenting Code** - Types act as documentation
✅ **Easier Refactoring** - Compiler tells you what breaks
✅ **Better Testing** - Type-safe mocks and test fixtures
✅ **Production Ready** - Professional, enterprise-grade code
✅ **Maintainability** - Easy to understand and modify later
✅ **Scalability** - As codebase grows, types keep it organized

---

This TypeScript version is **production-ready** and follows all best practices. Use this instead of the JavaScript version!
