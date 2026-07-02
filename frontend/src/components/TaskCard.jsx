import React from 'react';

const TaskCard = ({ task, onEdit, onDelete, currentUserId, currentUserRole }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isExpired = (dateString) => {
    if (!dateString) return false;
    const dueDate = new Date(dateString);
    dueDate.setHours(23, 59, 59, 999); // end of day
    return dueDate < new Date() && task.status !== 'DONE';
  };

  // Determine if current user can manage this card
  const isOwner = task.ownerId === currentUserId;
  const isAdmin = currentUserRole === 'ADMIN';
  const canManage = isOwner || isAdmin;

  return (
    <div className={`task-card glass-effect ${task.status.toLowerCase()}-card`}>
      <div className="task-card-header">
        <div className="task-badges">
          <span className={`badge status-badge ${task.status.toLowerCase()}`}>
            {task.status.replace('_', ' ')}
          </span>
          <span className={`badge priority-badge ${task.priority.toLowerCase()}`}>
            {task.priority} Priority
          </span>
        </div>
        {task.owner && isAdmin && (
          <span className="task-owner-badge" title={task.owner.email}>
            👤 {task.owner.name}
          </span>
        )}
      </div>

      <h3 className="task-title">{task.title}</h3>
      <p className="task-description">{task.description || 'No description provided.'}</p>

      <div className="task-card-footer">
        <div className={`task-due-date ${isExpired(task.dueDate) ? 'overdue' : ''}`}>
          📅 {formatDate(task.dueDate)}
          {isExpired(task.dueDate) && <span className="overdue-tag">Overdue</span>}
        </div>

        {canManage && (
          <div className="task-actions">
            <button
              onClick={() => onEdit(task)}
              className="btn btn-outline btn-xs edit-btn"
              title="Edit Task"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="btn btn-danger-outline btn-xs delete-btn"
              title="Delete Task"
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
