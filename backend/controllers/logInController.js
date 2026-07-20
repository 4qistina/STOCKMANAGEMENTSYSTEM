const userModel = require('../models/userModel');
const express = require('express');
const router = express.Router();

async function login(req, res) {
    try {
        const { username, userPassword } = req.body;

        const user = await userModel.findByUsername(username);

        if (!user || user.userPassword !== userPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({ message: 'Login successful', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

router.post('/login', login);

module.exports = router;
