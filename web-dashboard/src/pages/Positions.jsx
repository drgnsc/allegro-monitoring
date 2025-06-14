import React, { useState } from 'react'
import { Search, Filter, Download, Eye } from 'lucide-react'

// Mock data
const mockPositions = [
  { id: 1, product: 'Wosk ceramiczny Ceramikker Ceramic Wax 250 ml', keyword: 'wosk ceramiczny', position: 3, previousPosition: 5, url: 'https://allegro.pl/oferta/123', lastChecked: '2024-06-14T20:30:00Z' },
  { id: 2, product: 'Pasta do polerowania karoserii premium', keyword: 'pasta polerująca', position: 7, previousPosition: 6, url: 'https://allegro.pl/oferta/124', lastChecked: '2024-06-14T20:25:00Z' },
  { id: 3, product: 'Mikrofibrowy ręcznik do auta 40x60cm', keyword: 'ręcznik mikrofibrowy', position: 12, previousPosition: 12, url: 'https://allegro.pl/oferta/125', lastChecked: '2024-06-14T20:20:00Z' },
  { id: 4, product: 'Płyn do mycia szyb samochodowych 5L', keyword: 'płyn do szyb', position: 5, previousPosition: 8, url: 'https://allegro.pl/oferta/126', lastChecked: '2024-06-14T20:15:00Z' },
  { id: 5, product: 'Szczotka do felg aluminiowych soft', keyword: 'szczotka felgi', position: 19, previousPosition: 15, url: 'https://allegro.pl/oferta/127', lastChecked: '2024-06-14T20:10:00Z' },
  { id: 6, product: 'Wosk w sprayu do lakieru', keyword: 'wosk spray', position: 24, previousPosition: 22, url: 'https://allegro.pl/oferta/128', lastChecked: '2024-06-14T20:05:00Z' },
  { id: 7, product: 'Szampon samochodowy pH neutralny', keyword: 'szampon samochodowy', position: 8, previousPosition: 9, url: 'https://allegro.pl/oferta/129', lastChecked: '2024-06-14T20:00:00Z' },
  { id: 8, product: 'Gąbka do mycia samochodu', keyword: 'gąbka samochodowa', position: 15, previousPosition: 18, url: 'https://allegro.pl/oferta/130', lastChecked: '2024-06-14T19:55:00Z' }
]

function Positions() {
  const [positions, setPositions] = useState(mockPositions)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPosition, setFilterPosition] = useState('all')

  const getPositionBadgeClass = (position) => {
    if (position <= 10) return 'position-top10'
    if (position <= 50) return 'position-top50'
    return 'position-low'
  }

  const getPositionChange = (current, previous) => {
    const change = previous - current // Positive means improvement (lower position number)
    if (change > 0) return { change: `+${change}`, class: 'text-success', arrow: '↗️' }
    if (change < 0) return { change: change.toString(), class: 'text-danger', arrow: '↘️' }
    return { change: '0', class: 'text-muted', arrow: '➖' }
  }

  const filteredPositions = positions.filter(item => {
    const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.keyword.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterPosition === 'all' || 
                         (filterPosition === 'top10' && item.position <= 10) ||
                         (filterPosition === 'top50' && item.position <= 50 && item.position > 10) ||
                         (filterPosition === 'low' && item.position > 50)
    
    return matchesSearch && matchesFilter
  })

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('pl-PL')
  }

  return (
    <div className="positions">
      <div className="container">
        <h1 style={{ color: 'white', marginBottom: '30px', textAlign: 'center' }}>
          Monitoring Pozycji Produktów
        </h1>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={20} style={{ 
                  position: 'absolute', 
                  left: '10px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#666'
                }} />
                <input
                  type="text"
                  placeholder="Szukaj produktu lub słowa kluczowego..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            
            <div>
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                style={{
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minWidth: '150px'
                }}
              >
                <option value="all">Wszystkie pozycje</option>
                <option value="top10">Top 10</option>
                <option value="top50">Pozycje 11-50</option>
                <option value="low">Poniżej 50</option>
              </select>
            </div>
            
            <button className="btn">
              <Download size={16} style={{ marginRight: '5px' }} />
              Eksport
            </button>
          </div>
        </div>

        {/* Positions Table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#333', margin: 0 }}>
              Wszystkie Pozycje ({filteredPositions.length})
            </h2>
            <button className="btn btn-secondary">
              <Filter size={16} style={{ marginRight: '5px' }} />
              Więcej filtrów
            </button>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Słowo Kluczowe</th>
                  <th>Aktualna Pozycja</th>
                  <th>Zmiana</th>
                  <th>Ostatnie Sprawdzenie</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filteredPositions.map((item) => {
                  const change = getPositionChange(item.position, item.previousPosition)
                  return (
                    <tr key={item.id}>
                      <td style={{ maxWidth: '250px' }}>
                        <div style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          fontWeight: '500'
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
                          <span>{change.arrow}</span>
                          <span className={change.class} style={{ fontWeight: '600' }}>
                            {change.change !== '0' ? change.change : '-'}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.9rem', color: '#666' }}>
                        {formatTime(item.lastChecked)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                            onClick={() => window.open(item.url, '_blank')}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {filteredPositions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>Nie znaleziono produktów spełniających kryteria wyszukiwania.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Positions 