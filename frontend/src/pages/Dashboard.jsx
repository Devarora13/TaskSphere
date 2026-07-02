import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import Loader from '../components/Loader';

const Dashboard = () => {
  const { user } = useAuth();
  
  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 9, totalPages: 1 });
  
  // Query filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // UI notifications states
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch tasks helper
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 9,
        sortBy
      };
      
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;

      const response = await api.get('/api/v1/tasks', { params });
      setTasks(response.data.tasks);
      setMeta(response.data.meta);
      setErrorMessage('');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch tasks when filters or page change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTasks();
    }, 300); // 300ms debounce on search/filters

    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter, priorityFilter, sortBy, page]);

  // Alert flash auto-clears
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleCreateOrUpdate = async (taskPayload) => {
    try {
      if (selectedTask) {
        // Edit flow
        const response = await api.put(`/api/v1/tasks/${selectedTask.id}`, taskPayload);
        setSuccessMessage(response.data.message || 'Task updated successfully.');
      } else {
        // Create flow
        const response = await api.post('/api/v1/tasks', taskPayload);
        setSuccessMessage(response.data.message || 'Task created successfully.');
      }
      fetchTasks();
    } catch (err) {
      throw err; // Form component will catch and display error internally
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const response = await api.delete(`/api/v1/tasks/${taskId}`);
      setSuccessMessage(response.data.message || 'Task deleted successfully.');
      fetchTasks();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  const openCreateModal = () => {
    setSelectedTask(null);
    setIsFormOpen(true);
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setIsFormOpen(true);
  };

  return (
    <div className="dashboard-container container animate-fade-in">
      {/* Top Header Section */}
      <header className="dashboard-header">
        <div>
          <h1>Welcome, {user?.name}!</h1>
          <p className="subtitle">Manage your daily checklist and priorities.</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary create-task-btn">
          ➕ Create Task
        </button>
      </header>

      {/* Message banners */}
      {successMessage && <div className="banner success-banner">✅ {successMessage}</div>}
      {errorMessage && <div className="banner error-banner">⚠️ {errorMessage}</div>}

      {/* Filters and Search Bar Section */}
      <div className="filter-controls-bar glass-effect">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search tasks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filters-selectors">
          <div className="filter-item">
            <label htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="priority-filter">Priority</label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="sort-filter">Sort By</label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
            >
              <option value="createdAt:desc">Created (Newest)</option>
              <option value="createdAt:asc">Created (Oldest)</option>
              <option value="dueDate:asc">Due Date (Soonest)</option>
              <option value="dueDate:desc">Due Date (Latest)</option>
              <option value="title:asc">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div className="loading-container">
          <Loader />
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state glass-effect">
          <div className="empty-icon">🗭</div>
          <h3>No tasks found</h3>
          <p>Try refining your search, modifying filters, or create a brand new task!</p>
          <button onClick={openCreateModal} className="btn btn-outline">
            Create a Task Now
          </button>
        </div>
      ) : (
        <>
          <div className="tasks-grid">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={openEditModal}
                onDelete={handleDelete}
                currentUserId={user?.id}
                currentUserRole={user?.role}
              />
            ))}
          </div>

          {/* Pagination controls */}
          {meta.totalPages > 1 && (
            <div className="pagination-controls">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="btn btn-outline btn-sm"
              >
                ◀ Previous
              </button>
              <span className="pagination-info">
                Page <strong>{page}</strong> of <strong>{meta.totalPages}</strong>
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, meta.totalPages))}
                disabled={page === meta.totalPages}
                className="btn btn-outline btn-sm"
              >
                Next ▶
              </button>
            </div>
          )}
        </>
      )}

      {/* Task Modal Form */}
      <TaskForm
        isOpen={isFormOpen}
        task={selectedTask}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateOrUpdate}
      />
    </div>
  );
};

export default Dashboard;
