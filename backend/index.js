const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./config/database");
require("dotenv").config();
const app = express();
const port = process.env.PORT;
connectDB.connectDB();
app.use(bodyParser.json());
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
