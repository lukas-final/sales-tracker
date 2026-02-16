import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/admin/dashboard - Admin Dashboard Daten
router.get('/dashboard', async (req, res) => {
  try {
    // 1. Closer Ranking (Umsatz)
    const closerRanking = await prisma.user.findMany({
      where: { role: 'CLOSER' },
      select: {
        id: true,
        name: true,
        email: true,
        totalCalls: true,
        totalWins: true,
        totalRevenue: true,
      },
      orderBy: { totalRevenue: 'desc' }
    });

    // 2. Heutige Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = await prisma.dailyStats.findUnique({
      where: { date: today }
    });

    // 3. Conversion Rates berechnen
    const allClosers = closerRanking.map(closer => ({
      ...closer,
      conversionRate: closer.totalCalls > 0 
        ? (closer.totalWins / closer.totalCalls) * 100 
        : 0
    }));

    // 4. Heutige Cashflow (fakturiert heute)
    const todayDeals = await prisma.deal.findMany({
      where: {
        closedAt: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        },
        status: 'WON'
      },
      include: {
        closer: {
          select: { name: true }
        }
      }
    });

    const todayCashflow = todayDeals.reduce((sum, deal) => sum + Number(deal.totalValue), 0);

    // 5. Show-Up Rate (letzte 7 Tage)
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentAppointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: sevenDaysAgo },
        status: { in: ['COMPLETED', 'NO_SHOW_FORGOT', 'NO_SHOW_SICK', 'NO_SHOW_GHOSTING', 'NO_SHOW_OTHER'] }
      }
    });

    const completed = recentAppointments.filter(a => a.status === 'COMPLETED').length;
    const noShows = recentAppointments.filter(a => a.status.startsWith('NO_SHOW')).length;
    const showUpRate = recentAppointments.length > 0 
      ? (completed / (completed + noShows)) * 100 
      : 0;

    res.json({
      closerRanking: allClosers,
      todayStats: todayStats || {
        totalLeads: 0,
        totalCalls: 0,
        totalWins: 0,
        totalRevenue: 0,
        showUpRate: 0,
        conversionRate: 0
      },
      todayCashflow,
      showUpRate,
      todayDeals: todayDeals.map(deal => ({
        id: deal.id,
        value: deal.totalValue,
        closer: deal.closer.name,
        closedAt: deal.closedAt
      }))
    });

  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/closer/:id - Closer Details
router.get('/closer/:id', async (req, res) => {
  try {
    const closer = await prisma.user.findUnique({
      where: { id: req.params.id, role: 'CLOSER' },
      include: {
        appointments: {
          include: {
            lead: true,
            deal: true
          },
          orderBy: { scheduledAt: 'desc' },
          take: 10
        },
        deals: {
          orderBy: { closedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!closer) {
      return res.status(404).json({ error: 'Closer not found' });
    }

    res.json(closer);
  } catch (error) {
    console.error('Closer Details Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/update-daily-stats - Tägliche Stats aktualisieren
router.post('/update-daily-stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Stats für heute berechnen
    const todayLeads = await prisma.lead.count({
      where: { createdAt: { gte: today } }
    });

    const todayAppointments = await prisma.appointment.findMany({
      where: { scheduledAt: { gte: today } }
    });

    const todayCompleted = todayAppointments.filter(a => a.status === 'COMPLETED').length;
    const todayNoShows = todayAppointments.filter(a => a.status.startsWith('NO_SHOW')).length;
    const showUpRate = todayAppointments.length > 0 
      ? (todayCompleted / todayAppointments.length) * 100 
      : 0;

    const todayDeals = await prisma.deal.findMany({
      where: {
        closedAt: { gte: today },
        status: 'WON'
      }
    });

    const todayRevenue = todayDeals.reduce((sum, deal) => sum + Number(deal.totalValue), 0);
    const conversionRate = todayCompleted > 0 
      ? (todayDeals.length / todayCompleted) * 100 
      : 0;

    // Stats speichern oder aktualisieren
    const dailyStats = await prisma.dailyStats.upsert({
      where: { date: today },
      update: {
        totalLeads: todayLeads,
        totalCalls: todayAppointments.length,
        totalWins: todayDeals.length,
        totalRevenue: todayRevenue,
        showUpRate,
        conversionRate
      },
      create: {
        date: today,
        totalLeads: todayLeads,
        totalCalls: todayAppointments.length,
        totalWins: todayDeals.length,
        totalRevenue: todayRevenue,
        showUpRate,
        conversionRate
      }
    });

    res.json(dailyStats);
  } catch (error) {
    console.error('Update Daily Stats Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;