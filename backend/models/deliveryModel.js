const pool = require('../configuration/db');

async function findById(deliveryId) {
  const result = await pool.query('SELECT * FROM delivery WHERE "deliveryId" = $1', [deliveryId]);
  return result.rows[0];
}

async function insert({ deliveryDate, recipientName, driverId }) {
  const result = await pool.query(
    `INSERT INTO delivery ("deliveryDate", "deliveryStatus", "recipientName", "driverId")
     VALUES ($1, 'Pending', $2, $3) RETURNING *`,
    [deliveryDate, recipientName, driverId]
  );
  return result.rows[0];
}

async function update(deliveryId, { deliveryStatus, deliveredDate, driverId }) {
  const result = await pool.query(
    `UPDATE delivery SET
      "deliveryStatus" = COALESCE($1, "deliveryStatus"),
      "deliveredDate" = COALESCE($2, "deliveredDate"),
      "driverId" = COALESCE($3, "driverId")
     WHERE "deliveryId" = $4 RETURNING *`,
    [deliveryStatus, deliveredDate, driverId, deliveryId]
  );
  return result.rows[0];
}

async function remove(deliveryId) {
  await pool.query('DELETE FROM delivery WHERE "deliveryId" = $1', [deliveryId]);
}

module.exports = { findById, insert, update, remove };