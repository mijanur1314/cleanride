import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';

describe('Payment Boundaries', () => {
  const secret = process.env.JWT_SECRET || 'test-secret';
  
  describe('POST /api/payments/create-order', () => {
    it('should reject unauthenticated order creation', async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .send({ bookingId: '123' });
      
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/payments/verify', () => {
    it('should reject unauthenticated verification', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .send({ razorpay_order_id: '123' });
      
      expect(res.status).toBe(401);
    });
  });
});
