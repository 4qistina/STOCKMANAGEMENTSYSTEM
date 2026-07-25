const pool = require('../configuration/db');
const deliveryModel = require('../models/deliveryModel');
const driverModel = require('../models/driverModel');
const orderModel = require('../models/orderModel');
const orderProductModel = require('../models/orderProductModel');
const productModel = require('../models/productModel');
const express = require('express');
const router = express.Router();

// GET /api/delivery/orders/ready  [1.1/1.2] Orders that are approved and not yet delivered
// Includes line items and submittedBy (via orderModel.findAllDetailed) so the
// frontend can show a full order-details view before updating delivery info.
async function listOrdersForDelivery(req, res) {
  try {
    const orders = await orderModel.findAllDetailed();
    const ready = orders.filter(
      (o) => o.orderStatus === 'Available' && (!o.deliveryId || o.deliveryStatus !== 'Delivered')
    );
    res.json(ready); // [E1: "No records available."] handled client-side when empty
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Once a delivery is marked 'Delivered', credit the retail location's
// handInStock with every one of that order's line-item quantities — the
// counterpart to the warehouse's productQuantity being deducted back when
// the order was approved. Callers are responsible for only invoking this on
// the transition INTO 'Delivered' (not on every subsequent update), so an
// order's stock is only ever credited once.
async function creditDeliveredStock(orderId, client) {
  const items = await orderProductModel.findByOrder(orderId, client);
  for (const item of items) {
    const product = await productModel.findById(item.productId, client);
    if (!product) continue;
    await productModel.update(
      item.productId,
      { ...product, handInStock: (product.handInStock || 0) + item.orderProductQuantity },
      client
    );
  }
}

// POST /api/delivery  [1.3-1.6] Assign/record delivery info for an approved order
async function assignDelivery(req, res) {
  const { orderId, deliveryDate, deliveredDate, recipientName, driverId, deliveryStatus } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const order = await orderModel.findById(orderId, client);
    if (!order) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    let deliveryId = order.deliveryId;
    let previousStatus = null;
    if (!deliveryId) {
      const created = await deliveryModel.insert({ deliveryDate, recipientName, driverId }, client);
      deliveryId = created.deliveryId;
      previousStatus = created.deliveryStatus; // 'Pending'
      await orderModel.update(orderId, { deliveryId }, client);
    } else {
      const existing = await deliveryModel.findById(deliveryId, client);
      previousStatus = existing ? existing.deliveryStatus : null;
    }

    const nextStatus = deliveryStatus || 'Delivered';
    const updated = await deliveryModel.update(
      deliveryId,
      { deliveryDate, deliveryStatus: nextStatus, deliveredDate, recipientName, driverId },
      client
    );

    // Credit retail stock exactly once, on the transition into 'Delivered'
    if (nextStatus === 'Delivered' && previousStatus !== 'Delivered') {
      await creditDeliveredStock(orderId, client);
    }

    await client.query('COMMIT');
    res.json({ confirmation: 'Delivery information updated', delivery: updated });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

async function viewDeliveryInfo(req, res) {
  try {
    const delivery = await deliveryModel.findById(req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    let driver = null;
    if (delivery.driverId) driver = await driverModel.findById(delivery.driverId);

    res.json({ ...delivery, driver });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateDelivery(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await deliveryModel.findById(req.params.id, client);
    if (!existing) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Delivery not found' });
    }
    const previousStatus = existing.deliveryStatus;
    const nextStatus = req.body.deliveryStatus || 'Delivered';

    const updated = await deliveryModel.update(
      req.params.id,
      {
        deliveryStatus: nextStatus,
        deliveredDate: req.body.deliveredDate || new Date().toISOString().slice(0, 10),
        driverId: req.body.driverId,
      },
      client
    );

    // Credit retail stock exactly once, on the transition into 'Delivered'
    if (nextStatus === 'Delivered' && previousStatus !== 'Delivered') {
      const order = await orderModel.findByDeliveryId(req.params.id, client);
      if (order) await creditDeliveredStock(order.orderID, client);
    }

    await client.query('COMMIT');
    res.json(updated);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
}

router.get('/delivery/orders/ready', listOrdersForDelivery);
router.post('/delivery', assignDelivery);
router.get('/delivery/:id', viewDeliveryInfo);
router.put('/delivery/:id', updateDelivery);

module.exports = router;
