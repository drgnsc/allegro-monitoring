import { useState, useEffect } from 'react'
import '../styles/ChangesPage.css'
import { cachedApiCall } from '../utils/cache'

const ChangesPage = ({ user, pocketbaseUrl }) => {
  const [loading, setLoading] = useState(false)
  const [dateMode, setDateMode] = useState('auto') // 'auto' or 'manual'
  const [currentPeriod, setCurrentPeriod] = useState('')
  const [previousPeriod, setPreviousPeriod] = useState('')
  const [availableDates, setAvailableDates] = useState([])
  const [analysisData, setAnalysisData] = useState(null)
  const [coverageData, setCoverageData] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [showRecommendations, setShowRecommendations] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadAvailableDates()
      loadKeywordDetails()
    }
  }, [user])

  useEffect(() => {
    if (dateMode === 'auto' && availableDates.length >= 2) {
      // Automatycznie ustaw ostatnie 2 daty
      setCurrentPeriod(availableDates[0])
      setPreviousPeriod(availableDates[1])
    }
  }, [dateMode, availableDates])

  useEffect(() => {
    if (currentPeriod && previousPeriod && currentPeriod !== previousPeriod) {
      generateComparison()
    }
  }, [currentPeriod, previousPeriod])

  const loadAvailableDates = async () => {
    try {
      const data = await cachedApiCall(
        `${pocketbaseUrl}/api/collections/positions/records?filter=userId="${user.id}"&fields=date&sort=-date&perPage=50`,
        {
          headers: { 'Authorization': `Bearer ${user.token}` },
          userId: user.id
        },
        5 * 60 * 1000
      )
      
      // Wyciągnij unikalne daty
      const uniqueDates = [...new Set(data.items.map(item => item.date.split('T')[0]))].sort().reverse()
      setAvailableDates(uniqueDates)
      
      console.log(`Loaded ${uniqueDates.length} unique scan dates:`, uniqueDates.slice(0, 5))
    } catch (error) {
      console.error('Error loading available dates:', error)
    }
  }

  const loadKeywordDetails = async () => {
    try {
      const data = await cachedApiCall(
        `${pocketbaseUrl}/api/collections/keywords/records?filter=userId="${user.id}"&fields=keyword,matchType,matchValue&perPage=500`,
        {
          headers: { 'Authorization': `Bearer ${user.token}` },
          userId: user.id
        },
        5 * 60 * 1000
      )
      
      // Utwórz mapę słów kluczowych dla łatwego dostępu
      const keywordMap = {}
      data.items.forEach(item => {
        keywordMap[item.keyword] = {
          matchType: item.matchType,
          matchValue: item.matchValue
        }
      })
      
      // Zapisz globalnie dla dostępu w eksporcie
      window.keywordDetailsMap = keywordMap
      console.log(`Loaded ${data.items.length} keyword configurations`)
      
    } catch (error) {
      console.error('Error loading keyword details:', error)
      window.keywordDetailsMap = {}
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

  const generateComparison = async () => {
    setLoading(true)
    try {
      console.log(`🔄 Generating comparison: ${currentPeriod} vs ${previousPeriod}`)
      
      // Sprawdź czy mamy załadowane konfiguracje słów kluczowych
      const keywordConfigCount = Object.keys(window.keywordDetailsMap || {}).length
      console.log(`📋 Loaded ${keywordConfigCount} keyword configurations`)
      if (keywordConfigCount === 0) {
        console.warn('⚠️ No keyword configurations found - will use fallback matching')
      }
      
      // Pobierz dane dla obu okresów
      const [currentData, previousData] = await Promise.all([
        fetchPeriodData(currentPeriod),
        fetchPeriodData(previousPeriod)
      ])

      console.log(`Current period: ${currentData.length} records, Previous period: ${previousData.length} records`)

      // Analiza pokrycia słów kluczowych
      const coverage = analyzeCoverage(currentData, previousData)
      setCoverageData(coverage)

      // Porównanie zmian pozycji
      const analysis = analyzePositionChanges(currentData, previousData)
      setAnalysisData(analysis)

      // Generuj rekomendacje URL
      const urlRecommendations = await generateUrlRecommendations()
      setRecommendations(urlRecommendations)

    } catch (error) {
      console.error('Error generating comparison:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPeriodData = async (date) => {
    const data = await cachedApiCall(
      `${pocketbaseUrl}/api/collections/positions/records?filter=userId="${user.id}"&&date="${date}"&sort=-date`,
      {
        headers: { 'Authorization': `Bearer ${user.token}` },
        userId: user.id
      },
      2 * 60 * 1000
    )
    return data.items
  }

  const analyzeCoverage = (currentData, previousData) => {
    const currentKeywords = new Set(currentData.map(item => item.keyword))
    const previousKeywords = new Set(previousData.map(item => item.keyword))
    const commonKeywords = new Set([...currentKeywords].filter(k => previousKeywords.has(k)))
    
    const totalKeywords = new Set([...currentKeywords, ...previousKeywords]).size
    const coveragePercentage = totalKeywords > 0 ? Math.round((commonKeywords.size / totalKeywords) * 100) : 0
    
    return {
      current: currentKeywords.size,
      previous: previousKeywords.size,
      common: commonKeywords.size,
      total: totalKeywords,
      coveragePercentage,
      onlyInCurrent: currentKeywords.size - commonKeywords.size,
      onlyInPrevious: previousKeywords.size - commonKeywords.size
    }
  }

  const analyzePositionChanges = (currentData, previousData) => {
    // Mapuj dane według słów kluczowych
    const currentMap = new Map()
    const previousMap = new Map()

    currentData.forEach(record => {
      if (!currentMap.has(record.keyword)) {
        currentMap.set(record.keyword, [])
      }
      if (record.products) {
        record.products.forEach(product => {
          if (product.position && parseInt(product.position) > 0 && productMatchesKeyword(product, record.keyword)) {
            currentMap.get(record.keyword).push({
              ...product,
              position: parseInt(product.position)
            })
          }
        })
      }
    })

    previousData.forEach(record => {
      if (!previousMap.has(record.keyword)) {
        previousMap.set(record.keyword, [])
      }
      if (record.products) {
        record.products.forEach(product => {
          if (product.position && parseInt(product.position) > 0 && productMatchesKeyword(product, record.keyword)) {
            previousMap.get(record.keyword).push({
              ...product,
              position: parseInt(product.position)
            })
          }
        })
      }
    })

    // Analiza zmian dla wspólnych słów kluczowych
    const changes = []
    const productChanges = []

    currentMap.forEach((currentProducts, keyword) => {
      if (previousMap.has(keyword)) {
        const previousProducts = previousMap.get(keyword)
        
        // Oblicz statystyki pozycji
        const currentPositions = currentProducts.map(p => p.position).sort((a, b) => a - b)
        const previousPositions = previousProducts.map(p => p.position).sort((a, b) => a - b)
        
        const currentBest = currentPositions[0]
        const currentWorst = currentPositions[currentPositions.length - 1]
        const currentAvg = currentPositions.reduce((sum, pos) => sum + pos, 0) / currentPositions.length
        
        const previousBest = previousPositions[0]
        const previousWorst = previousPositions[previousPositions.length - 1]
        const previousAvg = previousPositions.reduce((sum, pos) => sum + pos, 0) / previousPositions.length
        
        // Zmiana pozycji na podstawie najlepszej pozycji (bardziej znacząca)
        const positionChange = previousBest - currentBest // Pozytywna wartość = poprawa najlepszej pozycji
        const avgPositionChange = previousAvg - currentAvg // Zmiana średniej pozycji

        changes.push({
          keyword,
          currentBest,
          currentWorst,
          currentAvg: Math.round(currentAvg * 10) / 10,
          previousBest,
          previousWorst,
          previousAvg: Math.round(previousAvg * 10) / 10,
          positionChange, // Zmiana najlepszej pozycji
          avgPositionChange: Math.round(avgPositionChange * 10) / 10,
          currentCount: currentProducts.length,
          previousCount: previousProducts.length,
          currentProducts,
          previousProducts
        })

        // Analiza zmian na poziomie produktów
        currentProducts.forEach(currentProduct => {
          const matchingPreviousProduct = previousProducts.find(p => 
            p.title === currentProduct.title || p.url === currentProduct.url
          )
          if (matchingPreviousProduct) {
            const change = matchingPreviousProduct.position - currentProduct.position
            productChanges.push({
              keyword,
              title: currentProduct.title,
              currentPosition: currentProduct.position,
              previousPosition: matchingPreviousProduct.position,
              change,
              url: currentProduct.url,
              price: currentProduct.price,
              rating: currentProduct.rating
            })
          }
        })
      }
    })

    // Sortuj zmiany
    const sortedChanges = changes.sort((a, b) => Math.abs(b.positionChange) - Math.abs(a.positionChange))
    const improvements = changes.filter(c => c.positionChange > 0).sort((a, b) => b.positionChange - a.positionChange)
    const declines = changes.filter(c => c.positionChange < 0).sort((a, b) => a.positionChange - b.positionChange)
    
    // Produkty z największymi zmianami
    const productImprovements = productChanges.filter(c => c.change > 0).sort((a, b) => b.change - a.change)
    const productDeclines = productChanges.filter(c => c.change < 0).sort((a, b) => a.change - b.change)

    // Agreguj produkty według częstości występowania
    const productFrequency = new Map()
    productChanges.forEach(change => {
      const key = change.title || change.url
      if (!productFrequency.has(key)) {
        productFrequency.set(key, {
          title: change.title,
          url: change.url,
          price: change.price,
          rating: change.rating,
          keywords: [],
          totalPositions: 0,
          averagePosition: 0
        })
      }
      const product = productFrequency.get(key)
      product.keywords.push(change.keyword)
      product.totalPositions += change.currentPosition
    })

    const topProducts = Array.from(productFrequency.values())
      .map(product => ({
        ...product,
        frequency: product.keywords.length,
        averagePosition: Math.round(product.totalPositions / product.keywords.length * 10) / 10
      }))
      .filter(product => product.frequency >= 2)
      .sort((a, b) => b.frequency - a.frequency)

    return {
      allChanges: sortedChanges,
      improvements: improvements.slice(0, 5),
      declines: declines.slice(0, 5),
      productImprovements: productImprovements.slice(0, 5),
      productDeclines: productDeclines.slice(0, 5),
      topProducts: topProducts.slice(0, 10),
      summary: {
        totalCompared: changes.length,
        improved: improvements.length,
        declined: declines.length,
        unchanged: changes.filter(c => c.positionChange === 0).length
      }
    }
  }

  const generateUrlRecommendations = async () => {
    if (!coverageData || !analysisData) return []
    
    const recommendations = []
    
    // 1. URL dla słów kluczowych tylko z jednego okresu
    const currentKeywords = new Set()
    const previousKeywords = new Set()
    
    // Pobierz wszystkie słowa kluczowe z obu okresów
    try {
      const [currentData, previousData] = await Promise.all([
        fetchPeriodData(currentPeriod),
        fetchPeriodData(previousPeriod)
      ])
      
      currentData.forEach(record => currentKeywords.add(record.keyword))
      previousData.forEach(record => previousKeywords.add(record.keyword))
      
      // Znajdź słowa kluczowe tylko w jednym okresie
      const onlyInCurrent = [...currentKeywords].filter(k => !previousKeywords.has(k))
      const onlyInPrevious = [...previousKeywords].filter(k => !currentKeywords.has(k))
      
      // Generuj URL dla brakujących słów kluczowych
      if (onlyInCurrent.length > 0) {
        const urls = onlyInCurrent.map(keyword => 
          `https://allegro.pl/kategoria/motoryzacja?string=${encodeURIComponent(keyword)}&order=n`
        )
        recommendations.push({
          type: 'missing_previous',
          title: `Brakujące dane dla ${onlyInCurrent.length} słów kluczowych z okresu ${previousPeriod}`,
          description: `Te słowa kluczowe mają dane tylko w okresie ${currentPeriod}. Sprawdź je dla${previousPeriod} aby uzyskać pełne porównanie.`,
          keywords: onlyInCurrent,
          urls: urls,
          priority: 'high'
        })
      }
      
      if (onlyInPrevious.length > 0) {
        const urls = onlyInPrevious.map(keyword => 
          `https://allegro.pl/kategoria/motoryzacja?string=${encodeURIComponent(keyword)}&order=n`
        )
        recommendations.push({
          type: 'missing_current',
          title: `Brakujące dane dla ${onlyInPrevious.length} słów kluczowych z okresu ${currentPeriod}`,
          description: `Te słowa kluczowe mają dane tylko w okresie ${previousPeriod}. Sprawdź je dla ${currentPeriod} aby uzyskać pełne porównanie.`,
          keywords: onlyInPrevious,
          urls: urls,
          priority: 'high'
        })
      }
      
      // 2. Rekomendacje na podstawie słabych pozycji
      const weakPositions = analysisData.allChanges
        .filter(change => change.currentBest > 20) // Pozycje gorsze niż 20
        .slice(0, 10)
        
      if (weakPositions.length > 0) {
        const urls = weakPositions.map(change => 
          `https://allegro.pl/kategoria/motoryzacja?string=${encodeURIComponent(change.keyword)}&order=n`
        )
        recommendations.push({
          type: 'weak_positions',
          title: `Słowa kluczowe wymagające uwagi (${weakPositions.length})`,
          description: `Te słowa kluczowe mają słabe pozycje (>20). Warto je sprawdzić ponownie.`,
          keywords: weakPositions.map(c => c.keyword),
          urls: urls,
          priority: 'medium'
        })
      }
      
      // 3. Rekomendacje na podstawie spadków
      const majorDeclines = analysisData.declines
        .filter(change => change.positionChange < -5) // Spadki większe niż 5 pozycji
        .slice(0, 10)
        
      if (majorDeclines.length > 0) {
        const urls = majorDeclines.map(change => 
          `https://allegro.pl/kategoria/motoryzacja?string=${encodeURIComponent(change.keyword)}&order=n`
        )
        recommendations.push({
          type: 'major_declines',
          title: `Słowa kluczowe z dużymi spadkami (${majorDeclines.length})`,
          description: `Te słowa kluczowe straciły ponad 5 pozycji. Sprawdź je ponownie.`,
          keywords: majorDeclines.map(c => c.keyword),
          urls: urls,
          priority: 'high'
        })
      }
      
    } catch (error) {
      console.error('Error generating recommendations:', error)
    }
    
    return recommendations
  }

  const getCoverageColor = (percentage) => {
    if (percentage >= 90) return '#22c55e' // green
    if (percentage >= 80) return '#84cc16' // lime  
    if (percentage >= 70) return '#eab308' // yellow
    if (percentage >= 60) return '#f97316' // orange
    return '#ef4444' // red
  }

  const renderCoverageAnalysis = () => {
    if (!coverageData) return null

    return (
      <div className="coverage-analysis">
        <h3>📊 Analiza pokrycia słów kluczowych</h3>
        
        <div className="coverage-summary">
          <div className="coverage-card main-coverage">
            <div 
              className="coverage-percentage"
              style={{ color: getCoverageColor(coverageData.coveragePercentage) }}
            >
              {coverageData.coveragePercentage}%
            </div>
            <div className="coverage-label">Pokrycie danych</div>
            <div className="coverage-description">
              {coverageData.common} z {coverageData.total} słów kluczowych ma dane w obu okresach
            </div>
          </div>

          <div className="coverage-details">
            <div className="coverage-item">
              <span className="coverage-number">{coverageData.current}</span>
              <span className="coverage-text">Słowa w okresie bieżącym</span>
            </div>
            <div className="coverage-item">
              <span className="coverage-number">{coverageData.previous}</span>
              <span className="coverage-text">Słowa w okresie poprzednim</span>
            </div>
            <div className="coverage-item">
              <span className="coverage-number">{coverageData.common}</span>
              <span className="coverage-text">Słowa wspólne</span>
            </div>
          </div>
        </div>

        {(coverageData.onlyInCurrent > 0 || coverageData.onlyInPrevious > 0) && (
          <div className="coverage-differences">
            {coverageData.onlyInCurrent > 0 && (
              <div className="coverage-diff">
                <span className="diff-number">+{coverageData.onlyInCurrent}</span>
                <span className="diff-text">nowych słów w bieżącym okresie</span>
              </div>
            )}
            {coverageData.onlyInPrevious > 0 && (
              <div className="coverage-diff">
                <span className="diff-number">-{coverageData.onlyInPrevious}</span>
                <span className="diff-text">słów usuniętych z poprzedniego okresu</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderPositionChanges = () => {
    if (!analysisData) return null

    return (
      <div className="position-changes">
        <h3>📈 Analiza zmian pozycji</h3>
        
        <div className="changes-summary">
          <div className="summary-card improved">
            <div className="summary-number">{analysisData.summary.improved}</div>
            <div className="summary-label">Poprawione pozycje</div>
          </div>
          <div className="summary-card declined">
            <div className="summary-number">{analysisData.summary.declined}</div>
            <div className="summary-label">Pogorszone pozycje</div>
          </div>
          <div className="summary-card unchanged">
            <div className="summary-number">{analysisData.summary.unchanged}</div>
            <div className="summary-label">Bez zmian</div>
          </div>
        </div>

        {/* Top 5 największych popraw */}
        {analysisData.improvements.length > 0 && (
          <div className="top-changes improvements">
            <h4>🎯 Top 5 największych popraw pozycji</h4>
            <div className="changes-list">
              {analysisData.improvements.map((change, index) => (
                <div key={index} className="change-item improvement">
                  <div className="change-rank">#{index + 1}</div>
                  <div className="change-content">
                    <div className="change-keyword">{change.keyword}</div>
                    <div className="change-details">
                      <span className="position-change positive">
                        +{change.positionChange} pozycji
                      </span>
                      <span className="position-info">
                        Najlepsza: {change.previousBest} → {change.currentBest}
                      </span>
                      <span className="position-extra">
                        Śr: {change.previousAvg} → {change.currentAvg} 
                        ({change.currentCount} prod.)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top 5 największych spadków */}
        {analysisData.declines.length > 0 && (
          <div className="top-changes declines">
            <h4>📉 Top 5 największych spadków pozycji</h4>
            <div className="changes-list">
              {analysisData.declines.map((change, index) => (
                <div key={index} className="change-item decline">
                  <div className="change-rank">#{index + 1}</div>
                  <div className="change-content">
                    <div className="change-keyword">{change.keyword}</div>
                    <div className="change-details">
                      <span className="position-change negative">
                        {change.positionChange} pozycji
                      </span>
                      <span className="position-info">
                        Najlepsza: {change.previousBest} → {change.currentBest}
                      </span>
                      <span className="position-extra">
                        Śr: {change.previousAvg} → {change.currentAvg} 
                        ({change.currentCount} prod.)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderTopProducts = () => {
    if (!analysisData?.topProducts?.length) return null

    return (
      <div className="top-products">
        <h3>🏆 Najczęściej pojawiające się produkty</h3>
        <div className="products-list">
          {analysisData.topProducts.map((product, index) => (
            <div key={index} className="product-item">
              <div className="product-rank">#{index + 1}</div>
              <div className="product-content">
                <div className="product-title">
                  <a href={product.url} target="_blank" rel="noopener noreferrer">
                    {product.title?.substring(0, 60)}...
                  </a>
                </div>
                <div className="product-stats">
                  <span className="stat">
                    <strong>{product.frequency}</strong> słów kluczowych
                  </span>
                  <span className="stat">
                    Śr. pozycja: <strong>{product.averagePosition}</strong>
                  </span>
                  {product.rating && (
                    <span className="stat">
                      ⭐ <strong>{product.rating}</strong>
                    </span>
                  )}
                  {product.price && (
                    <span className="stat">
                      <strong>{product.price}</strong>
                    </span>
                  )}
                </div>
                <div className="product-keywords">
                  {product.keywords.slice(0, 3).map((kw, i) => (
                    <span key={i} className="keyword-tag">{kw}</span>
                  ))}
                  {product.keywords.length > 3 && (
                    <span className="keyword-more">+{product.keywords.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
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

  const exportChangesReport = () => {
    if (!analysisData) return

    const headers = [
      'Słowo kluczowe',
      'Klucz wyszukiwania',
      'Dopasowany produkt',
      'Pozycja w ostatnim skanowaniu',
      'Pozycja w poprzednim skanowaniu',
      'Zmiana pozycji',
      'Data ostatniego skanowania',
      'Data poprzedniego skanowania'
    ]
    
    // Zbierz wszystkie produkty które zostały dopasowane w obu okresach
    const productRows = []
    
    analysisData.allChanges.forEach(keywordData => {
      // Znajdź klucz wyszukiwania dla tego słowa kluczowego
      const searchKey = window.keywordDetailsMap?.[keywordData.keyword]?.matchValue || keywordData.keyword
      
      // Debug: sprawdź czy mamy właściwy klucz wyszukiwania
      if (window.keywordDetailsMap?.[keywordData.keyword]) {
        console.log(`✅ Found search key for "${keywordData.keyword}": "${searchKey}"`)
      } else {
        console.log(`⚠️ No search key found for "${keywordData.keyword}", using keyword as fallback`)
      }
      
      // Dopasuj produkty między okresami - tylko te które faktycznie pasują do słowa kluczowego
      keywordData.currentProducts.forEach(currentProduct => {
        // Dodatkowa weryfikacja na etapie eksportu
        if (!productMatchesKeyword(currentProduct, keywordData.keyword)) {
          console.log(`❌ EXPORT: Product "${currentProduct.title?.substring(0, 50)}" does NOT match keyword "${keywordData.keyword}"`)
          return
        }
        
        const matchingPreviousProduct = keywordData.previousProducts.find(p => 
          (p.title === currentProduct.title || p.url === currentProduct.url) &&
          productMatchesKeyword(p, keywordData.keyword) // Sprawdź również poprzedni produkt
        )
        
        if (matchingPreviousProduct) {
          const positionChange = matchingPreviousProduct.position - currentProduct.position
          const changeString = positionChange > 0 ? `+${positionChange}` : positionChange.toString()
          
          // Debug: sprawdź zgodność produktu z słowem kluczowym
          console.log(`✅ EXPORT: Keyword="${keywordData.keyword}", SearchKey="${searchKey}", Product="${currentProduct.title?.substring(0, 50)}"`)
          
          productRows.push([
            keywordData.keyword,
            searchKey,
            currentProduct.title || 'Brak tytułu', // Pełny tytuł bez skracania
            currentProduct.position,
            matchingPreviousProduct.position,
            changeString,
            currentPeriod,
            previousPeriod
          ])
        }
      })
    })
    
    // Sortuj według zmian pozycji (największe poprawy na górze)
    productRows.sort((a, b) => {
      const changeA = parseInt(a[5].replace('+', ''))
      const changeB = parseInt(b[5].replace('+', ''))
      return changeB - changeA
    })
    
    downloadCSV([headers, ...productRows], `zmiany_produktow_${currentPeriod}_vs_${previousPeriod}.csv`)
  }

  const renderSimpleChart = (data, title) => {
    if (!data || data.length === 0) return null

    const maxValue = Math.max(...data.map(item => Math.abs(item.value)))
    
    return (
      <div className="simple-chart">
        <h4>{title}</h4>
        <div className="chart-bars">
          {data.slice(0, 5).map((item, index) => (
            <div key={index} className="chart-bar-container">
              <div className="chart-label">{item.label}</div>
              <div className="chart-bar-wrapper">
                <div 
                  className={`chart-bar ${item.value > 0 ? 'positive' : 'negative'}`}
                  style={{ 
                    width: `${(Math.abs(item.value) / maxValue) * 100}%`,
                    minWidth: '2px'
                  }}
                ></div>
                <span className="chart-value">
                  {item.value > 0 ? '+' : ''}{item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderTrendAnalysis = () => {
    if (!analysisData) return null

    const improvementData = analysisData.improvements.map(change => ({
      label: change.keyword.substring(0, 20) + (change.keyword.length > 20 ? '...' : ''),
      value: change.positionChange
    }))

    const declineData = analysisData.declines.map(change => ({
      label: change.keyword.substring(0, 20) + (change.keyword.length > 20 ? '...' : ''),
      value: change.positionChange
    }))

    return (
      <div className="trend-analysis">
        <h3>📈 Wizualizacja zmian</h3>
        
        <div className="charts-container">
          {improvementData.length > 0 && renderSimpleChart(improvementData, "🎯 Największe poprawy pozycji")}
          {declineData.length > 0 && renderSimpleChart(declineData, "📉 Największe spadki pozycji")}
        </div>

        {/* Podsumowanie statystyk */}
        <div className="trend-summary">
          <div className="trend-stat">
            <span className="trend-icon">📊</span>
            <div className="trend-content">
              <div className="trend-number">{analysisData.summary.totalCompared}</div>
              <div className="trend-label">Słów kluczowych porównane</div>
            </div>
          </div>
          <div className="trend-stat">
            <span className="trend-icon">⚖️</span>
            <div className="trend-content">
              <div className="trend-number">
                {analysisData.summary.totalCompared > 0 
                  ? Math.round((analysisData.summary.improved / analysisData.summary.totalCompared) * 100)
                  : 0}%
              </div>
              <div className="trend-label">Wskaźnik poprawy</div>
            </div>
          </div>
          <div className="trend-stat">
            <span className="trend-icon">🎯</span>
            <div className="trend-content">
              <div className="trend-number">
                {analysisData.improvements.length > 0 
                  ? Math.round(analysisData.improvements[0].positionChange * 10) / 10
                  : 0}
              </div>
              <div className="trend-label">Najlepsza poprawa</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderUrlRecommendations = () => {
    if (!recommendations || recommendations.length === 0) return null

    const copyUrlsToClipboard = (urls) => {
      navigator.clipboard.writeText(urls.join('\n'))
      alert('URL skopiowane do schowka!')
    }

    const getPriorityIcon = (priority) => {
      switch (priority) {
        case 'high': return '🔴'
        case 'medium': return '🟡'
        case 'low': return '🟢'
        default: return '⚪'
      }
    }

    const getPriorityClass = (priority) => {
      switch (priority) {
        case 'high': return 'priority-high'
        case 'medium': return 'priority-medium'
        case 'low': return 'priority-low'
        default: return 'priority-default'
      }
    }

    return (
      <div className="url-recommendations">
        <div className="recommendations-header">
          <h3>🎯 Rekomendacje URL do sprawdzenia</h3>
          <button 
            className="toggle-recommendations"
            onClick={() => setShowRecommendations(!showRecommendations)}
          >
            {showRecommendations ? '🔼 Zwiń' : '🔽 Rozwiń'} ({recommendations.length})
          </button>
        </div>

        {showRecommendations && (
          <div className="recommendations-content">
            <div className="recommendations-intro">
              <p>
                💡 Na podstawie analizy znaleźliśmy {recommendations.length} rekomendacji URL do sprawdzenia 
                dla uzupełnienia brakujących danych lub ponownej weryfikacji pozycji.
              </p>
            </div>

            {recommendations.map((rec, index) => (
              <div key={index} className={`recommendation-card ${getPriorityClass(rec.priority)}`}>
                <div className="recommendation-header">
                  <span className="recommendation-priority">{getPriorityIcon(rec.priority)}</span>
                  <h4>{rec.title}</h4>
                </div>
                
                <div className="recommendation-description">
                  {rec.description}
                </div>

                <div className="recommendation-keywords">
                  <strong>Słowa kluczowe ({rec.keywords.length}):</strong>
                  <div className="keywords-list">
                    {rec.keywords.slice(0, 10).map((keyword, i) => (
                      <span key={i} className="keyword-tag">{keyword}</span>
                    ))}
                    {rec.keywords.length > 10 && (
                      <span className="keyword-tag more">+{rec.keywords.length - 10} więcej</span>
                    )}
                  </div>
                </div>

                <div className="recommendation-actions">
                  <button 
                    onClick={() => copyUrlsToClipboard(rec.urls)}
                    className="copy-urls-btn"
                  >
                    📋 Skopiuj URL ({rec.urls.length})
                  </button>
                  
                  <details className="urls-details">
                    <summary>🔗 Pokaż wszystkie URL</summary>
                    <div className="urls-list-container">
                      {rec.urls.map((url, i) => (
                        <div key={i} className="url-item-small">
                          <span className="url-number">{i + 1}.</span>
                          <code className="url-code">{url}</code>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="changes-page">
      <div className="page-header">
        <h2>📊 Analiza zmian pozycji</h2>
        <p>Porównanie wyników między różnymi okresami skanowania</p>
      </div>

      {/* Kontrole wyboru daty */}
      <div className="period-controls">
        <div className="period-mode">
          <h4>📅 Wybór okresów</h4>
          <div className="mode-selector">
            <label>
              <input 
                type="radio" 
                value="auto" 
                checked={dateMode === 'auto'}
                onChange={(e) => setDateMode(e.target.value)}
              />
              Automatycznie (ostatnie 2 skany)
            </label>
            <label>
              <input 
                type="radio" 
                value="manual" 
                checked={dateMode === 'manual'}
                onChange={(e) => setDateMode(e.target.value)}
              />
              Wybór ręczny
            </label>
          </div>
        </div>

        <div className="period-selection">
          <div className="period-input">
            <label>Okres bieżący:</label>
            <select 
              value={currentPeriod} 
              onChange={(e) => setCurrentPeriod(e.target.value)}
              disabled={dateMode === 'auto'}
            >
              <option value="">Wybierz datę</option>
              {availableDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
          <div className="period-input">
            <label>Okres poprzedni:</label>
            <select 
              value={previousPeriod} 
              onChange={(e) => setPreviousPeriod(e.target.value)}
              disabled={dateMode === 'auto'}
            >
              <option value="">Wybierz datę</option>
              {availableDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
        </div>

        {currentPeriod && previousPeriod && currentPeriod !== previousPeriod && (
          <div className="comparison-info">
            Porównujesz: <strong>{currentPeriod}</strong> vs <strong>{previousPeriod}</strong>
            {analysisData && (
              <div className="export-controls">
                <button onClick={exportChangesReport} className="export-btn">
                  💾 Eksportuj analizę (CSV)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wyniki analizy */}
      <div className="analysis-content">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            Generowanie analizy porównawczej...
          </div>
        ) : !currentPeriod || !previousPeriod ? (
          <div className="empty-state">
            <h3>📊 Wybierz okresy do porównania</h3>
            <p>Dla automatycznej analizy potrzebne są co najmniej 2 różne daty skanowania.</p>
          </div>
        ) : currentPeriod === previousPeriod ? (
          <div className="empty-state">
            <h3>⚠️ Wybierz różne okresy</h3>
            <p>Aby porównać dane, wybierz dwie różne daty skanowania.</p>
          </div>
        ) : (
          <>
            {renderCoverageAnalysis()}
            {renderUrlRecommendations()}
            {renderPositionChanges()}
            {renderTopProducts()}
            {renderTrendAnalysis()}
          </>
        )}
      </div>
    </div>
  )
}

export default ChangesPage 