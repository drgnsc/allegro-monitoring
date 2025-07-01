import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, Target, TrendingUp, Settings, Coffee, Heart, X, Download, Chrome } from 'lucide-react'

function Navbar() {
  const location = useLocation()
  const [showCoffeeModal, setShowCoffeeModal] = useState(false)

  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
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
            
            <p className="coffee-signature"><em>M. O.</em></p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <nav className="navbar">
        <div className="container">
          <div className="nav-container">
            <Link to="/" className="nav-brand">
              <Target size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
              Allegro Monitor
            </Link>
            
            <div className="nav-content">
              <ul className="nav-links">
                <li>
                  <Link to="/" className={isActive('/')}>
                    <BarChart3 size={18} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/positions" className={isActive('/positions')}>
                    <Target size={18} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                    Pozycje
                  </Link>
                </li>
                <li>
                  <Link to="/analytics" className={isActive('/analytics')}>
                    <TrendingUp size={18} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                    Analityka
                  </Link>
                </li>
                <li>
                  <Link to="/settings" className={isActive('/settings')}>
                    <Settings size={18} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                    Ustawienia
                  </Link>
                </li>
              </ul>
              
              <div className="nav-actions">
                <a 
                  href="http://pricelss.pl/pliki/wtyczka.zip"
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
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {showCoffeeModal && <CoffeeModal />}
    </>
  )
}

export default Navbar 