
const db = require("../config/db");

const Comment = {
    create: (taskId, userId, comment, ownerId, callback) => {
        const sql = `
            INSERT INTO comments (task_id, user_id, comment)
            SELECT t.id, ?, ?
            FROM tasks t
            JOIN projects p ON t.project_id = p.id
            WHERE t.id = ? AND p.owner_id = ?
        `;

        db.query(
            sql,
            [userId, comment, taskId, ownerId],
            callback
        );
    },

    findByTask: (taskId, ownerId, callback) => {
        const sql = `
            SELECT c.id, c.task_id, c.user_id,
                   u.name AS user_name, c.comment, c.created_at
            FROM comments c
            JOIN tasks t ON c.task_id = t.id
            JOIN projects p ON t.project_id = p.id
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.task_id = ? AND p.owner_id = ?
            ORDER BY c.created_at DESC
        `;

        db.query(sql, [taskId, ownerId], callback);
    },

    delete: (id, userId, ownerId, callback) => {
        const sql = `
            DELETE c
            FROM comments c
            JOIN tasks t ON c.task_id = t.id
            JOIN projects p ON t.project_id = p.id
            WHERE c.id = ? AND c.user_id = ? AND p.owner_id = ?
        `;

        db.query(sql, [id, userId, ownerId], callback);
    }
};

module.exports = Comment;
