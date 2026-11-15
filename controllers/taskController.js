
const Task = require("../models/Task");
const Notification = require("../models/Notification");

const validStatuses = ["Pending", "In Progress", "Completed"];

// Save notification and send real-time update
function sendRealtimeUpdate(req, eventName, message) {
    Notification.create(req.user.id, message, (err, result) => {
        if (err) {
            console.error("Notification save failed:", err);
            return;
        }

        const io = req.app.get("io");

        if (!io) return;

        const room = `user:${req.user.id}`;

        io.to(room).emit("notification", {
            id: result.insertId,
            message: message,
            is_read: false,
            createdAt: new Date().toISOString()
        });

        io.to(room).emit(eventName);
    });
}

// CREATE TASK
exports.createTask = (req, res) => {
    const {
        project_id,
        assigned_to,
        title,
        description,
        status,
        due_date
    } = req.body;

    if (!project_id || !title || !title.trim()) {
        return res.status(400).json({
            message: "Project ID and task title are required"
        });
    }

    const taskStatus = status || "Pending";

    if (!validStatuses.includes(taskStatus)) {
        return res.status(400).json({
            message: "Invalid task status"
        });
    }

    Task.create(
        project_id,
        assigned_to || null,
        title.trim(),
        description || "",
        taskStatus,
        due_date || null,
        req.user.id,
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to create task"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Project not found or access denied"
                });
            }

            sendRealtimeUpdate(
                req,
                "task_updated",
                `New task created: ${title}`
            );

            res.status(201).json({
                message: "Task created successfully",
                taskId: result.insertId
            });
        }
    );
};

// GET TASKS BY PROJECT
exports.getTasksByProject = (req, res) => {
    Task.findByProject(req.params.projectId, req.user.id, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch tasks"
            });
        }

        res.json(results);
    });
};

// GET ONE TASK
exports.getTaskById = (req, res) => {
    Task.findById(req.params.id, req.user.id, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch task"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.json(results[0]);
    });
};

// UPDATE TASK
exports.updateTask = (req, res) => {
    const { title, description, status, due_date } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({
            message: "Task title is required"
        });
    }

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid task status"
        });
    }

    Task.update(
        req.params.id,
        title.trim(),
        description || "",
        status,
        due_date || null,
        req.user.id,
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to update task"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Task not found"
                });
            }

            sendRealtimeUpdate(
                req,
                "task_updated",
                `Task updated: ${title}`
            );

            res.json({
                message: "Task updated successfully"
            });
        }
    );
};

// DELETE TASK
exports.deleteTask = (req, res) => {
    Task.delete(req.params.id, req.user.id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete task"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        sendRealtimeUpdate(
            req,
            "task_updated",
            "A task was deleted."
        );

        res.json({
            message: "Task deleted successfully"
        });
    });
};
