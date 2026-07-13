"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../src/index"));
describe('Authentication & Authorization Boundaries', () => {
    describe('GET /api/users', () => {
        it('should reject unauthenticated requests', async () => {
            const res = await (0, supertest_1.default)(index_1.default).get('/api/users');
            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/logged in/i);
        });
        it('should reject non-admin users with 403 Forbidden', async () => {
            // Create a dummy token for a non-admin (we would normally mock this or sign a real token)
            const jwt = require('jsonwebtoken');
            const token = jwt.sign({ id: 'dummy-id', role: 'USER' }, process.env.JWT_SECRET || 'test-secret');
            const res = await (0, supertest_1.default)(index_1.default)
                .get('/api/users')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/permission/i);
        });
    });
});
