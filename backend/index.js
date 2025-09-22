const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./config/database");
require("dotenv").config();
const cors = require('cors');
const app = express();
const port = process.env.PORT;
connectDB.connectDB();
app.use(bodyParser.json());
app.use(cors());
const dataSensorRoutes = require("./routes/dataSensor.route");
const actionHistoryRoutes = require("./routes/actionHistory.route");
app.use("/api/action-history", actionHistoryRoutes);
app.use("/api/data-sensor", dataSensorRoutes);
const path = require("path");
app.use(express.static(path.join(__dirname, '../frontend')));
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
