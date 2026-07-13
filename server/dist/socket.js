"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("./utils/prisma"));
let io;
const initSocket = (server, frontendUrl) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: frontendUrl,
            methods: ['GET', 'POST', 'PATCH', 'DELETE']
        }
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        if (!token)
            return next(new Error('Authentication error: No token provided'));
        const secret = process.env.JWT_SECRET;
        if (!secret)
            return next(new Error('Server configuration error'));
        try {
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            socket.user = decoded;
            next();
        }
        catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.user;
        console.log(`Socket connected: User ${user.id}`);
        socket.join(user.id);
        socket.on('join-booking', async (bookingId) => {
            try {
                const booking = await prisma_1.default.booking.findUnique({ where: { id: bookingId } });
                if (!booking)
                    return socket.emit('error', { message: 'Booking not found' });
                if (user.role !== 'ADMIN' && booking.userId !== user.id && booking.partnerId !== user.id) {
                    return socket.emit('error', { message: 'Unauthorized to join this booking room' });
                }
                socket.join(`booking_${bookingId}`);
                console.log(`User ${user.id} joined booking room: ${bookingId}`);
            }
            catch (err) {
                console.error('Socket join-booking error:', err);
            }
        });
        socket.on('send-message', async (data) => {
            try {
                const booking = await prisma_1.default.booking.findUnique({ where: { id: data.bookingId } });
                if (!booking)
                    return socket.emit('error', { message: 'Booking not found' });
                if (user.role !== 'ADMIN' && booking.userId !== user.id && booking.partnerId !== user.id) {
                    return socket.emit('error', { message: 'Unauthorized to send message' });
                }
                const message = await prisma_1.default.message.create({
                    data: {
                        bookingId: data.bookingId,
                        senderId: user.id,
                        content: data.content
                    },
                    include: { sender: { select: { id: true, name: true, role: true } } }
                });
                io.to(`booking_${data.bookingId}`).emit('receive-message', message);
            }
            catch (err) {
                console.error('Error sending message:', err);
            }
        });
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: User ${user.id}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        console.warn("Socket.io not initialized!");
    }
    return io;
};
exports.getIO = getIO;
