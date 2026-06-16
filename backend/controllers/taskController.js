const Task = require('../models/Task');
const Project = require('../models/Project');
const logActivity = require('../utils/activityLogger');
const { createNotification } = require('../utils/notificationUtils');

exports.getTasks = async (req, res) => {
  try {
    const { projectId, status, priority, assignedTo, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (projectId) filter.projectId = projectId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (req.user.role === 'team_member' && !projectId) {
      filter.assignedTo = req.user._id;
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email')
        .populate('projectId', 'name')
        .sort({ position: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Task.countDocuments(filter)
    ]);
    res.json({ success: true, tasks, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name status');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email');
    await logActivity({ projectId: task.projectId, taskId: task._id, userId: req.user._id, action: 'task_created', details: { taskTitle: task.title } });
    if (task.assignedTo) {
      await createNotification({ userId: task.assignedTo._id, type: 'task_assigned', title: 'New Task Assigned', message: `You have been assigned: ${task.title}`, relatedTask: task._id, relatedProject: task.projectId });
    }
    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const existingTask = await Task.findById(req.params.id);
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role === 'team_member' && existingTask.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email');
    if (req.body.status && req.body.status !== existingTask.status) {
      await logActivity({ projectId: task.projectId, taskId: task._id, userId: req.user._id, action: 'status_changed', details: { from: existingTask.status, to: req.body.status } });
    }
    if (req.body.assignedTo && req.body.assignedTo !== existingTask.assignedTo?.toString()) {
      await logActivity({ projectId: task.projectId, taskId: task._id, userId: req.user._id, action: 'task_assigned', details: { assignedTo: req.body.assignedTo } });
      await createNotification({ userId: req.body.assignedTo, type: 'task_assigned', title: 'Task Assigned to You', message: `You have been assigned: ${task.title}`, relatedTask: task._id, relatedProject: task.projectId });
    }
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (req.user.role === 'team_member') {
      return res.status(403).json({ error: 'Team members cannot delete tasks' });
    }
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const attachment = { filename: req.file.filename, originalName: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size, uploadedBy: req.user._id };
    const task = await Task.findByIdAndUpdate(req.params.id, { $push: { attachments: attachment } }, { new: true });
    await logActivity({ projectId: task.projectId, taskId: task._id, userId: req.user._id, action: 'attachment_uploaded', details: { filename: req.file.originalname } });
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getActivityLog = async (req, res) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    const logs = await ActivityLog.find({ taskId: req.params.id })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
