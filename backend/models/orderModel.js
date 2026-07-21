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

// Full order detail for the "View Order Details" use case: order info,
// each line item (Category, Model, Brand, Price, Quantity), and — once the
// warehouse has fulfilled it — delivery info (Delivery Date, Delivered Date,
// Recipient Name, Driver Name/Phone).
async function findDetailedByUser(userId, client = pool) {
  const result = await client.query(
    `SELECT
        o."orderID", o."orderNumber", o."orderDate", o."orderStatus", o."deliveryId",
        COALESCE(items."items", '[]'::json) AS items,
        d."deliveryDate", d."deliveredDate", d."recipientName", d."deliveryStatus",
        dr."driverId", dr."driverName", dr."driverPhoneNumb"
     FROM orders o
     LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object(
          'productId', op."productId",
          'productModel', p."productModel",
          'productCode', p."productCode",
          'productPrice', p."productPrice",
          'categoryName', pc."productCategory",
          'brandName', pb."productBrand",
          'quantity', op."orderProductQuantity"
        ) ORDER BY p."productModel") AS "items"
        FROM orderproduct op
        JOIN products p ON p."productID" = op."productId"
        LEFT JOIN prodcat_lookup pc ON pc."prodCatLookupId" = p."prodCatLookupId"
        LEFT JOIN prodbrand_lookup pb ON pb."prodBrandLookupId" = p."prodBrandLookupId"
        WHERE op."orderId" = o."orderID"
     ) items ON true
     LEFT JOIN delivery d ON d."deliveryId" = o."deliveryId"
     LEFT JOIN driver dr ON dr."driverId" = d."driverId"
     WHERE o."userId" = $1
     ORDER BY o."orderDate" DESC, o."orderID" DESC`,
    [userId]
  );
  return result.rows;
}

// Full order detail across ALL Supervisors, for the Warehouse Staff
// "View Order Details" use case (Active Order / Order History tabs).
// Same shape as findDetailedByUser, plus who submitted the request.
async function findAllDetailed(client = pool) {
  const result = await client.query(
    `SELECT
        o."orderID", o."orderNumber", o."orderDate", o."orderStatus", o."deliveryId",
        u."userFullname" AS "submittedBy",
        COALESCE(items."items", '[]'::json) AS items,
        d."deliveryDate", d."deliveredDate", d."recipientName", d."deliveryStatus",
        dr."driverId", dr."driverName", dr."driverPhoneNumb"
     FROM orders o
     LEFT JOIN users u ON u."userID" = o."userId"
     LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object(
          'productId', op."productId",
          'productModel', p."productModel",
          'productCode', p."productCode",
          'productPrice', p."productPrice",
          'categoryName', pc."productCategory",
          'brandName', pb."productBrand",
          'quantity', op."orderProductQuantity"
        ) ORDER BY p."productModel") AS "items"
        FROM orderproduct op
        JOIN products p ON p."productID" = op."productId"
        LEFT JOIN prodcat_lookup pc ON pc."prodCatLookupId" = p."prodCatLookupId"
        LEFT JOIN prodbrand_lookup pb ON pb."prodBrandLookupId" = p."prodBrandLookupId"
        WHERE op."orderId" = o."orderID"
     ) items ON true
     LEFT JOIN delivery d ON d."deliveryId" = o."deliveryId"
     LEFT JOIN driver dr ON dr."driverId" = d."driverId"
     ORDER BY o."orderDate" DESC, o."orderID" DESC`
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

async function setOrderNumber(orderID, orderNumber, client = pool) {
  const result = await client.query(
    'UPDATE orders SET "orderNumber" = $1 WHERE "orderID" = $2 RETURNING *',
    [orderNumber, orderID]
  );
  return result.rows[0];
}

module.exports = {
  findAll,
  findById,
  findByUser,
  findDetailedByUser,
  findAllDetailed,
  insert,
  update,
  remove,
  setOrderNumber,
};