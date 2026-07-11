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
app.use(cors());
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
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Clients will emit 'join' with their user ID when they connect
  socket.on('join', (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined their personal room`);
  });

  socket.on('join-booking', (bookingId: string) => {
    socket.join(`booking_${bookingId}`);
    console.log(`User joined booking room: ${bookingId}`);
  });

  socket.on('send-message', async (data: { bookingId: string, senderId: string, content: string }) => {
    try {
      const message = await prisma.message.create({
        data: {
          bookingId: data.bookingId,
          senderId: data.senderId,
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
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
