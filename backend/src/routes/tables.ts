import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { isValidTableTransition } from '../utils/workflow';

const router = Router();

router.use(authenticate);

router.get('/', authorize('TABLES', 'VIEW'), async (_req: AuthRequest, res: Response) => {
  try {
    const tables = await prisma.table.findMany({
      include: { orders: { where: { status: { not: 'COMPLETED' } } } },
      orderBy: { number: 'asc' },
    });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

router.post('/', authorize('TABLES', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { number, capacity, section } = req.body;
    const table = await prisma.table.create({
      data: { number, capacity, section },
    });
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create table' });
  }
});

router.put('/:id/status', authorize('TABLES', 'VIEW'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const table = await prisma.table.findUnique({ where: { id } });
    if (!table) {
      res.status(404).json({ error: 'Table not found' });
      return;
    }

    if (!isValidTableTransition(table.status, status)) {
      res.status(400).json({
        error: `Invalid transition from ${table.status} to ${status}`,
      });
      return;
    }

    const updated = await prisma.table.update({
      where: { id },
      data: { status },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update table status' });
  }
});

router.put('/:id', authorize('TABLES', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { number, capacity, section } = req.body;
    const table = await prisma.table.update({
      where: { id },
      data: { number, capacity, section },
    });
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update table' });
  }
});

router.delete('/:id', authorize('TABLES', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.table.delete({ where: { id } });
    res.json({ message: 'Table deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

router.post('/merge', authorize('TABLES', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { tableIds } = req.body;
    if (!tableIds || tableIds.length < 2) {
      res.status(400).json({ error: 'At least 2 tables required for merging' });
      return;
    }

    const mergedWith = tableIds.join(',');
    const tables = await Promise.all(
      tableIds.map((id: string) =>
        prisma.table.update({
          where: { id },
          data: { mergedWith, status: 'OCCUPIED' },
        })
      )
    );
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to merge tables' });
  }
});

router.post('/unmerge', authorize('TABLES', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { tableIds } = req.body;
    const tables = await Promise.all(
      tableIds.map((id: string) =>
        prisma.table.update({
          where: { id },
          data: { mergedWith: null, status: 'AVAILABLE' },
        })
      )
    );
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to unmerge tables' });
  }
});

export default router;
