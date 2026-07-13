import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

import path from 'path';

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: frontendUrl,
  credentials: true
}));
app.use(helmet({
  crossOriginResourcePolicy: false // allow serving images
}));
app.use(morgan('dev'));

// Static files (for images)
app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));

// Basic Health Check Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'CleanRide Server is running' });
});

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import serviceRoutes from './routes/service.routes';
import storeRoutes from './routes/store.routes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes from './routes/payment.routes';
import couponRoutes from './routes/coupon.routes';
import subscriptionRoutes from './routes/subscription.routes';
import notificationRoutes from './routes/notification.routes';
import reviewRoutes from './routes/review.routes';
import vehicleRoutes from './routes/vehicle.routes';
import addonRoutes from './routes/addon.routes';
import chatRoutes from './routes/chat.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/addons', addonRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { errorHandler } from './middlewares/error.middleware';
import { AppError } from './utils/AppError';
import prisma from './utils/prisma';

// 404 Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

const server = http.createServer(app);

// Initialize Socket.IO
export const io = new SocketIOServer(server, {
  cors: {
    origin: frontendUrl,
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next(new Error('Server configuration error'));
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    // Attach user payload to socket
    (socket as any).user = decoded;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = (socket as any).user;
  console.log(`Socket connected: User ${user.id}`);

  // Auto-join personal room upon successful connection
  socket.join(user.id);

  socket.on('join-booking', async (bookingId: string) => {
    try {
      // Authorization check: Is this user associated with this booking?
      const booking = await prisma.booking.findUnique({
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
    } catch (err) {
      console.error('Socket join-booking error:', err);
    }
  });

  socket.on('send-message', async (data: { bookingId: string, content: string }) => {
    try {
      // Authorization check
      const booking = await prisma.booking.findUnique({
        where: { id: data.bookingId }
      });

      if (!booking) return socket.emit('error', { message: 'Booking not found' });
      
      if (user.role !== 'ADMIN' && booking.userId !== user.id && booking.partnerId !== user.id) {
        return socket.emit('error', { message: 'Unauthorized to send message in this booking' });
      }

      const message = await prisma.message.create({
        data: {
          bookingId: data.bookingId,
          senderId: user.id, // Force senderId from authenticated token, NOT client payload
          content: data.content
        },
        include: { sender: { select: { id: true, name: true, role: true } } }
      });

      // Broadcast to all users in the booking room
      io.to(`booking_${data.bookingId}`).emit('receive-message', message);
    } catch(err) {
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

export default app;
