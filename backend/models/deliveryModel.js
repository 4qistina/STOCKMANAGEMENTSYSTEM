const pool = require('../configuration/db');

async function findById(deliveryId, client = pool) {
  const result = await client.query('SELECT * FROM delivery WHERE "deliveryId" = $1', [deliveryId]);
  return result.rows[0];
}

async function insert({ deliveryDate, recipientName, driverId }, client = pool) {
  const result = await client.query(
    `INSERT INTO delivery ("deliveryDate", "deliveryStatus", "recipientName", "driverId")
     VALUES ($1, 'Pending', $2, $3) RETURNING *`,
    [deliveryDate, recipientName, driverId]
  );
  return result.rows[0];
}

async function update(deliveryId, { deliveryDate, deliveryStatus, deliveredDate, recipientName, driverId }, client = pool) {
  const result = await client.query(
    `UPDATE delivery SET
      "deliveryDate" = COALESCE($1, "deliveryDate"),
      "deliveryStatus" = COALESCE($2, "deliveryStatus"),
      "deliveredDate" = COALESCE($3, "deliveredDate"),
      "recipientName" = COALESCE($4, "recipientName"),
      "driverId" = COALESCE($5, "driverId")
     WHERE "deliveryId" = $6 RETURNING *`,
    [deliveryDate, deliveryStatus, deliveredDate, recipientName, driverId, deliveryId]
  );
  return result.rows[0];
}

async function remove(deliveryId, client = pool) {
  await client.query('DELETE FROM delivery WHERE "deliveryId" = $1', [deliveryId]);
}

module.exports = { findById, insert, update, remove };