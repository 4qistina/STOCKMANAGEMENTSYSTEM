const productModel = require('../models/productModel');

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
    // [E1: Error "Please enter a value greater than 0"]
    if (newStock === undefined || newStock === null || Number(newStock) <= 0) {
      return res.status(400).json({ error: 'Please enter a value greater than 0' });
    }

    const updated = await productModel.update(req.params.id, { ...product, handInStock: newStock });
    res.json({ confirmation: 'Stock updated', product: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { searchProduct, getProductList, updateStock };