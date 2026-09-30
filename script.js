// Point this at your deployed backend when running against AWS EC2.
// Example: const API_BASE = "http://<your-ec2-public-ip>:8080/api/tasks";
const API_BASE = "http://localhost:8080/api/tasks";

const form = document.getElementById("task-form");
const titleInput = document.getElementById("title");
const descInput = document.getElementById("description");
const listEl = document.getElementById("task-list");
const errorBox = document.getElementById("error-box");
const filterButtons = document.querySelectorAll(".filter-btn");

let allTasks = [];
let activeFilter = "ALL";

async function fetchTasks() {
  try {
    const res = await fetch(API_BASE);
    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(body.message || "Failed to load tasks");
    allTasks = body.data;
    renderTasks();
  } catch (err) {
    showError(err.message);
  }
}

function renderTasks() {
  const filtered = activeFilter === "ALL"
    ? allTasks
    : allTasks.filter((t) => t.status === activeFilter);

  listEl.innerHTML = "";

  if (filtered.length === 0) {
    listEl.innerHTML = '<li class="empty-state">No tasks here yet.</li>';
    return;
  }

  filtered.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-card" + (task.status === "COMPLETED" ? " completed" : "");
    li.innerHTML = `
      <div class="task-main">
        <p class="task-title">${escapeHtml(task.title)}</p>
        ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ""}
        <span class="status-badge ${task.status}">${task.status.replace("_", " ")}</span>
      </div>
      <div class="task-actions">
        ${task.status !== "COMPLETED"
          ? `<button class="complete-btn" data-id="${task.id}">Complete</button>`
          : ""}
        <button class="delete-btn" data-id="${task.id}">Delete</button>
      </div>
    `;
    listEl.appendChild(li);
  });
}

async function createTask(e) {
  e.preventDefault();
  hideError();

  const payload = {
    title: titleInput.value.trim(),
    description: descInput.value.trim()
  };

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(body.message || "Failed to create task");
    titleInput.value = "";
    descInput.value = "";
    await fetchTasks();
  } catch (err) {
    showError(err.message);
  }
}

async function markComplete(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}/complete`, { method: "PATCH" });
    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(body.message || "Failed to update task");
    await fetchTasks();
  } catch (err) {
    showError(err.message);
  }
}

async function deleteTask(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(body.message || "Failed to delete task");
    await fetchTasks();
  } catch (err) {
    showError(err.message);
  }
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
  errorBox.textContent = "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

form.addEventListener("submit", createTask);

listEl.addEventListener("click", (e) => {
  const id = e.target.dataset.id;
  if (!id) return;
  if (e.target.classList.contains("complete-btn")) markComplete(id);
  if (e.target.classList.contains("delete-btn")) deleteTask(id);
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    renderTasks();
  });
});

fetchTasks();
