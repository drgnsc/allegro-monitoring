/**
 * Prosty system cache'owania dla API calls
 * TTL domyślnie 5 minut, można konfigurować
 */

const CACHE_PREFIX = 'allegro_monitor_cache_'
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minut w ms

class SimpleCache {
  constructor() {
    this.memoryCache = new Map()
  }

  // Generuj klucz cache
  generateKey(url, params = {}) {
    const paramString = Object.keys(params).length > 0 ? JSON.stringify(params) : ''
    return `${CACHE_PREFIX}${url}_${paramString}`
  }

  // Zapisz do cache
  set(key, data, ttl = DEFAULT_TTL) {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl
    }
    
    // Cache w pamięci (szybszy dostęp)
    this.memoryCache.set(key, cacheItem)
    
    // Cache w localStorage (przetrwa odświeżenie strony)
    try {
      localStorage.setItem(key, JSON.stringify(cacheItem))
    } catch (error) {
      console.warn('localStorage full, używam tylko cache w pamięci')
    }
  }

  // Pobierz z cache
  get(key) {
    // Sprawdź cache w pamięci
    let cacheItem = this.memoryCache.get(key)
    
    // Jeśli nie ma w pamięci, sprawdź localStorage
    if (!cacheItem) {
      try {
        const stored = localStorage.getItem(key)
        if (stored) {
          cacheItem = JSON.parse(stored)
          // Przywróć do cache w pamięci
          this.memoryCache.set(key, cacheItem)
        }
      } catch (error) {
        console.warn('Błąd odczytu z localStorage:', error)
        return null
      }
    }

    if (!cacheItem) return null

    // Sprawdź czy nie wygasł
    const now = Date.now()
    if (now - cacheItem.timestamp > cacheItem.ttl) {
      this.delete(key)
      return null
    }

    return cacheItem.data
  }

  // Usuń z cache
  delete(key) {
    this.memoryCache.delete(key)
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Błąd usuwania z localStorage:', error)
    }
  }

  // Wyczyść cały cache
  clear() {
    this.memoryCache.clear()
    
    try {
      // Usuń tylko nasze klucze z localStorage
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Błąd czyszczenia localStorage:', error)
    }
  }

  // Cache'owany fetch
  async cachedFetch(url, options = {}, ttl = DEFAULT_TTL) {
    const cacheKey = this.generateKey(url, { 
      method: options.method || 'GET',
      body: options.body,
      userId: options.userId // Dodaj userId do klucza dla bezpieczeństwa
    })

    // Sprawdź cache tylko dla GET requests
    if (!options.method || options.method === 'GET') {
      const cached = this.get(cacheKey)
      if (cached) {
        console.log(`Cache hit dla: ${url}`)
        return cached
      }
    }

    try {
      console.log(`Cache miss, pobieranie: ${url}`)
      const response = await fetch(url, options)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      // Cache'uj tylko udane GET requests
      if (!options.method || options.method === 'GET') {
        this.set(cacheKey, data, ttl)
      }
      
      return data
    } catch (error) {
      console.error('Błąd fetch:', error)
      throw error
    }
  }

  // Invaliduj cache dla konkretnego endpoint
  invalidatePattern(pattern) {
    // Pamięć
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key)
      }
    }

    // localStorage
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX) && key.includes(pattern)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Błąd invalidacji localStorage:', error)
    }
  }
}

// Singleton instance
const cache = new SimpleCache()

export default cache

// Helper functions dla łatwego używania
export const cachedApiCall = (url, options, ttl) => cache.cachedFetch(url, options, ttl)
export const invalidateCache = (pattern) => cache.invalidatePattern(pattern)
export const clearAllCache = () => cache.clear() 