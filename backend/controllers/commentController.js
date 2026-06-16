const Comment = require('../models/Comment');
const logActivity = require('../utils/activityLogger');
const Task = require('../models/Task');

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ taskId: req.params.taskId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: 1 });
    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { taskId, content } = req.body;
    const comment = await Comment.create({ taskId, userId: req.user._id, content });
    await comment.populate('userId', 'name email avatar');
    const task = await Task.findById(taskId);
    if (task) {
      await logActivity({ projectId: task.projectId, taskId, userId: req.user._id, action: 'comment_added', details: { commentId: comment._id } });
    }
    res.status(201).json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this comment' });
    }
    comment.content = req.body.content;
    comment.isEdited = true;
    await comment.save();
    await comment.populate('userId', 'name email avatar');
    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
