import { io } from 'socket.io-client';

let socket = null;

function getToken() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('agentflow-auth') || 'null')?.state?.token || null;
  } catch (err) {
    return null;
  }
}

export function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      autoConnect: false,
      transports: ['websocket'],
      auth: { token: getToken() },
    });
  }
  return socket;
}

export function connectSocket() {
  const instance = getSocket();
  instance.auth = { token: getToken() };
  if (!instance.connected) {
    instance.connect();
  }
  return instance;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}
