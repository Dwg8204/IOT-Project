const MqttClient  = require('../config/mqtt');
const actionHistory = require('../models/actionHistory.model');
const deviceStateCache = require('../services/deviceStateCache');
const paginationHelper = require('../helpers/pagination');
const searchHelper = require('../helpers/search');
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
    const find = {};
    console.log("Query params:", req.query);

    // Filter theo status, device, action
    if (req.query.status) {
      find.status = req.query.status;
    }
    if (req.query.device) {
      find.device = req.query.device;
    }
    if (req.query.action) {
      find.action = req.query.action;
    }

    // Search functionality với hỗ trợ time search
    const search = searchHelper(req.query);
    const keyword = search.keyword;
    
    if (keyword) {
      // 🔹 SỬA: Xử lý time search với $or query mới
      if (search.timeSearch) {
        console.log('Time search detected:', search.timeSearch);
        
        // Nếu timeSearch có $or (nhiều format), merge vào find
        if (search.timeSearch.$or) {
          find.$or = search.timeSearch.$or.map(timeRange => ({
            createAt: timeRange
          }));
        } else {
          // Fallback: single time range
          find.createAt = search.timeSearch;
        }
        
        console.log('Final time search query:', JSON.stringify(find, null, 2));
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

    // Pagination setup
    let initPagination = {
      currentPage: 1,
      limitItem: 5
    };
    
    const countRecords = await actionHistory.countDocuments(find);
    const objectPagination = paginationHelper(initPagination, req.query, countRecords);
    
    // Sort setup - luôn sort theo createAt
    const sort = { createAt: parseInt(req.query.sortValue) || -1 };
    console.log(`Sorting by createAt: ${sort.createAt === 1 ? 'ASC' : 'DESC'}`);
    
    // Fetch data
    const actionHistorys = await actionHistory.find(find)
      .sort(sort)
      .limit(objectPagination.limitItem)
      .skip(objectPagination.skip);
    
    console.log(`✅ Found ${actionHistorys.length}/${countRecords} action history records`);
    
    // Response với format chuẩn
    res.json({
      data: actionHistorys,
      pagination: {
        totalItems: countRecords,
        currentPage: objectPagination.currentPage,
        totalPages: objectPagination.totalPage,
        limitItem: objectPagination.limitItem
      }
    });
    
  } catch (error) {
    console.error("❌ ActionHistory controller error:", error);
    res.status(500).json({ 
      message: error.message,
      error: "Internal server error" 
    });
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
    
    const responsePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingAction.delete(message);
        reject(new Error('Timeout: No response from device'));
      }, 2000);

      pendingAction.set(message, (response) => {
        clearTimeout(timeout);
        pendingAction.delete(message);
        resolve(response);
      });
    });
    
    MqttClient.publish(topic, message, (err) => { 
      if (err) {
        pendingAction.delete(message);
        return res.status(500).json({ message: 'Lỗi khi gửi lệnh qua MQTT', error: err.message });
      }
      console.log(`MQTT pub: ${topic} - ${message}`);
    });
    
    const response = await responsePromise;
    console.log('Response from device:', response);
    
    if (!response || response.status !== 'ok') {
      return res.status(500).json({ message: 'Device phản hồi lỗi hoặc không hợp lệ', response });
    }
    
    const newAction = new actionHistory({
      device,
      action,
      status: response.status,
      message: response.message,
    });
    await newAction.save();
    res.status(200).json({ message: 'Hành động đã được thực hiện', action: newAction });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.testMqtt = async (req, res) => {
  try {
    const {device, action} = req.body;
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

module.exports.getDeviceStates = async (req, res) => {
  try {
    const states = deviceStateCache.getAllStates();
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