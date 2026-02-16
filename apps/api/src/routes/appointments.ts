import { Router } from 'express';
import { PrismaClient, AppointmentStatus } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const createAppointmentSchema = z.object({
  leadId: z.string(),
  closerId: z.string(),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'NO_SHOW', 'COMPLETED']),
  noShowReason: z.string().optional(),
});

// GET /api/appointments
router.get('/', async (req, res) => {
  try {
    const { date, status } = req.query;
    
    let where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (date) {
      const startOfDay = new Date(date as string);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      
      where.scheduledAt = {
        gte: startOfDay,
        lt: endOfDay
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        lead: true,
        closer: { select: { id: true, name: true } },
        deal: true
      },
      orderBy: { scheduledAt: 'asc' }
    });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der Termine' });
  }
});

// GET /api/appointments/today
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        lead: true,
        closer: { select: { id: true, name: true } },
        deal: true
      },
      orderBy: { scheduledAt: 'asc' }
    });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der heutigen Termine' });
  }
});

// POST /api/appointments
router.post('/', async (req, res) => {
  try {
    const data = createAppointmentSchema.parse(req.body);
    const appointment = await prisma.appointment.create({
      data: {
        ...data,
        scheduledAt: new Date(data.scheduledAt),
      },
      include: {
        lead: true,
        closer: { select: { id: true, name: true } },
      }
    });
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ error: 'Ungültige Daten' });
  }
});

// PUT /api/appointments/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, noShowReason } = updateStatusSchema.parse(req.body);
    
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { 
        status,
        noShowReason: status === 'NO_SHOW' ? noShowReason : null
      },
      include: {
        lead: true,
        closer: { select: { id: true, name: true } },
        deal: true
      }
    });
    
    res.json(appointment);
  } catch (error) {
    res.status(400).json({ error: 'Ungültige Daten' });
  }
});

export default router;