const deliveryModel = require('../models/deliveryModel');
const driverModel = require('../models/driverModel');
const orderModel = require('../models/orderModel');
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

// POST /api/delivery  [1.3-1.6] Assign/record delivery info for an approved order
async function assignDelivery(req, res) {
  try {
    const { orderId, deliveryDate, deliveredDate, recipientName, driverId, deliveryStatus } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    let deliveryId = order.deliveryId;
    if (!deliveryId) {
      const created = await deliveryModel.insert({ deliveryDate, recipientName, driverId });
      deliveryId = created.deliveryId;
      await orderModel.update(orderId, { deliveryId });
    }

    const updated = await deliveryModel.update(deliveryId, {
      deliveryDate,
      deliveryStatus: deliveryStatus || 'Delivered',
      deliveredDate,
      recipientName,
      driverId,
    });

    res.json({ confirmation: 'Delivery information updated', delivery: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  try {
    const updated = await deliveryModel.update(req.params.id, {
      deliveryStatus: req.body.deliveryStatus || 'Delivered',
      deliveredDate: req.body.deliveredDate || new Date().toISOString().slice(0, 10),
      driverId: req.body.driverId,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

router.get('/delivery/orders/ready', listOrdersForDelivery);
router.post('/delivery', assignDelivery);
router.get('/delivery/:id', viewDeliveryInfo);
router.put('/delivery/:id', updateDelivery);

module.exports = router;
