import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Categories
router.get('/categories', authorize('MENU', 'VIEW'), async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: { menuItems: true },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/categories', authorize('MENU', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const category = await prisma.category.create({ data: { name } });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', authorize('MENU', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const category = await prisma.category.update({ where: { id }, data: { name } });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', authorize('MENU', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Menu Items
router.get('/items', authorize('MENU', 'VIEW'), async (_req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.menuItem.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

router.post('/items', authorize('MENU', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price, categoryId, available, imageUrl } = req.body;
    const item = await prisma.menuItem.create({
      data: { name, description, price, categoryId, available, imageUrl },
      include: { category: true },
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

router.put('/items/:id', authorize('MENU', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, available, imageUrl } = req.body;
    const item = await prisma.menuItem.update({
      where: { id },
      data: { name, description, price, categoryId, available, imageUrl },
      include: { category: true },
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

router.delete('/items/:id', authorize('MENU', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.menuItem.delete({ where: { id } });
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router;
