const pool = require('../configuration/db');

async function findByOrder(orderId, client = pool) {
  const result = await client.query(
    `SELECT op.*, p."productModel", p."productPrice", p."productCode",
            pc."productCategory" AS "categoryName", pb."productBrand" AS "brandName"
     FROM orderproduct op
     JOIN products p ON op."productId" = p."productID"
     LEFT JOIN prodcat_lookup pc ON pc."prodCatLookupId" = p."prodCatLookupId"
     LEFT JOIN prodbrand_lookup pb ON pb."prodBrandLookupId" = p."prodBrandLookupId"
     WHERE op."orderId" = $1`,
    [orderId]
  );
  return result.rows;
}

async function findPendingByProduct(productId, client = pool) {
  const result = await client.query(
    `SELECT op."orderProductQuantity" FROM orderproduct op
     JOIN orders o ON op."orderId" = o."orderID"
     WHERE op."productId" = $1 AND o."orderStatus" = 'Pending'`,
    [productId]
  );
  return result.rows;
}

async function insert({ orderId, productId, orderProductQuantity }, client = pool) {
  const result = await client.query(
    `INSERT INTO orderproduct ("orderId", "productId", "orderProductQuantity")
     VALUES ($1, $2, $3) RETURNING *`,
    [orderId, productId, orderProductQuantity]
  );
  return result.rows[0];
}

async function remove(orderId, productId, client = pool) {
  await client.query('DELETE FROM orderproduct WHERE "orderId" = $1 AND "productId" = $2', [orderId, productId]);
}

module.exports = { findByOrder, findPendingByProduct, insert, remove };