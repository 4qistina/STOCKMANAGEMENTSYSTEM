const express = require('express');
const router = express.Router();
const controller = require('../controllers/logInController');

router.post('/login', controller.login); // open to both roles

module.exports = router;