const pool = require('../configuration/db');

async function findAll(client = pool) {
  const result = await client.query('SELECT * FROM orders');
  return result.rows;
}

async function findById(orderID, client = pool) {
  const result = await client.query('SELECT * FROM orders WHERE "orderID" = $1', [orderID]);
  return result.rows[0];
}

async function findByUser(userId, client = pool) {
  const result = await client.query(
    'SELECT * FROM orders WHERE "userId" = $1 ORDER BY "orderDate" DESC',
    [userId]
  );
  return result.rows;
}

async function insert({ orderNumber, userId }, client = pool) {
  const result = await client.query(
    `INSERT INTO orders ("orderNumber", "userId", "orderStatus") VALUES ($1, $2, 'Pending') RETURNING *`,
    [orderNumber, userId]
  );
  return result.rows[0];
}

async function update(orderID, { orderStatus, deliveryId }, client = pool) {
  const result = await client.query(
    `UPDATE orders SET "orderStatus" = COALESCE($1, "orderStatus"), "deliveryId" = COALESCE($2, "deliveryId")
     WHERE "orderID" = $3 RETURNING *`,
    [orderStatus, deliveryId, orderID]
  );
  return result.rows[0];
}

async function remove(orderID, client = pool) {
  await client.query('DELETE FROM orders WHERE "orderID" = $1', [orderID]);
}

module.exports = { findAll, findById, findByUser, insert, update, remove };