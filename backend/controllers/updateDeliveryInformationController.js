const pool = require('../configuration/db');
const deliveryModel = require('../models/deliveryModel');
const driverModel = require('../models/driverModel');
const orderModel = require('../models/orderModel');

// GET /api/delivery/orders/ready  [1.1/1.2] Orders that are approved and not yet delivered
async function listOrdersForDelivery(req, res) {
  try {
    const result = await pool.query(
      `SELECT o."orderID", o."orderNumber", o."orderDate", o."orderStatus", o."deliveryId",
              d."deliveryDate", d."deliveredDate", d."recipientName", d."deliveryStatus", d."driverId"
       FROM orders o
       LEFT JOIN delivery d ON d."deliveryId" = o."deliveryId"
       WHERE o."orderStatus" = 'Available'
         AND (d."deliveryId" IS NULL OR d."deliveryStatus" IS DISTINCT FROM 'Delivered')
       ORDER BY o."orderDate" DESC`
    );
    res.json(result.rows); // [E1: "No records available."] handled client-side when empty
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

module.exports = { viewDeliveryInfo, updateDelivery, listOrdersForDelivery, assignDelivery };