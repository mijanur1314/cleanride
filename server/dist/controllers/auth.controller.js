"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_1 = require("zod");
const signToken = (id, role) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
    }
    return jsonwebtoken_1.default.sign({ id, role }, secret, {
        expiresIn: (process.env.JWT_EXPIRES_IN || '90d'),
    });
};
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user.id, user.role);
    // Remove password from output
    user.password = undefined;
    res.status(statusCode).json({
        success: true,
        token,
        data: {
            user,
        },
    });
};
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['USER', 'PARTNER']).optional(),
    referredBy: zod_1.z.string().optional(),
});
exports.signup = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return next(new AppError_1.AppError('Invalid input data', 400));
    }
    const { name, email, password, phone, role, referredBy } = parsed.data;
    // Check if user exists
    const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
    if (existingUser) {
        return next(new AppError_1.AppError('Email already in use', 400));
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    // Generate random referral code
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    let initialPoints = 0;
    if (referredBy) {
        const referrer = await prisma_1.default.user.findUnique({ where: { referralCode: referredBy } });
        if (referrer) {
            initialPoints = 50; // New user gets 50 points
            // Give referrer 50 points
            await prisma_1.default.user.update({
                where: { id: referrer.id },
                data: { loyaltyPoints: { increment: 50 } }
            });
        }
    }
    const newUser = await prisma_1.default.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            phone,
            role: role || 'USER',
            referralCode,
            loyaltyPoints: initialPoints
        },
    });
    createSendToken(newUser, 201, res);
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
exports.login = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return next(new AppError_1.AppError('Please provide email and password', 400));
    }
    const { email, password } = parsed.data;
    // Check if user exists && password is correct
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
        return next(new AppError_1.AppError('Incorrect email or password', 401));
    }
    createSendToken(user, 200, res);
});
exports.getMe = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: req.user.id },
    });
    if (user) {
        user.password = undefined;
    }
    res.status(200).json({
        success: true,
        data: {
            user,
        },
    });
});
