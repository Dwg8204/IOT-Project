const mongoose = require('mongoose');
const actionHistorySchema = new mongoose.Schema({
    device: {
        type: String,
        enum: ["đèn", "quạt", "điều hoà"],
        required: true
    },
    action: {
        type: String,
        enum: ["bật", "tắt"],
        required: true
    },
    createAt: {
        type: Date,
        default: Date.now
    }
});
const ActionHistory = mongoose.model("ActionHistory", actionHistorySchema, "action-history"); 
module.exports = ActionHistory;
