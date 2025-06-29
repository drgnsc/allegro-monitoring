import { useState, useEffect } from 'react'
import './styles/App.css'
import LoginPage from './pages/LoginPage'
import ProjectPage from './pages/ProjectPage'
import ReportsPage from './pages/ReportsPage'
import LatestResultsPage from './pages/LatestResultsPage'
import ChangesPage from './pages/ChangesPage'
import { clearAllCache } from './utils/cache'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('project')
  const [pocketbaseUrl] = useState('http://localhost:8090') // Zmienić na produkcyjny URL

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
    setActiveTab('project')
    
    // Wyczyść cache przy wylogowaniu
    clearAllCache()
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} pocketbaseUrl={pocketbaseUrl} />
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'project':
        return <ProjectPage user={user} pocketbaseUrl={pocketbaseUrl} />
      case 'reports':
        return <ReportsPage user={user} pocketbaseUrl={pocketbaseUrl} />
      case 'latest':
        return <LatestResultsPage user={user} pocketbaseUrl={pocketbaseUrl} />
      case 'changes':
        return <ChangesPage user={user} pocketbaseUrl={pocketbaseUrl} />
      default:
        return <ProjectPage user={user} pocketbaseUrl={pocketbaseUrl} />
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🎯 Allegro Position Monitor</h1>
          <div className="user-info">
            <span>Zalogowany: {user?.email}</span>
            <button onClick={handleLogout} className="logout-btn">Wyloguj</button>
          </div>
        </div>
        
        <nav className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'project' ? 'active' : ''}`}
            onClick={() => setActiveTab('project')}
          >
            📋 Projekt
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
        </nav>
      </header>

      <main className="app-main">
        {renderActiveTab()}
      </main>
    </div>
  )
}

export default App 