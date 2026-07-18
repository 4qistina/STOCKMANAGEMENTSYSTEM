const orderModel = require('../models/orderModel');

async function viewOrderStatusList(req, res) {
  try {
    res.json(await orderModel.findAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const updated = await orderModel.update(req.params.id, { orderStatus: req.body.orderStatus });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { viewOrderStatusList, updateOrderStatus };