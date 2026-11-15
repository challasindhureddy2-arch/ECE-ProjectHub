
const Project = require("../models/Project");

// CREATE PROJECT
exports.createProject = (req, res) => {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            message: "Project name is required"
        });
    }

    Project.create(
        name.trim(),
        description || "",
        req.user.id,
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to create project"
                });
            }

            res.status(201).json({
                message: "Project created successfully",
                projectId: result.insertId
            });
        }
    );
};

// GET ALL PROJECTS
exports.getProjects = (req, res) => {
    Project.findAllByOwner(req.user.id, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch projects"
            });
        }

        res.json(results);
    });
};

// GET PROJECT BY ID
exports.getProjectById = (req, res) => {
    Project.findById(req.params.id, req.user.id, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch project"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        res.json(results[0]);
    });
};

// UPDATE PROJECT
exports.updateProject = (req, res) => {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            message: "Project name is required"
        });
    }

    Project.update(
        req.params.id,
        name.trim(),
        description || "",
        req.user.id,
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to update project"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Project not found"
                });
            }

            res.json({
                message: "Project updated successfully"
            });
        }
    );
};

// DELETE PROJECT
exports.deleteProject = (req, res) => {
    Project.delete(req.params.id, req.user.id, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete project"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        res.json({
            message: "Project deleted successfully"
        });
    });
};
