const pool = require('../configuration/db');

// Retrieve all products (automatically includes "productImage" via SELECT *)
async function findAll(client = pool) {
  const result = await client.query('SELECT * FROM products');
  return result.rows;
}

// Retrieve a single product by ID (automatically includes "productImage" via SELECT *)
async function findById(productID, client = pool) {
  const result = await client.query('SELECT * FROM products WHERE "productID" = $1', [productID]);
  return result.rows[0];
}

// Search and filter available products by category ID, brand ID, and/or model search term
async function findAvailable(category, brand, model, client = pool) {
  const result = await client.query(
    `SELECT p.* FROM products p
     WHERE p."productStatus" = 'Available'
     AND ($1::int IS NULL OR p."prodCatLookupId" = $1::int)
     AND ($2::int IS NULL OR p."prodBrandLookupId" = $2::int)
     AND ($3::text IS NULL OR p."productModel" ILIKE '%' || $3 || '%')`,
    [category || null, brand || null, model || null]
  );

  return result.rows;
}

// Insert a new product including the optional "productImage"
async function insert(data, client = pool) {
  const {
    productCode,
    productModel,
    productPrice,
    handInStock,
    prodCatLookupId,
    prodBrandLookupId,
    productImage
  } = data;

  const result = await client.query(
    `INSERT INTO products
      ("productCode", "productModel", "productPrice", "handInStock", "prodCatLookupId", "prodBrandLookupId", "productImage")
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      productCode,
      productModel,
      productPrice,
      handInStock,
      prodCatLookupId,
      prodBrandLookupId,
      productImage || null
    ]
  );
  return result.rows[0];
}

// Update an existing product including the optional "productImage"
async function update(productID, data, client = pool) {
  const {
    productCode,
    productModel,
    productPrice,
    handInStock,
    productStatus,
    prodCatLookupId,
    prodBrandLookupId,
    productImage
  } = data;

  const result = await client.query(
    `UPDATE products SET
      "productCode" = $1,
      "productModel" = $2,
      "productPrice" = $3,
      "handInStock" = $4,
      "productStatus" = $5,
      "prodCatLookupId" = $6,
      "prodBrandLookupId" = $7,
      "productImage" = $8
     WHERE "productID" = $9 RETURNING *`,
    [
      productCode,
      productModel,
      productPrice,
      handInStock,
      productStatus,
      prodCatLookupId,
      prodBrandLookupId,
      productImage || null, // $8
      productID              // $9
    ]
  );
  return result.rows[0];
}

// Delete a product by ID
async function remove(productID, client = pool) {
  await client.query('DELETE FROM products WHERE "productID" = $1', [productID]);
}

module.exports = { findAll, findById, findAvailable, insert, update, remove };