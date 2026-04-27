import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

const TAX_RATE = 0.1; // 10% tax

router.get('/', authorize('BILLING', 'VIEW'), async (_req: AuthRequest, res: Response) => {
  try {
    const bills = await prisma.billing.findMany({
      include: {
        order: { include: { table: true, items: { include: { menuItem: true } } } },
        cashier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

router.post('/generate', authorize('BILLING', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, discount } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, billing: true },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.billing) {
      res.status(400).json({ error: 'Bill already generated for this order' });
      return;
    }

    if (order.status !== 'SERVED') {
      res.status(400).json({ error: 'Order must be served before billing' });
      return;
    }

    const subtotal = order.totalAmount;
    const discountAmount = discount || 0;
    const tax = (subtotal - discountAmount) * TAX_RATE;
    const total = subtotal - discountAmount + tax;

    const billing = await prisma.billing.create({
      data: {
        orderId,
        cashierId: req.user!.id,
        subtotal,
        tax,
        discount: discountAmount,
        total,
      },
      include: {
        order: { include: { table: true, items: { include: { menuItem: true } } } },
        cashier: { select: { id: true, name: true } },
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'BILLED' },
    });

    res.status(201).json(billing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate bill' });
  }
});

router.put('/:id/pay', authorize('BILLING', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const billing = await prisma.billing.update({
      where: { id },
      data: {
        paymentMethod,
        paymentStatus: 'PAID',
        paidAt: new Date(),
      },
      include: {
        order: { include: { table: true } },
        cashier: { select: { id: true, name: true } },
      },
    });

    // Mark order as completed
    await prisma.order.update({
      where: { id: billing.orderId },
      data: { status: 'COMPLETED' },
    });

    // Free table if no other active orders
    const activeOrders = await prisma.order.count({
      where: {
        tableId: billing.order.tableId,
        status: { not: 'COMPLETED' },
        id: { not: billing.orderId },
      },
    });

    if (activeOrders === 0) {
      await prisma.table.update({
        where: { id: billing.order.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    res.json(billing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

export default router;
