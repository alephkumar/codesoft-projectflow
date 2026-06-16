const Project = require('../models/Project');
const Task = require('../models/Task');
const logActivity = require('../utils/activityLogger');

exports.getProjects = async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;
    const filter = {};
    if (req.user.role !== 'admin') {
      filter.$or = [{ createdBy: req.user._id }, { members: req.user._id }];
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.$text = { $search: search };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('createdBy', 'name email avatar')
        .populate('members', 'name email avatar')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Project.countDocuments(filter)
    ]);
    // Calculate progress for each project
    const projectsWithProgress = await Promise.all(projects.map(async (project) => {
      const tasks = await Task.find({ projectId: project._id });
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
      return { ...project.toObject(), progress, totalTasks: tasks.length, completedTasks };
    }));
    res.json({ success: true, projects: projectsWithProgress, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const tasks = await Task.find({ projectId: project._id });
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    res.json({ success: true, project: { ...project.toObject(), progress, totalTasks: tasks.length, completedTasks } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, createdBy: req.user._id });
    await project.populate('createdBy', 'name email avatar');
    await logActivity({ projectId: project._id, userId: req.user._id, action: 'project_created', details: { projectName: project.name } });
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this project' });
    }
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar');
    await logActivity({ projectId: project._id, userId: req.user._id, action: 'project_updated', details: req.body });
    res.json({ success: true, project: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this project' });
    }
    await Task.deleteMany({ projectId: project._id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.archiveProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, { isArchived: true, status: 'archived' }, { new: true });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await logActivity({ projectId: project._id, userId: req.user._id, action: 'project_archived' });
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findByIdAndUpdate(req.params.id, { $addToSet: { members: userId } }, { new: true })
      .populate('members', 'name email avatar');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await logActivity({ projectId: project._id, userId: req.user._id, action: 'member_added', details: { memberId: userId } });
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, { $pull: { members: req.params.userId } }, { new: true })
      .populate('members', 'name email avatar');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
