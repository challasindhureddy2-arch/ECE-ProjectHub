
const db = require("../config/db");

const Project = {
    // Create a project
    create: (name, description, ownerId, callback) => {
        const sql = `
            INSERT INTO projects (name, description, owner_id)
            VALUES (?, ?, ?)
        `;
        db.query(sql, [name, description, ownerId], callback);
    },

    // Get projects belonging to a user
    findAllByOwner: (ownerId, callback) => {
        const sql = "SELECT * FROM projects WHERE owner_id = ? ORDER BY created_at DESC";
        db.query(sql, [ownerId], callback);
    },

    // Find one project belonging to a user
    findById: (id, ownerId, callback) => {
        const sql = "SELECT * FROM projects WHERE id = ? AND owner_id = ?";
        db.query(sql, [id, ownerId], callback);
    },

    // Update a project
    update: (id, name, description, ownerId, callback) => {
        const sql = `
            UPDATE projects
            SET name = ?, description = ?
            WHERE id = ? AND owner_id = ?
        `;
        db.query(sql, [name, description, id, ownerId], callback);
    },

    // Delete a project
    delete: (id, ownerId, callback) => {
        const sql = "DELETE FROM projects WHERE id = ? AND owner_id = ?";
        db.query(sql, [id, ownerId], callback);
    }
};

module.exports = Project;
