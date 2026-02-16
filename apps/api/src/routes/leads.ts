import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const createLeadSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().optional(),
  phone: z.string(),
  campaignId: z.string(),
  facebookId: z.string().optional(),
});

// GET /api/leads
router.get('/', async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        campaign: true,
        appointment: {
          include: {
            closer: { select: { name: true } },
            deal: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der Leads' });
  }
});

// POST /api/leads
router.post('/', async (req, res) => {
  try {
    const data = createLeadSchema.parse(req.body);
    const lead = await prisma.lead.create({
      data,
      include: { campaign: true }
    });
    res.status(201).json(lead);
  } catch (error) {
    res.status(400).json({ error: 'Ungültige Daten' });
  }
});

// GET /api/leads/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        campaign: true,
        appointment: {
          include: {
            closer: true,
            deal: { include: { payments: true } }
          }
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead nicht gefunden' });
    }

    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden des Leads' });
  }
});

export default router;