#!/bin/bash
# Simple Sales Tracker - Deployment Script
# Angepasst an das neue Briefing: Admin-Dashboard + Closer-Interface

set -e

echo "🚀 SIMPLE SALES TRACKER Installation"
echo "===================================="
echo "📋 Briefing: Visuell reduziert, hoch-effizient"
echo "🎯 Fokus: Admin-Dashboard (Die Wahrheit) + Closer-Interface (Minimalistisch)"
echo ""

# 1. System updaten
echo "📦 System updaten..."
apt update
apt upgrade -y

# 2. Docker installieren
echo "🐳 Docker installieren..."
if ! command -v docker &> /dev/null; then
    apt install -y docker.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
fi

# Docker Compose sicherstellen
if ! command -v docker-compose &> /dev/null; then
    apt install -y docker-compose
fi

# 3. Node.js installieren (mit Konflikt-Lösung)
echo "📦 Node.js installieren..."
if ! command -v node &> /dev/null; then
    # Alte Node.js Versionen entfernen (falls vorhanden)
    apt remove --purge nodejs npm -y 2>/dev/null || true
    apt autoremove -y
    
    # NodeSource Repository für Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    echo "✅ Node.js $(node --version) installiert"
    echo "✅ NPM $(npm --version) installiert"
fi

# 4. Dependencies installieren
echo "📦 Abhängigkeiten installieren..."
npm install

# 5. .env Datei erstellen
echo "🔧 .env Datei erstellen..."
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:password@localhost:5432/sales_tracker"
NODE_ENV="production"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
EOF

# 6. Docker starten
echo "🐳 PostgreSQL Datenbank starten..."
docker-compose up -d

# Warten auf Datenbank
echo "⏳ Warte auf Datenbank..."
sleep 15

# 7. Datenbank migrieren
echo "🗄️ Datenbank einrichten..."
npx prisma generate
npx prisma db push --accept-data-loss

# 7. Demo-Daten erstellen
echo "📊 Demo-Daten erstellen..."
cat > create-demo-data.js << 'DEMO'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Admin User
  await prisma.user.upsert({
    where: { email: 'admin@sales-tracker.com' },
    update: {},
    create: {
      email: 'admin@sales-tracker.com',
      name: 'Admin User',
      role: 'ADMIN'
    }
  });

  // Closer Users
  const closers = [
    { email: 'closer1@sales-tracker.com', name: 'Max Mustermann' },
    { email: 'closer2@sales-tracker.com', name: 'Anna Schmidt' },
    { email: 'closer3@sales-tracker.com', name: 'Tom Weber' }
  ];

  for (const closer of closers) {
    await prisma.user.upsert({
      where: { email: closer.email },
      update: {},
      create: {
        email: closer.email,
        name: closer.name,
        role: 'CLOSER',
        totalCalls: Math.floor(Math.random() * 50) + 20,
        totalWins: Math.floor(Math.random() * 15) + 5,
        totalRevenue: Math.floor(Math.random() * 50000) + 20000
      }
    });
  }

  console.log('✅ Demo-Daten erstellt');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
DEMO

node create-demo-data.js

# 8. Backend starten
echo "🔙 Backend starten..."
cd apps/api
npm install
npm run dev &
cd ..

# 9. Frontend starten
echo "🎨 Frontend starten..."
cd apps/web
npm install
npm run dev &
cd ..

# 10. PM2 für Auto-Start
echo "⚡ PM2 installieren..."
npm install -g pm2
pm2 start "npm run dev" --name api --cwd apps/api
pm2 start "npm run dev" --name web --cwd apps/web
pm2 save
pm2 startup

# 11. Nginx installieren
echo "🌐 Nginx konfigurieren..."
apt install -y nginx
cat > /etc/nginx/sites-available/sales-tracker << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Gzip Kompression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health Check
    location /api/health {
        proxy_pass http://127.0.0.1:3001/api/health;
    }
}
EOF

ln -sf /etc/nginx/sites-available/sales-tracker /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# 12. Firewall konfigurieren
echo "🔥 Firewall konfigurieren..."
ufw allow 22/tcp 2>/dev/null || true
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true
ufw --force enable 2>/dev/null || true

echo ""
echo "✅✅✅ INSTALLATION ABGESCHLOSSEN! ✅✅✅"
echo ""
echo "🎉 SIMPLE SALES TRACKER IST JETZT ONLINE!"
echo ""
echo "📱 ZUGRIFF:"
echo "   🌐 Haupt-URL: http://187.77.76.92"
echo "   🎨 Frontend direkt: http://187.77.76.92:3000"
echo "   🔙 API: http://187.77.76.92:3001"
echo ""
echo "👥 DEMO-LOGINS:"
echo "   👑 Admin: admin@sales-tracker.com"
echo "   👤 Closer 1: closer1@sales-tracker.com"
echo "   👤 Closer 2: closer2@sales-tracker.com"
echo "   👤 Closer 3: closer3@sales-tracker.com"
echo ""
echo "📊 FUNKTIONEN (nach Briefing):"
echo "   ✅ Admin-Dashboard: 'Die Wahrheit' mit Closer-Ranking"
echo "   ✅ Closer-Interface: Minimalistisch, nur das Nötigste"
echo "   ✅ Show-Up Rate Tracking: Erschienen vs. No-Show"
echo "   ✅ Conversion Tracking: Calls → Wins"
echo "   ✅ Cashflow: Heute fakturiert"
echo "   ✅ Payment Types: Einmalzahlung & Ratenzahlung"
echo ""
echo "🔧 VERWALTUNG:"
echo "   pm2 status               # Status aller Services"
echo "   pm2 logs                 # Logs ansehen"
echo "   pm2 restart all          # Alles neustarten"
echo "   docker-compose logs      # Datenbank Logs"
echo ""
echo "🚀 NÄCHSTE SCHRITTE:"
echo "   1. App testen: http://187.77.76.92"
echo "   2. Facebook-API Token hinzufügen (optional)"
echo "   3. Eigene Closer Accounts erstellen"
echo "   4. Domain einrichten: sales.deine-domain.de"
echo ""
echo "💡 TIPP:"
echo "   Für SSL: certbot --nginx -d deine-domain.de"
echo ""
echo "🎯 VIEL ERFOLG MIT DEINEM SIMPLE SALES TRACKER!"