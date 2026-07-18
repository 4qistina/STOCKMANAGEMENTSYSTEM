const express = require('express');
const router = express.Router();
const controller = require('../controllers/maintainProductController');

router.get('/maintain-product/menu', controller.viewProductMenu);
router.get('/maintain-product/search/:id', controller.searchProduct);
router.post('/maintain-product', controller.selectAddNewProduct);
router.put('/maintain-product/:id', controller.selectEditProductDetails);
router.delete('/maintain-product/:id', controller.selectDeleteProduct);

module.exports = router;