const pool = require('../configuration/db');
const deliveryModel = require('../models/deliveryModel');
const driverModel = require('../models/driverModel');
const orderModel = require('../models/orderModel');
const orderProductModel = require('../models/orderProductModel');
const productModel = require('../models/productModel');
const express = require('express');
const router = express.Router();

// GET /api/delivery/orders/ready
// Orders approved by the Warehouse but not yet dispatched to a driver —
// candidates for the "Assign Driver" step. A single dispatch can select
// several of these at once (one delivery, multiple orders, one driver).
async function listOrdersForDelivery(req, res) {
  try {
    const orders = await orderModel.findAllDetailed();
    const ready = orders.filter((o) => o.orderStatus === 'Available' && !o.deliveryId);
    res.json(ready); // [E1: "No records available."] handled client-side when empty
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/delivery/orders/dispatched
// Orders already assigned to a driver and out on the road — candidates for
// the "Mark as Delivered" step.
async function listDispatchedOrders(req, res) {
  try {
    const orders = await orderModel.findAllDetailed();
    const dispatched = orders.filter((o) => o.deliveryStatus === 'Out for Delivery');
    res.json(dispatched);
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

// POST /api/delivery/dispatch  { orderIds: number[], driverId, deliveryDate }
// Assigns ONE driver to one or more approved-but-undispatched orders,
// batching them onto a single new delivery. This is the moment a driver
// becomes "Delivering" (busy) — so the driver must currently be Available
// (on shift and not already out on another delivery).
async function dispatchDelivery(req, res) {
  const { driverId, deliveryDate } = req.body;
  const orderIds = Array.isArray(req.body.orderIds)
    ? req.body.orderIds
    : req.body.orderId
    ? [req.body.orderId]
    : [];

  if (orderIds.length === 0) {
    return res.status(400).json({ error: 'Select at least one order to dispatch.' });
  }
  if (!driverId) {
    return res.status(400).json({ error: 'driverId is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const driver = await driverModel.findById(driverId, client);
    if (!driver) throw new Error('Driver not found');
    if (!driver.isOnShift) {
      throw new Error(`${driver.driverName} is off shift and cannot be assigned a delivery.`);
    }
    const busy = await driverModel.isCurrentlyDelivering(driverId, client);
    if (busy) {
      throw new Error(`${driver.driverName} is currently out on another delivery.`);
    }

    // Validate every selected order before writing anything
    const orders = [];
    for (const id of orderIds) {
      const order = await orderModel.findById(id, client);
      if (!order) throw new Error(`Order ${id} not found`);
      if (order.orderStatus !== 'Available') {
        throw new Error(`Order ${order.orderNumber} has not been approved yet.`);
      }
      if (order.deliveryId) {
        throw new Error(`Order ${order.orderNumber} has already been dispatched.`);
      }
      orders.push(order);
    }

    const delivery = await deliveryModel.insert(
      { deliveryDate, deliveryStatus: 'Out for Delivery', driverId },
      client
    );

    for (const order of orders) {
      await orderModel.update(order.orderID, { deliveryId: delivery.deliveryId }, client);
    }

    await client.query('COMMIT');
    res.status(201).json({
      confirmation: `${orders.length} order(s) dispatched to ${driver.driverName}`,
      delivery,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

// GET /api/delivery/:id — a single delivery plus every order riding on it
async function viewDeliveryInfo(req, res) {
  try {
    const delivery = await deliveryModel.findById(req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    let driver = null;
    if (delivery.driverId) driver = await driverModel.findById(delivery.driverId);
    const orders = await orderModel.findAllByDeliveryId(req.params.id);

    res.json({ ...delivery, driver, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/delivery/:id/deliver  { deliveredDate?, recipientName? }
// Completes a dispatched delivery: marks it Delivered, credits handInStock
// for every order riding on it, and — since the delivery is no longer
// 'Out for Delivery' — frees the driver back up to 'Available'.
async function markDelivered(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await deliveryModel.findById(req.params.id, client);
    if (!existing) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Delivery not found' });
    }
    const previousStatus = existing.deliveryStatus;

    const updated = await deliveryModel.update(
      req.params.id,
      {
        deliveryStatus: 'Delivered',
        deliveredDate: req.body.deliveredDate || new Date().toISOString().slice(0, 10),
        recipientName: req.body.recipientName,
      },
      client
    );

    // Credit retail stock exactly once, on the transition into 'Delivered'
    if (previousStatus !== 'Delivered') {
      const orders = await orderModel.findAllByDeliveryId(req.params.id, client);
      for (const order of orders) {
        await creditDeliveredStock(order.orderID, client);
      }
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
router.get('/delivery/orders/dispatched', listDispatchedOrders);
router.post('/delivery/dispatch', dispatchDelivery);
router.get('/delivery/:id', viewDeliveryInfo);
router.put('/delivery/:id/deliver', markDelivered);

module.exports = router;
