const pool = require('../configuration/db');

// Special Requirement: brand list displayed in alphabetical order.
async function findAll(client = pool) {
  const result = await client.query('SELECT * FROM prodbrand_lookup ORDER BY "productBrand" ASC');
  return result.rows;
}

async function findById(prodBrandLookupId, client = pool) {
  const result = await client.query(
    'SELECT * FROM prodbrand_lookup WHERE "prodBrandLookupId" = $1',
    [prodBrandLookupId]
  );
  return result.rows[0];
}

// Case-insensitive lookup, used to enforce [E1: Duplicate Item].
async function findByName(productBrand, client = pool) {
  const result = await client.query(
    'SELECT * FROM prodbrand_lookup WHERE LOWER("productBrand") = LOWER($1)',
    [productBrand]
  );
  return result.rows[0];
}

async function insert(productBrand, client = pool) {
  const result = await client.query(
    `INSERT INTO prodbrand_lookup ("productBrand") VALUES ($1) RETURNING *`,
    [productBrand]
  );
  return result.rows[0];
}

async function update(prodBrandLookupId, productBrand, client = pool) {
  const result = await client.query(
    `UPDATE prodbrand_lookup SET "productBrand" = $1 WHERE "prodBrandLookupId" = $2 RETURNING *`,
    [productBrand, prodBrandLookupId]
  );
  return result.rows[0];
}

async function remove(prodBrandLookupId, client = pool) {
  await client.query('DELETE FROM prodbrand_lookup WHERE "prodBrandLookupId" = $1', [prodBrandLookupId]);
}

module.exports = { findAll, findById, findByName, insert, update, remove };