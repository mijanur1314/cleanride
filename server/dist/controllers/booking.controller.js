"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateImages = exports.assignPartner = exports.updateBookingStatus = exports.getAllBookings = exports.getPartnerBookings = exports.getMyBookings = exports.createBooking = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_1 = require("zod");
const bookingSchema = zod_1.z.object({
    serviceId: zod_1.z.string().uuid(),
    storeId: zod_1.z.string().uuid().optional(),
    vehicleType: zod_1.z.string(),
    vehicleNumber: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    bookingDate: zod_1.z.string().datetime(),
    couponId: zod_1.z.string().uuid().optional(),
});
exports.createBooking = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success)
        return next(new AppError_1.AppError('Invalid input data', 400));
    const { serviceId, storeId, vehicleType, vehicleNumber, address, bookingDate, couponId } = parsed.data;
    const service = await prisma_1.default.service.findUnique({ where: { id: serviceId } });
    if (!service)
        return next(new AppError_1.AppError('Service not found', 404));
    let finalAmount = service.price;
    if (couponId) {
        const coupon = await prisma_1.default.coupon.findUnique({ where: { id: couponId } });
        if (coupon && coupon.isActive && new Date(coupon.validUntil) >= new Date()) {
            const discount = (service.price * coupon.discountPercentage) / 100;
            finalAmount -= coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
        }
    }
    const booking = await prisma_1.default.booking.create({
        data: {
            userId: req.user.id,
            serviceId,
            storeId,
            vehicleType,
            vehicleNumber,
            address,
            bookingDate: new Date(bookingDate),
            totalAmount: finalAmount,
            couponId,
        },
    });
    res.status(201).json({ success: true, data: { booking } });
});
exports.getMyBookings = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const bookings = await prisma_1.default.booking.findMany({
        where: { userId: req.user.id },
        include: { service: true, partner: true, store: true, payment: true, review: true, coupon: true },
        orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, results: bookings.length, data: { bookings } });
});
exports.getPartnerBookings = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const bookings = await prisma_1.default.booking.findMany({
        where: { partnerId: req.user.id },
        include: { service: true, user: true, store: true },
        orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, results: bookings.length, data: { bookings } });
});
exports.getAllBookings = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const bookings = await prisma_1.default.booking.findMany({
        include: { user: true, partner: true, service: true, store: true, payment: true },
        orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, results: bookings.length, data: { bookings } });
});
exports.updateBookingStatus = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { status } = req.body;
    if (!['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
        return next(new AppError_1.AppError('Invalid status', 400));
    }
    const booking = await prisma_1.default.booking.update({
        where: { id: req.params.id },
        data: { status },
    });
    res.status(200).json({ success: true, data: { booking } });
});
exports.assignPartner = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { partnerId } = req.body;
    const partner = await prisma_1.default.user.findUnique({ where: { id: partnerId } });
    if (!partner || partner.role !== 'PARTNER') {
        return next(new AppError_1.AppError('Invalid partner ID', 400));
    }
    const booking = await prisma_1.default.booking.update({
        where: { id: req.params.id },
        data: { partnerId, status: 'CONFIRMED' },
    });
    res.status(200).json({ success: true, data: { booking } });
});
exports.updateImages = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { beforeImageUrl, afterImageUrl } = req.body;
    const booking = await prisma_1.default.booking.update({
        where: { id: req.params.id },
        data: {
            ...(beforeImageUrl && { beforeImageUrl }),
            ...(afterImageUrl && { afterImageUrl })
        }
    });
    res.status(200).json({ success: true, data: { booking } });
});
