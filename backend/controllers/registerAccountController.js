const userModel = require('../models/userModel');
const express = require('express');
const router = express.Router();

async function viewRegistrationForm(req, res) {
    res.json({ fields: ['userFullname', 'username', 'userPassword', 'role'] });
}

async function submitRegistration(req, res) {
    try {
        const { userFullname, username, userPassword, role } = req.body;

        const existing = await userModel.findByUsername(username);
        if (existing) return res.status(409).json({ error: 'Username already exists' });

        const newUser = await userModel.insert({ userFullname, username, userPassword, role });
        res.status(201).json({ message: 'Registration successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

router.get('/register', viewRegistrationForm);
router.post('/register', submitRegistration);

module.exports = router;
