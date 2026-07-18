const express = require('express');
const router = express.Router();
const controller = require('../controllers/manageDriverInformationController');

router.get('/drivers', controller.viewDriverInfoList);
router.post('/drivers', controller.selectAddNewDriverInfo);
router.put('/drivers/:id', controller.selectEditDriverInfo);
router.delete('/drivers/:id', controller.selectDeleteEditInfo);

module.exports = router;