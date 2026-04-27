import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize('INVENTORY', 'VIEW'), async (_req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      include: { menuItem: true },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

router.get('/low-stock', authorize('INVENTORY', 'VIEW'), async (_req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: {
        quantity: { lte: prisma.inventoryItem.fields.minStock as unknown as number },
      },
    });
    // Filter in application since Prisma doesn't support comparing two columns directly
    const allItems = await prisma.inventoryItem.findMany({ include: { menuItem: true } });
    const lowStock = allItems.filter(item => item.quantity <= item.minStock);
    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

router.post('/', authorize('INVENTORY', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, menuItemId, quantity, unit, minStock, costPerUnit, supplier } = req.body;
    const item = await prisma.inventoryItem.create({
      data: { name, menuItemId, quantity, unit, minStock, costPerUnit, supplier },
      include: { menuItem: true },
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

router.put('/:id', authorize('INVENTORY', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, menuItemId, quantity, unit, minStock, costPerUnit, supplier } = req.body;
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { name, menuItemId, quantity, unit, minStock, costPerUnit, supplier },
      include: { menuItem: true },
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

router.delete('/:id', authorize('INVENTORY', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.inventoryItem.delete({ where: { id } });
    res.json({ message: 'Inventory item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

export default router;
