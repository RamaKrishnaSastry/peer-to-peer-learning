import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import { ApiResponse, PaginatedResponse, Category } from '../types/index';

const router = Router();

// Mock categories data
const categories: Category[] = [
  {
    id: 1,
    name: 'UPSC',
    slug: 'upsc',
    domain: 'UPSC',
    level: 0,
    path: 'UPSC',
    parentId: null,
    isLeaf: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: 'General Studies 1',
    slug: 'gs1',
    domain: 'UPSC',
    level: 1,
    path: 'UPSC/GS1',
    parentId: 1,
    isLeaf: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    name: 'History & Culture',
    slug: 'history-culture',
    domain: 'UPSC',
    level: 2,
    path: 'UPSC/GS1/History',
    parentId: 2,
    isLeaf: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    name: 'Ancient India',
    slug: 'ancient-india',
    domain: 'UPSC',
    level: 3,
    path: 'UPSC/GS1/History/Ancient',
    parentId: 3,
    isLeaf: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 5,
    name: 'JEE',
    slug: 'jee',
    domain: 'JEE',
    level: 0,
    path: 'JEE',
    parentId: null,
    isLeaf: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 6,
    name: 'Physics',
    slug: 'physics',
    domain: 'JEE',
    level: 1,
    path: 'JEE/Physics',
    parentId: 5,
    isLeaf: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Get all root categories (domains)
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const rootCategories = categories.filter((c) => c.level === 0);
    const response: ApiResponse<Category[]> = {
      success: true,
      data: rootCategories,
    };
    return res.json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
});

// Get category by slug with children
router.get('/:slug', (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const category = categories.find((c) => c.slug === slug);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    const children = categories.filter((c) => c.parentId === category.id);

    const response = {
      success: true,
      data: {
        ...category,
        children,
      },
    };

    return res.json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch category',
    });
  }
});

// Get full tree from category
router.get('/:id/tree', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id);
    const category = categories.find((c) => c.id === categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    const getTree = (cat: Category): any => {
      const children = categories
        .filter((c) => c.parentId === cat.id)
        .map((c) => getTree(c));

      return {
        ...cat,
        children,
      };
    };

    const response = {
      success: true,
      data: getTree(category),
    };

    return res.json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch category tree',
    });
  }
});

// Get breadcrumb for category
router.get('/:id/breadcrumb', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id);
    const category = categories.find((c) => c.id === categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    const breadcrumb = [category];
    let current = category;

    while (current.parentId) {
      const parent = categories.find((c) => c.id === current.parentId);
      if (parent) {
        breadcrumb.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }

    const response = {
      success: true,
      data: breadcrumb,
    };

    return res.json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch breadcrumb',
    });
  }
});

export default router;
