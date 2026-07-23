const brandModel = require('../models/prodBrandModel');
const express = require('express');
const router = express.Router();

const MAX_LEN = 50; // Special Requirement: brand name max character limit

async function viewBrandList(req, res) {
  try {
    res.json(await brandModel.findAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// [E2: Required fields missing]
function validateName(name) {
  if (!name || !String(name).trim()) return 'Brand name is required.';
  if (String(name).trim().length > MAX_LEN) return `Brand name must be ${MAX_LEN} characters or fewer.`;
  return null;
}

async function selectAddNewProductBrand(req, res) {
  try {
    const name = req.body.productBrand;
    const invalid = validateName(name);
    if (invalid) return res.status(400).json({ error: invalid });

    // [E1: Duplicate Item]
    const existing = await brandModel.findByName(name.trim());
    if (existing) return res.status(409).json({ error: `Brand "${name.trim()}" already exists.` });

    const brand = await brandModel.insert(name.trim());
    res.status(201).json(brand);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function selectEditProductBrand(req, res) {
  try {
    const name = req.body.productBrand;
    const invalid = validateName(name);
    if (invalid) return res.status(400).json({ error: invalid });

    // [E1: Duplicate Item] — allow keeping the same name on its own record
    const existing = await brandModel.findByName(name.trim());
    if (existing && String(existing.prodBrandLookupId) !== String(req.params.id)) {
      return res.status(409).json({ error: `Brand "${name.trim()}" already exists.` });
    }

    const updated = await brandModel.update(req.params.id, name.trim());
    if (!updated) return res.status(404).json({ error: 'Brand not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// If any product (including already-deleted ones) still references this
// brand, soft delete instead of hard delete. Otherwise hard delete.
async function selectDeleteProductBrand(req, res) {
  try {
    const brand = await brandModel.findById(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });

    const referenced = await brandModel.isReferenced(req.params.id);

    if (referenced) {
      await brandModel.softDelete(req.params.id);
      return res.status(200).json({ message: 'Brand is still referenced by product(s), so it was archived (soft deleted) instead of removed.' });
    }

    await brandModel.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// So warehouse staff can see brands that were archived (soft deleted).
async function viewDeletedBrandList(req, res) {
  try {
    res.json(await brandModel.findDeleted());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Bring an archived brand back into active use.
async function selectRestoreProductBrand(req, res) {
  try {
    const brand = await brandModel.findById(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    if (!brand.isDeleted) return res.status(400).json({ error: 'Brand is not deleted.' });

    const restored = await brandModel.restore(req.params.id);
    res.json(restored);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

router.get('/brands', viewBrandList);
router.get('/brands/deleted', viewDeletedBrandList);
router.post('/brands', selectAddNewProductBrand);
router.put('/brands/:id', selectEditProductBrand);
router.put('/brands/:id/restore', selectRestoreProductBrand);
router.delete('/brands/:id', selectDeleteProductBrand);

module.exports = router;
