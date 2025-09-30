const MqttClient  = require('../config/mqtt');
const actionHistory = require('../models/actionHistory.model');
const deviceStateCache = require('../services/deviceStateCache');
const paginationHelper = require('../helpers/pagination');
const searchHelper = require('../helpers/search');
// const pendingAction = new Map();
// module.exports.pendingAction = pendingAction;
const pendingAction = require('../utils/pendingAction');
module.exports.pendingAction = pendingAction;

// Khởi tạo cache từ DB khi server start
(async () => {
  try {
    const agg = await actionHistory.aggregate([
      { $match: { status: 'ok' } },
      { $sort: { createAt: -1 } },
      { $group: { _id: '$device', action: { $first: '$action' } } }
    ]);
    const states = {};
    agg.forEach(item => {
      states[item._id] = item.action;
    });
    deviceStateCache.initializeFromDB(states);
    console.log('Khởi tạo device states từ DB:', states);
  } catch (e) {
    console.warn('Lỗi khởi tạo device states:', e);
  }
})();

module.exports.index = async (req, res) => {
  try {
      const find ={
      };

      // console.log(req.query);
      if (req.query.status) {
        find.status = req.query.status;
      }
      if (req.query.device) {
        find.device = req.query.device;
      }
      if (req.query.action) {
        find.action = req.query.action;
      }
      // if (req.query.time){
      //   const timeInput = req.query.time.trim();
      //   const searchTime = new Date(req.query.time);
      //   const nextMinute = new Date(searchTime.getTime() + 60000);
      //   find.createAt = { $gte: searchTime, $lt: nextMinute };
      // }
      const search = searchHelper(req.query);
      const keyword = search.keyword;
      // if (keyword) {
      //   find.$or = [
      //     { device: search.regex },
      //     { action: search.regex },
      //     { status: search.regex },
      //     { message: search.regex }
      //   ];
      // }
      if (keyword) {
        // Nếu có timeSearch (phát hiện format thời gian), ưu tiên tìm theo thời gian
        if (search.timeSearch) {
          console.log('Time search detected:', search.timeSearch);
          find.createAt = search.timeSearch;
        } else {
          // Tìm kiếm text thông thường
          find.$or = [
            { device: search.regex },
            { action: search.regex },
            { status: search.regex },
            { message: search.regex }
          ];
        }
      }
    let initPagination = {
        currentPage: 1,
        limitItem: 5
    };
    const countRecords = await actionHistory.countDocuments(find);
    const objectPagination = paginationHelper(initPagination, req.query, countRecords);
    
    
    // const countdataSensor = await dataSensor.countDocuments(find);
    // const objectPagination = paginationHelper(initPagination, req.query, countdataSensor);
    const sort = {
      createAt: -1
    };
    if (req.query.sortKey && req.query.sortValue) {
        sort[req.query.sortKey] = parseInt(req.query.sortValue);
      }
    const actionHistorys = await actionHistory.find(find).sort(sort).limit(objectPagination.limitItem).skip(objectPagination.skip);
    res.json(
      {
        data: actionHistorys,
        pagination: {
          totalItems: countRecords,
          currentPage: objectPagination.currentPage,
          totalPages: objectPagination.totalPage,
          limitItem: objectPagination.limitItem
        }
      }
    );
    // console.log("actionHistorys", actionHistorys);
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
      }, 2000); // 2 giây timeout

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
// API trả về trạng thái hiện tại của thiết bị
module.exports.getDeviceStates = async (req, res) => {
  try {
    const states = deviceStateCache.getAllStates();
    // Chuyển đổi sang boolean cho frontend
    const result = {
      light: states.light === 'on',
      fan: states.fan === 'on', 
      air: states.air === 'on'
    };
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports.state = async (req, res) => {
  try {
    const agg = await actionHistory.aggregate([
      {
        $match: { status: 'ok' }
      },
      {
        $group: {
          _id: '$device',
          action: { $first: '$action' },
        } 
      },
      {
        $sort: { count: -1 }
      }
    ]);
    const result = {};
    agg.forEach(item => {
      result[item._id] = item.action;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};