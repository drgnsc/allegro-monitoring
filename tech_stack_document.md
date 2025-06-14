# Technology Stack Documentation
## Allegro Position Monitor

### Project Overview
**Project Name:** Allegro Position Monitor  
**Architecture:** Chrome Extension + Web Dashboard + Backend API  
**Development Environment:** Cursor IDE  
**Deployment Strategy:** Cloud-hosted with free tiers  

---

## 🏗️ Core Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Chrome         │    │   Web Dashboard  │    │   PocketBase    │
│  Extension      │◄──►│   (Frontend)     │◄──►│   (Backend)     │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 🔧 Backend Stack

### Database & API
- **Primary:** PocketBase
  - **Type:** SQLite with REST API
  - **Features:** Real-time subscriptions, built-in admin panel, file storage
  - **Authentication:** Built-in user management
  - **Cost:** Free (self-hosted)

### Hosting (Backend)
- **Primary:** Railway.app
  - **Plan:** Free tier (500 hours/month)
  - **Features:** Git-based deployment, automatic SSL
  - **Alternative:** Fly.io (3 tiny VMs free)

### API Endpoints
```
GET    /api/collections/positions/records     # Get position data
POST   /api/collections/positions/records     # Save new scan
GET    /api/collections/users/auth-refresh    # Refresh auth
POST   /api/collections/users/auth-with-email # Login
```

---

## 🎨 Frontend Stack

### Chrome Extension
- **Framework:** Vanilla JavaScript (Manifest V3)
- **Architecture:** Content Script + Background Script + Popup
- **APIs Used:**
  - Chrome Storage API
  - Chrome Tabs API
  - Chrome Runtime API
- **Build:** No bundler required
- **Testing:** Chrome Developer Mode

### Web Dashboard
- **Framework:** Vanilla JavaScript + HTML5 + CSS3
- **Styling:** Modern CSS (Grid, Flexbox, CSS Variables)
- **Charts:** Chart.js (for timeline visualization)
- **CSV Export:** Papa Parse library
- **Hosting:** Vercel (free tier)

---

## 📱 Development Tools

### IDE & Development
- **Primary IDE:** Cursor
- **Version Control:** Git
- **Package Manager:** npm (for dashboard dependencies only)
- **Local Testing:** 
  - PocketBase: `localhost:8090`
  - Dashboard: Live Server extension
  - Extension: Chrome Developer Mode

### Libraries & Dependencies

#### Chrome Extension (Minimal)
```json
{
  "dependencies": {
    "pocketbase": "^0.21.0"
  }
}
```

#### Web Dashboard
```json
{
  "dependencies": {
    "pocketbase": "^0.21.0",
    "chart.js": "^4.4.0",
    "papaparse": "^5.4.1"
  }
}
```

---

## 🗄️ Data Architecture

### Database Schema (PocketBase Collections)

#### Users Collection
```json
{
  "id": "string",
  "email": "string",
  "created": "datetime",
  "updated": "datetime"
}
```

#### Positions Collection
```json
{
  "id": "string",
  "userId": "relation(users)",
  "url": "string",
  "keyword": "string",
  "date": "date",
  "timestamp": "datetime",
  "products": "json",
  "created": "datetime"
}
```

#### Products JSON Structure
```json
[
  {
    "position": 1,
    "title": "Product Title",
    "seller": "Seller Name",
    "sponsored": false,
    "price": "99.99 zł",
    "url": "https://allegro.pl/oferta/..."
  }
]
```

---

## 🚀 Deployment Architecture

### Production Environment
```
Internet
    │
    ├── Railway.app (PocketBase Backend)
    │   ├── Domain: allegro-monitor.railway.app
    │   ├── SSL: Automatic
    │   └── Database: SQLite persistent volume
    │
    ├── Vercel (Web Dashboard)
    │   ├── Domain: allegro-monitor.vercel.app
    │   ├── SSL: Automatic
    │   └── Build: Static site generation
    │
    └── Chrome Web Store (Extension)
        ├── Distribution: .crx package
        └── Updates: Automatic
```

### Environment Variables
```bash
# Backend (Railway)
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=secure_password
PORT=8080

# Frontend (Vercel)
VITE_POCKETBASE_URL=https://allegro-monitor.railway.app
```

---

## 🔒 Security Stack

### Authentication
- **Method:** Email/Password (PocketBase built-in)
- **Session:** JWT tokens with refresh
- **Storage:** Chrome Storage API (extension), localStorage (dashboard)

### Data Protection
- **Encryption:** HTTPS/TLS in transit
- **Authorization:** PocketBase rules (user can only access own data)
- **CORS:** Configured for dashboard domain only

### Privacy
- **Data Minimization:** Only public Allegro data collected
- **User Control:** Full data export/deletion capabilities
- **Compliance:** GDPR-ready data handling

---

## 📊 Monitoring & Analytics

### Error Tracking
- **Chrome Extension:** Console logging + Chrome Storage for error logs
- **Dashboard:** Browser console + PocketBase logs
- **Backend:** PocketBase built-in logging

### Performance Monitoring
- **Extension:** Chrome DevTools Performance tab
- **Dashboard:** Lighthouse CI
- **Backend:** Railway.app metrics

---

## 🧪 Testing Strategy

### Local Development
1. **PocketBase:** `./pocketbase serve --dev`
2. **Extension:** Chrome Developer Mode loading
3. **Dashboard:** Live Server on `localhost:3000`

### Testing Environments
- **Development:** Local machine
- **Staging:** Railway preview deployments
- **Production:** Railway main + Vercel production

### Testing Checklist
- [ ] Extension loads on Allegro pages
- [ ] Product parsing accuracy (90%+ success rate)
- [ ] Data sync to PocketBase
- [ ] Dashboard login and data viewing
- [ ] CSV export functionality
- [ ] Cross-browser compatibility (Chrome focus)

---

## 🔄 CI/CD Pipeline

### Automated Deployment
```yaml
# Simplified workflow
git push → Railway auto-deploy (backend)
git push → Vercel auto-deploy (dashboard)
manual → Extension .crx packaging
```

### Release Process
1. **Development:** Feature branches
2. **Testing:** Manual testing checklist
3. **Staging:** Deploy to Railway preview
4. **Production:** Merge to main branch
5. **Extension:** Manual .crx creation and distribution

---

## 💰 Cost Analysis

### Monthly Costs (Production)
| Service | Plan | Cost | Usage Limit |
|---------|------|------|-------------|
| Railway.app | Free | $0 | 500 hours/month |
| Vercel | Hobby | $0 | 100GB bandwidth |
| Domain (optional) | .com | $12/year | N/A |
| **Total** | | **$1/month** | |

### Scaling Costs
- **Railway Pro:** $5/month (unlimited hours)
- **Vercel Pro:** $20/month (1TB bandwidth)
- **Custom domain:** $12/year

---

## 🔮 Future Technical Considerations

### Scalability
- **Database:** SQLite → PostgreSQL migration path
- **Hosting:** Railway → dedicated server if needed
- **CDN:** Cloudflare integration for global performance

### Technology Upgrades
- **Extension:** Manifest V3 → V4 when available
- **Framework:** Vanilla JS → React if complexity grows
- **Database:** PocketBase → Supabase for advanced features

---

**Document Version:** 1.0  
**Last Updated:** June 14, 2025  
**Technical Lead:** Developer  
**Review Schedule:** Monthly  