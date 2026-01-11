const CACHING_ENABLED = (process.env.CACHE_ENABLED ?? 'false') !== 'false'
const MEDICAL_RECORDS_CACHE_TTL_MS = 60 * 1000

class MapLikeCache {
  constructor() {
    this.store = new Map()
  }
  get(key) {
    if (!CACHING_ENABLED) return null
    return this.store.get(key)
  }
  set(key, value) {
    if (!CACHING_ENABLED) return
    this.store.set(key, value)
  }
  delete(key) {
    if (!CACHING_ENABLED) return
    this.store.delete(key)
  }
  clear() {
    if (!CACHING_ENABLED) return
    this.store.clear()
  }
  keys() {
    if (!CACHING_ENABLED) return [].values()
    return this.store.keys()
  }
}

const medicalRecordsCache = new MapLikeCache()

module.exports = {
  medicalRecordsCache,
  MEDICAL_RECORDS_CACHE_TTL_MS,
  CACHING_ENABLED
}
