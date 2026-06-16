const Notification = require('../models/Notification');

const createNotification = async ({ userId, type, title, message, relatedProject, relatedTask }) => {
  try {
    await Notification.create({ userId, type, title, message, relatedProject, relatedTask });
  } catch (error) {
    console.error('Notification creation error:', error);
  }
};

module.exports = { createNotification };
