const express = require('express');
const router = express.Router();
const controller = require('../controllers/viewOrderDetailsController');

router.get('/orders/search/:id', controller.searchOrder);
// Warehouse Staff: view Active Orders / Order History for ALL Supervisors
router.get('/orders/active', controller.viewAllActiveOrders);
router.get('/orders/history', controller.viewAllOrderHistory);
router.get('/orders/active/:userId', controller.viewActiveOrder);
router.get('/orders/history/:userId', controller.viewOrderHistory);
router.get('/orders/:id/history-detail', controller.displayOrderHistory);
router.get('/orders/:id/active-detail', controller.displayActiveOrder);

module.exports = router;