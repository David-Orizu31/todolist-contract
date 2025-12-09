class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.editingId = null;
        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    cacheDOM() {
        this.form = document.getElementById('todoForm');
        this.input = document.getElementById('todoInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.categorySelect = document.getElementById('categorySelect');
        this.dueDateInput = document.getElementById('dueDateInput');
        this.container = document.getElementById('todoContainer');
        this.searchInput = document.getElementById('searchInput');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e));
        });
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const text = this.input.value.trim();
        const priority = this.prioritySelect.value;
        const category = this.categorySelect.value;
        const dueDate = this.dueDateInput.value;

        if (text) {
            if (this.editingId) {
                this.updateTodo(this.editingId, text, priority, category, dueDate);
                this.editingId = null;
            } else {
                this.addTodo(text, priority, category, dueDate);
            }
            this.form.reset();
        }
    }

    addTodo(text, priority, category, dueDate) {
        const todo = {
            id: Date.now(),
            text,
            priority,
            category,
            dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.render();
        this.updateStats();
    }

    updateTodo(id, text, priority, category, dueDate) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.text = text;
            todo.priority = priority;
            todo.category = category;
            todo.dueDate = dueDate;
            this.saveTodos();
            this.render();
        }
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
        this.render();
        this.updateStats();
    }

    toggleComplete(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
            this.updateStats();
        }
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            this.input.value = todo.text;
            this.prioritySelect.value = todo.priority;
            this.categorySelect.value = todo.category;
            this.dueDateInput.value = todo.dueDate;
            this.editingId = id;
            this.input.focus();
        }
    }

    clearCompleted() {
        if (confirm('Are you sure you want to clear all completed tasks?')) {
            this.todos = this.todos.filter(todo => !todo.completed);
            this.saveTodos();
            this.render();
            this.updateStats();
        }
    }

    handleFilter(e) {
        this.filterBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.render();
    }

    handleSearch(e) {
        this.searchQuery = e.target.value.toLowerCase();
        this.render();
    }

    getFilteredTodos() {
        let filtered = this.todos;

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(todo => 
                todo.text.toLowerCase().includes(this.searchQuery) ||
                todo.category.toLowerCase().includes(this.searchQuery)
            );
        }

        // Apply status filter
        switch(this.currentFilter) {
            case 'pending':
                filtered = filtered.filter(todo => !todo.completed);
                break;
            case 'completed':
                filtered = filtered.filter(todo => todo.completed);
                break;
            case 'high':
                filtered = filtered.filter(todo => todo.priority === 'high');
                break;
        }

        return filtered;
    }

    render() {
        const filtered = this.getFilteredTodos();

        if (filtered.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h4>No tasks found</h4>
                    <p>${this.searchQuery ? 'Try a different search term' : 'Add your first task to get started!'}</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = filtered.map(todo => this.createTodoHTML(todo)).join('');
    }

    createTodoHTML(todo) {
        const priorityClass = `priority-${todo.priority}`;
        const completedClass = todo.completed ? 'completed' : '';
        const dueText = todo.dueDate ? this.formatDate(todo.dueDate) : 'No due date';
        const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

        return `
            <div class="todo-item ${completedClass}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <p class="todo-text">${this.escapeHtml(todo.text)}</p>
                        <div class="todo-meta">
                            <span class="priority-badge ${priorityClass}">
                                <i class="fas fa-flag"></i> ${todo.priority.toUpperCase()}
                            </span>
                            <span class="category-badge">
                                <i class="fas fa-tag"></i> ${todo.category}
                            </span>
                            <span ${isOverdue ? 'class="text-danger fw-bold"' : ''}>
                                <i class="fas fa-calendar"></i> ${dueText}
                            </span>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn-action btn-complete" onclick="app.toggleComplete(${todo.id})" title="Toggle Complete">
                            <i class="fas ${todo.completed ? 'fa-undo' : 'fa-check-circle'}"></i>
                        </button>
                        <button class="btn-action btn-edit" onclick="app.editTodo(${todo.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="app.deleteTodo(${todo.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('completionRate').textContent = `${rate}%`;
    }

    saveTodos() {
        const data = JSON.stringify(this.todos);
        document.cookie = `todos=${encodeURIComponent(data)}; max-age=31536000; path=/`;
    }

    loadTodos() {
        const cookies = document.cookie.split('; ');
        const todoCookie = cookies.find(c => c.startsWith('todos='));
        if (todoCookie) {
            try {
                return JSON.parse(decodeURIComponent(todoCookie.split('=')[1]));
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
const app = new TodoApp();