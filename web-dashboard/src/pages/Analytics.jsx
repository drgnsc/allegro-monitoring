import React from 'react'
import { TrendingUp, BarChart3, PieChart, Calendar } from 'lucide-react'

function Analytics() {
  return (
    <div className="analytics">
      <div className="container">
        <h1 style={{ color: 'white', marginBottom: '30px', textAlign: 'center' }}>
          Analityka i Raporty
        </h1>

        {/* Summary Cards */}
        <div className="grid grid-3" style={{ marginBottom: '30px' }}>
          <div className="card text-center">
            <TrendingUp size={48} style={{ color: '#28a745', marginBottom: '10px' }} />
            <div className="stat-value" style={{ color: '#28a745' }}>+15%</div>
            <div className="stat-label">Poprawa pozycji</div>
          </div>
          
          <div className="card text-center">
            <BarChart3 size={48} style={{ color: '#667eea', marginBottom: '10px' }} />
            <div className="stat-value">23</div>
            <div className="stat-label">Produkty w Top 10</div>
          </div>
          
          <div className="card text-center">
            <PieChart size={48} style={{ color: '#ffc107', marginBottom: '10px' }} />
            <div className="stat-value">67%</div>
            <div className="stat-label">Efektywność</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-2" style={{ marginBottom: '30px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Trend Pozycji (30 dni)</h3>
            <div className="chart-container" style={{ 
              background: '#f8f9fa', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#666'
            }}>
              <div style={{ textAlign: 'center' }}>
                <TrendingUp size={64} style={{ marginBottom: '10px' }} />
                <p>Wykres trendu pozycji</p>
                <p style={{ fontSize: '0.9rem' }}>(Chart.js zostanie zintegrowany)</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Rozkład Pozycji</h3>
            <div className="chart-container" style={{ 
              background: '#f8f9fa', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#666'
            }}>
              <div style={{ textAlign: 'center' }}>
                <PieChart size={64} style={{ marginBottom: '10px' }} />
                <p>Wykres kołowy pozycji</p>
                <p style={{ fontSize: '0.9rem' }}>(Chart.js zostanie zintegrowany)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="card">
          <h2 style={{ marginBottom: '20px', color: '#333' }}>
            <Calendar size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
            Insights i Rekomendacje
          </h2>
          
          <div className="grid grid-2">
            <div>
              <h4 style={{ color: '#28a745', marginBottom: '10px' }}>✅ Pozytywne trendy</h4>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                <li>Kategoria "wosk ceramiczny" - poprawa o 3 pozycje</li>
                <li>Produkty premium zyskują na popularności</li>
                <li>Wzrost widoczności w weekendy</li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ color: '#dc3545', marginBottom: '10px' }}>⚠️ Obszary do poprawy</h4>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                <li>Spadek pozycji w kategorii "szczotki"</li>
                <li>Konkurencja w słowach kluczowych premium</li>
                <li>Potrzeba optymalizacji opisów produktów</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-2" style={{ marginTop: '30px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>🏆 Najlepsze Produkty</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Wosk ceramiczny Ceramikker</span>
                <span className="position-badge position-top10">#3</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Płyn do mycia szyb 5L</span>
                <span className="position-badge position-top10">#5</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Pasta polerująca premium</span>
                <span className="position-badge position-top10">#7</span>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 style={{ marginBottom: '15px', color: '#333' }}>📈 Największe Wzrosty</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Płyn do szyb</span>
                <span style={{ color: '#28a745', fontWeight: '600' }}>↗️ +3</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Wosk ceramiczny</span>
                <span style={{ color: '#28a745', fontWeight: '600' }}>↗️ +2</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Szampon pH neutralny</span>
                <span style={{ color: '#28a745', fontWeight: '600' }}>↗️ +1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="card text-center" style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>Eksport Raportów</h3>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn">Raport PDF</button>
            <button className="btn btn-secondary">Excel CSV</button>
            <button className="btn btn-secondary">Raport Miesięczny</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics 