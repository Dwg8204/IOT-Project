#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"

// --- WiFi ---
const char* ssid = "Dwg";      
const char* password = "00001111";  

// --- MQTT ---
const char* mqtt_server = "10.59.132.207";
const int mqtt_port = 1883;
const char* mqtt_user = "user1";
const char* mqtt_pass = "1234";

// --- DHT11 ---
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// --- LDR ---
int ldrPin = 34;

// --- LED ---
int ledRed = 19;
int ledYellow = 18;
int ledBlue = 21;

// --- MQTT Client ---
WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;

// 🔹 Chuyển đổi ADC sang Lux (đảo ngược vì LDR nối GND)
float convertToLux(int adcValue) {
  int inverted = 4095 - adcValue;
  
  if (inverted < 100) return inverted * 0.01;
  if (inverted < 500) return 1 + (inverted - 100) * 0.0225;
  if (inverted < 1000) return 10 + (inverted - 500) * 0.08;
  if (inverted < 1500) return 50 + (inverted - 1000) * 0.1;
  if (inverted < 2000) return 100 + (inverted - 1500) * 0.2;
  if (inverted < 2500) return 200 + (inverted - 2000) * 0.4;
  if (inverted < 3000) return 400 + (inverted - 2500) * 0.8;
  if (inverted < 3500) return 800 + (inverted - 3000) * 2.4;
  return 2000 + (inverted - 3500) * 13.45;
}

void callback(char* topic, byte* payload, unsigned int length) {
  char buff[length + 1];
  memcpy(buff, payload, length);
  buff[length] = '\0';
  String message = String(buff);

  Serial.print("Nhận lệnh: ");
  Serial.println(message);

  String device, action;
  int dotPos = message.indexOf('.');
  if (dotPos != -1) {
    device = message.substring(0, dotPos);
    action = message.substring(dotPos + 1);
  }

  bool success = false;

  if (message == "fan.on")       { digitalWrite(19, HIGH); success = true; }
  else if (message == "fan.off") { digitalWrite(19, LOW);  success = true; }
  else if (message == "light.on")  { digitalWrite(18, HIGH); success = true; }
  else if (message == "light.off") { digitalWrite(18, LOW);  success = true; }
  else if (message == "air.on") { digitalWrite(21, HIGH); success = true; }
  else if (message == "air.off"){ digitalWrite(21, LOW);  success = true; }

  if (success && device.length() && action.length()) {
    String response = "{";
    response += "\"device\":\"" + device + "\",";
    response += "\"action\":\"" + action + "\",";
    response += "\"status\":\"ok\"";
    response += "}";
    client.publish("deviceled", response.c_str());
    Serial.print("ACK -> deviceled: ");
    Serial.println(response);
  } else if (!success && device.length() && action.length()) {
    String response = "{";
    response += "\"device\":\"" + device + "\",";
    response += "\"action\":\"" + action + "\",";
    response += "\"status\":\"error\"";
    response += "}";
    client.publish("deviceled", response.c_str());
    Serial.print("ACK error -> deviceled: ");
    Serial.println(response);
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Đang kết nối MQTT...");
    if (client.connect("ESP32Client", mqtt_user, mqtt_pass)) {
      Serial.println("Thành công!");
      client.subscribe("deviceled");
    } else {
      Serial.print("Lỗi, rc=");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

void publishDeviceState(String device, bool state) {
  String action = state ? "on" : "off";
  String response = "{";
  response += "\"device\":\"" + device + "\",";
  response += "\"action\":\"" + action + "\",";
  response += "\"status\":\"ok\"";
  response += "}";
  client.publish("deviceled", response.c_str());
  Serial.print("State published - " + device + ": ");
  Serial.println(action);
}

void setup() {
  Serial.begin(115200);

  pinMode(ledRed, OUTPUT);
  pinMode(ledYellow, OUTPUT);
  pinMode(ledBlue, OUTPUT);
  pinMode(ldrPin, INPUT);

  dht.begin();

  WiFi.begin(ssid, password);
  Serial.print("Kết nối WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("WiFi OK!");

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  publishDeviceState("fan", digitalRead(ledRed));
  publishDeviceState("light", digitalRead(ledYellow)); 
  publishDeviceState("air", digitalRead(ledBlue));
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > 5000) {
    lastMsg = now;

    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
    int lightADC = analogRead(ldrPin);
    float lightLux = convertToLux(lightADC);

    String payload = "{";
    payload += "\"temperature\":" + String(temp, 1) + ",";
    payload += "\"humidity\":" + String(hum, 1) + ",";
    payload += "\"light\":" + String(lightLux, 1);
    payload += "}";

    client.publish("datasensor", payload.c_str());

    Serial.print("Gửi: ");
    Serial.println(payload);
  }
}