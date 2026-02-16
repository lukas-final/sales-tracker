import { Router } from 'express';
import { PrismaClient, DealStatus, PaymentType } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const createDealSchema = z.object({
  appointmentId: z.string(),
  closerId: z.string(),
  productPrice: z.number().positive(),
  paymentType: z.enum(['PAYMENT_FULL', 'PAYMENT_INSTALLMENTS']),
  // Für Einmalzahlung
  paidAmount: z.number().optional(),
  // Für Ratenzahlung
  downPayment: z.number().optional(),
  monthlyRate: z.number().optional(),
  numberOfRates: z.number().int().optional(),
});

const updateDealSchema = z.object({
  status: z.enum(['PENDING', 'WON', 'LOST', 'FOLLOW_UP']),
  lostReason: z.string().optional(),
  followUpDate: z.string().datetime().optional(),
});

// GET /api/deals
router.get('/', async (req, res) => {
  try {
    const { status, closerId } = req.query;
    
    let where: any = {};
    if (status) where.status = status;
    if (closerId) where.closerId = closerId;

    const deals = await prisma.deal.findMany({
      where,
      include: {
        appointment: {
          include: {
            lead: { select: { firstName: true, lastName: true, phone: true } }
          }
        },
        closer: { select: { name: true } },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der Deals' });
  }
});

// POST /api/deals
router.post('/', async (req, res) => {
  try {
    const data = createDealSchema.parse(req.body);
    
    const dealData: any = {
      appointmentId: data.appointmentId,
      closerId: data.closerId,
      productPrice: data.productPrice,
      paymentType: data.paymentType,
      status: 'WON',
      closedAt: new Date(),
    };

    if (data.paymentType === 'PAYMENT_FULL') {
      dealData.paidAmount = data.paidAmount || data.productPrice;
    } else {
      dealData.downPayment = data.downPayment;
      dealData.monthlyRate = data.monthlyRate;
      dealData.numberOfRates = data.numberOfRates;
    }

    const deal = await prisma.deal.create({
      data: dealData,
      include: {
        appointment: {
          include: {
            lead: { select: { firstName: true, lastName: true } }
          }
        },
        closer: { select: { name: true } },
      }
    });

    // Bei Einmalzahlung: direkt Payment erstellen
    if (data.paymentType === 'PAYMENT_FULL' && dealData.paidAmount) {
      await prisma.payment.create({
        data: {
          dealId: deal.id,
          amount: dealData.paidAmount,
          paidAt: new Date(),
          note: 'Einmalzahlung'
        }
      });
    }

    // Bei Ratenzahlung: Anzahlung als Payment erstellen
    if (data.paymentType === 'PAYMENT_INSTALLMENTS' && data.downPayment) {
      await prisma.payment.create({
        data: {
          dealId: deal.id,
          amount: data.downPayment,
          paidAt: new Date(),
          note: 'Anzahlung'
        }
      });
    }

    res.status(201).json(deal);
  } catch (error) {
    res.status(400).json({ error: 'Ungültige Daten' });
  }
});

// PUT /api/deals/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateDealSchema.parse(req.body);
    
    const updateData: any = {
      status: data.status,
      lostReason: data.lostReason,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
    };

    if (data.status === 'WON') {
      updateData.closedAt = new Date();
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        appointment: {
          include: {
            lead: { select: { firstName: true, lastName: true } }
          }
        },
        closer: { select: { name: true } },
        payments: true
      }
    });
    
    res.json(deal);
  } catch (error) {
    res.status(400).json({ error: 'Ungültige Daten' });
  }
});

// POST /api/deals/:id/payments - Neue Zahlung hinzufügen
router.post('/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, note } = req.body;
    
    const payment = await prisma.payment.create({
      data: {
        dealId: id,
        amount,
        paidAt: new Date(),
        note
      }
    });
    
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: 'Fehler beim Erstellen der Zahlung' });
  }
});

export default router;