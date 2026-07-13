process.env.JWT_SECRET = 'test-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.PORT = '5000';
process.env.NODE_ENV = 'test';

jest.mock('../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'dummy-id',
        role: 'USER',
        name: 'Test User'
      }),
      findMany: jest.fn()
    },
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}));
