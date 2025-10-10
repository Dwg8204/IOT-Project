
const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./config/database");
require("dotenv").config();
const cors = require('cors');
const path = require("path");
const http = require('http');
const socketIo = require('socket.io');

const {swaggerUi, swaggerDocs} = require('./swagger/swagger');
const app = express();
const port = process.env.PORT;
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        Credentials: true
    }
});
global.io = io;

io.on('connection', (socket) => {
  console.log('Frontend connected via Socket.IO, ID:', socket.id);
  
  // Gửi message chào mừng
  socket.emit('welcome', { message: 'Connected to IoT Server' });

  socket.on('disconnect', () => {
    console.log('Frontend disconnected, ID:', socket.id);
  });

  // Có thể thêm các event listeners khác nếu cần
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
});
// Kết nối DB
connectDB.connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
// ========== SWAGGER DOCUMENTATION ==========
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  customCss: `
    .swagger-ui .topbar { 
      background-color: #8c52ff; 
    }
    .swagger-ui .info .title {
      color: #8c52ff;
      font-size: 2.5rem;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: #61affe;
    }
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #49cc90;
    }
  `,
  customSiteTitle: 'IoT Smart Home API Docs',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai'
    }
  }
}));
// Export Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocs);
});
// Routes
const routes = require("./routes/index.route");
routes(app);

app.use(express.static(path.join(__dirname, '../frontend')));

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);

});