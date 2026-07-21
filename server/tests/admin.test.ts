import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import prisma from '../src/utils/prisma';

describe('Admin Boundaries', () => {
  const secret = process.env.JWT_SECRET || 'test-secret';
  
  describe('GET /api/admin/bookings', () => {
    it('should allow admin and return paginated data', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' });
      (prisma.booking.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 'b1', status: 'PENDING' },
        { id: 'b2', status: 'CONFIRMED' }
      ]);
      (prisma.booking.count as jest.Mock).mockResolvedValueOnce(2);

      const token = jwt.sign({ id: 'admin-1', role: 'ADMIN' }, secret);
      const res = await request(app)
        .get('/api/admin/bookings?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookings.length).toBe(2);
    });

    it('should reject non-admin users', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'user-1', role: 'USER' });

      const token = jwt.sign({ id: 'user-1', role: 'USER' }, secret);
      const res = await request(app)
        .get('/api/admin/bookings')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
    });
  });
});
