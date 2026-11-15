
const Notification = require("../models/Notification");

// GET ALL NOTIFICATIONS
exports.getNotifications = (req, res) => {
    Notification.findAllByUser(req.user.id, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch notifications"
            });
        }

        res.json(results);
    });
};

// MARK ALL NOTIFICATIONS AS READ
exports.markAllRead = (req, res) => {
    Notification.markAllRead(req.user.id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update notifications"
            });
        }

        res.json({
            message: "Notifications marked as read"
        });
    });
};
