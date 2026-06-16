"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = getIO;
exports.setupSocketHandlers = setupSocketHandlers;
const socket_io_1 = require("socket.io");
const authService_1 = require("../services/authService");
let io;
function getIO() {
    if (!io) {
        throw new Error('Socket.io has not been initialized');
    }
    return io;
}
function setupSocketHandlers(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
            credentials: true,
        },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        const payload = (0, authService_1.verifyToken)(token);
        if (!payload) {
            return next(new Error('Invalid or expired token'));
        }
        socket.data.user = payload;
        next();
    });
    io.on('connection', (socket) => {
        const user = socket.data.user;
        socket.join(`user:${user.sub}`);
        if (user.role === 'BARISTA' || user.role === 'ADMIN') {
            socket.join('kitchen');
        }
        if (user.role === 'ADMIN') {
            socket.join('admin');
        }
        socket.on('subscribe:order', (orderId) => {
            socket.join(`order:${orderId}`);
        });
        socket.on('disconnect', () => {
            // Cleanup handled automatically by Socket.io
        });
    });
    return io;
}
//# sourceMappingURL=index.js.map