const brandModel = require('../models/prodBrandModel');

async function viewBrandList(req, res) {
  try {
    res.json(await brandModel.findAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function selectEditProductBrand(req, res) {
  try {
    res.json(await brandModel.update(req.params.id, req.body.productBrand));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function selectAddNewProductBrand(req, res) {
  try {
    const brand = await brandModel.insert(req.body.productBrand);
    res.status(201).json(brand);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function selectDeleteProductBrand(req, res) {
  try {
    await brandModel.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { viewBrandList, selectEditProductBrand, selectAddNewProductBrand, selectDeleteProductBrand };