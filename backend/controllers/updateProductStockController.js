const productModel = require('../models/productModel');
const express = require('express');
const router = express.Router();

async function searchProduct(req, res) {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getProductList(req, res) {
  try {
    res.json(await productModel.findAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Business rule: stock cannot go negative
async function updateStock(req, res) {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const newStock = req.body.handInStock;
    // Business rule: stock cannot go negative, but 0 is a valid value (e.g. sold out completely)
    if (newStock === undefined || newStock === null || Number.isNaN(Number(newStock)) || Number(newStock) < 0) {
      return res.status(400).json({ error: 'Please enter a value of 0 or greater' });
    }

    const updated = await productModel.update(req.params.id, { ...product, handInStock: newStock });
    res.json({ confirmation: 'Stock updated', product: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

router.get('/stock/search/:id', searchProduct);
router.get('/stock/list', getProductList);
router.put('/stock/:id', updateStock);

module.exports = router;
