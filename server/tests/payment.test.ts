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
  });
});
