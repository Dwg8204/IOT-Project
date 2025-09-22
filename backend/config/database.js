const mongoose = require('mongoose');
module.exports.connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Kết nối thành công đến MongoDB");
    } catch (error) {
        console.log(error);
        console.log("Kết nối thất bại đến MongoDB");
    }
}