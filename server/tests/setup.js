"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        }
    }
}));
