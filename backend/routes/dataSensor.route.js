const express = require('express');
const router = express.Router();

const DataSensor = require('../models/dataSensor.model');

router.get('/', async (req, res) => {
    try {
        const dataSensors = await DataSensor.find().sort({ createdAt: -1 });
        res.json(dataSensors);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
