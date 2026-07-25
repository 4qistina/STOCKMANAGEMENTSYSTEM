const pool = require('../configuration/db');

// Retrieve all NON-DELETED products, joined with category/brand names so the
// product menu (use case step 1.2) can display Category, Brand and Model together.
// Products whose category or brand has been archived (soft deleted) are also
// hidden here — they reappear automatically once that category/brand is restored.
async function findAll(client = pool) {
  const result = await client.query(
    `SELECT p.*, pc."productCategory" AS "categoryName", pb."productBrand" AS "brandName"
     FROM products p
     LEFT JOIN prodcat_lookup pc ON pc."prodCatLookupId" = p."prodCatLookupId"
     LEFT JOIN prodbrand_lookup pb ON pb."prodBrandLookupId" = p."prodBrandLookupId"
     WHERE p."isDeleted" = FALSE
     AND (pc."prodCatLookupId" IS NULL OR pc."isDeleted" = FALSE)
     AND (pb."prodBrandLookupId" IS NULL OR pb."isDeleted" = FALSE)
     ORDER BY p."productID"`
  );
  return result.rows;
}

// Retrieve a single product by ID, joined with category/brand names (same
// join as findAll) so the product detail view can display them too. Also
// includes "productImage" via p.*.
async function findById(productID, client = pool) {
  const result = await client.query(
    `SELECT p.*, pc."productCategory" AS "categoryName", pb."productBrand" AS "brandName"
     FROM products p
     LEFT JOIN prodcat_lookup pc ON pc."prodCatLookupId" = p."prodCatLookupId"
     LEFT JOIN prodbrand_lookup pb ON pb."prodBrandLookupId" = p."prodBrandLookupId"
     WHERE p."productID" = $1`,
    [productID]
  );
  return result.rows[0];
}

// Search and filter available products by category ID, brand ID, and/or model search term
async function findAvailable(category, brand, model, client = pool) {
  const result = await client.query(
    `SELECT p.*, pc."productCategory" AS "categoryName", pb."productBrand" AS "brandName"
     FROM products p
     LEFT JOIN prodcat_lookup pc ON pc."prodCatLookupId" = p."prodCatLookupId"
     LEFT JOIN prodbrand_lookup pb ON pb."prodBrandLookupId" = p."prodBrandLookupId"
     WHERE p."productStatus" = 'Available'
     AND p."isDeleted" = FALSE
     AND (pc."prodCatLookupId" IS NULL OR pc."isDeleted" = FALSE)
     AND (pb."prodBrandLookupId" IS NULL OR pb."isDeleted" = FALSE)
     AND ($1::int IS NULL OR p."prodCatLookupId" = $1::int)
     AND ($2::int IS NULL OR p."prodBrandLookupId" = $2::int)
     AND ($3::text IS NULL OR p."productModel" ILIKE '%' || $3 || '%')
     ORDER BY p."productID"`,
    [category || null, brand || null, model || null]
  );

  return result.rows;
}

// Insert a new product including the optional "productImage".
// "productQuantity" is the WAREHOUSE quantity (set by Warehouse Staff). It
// drives "productStatus" automatically — a product with 0 units on hand at
// the warehouse can't be Available for a Supervisor to order — so any
// "productStatus" passed in the request body is ignored in favor of this
// server-computed value.
// "productCode" is generated here too, not supplied by the caller — the
// final code embeds the new row's productID, which isn't known until after
// the insert, so this writes a placeholder first and then stamps on the
// real code (PRD<productID>). Same two-step approach used for order numbers
// (ORD<orderID>) in placeOrderController.
async function insert(data, client = pool) {
  const {
    productModel,
    productPrice,
    handInStock,
    productQuantity,
    prodCatLookupId,
    prodBrandLookupId,
    productImage
  } = data;

  const qty = Number(productQuantity) || 0;
  const productStatus = qty > 0 ? 'Available' : 'Not Available';

  const inserted = await client.query(
    `INSERT INTO products
      ("productCode", "productModel", "productPrice", "handInStock", "productQuantity", "productStatus", "prodCatLookupId", "prodBrandLookupId", "productImage")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      `TEMP-${Date.now()}`,
      productModel,
      productPrice,
      handInStock || 0,
      qty,
      productStatus,
      prodCatLookupId,
      prodBrandLookupId,
      productImage || null
    ]
  );

  const productCode = `PRD${String(inserted.rows[0].productID).padStart(4, '0')}`;
  const result = await client.query(
    `UPDATE products SET "productCode" = $1 WHERE "productID" = $2 RETURNING *`,
    [productCode, inserted.rows[0].productID]
  );
  return result.rows[0];
}

// Update an existing product including the optional "productImage".
// "productQuantity" (warehouse quantity) drives "productStatus"
// automatically — same rule as insert() above — so any "productStatus"
// passed in is ignored in favor of the server-computed value.
async function update(productID, data, client = pool) {
  const {
    productCode,
    productModel,
    productPrice,
    handInStock,
    productQuantity,
    prodCatLookupId,
    prodBrandLookupId,
    productImage
  } = data;

  const qty = Number(productQuantity) || 0;
  const productStatus = qty > 0 ? 'Available' : 'Not Available';

  const result = await client.query(
    `UPDATE products SET
      "productCode" = $1,
      "productModel" = $2,
      "productPrice" = $3,
      "handInStock" = $4,
      "productQuantity" = $5,
      "productStatus" = $6,
      "prodCatLookupId" = $7,
      "prodBrandLookupId" = $8,
      "productImage" = $9
     WHERE "productID" = $10 RETURNING *`,
    [
      productCode,
      productModel,
      productPrice,
      handInStock || 0,
      qty,
      productStatus,
      prodCatLookupId,
      prodBrandLookupId,
      productImage || null, // $9
      productID              // $10
    ]
  );
  return result.rows[0];
}

// Has this product ever appeared on an order (any status)? If so it can only
// be soft-deleted, never hard-deleted, so the order history stays intact.
async function hasOrderHistory(productID, client = pool) {
  const result = await client.query(
    'SELECT 1 FROM orderproduct WHERE "productId" = $1 LIMIT 1',
    [productID]
  );
  return result.rowCount > 0;
}

// Soft delete: hide the product everywhere without touching its order history.
async function softDelete(productID, client = pool) {
  const result = await client.query(
    'UPDATE products SET "isDeleted" = TRUE WHERE "productID" = $1 RETURNING *',
    [productID]
  );
  return result.rows[0];
}

// Archived (soft-deleted) products, so warehouse staff can see and restore
// them. Joined with category/brand names the same way as findAll (the name
// may legitimately be null here if that category/brand was also archived).
async function findDeleted(client = pool) {
  const result = await client.query(
    `SELECT p.*, pc."productCategory" AS "categoryName", pb."productBrand" AS "brandName"
     FROM products p
     LEFT JOIN prodcat_lookup pc ON pc."prodCatLookupId" = p."prodCatLookupId"
     LEFT JOIN prodbrand_lookup pb ON pb."prodBrandLookupId" = p."prodBrandLookupId"
     WHERE p."isDeleted" = TRUE
     ORDER BY p."productID"`
  );
  return result.rows;
}

// Bring an archived product back into active use. Note: if its category or
// brand is still archived, the product stays hidden from the main listings
// until that category/brand is restored too.
async function restore(productID, client = pool) {
  const result = await client.query(
    'UPDATE products SET "isDeleted" = FALSE WHERE "productID" = $1 RETURNING *',
    [productID]
  );
  return result.rows[0];
}

// Hard delete a product by ID (only safe when it has no order history)
async function remove(productID, client = pool) {
  await client.query('DELETE FROM products WHERE "productID" = $1', [productID]);
}

module.exports = { findAll, findById, findAvailable, insert, update, hasOrderHistory, softDelete, findDeleted, restore, remove };
