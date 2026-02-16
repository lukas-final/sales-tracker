import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/reports/closer-stats
router.get('/closer-stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.closedAt = {};
      if (startDate) dateFilter.closedAt.gte = new Date(startDate as string);
      if (endDate) dateFilter.closedAt.lte = new Date(endDate as string);
    }

    const closers = await prisma.user.findMany({
      where: { role: 'CLOSER' },
      include: {
        deals: {
          where: dateFilter,
          include: { payments: true }
        },
        appointments: {
          include: { deal: true }
        }
      }
    });

    const stats = closers.map(closer => {
      const deals = closer.deals;
      const wonDeals = deals.filter(d => d.status === 'WON');
      const lostDeals = deals.filter(d => d.status === 'LOST');
      const followUpDeals = deals.filter(d => d.status === 'FOLLOW_UP');
      
      // Umsatz berechnen
      const revenue = wonDeals.reduce((sum, deal) => {
        if (deal.paymentType === 'PAYMENT_FULL') {
          return sum + Number(deal.productPrice);
        } else {
          // Ratenzahlung: nur bisher gezahlte Beträge
          const paidSoFar = deal.payments.reduce((s, p) => s + Number(p.amount), 0);
          return sum + paidSoFar;
        }
      }, 0);

      return {
        id: closer.id,
        name: closer.name,
        totalDeals: deals.length,
        won: wonDeals.length,
        lost: lostDeals.length,
        followUp: followUpDeals.length,
        conversionRate: deals.length > 0 ? (wonDeals.length / deals.length * 100).toFixed(1) : 0,
        revenue: revenue.toFixed(2),
        avgDealValue: wonDeals.length > 0 ? (revenue / wonDeals.length).toFixed(2) : 0
      };
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der Statistiken' });
  }
});

// GET /api/reports/revenue
router.get('/revenue', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.closedAt = {};
      if (startDate) dateFilter.closedAt.gte = new Date(startDate as string);
      if (endDate) dateFilter.closedAt.lte = new Date(endDate as string);
    }

    const deals = await prisma.deal.findMany({
      where: {
        status: 'WON',
        ...dateFilter
      },
      include: { payments: true }
    });

    const totalRevenue = deals.reduce((sum, deal) => {
      if (deal.paymentType === 'PAYMENT_FULL') {
        return sum + Number(deal.productPrice);
      } else {
        const paidSoFar = deal.payments.reduce((s, p) => s + Number(p.amount), 0);
        return sum + paidSoFar;
      }
    }, 0);

    res.json({
      totalRevenue: totalRevenue.toFixed(2),
      totalDeals: deals.length,
      avgDealValue: deals.length > 0 ? (totalRevenue / deals.length).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden des Umsatzes' });
  }
});

// GET /api/reports/no-shows
router.get('/no-shows', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter: any = { status: 'NO_SHOW' };
    if (startDate || endDate) {
      dateFilter.scheduledAt = {};
      if (startDate) dateFilter.scheduledAt.gte = new Date(startDate as string);
      if (endDate) dateFilter.scheduledAt.lte = new Date(endDate as string);
    }

    const noShows = await prisma.appointment.findMany({
      where: dateFilter,
      include: {
        lead: true,
        closer: { select: { name: true } }
      }
    });

    // Gruppieren nach Grund
    const byReason = noShows.reduce((acc, appointment) => {
      const reason = appointment.noShowReason || 'Kein Grund angegeben';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      total: noShows.length,
      byReason,
      details: noShows
    });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der No-Shows' });
  }
});

export default router;