import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/closer/dashboard - Closer Dashboard (nur das Nötigste)
router.get('/dashboard/:closerId', async (req, res) => {
  try {
    const closerId = req.params.closerId;
    
    // Heutige Termine
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const todaysAppointments = await prisma.appointment.findMany({
      where: {
        closerId,
        scheduledAt: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        lead: {
          include: {
            campaign: true
          }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    // Offene Follow-Ups
    const followUps = await prisma.deal.findMany({
      where: {
        closerId,
        status: 'FOLLOW_UP',
        followUpDate: { gte: today }
      },
      include: {
        appointment: {
          include: {
            lead: true
          }
        }
      },
      orderBy: { followUpDate: 'asc' }
    });

    // Stats für Closer
    const closer = await prisma.user.findUnique({
      where: { id: closerId },
      select: {
        totalCalls: true,
        totalWins: true,
        totalRevenue: true
      }
    });

    res.json({
      todaysAppointments: todaysAppointments.map(apt => ({
        id: apt.id,
        time: apt.scheduledAt,
        lead: {
          name: `${apt.lead.firstName} ${apt.lead.lastName}`,
          phone: apt.lead.phone,
          campaign: apt.lead.campaign?.name || 'Unknown'
        },
        status: apt.status
      })),
      followUps: followUps.map(deal => ({
        id: deal.id,
        followUpDate: deal.followUpDate,
        leadName: `${deal.appointment.lead.firstName} ${deal.appointment.lead.lastName}`,
        productPrice: deal.productPrice
      })),
      stats: closer
    });

  } catch (error) {
    console.error('Closer Dashboard Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/closer/appointment/:id/complete - Termin abschließen
router.post('/appointment/:id/complete', async (req, res) => {
  try {
    const { status, showedUp, callDuration, notes } = req.body;
    const appointmentId = req.params.id;

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status,
        showedUp,
        callDuration,
        notes,
        updatedAt: new Date()
      },
      include: {
        closer: true,
        lead: true
      }
    });

    // Closer Stats aktualisieren
    if (showedUp) {
      await prisma.user.update({
        where: { id: appointment.closerId },
        data: {
          totalCalls: { increment: 1 }
        }
      });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Complete Appointment Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/closer/deal/create - Deal erstellen (nach Call)
router.post('/deal/create', async (req, res) => {
  try {
    const {
      appointmentId,
      status,
      productPrice,
      paymentType,
      fullAmount,
      downPayment,
      monthlyRate,
      numberOfRates,
      lostReason,
      followUpDate
    } = req.body;

    // Gesamtvolumen berechnen
    let totalValue = 0;
    
    if (paymentType === 'PAYMENT_FULL' && fullAmount) {
      totalValue = Number(fullAmount);
    } else if (paymentType === 'PAYMENT_INSTALLMENTS' && downPayment && monthlyRate && numberOfRates) {
      totalValue = Number(downPayment) + (Number(monthlyRate) * numberOfRates);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { closer: true }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const deal = await prisma.deal.create({
      data: {
        appointmentId,
        closerId: appointment.closerId,
        status,
        productPrice,
        paymentType,
        fullAmount,
        downPayment,
        monthlyRate,
        numberOfRates,
        totalValue,
        lostReason,
        followUpDate,
        closedAt: status === 'WON' ? new Date() : null
      }
    });

    // Closer Stats aktualisieren wenn gewonnen
    if (status === 'WON') {
      await prisma.user.update({
        where: { id: appointment.closerId },
        data: {
          totalWins: { increment: 1 },
          totalRevenue: { increment: totalValue }
        }
      });
    }

    res.json(deal);
  } catch (error) {
    console.error('Create Deal Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/closer/lead/:id - Lead Details für Call
router.get('/lead/:id', async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: {
        campaign: true,
        appointment: {
          include: {
            closer: true
          }
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Nur das Nötigste für den Closer
    res.json({
      id: lead.id,
      name: `${lead.firstName} ${lead.lastName}`,
      phone: lead.phone,
      email: lead.email,
      campaign: lead.campaign?.name,
      source: lead.source,
      notes: lead.appointment?.notes || ''
    });
  } catch (error) {
    console.error('Get Lead Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;