import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const reservations = await prisma.reservation.findMany({
      include: { table: true },
      orderBy: { date: 'asc' },
    });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { tableId, customerName, customerPhone, partySize, date, time, notes } = req.body;

    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'RESERVED' },
    });

    const reservation = await prisma.reservation.create({
      data: { tableId, customerName, customerPhone, partySize, date: new Date(date), time, notes },
      include: { table: true },
    });
    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { customerName, customerPhone, partySize, date, time, notes, status } = req.body;

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        customerName,
        customerPhone,
        partySize,
        date: date ? new Date(date) : undefined,
        time,
        notes,
        status,
      },
      include: { table: true },
    });

    if (status === 'CANCELLED' || status === 'COMPLETED') {
      await prisma.table.update({
        where: { id: reservation.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update reservation' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (reservation) {
      await prisma.table.update({
        where: { id: reservation.tableId },
        data: { status: 'AVAILABLE' },
      });
    }
    await prisma.reservation.delete({ where: { id } });
    res.json({ message: 'Reservation deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete reservation' });
  }
});

export default router;
