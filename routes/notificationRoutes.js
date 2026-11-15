
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getNotifications,
    markAllRead
} = require("../controllers/notificationController");

router.use(authMiddleware);

router.get("/", getNotifications);
router.put("/read-all", markAllRead);

module.exports = router;
