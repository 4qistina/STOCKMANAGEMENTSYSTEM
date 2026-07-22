const { Pool, types } = require('pg');
require('dotenv').config();

// Postgres OID 1082 = DATE. By default node-postgres parses this into a JS
// Date object constructed in the server process's local timezone, which is
// then serialized to a UTC ISO string by Express's res.json(). If the
// server's timezone offset isn't 0, that round trip silently shifts the
// calendar date by a day (e.g. "2026-07-22" becomes
// "2026-07-21T16:00:00.000Z" for a UTC+8 server) — which then breaks any
// date filtering that compares the raw string on the frontend. Returning the
// raw 'YYYY-MM-DD' string instead means the date is never re-interpreted
// through a timezone, so it can never drift.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ISP-StockManagementSystem',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
});

module.exports = pool;