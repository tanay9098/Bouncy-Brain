import { io, Socket } from 'socket.io-client';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(BASE_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
