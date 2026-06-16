const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';
    const projectFilter = isAdmin ? {} : { $or: [{ createdBy: userId }, { members: userId }] };
    const [projects, users, activityLogs] = await Promise.all([
      Project.find(projectFilter),
      isAdmin ? User.find({ isActive: true }) : [],
      ActivityLog.find(isAdmin ? {} : { userId }).sort({ createdAt: -1 }).limit(20).populate('userId', 'name avatar')
    ]);
    const projectIds = projects.map(p => p._id);
    const taskFilter = isAdmin ? { projectId: { $in: projectIds } } : { $or: [{ projectId: { $in: projectIds } }, { assignedTo: userId }] };
    const tasks = await Task.find(taskFilter).populate('projectId', 'name');
    const now = new Date();
    const stats = {
      projects: {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        onHold: projects.filter(p => p.status === 'on_hold').length,
        planning: projects.filter(p => p.status === 'planning').length,
        delayed: projects.filter(p => p.endDate < now && p.status !== 'completed').length
      },
      tasks: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        todo: tasks.filter(t => t.status === 'todo').length,
        review: tasks.filter(t => t.status === 'review').length,
        overdue: tasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'completed').length
      },
      users: { total: users.length },
      recentActivity: activityLogs
    };
    // Chart data: last 7 days task completion
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0,0,0,0));
      const dayEnd = new Date(date.setHours(23,59,59,999));
      const completedCount = tasks.filter(t => t.updatedAt >= dayStart && t.updatedAt <= dayEnd && t.status === 'completed').length;
      last7Days.push({ date: dayStart.toISOString().split('T')[0], completed: completedCount });
    }
    stats.chartData = { taskCompletionTrend: last7Days };
    // Project progress
    stats.projectProgress = await Promise.all(projects.slice(0, 5).map(async (project) => {
      const projectTasks = tasks.filter(t => t.projectId?._id?.toString() === project._id.toString() || t.projectId?.toString() === project._id.toString());
      const completed = projectTasks.filter(t => t.status === 'completed').length;
      const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
      return { id: project._id, name: project.name, progress, status: project.status, totalTasks: projectTasks.length, completedTasks: completed };
    }));
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
