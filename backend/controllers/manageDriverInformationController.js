const driverModel = require('../models/driverModel');

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

async function selectAddNewDriverInfo(req, res) {
  try {
    const driver = await driverModel.insert(req.body);
    res.status(201).json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function selectDeleteEditInfo(req, res) {
  try {
    await driverModel.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { viewDriverInfoList, selectEditDriverInfo, selectAddNewDriverInfo, selectDeleteEditInfo };