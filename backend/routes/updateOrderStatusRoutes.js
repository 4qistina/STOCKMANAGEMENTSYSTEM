const express = require('express');
const router = express.Router();
const controller = require('../controllers/updateOrderStatusController');

router.get('/order-status/list', controller.viewOrderStatusList);
router.put('/order-status/:id', controller.updateOrderStatus);

module.exports = router;