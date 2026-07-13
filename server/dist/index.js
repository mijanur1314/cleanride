"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const path_1 = __importDefault(require("path"));
// Middlewares
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use((0, cors_1.default)({
    origin: frontendUrl,
    credentials: true
}));
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false // allow serving images
}));
app.use((0, morgan_1.default)('dev'));
// Static files (for images)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../../public/uploads')));
// Basic Health Check Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'CleanRide Server is running' });
});
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const service_routes_1 = __importDefault(require("./routes/service.routes"));
const store_routes_1 = __importDefault(require("./routes/store.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const coupon_routes_1 = __importDefault(require("./routes/coupon.routes"));
const subscription_routes_1 = __importDefault(require("./routes/subscription.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const vehicle_routes_1 = __importDefault(require("./routes/vehicle.routes"));
const addon_routes_1 = __importDefault(require("./routes/addon.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/services', service_routes_1.default);
app.use('/api/stores', store_routes_1.default);
app.use('/api/bookings', booking_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/coupons', coupon_routes_1.default);
app.use('/api/subscriptions', subscription_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/reviews', review_routes_1.default);
app.use('/api/vehicles', vehicle_routes_1.default);
app.use('/api/addons', addon_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const error_middleware_1 = require("./middlewares/error.middleware");
const AppError_1 = require("./utils/AppError");
const prisma_1 = __importDefault(require("./utils/prisma"));
// 404 Handler
app.use((req, res, next) => {
    next(new AppError_1.AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// Global Error Handler
app.use(error_middleware_1.errorHandler);
const server = http_1.default.createServer(app);
// Initialize Socket.IO
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: frontendUrl,
        methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
});
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Socket.IO Authentication Middleware
exports.io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return next(new Error('Server configuration error'));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Attach user payload to socket
        socket.user = decoded;
        next();
    }
    catch (err) {
        return next(new Error('Authentication error: Invalid token'));
    }
});
exports.io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`Socket connected: User ${user.id}`);
    // Auto-join personal room upon successful connection
    socket.join(user.id);
    socket.on('join-booking', async (bookingId) => {
        try {
            // Authorization check: Is this user associated with this booking?
            const booking = await prisma_1.default.booking.findUnique({
                where: { id: bookingId }
            });
            if (!booking) {
                return socket.emit('error', { message: 'Booking not found' });
            }
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
            // Authorization check
            const booking = await prisma_1.default.booking.findUnique({
                where: { id: data.bookingId }
            });
            if (!booking)
                return socket.emit('error', { message: 'Booking not found' });
            if (user.role !== 'ADMIN' && booking.userId !== user.id && booking.partnerId !== user.id) {
                return socket.emit('error', { message: 'Unauthorized to send message in this booking' });
            }
            const message = await prisma_1.default.message.create({
                data: {
                    bookingId: data.bookingId,
                    senderId: user.id, // Force senderId from authenticated token, NOT client payload
                    content: data.content
                },
                include: { sender: { select: { id: true, name: true, role: true } } }
            });
            // Broadcast to all users in the booking room
            exports.io.to(`booking_${data.bookingId}`).emit('receive-message', message);
        }
        catch (err) {
            console.error('Error sending message:', err);
        }
    });
    socket.on('disconnect', () => {
        console.log(`Socket disconnected: User ${user.id}`);
    });
});
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
