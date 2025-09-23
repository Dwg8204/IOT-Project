const MqttClient  = require('../config/mqtt');
const actionHistory = require('../models/actionHistory.model');

module.exports.index = async (req, res) => {
  try {
      const find ={
      };
      console.log(req.query);
      if (req.query.status) {
        find.status = req.query.status;
      }
    
    
    
    // const countdataSensor = await dataSensor.countDocuments(find);
    // const objectPagination = paginationHelper(initPagination, req.query, countdataSensor);
    const sort = {
    };
    if (req.query.sortKey && req.query.sortValue) {
        sort[req.query.sortKey] = req.query.sortValue;
      }
    const actionHistorys = await actionHistory.find(find);
    res.json(actionHistorys);
    console.log("actionHistorys", actionHistorys);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

module.exports.createAction = async (req, res) => {
  try {
    const {device, action} = req.body;
    const newAction = new actionHistory({
      device, action
    });
    await newAction.save();
    const message = JSON.stringify({device, action});
    MqttClient.publish('deviced', message);
    console.log("MQTT pub: ", message);
    res.status(201).json(newAction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.testMqtt = async (req, res) => {
  try {
    const {device, action} = req.body;
    // console.log(req.body);
    if (!device || !action) {
      return res.status(400).json({ message: "Thiếu device hoặc action" });

    }
    const publishMessage = (device, action) => {
      return new Promise((resolve, reject) => {
        MqttClient.publish('deviced', JSON.stringify({ device, action }), (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    };
    await publishMessage(device, action);
    console.log("MQTT pub: ", device, action);
    res.status(200).json({ message: "Đã gửi topic qua MQTT" });
  } catch (error) {
    console.log("Lỗi MQTT pub: ", error);
    res.status(500).json({ message: error.message });
  }

};