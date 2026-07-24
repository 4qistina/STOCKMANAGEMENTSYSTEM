const productModel = require('../models/productModel');
const express = require('express');
const router = express.Router();

// Note: listing all products and looking one up by ID live in
// viewProductDetailsController.js (selectProductMenu / viewDetails) — this
// controller only handles create/update/delete/restore.

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

// If the product has order history, soft delete it (keeps order records
// intact, just hides it going forward). Otherwise it's safe to hard delete.
async function selectDeleteProduct(req, res) {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const referenced = await productModel.hasOrderHistory(req.params.id);

    if (referenced) {
      await productModel.softDelete(req.params.id);
      return res.status(200).json({ message: 'Product has order history, so it was archived (soft deleted) instead of removed.' });
    }

    await productModel.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// So warehouse staff can see products that were archived (soft deleted).
async function viewDeletedProductList(req, res) {
  try {
    res.json(await productModel.findDeleted());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Bring an archived product back into active use.
async function selectRestoreProduct(req, res) {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!product.isDeleted) return res.status(400).json({ error: 'Product is not deleted.' });

    const restored = await productModel.restore(req.params.id);
    res.json(restored);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

router.get('/maintain-product/deleted', viewDeletedProductList);
router.post('/maintain-product', selectAddNewProduct);
router.put('/maintain-product/:id', selectEditProductDetails);
router.put('/maintain-product/:id/restore', selectRestoreProduct);
router.delete('/maintain-product/:id', selectDeleteProduct);

module.exports = router;
