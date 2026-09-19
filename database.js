const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
});

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      stone_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      created_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      receiver_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL DEFAULT  text ,
      content TEXT,
      created_at TIMESTAMP DEFAULT now(),
      is_read BOOLEAN DEFAULT false
    );

    CREATE INDEX IF NOT EXISTS idx_messages_users
    ON messages(sender_id, receiver_id, created_at);
  `);

  console.log("STONE PostgreSQL database ready");
}

module.exports = { pool, initDatabase };
