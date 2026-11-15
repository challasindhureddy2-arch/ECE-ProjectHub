
const express = require("express");
const cors = require("cors");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

require("dotenv").config();
require("./config/db");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Authenticate Socket.IO users using JWT
io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error("Authentication required"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        socket.data.userId = String(decoded.id);
        next();
    } catch (error) {
        next(new Error("Invalid or expired token"));
    }
});

// Connect each user to their private notification room
io.on("connection", (socket) => {
    const userId = socket.data.userId;

    socket.join(`user:${userId}`);

    console.log(`User ${userId} connected to notifications`);

    socket.on("disconnect", () => {
        console.log(`User ${userId} disconnected`);
    });
});

// Make Socket.IO available in controllers
app.set("io", io);

// Middleware
app.use(cors());
app.set("json spaces", 2);
app.use(express.json());
app.use(express.static("public"));

// Home route
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: "public" });
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "Success",
        message: "ECE ProjectHub API is working!"
    });
});

// Authentication routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Project routes
const projectRoutes = require("./routes/projectRoutes");
app.use("/api/projects", projectRoutes);

// Task routes
const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);

// Comments routes
const commentRoutes = require("./routes/commentRoutes");
app.use("/api/comments", commentRoutes);

// Notification routes
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

// Start server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("Secure Socket.IO notification server is ready!");
});