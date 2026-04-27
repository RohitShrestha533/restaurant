import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/summary', authorize('REPORTS', 'VIEW'), async (req: AuthRequest, res: Response) => {
  try {
    const { from, to } = req.query;
    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.gte = new Date(from as string);
    if (to) dateFilter.lte = new Date(to as string);

    const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [totalOrders, completedOrders, totalRevenue, ordersByStatus] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.billing.aggregate({
        where: { paymentStatus: 'PAID', ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}) },
        _sum: { total: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
    ]);

    res.json({
      totalOrders,
      completedOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      ordersByStatus: ordersByStatus.map(s => ({ status: s.status, count: s._count })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report summary' });
  }
});

router.get('/popular-items', authorize('REPORTS', 'VIEW'), async (_req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map(i => i.menuItemId) } },
    });

    const result = items.map(item => ({
      menuItem: menuItems.find(m => m.id === item.menuItemId),
      totalQuantity: item._sum.quantity,
      orderCount: item._count,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch popular items' });
  }
});

router.get('/daily-revenue', authorize('REPORTS', 'VIEW'), async (_req: AuthRequest, res: Response) => {
  try {
    const billings = await prisma.billing.findMany({
      where: { paymentStatus: 'PAID' },
      orderBy: { paidAt: 'asc' },
      select: { total: true, paidAt: true },
    });

    const dailyMap: Record<string, number> = {};
    billings.forEach(b => {
      if (b.paidAt) {
        const day = b.paidAt.toISOString().split('T')[0];
        dailyMap[day] = (dailyMap[day] || 0) + b.total;
      }
    });

    const dailyRevenue = Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue }));
    res.json(dailyRevenue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily revenue' });
  }
});

export default router;
