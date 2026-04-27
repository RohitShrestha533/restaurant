import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const [
      totalTables,
      occupiedTables,
      reservedTables,
      availableTables,
      activeOrders,
      pendingKitchen,
      readyToServe,
      todayRevenue,
      totalMenuItems,
      lowStockItems,
      pendingDeliveries,
      todayReservations,
    ] = await Promise.all([
      prisma.table.count(),
      prisma.table.count({ where: { status: 'OCCUPIED' } }),
      prisma.table.count({ where: { status: 'RESERVED' } }),
      prisma.table.count({ where: { status: 'AVAILABLE' } }),
      prisma.order.count({ where: { status: { notIn: ['COMPLETED', 'BILLED'] } } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'READY' } }),
      prisma.billing.aggregate({
        where: {
          paymentStatus: 'PAID',
          paidAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        _sum: { total: true },
      }),
      prisma.menuItem.count({ where: { available: true } }),
      prisma.inventoryItem.findMany().then(items => items.filter(i => i.quantity <= i.minStock).length),
      prisma.delivery.count({ where: { status: { in: ['PENDING', 'ASSIGNED', 'PICKED_UP'] } } }),
      prisma.reservation.count({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: 'CONFIRMED',
        },
      }),
    ]);

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        table: true,
        waiter: { select: { name: true } },
      },
    });

    res.json({
      tables: { total: totalTables, occupied: occupiedTables, reserved: reservedTables, available: availableTables },
      orders: { active: activeOrders, pendingKitchen, readyToServe },
      revenue: { today: todayRevenue._sum.total || 0 },
      menu: { totalItems: totalMenuItems },
      inventory: { lowStock: lowStockItems },
      deliveries: { pending: pendingDeliveries },
      reservations: { today: todayReservations },
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
