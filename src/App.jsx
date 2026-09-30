import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import { DEFAULT_TASKS, CATEGORIES, PRIORITIES } from './constants/defaultTasks';

const STORAGE_KEY = 'taskflow_todos_json';
const THEME_KEY = 'taskflow_theme';

export default function App() {
  // Theme state (dark / light)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Tasks state from LocalStorage JSON
  const [tasks, setTasks] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error('Error parsing localStorage JSON tasks:', err);
    }
    // If not in local storage yet, save defaults
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TASKS, null, 2));
    return DEFAULT_TASKS;
  });

  // Save to LocalStorage whenever tasks update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks, null, 2));
    } catch (err) {
      console.error('Error saving tasks to localStorage:', err);
    }
  }, [tasks]);

  // Form states for new task
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState('Work');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueDate, setNewDueDate] = useState('');

  // Search & Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'priority' | 'dueDate'

  // Inline editing state
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // JSON Inspector / Editor Modal state
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [rawJsonText, setRawJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Add Task Handler
  const handleAddTask = (e) => {
    e.preventDefault();
    const trimmed = newText.trim();
    if (!trimmed) return;

    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: trimmed,
      completed: false,
      category: newCategory,
      priority: newPriority,
      dueDate: newDueDate || '',
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [newTask, ...prev]);
    setNewText('');
  };

  // Toggle Task Completion
  const handleToggleTask = (id) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Delete Task
  const handleDeleteTask = (id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  // Start Editing
  const startEditing = (task) => {
    setEditingId(task.id);
    setEditingText(task.text);
  };

  // Save Editing
  const saveEditing = (id) => {
    const trimmed = editingText.trim();
    if (!trimmed) {
      handleDeleteTask(id);
    } else {
      setTasks(prev =>
        prev.map(task => (task.id === id ? { ...task, text: trimmed } : task))
      );
    }
    setEditingId(null);
    setEditingText('');
  };

  // Cancel Editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
  };

  // Clear Completed Tasks
  const handleClearCompleted = () => {
    setTasks(prev => prev.filter(t => !t.completed));
  };

  // Toggle All Completed
  const handleToggleAll = () => {
    const allCompleted = tasks.every(t => t.completed);
    setTasks(prev => prev.map(t => ({ ...t, completed: !allCompleted })));
  };

  // Reset to default sample tasks
  const handleResetDefaults = () => {
    if (window.confirm('Reset tasks to the default sample list?')) {
      setTasks(DEFAULT_TASKS);
    }
  };

  // Open JSON Inspector Modal
  const openJsonModal = () => {
    setRawJsonText(JSON.stringify(tasks, null, 2));
    setJsonError('');
    setIsJsonModalOpen(true);
  };

  // Save edited JSON back to LocalStorage & State
  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(rawJsonText);
      if (!Array.isArray(parsed)) {
        setJsonError('JSON must be an array of task objects.');
        return;
      }
      setTasks(parsed);
      setIsJsonModalOpen(false);
      setJsonError('');
    } catch (err) {
      setJsonError('Invalid JSON format: ' + err.message);
    }
  };

  // Copy JSON to clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(rawJsonText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Filtered & Sorted Tasks calculation
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        // Status filter
        if (statusFilter === 'active' && task.completed) return false;
        if (statusFilter === 'completed' && !task.completed) return false;

        // Category filter
        if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchText = task.text.toLowerCase().includes(query);
          const matchCategory = task.category.toLowerCase().includes(query);
          const matchPriority = task.priority.toLowerCase().includes(query);
          if (!matchText && !matchCategory && !matchPriority) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === 'priority') {
          const weights = { high: 3, medium: 2, low: 1 };
          return (weights[b.priority] || 0) - (weights[a.priority] || 0);
        }
        if (sortBy === 'dueDate') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        return 0;
      });
  }, [tasks, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Stats calculation
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Format Due Date & Time helper
  const getDueDateStatus = (dueDateStr) => {
    if (!dueDateStr) return null;
    try {
      const dueDate = new Date(dueDateStr);
      if (isNaN(dueDate.getTime())) {
        return { text: dueDateStr, type: 'normal' };
      }

      const now = new Date();
      const isPast = dueDate.getTime() < now.getTime();

      const hasTime = dueDateStr.includes('T');
      const timeStr = hasTime
        ? dueDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        : '';

      const isToday =
        dueDate.getFullYear() === now.getFullYear() &&
        dueDate.getMonth() === now.getMonth() &&
        dueDate.getDate() === now.getDate();

      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const isTomorrow =
        dueDate.getFullYear() === tomorrow.getFullYear() &&
        dueDate.getMonth() === tomorrow.getMonth() &&
        dueDate.getDate() === tomorrow.getDate();

      let dateLabel = '';
      if (isToday) {
        dateLabel = hasTime ? `Today at ${timeStr}` : 'Today';
      } else if (isTomorrow) {
        dateLabel = hasTime ? `Tomorrow at ${timeStr}` : 'Tomorrow';
      } else {
        const monthDay = dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        dateLabel = hasTime ? `${monthDay}, ${timeStr}` : monthDay;
      }

      if (isPast) {
        return { text: `Overdue (${dateLabel})`, type: 'overdue' };
      }
      if (isToday) {
        return { text: dateLabel, type: 'today' };
      }
      return { text: dateLabel, type: 'normal' };
    } catch {
      return { text: dueDateStr, type: 'normal' };
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className="brand-info">
            <h1 id="app-title">TaskFlow</h1>
            <p>React ToDo List with LocalStorage JSON</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            id="view-json-btn"
            className="btn-secondary"
            onClick={openJsonModal}
            title="Inspect / Edit LocalStorage JSON"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>JSON Data</span>
          </button>

          <button
            id="theme-toggle-btn"
            className="icon-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Progress & Stats Card */}
      <section className="stats-card" aria-label="Progress Overview">
        <div className="stats-header">
          <span className="stats-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Overall Progress
          </span>
          <span className="stats-badge" id="progress-percentage-badge">
            {progressPercent}% Done
          </span>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>

        <div className="stats-counters">
          <div className="counter-item">
            <span className="counter-label">Total Tasks</span>
            <span className="counter-value" id="total-tasks-count">{totalCount}</span>
          </div>
          <div className="counter-item">
            <span className="counter-label">Pending</span>
            <span className="counter-value" style={{ color: '#f59e0b' }} id="pending-tasks-count">
              {pendingCount}
            </span>
          </div>
          <div className="counter-item">
            <span className="counter-label">Completed</span>
            <span className="counter-value" style={{ color: '#10b981' }} id="completed-tasks-count">
              {completedCount}
            </span>
          </div>
        </div>
      </section>

      {/* Add Task Form */}
      <section className="task-form-card">
        <form onSubmit={handleAddTask}>
          <div className="task-input-wrapper">
            <input
              id="new-task-input"
              className="task-main-input"
              type="text"
              placeholder="What needs to be accomplished today?"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              autoFocus
            />
            <button id="add-task-submit-btn" type="submit" className="btn-add">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add Task</span>
            </button>
          </div>

          <div className="task-form-meta">
            {/* Category Select */}
            <div className="meta-group">
              <span>📂 Category:</span>
              <select
                id="new-task-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.name} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Select */}
            <div className="meta-group">
              <span>⚡ Priority:</span>
              <select
                id="new-task-priority"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
              >
                {PRIORITIES.map(p => (
                  <option key={p.level} value={p.level}>
                    {p.label} Priority
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date & Time Input */}
            <div className="meta-group">
              <span>📅 Due Date & Time:</span>
              <input
                id="new-task-duedate"
                type="datetime-local"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </div>
          </div>
        </form>
      </section>

      {/* Search, Filter Tabs & Sorting */}
      <section className="filters-section">
        <div className="filters-top-bar">
          {/* Search Box */}
          <div className="search-box">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="search-tasks-input"
              className="search-input"
              type="text"
              placeholder="Search tasks by text or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                id="clear-search-btn"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="sort-select-wrapper">
            <span>Sort by:</span>
            <select
              id="sort-tasks-select"
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority (High to Low)</option>
              <option value="dueDate">Due Date</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="filter-tabs">
          <button
            id="filter-all-btn"
            className={`tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All <span className="tab-count">{totalCount}</span>
          </button>
          <button
            id="filter-active-btn"
            className={`tab-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Pending <span className="tab-count">{pendingCount}</span>
          </button>
          <button
            id="filter-completed-btn"
            className={`tab-btn ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Completed <span className="tab-count">{completedCount}</span>
          </button>
        </div>

        {/* Category Chips */}
        <div className="category-chips">
          <button
            className={`chip-btn ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            All Categories
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.name}
              className={`chip-btn ${categoryFilter === cat.name ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat.name)}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Task List */}
      <section className="task-list" aria-label="Tasks List">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <h3>No tasks found</h3>
            <p>
              {searchQuery
                ? `No tasks match your search "${searchQuery}".`
                : statusFilter === 'completed'
                ? 'No completed tasks yet. Finish a task and check it off!'
                : 'Your to-do list is clean! Add a task above to get started.'}
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const categoryObj = CATEGORIES.find(c => c.name === task.category);
            const priorityObj = PRIORITIES.find(p => p.level === task.priority) || PRIORITIES[1];
            const dueStatus = getDueDateStatus(task.dueDate);
            const isEditing = editingId === task.id;

            return (
              <div
                key={task.id}
                className={`task-item ${task.completed ? 'completed' : ''}`}
                id={`task-item-${task.id}`}
              >
                {/* Complete checkbox */}
                <button
                  className={`checkbox-btn ${task.completed ? 'checked' : ''}`}
                  onClick={() => handleToggleTask(task.id)}
                  title={task.completed ? 'Mark as pending' : 'Mark as completed'}
                  aria-label="Toggle task status"
                >
                  {task.completed && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="task-content">
                  {isEditing ? (
                    <div className="edit-input-wrapper">
                      <input
                        className="edit-input"
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditing(task.id);
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        autoFocus
                      />
                      <button
                        className="save-edit-btn"
                        onClick={() => saveEditing(task.id)}
                      >
                        Save
                      </button>
                      <button
                        className="action-btn"
                        onClick={cancelEditing}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <p
                      className="task-text"
                      onDoubleClick={() => startEditing(task)}
                      title="Double-click to edit"
                    >
                      {task.text}
                    </p>
                  )}

                  {/* Metadata tags */}
                  <div className="task-meta">
                    {/* Category */}
                    <span
                      className="badge-category"
                      style={{ color: categoryObj?.color || 'var(--text-secondary)' }}
                    >
                      <span>{categoryObj?.icon || '🏷️'}</span>
                      <span>{task.category || 'General'}</span>
                    </span>

                    {/* Priority */}
                    <span
                      className="badge-priority"
                      style={{
                        color: priorityObj.color,
                        backgroundColor: priorityObj.bg
                      }}
                    >
                      ● {priorityObj.label}
                    </span>

                    {/* Due Date */}
                    {dueStatus && (
                      <span className={`badge-due-date ${dueStatus.type}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>{dueStatus.text}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!isEditing && (
                  <div className="task-actions">
                    <button
                      className="action-btn"
                      onClick={() => startEditing(task)}
                      title="Edit task"
                      aria-label="Edit task"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteTask(task.id)}
                      title="Delete task"
                      aria-label="Delete task"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* Footer Controls & LocalStorage Indicator */}
      <footer className="app-footer-controls">
        <div className="status-indicator">
          <span className="pulse-dot"></span>
          <span>LocalStorage JSON Synced ({tasks.length} items)</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {tasks.length > 0 && (
            <button
              id="toggle-all-btn"
              className="btn-secondary"
              onClick={handleToggleAll}
              title="Toggle all tasks completed"
            >
              Toggle All
            </button>
          )}

          {completedCount > 0 && (
            <button
              id="clear-completed-btn"
              className="btn-secondary"
              onClick={handleClearCompleted}
              title="Remove all completed tasks"
            >
              Clear Completed ({completedCount})
            </button>
          )}

          <button
            id="reset-tasks-btn"
            className="btn-secondary"
            onClick={handleResetDefaults}
            title="Reload default starter tasks"
          >
            Reset Defaults
          </button>
        </div>
      </footer>

      {/* LocalStorage JSON Inspector & Editor Modal */}
      {isJsonModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsJsonModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
                LocalStorage JSON Inspector & Editor
              </h3>
              <button
                className="icon-btn"
                onClick={() => setIsJsonModalOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                This is the raw JSON array currently saved under key <code>'{STORAGE_KEY}'</code> in browser <code>localStorage</code>.
                You can copy it or edit it directly and click <strong>Apply JSON</strong> to load custom tasks!
              </p>

              {jsonError && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', background: 'var(--danger-light)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                  ⚠️ {jsonError}
                </div>
              )}

              <textarea
                id="json-raw-editor"
                className="json-textarea"
                value={rawJsonText}
                onChange={(e) => setRawJsonText(e.target.value)}
                spellCheck="false"
              />
            </div>

            <div className="modal-footer">
              <button
                id="copy-json-btn"
                className="btn-secondary"
                onClick={handleCopyJson}
              >
                {copiedNotification ? '✓ Copied!' : 'Copy JSON'}
              </button>
              <button
                id="apply-json-btn"
                className="btn-add"
                onClick={handleSaveJson}
              >
                Apply JSON to LocalStorage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
