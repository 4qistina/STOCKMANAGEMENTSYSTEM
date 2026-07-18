const orderModel = require('../models/orderModel');
const orderProductModel = require('../models/orderProductModel');

async function searchOrder(req, res) {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function viewActiveOrder(req, res) {
  try {
    const orders = await orderModel.findByUser(req.params.userId);
    res.json(orders.filter((o) => o.orderStatus !== 'Completed'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function viewOrderHistory(req, res) {
  try {
    const orders = await orderModel.findByUser(req.params.userId);
    res.json(orders.filter((o) => o.orderStatus === 'Completed'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function displayOrderHistory(req, res) {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const items = await orderProductModel.findByOrder(req.params.id);
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function displayActiveOrder(req, res) {
  return displayOrderHistory(req, res);
}

module.exports = { searchOrder, viewActiveOrder, viewOrderHistory, displayOrderHistory, displayActiveOrder };