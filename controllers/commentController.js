
const Comment = require("../models/Comment");

// Add a comment
exports.addComment = (req, res) => {
    const { task_id, comment } = req.body;

    if (!task_id || !comment || !comment.trim()) {
        return res.status(400).json({
            message: "Task ID and comment are required"
        });
    }

    Comment.create(task_id, req.user.id, comment, req.user.id, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to add comment" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(201).json({
            message: "Comment added successfully",
            commentId: result.insertId
        });
    });
};

// Get comments for a task
exports.getCommentsByTask = (req, res) => {
    const taskId = req.params.taskId;

    Comment.findByTask(taskId, req.user.id, (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Failed to fetch comments" });
        }

        res.json(results);
    });
};

// Delete your own comment
exports.deleteComment = (req, res) => {
    const commentId = req.params.id;

    Comment.delete(commentId, req.user.id, req.user.id, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to delete comment" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Comment not found" });
        }

        res.json({ message: "Comment deleted successfully" });
    });
};
