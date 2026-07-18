const userModel = require('../models/userModel');

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

module.exports = { login };