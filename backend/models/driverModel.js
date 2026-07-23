const pool = require('../configuration/db');

async function findAll() {
  const result = await pool.query('SELECT * FROM driver WHERE "isDeleted" = FALSE');
  return result.rows;
}

async function findById(driverId) {
  const result = await pool.query('SELECT * FROM driver WHERE "driverId" = $1', [driverId]);
  return result.rows[0];
}

async function insert({ driverName, driverPhoneNumb }) {
  const result = await pool.query(
    `INSERT INTO driver ("driverName", "driverPhoneNumb") VALUES ($1, $2) RETURNING *`,
    [driverName, driverPhoneNumb]
  );
  return result.rows[0];
}

async function update(driverId, { driverName, driverPhoneNumb }) {
  const result = await pool.query(
    `UPDATE driver SET "driverName" = $1, "driverPhoneNumb" = $2 WHERE "driverId" = $3 RETURNING *`,
    [driverName, driverPhoneNumb, driverId]
  );
  return result.rows[0];
}

// Has this driver ever been assigned to a delivery?
async function isReferenced(driverId) {
  const result = await pool.query(
    'SELECT 1 FROM delivery WHERE "driverId" = $1 LIMIT 1',
    [driverId]
  );
  return result.rowCount > 0;
}

async function softDelete(driverId) {
  const result = await pool.query(
    'UPDATE driver SET "isDeleted" = TRUE WHERE "driverId" = $1 RETURNING *',
    [driverId]
  );
  return result.rows[0];
}

// Archived (soft-deleted) drivers, so warehouse staff can see and restore them.
async function findDeleted() {
  const result = await pool.query('SELECT * FROM driver WHERE "isDeleted" = TRUE ORDER BY "driverName" ASC');
  return result.rows;
}

async function restore(driverId) {
  const result = await pool.query(
    'UPDATE driver SET "isDeleted" = FALSE WHERE "driverId" = $1 RETURNING *',
    [driverId]
  );
  return result.rows[0];
}

async function remove(driverId) {
  await pool.query('DELETE FROM driver WHERE "driverId" = $1', [driverId]);
}

module.exports = { findAll, findById, insert, update, isReferenced, softDelete, findDeleted, restore, remove };
