const express = require('express');
const router = express.Router();
const controller = require('../controllers/home.controller');

router.get('/', controller.index);
router.get('/data', controller.getData);
router.get('/chart', controller.getChartSensor);

module.exports = router;
