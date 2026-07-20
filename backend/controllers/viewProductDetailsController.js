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

/**
 * POST /api/products
 * Adds a new product - now securely capturing 'productImage'
 */
async function addProduct(req, res) {
  try {
    const { 
      productCode, 
      productModel: modelName, // mapped to model property
      productPrice, 
      handInStock, 
      prodCatLookupId, 
      prodBrandLookupId,
      productImage // <-- Captured from request body
    } = req.body;

    // Validate required fields
    if (!productCode || !modelName || productPrice === undefined) {
      return res.status(400).json({ error: 'Missing required product details' });
    }

    const newProduct = await productModel.insert({
      productCode,
      productModel: modelName,
      productPrice,
      handInStock: handInStock || 0,
      prodCatLookupId,
      prodBrandLookupId,
      productImage // <-- Passed down to updated DB model
    });

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PUT /api/products/:id
 * Updates an existing product - handles 'productImage' updates
 */
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { 
      productCode, 
      productModel: modelName, 
      productPrice, 
      handInStock, 
      productStatus, 
      prodCatLookupId, 
      prodBrandLookupId,
      productImage // <-- Captured from update request
    } = req.body;

    const updatedProduct = await productModel.update(id, {
      productCode,
      productModel: modelName,
      productPrice,
      handInStock,
      productStatus,
      prodCatLookupId,
      prodBrandLookupId,
      productImage // <-- Sent down to updated DB model
    });

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/products/:id
 * Deletes a product
 */
async function deleteProduct(req, res) {
  try {
    await productModel.remove(req.params.id);
    res.json({ message: 'Product successfully deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

router.get('/products/menu', selectProductMenu);
router.get('/products/search', searchProduct);
router.get('/products/:id', viewDetails);

module.exports = router;
