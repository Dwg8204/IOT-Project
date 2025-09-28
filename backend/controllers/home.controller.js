const dataSensor = require('../models/dataSensor.model');
const path = require('path');
module.exports.index = async (req, res) => {
    try {
        res.sendFile(path.join(__dirname, '../../frontend/index.html'));
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
module.exports.getData = async (req, res) => {
    try {
        const data = await dataSensor.findOne().sort({ createdAt: -1 });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports.getChartSensor = async (req, res) => {
    try {
        const dataSensors = await dataSensor.find().sort({ createdAt: -1 }).limit(10);
        res.json(dataSensors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
