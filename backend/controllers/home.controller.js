const dataSensor = require('../models/dataSensor.model');

module.exports.index = async (req, res) => {
    try {
        res.send('Welcome to the Home Page');
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
module.exports.getData = async (req, res) => {
    try {
        const dataSensors = await dataSensor.findOne().sort({ createdAt: -1 });
        res.json(dataSensors);
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
