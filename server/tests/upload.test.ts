import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import prisma from '../src/utils/prisma';

describe('Upload Boundaries', () => {
  const secret = process.env.JWT_SECRET || 'test-secret';

  describe('POST /api/upload', () => {
    it('should reject upload without file', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'dummy-user', role: 'USER' });

      const token = jwt.sign({ id: 'dummy-user', role: 'USER' }, secret);
      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(400); // No file provided
    });
  });
});
