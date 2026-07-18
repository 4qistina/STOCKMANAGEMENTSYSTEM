const pool = require('../configuration/db');

async function findAll() {
  const result = await pool.query('SELECT * FROM driver');
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

async function remove(driverId) {
  await pool.query('DELETE FROM driver WHERE "driverId" = $1', [driverId]);
}

module.exports = { findAll, findById, insert, update, remove };