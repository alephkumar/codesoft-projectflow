const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'project_created', 'project_updated', 'project_deleted', 'project_archived',
      'task_created', 'task_updated', 'task_deleted', 'task_assigned',
      'status_changed', 'comment_added', 'attachment_uploaded', 'member_added', 'member_removed'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

activityLogSchema.index({ projectId: 1, createdAt: -1 });
activityLogSchema.index({ taskId: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
