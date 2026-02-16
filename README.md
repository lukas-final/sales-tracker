# Sales Tracker - Starter Template 🚀

Ein komplettes Sales Tracking & CRM Tool mit:
- ✅ Facebook Ads Integration ready
- ✅ Termin-Management mit No-Show Tracking
- ✅ Deal Pipeline (Won/Lost/Follow-up)
- ✅ Zahlungs-Tracking (Einmal/Ratenzahlung)
- ✅ Umsatz-Reports pro Closer

## 📁 Projektstruktur

```
sales-tracker/
├── apps/
│   ├── web/          # Next.js 14 Frontend (React + Tailwind)
│   └── api/          # Express Backend (TypeScript + Prisma)
├── prisma/           # Datenbank Schema
├── docker-compose.yml # PostgreSQL lokal
└── turbo.json        # Monorepo Config
```

## 🛠️ Tech Stack

| Layer | Technologie |
|-------|-------------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Express.js, TypeScript, Prisma ORM |
| Datenbank | PostgreSQL |
| Monorepo | Turbo |

## 🚀 Quick Start

### 1. In den Projektordner wechseln
```bash
cd projects/sales-tracker
```

### 2. Datenbank starten
```bash
docker-compose up -d
```
> Startet PostgreSQL auf Port 5432 + Adminer (DB-UI) auf Port 8080

### 3. Dependencies installieren
```bash
npm install
```

### 4. Umgebungsvariablen kopieren
```bash
cp .env.example .env
```

### 5. Datenbank migrieren
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Development Server starten

**Terminal 1 - Backend:**
```bash
cd apps/api && npm run dev
```
> Läuft auf http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd apps/web && npm run dev
```
> Läuft auf http://localhost:3000

## 📊 Features

### Dashboard
- KPI Übersicht (Termine, Abschlüsse, Umsatz, No-Shows)
- Heutige Termine
- Umsatz-Statistiken

### Termine
- Kalender-Ansicht
- Status: Geplant / Abgeschlossen / No-Show
- No-Show Gründe erfassen

### Deals
- Pipeline: Ausstehend / Gewonnen / Verloren / Follow-Up
- Zahlungsarten: Einmalzahlung oder Ratenzahlung
- Zahlungs-Tracking für Ratenpläne
- Umsatz pro Deal

### Reports
- Performance pro Closer (Conversion-Rate, Umsatz)
- No-Show Analyse
- Gesamt-Umsatz

### Kampagnen
- Facebook Kampagnen erfassen
- Leads zuordnen
- Budget-Tracking

## 🔗 Facebook Ads API Integration

1. **Facebook Developer Account** erstellen: https://developers.facebook.com
2. **Neue App** mit "Marketing API" erstellen
3. **Access Token** generieren (mit `ads_read`, `leads_retrieval`)
4. **Token in `.env` eintragen:**
   ```
   FACEBOOK_ACCESS_TOKEN="dein-token"
   ```
5. **Webhook einrichten:**
   - Callback URL: `http://deine-domain.com/api/webhooks/facebook`
   - Events: `leadgen_id`

## 📖 API Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/campaigns` | GET/POST | Kampagnen verwalten |
| `/api/leads` | GET/POST | Leads verwalten |
| `/api/appointments` | GET/POST | Termine verwalten |
| `/api/appointments/:id/status` | PUT | Termin-Status updaten |
| `/api/deals` | GET/POST | Deals verwalten |
| `/api/deals/:id/payments` | POST | Zahlung hinzufügen |
| `/api/reports/closer-stats` | GET | Closer Performance |
| `/api/reports/revenue` | GET | Umsatz-Report |
| `/api/reports/no-shows` | GET | No-Show Analyse |

## 🗄️ Datenbank Schema

**Tabellen:**
- `User` - Closer/Admin/Managers
- `Campaign` - Facebook Kampagnen
- `Lead` - Interessenten
- `Appointment` - Termine
- `Deal` - Verkäufe
- `Payment` - Einzelne Zahlungen

## 📝 Nächste Schritte

- [ ] Auth/Login implementieren
- [ ] Facebook Webhook Endpoint erstellen
- [ ] E-Mail Benachrichtigungen
- [ ] Mobile-Optimierung
- [ ] Tests schreiben

## 🐛 Troubleshooting

**Port 5432 belegt?**
```bash
docker-compose down
docker-compose up -d
```

**Prisma Client nicht gefunden?**
```bash
npx prisma generate
```

**Datenbank zurücksetzen:**
```bash
docker-compose down -v
docker-compose up -d
npx prisma migrate dev
```

---

Built with ❤️ by DeepSeek V3