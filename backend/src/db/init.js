import pg from 'pg'

const { Pool } = pg

// PostgreSQL connection configuration
// You can override these with environment variables
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'flashcards',
  user: process.env.DB_USER || process.env.USER, // Use OS username on macOS
  password: process.env.DB_PASSWORD || undefined, // No password for local socket auth
})

export async function initDb() {
  const client = await pool.connect()
  
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        google_id TEXT UNIQUE,
        name TEXT,
        picture TEXT,
        password TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Flashcard sets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Cards table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        set_id TEXT NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        front_image TEXT,
        back_image TEXT,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Study sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS study_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        set_id TEXT NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
        mode TEXT NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `)

    // Study results table
    await client.query(`
      CREATE TABLE IF NOT EXISTS study_results (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
        card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        correct BOOLEAN NOT NULL,
        response_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Card mastery tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS card_mastery (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        correct_count INTEGER DEFAULT 0,
        incorrect_count INTEGER DEFAULT 0,
        last_reviewed TIMESTAMP,
        next_review TIMESTAMP,
        UNIQUE(user_id, card_id)
      )
    `)

    // Add is_public column if it doesn't exist (migration)
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sets' AND column_name='is_public') THEN
          ALTER TABLE sets ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `)

    // Create indexes for better performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sets_user ON sets(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cards_set ON cards(set_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON study_sessions(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_set ON study_sessions(set_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_results_session ON study_results(session_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_mastery_user ON card_mastery(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sets_public ON sets(is_public) WHERE is_public = TRUE`)

    console.log('PostgreSQL database initialized')
  } finally {
    client.release()
  }
}

// Query helper that returns rows
export async function query(text, params) {
  const result = await pool.query(text, params)
  return result.rows
}

// Query helper that returns first row
export async function queryOne(text, params) {
  const result = await pool.query(text, params)
  return result.rows[0] || null
}

// Query helper for inserts/updates (returns nothing)
export async function execute(text, params) {
  await pool.query(text, params)
}

export { pool }
