import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import prisma from '../src/utils/prisma';

describe('Booking Boundaries', () => {
  const secret = process.env.JWT_SECRET || 'test-secret';
  
  describe('POST /api/bookings', () => {
    it('should reject unauthenticated booking creation', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({ serviceId: '123', vehicleType: 'SEDAN', address: '123 St' });
      
      expect(res.status).toBe(401);
    });

    it('should require valid request body for authenticated user', async () => {
      const token = jwt.sign({ id: 'dummy-user-id', role: 'USER' }, secret);
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({}); // Missing required fields
      
      expect(res.status).toBe(400); // Because of validation (zod) or internal error catching
    });

    it('should successfully create a booking', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'dummy-user', role: 'USER', name: 'User' });
      (prisma.service.findUnique as jest.Mock).mockResolvedValueOnce({ id: '123e4567-e89b-12d3-a456-426614174000', price: 100 });
      (prisma.$transaction as jest.Mock).mockResolvedValueOnce({
        id: 'booking-123',
        serviceId: '123e4567-e89b-12d3-a456-426614174000',
        totalAmount: 100,
        status: 'PENDING',
        user: { email: 'test@example.com', name: 'User' },
        service: { name: 'Wash' },
        bookingDate: new Date().toISOString()
      });

      const token = jwt.sign({ id: 'dummy-user', role: 'USER' }, secret);
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          serviceId: '123e4567-e89b-12d3-a456-426614174000',
          vehicleType: 'SEDAN',
          vehicleImage: 'https://example.com/car.jpg',
          address: '123 Test St',
          latitude: 10,
          longitude: 20,
          bookingDate: new Date().toISOString()
        });
      
      if (res.status !== 201) console.log(res.body);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/bookings/:id/status', () => {
    it('should reject non-admin/non-partner from updating status', async () => {
      const token = jwt.sign({ id: 'dummy-user', role: 'USER' }, secret);
      const res = await request(app)
        .patch('/api/bookings/123/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'WASH_IN_PROGRESS' });
      
      expect(res.status).toBe(403);
    });

    it('should return 404 for partner updating a non-existent booking', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'dummy-partner', role: 'PARTNER', name: 'Partner' });
      (prisma.booking.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
      const token = jwt.sign({ id: 'dummy-partner', role: 'PARTNER' }, secret);
      const res = await request(app)
        .patch('/api/bookings/99999999-9999-9999-9999-999999999999/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'WASH_IN_PROGRESS' });
      
      expect(res.status).toBe(404);
    });

    it('should allow assigned partner to update status', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'assigned-partner', role: 'PARTNER', name: 'Partner' });
      (prisma.booking.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'booking-123',
        partnerId: 'assigned-partner',
        status: 'EN_ROUTE'
      });
      (prisma.booking.update as jest.Mock).mockResolvedValueOnce({
        id: 'booking-123',
        status: 'WASH_IN_PROGRESS'
      });

      const token = jwt.sign({ id: 'assigned-partner', role: 'PARTNER' }, secret);
      const res = await request(app)
        .patch('/api/bookings/booking-123/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'WASH_IN_PROGRESS' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
