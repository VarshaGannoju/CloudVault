/**
 * Minimal migration runner.
 * Executes every .sql file in ./migrations, in filename order, inside
 * a single transaction. For a project of this size a lightweight,
 * dependency-free runner keeps things transparent and easy to reason about.
 *
 * Usage: npm run db:migrate
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
  const client = await pool.connect();
  try {
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    await client.query('BEGIN');

    for (const file of files) {
      console.log(`Applying migration: ${file}`);
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await client.query(sql);
    }

    await client.query('COMMIT');
    console.log(`✅ Applied ${files.length} migration(s) successfully.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed, rolled back:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
