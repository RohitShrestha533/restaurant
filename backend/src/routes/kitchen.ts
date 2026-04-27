import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { isValidOrderItemTransition, isValidOrderTransition } from '../utils/workflow';

const router = Router();

router.use(authenticate);

router.get('/queue', authorize('KITCHEN', 'VIEW'), async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ['PENDING', 'PREPARING'] } },
      include: {
        table: true,
        waiter: { select: { id: true, name: true } },
        items: {
          include: { menuItem: { include: { category: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch kitchen queue' });
  }
});

router.put('/items/:id/status', authorize('KITCHEN', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const item = await prisma.orderItem.findUnique({ where: { id } });
    if (!item) {
      res.status(404).json({ error: 'Order item not found' });
      return;
    }

    if (!isValidOrderItemTransition(item.status, status)) {
      res.status(400).json({
        error: `Invalid transition from ${item.status} to ${status}`,
      });
      return;
    }

    const updated = await prisma.orderItem.update({
      where: { id },
      data: { status },
      include: { menuItem: true },
    });

    // Auto-update order status
    const order = await prisma.order.findUnique({
      where: { id: item.orderId },
      include: { items: true },
    });

    if (order) {
      const allItemsPreparing = order.items.every(i =>
        i.id === id ? status !== 'PENDING' : i.status !== 'PENDING'
      );
      const allItemsReady = order.items.every(i =>
        i.id === id ? status === 'READY' : i.status === 'READY'
      );

      if (allItemsReady && isValidOrderTransition(order.status, 'READY')) {
        await prisma.order.update({ where: { id: order.id }, data: { status: 'READY' } });
      } else if (allItemsPreparing && order.status === 'PENDING' && isValidOrderTransition(order.status, 'PREPARING')) {
        await prisma.order.update({ where: { id: order.id }, data: { status: 'PREPARING' } });
      }
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item status' });
  }
});

router.put('/orders/:id/start', authorize('KITCHEN', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (!isValidOrderTransition(order.status, 'PREPARING')) {
      res.status(400).json({ error: `Cannot start preparing from status ${order.status}` });
      return;
    }

    await prisma.orderItem.updateMany({
      where: { orderId: id, status: 'PENDING' },
      data: { status: 'PREPARING' },
    });

    const updated = await prisma.order.update({
      where: { id },
      data: { status: 'PREPARING' },
      include: { items: { include: { menuItem: true } }, table: true },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start order preparation' });
  }
});

export default router;
