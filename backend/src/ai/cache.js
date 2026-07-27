/**
 * ============================================================================
 * Reusable Bounded In-Memory TTL Cache
 * ============================================================================
 * Purpose: Provides predictable, memory-safe in-memory caching with lazy TTL
 *          eviction and a hard capacity cap (FIFO eviction).
 * ============================================================================
 */
export class BoundedTtlCache {
  /**
   * @param {number} ttlMs - Time to live in milliseconds (default 5 minutes)
   * @param {number} maxEntries - Maximum capacity threshold (default 500)
   */
  constructor(ttlMs = 5 * 60 * 1000, maxEntries = 500) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.cache = new Map();
  }

  /**
   * Retrieves a cached value if present and not expired
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    if (!key) return null;
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp >= this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Stores a value in the cache, enforcing maximum capacity bounds
   * @param {string} key 
   * @param {any} value 
   */
  set(key, value) {
    if (!key || value === undefined || value === null) return;

    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      timestamp: Date.now(),
      value,
    });
  }

  /**
   * Deletes an entry from cache
   * @param {string} key 
   */
  delete(key) {
    if (key) {
      this.cache.delete(key);
    }
  }

  /**
   * Clears all cached entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Returns current count of cached items
   * @returns {number}
   */
  get size() {
    return this.cache.size;
  }
}
