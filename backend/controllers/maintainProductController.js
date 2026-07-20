const productModel = require('../models/productModel');
const express = require('express');
const router = express.Router();

async function viewProductMenu(req, res) {
  try {
    res.json(await productModel.findAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function searchProduct(req, res) {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function selectAddNewProduct(req, res) {
  try {
    const product = await productModel.insert(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function selectEditProductDetails(req, res) {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const updated = await productModel.update(req.params.id, { ...product, ...req.body });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function selectDeleteProduct(req, res) {
  try {
    await productModel.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

router.get('/maintain-product/menu', viewProductMenu);
router.get('/maintain-product/search/:id', searchProduct);
router.post('/maintain-product', selectAddNewProduct);
router.put('/maintain-product/:id', selectEditProductDetails);
router.delete('/maintain-product/:id', selectDeleteProduct);

module.exports = router;
