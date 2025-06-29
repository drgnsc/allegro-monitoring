# 🚀 Deployment Guide

## Opcje deployment

### 1. 💻 Lokalny Development (obecny stan)
```bash
# PocketBase
cd backend && ./pocketbase.exe serve --dev

# Dashboard  
cd web-dashboard && npm run dev
```

### 2. 🌐 Produkcja (VPS/Cloud)

#### A. Hetzner VPS (rekomendowane)
**Koszt: ~4-8€/miesiąc za VPS CX11**

```bash
# 1. Utworzenie VPS na Hetzner
# 2. Instalacja na serwerze:

# Docker setup
sudo apt update
sudo apt install docker.io docker-compose

# Clone repo
git clone https://github.com/drgnsc/allegro-monitoring.git
cd allegro-monitoring

# Build i uruchomienie
docker-compose up -d
```

#### B. Railway (Backend) + Vercel (Frontend)
**Koszt: $0-5/miesiąc**

**PocketBase na Railway:**
1. Połącz GitHub repo z Railway
2. Deploy folder `backend/`
3. Automatyczny SSL + domena

**Dashboard na Vercel:**
1. Połącz GitHub repo z Vercel  
2. Root directory: `web-dashboard/`
3. Build command: `npm run build`
4. Automatyczny deployment z GitHub

### 3. 🐳 Docker (produkcja)

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  pocketbase:
    build: ./backend
    ports:
      - "8090:8090"
    volumes:
      - ./backend/pb_data:/app/pb_data
    restart: unless-stopped

  dashboard:
    build: ./web-dashboard
    ports:
      - "3001:3001"
    environment:
      - VITE_POCKETBASE_URL=http://pocketbase:8090
    depends_on:
      - pocketbase
    restart: unless-stopped
```

## 🔒 Konfiguracja produkcyjna

### Environment Variables
```bash
# Backend (.env)
PB_ENCRYPTION_KEY=your-secret-key-here
DOMAIN=yourdomain.com

# Frontend (.env.production)
VITE_POCKETBASE_URL=https://api.yourdomain.com
```

### Reverse Proxy (Nginx)
```nginx
# /etc/nginx/sites-available/allegro-monitor
server {
    listen 80;
    server_name yourdomain.com;
    
    # Dashboard
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }
    
    # API
    location /api/ {
        proxy_pass http://localhost:8090/;
        proxy_set_header Host $host;
    }
}
```

## 📦 Chrome Extension Release

### Automatyczne pakowanie:
```bash
# Windows
./scripts/package-extension.bat

# Linux/Mac  
./scripts/package-extension.sh
```

### Ręczne pakowanie:
1. Chrome → Extensions → Developer mode
2. Pack extension → wybierz folder `chrome-extension/`
3. Utworzy się `chrome-extension.crx` + klucz prywatny

## 🔄 CI/CD Pipeline (GitHub Actions)

**.github/workflows/deploy.yml:**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: railway deploy

  deploy-frontend:
    runs-on: ubuntu-latest  
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel deploy --prod

  package-extension:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Package Chrome Extension
        run: ./scripts/package-extension.sh
      - name: Upload to Releases
        uses: actions/upload-artifact@v3
```

## 🌍 Domeny i SSL

### Darmowe opcje:
- **Netlify/Vercel**: Automatyczny SSL
- **Cloudflare**: Darmowy DNS + SSL
- **Let's Encrypt**: Darmowe certyfikaty SSL

### Rekomendowana struktura:
- `app.allegro-monitor.com` - Dashboard
- `api.allegro-monitor.com` - PocketBase API

## 📊 Monitoring produkcji

### Logi
```bash
# PocketBase logi
docker logs allegro-monitoring_pocketbase_1 -f

# Dashboard logi  
docker logs allegro-monitoring_dashboard_1 -f
```

### Backup bazy danych
```bash
# Automatyczny backup (cron)
0 2 * * * cp /path/to/pb_data/data.db /backups/$(date +%Y%m%d)_backup.db
```

## 🔧 Troubleshooting

### Częste problemy:
1. **CORS errors** - sprawdź VITE_POCKETBASE_URL
2. **Database locked** - restart PocketBase
3. **Extension not loading** - przeładuj w Developer Mode

### Health checks:
```bash
# Backend
curl http://localhost:8090/api/health

# Frontend
curl http://localhost:3001

# Database
sqlite3 pb_data/data.db ".tables"
```

---

## 📝 Checklist deployment

### Pre-deployment:
- [ ] Wszystkie testy przechodzą
- [ ] Environment variables skonfigurowane
- [ ] Backup bazy danych
- [ ] SSL certyfikaty gotowe

### Deployment:
- [ ] PocketBase backend uruchomiony
- [ ] Dashboard frontend uruchomiony  
- [ ] Extension spakowana w .crx
- [ ] DNS skonfigurowany

### Post-deployment:
- [ ] Smoke tests na produkcji
- [ ] Monitoring skonfigurowany
- [ ] Backup schedule ustawiony
- [ ] Dokumentacja zaktualizowana

---

**Pro tip**: Zacznij od Railway + Vercel - to najszybsza droga do produkcji! 🚀 