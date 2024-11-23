const { asyncLocalStorage } = require("../middlewares/asyncLocalStorage");
const Log = require("../models/Log");

const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "short",
        timeStyle: "medium",
        hour12: false,
    }).format(new Date(timestamp));
};

const log = async (action, routeName) => {
    const store = asyncLocalStorage.getStore();
    const correlationId = store?.correlationId || "NoCorrelationId";
    const userId = store?.userId || "Guest";
    const timestamp = formatTimestamp(new Date());

    const logEntry = {
        correlationId,
        userId,
        action,
        routeName,
        timestamp,
    };

    try {
        await Log.create(logEntry);
    } catch (error) {
        console.error("Error saving log to database:", error);
    }
};

module.exports = { log };
