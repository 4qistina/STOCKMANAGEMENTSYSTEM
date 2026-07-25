const driverModel = require('../models/driverModel');
const express = require('express');
const router = express.Router();

async function viewDriverInfoList(req, res) {
  try {
    res.json(await driverModel.findAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function selectEditDriverInfo(req, res) {
  try {
    const updated = await driverModel.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/drivers/:id/shift  { isOnShift: boolean }
async function selectSetDriverShift(req, res) {
  try {
    const driver = await driverModel.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const { isOnShift } = req.body;
    if (typeof isOnShift !== 'boolean') {
      return res.status(400).json({ error: 'isOnShift must be true or false' });
    }

    const updated = await driverModel.setShift(req.params.id, isOnShift);
    res.json(await driverModel.findById(updated.driverId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function selectAddNewDriverInfo(req, res) {
  try {
    const driver = await driverModel.insert(req.body);
    res.status(201).json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// If the driver has ever been assigned to a delivery, soft delete instead of
// hard delete (keeps delivery/order history intact). Otherwise hard delete.
async function selectDeleteEditInfo(req, res) {
  try {
    const driver = await driverModel.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const referenced = await driverModel.isReferenced(req.params.id);

    if (referenced) {
      await driverModel.softDelete(req.params.id);
      return res.status(200).json({ message: 'Driver has delivery history, so it was archived (soft deleted) instead of removed.' });
    }

    await driverModel.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// So warehouse staff can see drivers that were archived (soft deleted).
async function viewDeletedDriverList(req, res) {
  try {
    res.json(await driverModel.findDeleted());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Bring an archived driver back into active use.
async function selectRestoreDriver(req, res) {
  try {
    const driver = await driverModel.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (!driver.isDeleted) return res.status(400).json({ error: 'Driver is not deleted.' });

    const restored = await driverModel.restore(req.params.id);
    res.json(restored);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

router.get('/drivers', viewDriverInfoList);
router.get('/drivers/deleted', viewDeletedDriverList);
router.post('/drivers', selectAddNewDriverInfo);
router.put('/drivers/:id', selectEditDriverInfo);
router.put('/drivers/:id/shift', selectSetDriverShift);
router.put('/drivers/:id/restore', selectRestoreDriver);
router.delete('/drivers/:id', selectDeleteEditInfo);

module.exports = router;
