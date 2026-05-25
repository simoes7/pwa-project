const db = require('../db');
const { getIO } = require('./socket');

/**
 * Sends a notification to a user.
 * 1. Saves to Database.
 * 2. Emits via Socket.io to the user's room.
 */
const sendNotification = (userId, title, message, type = 'info') => {
  const query = 'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)';
  
  db.query(query, [userId, title, message, type], (err, result) => {
    if (err) {
      console.error('Failed to save notification to DB:', err);
      return;
    }

    const notificationId = result.insertId;
    const notificationData = {
      id: notificationId,
      user_id: userId,
      title,
      message,
      type,
      is_read: 0,
      created_at: new Date()
    };

    try {
      const io = getIO();
      io.to(`user_${userId}`).emit('new_notification', notificationData);
      console.log(`Notification sent to user_${userId}: ${title}`);
    } catch (ioErr) {
      console.error('Failed to emit notification via Socket.io:', ioErr.message);
    }
  });
};

module.exports = { sendNotification };
