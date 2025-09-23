
const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./config/database");
require("dotenv").config();
const cors = require('cors');
const path = require("path");

const app = express();
const port = process.env.PORT;

// Kết nối DB
connectDB.connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
const routes = require("./routes/index.route");
routes(app);

app.use(express.static(path.join(__dirname, '../frontend')));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});