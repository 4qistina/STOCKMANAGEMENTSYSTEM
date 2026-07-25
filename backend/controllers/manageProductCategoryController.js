const catModel = require('../models/prodCatModel');
const express = require('express');
const { requireRole } = require('../middleware/roleCheck');
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

// If any product (including already-deleted ones) still references this
// category, soft delete it instead of hard deleting (avoids an FK error and
// keeps history intact). Otherwise it's a brand new/unused category, hard delete it.
async function selectDeleteProductCategory(req, res) {
  try {
    const category = await catModel.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const referenced = await catModel.isReferenced(req.params.id);

    if (referenced) {
      await catModel.softDelete(req.params.id);
      return res.status(200).json({ message: 'Category is still referenced by product(s), so it was archived (soft deleted) instead of removed.' });
    }

    await catModel.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// So warehouse staff can see categories that were archived (soft deleted).
async function viewDeletedCategoryList(req, res) {
  try {
    res.json(await catModel.findDeleted());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Bring an archived category back into active use.
async function selectRestoreProductCategory(req, res) {
  try {
    const category = await catModel.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    if (!category.isDeleted) return res.status(400).json({ error: 'Category is not deleted.' });

    const restored = await catModel.restore(req.params.id);
    res.json(restored);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Reading the category list is needed by Supervisors too (product filters/lookups),
// so it stays open to any logged-in role. Only mutations are Warehouse Staff-only.
router.get('/categories', viewCategoryList);
router.get('/categories/deleted', requireRole('warehouse_staff'), viewDeletedCategoryList);
router.post('/categories', requireRole('warehouse_staff'), selectAddNewProductCategory);
router.put('/categories/:id', requireRole('warehouse_staff'), selectEditProductCategory);
router.put('/categories/:id/restore', requireRole('warehouse_staff'), selectRestoreProductCategory);
router.delete('/categories/:id', requireRole('warehouse_staff'), selectDeleteProductCategory);

module.exports = router;
