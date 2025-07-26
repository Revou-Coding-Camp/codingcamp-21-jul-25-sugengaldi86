class TodoApp {
  constructor() {
    this.todos = JSON.parse(localStorage.getItem("todos")) || [];
    this.currentFilter = "all";
    this.init();
  }

  init() {
    this.bindEvents();
    this.render();
    this.setMinDate();
    this.updateStats();
  }

  bindEvents() {
    const form = document.getElementById("todoForm");
    const filterButtons = document.querySelectorAll(".filter-btn");

    form.addEventListener("submit", (e) => this.handleAddTodo(e));

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleFilter(e));
    });

    // Add keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        document.getElementById("todoForm").dispatchEvent(new Event("submit"));
      }
    });
  }

  setMinDate() {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("dateInput").min = today;
  }

  handleAddTodo(e) {
    e.preventDefault();

    const todoInput = document.getElementById("todoInput");
    const dateInput = document.getElementById("dateInput");
    const todoError = document.getElementById("todoError");
    const dateError = document.getElementById("dateError");

    // Clear previous errors
    todoError.textContent = "";
    dateError.textContent = "";

    // Validate inputs
    let isValid = true;

    if (!todoInput.value.trim()) {
      todoError.textContent = "Please enter a task";
      todoInput.focus();
      this.shakeElement(todoInput);
      isValid = false;
    } else if (todoInput.value.trim().length < 3) {
      todoError.textContent = "Task must be at least 3 characters long";
      todoInput.focus();
      this.shakeElement(todoInput);
      isValid = false;
    }

    if (!dateInput.value) {
      dateError.textContent = "Please select a due date";
      if (isValid) dateInput.focus();
      this.shakeElement(dateInput);
      isValid = false;
    }

    if (!isValid) return;

    // Add new todo with smooth animation
    const newTodo = {
      id: Date.now(),
      text: todoInput.value.trim(),
      date: dateInput.value,
      completed: false,
      createdAt: new Date().toISOString(),
      priority: this.calculatePriority(dateInput.value),
    };

    this.todos.unshift(newTodo); // Add to beginning for better UX
    this.saveTodos();

    // Reset form with animation
    this.resetFormWithAnimation(todoInput, dateInput);

    this.render();
    this.updateStats();
    this.showNotification("Task added successfully! 🎉");
  }

  shakeElement(element) {
    element.style.animation = "shake 0.5s ease-in-out";
    setTimeout(() => {
      element.style.animation = "";
    }, 500);
  }

  resetFormWithAnimation(todoInput, dateInput) {
    todoInput.style.transform = "scale(0.95)";
    dateInput.style.transform = "scale(0.95)";

    setTimeout(() => {
      todoInput.value = "";
      dateInput.value = "";
      todoInput.style.transform = "scale(1)";
      dateInput.style.transform = "scale(1)";
      todoInput.focus();
    }, 200);
  }

  calculatePriority(date) {
    const today = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "overdue";
    if (diffDays === 0) return "today";
    if (diffDays <= 3) return "urgent";
    return "normal";
  }

  handleFilter(e) {
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active");
      btn.style.transform = "scale(1)";
    });

    e.target.classList.add("active");
    e.target.style.transform = "scale(1.05)";

    setTimeout(() => {
      e.target.style.transform = "scale(1)";
    }, 200);

    this.currentFilter = e.target.dataset.filter;
    this.render();
    this.updateStats();
  }

  toggleTodo(id) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      todo.completedAt = todo.completed ? new Date().toISOString() : null;

      this.saveTodos();
      this.render();
      this.updateStats();

      const message = todo.completed
        ? "Task completed! 🎉"
        : "Task reopened 📝";
      this.showNotification(message);
    }
  }

  deleteTodo(id) {
    const todoElement = document.querySelector(`[data-todo-id="${id}"]`);
    if (todoElement) {
      todoElement.classList.add("deleting");

      setTimeout(() => {
        this.todos = this.todos.filter((t) => t.id !== id);
        this.saveTodos();
        this.render();
        this.updateStats();
      }, 300);

      this.showNotification("Task deleted 🗑️");
    }
  }

  getFilteredTodos() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    let filtered = [];

    switch (this.currentFilter) {
      case "today":
        filtered = this.todos.filter((todo) => todo.date === todayStr);
        break;
      case "overdue":
        filtered = this.todos.filter(
          (todo) => new Date(todo.date) < today && !todo.completed
        );
        break;
      case "completed":
        filtered = this.todos.filter((todo) => todo.completed);
        break;
      default:
        filtered = this.todos;
    }

    // Sort todos: incomplete first, then by date, then by creation time
    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed - b.completed;
      }

      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  isOverdue(date, completed) {
    if (completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date) < today;
  }

  isToday(date) {
    const today = new Date().toISOString().split("T")[0];
    return date === today;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return "Today";
    } else if (date.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else if (date.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else {
      const options = {
        weekday: "short",
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      };
      return date.toLocaleDateString("en-US", options);
    }
  }

  updateStats() {
    const totalTasks = this.todos.length;
    const completedTasks = this.todos.filter((t) => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const overdueTasks = this.todos.filter((t) =>
      this.isOverdue(t.date, t.completed)
    ).length;

    const statsElement = document.getElementById("totalTasks");

    let statsText = "";
    switch (this.currentFilter) {
      case "all":
        statsText = `${totalTasks} total, ${pendingTasks} pending`;
        break;
      case "today":
        const todayTasks = this.getFilteredTodos().length;
        statsText = `${todayTasks} tasks today`;
        break;
      case "overdue":
        statsText = `${overdueTasks} overdue tasks`;
        break;
      case "completed":
        statsText = `${completedTasks} completed tasks`;
        break;
    }

    statsElement.textContent = statsText;

    // Add visual indicator for overdue tasks
    if (overdueTasks > 0 && this.currentFilter === "all") {
      statsElement.style.background =
        "linear-gradient(135deg, #ffe6e6 0%, #ffcccc 100%)";
      statsElement.style.color = "#e74c3c";
      statsElement.style.borderColor = "#e74c3c";
    } else {
      statsElement.style.background = "#f8f9ff";
      statsElement.style.color = "#666";
      statsElement.style.borderColor = "#e1e5e9";
    }
  }

  showNotification(message) {
    // Remove existing notification
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            z-index: 1000;
            animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
            font-weight: 500;
            max-width: 300px;
        `;

    // Add CSS animation keyframes
    const style = document.createElement("style");
    style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
      if (style.parentNode) {
        style.remove();
      }
    }, 3000);
  }

  render() {
    const todoList = document.getElementById("todoList");
    const emptyState = document.getElementById("emptyState");
    const filteredTodos = this.getFilteredTodos();

    if (filteredTodos.length === 0) {
      todoList.style.display = "none";
      emptyState.style.display = "block";

      // Update empty state message based on filter
      const emptyIcon = emptyState.querySelector(".empty-icon");
      const emptyTitle = emptyState.querySelector("h3");
      const emptyText = emptyState.querySelector("p");

      switch (this.currentFilter) {
        case "today":
          emptyIcon.textContent = "🌅";
          emptyTitle.textContent = "No tasks for today";
          emptyText.textContent = "Enjoy your free day!";
          break;
        case "overdue":
          emptyIcon.textContent = "✅";
          emptyTitle.textContent = "All caught up!";
          emptyText.textContent = "No overdue tasks. Great job!";
          break;
        case "completed":
          emptyIcon.textContent = "🎯";
          emptyTitle.textContent = "No completed tasks";
          emptyText.textContent = "Complete some tasks to see them here!";
          break;
        default:
          emptyIcon.textContent = "📝";
          emptyTitle.textContent = "No tasks yet";
          emptyText.textContent = "Add your first task above to get started!";
      }
      return;
    }

    todoList.style.display = "flex";
    emptyState.style.display = "none";

    todoList.innerHTML = filteredTodos
      .map((todo) => {
        const isOverdue = this.isOverdue(todo.date, todo.completed);
        const isToday = this.isToday(todo.date);

        return `
                <div class="todo-item ${todo.completed ? "completed" : ""} ${
          isOverdue ? "overdue" : ""
        } ${isToday ? "today" : ""}" 
                     data-todo-id="${todo.id}">
                    <div class="priority-indicator"></div>
                    <input 
                        type="checkbox" 
                        class="todo-checkbox" 
                        ${todo.completed ? "checked" : ""}
                        onchange="app.toggleTodo(${todo.id})"
                        title="${
                          todo.completed
                            ? "Mark as pending"
                            : "Mark as completed"
                        }"
                    >
                    <div class="todo-content">
                        <div class="todo-text">${this.escapeHtml(
                          todo.text
                        )}</div>
                        <div class="todo-date">Due: ${this.formatDate(
                          todo.date
                        )}</div>
                    </div>
                    <button class="delete-btn" 
                            onclick="app.deleteTodo(${todo.id})"
                            title="Delete task">
                        Delete
                    </button>
                </div>
            `;
      })
      .join("");
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  saveTodos() {
    try {
      localStorage.setItem("todos", JSON.stringify(this.todos));
    } catch (error) {
      console.error("Failed to save todos to localStorage:", error);
      this.showNotification("Failed to save data ⚠️");
    }
  }

  // Utility method to clear all completed tasks
  clearCompleted() {
    const completedCount = this.todos.filter((t) => t.completed).length;
    if (completedCount === 0) {
      this.showNotification("No completed tasks to clear");
      return;
    }

    if (confirm(`Delete ${completedCount} completed task(s)?`)) {
      this.todos = this.todos.filter((t) => !t.completed);
      this.saveTodos();
      this.render();
      this.updateStats();
      this.showNotification(`${completedCount} completed tasks deleted`);
    }
  }

  // Method to export todos as JSON
  exportTodos() {
    const dataStr = JSON.stringify(this.todos, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "todos-backup.json";
    link.click();
    URL.revokeObjectURL(url);
    this.showNotification("Todos exported! 📁");
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new TodoApp();
});

// Handle page visibility change to update overdue status
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && window.app) {
    window.app.render();
    window.app.updateStats();
  }
});

// Auto-save every 30 seconds (backup)
setInterval(() => {
  if (window.app) {
    window.app.saveTodos();
  }
}, 30000);
