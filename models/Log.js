const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
    correlationId: { type: String, required: true },
    userId: { type: String, required: true },
    action: { type: String, required: true },
    routeName: { type: String, required: true },
    timestamp: { type: String, required: true },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 30 * 24 * 60 * 60,
    },
});

module.exports = mongoose.model("Log", logSchema);
