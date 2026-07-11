"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.createOrder = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../utils/prisma"));
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});
exports.createOrder = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { bookingId } = req.body;
    const booking = await prisma_1.default.booking.findUnique({
        where: { id: bookingId },
        include: { payment: true },
    });
    if (!booking)
        return next(new AppError_1.AppError('Booking not found', 404));
    if (booking.userId !== req.user.id)
        return next(new AppError_1.AppError('Unauthorized access to booking', 403));
    if (booking.payment?.status === 'COMPLETED')
        return next(new AppError_1.AppError('Payment already completed', 400));
    const amountInPaise = Math.round(booking.totalAmount * 100);
    const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${bookingId.substring(0, 8)}`,
    };
    const order = await razorpay.orders.create(options);
    // Create or update payment record
    if (booking.payment) {
        await prisma_1.default.payment.update({
            where: { id: booking.payment.id },
            data: { razorpayId: order.id, status: 'PENDING' },
        });
    }
    else {
        await prisma_1.default.payment.create({
            data: {
                bookingId: booking.id,
                amount: booking.totalAmount,
                razorpayId: order.id,
                status: 'PENDING',
            },
        });
    }
    res.status(200).json({
        success: true,
        data: { order },
    });
});
exports.verifyPayment = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
    const generatedSignature = crypto_1.default
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
    if (generatedSignature !== razorpay_signature) {
        return next(new AppError_1.AppError('Payment verification failed', 400));
    }
    // Update payment status
    const payment = await prisma_1.default.payment.findFirst({
        where: { razorpayId: razorpay_order_id },
    });
    if (!payment) {
        return next(new AppError_1.AppError('Payment record not found', 404));
    }
    await prisma_1.default.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' },
    });
    res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
    });
});
