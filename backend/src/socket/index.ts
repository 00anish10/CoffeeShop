import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken, TokenPayload } from '../services/authService';

let io: Server;

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
}

export function setupSocketHandlers(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new Error('Invalid or expired token'));
    }

    (socket as any).data.user = payload;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).data.user as TokenPayload;

    socket.join(`user:${user.sub}`);

    if (user.role === 'BARISTA' || user.role === 'ADMIN') {
      socket.join('kitchen');
    }
    if (user.role === 'ADMIN') {
      socket.join('admin');
    }

    socket.on('subscribe:order', (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on('disconnect', () => {
      // Cleanup handled automatically by Socket.io
    });
  });

  return io;
}
