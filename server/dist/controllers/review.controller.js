"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviews = exports.createReview = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../utils/prisma"));
exports.createReview = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { bookingId, rating, comment } = req.body;
    const userId = req.user.id;
    const booking = await prisma_1.default.booking.findUnique({ where: { id: bookingId } });
    if (!booking)
        return next(new AppError_1.AppError('Booking not found', 404));
    if (booking.userId !== userId)
        return next(new AppError_1.AppError('Unauthorized', 403));
    if (booking.status !== 'COMPLETED')
        return next(new AppError_1.AppError('Can only review completed bookings', 400));
    const existingReview = await prisma_1.default.review.findUnique({ where: { bookingId } });
    if (existingReview)
        return next(new AppError_1.AppError('Review already exists for this booking', 400));
    const review = await prisma_1.default.review.create({
        data: {
            userId,
            bookingId,
            rating: Number(rating),
            comment
        }
    });
    res.status(201).json({ success: true, data: { review } });
});
exports.getReviews = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const reviews = await prisma_1.default.review.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, results: reviews.length, data: { reviews } });
});
