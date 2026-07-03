import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import Loader from '../components/Loader';
import {
  FaChevronLeft,
  FaChevronRight,
  FaClipboardList,
  FaCircleCheck,
  FaTriangleExclamation,
  FaUsers,
} from 'react-icons/fa6';

const AdminDashboard = () => {
  const { user: currentAdmin } = useAuth();
  
  // Tabs state: 'users' or 'tasks'
  const [activeTab, setActiveTab] = useState('users');
  
  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  
  // All tasks state
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  
  // Task filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  
  // Notification states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch all users
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await api.get('/api/v1/admin/users');
      setUsers(response.data.users);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch user list.');
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch all system tasks (admin view)
  const fetchAllTasks = async () => {
    setTasksLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        sortBy: 'createdAt:desc'
      };
      
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const response = await api.get('/api/v1/admin/tasks', { params });
      setTasks(response.data.tasks);
      setMeta(response.data.meta);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch global task audit.');
    } finally {
      setTasksLoading(false);
    }
  };

  // Run fetches based on active tab and query parameter updates
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      const delayDebounce = setTimeout(() => {
        fetchAllTasks();
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [activeTab, search, statusFilter, page]);

  // Flash messages auto-clear
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Admin action: Delete user (cascades tasks and tokens)
  const handleDeleteUser = async (userId, name) => {
    if (userId === currentAdmin.id) {
      setErrorMsg('You cannot delete your own admin account.');
      return;
    }
    
    if (!window.confirm(`WARNING: Are you sure you want to delete user "${name}"?\nThis will permanently purge their account and ALL of their tasks!`)) {
      return;
    }

    try {
      const response = await api.delete(`/api/v1/admin/users/${userId}`);
      setSuccessMsg(response.data.message || 'User deleted successfully.');
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  // Admin action: Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await api.delete(`/api/v1/tasks/${taskId}`);
      setSuccessMsg(response.data.message || 'Task deleted successfully.');
      fetchAllTasks();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  return (
    <div className="admin-dashboard-container container animate-fade-in">
      <header className="dashboard-header">
        <div>
          <h1>Admin Control Panel</h1>
          <p className="subtitle">System overview, user directories, and task audits.</p>
        </div>
      </header>

      {successMsg && <div className="banner success-banner"><FaCircleCheck aria-hidden="true" /> {successMsg}</div>}
      {errorMsg && <div className="banner error-banner"><FaTriangleExclamation aria-hidden="true" /> {errorMsg}</div>}

      {/* Tabs selectors */}
      <div className="admin-tabs">
        <button
          onClick={() => { setActiveTab('users'); setPage(1); }}
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
        >
          <FaUsers aria-hidden="true" /> User Directory ({users.length})
        </button>
        <button
          onClick={() => { setActiveTab('tasks'); setPage(1); }}
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
        >
          <FaClipboardList aria-hidden="true" /> System Task Audit
        </button>
      </div>

      {/* Tab 1: User Directory List */}
      {activeTab === 'users' && (
        <div className="admin-tab-content">
          {usersLoading ? (
            <div className="loading-container"><Loader /></div>
          ) : (
            <div className="table-responsive glass-effect">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Privilege Role</th>
                    <th>Tasks Count</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className={u.id === currentAdmin.id ? 'highlight-row' : ''}>
                      <td>#{u.id}</td>
                      <td className="user-table-name">
                        <strong>{u.name}</strong> {u.id === currentAdmin.id && <span className="you-pill">You</span>}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`user-role-badge ${u.role.toLowerCase()}`}>{u.role}</span>
                      </td>
                      <td>
                        <span className="task-count-badge">{u._count?.tasks || 0} tasks</span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        {u.id !== currentAdmin.id ? (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="btn btn-danger btn-xs"
                          >
                            Purge User
                          </button>
                        ) : (
                          <span className="action-disabled">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: System Task Audit Grid */}
      {activeTab === 'tasks' && (
        <div className="admin-tab-content">
          {/* Filters inside task audit */}
          <div className="filter-controls-bar glass-effect">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search all titles/descriptions/users..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            
            <div className="filters-selectors">
              <div className="filter-item">
                <label htmlFor="admin-status-filter">Status</label>
                <select
                  id="admin-status-filter"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            </div>
          </div>

          {tasksLoading ? (
            <div className="loading-container"><Loader /></div>
          ) : tasks.length === 0 ? (
            <div className="empty-state glass-effect">
              <h3>No tasks found</h3>
              <p>There are no active tasks matching your filter selections in the database.</p>
            </div>
          ) : (
            <>
              <div className="tasks-grid">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => {}} // Disabled editing on audit
                    onDelete={handleDeleteTask}
                    currentUserId={currentAdmin.id}
                    currentUserRole={currentAdmin.role}
                  />
                ))}
              </div>

              {meta.totalPages > 1 && (
                <div className="pagination-controls">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="btn btn-outline btn-sm"
                  >
                    <FaChevronLeft aria-hidden="true" /> Previous
                  </button>
                  <span className="pagination-info">
                    Page <strong>{page}</strong> of <strong>{meta.totalPages}</strong>
                  </span>
                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, meta.totalPages))}
                    disabled={page === meta.totalPages}
                    className="btn btn-outline btn-sm"
                  >
                    Next <FaChevronRight aria-hidden="true" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
