const express = require('express');
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/authMiddleware');
const { createTaskValidator, updateTaskValidator } = require('../validators/taskValidator');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

// Apply authenticate middleware globally to all task routes
router.use(authenticate);

router.post('/', createTaskValidator, validate, taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', updateTaskValidator, validate, taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
