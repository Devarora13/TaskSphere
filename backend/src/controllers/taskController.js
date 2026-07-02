const taskService = require('../services/taskService');

exports.createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    const task = await taskService.createTask(
      { title, description, status, priority, dueDate },
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task
    });
  } catch (error) {
    next(error);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const result = await taskService.getTasks(req.user.id, req.query, false);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

exports.getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(
      req.params.id,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      task
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(
      req.params.id,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
