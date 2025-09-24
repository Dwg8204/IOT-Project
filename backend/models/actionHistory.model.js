const mongoose = require('mongoose');
const actionHistorySchema = new mongoose.Schema({
    device: {
        type: String,
        enum: ["blue", "red", "yellow"],
        required: true
    },
    action: {
        type: String,
        enum: ["on", "off"],
        required: true
    },
    status: { type: String },   
    message: { type: String },
    createAt: {
        type: Date,
        default: Date.now
    }
});
const ActionHistory = mongoose.model("ActionHistory", actionHistorySchema, "action-history"); 
module.exports = ActionHistory;
