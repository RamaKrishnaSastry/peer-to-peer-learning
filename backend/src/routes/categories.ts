import { Router, Response } from 'express';
import { AuthRequest } from '../types/express';
import prisma from '../db';

const router = Router();

// Get all root categories (domains)
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const rootCategories = await prisma.category.findMany({
      where: { level: 0 },
      orderBy: { id: 'asc' },
    });
    return res.json({
      success: true,
      data: rootCategories,
    });
  } catch (error) {
    console.error('List categories error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
});

// Get all categories flattened (for cascading selects), optionally by domain
router.get('/all', async (req: AuthRequest, res: Response) => {
  try {
    const { domain } = req.query;
    const all = await prisma.category.findMany({
      where: domain ? { domain: domain as string } : {},
      orderBy: { id: 'asc' },
    });
    return res.json({
      success: true,
      data: all,
    });
  } catch (error) {
    console.error('List all categories error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
});

// Get category by slug with children
router.get('/:slug', async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const category = await prisma.category.findUnique({ where: { slug } });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    const children = await prisma.category.findMany({
      where: { parentId: category.id },
      orderBy: { id: 'asc' },
    });

    return res.json({
      success: true,
      data: { ...category, children },
    });
  } catch (error) {
    console.error('Get category error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch category',
    });
  }
});

// Get full tree from category
router.get('/:id/tree', async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    const category = await prisma.category.findUnique({ where: { id: categoryId } });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    const all = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    const childrenOf = new Map<number | null, typeof all>();
    for (const cat of all) {
      const list = childrenOf.get(cat.parentId) ?? [];
      list.push(cat);
      childrenOf.set(cat.parentId, list);
    }

    const buildTree = (cat: any): any => {
      const children = (childrenOf.get(cat.id) ?? []).map((c) => buildTree(c));
      return { ...cat, children };
    };

    return res.json({
      success: true,
      data: buildTree(category),
    });
  } catch (error) {
    console.error('Get category tree error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch category tree',
    });
  }
});

// Get breadcrumb for category
router.get('/:id/breadcrumb', async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    const category = await prisma.category.findUnique({ where: { id: categoryId } });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    const breadcrumb = [category];
    let current = category;

    while (current.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: current.parentId } });
      if (!parent) break;
      breadcrumb.unshift(parent);
      current = parent;
    }

    return res.json({
      success: true,
      data: breadcrumb,
    });
  } catch (error) {
    console.error('Get breadcrumb error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch breadcrumb',
    });
  }
});

export default router;
