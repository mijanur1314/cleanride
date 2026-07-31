import { env } from './utils/env';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt, { JwtPayload } from 'jsonwebtoken';
import prisma from './utils/prisma';
import { Socket } from 'socket.io';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookie = require('cookie');

interface AuthenticatedSocket extends Socket {
  user: { id: string; role: string; [key: string]: unknown };
}

let io: SocketIOServer;

export const initSocket = (server: HttpServer, frontendUrl: string) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: frontendUrl,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true
    }
  });

  io.use((socket, next) => {
    let token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token && socket.handshake.headers.cookie) {
      const parsedCookies = cookie.parse(socket.handshake.headers.cookie);
      token = parsedCookies.token;
    }

    if (!token) return next(new Error('Authentication error: No token provided'));
    const secret = env.JWT_SECRET;
    if (!secret) return next(new Error('Server configuration error'));
    try {
      const decoded = jwt.verify(token, secret) as JwtPayload;
      (socket as AuthenticatedSocket).user = decoded as { id: string; role: string };
      next();
    } catch (_err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket as AuthenticatedSocket;
    console.log(`Socket connected: User ${user.id}`);

    socket.join(user.id);

    socket.on('join-booking', async (bookingId: string) => {
      try {
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) return socket.emit('error', { message: 'Booking not found' });
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
        const booking = await prisma.booking.findUnique({ where: { id: data.bookingId } });
        if (!booking) return socket.emit('error', { message: 'Booking not found' });
        if (user.role !== 'ADMIN' && booking.userId !== user.id && booking.partnerId !== user.id) {
          return socket.emit('error', { message: 'Unauthorized to send message' });
        }
        const message = await prisma.message.create({
          data: {
            bookingId: data.bookingId,
            senderId: user.id,
            content: data.content
          },
          include: { sender: { select: { id: true, name: true, role: true } } }
        });
        io.to(`booking_${data.bookingId}`).emit('receive-message', message);
      } catch(err) {
        console.error('Error sending message:', err);
      }
    });

    socket.on('update-location', async (data: { bookingId: string, lat: number, lng: number }) => {
      try {
        const booking = await prisma.booking.findUnique({ where: { id: data.bookingId } });
        if (!booking) return socket.emit('error', { message: 'Booking not found' });
        // Only the assigned partner can update their location
        if (booking.partnerId !== user.id) {
          return socket.emit('error', { message: 'Unauthorized to update location for this booking' });
        }
        
        // Broadcast the location to the booking room
        io.to(`booking_${data.bookingId}`).emit('location-updated', {
          bookingId: data.bookingId,
          lat: data.lat,
          lng: data.lng,
          timestamp: new Date().toISOString()
        });
      } catch(err) {
        console.error('Error updating location:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: User ${user.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn("Socket.io not initialized!");
  }
  return io;
};
