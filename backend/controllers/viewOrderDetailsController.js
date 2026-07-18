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

// GET /api/orders/active/:userId  [A1: View Current Order]
// Orders the warehouse hasn't finished delivering yet (no "deliveredDate" set).
async function viewActiveOrder(req, res) {
  try {
    const orders = await orderModel.findDetailedByUser(req.params.userId);
    res.json(orders.filter((o) => !o.deliveredDate));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/orders/history/:userId  [A2: View Order History]
// Orders that have already been delivered, including delivery/driver details.
async function viewOrderHistory(req, res) {
  try {
    const orders = await orderModel.findDetailedByUser(req.params.userId);
    res.json(orders.filter((o) => !!o.deliveredDate));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/orders/active  [Warehouse Staff — A1: View Active Order]
// All Supervisors' orders that haven't been delivered yet.
async function viewAllActiveOrders(req, res) {
  try {
    const orders = await orderModel.findAllDetailed();
    res.json(orders.filter((o) => !o.deliveredDate));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/orders/history  [Warehouse Staff — A2: View Order History]
// All Supervisors' orders that have already been delivered.
async function viewAllOrderHistory(req, res) {
  try {
    const orders = await orderModel.findAllDetailed();
    res.json(orders.filter((o) => !!o.deliveredDate));
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

module.exports = {
  searchOrder,
  viewActiveOrder,
  viewOrderHistory,
  viewAllActiveOrders,
  viewAllOrderHistory,
  displayOrderHistory,
  displayActiveOrder,
};
