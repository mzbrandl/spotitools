/**
 * One-time migration: subscribers.json → SQLite
 * Run: node migration/migrate.js
 * Creates db/subscribers.db with the migrated data.
 */

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DB_DIR = path.join(__dirname, "..", "db");
const DB_PATH = path.join(DB_DIR, "subscribers.db");
const JSON_PATH = path.join(__dirname, "subscribers.json");

// Ensure db directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent access
db.pragma("journal_mode = WAL");

// Create table
db.exec(`
  CREATE TABLE IF NOT EXISTS monthly_export_subscribers (
    userId TEXT PRIMARY KEY,
    refreshToken TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`);

// Read JSON source
const subscribers = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));

// Insert with upsert (safe to re-run)
const insert = db.prepare(`
  INSERT OR REPLACE INTO monthly_export_subscribers (userId, refreshToken)
  VALUES (?, ?)
`);

const migrate = db.transaction(() => {
  for (const sub of subscribers) {
    insert.run(sub.userId, sub.refreshToken);
  }
});

migrate();

// Verify
const rows = db.prepare("SELECT userId FROM monthly_export_subscribers").all();
console.log(`✅ Migrated ${rows.length} subscribers to ${DB_PATH}`);
rows.forEach((r) => console.log(`   - ${r.userId}`));

db.close();
