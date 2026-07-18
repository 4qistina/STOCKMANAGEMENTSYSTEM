const express = require('express');
const router = express.Router();
const controller = require('../controllers/placeOrderController');

router.get('/place-order/products', controller.viewProduct);
router.post('/place-order', controller.placeOrder);

module.exports = router;