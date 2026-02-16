# Sales Tracker - Projektplan

## 1. Tech-Stack Empfehlung

### Option A: Full-Stack JavaScript (Empfohlen)
| Layer | Technologie | Begründung |
|-------|-------------|------------|
| **Frontend** | React + TypeScript + Tailwind CSS | Modern, große Community, schnell |
| **Backend** | Node.js + Express + TypeScript | Einheitliche Sprache, schnelle Entwicklung |
| **Datenbank** | PostgreSQL + Prisma ORM | Robust, gute Beziehungen, Migrationen |
| **Auth** | NextAuth.js oder JWT | Einfache Integration |
| **Deployment** | Vercel (Frontend) + Railway/Render (Backend) | Einfach, skalierbar |

### Option B: Alles-in-einem (Schneller MVP)
- **Next.js** (Full-stack React) - API + Frontend in einem
- **Supabase** (PostgreSQL + Auth + Realtime) - Backend-as-a-Service
- **Vercel** - Hosting

---

## 2. Datenbank-Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      Role     @default(CLOSER)
  createdAt DateTime @default(now())
  
  // Relations
  appointments Appointment[]
  deals        Deal[]
  
  @@map("users")
}

model Campaign {
  id          String   @id @default(cuid())
  facebookId  String?  @unique  // Facebook Campaign ID
  name        String
  budget      Decimal  @db.Decimal(10, 2)
  status      CampaignStatus @default(ACTIVE)
  startDate   DateTime
  endDate     DateTime?
  createdAt   DateTime @default(now())
  
  // Relations
  leads       Lead[]
  
  @@map("campaigns")
}

model Lead {
  id          String   @id @default(cuid())
  facebookId  String?  // Facebook Lead ID
  firstName   String
  lastName    String
  email       String?
  phone       String
  campaignId  String
  createdAt   DateTime @default(now())
  
  // Relations
  campaign    Campaign @relation(fields: [campaignId], references: [id])
  appointment Appointment?
  
  @@map("leads")
}

model Appointment {
  id          String   @id @default(cuid())
  leadId      String   @unique
  closerId    String
  scheduledAt DateTime
  status      AppointmentStatus @default(SCHEDULED)
  noShowReason String? // Nur wenn NO_SHOW
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  lead        Lead     @relation(fields: [leadId], references: [id])
  closer      User     @relation(fields: [closerId], references: [id])
  deal        Deal?
  
  @@map("appointments")
}

model Deal {
  id              String   @id @default(cuid())
  appointmentId   String   @unique
  closerId        String
  status          DealStatus @default(PENDING)
  productPrice    Decimal  @db.Decimal(10, 2)
  paymentType     PaymentType
  
  // Raten-Details (nur wenn PAYMENT_INSTALLMENTS)
  downPayment     Decimal? @db.Decimal(10, 2)
  monthlyRate     Decimal? @db.Decimal(10, 2)
  numberOfRates   Int?     // Anzahl der Raten
  
  // Einmalzahlung (nur wenn PAYMENT_FULL)
  paidAmount      Decimal? @db.Decimal(10, 2)
  
  closedAt        DateTime?
  lostReason      String?  // Nur wenn LOST
  followUpDate    DateTime? // Nur wenn FOLLOW_UP
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  appointment     Appointment @relation(fields: [appointmentId], references: [id])
  closer          User     @relation(fields: [closerId], references: [id])
  payments        Payment[]
  
  @@map("deals")
}

model Payment {
  id          String   @id @default(cuid())
  dealId      String
  amount      Decimal  @db.Decimal(10, 2)
  paidAt      DateTime
  method      String?  // z.B. "Banküberweisung", "Kreditkarte"
  note        String?
  
  // Relations
  deal        Deal     @relation(fields: [dealId], references: [id])
  
  @@map("payments")
}

// Enums
enum Role {
  ADMIN
  CLOSER
  MANAGER
}

enum CampaignStatus {
  ACTIVE
  PAUSED
  COMPLETED
}

enum AppointmentStatus {
  SCHEDULED
  NO_SHOW
  COMPLETED
}

enum DealStatus {
  PENDING
  WON
  LOST
  FOLLOW_UP
}

enum PaymentType {
  PAYMENT_FULL      // Einmalzahlung
  PAYMENT_INSTALLMENTS // Ratenzahlung
}
```

---

## 3. Projektstruktur

```
sales-tracker/
├── apps/
│   ├── web/                    # React Frontend
│   │   ├── src/
│   │   │   ├── components/     # UI Komponenten
│   │   │   │   ├── Dashboard/
│   │   │   │   ├── Appointments/
│   │   │   │   ├── Deals/
│   │   │   │   ├── Campaigns/
│   │   │   │   └── Reports/
│   │   │   ├── pages/
│   │   │   ├── hooks/          # Custom React Hooks
│   │   │   ├── services/       # API Calls
│   │   │   ├── types/          # TypeScript Types
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── tailwind.config.js
│   │
│   └── api/                    # Express Backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── campaigns.ts
│       │   │   ├── leads.ts
│       │   │   ├── appointments.ts
│       │   │   ├── deals.ts
│       │   │   ├── payments.ts
│       │   │   └── reports.ts
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── middleware/
│       │   └── prisma/
│       └── package.json
│
├── packages/
│   └── shared-types/           # Gemeinsame TypeScript Types
│
├── prisma/
│   └── schema.prisma
│
└── docker-compose.yml          # Für lokale Entwicklung
```

---

## 4. Wichtige API-Endpoints

### Campaigns
```
GET    /api/campaigns              # Alle Kampagnen
POST   /api/campaigns              # Kampagne erstellen
GET    /api/campaigns/:id          # Kampagne Details
PUT    /api/campaigns/:id          # Kampagne aktualisieren
DELETE /api/campaigns/:id          # Kampagne löschen
GET    /api/campaigns/:id/stats    # Kampagnen-Statistiken
```

### Leads & Appointments
```
GET    /api/leads                  # Alle Leads
POST   /api/leads                  # Lead erstellen (manuell oder von FB)
GET    /api/leads/:id              # Lead Details

GET    /api/appointments           # Alle Termine
POST   /api/appointments           # Termin erstellen
PUT    /api/appointments/:id       # Termin updaten (Status, No-Show)
GET    /api/appointments/today     # Heutige Termine
GET    /api/appointments/upcoming  # Kommende Termine
```

### Deals
```
GET    /api/deals                  # Alle Deals
POST   /api/deals                  # Deal erstellen
PUT    /api/deals/:id              # Deal updaten (Status, Preis)
GET    /api/deals/:id/payments     # Zahlungen für Deal
POST   /api/deals/:id/payments     # Zahlung hinzufügen
```

### Reports
```
GET    /api/reports/closer-stats   # Statistik pro Closer
GET    /api/reports/revenue        # Umsatz-Report
GET    /api/reports/conversion     # Conversion-Raten
GET    /api/reports/no-shows       # No-Show Analyse
```

---

## 5. UI-Konzept / Dashboard

### Haupt-Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│  SALES TRACKER                                    [User]    │
├────────────┬────────────────────────────────────────────────┤
│            │  📊 KPIs (Heute/Diese Woche/Dieser Monat)       │
│  NAVIGATION│  ┌──────────┬──────────┬──────────┬──────────┐  │
│  📋 Dashboard│  │  Termine │  Abschl. │  Umsatz  │  No-Show │  │
│  📅 Termine  │  │    12    │    5     │ 15.400 € │   2 (17%)│  │
│  💰 Deals    │  └──────────┴──────────┴──────────┴──────────┘  │
│  📈 Reports  │                                                │
│  ⚙️ Einstell.│  📈 Umsatz pro Closer (Chart)                   │
│              │                                                │
│              │  📅 Heutige Termine                            │
│              │  ┌────────────────────────────────────────────┐│
│              │  │ 14:00 | Max Mustermann | Anna (Closer)     ││
│              │  │ 15:30 | Lisa Schmidt     | Tom (Closer)    ││
│              │  └────────────────────────────────────────────┘│
└────────────┴────────────────────────────────────────────────┘
```

### Termin-Detail-Ansicht
```
Termin: Max Mustermann
┌──────────────────────────────────────────────┐
│ 📞 0151 12345678                             │
│ 📧 max@email.com                             │
│ 🎯 Kampagne: "Sommer Sale 2025"              │
├──────────────────────────────────────────────┤
│ Status: [SCHEDULED ▼]                        │
│                                              │
│ Optionen:                                    │
│ ○ No Show → Grund: [________]               │
│ ○ Abgeschlossen → Deal erstellen            │
│ ○ Follow Up → Datum: [________]             │
│ ○ Verloren → Grund: [________]              │
└──────────────────────────────────────────────┘
```

### Deal-Formular
```
Neuer Deal - Max Mustermann
┌──────────────────────────────────────────────┐
│ Produktpreis:        [_____ €]               │
│                                              │
│ Zahlungsart:                                 │
│ (•) Einmalzahlung                            │
│     Gezahlt: [_____ €]                       │
│                                              │
│ ( ) Ratenzahlung                             │
│     Anzahlung:   [_____ €]                   │
│     Monatliche Rate: [_____ €]               │
│     Anzahl Raten:    [__]                    │
│     → Gesamt: X.XXX €                        │
└──────────────────────────────────────────────┘
```

### Closer-Report
```
Umsatz pro Closer - Februar 2025
┌──────────────┬────────┬──────────┬─────────┬──────────┬────────────┐
│ Closer       │Termine │Abschlüsse│Quote    │Umsatz    │Ø Dealwert  │
├──────────────┼────────┼──────────┼─────────┼──────────┼────────────┤
│ Anna Schmidt │   45   │    18    │  40%    │54.000 €  │ 3.000 €    │
│ Tom Müller   │   38   │    12    │  32%    │36.000 €  │ 3.000 €    │
│ Lisa Weber   │   52   │    22    │  42%    │66.000 €  │ 3.000 €    │
└──────────────┴────────┴──────────┴─────────┴──────────┴────────────┘
```

---

## 6. Facebook Ads API Integration

### Setup
1. **Facebook Developer Account** erstellen
2. **App erstellen** mit Marketing API
3. **Access Token** generieren (mit ads_read, leads_retrieval)
4. **Webhook einrichten** für Echtzeit-Leads

### API-Endpunkt
```typescript
// Leads von Facebook abrufen
const getFacebookLeads = async (campaignId: string) => {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${campaignId}/leads?access_token=${TOKEN}`
  );
  return response.json();
};

// Lead in DB speichern
const saveLead = async (fbLead: FacebookLead) => {
  await prisma.lead.create({
    data: {
      facebookId: fbLead.id,
      firstName: fbLead.field_data.find(f => f.name === 'first_name')?.values[0],
      lastName: fbLead.field_data.find(f => f.name === 'last_name')?.values[0],
      email: fbLead.field_data.find(f => f.name === 'email')?.values[0],
      phone: fbLead.field_data.find(f => f.name === 'phone_number')?.values[0],
      campaignId: localCampaignId, // Mapping zu lokaler Kampagne
    }
  });
};
```

### Webhook für Echtzeit-Leads
```typescript
// Express Route für Facebook Webhook
app.post('/webhook/facebook-leads', async (req, res) => {
  const lead = req.body;
  await saveLead(lead);
  res.status(200).send('OK');
});
```

---

## 7. Zahlungs-Tracking Logik

### Einmalzahlung
```typescript
// Deal ist sofort "WON", voller Betrag gezahlt
if (paymentType === 'PAYMENT_FULL') {
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      status: 'WON',
      paidAmount: productPrice,
      closedAt: new Date(),
    }
  });
  
  // Zahlung speichern
  await prisma.payment.create({
    data: {
      dealId,
      amount: productPrice,
      paidAt: new Date(),
    }
  });
}
```

### Ratenzahlung
```typescript
// Deal ist "WON", aber Zahlungen kommen nach und nach
if (paymentType === 'PAYMENT_INSTALLMENTS') {
  const totalWithRates = downPayment + (monthlyRate * numberOfRates);
  
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      status: 'WON',
      downPayment,
      monthlyRate,
      numberOfRates,
    }
  });
  
  // Erste Zahlung = Anzahlung
  await prisma.payment.create({
    data: {
      dealId,
      amount: downPayment,
      paidAt: new Date(),
      note: 'Anzahlung',
    }
  });
}

// Später: Ratenzahlungen eintragen
const addRatePayment = async (dealId: string, amount: number) => {
  await prisma.payment.create({
    data: {
      dealId,
      amount,
      paidAt: new Date(),
      note: 'Monatliche Rate',
    }
  });
  
  // Prüfen ob alle Raten gezahlt
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { payments: true }
  });
  
  const totalPaid = deal.payments.reduce((sum, p) => sum + p.amount, 0);
  const expectedTotal = deal.downPayment + (deal.monthlyRate * deal.numberOfRates);
  
  if (totalPaid >= expectedTotal) {
    // Alle Raten bezahlt!
    await prisma.deal.update({
      where: { id: dealId },
      data: { status: 'COMPLETED' }
    });
  }
};
```

### Umsatz-Berechnung
```typescript
// Umsatz pro Closer berechnen
const getCloserRevenue = async (closerId: string, month: number, year: number) => {
  const deals = await prisma.deal.findMany({
    where: {
      closerId,
      status: 'WON',
      closedAt: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      }
    },
    include: { payments: true }
  });
  
  // Bei Einmalzahlung: voller Preis
  // Bei Ratenzahlung: nur bereits gezahlte Beträge
  const revenue = deals.reduce((sum, deal) => {
    if (deal.paymentType === 'PAYMENT_FULL') {
      return sum + deal.productPrice;
    } else {
      const paidSoFar = deal.payments.reduce((s, p) => s + p.amount, 0);
      return sum + paidSoFar;
    }
  }, 0);
  
  return revenue;
};
```

---

## 8. Nächste Schritte

1. **Projekt initialisieren:**
   ```bash
   mkdir sales-tracker && cd sales-tracker
   npx create-turbo@latest  # Monorepo mit Next.js
   ```

2. **Datenbank einrichten:**
   ```bash
   npx prisma init
   # schema.prisma kopieren
   npx prisma migrate dev
   ```

3. **Facebook App erstellen** und Test-Zugangsdaten holen

4. **MVP bauen:**
   - Dashboard mit statischen Daten
   - Termin-Liste
   - Deal-Formular
   - Dann Facebook-Integration

---

## Fragen zum Klären

- Soll das Tool als Web-App oder Desktop-App laufen?
- Wie viele Closer werden erwartet?
- Braucht es eine Mobile-Version?
- Sollen Zahlungen auch tatsächlich abgebucht werden (Stripe/SEPA) oder nur erfasst?
- Soll es Multi-Tenancy geben (mehrere Unternehmen)?
