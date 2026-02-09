/**
 * SQLite database module for subscriber persistence.
 * Replaces the old monthlyExportUsers.json file-based approach.
 *
 * Usage:
 *   const db = require("./db");
 *   db.subscribe(userId, refreshToken);
 *   db.unsubscribe(userId);
 *   db.isSubscribed(userId);       // → boolean
 *   db.getAllSubscribers();          // → [{ userId, refreshToken }]
 */

const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "subscribers.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create table if it doesn't exist (handles fresh deploys)
db.exec(`
  CREATE TABLE IF NOT EXISTS monthly_export_subscribers (
    userId TEXT PRIMARY KEY,
    refreshToken TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`);

// Prepared statements
const stmts = {
  insert: db.prepare(`
    INSERT OR REPLACE INTO monthly_export_subscribers (userId, refreshToken)
    VALUES (?, ?)
  `),
  remove: db.prepare(`
    DELETE FROM monthly_export_subscribers WHERE userId = ?
  `),
  find: db.prepare(`
    SELECT userId FROM monthly_export_subscribers WHERE userId = ?
  `),
  all: db.prepare(`
    SELECT userId, refreshToken FROM monthly_export_subscribers
  `),
};

module.exports = {
  /**
   * Add or update a subscriber.
   */
  subscribe(userId, refreshToken) {
    stmts.insert.run(userId, refreshToken);
  },

  /**
   * Remove a subscriber.
   */
  unsubscribe(userId) {
    stmts.remove.run(userId);
  },

  /**
   * Check if a user is subscribed.
   * @returns {boolean}
   */
  isSubscribed(userId) {
    return !!stmts.find.get(userId);
  },

  /**
   * Get all subscribers (for the monthly cron job).
   * @returns {{ userId: string, refreshToken: string }[]}
   */
  getAllSubscribers() {
    return stmts.all.all();
  },
};
