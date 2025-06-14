import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, Target, TrendingUp, Settings } from 'lucide-react'

function Navbar() {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <Target size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
            Allegro Monitor
          </Link>
          
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
        </div>
      </div>
    </nav>
  )
}

export default Navbar 