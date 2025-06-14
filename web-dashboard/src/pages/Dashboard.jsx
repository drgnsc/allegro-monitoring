import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react'

// Mock data for demonstration
const mockStats = {
  totalProducts: 147,
  averagePosition: 18.5,
  topPositions: 23,
  lastScan: '2024-06-14T20:30:00Z'
}

const mockRecentPositions = [
  { id: 1, product: 'Wosk ceramiczny Ceramikker Ceramic Wax 250 ml', keyword: 'wosk ceramiczny', position: 3, change: +2, date: '2024-06-14' },
  { id: 2, product: 'Pasta do polerowania karoserii', keyword: 'pasta polerująca', position: 7, change: -1, date: '2024-06-14' },
  { id: 3, product: 'Mikrofibrowy ręcznik do auta', keyword: 'ręcznik mikrofibrowy', position: 12, change: 0, date: '2024-06-14' },
  { id: 4, product: 'Płyn do mycia szyb samochodowych', keyword: 'płyn do szyb', position: 5, change: +3, date: '2024-06-14' },
  { id: 5, product: 'Szczotka do felg aluminiowych', keyword: 'szczotka felgi', position: 19, change: -4, date: '2024-06-14' }
]

function Dashboard() {
  const [stats, setStats] = useState(mockStats)
  const [recentPositions, setRecentPositions] = useState(mockRecentPositions)

  const getPositionBadgeClass = (position) => {
    if (position <= 10) return 'position-top10'
    if (position <= 50) return 'position-top50'
    return 'position-low'
  }

  const getTrendIcon = (change) => {
    if (change > 0) return <TrendingUp size={16} style={{ color: '#28a745' }} />
    if (change < 0) return <TrendingDown size={16} style={{ color: '#dc3545' }} />
    return <span style={{ color: '#6c757d' }}>-</span>
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL')
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('pl-PL')
  }

  return (
    <div className="dashboard">
      <div className="container">
        <h1 style={{ color: 'white', marginBottom: '30px', textAlign: 'center' }}>
          Dashboard Monitoringu Pozycji
        </h1>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="card stat-card">
            <div className="stat-value">{stats.totalProducts}</div>
            <div className="stat-label">Monitorowanych Produktów</div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-value">{stats.averagePosition}</div>
            <div className="stat-label">Średnia Pozycja</div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-value">{stats.topPositions}</div>
            <div className="stat-label">Pozycje Top 10</div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-value">
              <Calendar size={32} style={{ color: '#667eea' }} />
            </div>
            <div className="stat-label">
              Ostatni skan: {formatTime(stats.lastScan)}
            </div>
          </div>
        </div>

        {/* Recent Positions */}
        <div className="card">
          <h2 style={{ marginBottom: '20px', color: '#333' }}>
            <Target size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
            Najnowsze Pozycje
          </h2>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Słowo Kluczowe</th>
                  <th>Pozycja</th>
                  <th>Zmiana</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {recentPositions.map((item) => (
                  <tr key={item.id}>
                    <td style={{ maxWidth: '300px' }}>
                      <div style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {item.product}
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        background: 'rgba(102, 126, 234, 0.1)', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                      }}>
                        {item.keyword}
                      </span>
                    </td>
                    <td>
                      <span className={`position-badge ${getPositionBadgeClass(item.position)}`}>
                        #{item.position}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {getTrendIcon(item.change)}
                        {item.change !== 0 && Math.abs(item.change)}
                      </div>
                    </td>
                    <td>{formatDate(item.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-2" style={{ marginTop: '30px' }}>
          <div className="card text-center">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Szybkie Akcje</h3>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn">Nowy Skan</button>
              <button className="btn btn-secondary">Eksport Danych</button>
            </div>
          </div>
          
          <div className="card text-center">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Status Systemu</h3>
            <div style={{ color: '#28a745', fontWeight: '600' }}>
              ✅ Wszystko działa poprawnie
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
              Ostatnie sprawdzenie: {formatTime(stats.lastScan)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 