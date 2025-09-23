const mqtt = require('mqtt');
const host = process.env.MQTT_HOST || 'localhost';
const port = process.env.MQTT_PORT || '1883';
const username = process.env.MQTT_USERNAME ;
const password = process.env.MQTT_PASSWORD ;
const options = {};

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
    client.subscribe("deviced");
});

client.on('error', (err) => {
    console.error('Lỗi kết nối MQTT: ', err);
    client.end();
});

module.exports = client;