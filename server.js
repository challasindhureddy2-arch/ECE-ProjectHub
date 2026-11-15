
const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set("json spaces", 2);
app.use(express.json());

// Serve frontend files
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

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
