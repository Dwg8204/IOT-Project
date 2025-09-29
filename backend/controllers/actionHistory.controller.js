const MqttClient  = require('../config/mqtt');
const actionHistory = require('../models/actionHistory.model');
// const pendingAction = new Map();
// module.exports.pendingAction = pendingAction;
const pendingAction = require('../utils/pendingAction');
module.exports.pendingAction = pendingAction;
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
    if (!device || !action) {
      return res.status(400).json({ message: "Thiếu device hoặc action" });
    }
    const topic = 'deviceled';
    const message = `${device}.${action}`;
    //tạo promise chờ phản hồi từ esp32
    const responsePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingAction.delete(message);
        reject(new Error('Timeout: No response from device'));
      }, 10000); // 10 giây timeout

      pendingAction.set(message, (response) => {
        clearTimeout(timeout);
        pendingAction.delete(message);
        resolve(response);
      });
    });
    //gửi lệnh qua mqtt
    MqttClient.publish(topic, message, (err) => { 
      if (err) {
        pendingAction.delete(message);
        return res.status(500).json({ message: 'Lỗi khi gửi lệnh qua MQTT', error: err.message });
      }
      console.log(`MQTT pub: ${topic} - ${message}`);
    });
    //chờ phản hồi từ esp32
    const response = await responsePromise;
    console.log('Response from device:', response);
    if (!response || response.status !== 'ok') {
      return res.status(500).json({ message: 'Device phản hồi lỗi hoặc không hợp lệ', response });
    }
    else {
    //lưu lịch sử hành động
    const newAction = new actionHistory({
      device,
      action,
      status: response.status,
      message: response.message,
    });
    await newAction.save();
    res.status(200).json({ message: 'Hành động đã được thực hiện', action: newAction });
  }
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