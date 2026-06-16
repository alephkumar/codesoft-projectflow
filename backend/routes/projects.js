const express = require('express');
const router = express.Router();
const { getProjects, getProject, createProject, updateProject, deleteProject, archiveProject, addMember, removeMember } = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getProjects);
router.get('/:id', getProject);
router.post('/', authorize('admin', 'project_manager'), createProject);
router.put('/:id', authorize('admin', 'project_manager'), updateProject);
router.delete('/:id', authorize('admin', 'project_manager'), deleteProject);
router.patch('/:id/archive', authorize('admin', 'project_manager'), archiveProject);
router.post('/:id/members', authorize('admin', 'project_manager'), addMember);
router.delete('/:id/members/:userId', authorize('admin', 'project_manager'), removeMember);

module.exports = router;
