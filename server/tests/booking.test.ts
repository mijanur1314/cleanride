import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';

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
  });

  describe('PATCH /api/bookings/:id/status', () => {
    it('should reject non-admin/non-partner from updating status', async () => {
      const token = jwt.sign({ id: 'dummy-user', role: 'USER' }, secret);
      const res = await request(app)
        .patch('/api/bookings/123/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'IN_PROGRESS' });
      
      expect(res.status).toBe(403);
    });
  });
});
