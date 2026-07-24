const productModel = require('../models/productModel');
const express = require('express');
const router = express.Router();

/**
 * GET /api/products/menu
 * Fetches all products (for the main listing page)
 */
async function selectProductMenu(req, res) {
  try {
    const products = await productModel.findAll();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/products/search
 * Filters products by category, brand, or model
 */
async function searchProduct(req, res) {
  try {
    const { category, brand, model } = req.query;
    const products = await productModel.findAvailable(category, brand, model);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/products/:id
 * Fetches a single product's detailed view
 */
async function viewDetails(req, res) {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Note: adding, updating, and deleting products live in
// maintainProductController.js — this controller stays read-only (view/search).

router.get('/products/menu', selectProductMenu);
router.get('/products/search', searchProduct);
router.get('/products/:id', viewDetails);

module.exports = router;
