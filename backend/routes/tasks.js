const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, deleteTask, uploadAttachment, getActivityLog } = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', authorize('admin', 'project_manager'), createTask);
router.put('/:id', updateTask);
router.delete('/:id', authorize('admin', 'project_manager'), deleteTask);
router.post('/:id/attachments', upload.single('file'), uploadAttachment);
router.get('/:id/activity', getActivityLog);

module.exports = router;
