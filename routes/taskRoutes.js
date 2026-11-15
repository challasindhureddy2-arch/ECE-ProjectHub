
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createTask,
    getTasksByProject,
    getTaskById,
    updateTask,
    deleteTask
} = require("../controllers/taskController");

router.use(authMiddleware);

router.post("/", createTask);
router.get("/project/:projectId", getTasksByProject);
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
