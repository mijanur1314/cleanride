"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMySubscription = exports.verifySubscription = exports.createSubscriptionOrder = exports.getPlans = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../utils/prisma"));
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});
exports.getPlans = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const plans = await prisma_1.default.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' }
    });
    res.status(200).json({ success: true, data: { plans } });
});
exports.createSubscriptionOrder = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { planId } = req.body;
    const userId = req.user.id;
    const plan = await prisma_1.default.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan)
        return next(new AppError_1.AppError('Plan not found', 404));
    const amountInPaise = Math.round(plan.price * 100);
    const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `sub_${userId.substring(0, 8)}_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.status(200).json({
        success: true,
        data: { order, plan }
    });
});
exports.verifySubscription = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
    const userId = req.user.id;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
    const generatedSignature = crypto_1.default
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
    if (generatedSignature !== razorpay_signature) {
        return next(new AppError_1.AppError('Payment verification failed', 400));
    }
    const plan = await prisma_1.default.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan)
        return next(new AppError_1.AppError('Plan not found', 404));
    // Deactivate existing active subscriptions for this user
    await prisma_1.default.userSubscription.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false }
    });
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);
    const subscription = await prisma_1.default.userSubscription.create({
        data: {
            userId,
            planId,
            endDate,
            isActive: true
        }
    });
    res.status(200).json({
        success: true,
        message: 'Subscription verified and activated successfully',
        data: { subscription }
    });
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
