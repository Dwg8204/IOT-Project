const mongoose = require("mongoose");

const dataSensorSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  light: Number,
  createdAt: { type: Date, default: Date.now }
});

const DataSensor = mongoose.model("DataSensor", dataSensorSchema, "data-sensor");
module.exports = DataSensor;
