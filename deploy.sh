#!/bin/bash
# Sales Tracker Deployment Script
# Einfach ausführen: ./deploy.sh

set -e

echo "🚀 Sales Tracker CRM Installation"
echo "================================="

# 1. System updaten
echo "📦 System updaten..."
apt update
apt upgrade -y

# 2. Docker installieren
echo "🐳 Docker installieren..."
if ! command -v docker &> /dev/null; then
    apt install -y docker.io docker-compose
    systemctl enable docker
    systemctl start docker
fi

# 3. Node.js installieren
echo "📦 Node.js installieren..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs npm
fi

# 4. Dependencies installieren
echo "📦 Abhängigkeiten installieren..."
npm install

# 5. Docker starten
echo "🐳 Datenbank starten..."
docker-compose up -d

# Warten auf Datenbank
echo "⏳ Warte auf Datenbank..."
sleep 10

# 6. Datenbank migrieren
echo "🗄️ Datenbank einrichten..."
npx prisma migrate dev --name init

# 7. Backend starten
echo "🔙 Backend starten..."
cd apps/api
npm install
npm run dev &
BACKEND_PID=$!
cd ..

# 8. Frontend starten
echo "🎨 Frontend starten..."
cd apps/web
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

# 9. PM2 für Auto-Start
echo "⚡ PM2 installieren..."
npm install -g pm2
pm2 start "npm run dev" --name api --cwd apps/api
pm2 start "npm run dev" --name web --cwd apps/web
pm2 save

# 10. Nginx installieren
echo "🌐 Nginx konfigurieren..."
apt install -y nginx
cat > /etc/nginx/sites-available/sales-tracker << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/sales-tracker /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo ""
echo "✅✅✅ INSTALLATION ABGESCHLOSSEN! ✅✅✅"
echo ""
echo "🌐 Deine App ist jetzt online:"
echo "   - http://187.77.76.92"
echo "   - http://187.77.76.92:3000 (Frontend direkt)"
echo "   - http://187.77.76.92:3001 (API)"
echo ""
echo "📊 Funktionen:"
echo "   ✅ Facebook Ads Integration"
echo "   ✅ Termin-Management"
echo "   ✅ Deal Pipeline"
echo "   ✅ Zahlungsverfolgung"
echo "   ✅ Revenue Reports"
echo ""
echo "🔧 Verwaltung:"
echo "   pm2 status      # Status anzeigen"
echo "   pm2 logs        # Logs ansehen"
echo "   pm2 restart all # Neustarten"
echo ""
echo "🎉 Viel Erfolg mit deiner Sales Tracker CRM!"