import { useState, useEffect } from 'react'
import './styles/App.css'
import LoginPage from './pages/LoginPage'
import ProjectPage from './pages/ProjectPage'
import ProjectsManagement from './pages/ProjectsManagement'
import ReportsPage from './pages/ReportsPage'
import LatestResultsPage from './pages/LatestResultsPage'
import ChangesPage from './pages/ChangesPage'
import MonthlyReportPage from './pages/MonthlyReportPage'
import { clearAllCache } from './utils/cache'
import { Coffee, Heart, X, Download, Chrome } from 'lucide-react'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('projects-management')
  const [showCoffeeModal, setShowCoffeeModal] = useState(false)
  // Automatyczne przełączanie między dev i prod
  const [pocketbaseUrl] = useState(
    window.location.hostname === 'localhost' 
      ? 'http://127.0.0.1:8090'  // Development - lokalny PocketBase
      : 'https://api.pricelss.pl'  // Production - produkcyjne API
  )

  useEffect(() => {
    // Sprawdź czy użytkownik jest zalogowany
    const savedUser = localStorage.getItem('pb_auth')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsLoggedIn(true)
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        localStorage.removeItem('pb_auth')
      }
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsLoggedIn(true)
    localStorage.setItem('pb_auth', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    setIsLoggedIn(false)
    localStorage.removeItem('pb_auth')
    setActiveTab('projects-management')
    
    // Wyczyść cache przy wylogowaniu
    clearAllCache()
  }

  const CoffeeModal = () => (
    <div className="coffee-modal-overlay" onClick={() => setShowCoffeeModal(false)}>
      <div className="coffee-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="coffee-modal-close"
          onClick={() => setShowCoffeeModal(false)}
        >
          <X size={20} />
        </button>
        
        <div className="coffee-content">
          <div className="coffee-header">
            <Coffee size={32} className="coffee-icon" />
            <h3>☕ Kup mi kawę</h3>
          </div>
          
          <div className="coffee-text">
            <p>Ten projekt powstawał przez kilka tygodni czerwca 2025, w weekendy i po godzinach pracy. Oprócz wolnego czasu kosztował mnie sporo nerwów, niezliczonych testów i frustracji, kiedy jedna poprawka kodu psuła aplikację w kilku różnych miejscach, a kolejne próby naprawy wywoływały kryzysy małżeńskie i gniew żony.</p>
            
            <p>Ten panel możesz uruchamiać dlatego, że co miesiąc opłacam hosting, na którym utrzymuję pliki, oraz narzędzia potrzebne do vibe codingu. To pierwsza wersja, która pewnie będzie wymagać wielu poprawek. Nie gwarantuję, że będzie działać zawsze i o każdej porze. Ale u mnie działało - przynajmniej na testowym przypadku.</p>
            
            <p>Pamiętaj, że dopiero się uczę i nie jestem programistą. Ale może w przyszłości dodam więcej funkcji i wyjdzie z tego coś większego? Who knows, no chciałbym!</p>
            
            <hr />
            
            <p><strong>Jeśli doceniasz mój wysiłek, apka pomaga Ci w pracy i chcesz się odwdzięczyć, postaw mi wirtualną kawę</strong> ☕ Da mi to motywację do dalszych działań i kolejnej niedospanej nocy :)</p>
            
            <p style={{ 
              textAlign: 'center', 
              fontSize: '1.2rem', 
              fontWeight: '600', 
              color: '#4CAF50',
              marginBottom: '10px',
              marginTop: '20px'
            }}>
              Dzięki! 😊
            </p>
            
            <p className="coffee-signature" style={{ 
              textAlign: 'center', 
              fontStyle: 'italic', 
              color: '#666', 
              marginBottom: '25px',
              marginTop: '5px',
              fontSize: '1rem'
            }}>
              <em>M. O.</em>
            </p>
            
            <div className="coffee-actions">
              <a 
                href="https://buycoffee.to/drgnsc" 
                target="_blank" 
                rel="noopener noreferrer"
                className="coffee-btn primary"
              >
                ☕ Postaw mi kawę
              </a>
              
              <a 
                href="https://forms.gle/2DNRh7stQoUK1x5g9" 
                target="_blank" 
                rel="noopener noreferrer"
                className="coffee-btn secondary"
              >
                💡 Mam pomysł/błąd
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} pocketbaseUrl={pocketbaseUrl} />
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'project':
        return <ProjectPage user={user} pocketbaseUrl={pocketbaseUrl} />
      case 'projects-management':
        return <ProjectsManagement user={user} pocketbaseUrl={pocketbaseUrl} />
      case 'reports':
        return <ReportsPage user={user} pocketbaseUrl={pocketbaseUrl} />
      case 'latest':
        return <LatestResultsPage user={user} pocketbaseUrl={pocketbaseUrl} />
      case 'changes':
        return <ChangesPage user={user} pocketbaseUrl={pocketbaseUrl} />
      case 'monthly-report':
        return <MonthlyReportPage user={user} pocketbaseUrl={pocketbaseUrl} />
      default:
        return <ProjectsManagement user={user} pocketbaseUrl={pocketbaseUrl} />
    }
  }

  return (
    <>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1>🎯 Allegro Position Monitor</h1>
            <div className="user-info">
              <span>Zalogowany: {user?.email}</span>
                              <a 
                  href="https://pricelss.pl/pliki/wtyczka.zip"
                  className="download-extension-btn"
                  title="Pobierz wtyczkę Chrome"
                  download
                >
                  <Chrome size={16} />
                  <Download size={14} className="download-icon" />
                  <span className="btn-text">Wtyczka</span>
                </a>
                
                <button 
                  className="coffee-support-btn"
                  onClick={() => setShowCoffeeModal(true)}
                  title="Wspieraj projekt"
                >
                  <Coffee size={16} />
                  <Heart size={14} className="heart-icon" />
                </button>
                <button onClick={handleLogout} className="logout-btn">Wyloguj</button>
            </div>
          </div>
          
          <nav className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'projects-management' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects-management')}
            >
              📁 Projekty
            </button>
            <button 
              className={`tab-btn ${activeTab === 'project' ? 'active' : ''}`}
              onClick={() => setActiveTab('project')}
            >
              📋 Słowa kluczowe
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              📊 Raporty
            </button>
            <button 
              className={`tab-btn ${activeTab === 'latest' ? 'active' : ''}`}
              onClick={() => setActiveTab('latest')}
            >
              ⏰ Ostatnie wyniki
            </button>
            <button 
              className={`tab-btn ${activeTab === 'changes' ? 'active' : ''}`}
              onClick={() => setActiveTab('changes')}
            >
              🔄 Zmiany
            </button>
            <button 
              className={`tab-btn ${activeTab === 'monthly-report' ? 'active' : ''}`}
              onClick={() => setActiveTab('monthly-report')}
            >
              📅 Raport miesięczny
            </button>
          </nav>
        </header>

        <main className="app-main">
          {renderActiveTab()}
        </main>
      </div>
      
      {showCoffeeModal && <CoffeeModal />}
    </>
  )
}

export default App 