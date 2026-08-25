const Notification = require('../models/Notification');

function serialize(notification) {
  return {
    id: notification._id,
    workflowId: notification.workflowId,
    executionId: notification.executionId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

async function list(owner, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [items, total, unreadCount] = await Promise.all([
    Notification.find({ owner }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ owner }),
    Notification.countDocuments({ owner, isRead: false }),
  ]);

  return {
    items: items.map(serialize),
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
}

async function markAllRead(owner) {
  await Notification.updateMany({ owner, isRead: false }, { $set: { isRead: true } });
}

module.exports = { list, serialize, markAllRead };
