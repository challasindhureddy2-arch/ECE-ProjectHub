
const db = require("../config/db");

const Task = {
    // Create task only inside a project owned by the logged-in user
    create: (projectId, assignedTo, title, description, status, dueDate, ownerId, callback) => {
        const sql = `
            INSERT INTO tasks
            (project_id, assigned_to, title, description, status, due_date)
            SELECT id, ?, ?, ?, ?, ?
            FROM projects
            WHERE id = ? AND owner_id = ?
        `;

        db.query(
            sql,
            [assignedTo, title, description, status, dueDate, projectId, ownerId],
            callback
        );
    },

    // Get all tasks in a project
    findByProject: (projectId, ownerId, callback) => {
        const sql = `
            SELECT t.*
            FROM tasks t
            JOIN projects p ON t.project_id = p.id
            WHERE t.project_id = ? AND p.owner_id = ?
            ORDER BY t.created_at DESC
        `;

        db.query(sql, [projectId, ownerId], callback);
    },

    // Get one task
    findById: (id, ownerId, callback) => {
        const sql = `
            SELECT t.*
            FROM tasks t
            JOIN projects p ON t.project_id = p.id
            WHERE t.id = ? AND p.owner_id = ?
        `;

        db.query(sql, [id, ownerId], callback);
    },

    // Update task
    update: (id, title, description, status, dueDate, ownerId, callback) => {
        const sql = `
            UPDATE tasks
            SET title = ?, description = ?, status = ?, due_date = ?
            WHERE id = ?
            AND project_id IN (
                SELECT id FROM projects WHERE owner_id = ?
            )
        `;

        db.query(sql, [title, description, status, dueDate, id, ownerId], callback);
    },

    // Delete task
    delete: (id, ownerId, callback) => {
        const sql = `
            DELETE FROM tasks
            WHERE id = ?
            AND project_id IN (
                SELECT id FROM projects WHERE owner_id = ?
            )
        `;

        db.query(sql, [id, ownerId], callback);
    }
};

module.exports = Task;
