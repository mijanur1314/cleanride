import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './utils/env';
import prisma from './utils/prisma';
import redisClient from './utils/redis';
import crypto from 'crypto';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

const app = express();

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
}

const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';

// API Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, // standard API limit
  standardHeaders: true,
  legacyHeaders: false,
});

// Request ID Middleware
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Middleware for request logging
app.use((req, res, next) => {
  logger.info(`Incoming Request`, { method: req.method, url: req.url, ip: req.ip, requestId: req.id });
  next();
});

app.use(cors({
  origin: frontendUrl,
  credentials: true
}));
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'CleanRide Server is running' });
});

app.get('/ready', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    let redisStatus = 'not_configured';
    
    if (redisClient) {
      if (redisClient.status === 'ready') {
        redisStatus = 'connected';
      } else {
        throw new Error('Redis is configured but not ready');
      }
    }

    res.status(200).json({ 
      status: 'ok', 
      database: 'connected',
      redis: redisStatus
    });
  } catch (error) {
    logger.error('Readiness probe failed', error);
    res.status(503).json({ status: 'error', message: 'Service Unavailable' });
  }
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
import { errorHandler } from './middlewares/error.middleware';
import { AppError } from './utils/AppError';

// API Routes
app.use('/api', apiLimiter); // Apply standard limit to all API routes
app.use('/api/auth', authLimiter, authRoutes); // Apply strict limit to Auth routes
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

// 404 Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
if (env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}
app.use(errorHandler);

export default app;
