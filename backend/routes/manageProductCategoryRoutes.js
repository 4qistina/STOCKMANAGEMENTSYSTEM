const express = require('express');
const router = express.Router();
const controller = require('../controllers/manageProductCategoryController');

router.get('/categories', controller.viewCategoryList);
router.post('/categories', controller.selectAddNewProductCategory);
router.put('/categories/:id', controller.selectEditProductCategory);
router.delete('/categories/:id', controller.selectDeleteProductCategory);

module.exports = router;