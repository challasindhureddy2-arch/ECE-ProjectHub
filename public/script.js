
const API = "http://localhost:3000/api";

let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user") || "null");

let socket = null;
let notifications = [];
let unreadCount = 0;

// =====================================
// API REQUEST HELPER
// =====================================

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

// =====================================
// PERSISTENT NOTIFICATIONS
// =====================================

async function loadNotifications() {
    try {
        const data = await apiRequest("/notifications");

        notifications = Array.isArray(data)
            ? data.map(item => ({
                id: item.id,
                message: item.message,
                time: item.created_at || item.createdAt,
                is_read: Boolean(item.is_read)
            }))
            : [];

        unreadCount = notifications.filter(
            item => !item.is_read
        ).length;

        updateNotificationDisplay();

    } catch (error) {
        console.error("Failed to load notifications:", error.message);
    }
}

// =====================================
// REAL-TIME SOCKET.IO NOTIFICATIONS
// =====================================

function connectNotifications() {
    if (!token || typeof io !== "function") {
        console.warn("Socket.IO client is not available.");
        return;
    }

    if (socket) {
        socket.disconnect();
        socket = null;
    }

    socket = io("http://localhost:3000", {
        auth: {
            token: token
        }
    });

    socket.on("connect", () => {
        console.log("Connected to real-time notifications.");
    });

    socket.on("connect_error", (error) => {
        console.error("Notification connection error:", error.message);
    });

    socket.on("notification", (data) => {
        addNotification(data);
    });

    socket.on("project_updated", async () => {
        console.log("Project update received.");

        if (!document.getElementById("dashboardPage").classList.contains("hidden")) {
            await loadDashboard();

            if (!document.getElementById("projectsSection").classList.contains("hidden")) {
                await loadProjects();
            }
        }
    });

    socket.on("task_updated", async () => {
        console.log("Task update received.");

        if (!document.getElementById("dashboardPage").classList.contains("hidden")) {
            await loadDashboard();

            if (!document.getElementById("tasksSection").classList.contains("hidden")) {
                await loadTasks();
            }
        }
    });

    socket.on("comment_updated", async () => {
        console.log("Comment update received.");

        if (!document.getElementById("commentsSection").classList.contains("hidden")) {
            await loadComments();
        }
    });
}

// Add new notification
function addNotification(data) {
    if (data.id && notifications.some(item => item.id === data.id)) {
        return;
    }

    const item = {
        id: data.id,
        message: data.message || "You have a new notification.",
        time: data.createdAt || data.created_at || new Date().toISOString(),
        is_read: false
    };

    notifications.unshift(item);

    notifications = notifications.slice(0, 50);

    unreadCount++;

    updateNotificationDisplay();
}

// Display notifications
function updateNotificationDisplay() {
    const count = document.getElementById("notificationCount");
    const list = document.getElementById("notificationList");

    if (!count || !list) return;

    count.textContent = unreadCount;

    if (notifications.length === 0) {
        list.textContent = "No notifications yet.";
        return;
    }

    list.innerHTML = notifications.map(item => `
        <div class="notification-item">
            ${escapeHTML(item.message)}
            <small>${escapeHTML(
                new Date(item.time || item.created_at).toLocaleString()
            )}</small>
        </div>
    `).join("");
}

// Open or close notification panel
async function toggleNotifications() {
    const panel = document.getElementById("notificationPanel");

    if (!panel) return;

    panel.classList.toggle("hidden");

    if (!panel.classList.contains("hidden")) {
        try {
            await apiRequest("/notifications/read-all", "PUT");

            notifications = notifications.map(item => ({
                ...item,
                is_read: true
            }));

            unreadCount = 0;

            updateNotificationDisplay();

        } catch (error) {
            console.error(
                "Could not mark notifications as read:",
                error.message
            );
        }
    }
}

// Notification button
const notificationBell = document.getElementById("notificationBell");

if (notificationBell) {
    notificationBell.addEventListener("click", toggleNotifications);
}

// =====================================
// LOGIN AND REGISTRATION
// =====================================

function showLogin() {
    document.getElementById("loginPage").classList.remove("hidden");
    document.getElementById("registerPage").classList.add("hidden");
    document.getElementById("dashboardPage").classList.add("hidden");
}

function showRegister() {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("registerPage").classList.remove("hidden");
}

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

// =====================================
// DASHBOARD
// =====================================

function openDashboard() {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("registerPage").classList.add("hidden");
    document.getElementById("dashboardPage").classList.remove("hidden");

    document.getElementById("userName").textContent =
        currentUser ? currentUser.name : "User";

    connectNotifications();

    loadNotifications();

    showSection("dashboard");
    loadDashboard();
}

// =====================================
// LOGOUT
// =====================================

function logout() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }

    notifications = [];
    unreadCount = 0;

    updateNotificationDisplay();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    token = null;
    currentUser = null;

    showLogin();
}

// =====================================
// DASHBOARD SECTION SWITCHING
// =====================================

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

// =====================================
// LOAD DASHBOARD STATISTICS
// =====================================

async function loadDashboard() {
    try {
        const projects = await apiRequest("/projects");

        document.getElementById("projectCount").textContent =
            projects.length;

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
        console.error("Dashboard error:", error.message);
    }
}

// =====================================
// CREATE PROJECT
// =====================================

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

// =====================================
// VIEW PROJECTS
// =====================================

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

// =====================================
// UPDATE PROJECT
// =====================================

async function editProject(id) {
    const name = prompt("Enter updated project name:");

    if (name === null || !name.trim()) return;

    const description = prompt("Enter updated description:") || "";

    try {
        await apiRequest(`/projects/${id}`, "PUT", {
            name: name.trim(),
            description
        });

        alert("Project updated successfully!");

        await loadProjects();
        await loadDashboard();

    } catch (error) {
        alert(error.message);
    }
}

// =====================================
// CREATE TASK
// =====================================

async function createTask() {
    const project_id = Number(
        document.getElementById("taskProjectId").value
    );

    const title = document.getElementById("taskTitle").value.trim();

    const description =
        document.getElementById("taskDescription").value.trim();

    const status = document.getElementById("taskStatus").value;

    const due_date =
        document.getElementById("taskDueDate").value || null;

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

// =====================================
// VIEW TASKS
// =====================================

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

// =====================================
// UPDATE TASK
// =====================================

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

    const due_date =
        prompt("Enter due date (YYYY-MM-DD), or leave blank:") || null;

    try {
        await apiRequest(`/tasks/${id}`, "PUT", {
            title: title.trim(),
            description,
            status,
            due_date
        });

        alert("Task updated successfully!");

        await loadTasks();
        await loadDashboard();

    } catch (error) {
        alert(error.message);
    }
}

// =====================================
// ADD COMMENT
// =====================================

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

// =====================================
// VIEW COMMENTS
// =====================================

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

// =====================================
// DELETE COMMENT
// =====================================

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

// =====================================
// SAFE HTML DISPLAY
// =====================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// =====================================
// RESTORE LOGIN SESSION
// =====================================

if (token && currentUser) {
    openDashboard();
} else {
    showLogin();
}
