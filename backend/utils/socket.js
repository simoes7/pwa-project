let io;

module.exports = {
  init: (httpServer) => {
    const { Server } = require('socket.io');
    io = new Server(httpServer, {
      cors: {
        origin: '*', // Adjust this for production security
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);

      socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`Socket ${socket.id} joined room user_${userId}`);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
