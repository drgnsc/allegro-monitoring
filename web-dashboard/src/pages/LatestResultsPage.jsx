import { useState, useEffect } from 'react'
import '../styles/LatestResultsPage.css'
import cache, { cachedApiCall } from '../utils/cache'

const LatestResultsPage = ({ user, pocketbaseUrl }) => {
  const [results, setResults] = useState([])
  const [availableDates, setAvailableDates] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedKeyword, setSelectedKeyword] = useState(null)
  const [detailedResults, setDetailedResults] = useState([])

  useEffect(() => {
    loadAvailableDates()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      loadResultsForDate(selectedDate)
    }
  }, [selectedDate])

  const loadAvailableDates = async () => {
    try {
      const data = await cachedApiCall(
        `${pocketbaseUrl}/api/collections/positions/records?filter=userId="${user.id}"&sort=-date&fields=date`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
          userId: user.id
        },
        10 * 60 * 1000 // 10 minut TTL - daty zmieniają się bardzo rzadko
      )
      
      const uniqueDates = [...new Set(data.items.map(item => item.date.split('T')[0]))]
      setAvailableDates(uniqueDates)
      
      // Automatycznie wybierz najnowszą datę
      if (uniqueDates.length > 0) {
        setSelectedDate(uniqueDates[0])
      }
    } catch (error) {
      console.error('Error loading dates:', error)
    }
  }

  const loadResultsForDate = async (date) => {
    setLoading(true)
    try {
      const data = await cachedApiCall(
        `${pocketbaseUrl}/api/collections/positions/records?filter=userId="${user.id}"&&date~"${date}"&sort=-timestamp`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
          userId: user.id
        },
        5 * 60 * 1000 // 5 minut TTL - wyniki dla konkretnej daty
      )
      
      // Grupuj wyniki po słowach kluczowych
      const groupedResults = {}
      data.items.forEach(item => {
        if (!groupedResults[item.keyword]) {
          groupedResults[item.keyword] = {
            keyword: item.keyword,
            date: item.date,
            timestamp: item.timestamp,
            productCount: 0,
            url: item.url
          }
        }
        
        if (item.products && Array.isArray(item.products)) {
          groupedResults[item.keyword].productCount += item.products.length
        }
      })
      
      setResults(Object.values(groupedResults))
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  const showDetailedResults = async (keyword) => {
    try {
      const apiUrl = `${pocketbaseUrl}/api/collections/positions/records?filter=userId="${user.id}"&&keyword="${keyword}"&&date~"${selectedDate}"`
      


      const data = await cachedApiCall(
        apiUrl,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
          userId: user.id
        },
        10 * 60 * 1000 // 10 minut TTL - szczegółowe wyniki rzadko się zmieniają
      )
      
      if (data.items.length > 0) {
        // Znajdź najnowszy rekord (najnowszy timestamp)
        const sortedItems = data.items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        const latestItem = sortedItems[0]
        
        const products = latestItem.products || []

        
        setDetailedResults(products)
        setSelectedKeyword(keyword)
      }
    } catch (error) {
      console.error('Error loading detailed results:', error)
    }
  }

  const exportToCsv = () => {
    if (detailedResults.length === 0) return

    const headers = Object.keys(detailedResults[0])
    const csvContent = [
      headers.join(','),
      ...detailedResults.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedKeyword}_${selectedDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const forceRefresh = () => {
    cache.clear()
    if (selectedDate) {
      loadResultsForDate(selectedDate)
    }
  }

  const forceRefreshDetailed = (keyword) => {
    const cacheKey = cache.generateKey(
      `${pocketbaseUrl}/api/collections/positions/records?filter=userId="${user.id}"&&keyword="${keyword}"&&date~"${selectedDate}"`,
      {
        method: 'GET',
        userId: user.id
      }
    )
    cache.delete(cacheKey)
    showDetailedResults(keyword)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="latest-results-page">
      <div className="page-header">
        <h2>⏰ Ostatnie wyniki</h2>
        <p>Przeglądaj wyniki monitoringu według dat</p>
      </div>

      {/* Wybór daty */}
      <div className="date-selector">
        <label htmlFor="date-select">📅 Wybierz datę do analizy:</label>
        <select
          id="date-select"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          disabled={availableDates.length === 0}
        >
          <option value="">Wybierz datę...</option>
          {availableDates.map(date => (
            <option key={date} value={date}>
              {formatDate(date)}
            </option>
          ))}
        </select>
        {selectedDate && (
          <button onClick={forceRefresh} style={{marginLeft: '10px', padding: '5px 10px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
            🔄 Odśwież bez cache
          </button>
        )}
      </div>


      {/* Wyniki dla wybranej daty */}
      {selectedDate && (
        <div className="results-section">
          <h3>📊 Wyniki dla dnia: {formatDate(selectedDate)}</h3>
          
          {loading ? (
            <div className="loading">Ładowanie wyników...</div>
          ) : results.length === 0 ? (
            <div className="empty-state">
              <p>Brak wyników dla wybranej daty</p>
            </div>
          ) : (
            <div className="results-table">
              <div className="table-header">
                <div>Słowo kluczowe</div>
                <div>Liczba produktów</div>
                <div>Czas sprawdzenia</div>
                <div>Akcje</div>
              </div>
              
              {results.map((result, index) => (
                <div key={index} className="table-row">
                  <div className="keyword-cell">
                    <strong>{result.keyword}</strong>
                  </div>
                  <div className="count-cell">
                    {result.productCount} produktów
                  </div>
                  <div className="time-cell">
                    {new Date(result.timestamp).toLocaleTimeString('pl-PL')}
                  </div>
                  <div className="actions-cell">
                    <button
                      onClick={() => showDetailedResults(result.keyword)}
                      className="details-btn"
                    >
                      Zobacz pełne wyniki
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal z szczegółowymi wynikami */}
      {selectedKeyword && (
        <div className="modal-overlay" onClick={() => setSelectedKeyword(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Szczegółowe wyniki dla: {selectedKeyword}</h3>
              <div className="modal-actions">
                <button onClick={() => forceRefreshDetailed(selectedKeyword)} style={{marginRight: '10px', padding: '5px 10px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
                  🔄 Odśwież
                </button>
                <button onClick={exportToCsv} className="export-csv-btn">
                  💾 Eksport CSV
                </button>
                <button onClick={() => setSelectedKeyword(null)} className="close-btn">
                  ✕
                </button>
              </div>
            </div>
            
            <div className="modal-body">
              {detailedResults.length === 0 ? (
                <div className="empty-products">
                  <p>🚫 Brak produktów dla tego słowa kluczowego</p>
                  <p>Sprawdź czy Chrome Extension faktycznie znalazł produkty dla tego zapytania.</p>
                </div>
              ) : (
                <div className="products-table">
                  <div className="table-header">
                    <div>Pozycja</div>
                    <div>Nazwa produktu</div>
                    <div>Cena</div>
                    <div>Rating & Sponsor</div>
                    <div>URL</div>
                  </div>
                  
                  <div style={{padding: '10px', backgroundColor: '#f7fafc', marginBottom: '10px', fontSize: '0.85rem'}}>
                    📋 <strong>Znaleziono {detailedResults.length} produktów</strong> dla słowa kluczowego: <code>{selectedKeyword}</code>
                  </div>
                  
                  {detailedResults.map((product, index) => {
                    // Funkcja pomocnicza do znalezienia ceny w różnych polach
                    const findPrice = (prod) => {
                      return prod.price || prod.Price || prod.PRICE || prod.cena || prod.Cena || null
                    }
                    
                    // Pobranie ratingu i informacji o sponsorowaniu
                    const rating = product.rating || null
                    const isSponsored = product.sponsored || false
                    
                    const price = findPrice(product)
                    
                    return (
                      <div key={index} className="table-row">
                        <div className="position-cell">
                          <span className="position-badge">{product.position || '-'}</span>
                        </div>
                        <div className="title-cell">
                          {product.title || '-'}
                        </div>
                        <div className="price-cell">
                          <strong style={{color: price ? '#38a169' : 'red'}}>
                            {price || 'BRAK CENY'}
                          </strong>
                        </div>
                        <div className="rating-cell">
                          <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                            {rating ? (
                              <span style={{color: '#38a169', fontSize: '0.9rem'}}>
                                ⭐ {rating}
                              </span>
                            ) : (
                              <span style={{color: '#666', fontSize: '0.8rem'}}>
                                Brak ratingu
                              </span>
                            )}
                            {isSponsored ? (
                              <span style={{color: '#e53e3e', fontSize: '0.75rem', fontWeight: 'bold'}}>
                                🏷️ SPONSOR
                              </span>
                            ) : (
                              <span style={{color: '#38a169', fontSize: '0.75rem'}}>
                                ✅ Organiczny
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="url-cell">
                          {product.url ? (
                            <a href={product.url} target="_blank" rel="noopener noreferrer">
                              🔗 Otwórz
                            </a>
                          ) : '-'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LatestResultsPage 