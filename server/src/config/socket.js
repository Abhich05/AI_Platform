const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./env');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        socket.data.userId = payload.sub;
      } catch (err) {
        // Invalid token: proceed unauthenticated - user-scoped rooms simply won't be joined.
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    socket.on('subscribe:execution', (executionId) => {
      socket.join(`execution:${executionId}`);
    });

    socket.on('unsubscribe:execution', (executionId) => {
      socket.leave(`execution:${executionId}`);
    });

    socket.on('subscribe:notifications', () => {
      if (socket.data.userId) {
        socket.join(`user:${socket.data.userId}`);
      }
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

function emitToUser(userId, event, payload) {
  getIO()
    .to(`user:${userId}`)
    .emit(event, payload);
}

module.exports = { initSocket, getIO, emitToUser };
