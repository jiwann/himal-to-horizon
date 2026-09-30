import { pool } from "./db";

// Tables the app queries but that were originally created by hand on Replit.
// Columns are reconstructed from the queries in server/storage.ts.
// Everything is CREATE ... IF NOT EXISTS, so it is safe to run on every startup.
export async function initCoreTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      name TEXT,
      home_airport TEXT,
      home_airport_label TEXT,
      google_id TEXT UNIQUE,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      verification_token TEXT,
      verification_token_expires TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS favorite_routes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      origin_label TEXT,
      destination_label TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, origin, destination)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS price_alerts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departure_date TEXT NOT NULL,
      return_date TEXT,
      cabin_class TEXT NOT NULL DEFAULT 'economy',
      passengers_adult INTEGER NOT NULL DEFAULT 1,
      baseline_price NUMERIC NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      last_alerted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS route_price_history (
      id SERIAL PRIMARY KEY,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departure_date TEXT NOT NULL,
      cabin_class TEXT NOT NULL,
      price NUMERIC NOT NULL,
      currency TEXT NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_route_price_history_lookup
       ON route_price_history (origin, destination, departure_date, cabin_class, recorded_at)`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS insight_events (
      id SERIAL PRIMARY KEY,
      event_type TEXT NOT NULL,
      origin TEXT,
      destination TEXT,
      departure_date TEXT,
      savings_pct NUMERIC,
      savings_amount NUMERIC,
      currency TEXT,
      user_id INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}
