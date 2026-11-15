
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");

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

// ADD COMMENT
exports.addComment = (req, res) => {
    const { task_id, comment } = req.body;

    if (!task_id || !comment || !comment.trim()) {
        return res.status(400).json({
            message: "Task ID and comment are required"
        });
    }

    Comment.create(
        task_id,
        req.user.id,
        comment.trim(),
        req.user.id,
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to add comment"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Task not found"
                });
            }

            sendRealtimeUpdate(
                req,
                "comment_updated",
                "A new comment was added."
            );

            res.status(201).json({
                message: "Comment added successfully",
                commentId: result.insertId
            });
        }
    );
};

// GET COMMENTS FOR A TASK
exports.getCommentsByTask = (req, res) => {
    const taskId = req.params.taskId;

    Comment.findByTask(taskId, req.user.id, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch comments"
            });
        }

        res.json(results);
    });
};

// DELETE YOUR OWN COMMENT
exports.deleteComment = (req, res) => {
    const commentId = req.params.id;

    Comment.delete(
        commentId,
        req.user.id,
        req.user.id,
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to delete comment"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Comment not found"
                });
            }

            sendRealtimeUpdate(
                req,
                "comment_updated",
                "A comment was deleted."
            );

            res.json({
                message: "Comment deleted successfully"
            });
        }
    );
};
