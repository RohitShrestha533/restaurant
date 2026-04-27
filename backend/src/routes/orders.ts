import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { isValidOrderTransition } from '../utils/workflow';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ORDERS', 'VIEW'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, tableId } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (tableId) where.tableId = tableId;

    if (req.user!.role === 'DELIVERY') {
      where.type = 'DELIVERY';
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        waiter: { select: { id: true, name: true } },
        items: { include: { menuItem: true } },
        billing: true,
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', authorize('ORDERS', 'VIEW'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        waiter: { select: { id: true, name: true } },
        items: { include: { menuItem: true } },
        billing: true,
        delivery: true,
      },
    });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.post('/', authorize('ORDERS', 'CREATE'), async (req: AuthRequest, res: Response) => {
  try {
    const { tableId, items, type, notes } = req.body;

    // Set table to occupied
    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'OCCUPIED' },
    });

    // Calculate total
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map((i: { menuItemId: string }) => i.menuItemId) } },
    });

    let totalAmount = 0;
    const orderItems = items.map((item: { menuItemId: string; quantity: number; notes?: string }) => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId);
      const price = menuItem?.price || 0;
      totalAmount += price * item.quantity;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price,
        notes: item.notes,
      };
    });

    const order = await prisma.order.create({
      data: {
        tableId,
        waiterId: req.user!.id,
        type: type || 'DINE_IN',
        notes,
        totalAmount,
        items: { create: orderItems },
      },
      include: {
        table: true,
        waiter: { select: { id: true, name: true } },
        items: { include: { menuItem: true } },
      },
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.put('/:id/status', authorize('ORDERS', 'VIEW'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (!isValidOrderTransition(order.status, status)) {
      res.status(400).json({
        error: `Invalid transition from ${order.status} to ${status}`,
      });
      return;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        table: true,
        items: { include: { menuItem: true } },
      },
    });

    // If completed, free the table
    if (status === 'COMPLETED') {
      const activeOrders = await prisma.order.count({
        where: { tableId: order.tableId, status: { not: 'COMPLETED' }, id: { not: id } },
      });
      if (activeOrders === 0) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

router.post('/:id/items', authorize('ORDERS', 'CREATE'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map((i: { menuItemId: string }) => i.menuItemId) } },
    });

    let additionalTotal = 0;
    const orderItems = items.map((item: { menuItemId: string; quantity: number; notes?: string }) => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId);
      const price = menuItem?.price || 0;
      additionalTotal += price * item.quantity;
      return {
        orderId: id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price,
        notes: item.notes,
      };
    });

    await prisma.orderItem.createMany({ data: orderItems });
    await prisma.order.update({
      where: { id },
      data: { totalAmount: { increment: additionalTotal } },
    });

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { menuItem: true } }, table: true },
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add items to order' });
  }
});

export default router;
