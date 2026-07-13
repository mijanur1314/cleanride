import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';

describe('Chat Boundaries', () => {
  const secret = process.env.JWT_SECRET || 'test-secret';
  
  describe('GET /api/chat/:bookingId', () => {
    it('should reject unauthenticated chat access', async () => {
      const res = await request(app)
        .get('/api/chat/123');
      
      expect(res.status).toBe(401);
    });
    
    // Note: To test the 403 Forbidden logic inside the controller, 
    // we would need to mock prisma.booking.findUnique, which is omitted
    // here to keep the test boundary strictly on the routing layer.
  });
});
