const express = require("express");
const router = express.Router();
const DataSensor = require("../models/dataSensor.model");

// GET all sensors
router.get("/", async (req, res) => {
  try {
    const sensors = await DataSensor.find().sort({ createdAt: -1 });
    res.json(sensors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new sensor data
router.post("/", async (req, res) => {
  try {
    const sensor = new DataSensor(req.body);
    await sensor.save();
    res.status(201).json(sensor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
