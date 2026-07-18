const express = require('express');
const router = express.Router();
const controller = require('../controllers/updateProductStockController');

router.get('/stock/search/:id', controller.searchProduct);
router.get('/stock/list', controller.getProductList);
router.put('/stock/:id', controller.updateStock);

module.exports = router;