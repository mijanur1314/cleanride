process.env.JWT_SECRET = 'test-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.PORT = '5000';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy';
process.env.RAZORPAY_KEY_ID = 'test_key_id';
process.env.RAZORPAY_KEY_SECRET = 'test_key_secret';

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
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn()
    },
    service: {
      findUnique: jest.fn()
    },
    payment: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn()
    },
    $transaction: jest.fn()
  }
}));

jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => {
    return {
      orders: {
        create: jest.fn().mockResolvedValue({ id: 'order_test123' })
      }
    };
  });
});

jest.mock('../src/utils/mailer', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));
