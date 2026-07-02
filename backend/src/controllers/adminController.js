const adminService = require('../services/adminService');
const taskService = require('../services/taskService');

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllTasks = async (req, res, next) => {
  try {
    // Admin query is mapped to taskService with isAdminView = true
    const result = await taskService.getTasks(req.user.id, req.query, true);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await adminService.deleteUser(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'User and all associated tasks deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
