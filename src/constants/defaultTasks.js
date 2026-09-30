export const DEFAULT_TASKS = [
  {
    id: "task-1",
    text: "Review project specifications and requirements",
    completed: true,
    category: "Work",
    priority: "high",
    dueDate: "2026-09-29T10:00",
    createdAt: "2026-09-28T09:00:00.000Z"
  },
  {
    imd: "task-2",
    text: "Build React frontend with LocalStorage JSON persistence",
    completed: true,
    category: "Work",
    priority: "high",
    dueDate: "2026-09-29T14:00",
    createdAt: "2026-09-28T10:30:00.000Z"
  },
  {
    id: "task-3",
    text: "Grocery shopping for fresh fruits & weekly groceries",
    completed: false,
    category: "Shopping",
    priority: "medium",
    dueDate: "2026-09-30T18:30",
    createdAt: "2026-09-29T08:15:00.000Z"
  },
  {
    id: "task-4",
    text: "Go for a 30-minute evening run & stretch",
    completed: false,
    category: "Health",
    priority: "low",
    dueDate: "2026-09-29T19:00",
    createdAt: "2026-09-29T11:00:00.000Z"
  },
  {
    id: "task-5",
    text: "Read 20 pages of clean code principles",
    completed: false,
    category: "Study",
    priority: "medium",
    dueDate: "2026-10-01T21:00",
    createdAt: "2026-09-29T12:00:00.000Z"
  }
];

export const CATEGORIES = [
  { name: "Work", color: "#6366f1", icon: "💼" },
  { name: "Personal", color: "#ec4899", icon: "👤" },
  { name: "Study", color: "#8b5cf6", icon: "📚" },
  { name: "Health", color: "#10b981", icon: "🏃" },
  { name: "Shopping", color: "#f59e0b", icon: "🛒" }
];

export const PRIORITIES = [
  { level: "high", label: "High", color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" },
  { level: "medium", label: "Medium", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
  { level: "low", label: "Low", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" }
];
