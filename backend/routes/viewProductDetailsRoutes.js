const express = require('express');
const router = express.Router();
const controller = require('../controllers/viewProductDetailsController');

router.get('/products/menu', controller.selectProductMenu);
router.get('/products/search', controller.searchProduct);
router.get('/products/:id', controller.viewDetails);

module.exports = router;