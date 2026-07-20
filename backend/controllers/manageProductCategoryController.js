const catModel = require('../models/prodCatModel');
const express = require('express');
const router = express.Router();

const MAX_LEN = 100;

async function viewCategoryList(req, res) {
  try {
    res.json(await catModel.findAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// [E1: Invalid Form Submission]
function validateName(name) {
  if (!name || !String(name).trim()) return 'Category name is required.';
  if (String(name).trim().length > MAX_LEN) return `Category name must be ${MAX_LEN} characters or fewer.`;
  return null;
}

async function selectAddNewProductCategory(req, res) {
  try {
    const name = req.body.productCategory;
    const invalid = validateName(name);
    if (invalid) return res.status(400).json({ error: invalid });

    // [E2: Duplicate Category]
    const existing = await catModel.findByName(name.trim());
    if (existing) return res.status(409).json({ error: `Category "${name.trim()}" already exists.` });

    const category = await catModel.insert(name.trim());
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function selectEditProductCategory(req, res) {
  try {
    const name = req.body.productCategory;
    const invalid = validateName(name);
    if (invalid) return res.status(400).json({ error: invalid });

    // [E2: Duplicate Category] — allow keeping the same name on its own record
    const existing = await catModel.findByName(name.trim());
    if (existing && String(existing.prodCatLookupId) !== String(req.params.id)) {
      return res.status(409).json({ error: `Category "${name.trim()}" already exists.` });
    }

    const updated = await catModel.update(req.params.id, name.trim());
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.json(updated);
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

router.get('/categories', viewCategoryList);
router.post('/categories', selectAddNewProductCategory);
router.put('/categories/:id', selectEditProductCategory);
router.delete('/categories/:id', selectDeleteProductCategory);

module.exports = router;
