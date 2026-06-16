const express = require('express');
const router = express.Router();
const { getComments, addComment, updateComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/:taskId', getComments);
router.post('/', addComment);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);

module.exports = router;
