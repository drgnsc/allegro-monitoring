import { useState, useEffect } from 'react'
import '../styles/ProjectPage.css'
import { cachedApiCall, invalidateCache } from '../utils/cache'

const ProjectPage = ({ user, pocketbaseUrl }) => {
  const [keywords, setKeywords] = useState([])
  const [newKeyword, setNewKeyword] = useState('')
  const [newMatchType, setNewMatchType] = useState('title')
  const [newMatchValue, setNewMatchValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedUrls, setGeneratedUrls] = useState([])
  const [importLoading, setImportLoading] = useState(false)
  const [importResults, setImportResults] = useState(null)
  const [showCsvImport, setShowCsvImport] = useState(false)
  // Projects management
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('all')
  const [loadingProjects, setLoadingProjects] = useState(false)
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(100)

  // Pagination calculations
  const totalPages = Math.ceil(keywords.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentKeywords = keywords.slice(startIndex, endIndex)

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  useEffect(() => {
    loadProjects()
    loadKeywords()
  }, [])

  useEffect(() => {
    loadKeywords()
  }, [selectedProjectId])

  useEffect(() => {
    generateUrls()
  }, [keywords])

  const loadProjects = async () => {
    setLoadingProjects(true)
    try {
      const response = await fetch(`${pocketbaseUrl}/api/collections/projects/records?filter=userId="${user.id}"&sort=-created`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setProjects(data.items)
      } else {
        console.error('Error loading projects:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoadingProjects(false)
    }
  }

  const loadKeywords = async () => {
    try {
      console.log('🔄 Ładowanie keywords z PocketBase...')
      console.log('👤 Filtruję dla userId:', user.id)
      console.log('📁 Wybrany projekt:', selectedProjectId)
      
      // Pobierz z filtrem PocketBase tylko dla userId - filtrowanie projektów w JS
      let filter = `userId="${user.id}"`
      
      console.log('🔧 Używamy prostego filtra tylko userId, projekty filtrujemy w JS')
      
      console.log('🔍 Używany filtr:', filter)
      
      const response = await fetch(`${pocketbaseUrl}/api/collections/keywords/records?filter=${encodeURIComponent(filter)}&perPage=500&sort=-created`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      console.log('📊 Załadowano keywords z PocketBase:', data.items?.length || 0)
      console.log('📊 Total items w PocketBase:', data.totalItems || 0)
      console.log('🔍 Pierwsze 3 keywords:', data.items.slice(0, 3))
      
      // Filtruj po stronie JS według wybranego projektu
      let filteredKeywords = data.items || []
      
      if (selectedProjectId === 'none') {
        // Słowa kluczowe bez przypisanego projektu
        filteredKeywords = filteredKeywords.filter(keyword => !keyword.projectId || keyword.projectId === '')
        console.log('🔍 Po filtracji "bez projektu":', filteredKeywords.length)
      } else if (selectedProjectId && selectedProjectId !== 'all') {
        // Słowa kluczowe z konkretnym projektem
        filteredKeywords = filteredKeywords.filter(keyword => keyword.projectId === selectedProjectId)
        console.log('🔍 Po filtracji projektu "' + selectedProjectId + '":', filteredKeywords.length)
      } else {
        // Wszystkie projekty - bez filtrowania
        console.log('🔍 Wszystkie projekty - bez filtrowania:', filteredKeywords.length)
      }
      
      setKeywords(filteredKeywords)
    } catch (error) {
      console.error('❌ Error loading keywords:', error)
    }
  }

  const addKeyword = async (e) => {
    e.preventDefault()
    if (!newKeyword.trim() || !newMatchValue.trim()) return

    setLoading(true)
    setError('')

    try {
      const payload = {
        userId: user.id,
        keyword: newKeyword.trim(),
        matchType: newMatchType,
        matchValue: newMatchValue.trim(),
        active: true,
        created: new Date().toISOString(),
      }
      
      // Dodaj projectId jeśli wybrano konkretny projekt
      if (selectedProjectId && selectedProjectId !== 'all' && selectedProjectId !== 'none') {
        payload.projectId = selectedProjectId
      }
      
      console.log('Wysyłam do PocketBase:', payload)
      console.log('URL:', `${pocketbaseUrl}/api/collections/keywords/records`)
      console.log('Token:', user.token)
      
      const response = await fetch(`${pocketbaseUrl}/api/collections/keywords/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      })
      
      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (!response.ok) {
        throw new Error('Błąd dodawania słowa kluczowego')
      }

      const newKeywordData = await response.json()
      setKeywords([newKeywordData, ...keywords])
      
      // Invaliduj cache dla keywords
      const cacheKey = `${pocketbaseUrl}/api/collections/keywords/records?sort=-created`
      invalidateCache(cacheKey)
      
      // Reset form
      setNewKeyword('')
      setNewMatchValue('')
      setNewMatchType('title')
    } catch (error) {
      console.error('Szczegółowy błąd dodawania keyword:', error)
      console.error('Response status:', error.status)
      console.error('Response text:', error.responseText)
      
      let errorMessage = 'Błąd dodawania słowa kluczowego'
      if (error.message.includes('404')) {
        errorMessage = 'Collection "keywords" nie istnieje w PocketBase. Zaimportuj schema!'
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Błąd autoryzacji. Zaloguj się ponownie.'
      } else if (error.message.includes('400')) {
        errorMessage = 'Błąd walidacji danych. Sprawdź czy wszystkie pola są wypełnione.'
      }
      
      setError('Błąd: ' + errorMessage + ' (' + error.message + ')')
    } finally {
      setLoading(false)
    }
  }

  const deleteKeyword = async (id) => {
    if (!confirm('Czy na pewno chcesz usunąć to słowo kluczowe?')) return

    try {
      const response = await fetch(`${pocketbaseUrl}/api/collections/keywords/records/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      })

      if (response.ok) {
        setKeywords(keywords.filter(k => k.id !== id))
        // Invaliduj cache dla keywords
        const cacheKey = `${pocketbaseUrl}/api/collections/keywords/records?sort=-created`
        invalidateCache(cacheKey)
      }
    } catch (error) {
      console.error('Error deleting keyword:', error)
    }
  }

  const generateUrls = () => {
    const urls = keywords.map(keyword => {
      const encodedKeyword = encodeURIComponent(keyword.keyword)
      return `https://allegro.pl/listing?string=${encodedKeyword}`
    })
    setGeneratedUrls(urls)
  }

  const copyUrlsToClipboard = () => {
    const urlsText = generatedUrls.join('\n')
    navigator.clipboard.writeText(urlsText)
    alert('Lista URL została skopiowana do schowka!')
  }

  const exportUrls = () => {
    const urlsText = generatedUrls.join('\n')
    const blob = new Blob([urlsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'allegro-urls.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCsvImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setImportLoading(true)
    setImportResults(null)
    setError('')

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      const keywordsToImport = []
      const errors = []
      
      lines.forEach((line, index) => {
        // Obsługa zarówno przecinków jak i tabulatorów jako separatorów
        const separator = line.includes('\t') ? '\t' : ','
        const [keyword, matchType, matchValue] = line.split(separator).map(item => item.trim())
        
        if (!keyword || !matchType || !matchValue) {
          errors.push(`Linia ${index + 1}: Niepełne dane`)
          return
        }
        
        if (!['url', 'title', 'brand'].includes(matchType)) {
          errors.push(`Linia ${index + 1}: Nieprawidłowy typ dopasowania "${matchType}"`)
          return
        }
        
        const keywordData = {
          userId: user.id,
          keyword: keyword,
          matchType: matchType,
          matchValue: matchValue,
          active: true,
          created: new Date().toISOString(),
        }
        
        // Dodaj projectId jeśli wybrano konkretny projekt
        if (selectedProjectId && selectedProjectId !== 'all' && selectedProjectId !== 'none') {
          keywordData.projectId = selectedProjectId
        }
        
        keywordsToImport.push(keywordData)
      })

      // Import keywords
      let successCount = 0
      const importErrors = []

      for (const keywordData of keywordsToImport) {
        try {
          const response = await fetch(`${pocketbaseUrl}/api/collections/keywords/records`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`,
            },
            body: JSON.stringify(keywordData),
          })

          if (response.ok) {
            successCount++
          } else {
            importErrors.push(`Błąd importu "${keywordData.keyword}"`)
          }
        } catch (error) {
          importErrors.push(`Błąd importu "${keywordData.keyword}": ${error.message}`)
        }
      }

      console.log(`📊 Import zakończony: ${successCount}/${keywordsToImport.length} dodano`)
      
      setImportResults({
        total: keywordsToImport.length,
        success: successCount,
        errors: [...errors, ...importErrors]
      })

      // Odśwież listę keywords
      if (successCount > 0) {
        console.log('🔄 Odświeżanie listy keywords po imporcie...')
        // Wyczyść cache używając pełnego URL
        const cacheKey = `${pocketbaseUrl}/api/collections/keywords/records?sort=-created`
        invalidateCache(cacheKey)
        await loadKeywords()
        console.log('✅ Lista keywords odświeżona')
      }

    } catch (error) {
      setError('Błąd czytania pliku CSV: ' + error.message)
    } finally {
      setImportLoading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const downloadCsvTemplate = () => {
    const csvContent = `wosk samochodowy\ttitle\tTurtle Wax
wosk do auta\tbrand\tMeguiars  
oferta specjalna\turl\thttps://allegro.pl/oferta/123456`
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'szablon-keywords.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="project-page">
      <div className="page-header">
        <h2>📋 Projekt - Zarządzanie słowami kluczowymi</h2>
        <p>Dodaj słowa kluczowe i określ kryteria dopasowania dla monitoringu pozycji</p>
      </div>

      {/* Selektor projektów */}
      <div className="project-selector-section">
        <h3>📁 Wybierz projekt</h3>
        <div className="project-selector">
          <label htmlFor="project-select">Filtruj słowa kluczowe według projektu:</label>
          <select
            id="project-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            disabled={loadingProjects}
            className="project-select-dropdown"
          >
            <option value="all">📂 Wszystkie projekty</option>
            <option value="none">📝 Bez przypisanego projektu</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.active ? '🟢' : '🔴'} {project.name}
              </option>
            ))}
          </select>
          
          {selectedProjectId && selectedProjectId !== 'all' && selectedProjectId !== 'none' && (
            <div className="selected-project-info">
              {(() => {
                const project = projects.find(p => p.id === selectedProjectId)
                return project ? (
                  <div className="project-details">
                    <strong>📁 Wybrany projekt:</strong> {project.name}
                    {project.description && <p><em>{project.description}</em></p>}
                  </div>
                ) : null
              })()}
            </div>
          )}
          
          {selectedProjectId === 'none' && (
            <div className="selected-project-info">
              <p><strong>📝 Filtr:</strong> Słowa kluczowe bez przypisanego projektu</p>
              <p><em>Nowe słowa kluczowe będą tworzone bez przypisania do projektu</em></p>
            </div>
          )}
          
          {selectedProjectId && selectedProjectId !== 'all' && (
            <div className="filter-info">
              ℹ️ Nowe słowa kluczowe będą {selectedProjectId === 'none' ? 'bez przypisania do projektu' : 'przypisane do wybranego projektu'}
            </div>
          )}
        </div>
      </div>

      {/* Dodawanie nowego słowa kluczowego */}
      <div className="add-keyword-section">
        <h3>➕ Dodaj nowe słowo kluczowe</h3>
        
        <form onSubmit={addKeyword} className="keyword-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-row">
            <div className="form-group">
              <label>Słowo kluczowe:</label>
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="np. wosk samochodowy"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Typ dopasowania:</label>
              <select
                value={newMatchType}
                onChange={(e) => setNewMatchType(e.target.value)}
                disabled={loading}
              >
                <option value="title">Nazwa produktu</option>
                <option value="brand">Marka</option>
                <option value="url">URL oferty</option>
              </select>
            </div>

            <div className="form-group">
              <label>Wartość do dopasowania:</label>
              <input
                type="text"
                value={newMatchValue}
                onChange={(e) => setNewMatchValue(e.target.value)}
                placeholder={
                  newMatchType === 'title' ? 'np. nazwa produktu' :
                  newMatchType === 'brand' ? 'np. Turtle Wax' :
                  'np. https://allegro.pl/oferta/...'
                }
                required
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading} className="add-btn">
              {loading ? 'Dodawanie...' : 'Dodaj'}
            </button>
          </div>
        </form>
      </div>

      {/* Import masowy CSV - Rozwijana sekcja */}
      <div className="csv-import-section">
        <button 
          className={`csv-import-toggle ${showCsvImport ? 'expanded' : ''}`}
          onClick={() => setShowCsvImport(!showCsvImport)}
        >
          <span className="toggle-icon">{showCsvImport ? '🔽' : '▶️'}</span>
          <span className="toggle-text">📂 Import masowy z pliku CSV</span>
          <span className="toggle-hint">
            {showCsvImport ? 'Kliknij aby zwinąć' : 'Kliknij aby rozwinąć opcje importu'}
          </span>
        </button>
        
        {showCsvImport && (
          <div className="csv-import-content">
            <p>Zaimportuj wiele słów kluczowych jednocześnie z pliku CSV</p>
            
            <div className="csv-format-info">
              <h4>📋 Format pliku CSV:</h4>
              <div className="format-example">
                <code>słowo_kluczowe,typ_dopasowania,wartość_dopasowania</code>
                <br />
                <small>
                  <strong>Typ dopasowania:</strong> <code>title</code> (nazwa produktu), <code>brand</code> (marka), <code>url</code> (adres URL)
                </small>
              </div>
              
              <div className="csv-example">
                <h5>Przykład:</h5>
                <pre>
wosk samochodowy,title,Turtle Wax{'\n'}wosk do auta,brand,Meguiars{'\n'}oferta specjalna,url,https://allegro.pl/oferta/123456
                </pre>
              </div>
              
              <button onClick={downloadCsvTemplate} className="template-btn">
                💾 Pobierz szablon CSV
              </button>
            </div>

            <div className="csv-import-controls">
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvImport}
                disabled={importLoading}
                className="csv-file-input"
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" className={`csv-file-label ${importLoading ? 'disabled' : ''}`}>
                {importLoading ? '📤 Importowanie...' : '📤 Wybierz plik CSV'}
              </label>
            </div>

            {/* Wyniki importu */}
            {importResults && (
              <div className="import-results">
                <h4>📊 Wyniki importu:</h4>
                <div className="import-stats">
                  <div className="stat success">
                    ✅ Zaimportowano: {importResults.success}/{importResults.total}
                  </div>
                  {importResults.errors.length > 0 && (
                    <div className="stat errors">
                      ❌ Błędy: {importResults.errors.length}
                    </div>
                  )}
                </div>
                
                {importResults.errors.length > 0 && (
                  <div className="import-errors">
                    <h5>⚠️ Lista błędów:</h5>
                    <ul>
                      {importResults.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista słów kluczowych */}
      <div className="keywords-section">
        <div className="keywords-header">
          <h3>📝 Lista słów kluczowych ({keywords.length}/1000)</h3>
          <div className="header-controls">
            {keywords.length > itemsPerPage && (
              <div className="pagination-info">
                Strona {currentPage} z {totalPages} (pozycje {startIndex + 1}-{Math.min(endIndex, keywords.length)})
              </div>
            )}
            <button 
              onClick={() => {
                console.log('🔄 Ręczne odświeżanie listy keywords...')
                console.log('👤 User ID:', user.id)
                // Wyczyść cache i przeładuj
                const cacheKey = `${pocketbaseUrl}/api/collections/keywords/records?sort=-created`
                invalidateCache(cacheKey)
                loadKeywords()
              }} 
              className="refresh-btn"
              title="Odśwież listę słów kluczowych"
            >
              🔄 Odśwież
            </button>
          </div>
        </div>
        
        {keywords.length === 0 ? (
          <div className="empty-state">
            <p>Brak słów kluczowych. Dodaj pierwsze słowo kluczowe powyżej.</p>
          </div>
        ) : (
          <>
            <div className="keywords-table">
              <div className="table-header">
                <div>Słowo kluczowe</div>
                <div>Typ dopasowania</div>
                <div>Wartość</div>
                <div>Data dodania</div>
                <div>Akcje</div>
              </div>
              
              {currentKeywords.map((keyword) => (
                <div key={keyword.id} className="table-row">
                  <div className="keyword-cell">{keyword.keyword}</div>
                  <div className="match-type-cell">
                    <span className={`match-type-badge ${keyword.matchType}`}>
                      {keyword.matchType === 'title' ? '📝 Nazwa' :
                       keyword.matchType === 'brand' ? '🏷️ Marka' :
                       '🔗 URL'}
                    </span>
                  </div>
                  <div className="match-value-cell">{keyword.matchValue}</div>
                  <div className="date-cell">
                    {new Date(keyword.created).toLocaleDateString('pl-PL')}
                  </div>
                  <div className="actions-cell">
                    <button onClick={() => deleteKeyword(keyword.id)} className="delete-btn">
                      Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {keywords.length > itemsPerPage && (
              <div className="pagination">
                <button 
                  onClick={() => goToPage(1)} 
                  disabled={currentPage === 1}
                  className="pagination-btn first"
                  title="Pierwsza strona"
                >
                  ««
                </button>
                <button 
                  onClick={() => goToPage(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="pagination-btn prev"
                  title="Poprzednia strona"
                >
                  «
                </button>
                
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNumber
                  if (totalPages <= 5) {
                    pageNumber = i + 1
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i
                  } else {
                    pageNumber = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => goToPage(pageNumber)}
                      className={`pagination-btn page-number ${currentPage === pageNumber ? 'active' : ''}`}
                      title={`Strona ${pageNumber}`}
                    >
                      {pageNumber}
                    </button>
                  )
                })}
                
                <button 
                  onClick={() => goToPage(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="pagination-btn next"
                  title="Następna strona"
                >
                  »
                </button>
                <button 
                  onClick={() => goToPage(totalPages)} 
                  disabled={currentPage === totalPages}
                  className="pagination-btn last"
                  title="Ostatnia strona"
                >
                  »»
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Generowane URL */}
      {generatedUrls.length > 0 && (
        <div className="urls-section">
          <h3>🔗 Lista URL do sprawdzenia we wtyczce ({generatedUrls.length})</h3>
          <p>Skopiuj poniższe URL i wklej do wtyczki Chrome dla zbiorczego sprawdzenia pozycji</p>
          
          <div className="urls-actions">
            <button onClick={copyUrlsToClipboard} className="copy-btn">
              📋 Skopiuj wszystkie URL
            </button>
            <button onClick={exportUrls} className="export-btn">
              💾 Eksportuj do pliku
            </button>
          </div>

          <div className="urls-display-options">
            <div className="url-format-info">
              💡 <strong>Wskazówka:</strong> Możesz zaznaczać tylko URL (bez numerów) - numery są niezbędne w osobnych divach
            </div>
          </div>

          <div className="urls-list">
            {generatedUrls.map((url, index) => (
              <div key={index} className="url-item">
                <div className="url-number">{index + 1}.</div>
                <div className="url-text-container">
                  <code className="url-text" title="Kliknij aby zaznaczyć URL">{url}</code>
                </div>
              </div>
            ))}
          </div>
          
          <div className="urls-textarea-section">
            <h4>📝 Alternatywny format (do zaznaczania)</h4>
            <p>Jeśli chcesz łatwiej zaznaczyć wybrane URL, użyj pola poniżej:</p>
            <textarea 
              className="urls-textarea"
              value={generatedUrls.join('\n')}
              readOnly
              rows={Math.min(10, generatedUrls.length)}
              placeholder="Wygenerowane URL pojawią się tutaj..."
              title="Możesz zaznaczyć wybrane linie z URL"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectPage 