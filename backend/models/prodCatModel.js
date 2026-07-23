const pool = require('../configuration/db');

async function findAll(client = pool) {
  const result = await client.query(
    'SELECT * FROM prodcat_lookup WHERE "isDeleted" = FALSE ORDER BY "productCategory" ASC'
  );
  return result.rows;
}

async function findById(prodCatLookupId, client = pool) {
  const result = await client.query(
    'SELECT * FROM prodcat_lookup WHERE "prodCatLookupId" = $1',
    [prodCatLookupId]
  );
  return result.rows[0];
}

// Case-insensitive lookup, used to enforce [E2: Duplicate Category].
async function findByName(productCategory, client = pool) {
  const result = await client.query(
    'SELECT * FROM prodcat_lookup WHERE LOWER("productCategory") = LOWER($1)',
    [productCategory]
  );
  return result.rows[0];
}

async function insert(productCategory, client = pool) {
  const result = await client.query(
    `INSERT INTO prodcat_lookup ("productCategory") VALUES ($1) RETURNING *`,
    [productCategory]
  );
  return result.rows[0];
}

async function update(prodCatLookupId, productCategory, client = pool) {
  const result = await client.query(
    `UPDATE prodcat_lookup SET "productCategory" = $1 WHERE "prodCatLookupId" = $2 RETURNING *`,
    [productCategory, prodCatLookupId]
  );
  return result.rows[0];
}

// Is any product (deleted or not) still pointing at this category? A
// soft-deleted product still holds the FK, so hard-deleting the category
// would break it — those must be soft-deleted too.
async function isReferenced(prodCatLookupId, client = pool) {
  const result = await client.query(
    'SELECT 1 FROM products WHERE "prodCatLookupId" = $1 LIMIT 1',
    [prodCatLookupId]
  );
  return result.rowCount > 0;
}

async function softDelete(prodCatLookupId, client = pool) {
  const result = await client.query(
    'UPDATE prodcat_lookup SET "isDeleted" = TRUE WHERE "prodCatLookupId" = $1 RETURNING *',
    [prodCatLookupId]
  );
  return result.rows[0];
}

// Archived (soft-deleted) categories, so warehouse staff can see and restore them.
async function findDeleted(client = pool) {
  const result = await client.query(
    'SELECT * FROM prodcat_lookup WHERE "isDeleted" = TRUE ORDER BY "productCategory" ASC'
  );
  return result.rows;
}

async function restore(prodCatLookupId, client = pool) {
  const result = await client.query(
    'UPDATE prodcat_lookup SET "isDeleted" = FALSE WHERE "prodCatLookupId" = $1 RETURNING *',
    [prodCatLookupId]
  );
  return result.rows[0];
}

async function remove(prodCatLookupId, client = pool) {
  await client.query('DELETE FROM prodcat_lookup WHERE "prodCatLookupId" = $1', [prodCatLookupId]);
}

module.exports = { findAll, findById, findByName, insert, update, isReferenced, softDelete, findDeleted, restore, remove };
