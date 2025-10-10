const mqtt = require('mqtt');
const host = process.env.MQTT_HOST || 'localhost';
const port = process.env.MQTT_PORT || '1883';
const username = process.env.MQTT_USERNAME;
const password = process.env.MQTT_PASSWORD;
const options = {};
const pendingAction = require('../utils/pendingAction');
const dataSensor = require('../models/dataSensor.model');
const deviceStateCache = require('../services/deviceStateCache');

if (username && password) {
  options.username = username;
  options.password = password;
}

const client = mqtt.connect(`mqtt://${host}:${port}`, options);

client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe("datasensor", (err) => {
        if (!err) {
            console.log('Subscribed thành công đến topic datasensor');
        } else {
            console.error('Subscribed thất bại topic datasensor:', err);
        }
    });
    client.subscribe("deviceled", (err) => {
        if (!err) {
            console.log('Subscribed thành công đến topic deviceled');
        } else {
            console.error('Subscribed thất bại topic deviceled:', err);
        }
    });
});

client.on('message', (topic, message) => {
  const text = message.toString();
  
  if (topic === 'deviceled') {
    console.log(`[MQTT] deviceled <= ${text}`);

    let key;
    let status = 'ok';
    let isAck = false;
    const msg = text;
    let device, action;

    // Thử parse JSON: {"device":"blue","action":"on","status":"ok"}
    try {
      const obj = JSON.parse(text);
      if (obj && obj.device && obj.action) {
        device = obj.device;
        action = obj.action;
        key = `${obj.device}.${obj.action}`;
        status = obj.status || 'ok';
        isAck = true;
      }
    } catch (_) { /* không phải JSON */ }

    // Fallback dạng chuỗi: "device.action" hoặc "device.action.ok"
    if (!isAck) {
      const parts = text.split('.');
      if (parts.length === 3) {
        device = parts[0];
        action = parts[1];
        key = `${parts[0]}.${parts[1]}`;
        status = parts[2];
        isAck = true;
      }
    }

    if (!key || !isAck) {
      console.warn('ACK không hợp lệ, bỏ qua:', text);
      return;
    }

    // CẬP NHẬT CACHE KHI NHẬN ACK THÀNH CÔNG
    if (status === 'ok' && device && action) {
      deviceStateCache.updateState(device, action);
      
      // 🔹 THÊM: Emit device state update qua Socket.IO
      if (global.io) {
        global.io.emit('deviceStateUpdate', {
          device,
          action,
          status,
          timestamp: new Date().toISOString()
        });
        console.log(`📡 [Socket.IO] Emitted deviceStateUpdate: ${device}.${action}`);
      }
    }

    const cb = pendingAction.get(key);
    if (!cb) {
      return;
    }
    pendingAction.delete(key);
    cb({ status, message: text });
    return;
  }

  if (topic === 'datasensor') {
    console.log(`[MQTT] datasensor <= ${text}`);
    try {
      const data = JSON.parse(text);
      if (data && data.temperature !== undefined && data.humidity !== undefined) {
        // Lưu vào DB
        const doc = new dataSensor({
          temperature: data.temperature,
          humidity: data.humidity,
          light: data.light
        });
        
        doc.save().then((savedDoc) => {
          console.log('✅ Đã lưu sensor data vào DB');
          
          // 🔹 THÊM: Emit sensor data realtime qua Socket.IO
          if (global.io) {
            const payload = {
              temperature: savedDoc.temperature,
              humidity: savedDoc.humidity,
              light: savedDoc.light,
              createdAt: savedDoc.createdAt,
              _id: savedDoc._id
            };
            
            global.io.emit('newSensorData', payload);
            console.log(`[Socket.IO] Emitted newSensorData:`, payload);
          }
        }).catch(err => {
          console.error('Lỗi lưu database:', err);
        });
      }
      else {
        console.log("Dữ liệu sensor không đầy đủ");
      }
    }
    catch (e){
      console.log("Lỗi parse JSON:", e);
    }
    return;
  }

  console.log(`[MQTT] ${topic} <= ${text}`);
});

client.on('error', (err) => {
    console.error('Lỗi kết nối MQTT: ', err);
    client.end();
});

module.exports = client;