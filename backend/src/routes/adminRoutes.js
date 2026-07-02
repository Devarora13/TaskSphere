const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/users', adminController.getAllUsers);
router.get('/tasks', adminController.getAllTasks);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
