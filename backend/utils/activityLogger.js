const ActivityLog = require('../models/ActivityLog');

const logActivity = async (data) => {
  try {
    await ActivityLog.create(data);
  } catch (error) {
    console.error('Activity log error:', error);
  }
};

module.exports = logActivity;
