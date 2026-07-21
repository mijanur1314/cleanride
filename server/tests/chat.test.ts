import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import prisma from '../src/utils/prisma';

describe('Chat Boundaries', () => {
  const secret = process.env.JWT_SECRET || 'test-secret';
  
  describe('GET /api/chat/:bookingId', () => {
    it('should reject unauthenticated chat access', async () => {
      const res = await request(app)
        .get('/api/chat/123');
      
      expect(res.status).toBe(401);
    });
    
    it('should reject access if user is not part of the booking', async () => {
      // User is authenticated, but is not the user or partner for this booking
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'dummy-user', role: 'USER' });
      (prisma.booking.findUnique as jest.Mock).mockResolvedValueOnce({
        id: '123',
        userId: 'other-user',
        partnerId: 'other-partner'
      });

      const token = jwt.sign({ id: 'dummy-user', role: 'USER' }, secret);
      const res = await request(app)
        .get('/api/chat/123')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
    });
  });
});
