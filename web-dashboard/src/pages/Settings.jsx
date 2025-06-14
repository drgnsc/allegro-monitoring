import React, { useState } from 'react'
import { Settings as SettingsIcon, Save, RefreshCw, Database, Bell, Shield } from 'lucide-react'

function Settings() {
  const [settings, setSettings] = useState({
    apiUrl: 'http://localhost:8090',
    email: 'test@allegro-monitor.com',
    autoScan: true,
    scanInterval: 30,
    notifications: true,
    notificationEmail: true,
    notificationBrowser: false,
    positionThreshold: 50,
    exportFormat: 'csv'
  })

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveSettings = () => {
    console.log('Saving settings:', settings)
    // Here would be the actual save logic
    alert('Ustawienia zapisane!')
  }

  const handleTestConnection = () => {
    console.log('Testing connection to:', settings.apiUrl)
    alert('Testowanie połączenia...')
  }

  return (
    <div className="settings">
      <div className="container">
        <h1 style={{ color: 'white', marginBottom: '30px', textAlign: 'center' }}>
          Ustawienia Systemu
        </h1>

        <div className="grid grid-2">
          {/* Database Settings */}
          <div className="card">
            <h3 style={{ marginBottom: '20px', color: '#333' }}>
              <Database size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
              Połączenie z Bazą Danych
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                URL PocketBase
              </label>
              <input
                type="text"
                value={settings.apiUrl}
                onChange={(e) => handleInputChange('apiUrl', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
                placeholder="http://localhost:8090"
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                Email użytkownika
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
                placeholder="your@email.com"
              />
            </div>
            
            <button className="btn btn-secondary" onClick={handleTestConnection}>
              <RefreshCw size={16} style={{ marginRight: '5px' }} />
              Testuj Połączenie
            </button>
          </div>

          {/* Scanning Settings */}
          <div className="card">
            <h3 style={{ marginBottom: '20px', color: '#333' }}>
              <SettingsIcon size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
              Ustawienia Skanowania
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#333' }}>
                <input
                  type="checkbox"
                  checked={settings.autoScan}
                  onChange={(e) => handleInputChange('autoScan', e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                Automatyczne skanowanie
              </label>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                Interwał skanowania (minuty)
              </label>
              <input
                type="number"
                value={settings.scanInterval}
                onChange={(e) => handleInputChange('scanInterval', parseInt(e.target.value))}
                min="10"
                max="1440"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              />
              <small style={{ color: '#666', fontSize: '0.8rem' }}>
                Minimum 10 minut (rekomendowane: 30-60 minut)
              </small>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                Próg alertu pozycji
              </label>
              <input
                type="number"
                value={settings.positionThreshold}
                onChange={(e) => handleInputChange('positionThreshold', parseInt(e.target.value))}
                min="1"
                max="100"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              />
              <small style={{ color: '#666', fontSize: '0.8rem' }}>
                Powiadomienia gdy pozycja spadnie poniżej tego progu
              </small>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="card">
            <h3 style={{ marginBottom: '20px', color: '#333' }}>
              <Bell size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
              Powiadomienia
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#333' }}>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleInputChange('notifications', e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                Włącz powiadomienia
              </label>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#333' }}>
                <input
                  type="checkbox"
                  checked={settings.notificationEmail}
                  onChange={(e) => handleInputChange('notificationEmail', e.target.checked)}
                  disabled={!settings.notifications}
                  style={{ transform: 'scale(1.2)' }}
                />
                Powiadomienia email
              </label>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#333' }}>
                <input
                  type="checkbox"
                  checked={settings.notificationBrowser}
                  onChange={(e) => handleInputChange('notificationBrowser', e.target.checked)}
                  disabled={!settings.notifications}
                  style={{ transform: 'scale(1.2)' }}
                />
                Powiadomienia w przeglądarce
              </label>
            </div>
          </div>

          {/* Export Settings */}
          <div className="card">
            <h3 style={{ marginBottom: '20px', color: '#333' }}>
              <Shield size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
              Eksport i Bezpieczeństwo
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', color: '#333' }}>
                Format eksportu
              </label>
              <select
                value={settings.exportFormat}
                onChange={(e) => handleInputChange('exportFormat', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                <option value="csv">CSV</option>
                <option value="xlsx">Excel (XLSX)</option>
                <option value="json">JSON</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ color: '#333', marginBottom: '10px' }}>Bezpieczeństwo</h4>
              <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: '1.5' }}>
                Wszystkie dane są przechowywane lokalnie w PocketBase. 
                Żadne dane nie są wysyłane do zewnętrznych serwerów.
              </p>
            </div>
            
            <button className="btn btn-secondary">
              Eksportuj Wszystkie Dane
            </button>
          </div>
        </div>

        {/* Status Information */}
        <div className="card" style={{ marginTop: '30px' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>Status Systemu</h3>
          <div className="grid grid-3">
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#28a745', fontSize: '1.2rem', fontWeight: '600' }}>
                ✅ Aktywny
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Extension Status
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#28a745', fontSize: '1.2rem', fontWeight: '600' }}>
                ✅ Połączony
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                PocketBase DB
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffc107', fontSize: '1.2rem', fontWeight: '600' }}>
                ⏳ Oczekuje
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Następny Skan
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button className="btn" onClick={handleSaveSettings} style={{ padding: '15px 40px', fontSize: '1.1rem' }}>
            <Save size={20} style={{ marginRight: '10px' }} />
            Zapisz Ustawienia
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings 