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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Błąd logowania')
      }

      const data = await response.json()
      onLogin({
        id: data.record.id,
        email: data.record.email,
        token: data.token,
      })
    } catch (error) {
      console.error('Login error:', error)
      setError('Błąd logowania: ' + error.message)
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