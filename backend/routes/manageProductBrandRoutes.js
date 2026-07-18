const express = require('express');
const router = express.Router();
const controller = require('../controllers/manageProductBrandController');

router.get('/brands', controller.viewBrandList);
router.post('/brands', controller.selectAddNewProductBrand);
router.put('/brands/:id', controller.selectEditProductBrand);
router.delete('/brands/:id', controller.selectDeleteProductBrand);

module.exports = router;