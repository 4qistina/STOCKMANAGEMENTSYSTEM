const express = require('express');
const router = express.Router();
const controller = require('../controllers/registerAccountController');

router.get('/register', controller.viewRegistrationForm);
router.post('/register', controller.submitRegistration);

module.exports = router;