import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { isValidDeliveryTransition } from '../utils/workflow';

const router = Router();

router.use(authenticate);

router.get('/', authorize('DELIVERY', 'OWN'), async (req: AuthRequest, res: Response) => {
  try {
    const where: Record<string, unknown> = {};
    if (req.user!.role === 'DELIVERY') {
      where.driverId = req.user!.id;
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        order: { include: { items: { include: { menuItem: true } }, table: true } },
        driver: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

router.post('/', authorize('DELIVERY', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, customerName, customerPhone, customerAddress, driverId, estimatedTime } = req.body;

    const delivery = await prisma.delivery.create({
      data: {
        orderId,
        customerName,
        customerPhone,
        customerAddress,
        driverId,
        estimatedTime,
        status: driverId ? 'ASSIGNED' : 'PENDING',
      },
      include: {
        order: { include: { items: { include: { menuItem: true } } } },
        driver: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(delivery);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create delivery' });
  }
});

router.put('/:id/status', authorize('DELIVERY', 'OWN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const delivery = await prisma.delivery.findUnique({ where: { id } });
    if (!delivery) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    if (!isValidDeliveryTransition(delivery.status, status)) {
      res.status(400).json({
        error: `Invalid transition from ${delivery.status} to ${status}`,
      });
      return;
    }

    const data: Record<string, unknown> = { status };
    if (status === 'DELIVERED') {
      data.deliveredAt = new Date();
    }

    const updated = await prisma.delivery.update({
      where: { id },
      data,
      include: {
        order: true,
        driver: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
});

router.put('/:id/assign', authorize('DELIVERY', 'FULL'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    const delivery = await prisma.delivery.update({
      where: { id },
      data: { driverId, status: 'ASSIGNED' },
      include: {
        order: true,
        driver: { select: { id: true, name: true } },
      },
    });
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign delivery' });
  }
});

export default router;
