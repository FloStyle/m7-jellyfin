var sqlite = require('movian/sqlite');

/**
 * Bounded cache with TTL (AGENTS.md §10.5).
 *
 * - Maximum entries: 300 (capped to prevent unbounded growth on PS3)
 * - TTL: 5 minutes for library views, 10 minutes for item metadata
 * - Eviction: oldest entries are removed when the cap is reached
 */
class Cache {
  db = null;
  maxSize = 300;

  constructor() {
    this.db = new sqlite.DB('cache.db');
    this.db.query(
      `CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT,
        timestamp INTEGER
      )`,
    );
    this.db.query('CREATE INDEX IF NOT EXISTS idx_timestamp ON cache(timestamp)');
  }

  get = function (key) {
    this.db.query('SELECT value FROM cache WHERE key = ?', key);
    var row = this.db.step();

    if (row !== undefined) {
      return JSON.parse(row.value);
    }
    return null;
  };

  set = function (key, value) {
    // Evict oldest entries if we've hit the cap (AGENTS.md §10.5).
    this._evictIfNeeded();

    this.db.query(
      'INSERT OR REPLACE INTO cache (key, value, timestamp) VALUES (?, ?, ?)',
      key,
      JSON.stringify(value),
      Date.now(),
    );
  };

  remove = function (key) {
    this.db.query('DELETE FROM cache WHERE key = ?', key);
  };

  /**
   * Remove entries older than maxAge milliseconds (AGENTS.md §10.5).
   * Default TTL: 5 minutes for library views.
   */
  cleanup = function (maxAge = 5 * 60 * 1000) {
    var cutoff = Date.now() - maxAge;
    this.db.query('DELETE FROM cache WHERE timestamp < ?', cutoff);
  };

  /**
   * Evict oldest entries if cache size exceeds maxSize (AGENTS.md §10.5).
   */
  _evictIfNeeded = function () {
    this.db.query('SELECT COUNT(*) as count FROM cache');
    var row = this.db.step();
    var count = row && row.count ? parseInt(row.count, 10) : 0;

    if (count >= this.maxSize) {
      var toRemove = count - this.maxSize + 10; // Remove extra to avoid constant eviction
      this.db.query(
        'DELETE FROM cache WHERE rowid IN (SELECT rowid FROM cache ORDER BY timestamp ASC LIMIT ?)',
        toRemove,
      );
    }
  };
}

module.exports = Cache;
