import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import prisma from '../src/utils/prisma';

describe('Payment Boundaries', () => {
  const secret = process.env.JWT_SECRET || 'test-secret';
  
  describe('POST /api/payments/create-order', () => {
    it('should reject unauthenticated order creation', async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .send({ bookingId: '123' });
      
      expect(res.status).toBe(401);
    });

    it('should successfully create an order for valid booking', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'dummy-user', role: 'USER' });
      (prisma.booking.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'booking-123',
        userId: 'dummy-user',
        totalAmount: 50,
        payment: null
      });
      (prisma.payment.create as jest.Mock).mockResolvedValueOnce({ id: 'pay-123' });
      
      const token = jwt.sign({ id: 'dummy-user', role: 'USER' }, secret);
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token}`)
        .send({ bookingId: 'booking-123' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.id).toBe('order_test123');
    });
  });

  describe('POST /api/payments/verify', () => {
    it('should reject unauthenticated verification', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .send({ razorpay_order_id: '123' });
      
      expect(res.status).toBe(401);
    });

    it('should reject invalid razorpay signature', async () => {
      const token = jwt.sign({ id: 'dummy-user', role: 'USER' }, secret);
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_123',
          razorpay_signature: 'invalid_signature'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should verify payment successfully with valid signature', async () => {
      const crypto = require('crypto');
      const validSignature = crypto
        .createHmac('sha256', 'test_key_secret')
        .update(`order_123|pay_123`)
        .digest('hex');

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'dummy-user', role: 'USER' });
      (prisma.payment.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'pay-db-123',
        bookingId: 'booking-123',
        amount: 50
      });
      (prisma.$transaction as jest.Mock).mockResolvedValueOnce({
        booking: { id: 'booking-123', user: { email: 'test@example.com', name: 'Test User' }, service: { name: 'Basic Wash' } }
      });

      const token = jwt.sign({ id: 'dummy-user', role: 'USER' }, secret);
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_123',
          razorpay_signature: validSignature
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
