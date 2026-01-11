const DEFAULT_TTL_SEC = 300
const DEFAULT_MAX_SIZE = 5000
const CACHE_ENABLED = (process.env.CACHE_ENABLED ?? 'false') !== 'false'

class MemoryCache {
  constructor(ttlSec = DEFAULT_TTL_SEC, maxSize = DEFAULT_MAX_SIZE) {
    this.store = new Map()
    this.ttlMs = ttlSec * 1000
    this.maxSize = maxSize
    this.stats = { hits: 0, misses: 0, errors: 0 }
    this.sweeper = setInterval(() => this.sweep(), Math.min(this.ttlMs, 30000)).unref()
  }
  get(key) {
    try {
      if (!CACHE_ENABLED) return null
      const entry = this.store.get(key)
      if (!entry) {
        this.stats.misses++
        return null
      }
      if (entry.expiresAt <= Date.now()) {
        this.store.delete(key)
        this.stats.misses++
        return null
      }
      this.stats.hits++
      return entry.value
    } catch {
      this.stats.errors++
      return null
    }
  }
  set(key, value, ttlSeconds) {
    try {
      if (!CACHE_ENABLED) return
      const ttlMs = (ttlSeconds ? ttlSeconds * 1000 : this.ttlMs)
      this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
      while (this.store.size > this.maxSize) {
        const oldestKey = this.store.keys().next().value
        this.store.delete(oldestKey)
      }
    } catch {
      this.stats.errors++
    }
  }
  del(key) {
    try {
      if (!CACHE_ENABLED) return
      this.store.delete(key)
    } catch {
      this.stats.errors++
    }
  }
  delPattern(pattern) {
    try {
      if (!CACHE_ENABLED) return
      const base = pattern.replace(/\*/g, '.*')
      const regex = new RegExp(`^${base}$`)
      for (const key of this.store.keys()) {
        if (regex.test(key)) this.store.delete(key)
      }
    } catch {
      this.stats.errors++
    }
  }
  sweep() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) this.store.delete(key)
    }
  }
  getStats() {
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : '0.00'
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      memoryCacheSize: this.store.size,
      enabled: CACHE_ENABLED
    }
  }
  flush() {
    this.store.clear()
  }
}

const cacheService = new MemoryCache()
module.exports = cacheService
