const pool = require('../configuration/db');
const orderModel = require('../models/orderModel');
const orderProductModel = require('../models/orderProductModel');
const productModel = require('../models/productModel');

// GET /api/place-order/products
// Supports optional ?category=&brand=&model= filters, same as /api/products/search
async function viewProduct(req, res) {
  try {
    const { category, brand, model } = req.query;
    res.json(await productModel.findAvailable(category, brand, model));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/place-order
// Business logic: validate cart, create order, insert line items, decrement stock.
// items = [{ productId, quantity }]
async function placeOrder(req, res) {
  const { userId, items } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing user session. Please log in again.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validate every line item before writing anything (E1 + E2 + stock checks)
    for (const item of items) {
      // [E2] Quantity must be greater than 0
      if (!item.quantity || item.quantity <= 0) {
        throw new Error('Please enter a value greater than 0');
      }

      const product = await productModel.findById(item.productId, client);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      // [E1] Product Not Available
      if (product.productStatus === 'Not Available') {
        throw new Error(`"${product.productModel}" is not available and cannot be ordered.`);
      }

      if (product.handInStock < item.quantity) {
        throw new Error(`Only ${product.handInStock} unit(s) of "${product.productModel}" left in stock.`);
      }
    }

    const orderNumber = 'ORD-' + Date.now();
    const order = await orderModel.insert({ orderNumber, userId }, client);

    for (const item of items) {
      const product = await productModel.findById(item.productId, client);

      await orderProductModel.insert(
        {
          orderId: order.orderID,
          productId: item.productId,
          orderProductQuantity: item.quantity,
        },
        client
      );

      await productModel.update(
        item.productId,
        {
          ...product,
          handInStock: product.handInStock - item.quantity,
        },
        client
      );
    }

    await client.query('COMMIT');
    res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

module.exports = { viewProduct, placeOrder };
