const { Pool } = require("pg")

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

const connectPostgreSQL = async () => {
  try {
    await pool.connect()
    console.log("Connected to PostgreSQL database")
  } catch (error) {
    console.error("PostgreSQL connection error:", error)
    process.exit(1)
  }
}

module.exports = { pool, connectPostgreSQL }
