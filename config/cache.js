"use strict";

/**
 * Simple In-Memory Cache Class
 * For production, consider using Redis
 */
class CacheManager {
    constructor(defaultTTL = 300) {
        this.cache = new Map();
        this.ttl = new Map();
        this.defaultTTL = defaultTTL; // Default 5 minutes
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
    }

    /**
     * Set a value in cache
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} ttlSeconds - Time to live in seconds
     */
    set(key, value, ttlSeconds = this.defaultTTL) {
        this.cache.set(key, value);
        this.ttl.set(key, Date.now() + (ttlSeconds * 1000));
        this.stats.sets++;
    }

    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {*} Cached value or null
     */
    get(key) {
        const expiry = this.ttl.get(key);
        if (!expiry || Date.now() > expiry) {
            this.delete(key);
            this.stats.misses++;
            return null;
        }
        this.stats.hits++;
        return this.cache.get(key);
    }

    /**
     * Delete a value from cache
     * @param {string} key - Cache key
     */
    delete(key) {
        this.cache.delete(key);
        this.ttl.delete(key);
        this.stats.deletes++;
    }

    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
        this.ttl.clear();
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {boolean} Whether key exists
     */
    has(key) {
        const expiry = this.ttl.get(key);
        if (!expiry || Date.now() > expiry) {
            this.delete(key);
            return false;
        }
        return this.cache.has(key);
    }

    /**
     * Get cache size
     * @returns {number} Number of cached items
     */
    size() {
        return this.cache.size;
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        return {
            ...this.stats,
            size: this.cache.size,
            hitRate: this.stats.hits + this.stats.misses > 0 
                ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    /**
     * Reset cache statistics
     */
    resetStats() {
        this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
    }

    /**
     * Get or set cache value
     * @param {string} key - Cache key
     * @param {Function} factory - Factory function to create value if not cached
     * @param {number} ttlSeconds - Time to live in seconds
     * @returns {*} Cached or newly created value
     */
    async getOrSet(key, factory, ttlSeconds = this.defaultTTL) {
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }

        const value = await factory();
        this.set(key, value, ttlSeconds);
        return value;
    }

    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, expiry] of this.ttl.entries()) {
            if (now > expiry) {
                this.delete(key);
            }
        }
    }
}

// Create singleton instance
const cache = new CacheManager();

// Export class and instance for backward compatibility
module.exports = cache;
module.exports.CacheManager = CacheManager;
