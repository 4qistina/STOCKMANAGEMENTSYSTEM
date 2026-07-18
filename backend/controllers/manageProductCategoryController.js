const catModel = require('../models/prodCatModel');

async function viewCategoryList(req, res) {
  try {
    res.json(await catModel.findAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function selectEditProductCategory(req, res) {
  try {
    res.json(await catModel.update(req.params.id, req.body.productCategory));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function selectAddNewProductCategory(req, res) {
  try {
    const category = await catModel.insert(req.body.productCategory);
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function selectDeleteProductCategory(req, res) {
  try {
    await catModel.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { viewCategoryList, selectEditProductCategory, selectAddNewProductCategory, selectDeleteProductCategory };