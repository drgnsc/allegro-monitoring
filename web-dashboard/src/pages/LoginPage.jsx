import { useState } from 'react'
import '../styles/LoginPage.css'

const LoginPage = ({ onLogin, pocketbaseUrl }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Próba logowania na:', `${pocketbaseUrl}/api/collections/users/auth-with-password`)
      
      const response = await fetch(`${pocketbaseUrl}/api/collections/users/auth-with-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identity: email,
          password: password,
        }),
      })

      console.log('Odpowiedź serwera:', response.status, response.statusText)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          console.error('Nie można sparsować błędu:', parseError)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Logowanie udane:', data.record.email)
      
      onLogin({
        id: data.record.id,
        email: data.record.email,
        token: data.token,
      })
    } catch (error) {
      console.error('Login error:', error)
      
      // Sprawdź czy to problem z CORS
      if (error.message.includes('CORS') || error.message.includes('Network')) {
        setError('Błąd połączenia z serwerem. Sprawdź czy serwer API jest dostępny i obsługuje CORS.')
      } else if (error.message.includes('Failed to fetch')) {
        setError('Nie można połączyć się z serwerem API. Sprawdź połączenie internetowe.')
      } else {
        setError('Błąd logowania: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>🎯 Allegro Position Monitor</h1>
          <p>Zaloguj się, żeby zarządzać projektami monitoringu</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="twoj@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <div className="login-info">
          <p>💡 Używaj tego samego konta co we wtyczce Chrome</p>
          <p>🔒 Połączenie: {pocketbaseUrl}</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 