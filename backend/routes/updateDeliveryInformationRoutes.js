const express = require('express');
const router = express.Router();
const controller = require('../controllers/updateDeliveryInformationController');

router.get('/delivery/orders/ready', controller.listOrdersForDelivery);
router.post('/delivery', controller.assignDelivery);
router.get('/delivery/:id', controller.viewDeliveryInfo);
router.put('/delivery/:id', controller.updateDelivery);

module.exports = router;