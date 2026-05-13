/**
 * utils/stats.js
 * In-memory analytics store.
 * Replace with a database (MongoDB, SQLite, Redis) in production.
 */

const counters = {
  downloads: 0,
  errors:    0,
};

const logs = []; // Recent activity log (last 50 entries)

module.exports = {
  increment(key) {
    if (counters[key] !== undefined) {
      counters[key]++;
    }
    // Add timestamped log entry
    logs.unshift({ event: key, time: new Date().toISOString() });
    if (logs.length > 50) logs.pop();
  },

  get(key) {
    return counters[key] || 0;
  },

  getLogs() {
    return logs.slice(0, 20);
  },

  reset() {
    counters.downloads = 0;
    counters.errors    = 0;
    logs.length = 0;
  },

  all() {
    return { ...counters };
  },
};
