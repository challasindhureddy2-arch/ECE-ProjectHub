
const API = "http://localhost:3000/api";

let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user") || "null");

// API request helper
async function apiRequest(endpoint, method = "GET", data = null) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (token) {
        options.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(API + endpoint, options);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
    }

    return result;
}

// Show login page
function showLogin() {
    document.getElementById("loginPage").classList.remove("hidden");
    document.getElementById("registerPage").classList.add("hidden");
    document.getElementById("dashboardPage").classList.add("hidden");
}

// Show registration page
function showRegister() {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("registerPage").classList.remove("hidden");
}

// Register user
async function register() {
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    const message = document.getElementById("registerMessage");

    try {
        const result = await apiRequest("/auth/register", "POST", {
            name, email, password
        });

        message.textContent = result.message;
        message.style.color = "green";

        setTimeout(showLogin, 1000);
    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }
}

// Login user
async function login() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const message = document.getElementById("loginMessage");

    try {
        const result = await apiRequest("/auth/login", "POST", {
            email, password
        });

        token = result.token;
        currentUser = result.user;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(currentUser));

        openDashboard();
    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }
}

// Open dashboard
function openDashboard() {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("registerPage").classList.add("hidden");
    document.getElementById("dashboardPage").classList.remove("hidden");

    document.getElementById("userName").textContent =
        currentUser ? currentUser.name : "User";

    showSection("dashboard");
    loadDashboard();
}

// Logout
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    token = null;
    currentUser = null;

    showLogin();
}

// Switch dashboard sections
function showSection(section) {
    document.querySelectorAll(".content-section").forEach(item => {
        item.classList.add("hidden");
    });

    document.getElementById(section + "Section").classList.remove("hidden");

    document.getElementById("pageTitle").textContent =
        section.charAt(0).toUpperCase() + section.slice(1);

    if (section === "projects") loadProjects();
    if (section === "dashboard") loadDashboard();
}

// Load dashboard statistics
async function loadDashboard() {
    try {
        const projects = await apiRequest("/projects");
        document.getElementById("projectCount").textContent = projects.length;

        let totalTasks = 0;
        let completedTasks = 0;

        for (const project of projects) {
            const tasks = await apiRequest(
                `/tasks/project/${project.id}`
            );

            totalTasks += tasks.length;
            completedTasks += tasks.filter(
                task => task.status === "Completed"
            ).length;
        }

        document.getElementById("taskCount").textContent = totalTasks;
        document.getElementById("completedCount").textContent =
            completedTasks;

        const recent = document.getElementById("recentProjects");

        recent.innerHTML = projects.length
            ? projects.slice(0, 5).map(project => `
                <div class="item-card">
                    <h3>${escapeHTML(project.name)}</h3>
                    <p>${escapeHTML(project.description || "")}</p>
                    <small>Project ID: ${project.id}</small>
                </div>
            `).join("")
            : "No projects available.";

    } catch (error) {
        alert(error.message);
    }
}

// Create project
async function createProject() {
    const name = document.getElementById("projectName").value.trim();
    const description =
        document.getElementById("projectDescription").value.trim();

    const message = document.getElementById("projectMessage");

    try {
        const result = await apiRequest("/projects", "POST", {
            name, description
        });

        message.textContent = result.message;
        message.style.color = "green";

        document.getElementById("projectName").value = "";
        document.getElementById("projectDescription").value = "";

        await loadProjects();
        await loadDashboard();

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }
}

// View projects
async function loadProjects() {
    const list = document.getElementById("projectList");

    try {
        const projects = await apiRequest("/projects");

        list.innerHTML = projects.length
            ? projects.map(project => `
                <div class="item-card">
                    <h3>${escapeHTML(project.name)}</h3>
                    <p>${escapeHTML(project.description || "")}</p>
                    <small>Project ID: ${project.id}</small>
                    <br>
                    <button onclick="editProject(${project.id})">Edit</button>
                </div>
            `).join("")
            : "No projects found.";

    } catch (error) {
        list.textContent = error.message;
    }
}

// Update project
async function editProject(id) {
    const name = prompt("Enter updated project name:");
    if (name === null || !name.trim()) return;

    const description = prompt("Enter updated description:") || "";

    try {
        await apiRequest(`/projects/${id}`, "PUT", {
            name: name.trim(), description
        });

        alert("Project updated successfully!");
        await loadProjects();
        await loadDashboard();

    } catch (error) {
        alert(error.message);
    }
}

// Create task
async function createTask() {
    const project_id = Number(
        document.getElementById("taskProjectId").value
    );

    const title = document.getElementById("taskTitle").value.trim();
    const description =
        document.getElementById("taskDescription").value.trim();

    const status = document.getElementById("taskStatus").value;
    const due_date = document.getElementById("taskDueDate").value || null;

    const message = document.getElementById("taskMessage");

    try {
        const result = await apiRequest("/tasks", "POST", {
            project_id, title, description, status, due_date
        });

        message.textContent = result.message;
        message.style.color = "green";

        document.getElementById("taskTitle").value = "";
        document.getElementById("taskDescription").value = "";

        await loadDashboard();

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }
}

// View tasks
async function loadTasks() {
    const projectId =
        document.getElementById("viewTaskProjectId").value;

    const list = document.getElementById("taskList");

    if (!projectId) {
        list.textContent = "Please enter a project ID.";
        return;
    }

    try {
        const tasks = await apiRequest(
            `/tasks/project/${projectId}`
        );

        list.innerHTML = tasks.length
            ? tasks.map(task => `
                <div class="item-card">
                    <h3>${escapeHTML(task.title)}</h3>
                    <p>${escapeHTML(task.description || "")}</p>
                    <p>Status: ${escapeHTML(task.status)}</p>
                    <p>Task ID: ${task.id}</p>
                    <button onclick="editTask(${task.id}, ${projectId})">
                        Update Status
                    </button>
                </div>
            `).join("")
            : "No tasks found.";

    } catch (error) {
        list.textContent = error.message;
    }
}

// Update task
async function editTask(id, projectId) {
    const title = prompt("Enter task title:");
    if (title === null || !title.trim()) return;

    const description = prompt("Enter task description:") || "";

    const status = prompt(
        "Enter status: Pending, In Progress, or Completed"
    );

    if (!["Pending", "In Progress", "Completed"].includes(status)) {
        alert("Invalid status.");
        return;
    }

    const due_date = prompt("Enter due date (YYYY-MM-DD), or leave blank:") || null;

    try {
        await apiRequest(`/tasks/${id}`, "PUT", {
            title: title.trim(), description, status, due_date
        });

        alert("Task updated successfully!");
        await loadTasks();
        await loadDashboard();

    } catch (error) {
        alert(error.message);
    }
}

// Add comment
async function addComment() {
    const task_id = Number(
        document.getElementById("commentTaskId").value
    );

    const comment =
        document.getElementById("commentText").value.trim();

    const message = document.getElementById("commentMessage");

    try {
        const result = await apiRequest("/comments", "POST", {
            task_id, comment
        });

        message.textContent = result.message;
        message.style.color = "green";

        document.getElementById("commentText").value = "";

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }
}

// View comments
async function loadComments() {
    const taskId =
        document.getElementById("viewCommentTaskId").value;

    const list = document.getElementById("commentList");

    if (!taskId) {
        list.textContent = "Please enter a task ID.";
        return;
    }

    try {
        const comments = await apiRequest(
            `/comments/task/${taskId}`
        );

        list.innerHTML = comments.length
            ? comments.map(comment => `
                <div class="item-card">
                    <h3>${escapeHTML(comment.user_name || "User")}</h3>
                    <p>${escapeHTML(comment.comment)}</p>
                    <small>Comment ID: ${comment.id}</small>
                    <br>
                    <button onclick="deleteComment(${comment.id})">
                        Delete
                    </button>
                </div>
            `).join("")
            : "No comments found.";

    } catch (error) {
        list.textContent = error.message;
    }
}

// Delete comment
async function deleteComment(id) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
        await apiRequest(`/comments/${id}`, "DELETE");

        alert("Comment deleted successfully!");
        loadComments();

    } catch (error) {
        alert(error.message);
    }
}

// Safely display text received from API
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Restore login session
if (token && currentUser) {
    openDashboard();
} else {
    showLogin();
}
