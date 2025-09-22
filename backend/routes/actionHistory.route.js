const express = require('express');
const router = express.Router();
const ActionHistory = require('../models/actionHistory.model');

router.get('/', async (req, res) => {
    try {
        const actions = await ActionHistory.find().sort({ createdAt: -1 });
        res.json(actions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }   
});

module.exports = router;
