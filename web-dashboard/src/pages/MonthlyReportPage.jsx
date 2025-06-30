import { useState, useEffect } from 'react'
import '../styles/MonthlyReportPage.css'
import { cachedApiCall } from '../utils/cache'

const MonthlyReportPage = ({ user, pocketbaseUrl }) => {
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('all')
  const [availableMonths, setAvailableMonths] = useState([])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [monthlyResults, setMonthlyResults] = useState([])
  const [missingUrls, setMissingUrls] = useState([])
  const [loading, setLoading] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'keyword', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const itemsPerPage = 40

  useEffect(() => {
    loadProjects()
    loadAvailableMonths()
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      loadMonthlyData()
      setCurrentPage(1)
      setPageInput('1')
    }
  }, [selectedMonth, selectedProjectId])

  const loadProjects = async () => {
    try {
      // Tymczasowo bez cache
      const response = await fetch(`${pocketbaseUrl}/api/collections/projects/records?filter=userId="${user.id}"&sort=-created`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        }
      })
      const data = await response.json()
      console.log('🏗️ Projects loaded:', data.items?.length || 0)
      setProjects(data.items)
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadAvailableMonths = async () => {
    try {
      const data = await cachedApiCall(
        `${pocketbaseUrl}/api/collections/positions/records?filter=userId="${user.id}"&sort=-date&fields=date`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
          userId: user.id
        },
        10 * 60 * 1000
      )
      
      // Wyciągaj unikalne miesiące
      const months = [...new Set(data.items.map(item => {
        const date = new Date(item.date)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }))].sort((a, b) => b.localeCompare(a)) // Od najnowszego
      
      setAvailableMonths(months)
      
      // Automatycznie wybierz bieżący miesiąc
      const currentMonth = new Date()
      const currentMonthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
      
      if (months.includes(currentMonthStr)) {
        setSelectedMonth(currentMonthStr)
      } else if (months.length > 0) {
        setSelectedMonth(months[0])
      }
    } catch (error) {
      console.error('Error loading available months:', error)
    }
  }

  const loadMonthlyData = async () => {
    setLoading(true)
    try {
      // Pobierz wszystkie pozycje dla wybranego miesiąca
      const monthFilter = `userId="${user.id}"&date~"${selectedMonth}"`
      console.log('📊 Positions filter:', monthFilter)
      
      // Tymczasowo bez cache  
      const positionsResponse = await fetch(`${pocketbaseUrl}/api/collections/positions/records?filter=${monthFilter}&sort=-timestamp&perPage=5000`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        }
      })
      const data = await positionsResponse.json()
      console.log('📊 Positions loaded:', data.items?.length || 0)

      // Pobierz słowa kluczowe (z projektami jeśli filtrujemy)
      let keywordsFilter = `userId="${user.id}"`
      console.log('🏗️ Building filter. Selected project:', selectedProjectId)
      
      if (selectedProjectId !== 'all') {
        if (selectedProjectId === 'none') {
          keywordsFilter += `&(projectId=""||projectId=null)` 
          console.log('🏗️ Filter for no project (empty or null)')
        } else {
          keywordsFilter += `&projectId="${selectedProjectId}"`
          console.log('🏗️ Filter for specific project:', selectedProjectId)
        }
      } else {
        console.log('🏗️ Filter for all projects (no project filter)')
      }

      console.log('🔍 Keywords filter URL:', `${pocketbaseUrl}/api/collections/keywords/records?filter=${keywordsFilter}`)
      console.log('📁 Selected project ID:', selectedProjectId)
      console.log('🔧 Keywords filter:', keywordsFilter)
      
      // Tymczasowo bezpośrednie wywołanie API (bez cache) żeby sprawdzić czy dane się zmieniają
      const keywordsResponse = await fetch(`${pocketbaseUrl}/api/collections/keywords/records?filter=${keywordsFilter}&perPage=5000`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        }
      })
      
      if (!keywordsResponse.ok) {
        console.error('❌ Keywords API error:', keywordsResponse.status, keywordsResponse.statusText)
        const errorText = await keywordsResponse.text()
        console.error('❌ Error details:', errorText)
        throw new Error(`Keywords API failed: ${keywordsResponse.status}`)
      }
      
      const keywordsData = await keywordsResponse.json()
      console.log('📊 API Response status:', keywordsResponse.status)
      console.log('📊 Total items in response:', keywordsData.totalItems || 'unknown')
      
      // Test: Check if ANY keywords have project assignments
      const allKeywordsForTest = await fetch(`${pocketbaseUrl}/api/collections/keywords/records?filter=userId="${user.id}"&perPage=500`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        }
      })
      const allKeywordsData = await allKeywordsForTest.json()
      const keywordsWithProjects = allKeywordsData.items?.filter(k => k.projectId && k.projectId !== '' && k.projectId !== 'none') || []
      console.log('🔍 TOTAL KEYWORDS IN DB:', allKeywordsData.totalItems)
      console.log('🔍 KEYWORDS WITH PROJECT ASSIGNED:', keywordsWithProjects.length)
      if (keywordsWithProjects.length > 0) {
        console.log('🔍 SAMPLE KEYWORDS WITH PROJECTS:', keywordsWithProjects.slice(0, 3).map(k => ({
          keyword: k.keyword,
          projectId: k.projectId
        })))
      } else {
        console.log('⚠️ NO KEYWORDS HAVE PROJECT ASSIGNMENTS! All have projectId = null/empty/none')
      }

            // Utwórz mapę słów kluczowych z kryteriami dopasowania
      const keywordCriteria = new Map()
      keywordsData.items.forEach(k => {
        keywordCriteria.set(k.keyword, {
          matchType: k.matchType,
          matchValue: k.matchValue
        })
      })
      
      console.log('📊 Total keywords returned:', keywordsData.items?.length || 0)
      console.log('📊 Keywords with criteria:', keywordsData.items?.filter(k => k.matchValue).length || 0)
      console.log('🏷️ Project IDs in keywords:', [...new Set(keywordsData.items?.map(k => k.projectId || 'none') || [])])
      console.log('🔍 Sample keywords with projects:', keywordsData.items?.slice(0, 5).map(k => ({
        keyword: k.keyword,
        projectId: k.projectId || 'none',
        matchType: k.matchType,
        matchValue: k.matchValue
      })) || [])
      
      // Test sprawdzający czy filtry rzeczywiście działają i zatrzymanie gdy brak keywords dla projektu
      if (selectedProjectId !== 'all' && selectedProjectId !== 'none') {
        const keywordsWithThisProject = keywordsData.items?.filter(k => k.projectId === selectedProjectId) || []
        console.log('🧪 TEST: Keywords with selected project ID (' + selectedProjectId + '):', keywordsWithThisProject.length)
        
        if (keywordsWithThisProject.length === 0) {
          console.log('🚫 STOP: No keywords found for selected project. Not processing any positions.')
          setMonthlyResults([])
          setMissingUrls([])
          setLoading(false)
          return // Zatrzymaj przetwarzanie - brak keywords dla tego projektu
        } else {
          console.log('✅ Found keywords for selected project - proceeding with processing')
        }
      }
      
      // TYMCZASOWO: Wyłącz filtrowanie produktów żeby zobaczyć wszystkie dane
      const DISABLE_PRODUCT_FILTERING = true
      
      // Funkcja sprawdzająca czy produkt pasuje do kryteriów słowa kluczowego
      const productMatchesKeyword = (product, keyword) => {
        if (!product || !product.title || !keyword) return false
        
        // TYMCZASOWO: Pokaż wszystkie produkty żeby zobaczyć pełne dane
        if (DISABLE_PRODUCT_FILTERING) {
          return true
        }
        
        const criteria = keywordCriteria.get(keyword)
        
        // Jeśli nie ma zdefiniowanych kryteriów, pokaż wszystkie produkty
        if (!criteria || !criteria.matchValue || criteria.matchValue.trim() === '') {
          return true
        }
        
        const title = product.title.toLowerCase()
        const matchValue = criteria.matchValue.toLowerCase()
        const matchType = criteria.matchType || 'title'
        
        switch (matchType) {
          case 'title':
            return title.includes(matchValue)
          case 'url':
            const productUrl = (product.url || '').toLowerCase()
            return productUrl.includes(matchValue)
          case 'brand':
            const brandInfo = (product.brand || product.seller || '').toLowerCase()
            return brandInfo.includes(matchValue)
          default:
            return title.includes(matchValue)
        }
      }
      
      // Przetwarzaj dane - tylko produkty pasujące do kryteriów
      const allResults = []
      let totalProductsChecked = 0
      let filteredProductsCount = 0
      
      console.log('🔍 Available keywords in criteria map:', Array.from(keywordCriteria.keys()).slice(0, 10))
      console.log('📊 Total positions to check:', data.items.length)
      
      let skippedKeywords = []
      let processedKeywords = []
      
      data.items.forEach(position => {
        // Sprawdź czy słowo kluczowe należy do wybranego projektu/filtra
        if (!keywordCriteria.has(position.keyword)) {
          skippedKeywords.push(position.keyword)
          return
        }
        
        processedKeywords.push(position.keyword)
        
        if (!position.products || !Array.isArray(position.products)) return
        
        position.products.forEach(product => {
          totalProductsChecked++
          
          // Sprawdź czy produkt pasuje do zdefiniowanych kryteriów
          if (productMatchesKeyword(product, position.keyword)) {
            filteredProductsCount++
            allResults.push({
              keyword: position.keyword,
              product: product,
              scanDate: position.timestamp,
              position: product.position || '-',
              url: position.url || ''
            })
          }
        })
      })
      
      console.log('📊 DEBUGGING SUMMARY:')
      console.log('Keywords skipped (not in criteria):', [...new Set(skippedKeywords)].length)
      console.log('Keywords processed:', [...new Set(processedKeywords)].length)
      console.log('Total products checked:', totalProductsChecked)
      console.log('Products that passed filter:', filteredProductsCount)
      console.log('Filter efficiency:', `${filteredProductsCount}/${totalProductsChecked} (${(totalProductsChecked>0?(filteredProductsCount/totalProductsChecked*100):0).toFixed(1)}%)`)

      // Deduplikacja - weź najnowszy wynik dla każdej kombinacji keyword+product+position
      const productMap = new Map()
      
      allResults.forEach(result => {
        const key = `${result.keyword}_${result.product.title || 'unknown'}_${result.position}`
        
        if (!productMap.has(key) || new Date(result.scanDate) > new Date(productMap.get(key).scanDate)) {
          productMap.set(key, result)
        }
      })

      const results = Array.from(productMap.values())
      setMonthlyResults(results)

      // Generuj listę brakujących URL
      generateMissingUrls(keywordsData.items, data.items)

    } catch (error) {
      console.error('Error loading monthly data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMissingUrls = (allKeywords, monthPositions) => {
    const scannedKeywords = new Set(monthPositions.map(pos => pos.keyword))
    
    const missing = allKeywords
      .filter(keyword => !scannedKeywords.has(keyword.keyword))
      .map(keyword => {
        const encodedKeyword = encodeURIComponent(keyword.keyword)
        return `https://allegro.pl/listing?string=${encodedKeyword}`
      })
    
    console.log(`Missing URLs for ${allKeywords.length} keywords and ${monthPositions.length} positions:`, missing.length)
    
    // Usuń duplikaty i ustaw w stanie komponentu
    setMissingUrls([...new Set(missing)])
  }

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    setSortConfig({ key, direction })
  }

  const sortedResults = [...monthlyResults].sort((a, b) => {
    let aValue, bValue
    
    switch (sortConfig.key) {
      case 'keyword':
        aValue = a.keyword.toLowerCase()
        bValue = b.keyword.toLowerCase()
        break
      case 'product':
        aValue = (a.product.title || '').toLowerCase()
        bValue = (b.product.title || '').toLowerCase()
        break
      case 'position':
        aValue = parseInt(a.position) || 999
        bValue = parseInt(b.position) || 999
        break
      case 'scanDate':
        aValue = new Date(a.scanDate)
        bValue = new Date(b.scanDate)
        break
      default:
        return 0
    }
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const copyUrlsToClipboard = () => {
    const urlsText = missingUrls.join('\n')
    navigator.clipboard.writeText(urlsText)
    alert(`Skopiowano ${missingUrls.length} URL do schowka!`)
  }

  const exportToCsv = () => {
    if (sortedResults.length === 0) return

         const headers = ['Słowo kluczowe', 'Nazwa produktu', 'Pozycja', 'Data skanowania', 'Cena', 'Rating', 'Sponsor', 'URL']
     const csvData = sortedResults.map(result => [
       result.keyword,
       result.product.title || '',
       result.position,
       new Date(result.scanDate).toLocaleDateString('pl-PL'),
       result.product.price || result.product.Price || '',
       result.product.rating || '',
       result.product.sponsored ? 'TAK' : 'NIE',
       result.product.url || ''
     ])

     const csvContent = [
       headers.map(header => `"${header}"`).join(','),
       ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
     ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `raport-miesieczny-${selectedMonth}-${selectedProjectId === 'all' ? 'wszystkie' : 'projekt'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-')
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ]
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  // Paginacja
  const totalPages = Math.ceil(sortedResults.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentResults = sortedResults.slice(startIndex, endIndex)

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    setPageInput(String(newPage))
  }

  const handlePageInputChange = (e) => {
    setPageInput(e.target.value)
  }

  const handlePageInputSubmit = (e) => {
    e.preventDefault()
    const page = parseInt(pageInput)
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    } else {
      setPageInput(String(currentPage))
    }
  }

  // Synchronizacja scrollingu między górną belką a tabelą
  const handleTopScrollSync = (e) => {
    const tableWrapper = document.querySelector('.table-wrapper')
    if (tableWrapper) {
      tableWrapper.scrollLeft = e.target.scrollLeft
    }
  }

  const handleTableScrollSync = (e) => {
    const topScroll = document.querySelector('.table-scroll-container')
    if (topScroll) {
      topScroll.scrollLeft = e.target.scrollLeft
    }
  }

  return (
    <div className="monthly-report-page">
      <div className="page-header">
        <h2>📊 Raport miesięczny</h2>
        <p>Analiza pozycji dla wybranego miesiąca (wyniki dla ostatnich skanów)</p>
      </div>

      {/* Filtry */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="project-select">📁 Projekt:</label>
          <select
            id="project-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="all">📂 Wszystkie projekty</option>
            <option value="none">📝 Bez projektu</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                📁 {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="month-select">📅 Miesiąc:</label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">Wybierz miesiąc...</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Brakujące URL */}
      {selectedMonth && missingUrls.length > 0 && (
                 <div className="missing-urls-section">
           <h3>🔗 URL do sprawdzenia w {formatMonth(selectedMonth)}</h3>
           <p>Następujące listingi nie były skanowane w tym miesiącu ({missingUrls.length} URL):</p>
          <div className="urls-container">
            <textarea
              readOnly
              value={missingUrls.join('\n')}
              className="urls-textarea"
              rows={Math.min(missingUrls.length, 10)}
            />
            <button onClick={copyUrlsToClipboard} className="copy-urls-btn">
              📋 Kopiuj wszystkie URL
            </button>
          </div>
        </div>
      )}

      {/* Wyniki */}
      {selectedMonth && (
        <div className="results-section">
          <div className="results-header">
            <h3>📋 Wyniki dla {formatMonth(selectedMonth)}</h3>
            <div className="results-actions">
              <button onClick={exportToCsv} className="export-btn" disabled={sortedResults.length === 0}>
                💾 Eksport CSV
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">Ładowanie danych...</div>
          ) : sortedResults.length === 0 ? (
            <div className="empty-state">
              <p>🔍 Brak wyników dla wybranego miesiąca i projektu</p>
              <p>Sprawdź czy wykonano skanowania w tym okresie.</p>
            </div>
                     ) : (
             <>
               {/* Górna belka przesuwania */}
               <div className="table-scroll-container" onScroll={handleTopScrollSync}>
                 <div className="table-scroll-content"></div>
               </div>
               
               <div className="table-wrapper" onScroll={handleTableScrollSync}>
                 <div className="results-table">
                   <div className="table-header">
                    <div onClick={() => handleSort('keyword')} className="sortable">
                      Słowo kluczowe {getSortIcon('keyword')}
                    </div>
                    <div onClick={() => handleSort('product')} className="sortable">
                      Nazwa produktu {getSortIcon('product')}
                    </div>
                    <div onClick={() => handleSort('position')} className="sortable">
                      Pozycja {getSortIcon('position')}
                    </div>
                    <div onClick={() => handleSort('scanDate')} className="sortable">
                      Data skanowania {getSortIcon('scanDate')}
                    </div>
                    <div>Cena</div>
                    <div>Rating & Sponsor</div>
                    <div>URL</div>
                  </div>

                  {currentResults.map((result, index) => {
                const findPrice = (prod) => {
                  return prod.price || prod.Price || prod.PRICE || prod.cena || prod.Cena || null
                }
                
                const price = findPrice(result.product)
                const rating = result.product.rating || null
                const isSponsored = result.product.sponsored || false

                return (
                  <div key={index} className="table-row">
                    <div className="keyword-cell">
                      <strong>{result.keyword}</strong>
                    </div>
                    <div className="product-cell">
                      {result.product.title || '-'}
                    </div>
                    <div className="position-cell">
                      <span className={`position-badge ${parseInt(result.position) <= 10 ? 'top-10' : ''}`}>
                        {result.position}
                      </span>
                    </div>
                    <div className="date-cell">
                      {new Date(result.scanDate).toLocaleDateString('pl-PL')}
                      <br />
                      <small>{new Date(result.scanDate).toLocaleTimeString('pl-PL')}</small>
                    </div>
                    <div className="price-cell">
                      <strong style={{color: price ? '#38a169' : '#999'}}>
                        {price || 'Brak ceny'}
                      </strong>
                    </div>
                    <div className="rating-cell">
                      <div className="rating-info">
                        {rating ? (
                          <span className="rating">⭐ {rating}</span>
                        ) : (
                          <span className="no-rating">Brak ratingu</span>
                        )}
                        {isSponsored ? (
                          <span className="sponsored">🏷️ SPONSOR</span>
                        ) : (
                          <span className="organic">✅ Organiczny</span>
                        )}
                      </div>
                    </div>
                    <div className="url-cell">
                      {result.product.url ? (
                        <a href={result.product.url} target="_blank" rel="noopener noreferrer">
                          🔗 Otwórz
                        </a>
                      ) : '-'}
                    </div>
                  </div>
                )
              })}
                   </div>
                 </div>
                 
                 {/* Paginacja */}
                 {totalPages > 1 && (
                   <div className="pagination-container">
                     <div className="pagination-info">
                       Wyniki {startIndex + 1}-{Math.min(endIndex, sortedResults.length)} z {sortedResults.length}
                     </div>
                     <div className="pagination-controls">
                       <button 
                         className="pagination-btn" 
                         onClick={() => handlePageChange(1)}
                         disabled={currentPage === 1}
                       >
                         ⏮️ Pierwsza
                       </button>
                       <button 
                         className="pagination-btn" 
                         onClick={() => handlePageChange(currentPage - 1)}
                         disabled={currentPage === 1}
                       >
                         ⬅️ Poprzednia
                       </button>
                       
                       <div className="page-input-container">
                         <span>Strona</span>
                         <form onSubmit={handlePageInputSubmit}>
                           <input
                             type="number"
                             className="page-input"
                             value={pageInput}
                             onChange={handlePageInputChange}
                             min="1"
                             max={totalPages}
                           />
                         </form>
                         <span>z {totalPages}</span>
                       </div>
                       
                       <button 
                         className="pagination-btn" 
                         onClick={() => handlePageChange(currentPage + 1)}
                         disabled={currentPage === totalPages}
                       >
                         Następna ➡️
                       </button>
                       <button 
                         className="pagination-btn" 
                         onClick={() => handlePageChange(totalPages)}
                         disabled={currentPage === totalPages}
                       >
                         Ostatnia ⏭️
                       </button>
                     </div>
                   </div>
                 )}
               </>
             )}
           </div>
         )}
       </div>
     )
 }

export default MonthlyReportPage 