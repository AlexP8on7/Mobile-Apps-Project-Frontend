import { SEED_TRANSACTIONS } from '../data/data';

// ─────────────────────────────────────────────────────────────────────────────
// Database — opens SQLite, runs migrations, seeds on first launch
// ─────────────────────────────────────────────────────────────────────────────
// Called by <SQLiteProvider onInit={initDatabase}> in App.js.
// SQLiteProvider resolves the promise before rendering children, so by the
// time TransactionProvider mounts the DB is fully ready.
// ─────────────────────────────────────────────────────────────────────────────

export async function initDatabase(db) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id          TEXT PRIMARY KEY,
      amount      REAL NOT NULL,
      description TEXT NOT NULL,
      categoryId  TEXT NOT NULL,
      date        TEXT NOT NULL,
      type        TEXT NOT NULL
    );
  `);

  // Only seed on first launch — version flag acts as a migration marker
  const versionRow = await db.getFirstAsync(
    "SELECT value FROM meta WHERE key = 'db_version'"
  );

  if (!versionRow) {
    await seedDatabase(db);
    await db.runAsync(
      "INSERT INTO meta (key, value) VALUES ('db_version', '1')"
    );
  }
}

async function seedDatabase(db) {
  for (const t of SEED_TRANSACTIONS) {
    await db.runAsync(
      'INSERT INTO transactions (id, amount, description, categoryId, date, type) VALUES (?, ?, ?, ?, ?, ?)',
      [t.id, t.amount, t.description, t.categoryId, t.date, t.type]
    );
  }
}