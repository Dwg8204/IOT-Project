const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IoT API',
      version: '1.0.0',
      description: `
#  IoT API Documentation

API quản lý hệ thống IoT với đầy đủ tính năng giám sát và điều khiển.

---

##  Base URL
\`\`\`
http://localhost:3000
\`\`\`

---

##  CÁC MODULE CHÍNH

### Data Sensor (Dữ liệu cảm biến)
Quản lý dữ liệu từ các cảm biến DHT11 và LDR:
-  **Lấy tất cả dữ liệu** với phân trang
-  **Tìm kiếm** theo nhiệt độ, độ ẩm, ánh sáng, thời gian
-  **Sắp xếp** theo bất kỳ trường nào (tăng/giảm dần)
-  **Phân trang** linh hoạt (1-1000 bản ghi/trang)

**Endpoint chính:**
- \`GET /api/data-sensor\` - All-in-One endpoint

---

###  Action History (Lịch sử điều khiển)
Quản lý lịch sử bật/tắt thiết bị:
-  **Lấy tất cả lịch sử** với phân trang
-  **Lọc** theo thiết bị, hành động, trạng thái
-  **Tìm kiếm** theo thời gian
-  **Điều khiển thiết bị** qua MQTT
-  **Sắp xếp** theo thời gian

**Các endpoint:**
- \`GET /api/action-history\` - Lấy/lọc/tìm kiếm lịch sử
- \`POST /api/action-history/create\` - Điều khiển thiết bị

---

### Home/Dashboard (Trang chủ)
Các API phục vụ dashboard:
-  **Dashboard HTML** - Giao diện chính
-  **Dữ liệu mới nhất** - 1 bản ghi cảm biến mới nhất
-  **Dữ liệu biểu đồ** - 10 bản ghi cho line chart

**Các endpoint:**
- \`GET /api/home\` - Trả về file HTML
- \`GET /api/home/data\` - Dữ liệu cảm biến mới nhất
- \`GET /api/home/chart\` - Dữ liệu cho biểu đồ

---

##  TÍNH NĂNG NỔI BẬT

###  Tìm kiếm thông minh
- Hỗ trợ nhiều định dạng thời gian (DD/MM/YYYY, ISO 8601, ...)
- Tìm kiếm chính xác theo số (nhiệt độ, độ ẩm, ánh sáng)
- Tìm kiếm theo khoảng thời gian

###  Sắp xếp linh hoạt
- Sắp xếp tăng dần (ASC) hoặc giảm dần (DESC)
- Hỗ trợ sắp xếp theo bất kỳ trường nào

###  Điều khiển realtime
- Gửi lệnh qua MQTT
- Nhận phản hồi từ thiết bị
- Tự động lưu lịch sử

###  Thống kê và phân tích
- Dữ liệu cảm biến mới nhất
- Biểu đồ xu hướng (10 điểm dữ liệu)
- Lịch sử điều khiển chi tiết

---

## HƯỚNG DẪN SỬ DỤNG

### Bước 1: Lấy tất cả dữ liệu cảm biến
\`\`\`
GET /api/data-sensor?page=1&limit=10
\`\`\`

### Bước 2: Tìm kiếm theo nhiệt độ
\`\`\`
GET /api/data-sensor?keyword=28.5&searchType=temperature
\`\`\`

### Bước 3: Điều khiển thiết bị
\`\`\`
POST /api/action-history/create
Body: { "device": "light", "action": "on" }
\`\`\`

### Bước 4: Xem lịch sử điều khiển
\`\`\`
GET /api/action-history?device=light&page=1&limit=10
\`\`\`

---

##  CÁC THIẾT BỊ ĐƯỢC HỖ TRỢ

| Thiết bị | Mã | GPIO | Mô tả |
|----------|-----|------|-------|
| Quạt | \`fan\` | GPIO 19 | LED đỏ |
| Điều hòa | \`air\` | GPIO 21 | LED xanh |
| Đèn | \`light\` | GPIO 18 | LED vàng |

---

## CÔNG NGHỆ SỬ DỤNG

- **Backend:** Node.js + Express.js
- **Database:** MongoDB
- **MQTT Broker:** Mosquitto
- **Hardware:** ESP32 + DHT11 + LDR
- **Frontend:** HTML + CSS + JavaScript
- **Realtime:** Socket.IO
- **API Docs:** Swagger/OpenAPI 3.0
      `
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server'
      },
      {
        url: 'https://api.dwg.com',
        description: 'Production Server'
      }
    ],
    tags: [
      {
        name: 'Data Sensor',
        description: 'Quản lý dữ liệu cảm biến - All-in-One endpoint (lấy tất cả, tìm kiếm, sắp xếp, phân trang)'
      },
      {
        name: 'Action History',
        description: 'Quản lý lịch sử điều khiển thiết bị (lấy/lọc/tìm kiếm lịch sử, điều khiển thiết bị)'
      },
      {
        name: 'Home - Dashboard',
        description: 'API phục vụ dashboard (trang chủ, dữ liệu mới nhất, biểu đồ)'
      }
    ],
    components: {
      schemas: require('./components/schemas')
    }
  },
  apis: [
    path.join(__dirname, './paths/**/*.yaml')
  ]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = { swaggerUi, swaggerDocs };