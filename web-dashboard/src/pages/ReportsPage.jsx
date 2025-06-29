import { useState } from 'react'
import '../styles/ReportsPage.css'

const ReportsPage = ({ user, pocketbaseUrl }) => {
  return (
    <div className="reports-page">
      <div className="page-header">
        <h2>📊 Raporty</h2>
        <p>Analiza i agregacja danych z monitoringu pozycji</p>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-content">
          <h3>🚧 Sekcja w budowie</h3>
          <p>Ta funkcjonalność zostanie wkrótce dodana. Obejmie:</p>
          <ul>
            <li>📈 Agregację wyników z różnych dat</li>
            <li>🎯 Analizę pozycji dla kryteriów dopasowania</li>
            <li>📋 Zaawansowane raporty tabelaryczne</li>
            <li>💾 Eksport do CSV z trendem pozycji</li>
            <li>🔍 Sortowanie i filtrowanie danych</li>
          </ul>
          
          <p><strong>💡 Tymczasowo:</strong> Użyj zakładki "Ostatnie wyniki" do przeglądania i eksportowania danych.</p>
        </div>
      </div>
    </div>
  )
}

export default ReportsPage 