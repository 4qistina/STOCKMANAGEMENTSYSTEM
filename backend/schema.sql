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
  "driverId"       SERIAL PRIMARY KEY,
  "driverName"     VARCHAR(100) NOT NULL,
  "driverPhoneNumb" VARCHAR(20) NOT NULL
);

-- ===== delivery =====
CREATE TABLE delivery (
  "deliveryId"    SERIAL PRIMARY KEY,
  "deliveryDate"  DATE,
  "deliveryStatus" VARCHAR(50),
  "deliveredDate" DATE,
  "recipientName" VARCHAR(100),
  "driverId"      INT REFERENCES driver("driverId")
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
  "productCategory" VARCHAR(100) NOT NULL
);

-- ===== prodbrand_lookup =====
CREATE TABLE prodbrand_lookup (
  "prodBrandLookupId" SERIAL PRIMARY KEY,
  "productBrand"       VARCHAR(100) NOT NULL
);

-- ===== products =====
CREATE TABLE products (
  "productID"         SERIAL PRIMARY KEY,
  "productCode"       VARCHAR(50) NOT NULL,
  "productModel"      VARCHAR(100) NOT NULL,
  "productPrice"      DECIMAL(10,2) NOT NULL,
  "productImage"      VARCHAR(255) DEFAULT NULL,
  "handInStock"       INT NOT NULL DEFAULT 0,
  "productStatus"     VARCHAR(20) NOT NULL DEFAULT 'Available',
  "prodCatLookupId"   INT REFERENCES prodcat_lookup("prodCatLookupId"),
  "prodBrandLookupId" INT REFERENCES prodbrand_lookup("prodBrandLookupId")
);

-- ===== orderproduct (join table) =====
CREATE TABLE orderproduct (
  "orderId"              INT REFERENCES orders("orderID") ON DELETE CASCADE,
  "productId"            INT REFERENCES products("productID"),
  "orderProductQuantity" INT NOT NULL,
  PRIMARY KEY ("orderId", "productId")
);