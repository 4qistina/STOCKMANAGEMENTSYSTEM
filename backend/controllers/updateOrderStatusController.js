const pool = require('../configuration/db');
const orderModel = require('../models/orderModel');
const orderProductModel = require('../models/orderProductModel');
const productModel = require('../models/productModel');
const express = require('express');
const router = express.Router();

async function viewOrderStatusList(req, res) {
  try {
    res.json(await orderModel.findAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/order-status/:id
// Approving an order (Pending -> Available/"Approved") is the moment stock is
// actually committed: each line item's ordered quantity is deducted from the
// WAREHOUSE's productQuantity right here, not back when the Supervisor
// originally placed the order. (This never touches the Supervisor's own
// retail handInStock — that's a separate value the Supervisor manages
// themselves once the delivery physically arrives.) Runs in a transaction so
// the status flip and every stock deduction succeed or fail together — a
// half-applied approval should never happen.
async function updateOrderStatus(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const order = await orderModel.findById(req.params.id, client);
    if (!order) {
      throw new Error('Order not found');
    }

    const nextStatus = req.body.orderStatus;

    // Guard on the order's CURRENT status, not just the requested one: stock
    // is only deducted the first time an order moves out of Pending. If this
    // endpoint is ever called twice for the same order (double click, retry,
    // etc.), the second call sees the order is already Approved and skips the
    // deduction, so stock can never be subtracted twice for one order.
    if (nextStatus === 'Available' && order.orderStatus === 'Pending') {
      const items = await orderProductModel.findByOrder(order.orderID, client);

      for (const item of items) {
        const product = await productModel.findById(item.productId, client);
        if (!product) continue;

        await productModel.update(
          item.productId,
          {
            ...product,
            // Floored at 0 as a safety net. In the normal case this can't go
            // negative anyway, since placeOrderController already rejects
            // any order that requests more than productQuantity allows.
            productQuantity: Math.max(0, product.productQuantity - item.orderProductQuantity),
          },
          client
        );
      }
    }

    const updated = await orderModel.update(req.params.id, { orderStatus: nextStatus }, client);

    await client.query('COMMIT');
    res.json(updated);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

router.get('/order-status/list', viewOrderStatusList);
router.put('/order-status/:id', updateOrderStatus);

module.exports = router;
