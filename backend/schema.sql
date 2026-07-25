-- ===== users =====
CREATE TABLE users (
  "userID"       SERIAL PRIMARY KEY,
  "userFullname" VARCHAR(255) NOT NULL,
  "username"     VARCHAR(100) UNIQUE NOT NULL,
  "userPassword" VARCHAR(255) NOT NULL,
  "role"         VARCHAR(50) NOT NULL,
  "created_at"   TIMESTAMP DEFAULT NOW()
);

-- ===== driver =====
CREATE TABLE driver (
  "driverId"        SERIAL PRIMARY KEY,
  "driverName"      VARCHAR(100) NOT NULL,
  "driverPhoneNumb" VARCHAR(20) NOT NULL,
  "isDeleted"       BOOLEAN NOT NULL DEFAULT FALSE
);

-- ===== delivery =====
CREATE TABLE delivery (
  "deliveryId"     SERIAL PRIMARY KEY,
  "deliveryDate"   DATE,
  "deliveryStatus" VARCHAR(50),
  "deliveredDate"  DATE,
  "recipientName"  VARCHAR(100),
  "driverId"       INT REFERENCES driver("driverId")
);

-- ===== orders =====
CREATE TABLE orders (
  "orderID"     SERIAL PRIMARY KEY,
  "orderNumber" VARCHAR(50) UNIQUE NOT NULL,
  "orderDate"   DATE DEFAULT CURRENT_DATE,
  "userId"      INT REFERENCES users("userID"),
  "deliveryId"  INT REFERENCES delivery("deliveryId"),
  "orderStatus" VARCHAR(50) NOT NULL DEFAULT 'Pending'
);

-- ===== prodcat_lookup =====
CREATE TABLE prodcat_lookup (
  "prodCatLookupId" SERIAL PRIMARY KEY,
  "productCategory" VARCHAR(100) NOT NULL,
  "isDeleted"        BOOLEAN NOT NULL DEFAULT FALSE
);

-- ===== prodbrand_lookup =====
CREATE TABLE prodbrand_lookup (
  "prodBrandLookupId" SERIAL PRIMARY KEY,
  "productBrand"       VARCHAR(100) NOT NULL,
  "isDeleted"          BOOLEAN NOT NULL DEFAULT FALSE
);

-- ===== products =====
-- "productQuantity" = how many units the WAREHOUSE has on hand. Managed by
--   Warehouse Staff (Maintain Product). This is the ceiling on how much a
--   Supervisor may order, and it drives "productStatus" automatically
--   (0 => Not Available). Deducted when a Warehouse Staff member approves
--   an order.
-- "handInStock"     = how many units a RETAIL location (Supervisor) has on
--   hand. Managed by the Supervisor (Update Product Stock), completely
--   independent of "productQuantity". Supervisors place orders against
--   "productQuantity" to restock this value.
CREATE TABLE products (
  "productID"         SERIAL PRIMARY KEY,
  "productCode"       VARCHAR(50) NOT NULL,
  "productModel"      VARCHAR(100) NOT NULL,
  "productPrice"      DECIMAL(10,2) NOT NULL,
  "productImage"      TEXT DEFAULT NULL,
  "handInStock"       INT NOT NULL DEFAULT 0,
  "productQuantity"   INT NOT NULL DEFAULT 0,
  "productStatus"     VARCHAR(20) NOT NULL DEFAULT 'Available',
  "prodCatLookupId"   INT REFERENCES prodcat_lookup("prodCatLookupId"),
  "prodBrandLookupId" INT REFERENCES prodbrand_lookup("prodBrandLookupId"),
  "isDeleted"         BOOLEAN NOT NULL DEFAULT FALSE
);

-- ===== orderproduct (join table) =====
CREATE TABLE orderproduct (
  "orderId"              INT REFERENCES orders("orderID") ON DELETE CASCADE,
  "productId"            INT REFERENCES products("productID"),
  "orderProductQuantity" INT NOT NULL,
  PRIMARY KEY ("orderId", "productId")
);

-- ============================================================
-- If you already have this database created and just need to
-- add the soft-delete columns to existing tables, run this
-- instead of recreating everything from scratch:
-- ============================================================
-- ALTER TABLE products         ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE prodcat_lookup   ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE prodbrand_lookup ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE driver           ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- If you already have "products" created and just need to add the
-- warehouse quantity column, run this instead of recreating everything:
-- ============================================================
-- ALTER TABLE products ADD COLUMN "productQuantity" INT NOT NULL DEFAULT 0;
-- -- Optional one-time backfill if you'd like existing rows to start out
-- -- Available/Not Available based on their current handInStock value:
-- -- UPDATE products SET "productQuantity" = "handInStock";
-- -- UPDATE products SET "productStatus" = CASE WHEN "productQuantity" > 0 THEN 'Available' ELSE 'Not Available' END;
