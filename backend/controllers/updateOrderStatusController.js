const orderModel = require('../models/orderModel');
const express = require('express');
const router = express.Router();

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

router.get('/order-status/list', viewOrderStatusList);
router.put('/order-status/:id', updateOrderStatus);

module.exports = router;
