import request from 'supertest';
import app from '../src/app';

describe('Authentication & Authorization Boundaries', () => {
  
  describe('GET /api/users', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/logged in/i);
    });

    it('should reject non-admin users with 403 Forbidden', async () => {
      // Create a dummy token for a non-admin (we would normally mock this or sign a real token)
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ id: 'dummy-id', role: 'USER' }, process.env.JWT_SECRET || 'test-secret');
      
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/permission/i);
    });
  });
  
});
