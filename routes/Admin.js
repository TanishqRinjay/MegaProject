const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../middlewares/auth");
const Log = require("../models/Log");
const chalk = require("chalk");

router.get("/logs", auth, isAdmin, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const logs = await Log.find(
            { timestamp: { $gte: thirtyDaysAgo.toISOString() } },
            { createdAt: 0 }
        ).sort({ timestamp: -1 });

        return res.status(200).json({
            success: true,
            data: logs,
        });
    } catch (error) {
        console.error("Error fetching logs:", error);
        return res
            .status(500)
            .json({ success: false, message: "Failed to fetch logs" });
    }
});

module.exports = router;
