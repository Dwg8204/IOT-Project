const express = require('express');
const router = express.Router();
const controller = require('../controllers/actionHistory.controller');

router.get('/', controller.index);
router.post('/create', controller.createAction);
router.post('/test-mqtt', controller.testMqtt);
router.get('/state', controller.state);
router.get('/device-states', controller.getDeviceStates); 

module.exports = router;
