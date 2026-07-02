const prisma = require('../config/db');
const AppError = require('../utils/appError');

// Self-reference so internal calls work correctly in CommonJS
const taskService = exports;

exports.createTask = async (taskData, userId) => {
  return await prisma.task.create({
    data: {
      ...taskData,
      ownerId: userId
    }
  });
};

exports.getTasks = async (userId, query = {}, isAdminView = false) => {
  const { search, status, priority, sortBy, page = 1, limit = 10 } = query;

  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 10;
  const skip = (parsedPage - 1) * parsedLimit;

  // Build the filter conditions
  const where = {};

  // If not admin view, scope tasks strictly to the owner
  if (!isAdminView) {
    where.ownerId = userId;
  }

  // Text search on title or description (case insensitive)
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Filter by status enum
  if (status && ['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) {
    where.status = status;
  }

  // Filter by priority enum
  if (priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
    where.priority = priority;
  }

  // Parse sorting
  let orderBy = { createdAt: 'desc' }; // default sort
  if (sortBy) {
    const parts = sortBy.split(':');
    const field = parts[0];
    const order = parts[1] === 'asc' ? 'asc' : 'desc';

    if (['createdAt', 'updatedAt', 'dueDate', 'title', 'priority', 'status'].includes(field)) {
      orderBy = { [field]: order };
    }
  }

  // Execute query and count in parallel
  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      orderBy,
      skip,
      take: parsedLimit,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    }),
    prisma.task.count({ where })
  ]);

  return {
    tasks,
    meta: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit)
    }
  };
};

exports.getTaskById = async (taskId, userId, userRole) => {
  const task = await prisma.task.findUnique({
    where: { id: parseInt(taskId, 10) },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  });

  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  // Authorization check: User must be the owner, or an Admin
  if (task.ownerId !== userId && userRole !== 'ADMIN') {
    throw new AppError('You are not authorized to access this task.', 403);
  }

  return task;
};

exports.updateTask = async (taskId, updateData, userId, userRole) => {
  // Check if task exists and user is authorized
  const task = await taskService.getTaskById(taskId, userId, userRole);

  // Clean input updates (do not allow manual owner overrides)
  const { ownerId, id, createdAt, updatedAt, ...cleanUpdates } = updateData;

  // Format dueDate properly if provided
  if (cleanUpdates.dueDate) {
    cleanUpdates.dueDate = new Date(cleanUpdates.dueDate);
  } else if (cleanUpdates.dueDate === null || cleanUpdates.dueDate === '') {
    cleanUpdates.dueDate = null;
  }

  return await prisma.task.update({
    where: { id: task.id },
    data: cleanUpdates,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  });
};

exports.deleteTask = async (taskId, userId, userRole) => {
  // Check if task exists and user is authorized
  const task = await taskService.getTaskById(taskId, userId, userRole);

  await prisma.task.delete({
    where: { id: task.id }
  });
};
