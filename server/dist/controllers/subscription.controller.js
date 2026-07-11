"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMySubscription = exports.subscribe = exports.getPlans = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../utils/prisma"));
exports.getPlans = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const plans = await prisma_1.default.subscriptionPlan.findMany({
        where: { isActive: true },
    });
    res.status(200).json({ success: true, data: { plans } });
});
exports.subscribe = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { planId } = req.body;
    const userId = req.user.id;
    const plan = await prisma_1.default.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan)
        return next(new AppError_1.AppError('Plan not found', 404));
    // Basic implementation: 
    // In a real scenario, this would create a razorpay order and only activate after payment verification.
    // For simplicity, we directly activate it here.
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);
    const subscription = await prisma_1.default.userSubscription.create({
        data: {
            userId,
            planId,
            endDate,
        }
    });
    res.status(201).json({ success: true, data: { subscription } });
});
exports.getMySubscription = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const subscription = await prisma_1.default.userSubscription.findFirst({
        where: {
            userId: req.user.id,
            isActive: true,
            endDate: { gte: new Date() }
        },
        include: { plan: true },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: { subscription } });
});
