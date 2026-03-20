const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// DB config from env variables only — never hardcoded
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000,
};

let pool = null;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool({ ...dbConfig, waitForConnections: true, connectionLimit: 5 });
  }
  return pool;
}

// GET / — basic OK response
app.get('/', async (req, res) => {
  res.json({ status: 'ok', message: 'Backend API is running', timestamp: new Date().toISOString() });
});

// GET /health — DB health check
app.get('/health', async (req, res) => {
  let dbStatus = 'error';
  let dbMessage = null;
  try {
    const p = await getPool();
    await p.query('SELECT 1');
    dbStatus = 'ok';
  } catch (err) {
    dbMessage = err.message;
    // Reset pool so next call retries
    pool = null;
  }

  const httpStatus = dbStatus === 'ok' ? 200 : 503;
  res.status(httpStatus).json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    database: dbStatus,
    ...(dbMessage && { db_error: dbMessage }),
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
