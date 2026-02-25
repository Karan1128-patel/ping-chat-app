import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME, 
  port: process.env.DB_PORT ,
  max: process.env.MAX_DB_CONNECTIONS ,                     
  idleTimeoutMillis: process.env.IDLE_TIMEOUT ,
  connectionTimeoutMillis: process.env.CONNECTION_TIMEOUT,
});

// --------------------------------only for render deployment as render provide connection string in this format so we have to use connectionString instead of individual params
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false,
//   },
//   max: 10,
//   idleTimeoutMillis: 30000,
// });

const db = {
  async query(sql, params = []) {
    try {
      const { rows } = await pool.query(sql, params);
      return rows;
    } catch (err) {
      console.error('❌ DB Query Error:', err);
      throw err;
    }
  },
  async begin() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      return client;
    } catch (err) {
      client.release();
      throw err;
    }
  },
  async commit(client) {
    try {
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
  async rollback(client) {
    try {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  },
  async close() {
    console.log('🔌 Closing PostgreSQL pool');
    await pool.end();
  },
};

export const connectDB = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connected successfully');
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err);
    throw err;
  }
};

export default db;
