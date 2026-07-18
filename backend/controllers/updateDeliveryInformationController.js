const deliveryModel = require('../models/deliveryModel');
const driverModel = require('../models/driverModel');

async function viewDeliveryInfo(req, res) {
  try {
    const delivery = await deliveryModel.findById(req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    let driver = null;
    if (delivery.driverId) driver = await driverModel.findById(delivery.driverId);

    res.json({ ...delivery, driver });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateDelivery(req, res) {
  try {
    const updated = await deliveryModel.update(req.params.id, {
      deliveryStatus: req.body.deliveryStatus || 'Delivered',
      deliveredDate: req.body.deliveredDate || new Date().toISOString().slice(0, 10),
      driverId: req.body.driverId,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { viewDeliveryInfo, updateDelivery };