import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import prisma from '../src/utils/prisma';

describe('Edge Cases & Hardening', () => {
  const secret = process.env.JWT_SECRET || 'test-secret';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('File Upload Security', () => {
    it('should reject file with image mimetype but malicious extension', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'dummy-user', role: 'USER' });
      const token = jwt.sign({ id: 'dummy-user', role: 'USER' }, secret);

      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('fake image data'), {
          filename: 'malicious.php',
          contentType: 'image/jpeg'
        });

      // Multer throws error during file filter, which Express catches as a 500 or 400.
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.message).toMatch(/Invalid file type/i);
    });
  });

  describe('Booking State Edge Cases', () => {
    it('should prevent cancelling a booking that is already EN_ROUTE', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'dummy-id',
        role: 'USER',
        loyaltyPoints: 100
      });

      const token = jwt.sign({ id: 'dummy-id', role: 'USER' }, secret);

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        id: 'booking-enroute',
        userId: 'dummy-id',
        status: 'EN_ROUTE',
        totalAmount: 100,
        paymentStatus: 'COMPLETED'
      });

      const res = await request(app)
        .patch('/api/bookings/booking-enroute/cancel')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot be cancelled/i);
    });
  });
});
