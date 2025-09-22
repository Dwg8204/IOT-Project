const mongoose = require('mongoose');
const actionHistorySchema = new mongoose.Schema({
    deviceName: { 
        type: String, 
        enum: ['den', 'quat', 'dieuhoa'], 
        required: true 
    },
    action: { 
        type: String, 
        enum: ['ON', 'OFF'], 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});
module.exports = mongoose.model('ActionHistory', actionHistorySchema);