
const db = require("../config/db");

const Notification = {
    // Save notification
    create: (userId, message, callback) => {
        const sql = `
            INSERT INTO notifications (user_id, message)
            VALUES (?, ?)
        `;

        db.query(sql, [userId, message], callback);
    },

    // Get notifications for logged-in user
    findAllByUser: (userId, callback) => {
        const sql = `
            SELECT id, user_id, message, is_read, created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `;

        db.query(sql, [userId], callback);
    },

    // Mark all notifications as read
    markAllRead: (userId, callback) => {
        const sql = `
            UPDATE notifications
            SET is_read = TRUE
            WHERE user_id = ?
        `;

        db.query(sql, [userId], callback);
    }
};

module.exports = Notification;
