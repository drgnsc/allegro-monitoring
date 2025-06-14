# Product Requirements Document (PRD)
## Allegro Position Monitoring Extension

### 1. Product Overview

**Product Name:** Allegro Position Monitor  
**Version:** 1.0  
**Target Users:** E-commerce sellers monitoring product positions on Allegro.pl  
**Development Timeline:** 2-3 weeks  
**Platform:** Chrome Extension + Web Dashboard  

### 2. Problem Statement

Current Allegro position monitoring tools either:
- Don't provide exact positioning data needed
- Are expensive for occasional use
- Get blocked by Allegro's anti-bot measures
- Lack flexibility in data export and analysis

### 3. Solution Overview

A Chrome extension that captures product positioning data during natural browsing of Allegro listings, combined with a web dashboard for data analysis and CSV export.

### 4. Core Features

#### 4.1 Chrome Extension
- **Auto-detection:** Automatically recognizes Allegro listing pages
- **Manual trigger:** "Scan positions" button for on-demand capture
- **Data extraction:** Product titles, positions, seller names from listings
- **Background sync:** Sends data to cloud database
- **User authentication:** PocketBase authentication integration

#### 4.2 Web Dashboard
- **Position search:** Find specific product positions by name and date
- **Historical view:** Timeline of position changes
- **CSV export:** Flexible date range exports with trend analysis
- **User management:** Multi-user support with data isolation

#### 4.3 Database & Backend
- **Cloud storage:** PocketBase for real-time data
- **Data structure:** Optimized for date-range queries
- **User isolation:** Each user sees only their data
- **API endpoints:** RESTful interface for extension and dashboard

### 5. Technical Architecture

#### 5.1 Technology Stack
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Extension:** Chrome Extension Manifest V3
- **Backend:** PocketBase (SQLite + REST API)
- **Hosting:** Railway.app (backend) + Vercel (dashboard)
- **Development:** Cursor IDE

#### 5.2 Data Structure
```json
{
  "id": "unique_scan_id",
  "userId": "pocketbase_user_id",
  "url": "https://allegro.pl/listing?string=search_term",
  "keyword": "extracted_search_term",
  "timestamp": "2025-06-14T14:30:00Z",
  "date": "2025-06-14",
  "products": [
    {
      "position": 1,
      "title": "Product Title",
      "seller": "Seller Name",
      "sponsored": false,
      "price": "99.99 zł"
    }
  ]
}
```

### 6. User Experience Flow

#### 6.1 Installation & Setup
1. User downloads extension package (.crx or unpacked folder)
2. Installs via Chrome Developer Mode
3. Signs in with email/password on first use
4. Extension icon appears in Chrome toolbar

#### 6.2 Data Collection
1. User browses Allegro listings naturally
2. Extension auto-detects listing pages
3. Optional: User clicks "Scan Now" button for immediate capture
4. Data automatically syncs to PocketBase database
5. Visual confirmation of successful capture

#### 6.3 Data Analysis
1. User opens web dashboard
2. Searches for specific product by name
3. Views position history timeline
4. Exports data to CSV for external analysis

### 7. Feature Specifications

#### 7.1 Extension Features
| Feature | Description | Priority |
|---------|-------------|----------|
| Auto page detection | Detect Allegro listing URLs | High |
| Product parsing | Extract titles, positions, sellers | High |
| Manual scan button | On-demand position capture | High |
| User authentication | Login with PocketBase | High |
| Background sync | Upload data to PocketBase | High |
| Visual feedback | Success/error notifications | Medium |
| Settings panel | Configure auto-scan behavior | Low |

#### 7.2 Dashboard Features
| Feature | Description | Priority |
|---------|-------------|----------|
| Product search | Find positions by product name | High |
| Date filtering | Filter by date range | High |
| CSV export | Export with multiple date columns | High |
| Position timeline | Visual history chart | Medium |
| Trend indicators | Show position changes | Medium |
| Batch operations | Export multiple products | Low |

#### 7.3 CSV Export Specifications
**Columns:**
- Column 1: Keyword/Search term
- Column 2: URL
- Column 3+: Date columns (one per selected date)
- Optional: Trend column (↗️↘️→)
- Optional: Change column (+3, -2, etc.)

**Export Options:**
- Date range selector
- Include/exclude sponsored results
- Show only found positions (exclude -1)
- Show only positions with changes

### 8. Installation Guide

#### 8.1 For Administrator (Developer)
1. Download extension source code
2. Open Chrome → More tools → Extensions
3. Enable "Developer mode"
4. Click "Load unpacked" → select extension folder
5. Extension appears in toolbar

#### 8.2 For End User (Colleague)
1. Receive .crx file or folder
2. Follow installation video guide (2-3 minutes)
3. Sign in with provided credentials
4. Start browsing Allegro listings

#### 8.3 Dashboard Access
1. Visit dashboard URL (provided after deployment)
2. Sign in with same credentials as extension
3. Access personal data and export features

### 9. Security & Privacy

#### 9.1 Data Security
- All data encrypted in transit (HTTPS)
- PocketBase authentication and authorization
- No sensitive personal information stored
- User can delete all data at any time

#### 9.2 Privacy Compliance
- Only captures public Allegro listing data
- No tracking of user browsing outside Allegro
- Clear data retention policy (configurable)
- User consent for data collection

### 10. Success Metrics

#### 10.1 Technical Metrics
- Extension successfully captures 95%+ of Allegro listings
- Data sync latency < 5 seconds
- Dashboard load time < 3 seconds
- Zero data loss incidents

#### 10.2 User Metrics
- User completes setup within 10 minutes
- Daily active usage of extension
- CSV exports generated weekly
- User retention after 30 days

### 11. Development Phases

#### Phase 1: Core Extension (Week 1)
- Chrome extension with basic page detection
- Product parsing functionality
- PocketBase integration for data storage
- Basic user authentication

#### Phase 2: Dashboard (Week 2)
- Web dashboard for data viewing
- Search and filter functionality
- Basic CSV export
- User interface polish

#### Phase 3: Advanced Features (Week 3)
- Enhanced CSV export with trends
- Timeline visualization
- Error handling and edge cases
- Installation documentation

### 12. Risk Assessment

#### 12.1 Technical Risks
| Risk | Impact | Mitigation |
|------|---------|------------|
| Allegro HTML structure changes | High | Robust parsing with fallbacks |
| Chrome Extension API changes | Medium | Use stable Manifest V3 APIs |
| PocketBase hosting issues | Low | Railway.app reliability + backup plans |

#### 12.2 User Risks
| Risk | Impact | Mitigation |
|------|---------|------------|
| Installation difficulty | Medium | Detailed video guide |
| Data loss | High | Regular backups, export features |
| Performance impact | Low | Optimized background processing |

### 13. Post-Launch Support

#### 13.1 Maintenance Plan
- Monthly check for Allegro structure changes
- User feedback collection and implementation
- Performance monitoring and optimization
- Feature requests evaluation

#### 13.2 User Support
- Installation video guide
- Written documentation
- Email support for issues
- Feature request channel

### 14. MVP Features (Phase 1)

**Must Have:**
- Chrome extension auto-detects Allegro listings
- Parse product titles and positions
- Save to PocketBase database
- Basic dashboard with search
- Simple CSV export

**Nice to Have:**
- Trend analysis
- Advanced filtering
- Timeline charts
- Batch operations

### 15. Future Enhancements

- **Multi-marketplace support:** OLX, Amazon, eBay
- **Mobile app:** React Native companion
- **Analytics dashboard:** Advanced metrics
- **API access:** For third-party integrations
- **Team collaboration:** Share data between users
- **Automated alerts:** Position change notifications

---

**Document Version:** 1.0  
**Last Updated:** June 14, 2025  
**Next Review:** July 1, 2025  
**Project Repository:** TBD  
**Contact:** marcin@example.com