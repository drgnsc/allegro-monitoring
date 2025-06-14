# Plan Implementacji - Allegro Position Monitor
## Szczegółowy harmonogram rozwoju projektu

### 📊 Przegląd Projektu
**Szacowany czas:** 14-21 dni roboczych  
**Zespół:** 1 developer + 1 tester (kolega)  
**Metodologia:** Agile/Iteracyjna  
**Środowisko:** Cursor IDE + Git  

---

## 🎯 Fazy Projektu

### **FAZA 0: Setup & Przygotowanie** ⏱️ *1-2 dni*

#### 0.1 Konfiguracja środowiska deweloperskiego
- [ ] **Cursor IDE setup** (30 min)
  - Nowy projekt `allegro-monitor`
  - Git repository initialization
  - Folder structure creation
  
- [ ] **PocketBase lokalny setup** (45 min)
  - Download PocketBase binary
  - Pierwsza konfiguracja admin
  - Test połączenia API
  - Utworzenie collections (users, positions)
  
- [ ] **Chrome Developer Mode** (15 min)
  - Włączenie trybu deweloperskiego
  - Test ładowania pustej extension

#### 0.2 Projektowanie architektury danych
- [ ] **Database schema finalization** (30 min)
  - Definicja PocketBase collections
  - Relacje między tabelami
  - Validation rules
  
- [ ] **API endpoints mapping** (20 min)
  - Lista wszystkich potrzebnych endpoints
  - Request/response formats
  - Error handling scenarios

**Deliverables Faza 0:**
- ✅ Działające lokalne środowisko
- ✅ PocketBase z collections
- ✅ Dokumentacja API endpoints
- ✅ Folder structure projektu

---

## 🔧 **FAZA 1: Core Extension Development** ⏱️ *4-5 dni*

### **Dzień 1: Extension Foundation**

#### 1.1 Manifest.json i podstawowa struktura (2h)
```json
{
  "manifest_version": 3,
  "name": "Allegro Position Monitor",
  "version": "1.0.0",
  "permissions": ["activeTab", "storage"],
  "content_scripts": [{
    "matches": ["https://allegro.pl/listing*"],
    "js": ["content.js"]
  }],
  "popup": {
    "default_popup": "popup.html"
  }
}
```

#### 1.2 Content Script - Allegro Detection (3h)
- [ ] **URL pattern matching**
  - Wykrywanie stron z listingami
  - Ekstrakcja słów kluczowych z URL
  - Validation Allegro page structure
  
- [ ] **Basic DOM parsing**
  - Identyfikacja kontenerów produktów
  - Test różnych selektorów CSS
  - Fallback mechanisms

#### 1.3 Popup UI - Basic Interface (2h)
- [ ] **HTML structure**
  - Login form
  - Status indicator
  - Manual scan button
  
- [ ] **CSS styling**
  - Modern, minimalist design
  - Responsive layout
  - Loading states

**Checkpoint Dzień 1:**
- ✅ Extension ładuje się na Allegro
- ✅ Wykrywa listing pages
- ✅ Basic popup działa

### **Dzień 2: Product Parsing Engine**

#### 2.1 Advanced DOM Parsing (4h)
```javascript
const productSelectors = [
  'article[data-analytics-view-custom-index]',
  'div[data-testid="listing-item"]',
  'a[href*="/oferta/"]'
];

function parseProducts() {
  // Robust parsing logic
  // Handle sponsored vs organic
  // Extract: title, position, seller, price
}
```

#### 2.2 Data Structure Standardization (2h)
- [ ] **Product object model**
  - Consistent data format
  - Null value handling
  - Data validation
  
- [ ] **Position calculation**
  - Exclude sponsored results
  - Handle pagination
  - Organic position numbering

#### 2.3 Error Handling & Logging (1h)
- [ ] **Graceful failures**
  - Unknown page structures
  - Missing elements
  - Network issues
  
- [ ] **Debug logging**
  - Console output for development
  - Error reporting mechanism

**Checkpoint Dzień 2:**
- ✅ Parsing 90%+ produktów z listingu
- ✅ Wykluczanie sponsorowanych
- ✅ Robust error handling

### **Dzień 3: PocketBase Integration**

#### 3.1 Authentication System (3h)
```javascript
import PocketBase from 'pocketbase';
const pb = new PocketBase('http://localhost:8090');

// Login functionality
async function login(email, password) {
  const authData = await pb.collection('users')
    .authWithPassword(email, password);
  return authData;
}
```

#### 3.2 Data Sync Implementation (3h)
- [ ] **Save position data**
  - Batch insert products
  - Handle duplicates
  - Offline queue mechanism
  
- [ ] **Real-time sync**
  - Background script integration
  - Chrome Storage API
  - Sync status indicators

#### 3.3 Storage Management (1h)
- [ ] **Chrome Storage API**
  - User session persistence
  - Cache management
  - Settings storage

**Checkpoint Dzień 3:**
- ✅ Login/logout functionality
- ✅ Data zapisuje się do PocketBase
- ✅ Offline queue works

### **Dzień 4: User Experience Enhancement**

#### 4.1 Auto-Detection Logic (2h)
- [ ] **Page change detection**
  - URL monitoring
  - Auto-scan triggers
  - User preferences

#### 4.2 Visual Feedback System (2h)
- [ ] **Status indicators**
  - Scanning progress
  - Success/error states
  - Data sync status
  
- [ ] **Notifications**
  - Chrome notifications API
  - Non-intrusive alerts
  - Success confirmations

#### 4.3 Settings Panel (3h)
- [ ] **User preferences**
  - Auto-scan on/off
  - Scan frequency
  - Data retention settings
  
- [ ] **Account management**
  - Profile information
  - Data export options
  - Logout functionality

**Checkpoint Dzień 4:**
- ✅ Auto-scan functionality
- ✅ Rich user feedback
- ✅ Settings management

### **Dzień 5: Testing & Polish**

#### 5.1 Extension Testing (3h)
- [ ] **Manual testing scenarios**
  - Different Allegro search results
  - Various product counts
  - Sponsored vs organic
  - Edge cases handling
  
- [ ] **Performance testing**
  - Memory usage
  - CPU impact
  - Network requests optimization

#### 5.2 Code Optimization (2h)
- [ ] **Performance improvements**
  - Debounced scanning
  - Efficient DOM queries
  - Memory leak prevention
  
- [ ] **Code cleanup**
  - Remove debug logs
  - Comment optimization
  - Code documentation

#### 5.3 Error Scenarios Testing (2h)
- [ ] **Network failures**
  - Offline mode
  - API timeouts
  - Server errors
  
- [ ] **Data validation**
  - Malformed responses
  - Empty results
  - Invalid authentication

**Deliverables Faza 1:**
- ✅ Pełnofunkcjonalna Chrome Extension
- ✅ Integracja z PocketBase
- ✅ Auto-detection i manual scanning
- ✅ User authentication
- ✅ Comprehensive testing completed

---

## 🖥️ **FAZA 2: Web Dashboard Development** ⏱️ *4-5 dni*

### **Dzień 6: Dashboard Foundation**

#### 6.1 Project Setup (1h)
- [ ] **Vite/Vanilla JS setup**
  - Modern build configuration
  - Hot reload development
  - Production optimization
  
- [ ] **Dependencies installation**
  - PocketBase SDK
  - Chart.js for visualizations
  - Papa Parse for CSV export

#### 6.2 Authentication Pages (3h)
```html
<!-- Login Page -->
<form id="loginForm">
  <input type="email" required>
  <input type="password" required>
  <button type="submit">Login</button>
</form>
```

- [ ] **Login/Register forms**
  - Modern, responsive design
  - Form validation
  - Error handling
  
- [ ] **Session management**
  - Auto-login for returning users
  - Secure token storage
  - Session expiry handling

#### 6.3 Layout & Navigation (3h)
- [ ] **Main layout structure**
  - Header with user info
  - Sidebar navigation
  - Main content area
  - Footer
  
- [ ] **Responsive design**
  - Mobile-first approach
  - Tablet compatibility
  - Desktop optimization

**Checkpoint Dzień 6:**
- ✅ Dashboard authentication works
- ✅ Responsive layout ready
- ✅ Navigation structure

### **Dzień 7: Data Viewing Interface**

#### 7.1 Search & Filter System (4h)
```javascript
// Search functionality
async function searchProducts(query, dateRange) {
  const filter = `userId = "${userId}" && 
                  date >= "${dateRange.start}" && 
                  date <= "${dateRange.end}"`;
  
  return await pb.collection('positions').getList(1, 50, {
    filter,
    sort: '-created'
  });
}
```

- [ ] **Product search**
  - Fuzzy string matching
  - Search suggestions
  - Real-time results
  
- [ ] **Date range filtering**
  - Calendar picker
  - Preset ranges (last 7 days, month)
  - Custom range selection

#### 7.2 Data Display Tables (3h)
- [ ] **Results table**
  - Sortable columns
  - Pagination
  - Expandable rows for details
  
- [ ] **Position history**
  - Timeline view
  - Change indicators
  - Historical comparisons

**Checkpoint Dzień 7:**
- ✅ Search functionality complete
- ✅ Data tables with sorting/filtering
- ✅ Historical view working

### **Dzień 8: Data Visualization**

#### 8.1 Charts & Graphs (4h)
```javascript
// Position timeline chart
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: dates,
    datasets: [{
      label: 'Position',
      data: positions,
      borderColor: 'rgb(75, 192, 192)'
    }]
  }
});
```

- [ ] **Position timeline charts**
  - Line charts for position changes
  - Interactive tooltips
  - Zoom and pan functionality
  
- [ ] **Trend indicators**
  - Visual arrows (↗️↘️→)
  - Color coding (green/red)
  - Percentage changes

#### 8.2 Analytics Dashboard (3h)
- [ ] **Summary statistics**
  - Average position
  - Best/worst positions
  - Improvement trends
  
- [ ] **Performance metrics**
  - Scan frequency stats
  - Data collection success rate
  - User activity timeline

**Checkpoint Dzień 8:**
- ✅ Interactive charts working
- ✅ Trend analysis complete
- ✅ Analytics dashboard ready

### **Dzień 9: CSV Export System**

#### 9.1 Export Interface (2h)
- [ ] **Export modal**
  - Date range selection
  - Format options
  - Preview functionality
  
- [ ] **Advanced options**
  - Include/exclude sponsored
  - Multiple products selection
  - Custom column selection

#### 9.2 CSV Generation Logic (4h)
```javascript
// CSV export with multiple dates
function generateCSV(data, dateRange) {
  const headers = ['Keyword', 'URL', ...dateRange];
  const rows = data.map(product => {
    return [
      product.keyword,
      product.url,
      ...dateRange.map(date => getPositionForDate(product, date))
    ];
  });
  return Papa.unparse([headers, ...rows]);
}
```

- [ ] **Multi-date export**
  - Each date as separate column
  - Position comparison across dates
  - Trend calculation
  
- [ ] **Data aggregation**
  - Group by product/keyword
  - Handle missing dates
  - Calculate averages

#### 9.3 Download & Sharing (1h)
- [ ] **File download**
  - Browser download API
  - Filename generation
  - Progress indicators
  
- [ ] **Email export option**
  - Send CSV via email
  - Report scheduling
  - Automated exports

**Checkpoint Dzień 9:**
- ✅ CSV export fully functional
- ✅ Multi-date comparison
- ✅ Advanced filtering options

### **Dzień 10: Dashboard Polish & Testing**

#### 10.1 UI/UX Improvements (3h)
- [ ] **Visual polish**
  - Consistent styling
  - Loading states
  - Empty states handling
  
- [ ] **User experience**
  - Intuitive navigation
  - Keyboard shortcuts
  - Accessibility improvements

#### 10.2 Performance Optimization (2h)
- [ ] **Data loading optimization**
  - Lazy loading
  - Pagination
  - Caching strategies
  
- [ ] **Bundle optimization**
  - Code splitting
  - Asset optimization
  - Minification

#### 10.3 Testing & Bug Fixes (2h)
- [ ] **Cross-browser testing**
  - Chrome, Firefox, Safari
  - Mobile responsiveness
  - Various screen sizes
  
- [ ] **Data validation**
  - Edge cases handling
  - Error scenarios
  - Recovery mechanisms

**Deliverables Faza 2:**
- ✅ Kompletny web dashboard
- ✅ Search i filtering system
- ✅ Visualizations i analytics
- ✅ CSV export functionality
- ✅ Mobile-responsive design

---

## 🚀 **FAZA 3: Deployment & Integration** ⏱️ *2-3 dni*

### **Dzień 11: Backend Deployment**

#### 11.1 PocketBase Production Setup (2h)
- [ ] **Railway.app deployment**
  - PocketBase configuration
  - Environment variables
  - SSL certificate setup
  
- [ ] **Database migration**
  - Export local data
  - Production schema setup
  - Data validation

#### 11.2 Production Configuration (2h)
- [ ] **Security settings**
  - CORS configuration
  - API rate limiting
  - User permissions
  
- [ ] **Backup strategy**
  - Automated backups
  - Data retention policy
  - Recovery procedures

#### 11.3 Monitoring Setup (1h)
- [ ] **Health checks**
  - Uptime monitoring
  - Performance tracking
  - Error logging

**Checkpoint Dzień 11:**
- ✅ PocketBase live on Railway
- ✅ Production database ready
- ✅ Monitoring configured

### **Dzień 12: Frontend Deployment**

#### 12.1 Dashboard Deployment (2h)
- [ ] **Vercel setup**
  - Build configuration
  - Environment variables
  - Custom domain (optional)
  
- [ ] **Production optimization**
  - Asset compression
  - CDN configuration
  - Caching headers

#### 12.2 Extension Packaging (3h)
- [ ] **Production build**
  - Remove debug code
  - Update API endpoints
  - Version numbering
  
- [ ] **Chrome Extension packaging**
  - .crx file generation
  - Testing on clean Chrome
  - Installation documentation

**Checkpoint Dzień 12:**
- ✅ Dashboard live na Vercel
- ✅ Extension .crx ready
- ✅ End-to-end testing completed

### **Dzień 13: Integration Testing & Documentation**

#### 13.1 Complete Integration Testing (3h)
- [ ] **End-to-end workflows**
  - Extension → PocketBase → Dashboard
  - Data consistency checks
  - Performance validation
  
- [ ] **User acceptance testing**
  - Real Allegro pages testing
  - Various search scenarios
  - Data export validation

#### 13.2 Documentation Creation (3h)
- [ ] **User manual**
  - Installation guide
  - Usage instructions
  - Troubleshooting section
  
- [ ] **Technical documentation**
  - API documentation
  - Deployment guide
  - Maintenance procedures

#### 13.3 Video Tutorials (1h)
- [ ] **Installation video**
  - Step-by-step process
  - Common issues resolution
  - 3-5 minute duration
  
- [ ] **Usage demonstration**
  - Feature walkthrough
  - Best practices
  - Tips and tricks

**Deliverables Faza 3:**
- ✅ Fully deployed production system
- ✅ Extension ready for distribution
- ✅ Complete documentation
- ✅ Video tutorials
- ✅ Monitoring and backup systems

---

## 📱 **FAZA 4: User Testing & Launch** ⏱️ *2-3 dni*

### **Dzień 14: User Testing with Colleague**

#### 14.1 Installation Testing (1h)
- [ ] **Fresh environment setup**
  - Clean Chrome installation
  - Extension installation process
  - Account creation/login
  
- [ ] **Initial configuration**
  - Settings walkthrough
  - First scan execution
  - Data verification

#### 14.2 Real-world Usage Testing (4h)
- [ ] **Daily workflow simulation**
  - Multiple Allegro searches
  - Various product categories
  - Extended usage session
  
- [ ] **Feature validation**
  - Auto-scan functionality
  - Manual scanning
  - Data accuracy verification
  
- [ ] **Dashboard usage**
  - Search and filtering
  - CSV export testing
  - Chart visualization

#### 14.3 Feedback Collection & Issues (2h)
- [ ] **Bug identification**
  - Functional issues
  - Performance problems
  - User experience issues
  
- [ ] **Feature requests**
  - Missing functionality
  - Improvement suggestions
  - Usability feedback

**Checkpoint Dzień 14:**
- ✅ Real user testing completed
- ✅ Bug list identified
- ✅ User feedback collected

### **Dzień 15: Bug Fixes & Optimization**

#### 15.1 Critical Bug Fixes (3h)
- [ ] **Functionality issues**
  - Extension not loading
  - Data sync problems
  - Authentication issues
  
- [ ] **Data accuracy problems**
  - Parsing errors
  - Position calculation bugs
  - Missing products

#### 15.2 Performance Improvements (2h)
- [ ] **Extension optimization**
  - Memory usage reduction
  - Faster scanning
  - Better error handling
  
- [ ] **Dashboard optimization**
  - Loading speed improvements
  - Better user feedback
  - Smoother interactions

#### 15.3 User Experience Improvements (2h)
- [ ] **Interface adjustments**
  - Clearer instructions
  - Better visual feedback
  - Simplified workflows
  
- [ ] **Documentation updates**
  - Based on user feedback
  - Common issues solutions
  - Enhanced tutorials

**Checkpoint Dzień 15:**
- ✅ All critical bugs fixed
- ✅ Performance optimized
- ✅ User experience improved

### **Dzień 16: Final Deployment & Launch**

#### 16.1 Production Release (2h)
- [ ] **Final version deployment**
  - Updated extension (.crx v1.1)
  - Dashboard updates
  - Backend configuration
  
- [ ] **Release testing**
  - Production environment validation
  - All features working
  - Performance benchmarks met

#### 16.2 Launch Preparation (2h)
- [ ] **Distribution package**
  - Extension .crx file
  - Installation instructions
  - User credentials
  
- [ ] **Support materials**
  - Quick start guide
  - Video tutorials
  - Contact information

#### 16.3 Go-Live & Monitoring (1h)
- [ ] **Colleague onboarding**
  - Final installation assistance
  - Training session
  - Support contact setup
  
- [ ] **Monitoring activation**
  - Error tracking
  - Performance monitoring
  - User activity tracking

**Deliverables Faza 4:**
- ✅ Production-ready system
- ✅ Tested by real user
- ✅ All major bugs resolved
- ✅ Complete support materials
- ✅ Successful launch

---

## 📋 Development Checklist

### **Pre-Development Setup**
- [ ] Cursor IDE configured
- [ ] Git repository created
- [ ] PocketBase local instance running
- [ ] Chrome Developer Mode enabled
- [ ] Project folder structure created

### **Development Standards**
- [ ] Code comments in Polish for business logic
- [ ] Consistent naming conventions
- [ ] Error handling for all API calls
- [ ] Loading states for all async operations
- [ ] Responsive design for dashboard
- [ ] Cross-browser compatibility testing

### **Quality Assurance**
- [ ] Manual testing on real Allegro pages
- [ ] Performance testing (memory, CPU)
- [ ] Security testing (data isolation)
- [ ] User experience testing
- [ ] Documentation completeness

### **Deployment Readiness**
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Backup systems operational
- [ ] Monitoring systems active
- [ ] Support documentation complete

---

## 🎯 Success Metrics

### **Technical KPIs**
- **Extension Performance:** <100MB memory usage
- **Parsing Accuracy:** >95% success rate
- **Data Sync:** <5 second latency
- **Dashboard Load:** <3 second initial load
- **Uptime:** >99.5% availability

### **User Experience KPIs**
- **Installation Time:** <10 minutes complete setup
- **Learning Curve:** User productive within 30 minutes
- **Daily Usage:** Multiple scans per day
- **Data Export:** Weekly CSV exports
- **User Satisfaction:** Positive feedback on core features

### **Business KPIs**
- **Cost Efficiency:** <$5/month operational costs
- **Maintenance:** <2 hours/month required
- **Scalability:** Support for 10+ users without modification
- **Reliability:** Zero data loss incidents

---

## ⚠️ Risk Mitigation Plan

### **High-Risk Items**
1. **Allegro Structure Changes**
   - **Mitigation:** Multiple parsing strategies, fallback selectors
   - **Monitoring:** Weekly structure validation
   - **Response:** 24-48 hour fix timeline

2. **Chrome Extension API Changes**
   - **Mitigation:** Use stable Manifest V3 APIs only
   - **Monitoring:** Chrome developer blog subscription
   - **Response:** Proactive updates before deprecation

3. **PocketBase/Railway Issues**
   - **Mitigation:** Database backups, alternative hosting ready
   - **Monitoring:** Uptime monitoring, health checks
   - **Response:** Switch to Fly.io within 4 hours

### **Medium-Risk Items**
1. **User Installation Difficulties**
   - **Mitigation:** Detailed video guides, support contact
   - **Response:** Remote assistance capability

2. **Performance Issues**
   - **Mitigation:** Progressive optimization, monitoring
   - **Response:** Performance profiling and optimization

3. **Data Accuracy Problems**
   - **Mitigation:** Multiple validation layers, user reporting
   - **Response:** Rapid parsing algorithm updates

---

## 📞 Support & Maintenance Plan

### **Ongoing Maintenance (Post-Launch)**
- **Monthly:** Allegro structure validation check
- **Quarterly:** Performance optimization review
- **Bi-annually:** Security audit and updates
- **As-needed:** Feature requests and bug fixes

### **User Support**
- **Primary:** Email support (response within 24h)
- **Secondary:** Video call assistance for complex issues
- **Documentation:** Searchable FAQ and troubleshooting guide

### **Future Development Pipeline**
1. **Phase 5:** Multi-marketplace support (OLX, Amazon)
2. **Phase 6:** Mobile companion app
3. **Phase 7:** Team collaboration features
4. **Phase 8:** Advanced analytics and reporting

---

**Plan Version:** 1.0  
**Total Estimated Time:** 16 days  
**Confidence Level:** High (85%)  
**Last Updated:** June 14, 2025