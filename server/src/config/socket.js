const { Server } = require('socket.io');
const env = require('./env');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('subscribe:execution', (executionId) => {
      socket.join(`execution:${executionId}`);
    });

    socket.on('unsubscribe:execution', (executionId) => {
      socket.leave(`execution:${executionId}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initSocket(httpServer) first.');
  }
  return io;
}

module.exports = { initSocket, getIO };
