const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
});

async function initDatabase() {
  await pool.query();

  console.log("STONE PostgreSQL database ready");
}

module.exports = { pool, initDatabase };
