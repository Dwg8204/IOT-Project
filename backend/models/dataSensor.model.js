const mongoose = require('mongoose');
const dataSensorSchema = new mongoose.Schema({
    light: Number,
    temperature: Number,
    humidity: Number,
    createAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('DataSensor', dataSensorSchema);