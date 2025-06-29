import { useState, useEffect } from 'react'
import '../styles/ReportsPage.css'
import { cachedApiCall } from '../utils/cache'

const ReportsPage = ({ user, pocketbaseUrl }) => {
  const [reportData, setReportData] = useState([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [dateMode, setDateMode] = useState('single') // 'single' or 'range'
  const [selectedKeywords, setSelectedKeywords] = useState([])
  const [availableKeywords, setAvailableKeywords] = useState([])
  const [sortBy, setSortBy] = useState('avgPosition')
  const [sortDirection, setSortDirection] = useState('asc')
  const [viewMode, setViewMode] = useState('summary') // summary, detailed, trends
  const [exportFormat, setExportFormat] = useState('csv')

  useEffect(() => {
    loadAvailableKeywords()
  }, [])

  useEffect(() => {
    if (user?.id) {
      setDefaultDateRange()
    }
  }, [dateMode, user])

  useEffect(() => {
    // W trybie pojedynczej daty wystarczy dateRange.from
    // W trybie zakres dat potrzebujemy oba
    const shouldGenerate = dateMode === 'single' 
      ? dateRange.from 
      : dateRange.from && dateRange.to
    
    if (shouldGenerate) {
      console.log(`Auto-generating report: mode=${dateMode}, from=${dateRange.from}, to=${dateRange.to}`)
      generateReport()
    }
  }, [dateRange, selectedKeywords, sortBy, sortDirection, dateMode])

  const setDefaultDateRange = async () => {
    try {
      // Pobierz ostatnie daty skanów dla użytkownika
      const recentData = await cachedApiCall(
        `${pocketbaseUrl}/api/collections/positions/records?filter=userId="${user.id}"&fields=date&sort=-date&perPage=10`,
        {
          headers: { 'Authorization': `Bearer ${user.token}` },
          userId: user.id
        },
        5 * 60 * 1000
      )
      
      if (recentData.items && recentData.items.length > 0) {
        const latestDate = recentData.items[0].date.split('T')[0]
        const weekAgo = new Date(new Date(latestDate).getTime() - 7 * 24 * 60 * 60 * 1000)
        
        console.log(`Setting default date range: ${weekAgo.toISOString().split('T')[0]} to ${latestDate}`)
        
        setDateRange({
          from: dateMode === 'single' ? latestDate : weekAgo.toISOString().split('T')[0],
          to: latestDate
        })
      } else {
        // Fallback do dzisiejszej daty jeśli brak danych
        const today = new Date()
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        
        setDateRange({
          from: dateMode === 'single' ? today.toISOString().split('T')[0] : weekAgo.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0]
        })
      }
    } catch (error) {
      console.error('Error setting default date range:', error)
      // Fallback
      const today = new Date()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 1000)
      
      setDateRange({
        from: dateMode === 'single' ? today.toISOString().split('T')[0] : weekAgo.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
      })
    }
  }

  const loadAvailableKeywords = async () => {
    try {
      // Pobierz unikalne słowa kluczowe z positions - większy limit
      const positionsData = await cachedApiCall(
        `${pocketbaseUrl}/api/collections/positions/records?filter=userId="${user.id}"&fields=keyword&perPage=500`,
        {
          headers: { 'Authorization': `Bearer ${user.token}` },
          userId: user.id
        },
        5 * 60 * 1000
      )
      
      // Pobierz szczegóły słów kluczowych z keywords collection - większy limit
      const keywordsData = await cachedApiCall(
        `${pocketbaseUrl}/api/collections/keywords/records?filter=userId="${user.id}"&perPage=500`,
        {
          headers: { 'Authorization': `Bearer ${user.token}` },
          userId: user.id
        },
        5 * 60 * 1000
      )
      
      const uniqueKeywords = [...new Set(positionsData.items.map(item => item.keyword))]
      
      console.log(`Loaded positions: ${positionsData.items.length}, unique keywords: ${uniqueKeywords.length}`)
      console.log(`Loaded keyword details: ${keywordsData.items.length}`)
      
      // Stwórz mapę słowo kluczowe -> szczegóły
      const keywordDetails = {}
      keywordsData.items.forEach(item => {
        keywordDetails[item.keyword] = item
      })
      
      setAvailableKeywords(uniqueKeywords)
      
      // Zapisz szczegóły do użycia w innych miejscach
      window.keywordDetailsMap = keywordDetails
      
    } catch (error) {
      console.error('Error loading keywords:', error)
    }
  }

  const generateReport = async () => {
    setLoading(true)
    try {
      let filter = `userId="${user.id}"`
      
      // Ustaw zakres dat w zależności od trybu
      if (dateMode === 'single') {
        // Dla pojedynczej daty - exact match
        filter += `&&date="${dateRange.from}"`
        console.log(`Single date filter: ${filter}`)
      } else {
        // Dla zakresu dat
        filter += `&&date>="${dateRange.from}"`
        if (dateRange.to) {
          filter += `&&date<="${dateRange.to}"`
        } else {
          filter += `&&date<="${dateRange.from}"`
        }
        console.log(`Date range filter: ${filter}`)
      }
      
      if (selectedKeywords.length > 0) {
        const keywordFilter = selectedKeywords.map(k => `keyword="${k}"`).join('||')
        filter += `&&(${keywordFilter})`
      }

      const data = await cachedApiCall(
        `${pocketbaseUrl}/api/collections/positions/records?filter=${filter}&sort=-date`,
        {
          headers: { 'Authorization': `Bearer ${user.token}` },
          userId: user.id
        },
        2 * 60 * 1000
      )
      
      console.log(`Generating report for date mode: ${dateMode}, date range: ${dateRange.from} - ${dateRange.to}`)
      console.log(`Found ${data.items.length} position records`)
      
      const aggregatedData = aggregatePositionData(data.items)
      console.log(`Aggregated to ${aggregatedData.length} keyword stats`)
      setReportData(aggregatedData)
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  // Funkcja sprawdzająca czy produkt pasuje do słowa kluczowego
  const productMatchesKeyword = (product, keyword) => {
    if (!product || !product.title || !keyword) return false
    
    const title = product.title.toLowerCase()
    const keywordLower = keyword.toLowerCase()
    
    // Sprawdź szczegóły z kolekcji keywords jeśli dostępne
    const keywordDetails = window.keywordDetailsMap?.[keyword]
    if (keywordDetails) {
      const matchValue = keywordDetails.matchValue?.toLowerCase() || keywordLower
      const matchType = keywordDetails.matchType || 'contains'
      
      switch (matchType) {
        case 'exact':
          return title === matchValue
        case 'starts':
          return title.startsWith(matchValue)  
        case 'ends':
          return title.endsWith(matchValue)
        case 'contains':
        default:
          return title.includes(matchValue)
      }
    }
    
    // Fallback - sprawdź czy tytuł zawiera słowo kluczowe
    return title.includes(keywordLower)
  }

  const aggregatePositionData = (rawData) => {
    const keywordStats = {}
    
    rawData.forEach(record => {
      const keyword = record.keyword
      const date = record.date.split('T')[0]
      
      if (!keywordStats[keyword]) {
        keywordStats[keyword] = {
          keyword,
          totalProducts: 0,
          totalScans: 0,
          avgPosition: 0,
          bestPosition: Infinity,
          worstPosition: 0,
          scanDates: [],
          dailyData: {},
          positionHistory: [],
          topProducts: [],
          matchedProductsCount: 0
        }
      }
      
      const stats = keywordStats[keyword]
      stats.totalScans++
      stats.scanDates.push(date)
      
      if (record.products && Array.isArray(record.products)) {
        // Najpierw znajdź dopasowane produkty
        let matchedProductsInThisRecord = 0
        const matchedProducts = []
        
        record.products.forEach((product, prodIndex) => {
          if (product.position && parseInt(product.position) > 0) {
            // Sprawdź czy produkt pasuje do słowa kluczowego
            if (productMatchesKeyword(product, keyword)) {
              matchedProductsInThisRecord++
              matchedProducts.push(product)
              
              // Debug log tylko dla pierwszych produktów pierwszych keywords
              if (Object.keys(keywordStats).length <= 2 && prodIndex <= 2) {
                console.log(`    ✅ MATCHED product ${prodIndex} for "${keyword}" on ${date}: pos=${product.position}, title="${product.title?.substring(0, 60)}"`)
              }
              
              stats.topProducts.push({
                ...product,
                date,
                position: parseInt(product.position),
                keyword // Dodaj keyword dla ułatwienia debugowania
              })
            } else {
              // Debug log dla odrzuconych produktów
              if (Object.keys(keywordStats).length <= 2 && prodIndex <= 2) {
                console.log(`    ❌ REJECTED product ${prodIndex} for "${keyword}": "${product.title?.substring(0, 60)}" - no match`)
              }
            }
          }
        })
        
        console.log(`Keyword "${keyword}" on ${date}: ${matchedProductsInThisRecord} matched products out of ${record.products.length} total`)
        
        // Oblicz statystyki tylko z dopasowanych produktów
        const matchedPositions = matchedProducts
          .map(p => parseInt(p.position))
          .filter(p => !isNaN(p) && p > 0)
        
        if (matchedPositions.length > 0) {
          stats.totalProducts += record.products.length
          stats.matchedProductsCount += matchedProductsInThisRecord
          
          const avgPos = matchedPositions.reduce((sum, pos) => sum + pos, 0) / matchedPositions.length
          stats.positionHistory.push({ date, avgPosition: avgPos, count: matchedPositions.length })
          
          const minPos = Math.min(...matchedPositions)
          const maxPos = Math.max(...matchedPositions)
          stats.bestPosition = Math.min(stats.bestPosition, minPos)
          stats.worstPosition = Math.max(stats.worstPosition, maxPos)
          
          // Debug log dla sprawdzenia pozycji (tylko dla pierwszych 3 keywords)
          if (Object.keys(keywordStats).length <= 3) {
            console.log(`Keyword: ${keyword}, Date: ${date}, Matched Positions: ${matchedPositions}, Min: ${minPos}, Max: ${maxPos}`)
          }
        }
        
        // Agreguj dane dzienne z dopasowanymi produktami
        if (!stats.dailyData[date]) {
          stats.dailyData[date] = {
            scans: 0,
            totalProducts: 0,
            avgPosition: 0,
            matchedProducts: 0
          }
        }
        
        stats.dailyData[date].scans++
        stats.dailyData[date].totalProducts += record.products.length
        if (matchedPositions.length > 0) {
          stats.dailyData[date].avgPosition = matchedPositions.reduce((sum, pos) => sum + pos, 0) / matchedPositions.length
          stats.dailyData[date].matchedProducts += matchedPositions.length
        }
      }
    })
    
    // Oblicz średnie pozycje
    Object.values(keywordStats).forEach(stats => {
      if (stats.positionHistory.length > 0) {
        const totalWeightedPos = stats.positionHistory.reduce((sum, item) => 
          sum + (item.avgPosition * item.count), 0)
        const totalCount = stats.positionHistory.reduce((sum, item) => sum + item.count, 0)
        stats.avgPosition = totalCount > 0 ? totalWeightedPos / totalCount : 0
      }
      
      if (stats.bestPosition === Infinity) stats.bestPosition = 0
      
      // Sortuj produkty według pozycji
      stats.topProducts.sort((a, b) => a.position - b.position)
      
      // Unikalne daty
      stats.scanDates = [...new Set(stats.scanDates)].sort()
    })
    
    return Object.values(keywordStats)
  }

  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      
      if (sortBy === 'avgPosition' || sortBy === 'bestPosition') {
        aVal = aVal || 999
        bVal = bVal || 999
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }

  const exportReport = () => {
    if (dateMode === 'single') {
      exportSingleDateCSV()
    } else {
      const sortedData = sortData(reportData)
      
      if (exportFormat === 'csv') {
        exportToCSV(sortedData)
      } else if (exportFormat === 'detailed') {
        exportDetailedCSV(sortedData)
      }
    }
  }

  const exportSingleDateCSV = () => {
    // Zbierz te same dane co w renderSingleDateView
    const allProducts = []
    
    reportData.forEach(keywordData => {
      keywordData.topProducts.forEach(product => {
        allProducts.push({
          keyword: keywordData.keyword,
          position: product.position,
          title: product.title,
          price: product.price,
          rating: product.rating,
          url: product.url,
          matchValue: window.keywordDetailsMap?.[keywordData.keyword]?.matchValue || keywordData.keyword
        })
      })
    })
    
    // Sortuj według pozycji
    allProducts.sort((a, b) => a.position - b.position)
    
    const headers = [
      'Słowo kluczowe',
      'URL sprawdzany (listing allegro)', 
      'Klucz wyszukiwania (wartość)',
      'Pozycja klucza na listingu',
      'Cena',
      'Średnia ocen'
    ]
    
    const rows = allProducts.map(product => [
      product.keyword,
      product.url || '',
      product.matchValue,
      product.position,
      product.price || '',
      product.rating || ''
    ])
    
    downloadCSV([headers, ...rows], `raport_pozycje_${dateRange.from}.csv`)
  }

  const exportToCSV = (data) => {
    const headers = [
      'Słowo kluczowe',
      'Średnia pozycja', 
      'Najlepsza pozycja',
      'Najgorsza pozycja',
      'Liczba skanów',
      'Łącznie produktów',
      'Produkty z pozycją',
      'Pierwsze skanowanie',
      'Ostatnie skanowanie'
    ]
    
    const rows = data.map(item => [
      item.keyword,
      item.avgPosition ? item.avgPosition.toFixed(2) : 'brak',
      item.bestPosition || 'brak',
      item.worstPosition || 'brak', 
      item.totalScans,
      item.totalProducts,
      item.matchedProductsCount,
      item.scanDates[0] || '',
      item.scanDates[item.scanDates.length - 1] || ''
    ])
    
    downloadCSV([headers, ...rows], `raport_pozycji_${dateRange.from}_${dateRange.to}.csv`)
  }

  const exportDetailedCSV = (data) => {
    const rows = []
    const headers = [
      'Słowo kluczowe',
      'Data',
      'Pozycja',
      'Nazwa produktu', 
      'Cena',
      'Sprzedawca',
      'URL'
    ]
    
    rows.push(headers)
    
    data.forEach(keywordData => {
      keywordData.topProducts.forEach(product => {
        rows.push([
          keywordData.keyword,
          product.date,
          product.position,
          product.title || '',
          product.price || '',
          product.seller || '',
          product.url || ''
        ])
      })
    })
    
    downloadCSV(rows, `raport_szczegolowy_${dateRange.from}_${dateRange.to}.csv`)
  }

  const downloadCSV = (rows, filename) => {
    const csvContent = rows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleKeywordSelection = (keyword) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword) 
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    )
  }

  const renderSummaryView = () => {
    const sortedData = sortData(reportData)
    
    return (
      <div className="summary-view">
        <div className="stats-overview">
          <div className="stat-card">
            <h4>📊 Łącznie słów kluczowych</h4>
            <div className="stat-value">{reportData.length}</div>
          </div>
          <div className="stat-card">
            <h4>🔍 Łącznie skanów</h4>
            <div className="stat-value">
              {reportData.reduce((sum, item) => sum + item.totalScans, 0)}
            </div>
          </div>
          <div className="stat-card">
            <h4>🎯 Średnia pozycja</h4>
            <div className="stat-value">
              {reportData.length > 0 
                ? (reportData.reduce((sum, item) => sum + (item.avgPosition || 0), 0) / reportData.length).toFixed(1)
                : '0'
              }
            </div>
          </div>
          <div className="stat-card">
            <h4>🏆 Najlepsza pozycja</h4>
            <div className="stat-value">
              {Math.min(...reportData.map(item => item.bestPosition).filter(p => p > 0)) || 'brak'}
            </div>
          </div>
        </div>

        <div className="keywords-table">
          <div className="table-header">
            <div 
              className={`sortable ${sortBy === 'keyword' ? sortDirection : ''}`}
              onClick={() => {
                if (sortBy === 'keyword') {
                  setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
                } else {
                  setSortBy('keyword')
                  setSortDirection('asc')
                }
              }}
            >
              Słowo kluczowe
            </div>
            <div 
              className={`sortable ${sortBy === 'avgPosition' ? sortDirection : ''}`}
              onClick={() => {
                if (sortBy === 'avgPosition') {
                  setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
                } else {
                  setSortBy('avgPosition')
                  setSortDirection('asc')
                }
              }}
            >
              Średnia pozycja
            </div>
            <div 
              className={`sortable ${sortBy === 'bestPosition' ? sortDirection : ''}`}
              onClick={() => {
                if (sortBy === 'bestPosition') {
                  setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
                } else {
                  setSortBy('bestPosition')
                  setSortDirection('asc')
                }
              }}
            >
              Najlepsza
            </div>
            <div 
              className={`sortable ${sortBy === 'totalScans' ? sortDirection : ''}`}
              onClick={() => {
                if (sortBy === 'totalScans') {
                  setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
                } else {
                  setSortBy('totalScans')
                  setSortDirection('desc')
                }
              }}
            >
              Skany
            </div>
            <div 
              className={`sortable ${sortBy === 'matchedProductsCount' ? sortDirection : ''}`}
              onClick={() => {
                if (sortBy === 'matchedProductsCount') {
                  setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
                } else {
                  setSortBy('matchedProductsCount')
                  setSortDirection('desc')
                }
              }}
            >
              Produkty z pozycją
            </div>
            <div>Zakres dat</div>
          </div>
          
          {sortedData.map((item, index) => (
            <div key={index} className="table-row">
              <div className="keyword-cell">
                <strong>{item.keyword}</strong>
                {window.keywordDetailsMap && window.keywordDetailsMap[item.keyword] && (
                  <div className="keyword-details-preview">
                    Klucz dla pozycji: {window.keywordDetailsMap[item.keyword].matchType} - {window.keywordDetailsMap[item.keyword].matchValue}
                  </div>
                )}
                {item.topProducts.length > 0 && (
                  <div className="top-product-preview">
                    Najlepszy wynik (poz. {item.topProducts[0].position}): {item.topProducts[0].title?.substring(0, 35)}...
                  </div>
                )}
              </div>
              <div className="position-cell">
                <span className={`position-badge ${getPositionClass(item.avgPosition)}`}>
                  {item.avgPosition ? item.avgPosition.toFixed(1) : 'brak'}
                </span>
              </div>
              <div className="position-cell">
                <span className={`position-badge ${getPositionClass(item.bestPosition)}`}>
                  {item.bestPosition || 'brak'}
                </span>
              </div>
              <div className="count-cell">{item.totalScans}</div>
              <div className="count-cell">{item.matchedProductsCount}</div>
              <div className="date-range-cell">
                {item.scanDates[0]} - {item.scanDates[item.scanDates.length - 1]}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getPositionClass = (position) => {
    if (!position || position === 0) return 'no-position'
    if (position <= 3) return 'excellent'
    if (position <= 10) return 'good'
    if (position <= 20) return 'fair'
    return 'poor'
  }

  const renderSingleDateView = () => {
    const allProducts = []
    const targetDate = dateRange.from
    
    console.log(`🔍 Rendering single date view for: ${targetDate}`)
    console.log(`📊 Report data contains ${reportData.length} keywords`)
    
    // Zbierz wszystkie produkty z wszystkich słów kluczowych
    // (dane już są przefiltrowane przez generateReport dla wybranej daty)
    reportData.forEach(keywordData => {
      console.log(`Processing keyword: ${keywordData.keyword}, products count: ${keywordData.topProducts.length}`)
      
      keywordData.topProducts.forEach((product, productIndex) => {
        console.log(`  ✅ Product ${productIndex}: position=${product.position}, title="${product.title?.substring(0, 80)}", date=${product.date}`)
        
        allProducts.push({
          keyword: keywordData.keyword,
          position: product.position,
          title: product.title,
          price: product.price,
          seller: product.seller,
          rating: product.rating,
          sponsored: product.sponsored,
          url: product.url,
          date: product.date,
          // Dodaj klucz wyszukiwania z kolekcji keywords
          matchValue: window.keywordDetailsMap?.[keywordData.keyword]?.matchValue || keywordData.keyword
        })
      })
    })
    
    console.log(`Total products collected: ${allProducts.length}`)
    
    // Sortuj według pozycji
    allProducts.sort((a, b) => a.position - b.position)
    
    console.log(`After sorting - first 5 products:`)
    allProducts.slice(0, 5).forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.keyword} (pos: ${product.position}): ${product.title?.substring(0, 80)}`)
    })
    
    return (
              <div className="single-date-view">
        <div className="view-info">
          <p>📅 <strong>Widok pojedynczej daty:</strong> {dateRange.from} - Pokazuje wszystkie produkty znalezione w tym dniu</p>
        </div>
        
        <div className="stats-overview">
          <div className="stat-card">
            <h4>📊 Słowa kluczowe</h4>
            <div className="stat-value">{reportData.length}</div>
          </div>
          <div className="stat-card">
            <h4>🛍️ Znaleziono produktów</h4>
            <div className="stat-value">{allProducts.length}</div>
          </div>
          <div className="stat-card">
            <h4>🏆 Najlepsza pozycja</h4>
            <div className="stat-value">
              {allProducts.length > 0 ? allProducts[0].position : 'brak'}
            </div>
          </div>
          <div className="stat-card">
            <h4>📅 Data skanowania</h4>
            <div className="stat-value">{dateRange.from}</div>
          </div>
        </div>

        <div className="simple-table">
          <div className="table-header">
            <div>Słowo kluczowe</div>
            <div>Pozycja</div>
            <div>Produkt</div>
            <div>Cena</div>
            <div>Średnia ocen</div>
          </div>
          
          {allProducts.map((product, index) => (
            <div key={index} className="table-row">
              <div className="keyword-cell">
                <strong>{product.keyword}</strong>
                {window.keywordDetailsMap && window.keywordDetailsMap[product.keyword] && (
                  <div className="keyword-details-preview">
                    Klucz: {window.keywordDetailsMap[product.keyword].matchType} - {window.keywordDetailsMap[product.keyword].matchValue}
                  </div>
                )}
              </div>
              <div className="position-cell">
                <span className={`position-badge ${getPositionClass(product.position)}`}>
                  {product.position}
                </span>
              </div>
              <div>
                <a href={product.url} target="_blank" rel="noopener noreferrer">
                  {product.title?.substring(0, 50)}...
                </a>
              </div>
              <div>{product.price || 'brak'}</div>
              <div className="rating-cell">
                {product.rating ? (
                  <span className="rating-display">
                    ⭐ {product.rating}
                    {product.sponsored && <span className="sponsor-badge">🏷️</span>}
                  </span>
                ) : 'brak'}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <h2>📊 Raporty pozycji</h2>
        <p>Analiza i agregacja danych z monitoringu pozycji</p>
      </div>

      {/* Filtry i kontrole */}
      <div className="report-controls">
        {/* Sekcja wyboru daty - przeniesiona wyżej */}
        <div className="date-range-section">
          <h4>📅 Analiza danych</h4>
          <div className="date-mode-selector">
            <label>
              <input 
                type="radio" 
                value="single" 
                checked={dateMode === 'single'}
                onChange={(e) => setDateMode(e.target.value)}
              />
              Pojedyncza data (widok prosty)
            </label>
            <label>
              <input 
                type="radio" 
                value="range" 
                checked={dateMode === 'range'}
                onChange={(e) => setDateMode(e.target.value)}
              />
              Zakres dat (analiza agregowana)
            </label>
          </div>
          
          <div className="date-inputs">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              placeholder="Data/Od"
            />
            {dateMode === 'range' && (
              <>
                <span>do</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="Do"
                />
              </>
            )}
          </div>
        </div>

        {/* Sekcja generowania - stałe położenie */}
        <div className="generate-section" style={{ marginTop: '1rem' }}>
          <button 
            onClick={generateReport} 
            className="generate-btn"
            disabled={!dateRange.from}
            style={{ 
              position: 'static',
              minWidth: '200px',
              marginLeft: '0'
            }}
          >
            🔄 Generuj raport
          </button>
        </div>

        {/* Pozostałe sekcje */}
        <div className="secondary-controls" style={{ marginTop: '1rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Filtr słów kluczowych - opcjonalny, można dodać później */}
          {false && (
            <div className="keywords-filter-section">
              <h4>🔍 Filtr słów kluczowych</h4>
              <div className="keywords-filter">
                <button
                  onClick={() => setSelectedKeywords([])}
                  className={`filter-btn ${selectedKeywords.length === 0 ? 'active' : ''}`}
                >
                  Wszystkie ({availableKeywords.length})
                </button>
                {availableKeywords.map(keyword => (
                  <button
                    key={keyword}
                    onClick={() => toggleKeywordSelection(keyword)}
                    className={`filter-btn ${selectedKeywords.includes(keyword) ? 'active' : ''}`}
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="export-section">
            <h4>💾 Eksport danych</h4>
            <div className="export-controls">
              {dateMode === 'single' ? (
                <button onClick={exportReport} className="export-btn" disabled={reportData.length === 0}>
                  📊 Eksportuj pozycje (CSV)
                </button>
              ) : (
                <>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                  >
                    <option value="csv">Raport podsumowujący (CSV)</option>
                    <option value="detailed">Raport szczegółowy (CSV)</option>
                  </select>
                  <button onClick={exportReport} className="export-btn" disabled={reportData.length === 0}>
                    📊 Eksportuj raport
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Wyniki */}
      <div className="report-content">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            Generowanie raportu...
          </div>
        ) : reportData.length === 0 ? (
          <div className="empty-state">
            <h3>📭 {dateMode === 'single' ? 'Brak danych dla wybranej daty' : 'Brak danych do wyświetlenia'}</h3>
            <p>Sprawdź czy:</p>
            <ul>
              <li>{dateMode === 'single' ? `Extension został uruchomiony w dniu ${dateRange.from}` : 'Wybrany zakres dat zawiera dane'}</li>
              <li>Słowa kluczowe mają zapisane wyniki</li>
              <li>PocketBase zawiera dane dla tego użytkownika</li>
              {dateMode === 'single' && (
                <li>Spróbuj wybrać inną datę z dropdown</li>
              )}
            </ul>
            
            {dateMode === 'single' && (
              <button 
                onClick={() => {
                  console.log('🔄 Manual refresh triggered')
                  generateReport()
                }} 
                className="generate-btn"
                style={{ marginTop: '1rem' }}
              >
                🔄 Odśwież dane
              </button>
            )}
          </div>
        ) : (
          dateMode === 'single' ? renderSingleDateView() : renderSummaryView()
        )}
      </div>
    </div>
  )
}

export default ReportsPage 