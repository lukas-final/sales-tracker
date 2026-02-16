import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const createCampaignSchema = z.object({
  name: z.string(),
  budget: z.number().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  facebookId: z.string().optional(),
});

// GET /api/campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        _count: {
          select: { leads: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der Kampagnen' });
  }
});

// POST /api/campaigns
router.post('/', async (req, res) => {
  try {
    const data = createCampaignSchema.parse(req.body);
    const campaign = await prisma.campaign.create({
      data: {
        ...data,
        budget: data.budget,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      }
    });
    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({ error: 'Ungültige Daten' });
  }
});

// GET /api/campaigns/:id/stats
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        leads: {
          include: {
            appointment: {
              include: {
                deal: true
              }
            }
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Kampagne nicht gefunden' });
    }

    const stats = {
      totalLeads: campaign.leads.length,
      appointments: campaign.leads.filter(l => l.appointment).length,
      deals: campaign.leads.filter(l => l.appointment?.deal?.status === 'WON').length,
      noShows: campaign.leads.filter(l => l.appointment?.status === 'NO_SHOW').length,
    };

    res.json({ campaign, stats });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der Statistiken' });
  }
});

export default router;