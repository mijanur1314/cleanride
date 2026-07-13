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
const index_1 = require("../index");
const mailer_1 = require("../utils/mailer");
const bookingSchema = zod_1.z.object({
    serviceId: zod_1.z.string().uuid(),
    storeId: zod_1.z.string().uuid().optional(),
    vehicleType: zod_1.z.string(),
    vehicleNumber: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    bookingDate: zod_1.z.string().datetime(),
    couponId: zod_1.z.string().uuid().optional(),
    addonIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    redeemPoints: zod_1.z.number().int().min(0).optional(),
});
exports.createBooking = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success)
        return next(new AppError_1.AppError('Invalid input data', 400));
    const { serviceId, storeId, vehicleType, vehicleNumber, address, bookingDate, couponId, addonIds, redeemPoints } = parsed.data;
    const service = await prisma_1.default.service.findUnique({ where: { id: serviceId } });
    if (!service)
        return next(new AppError_1.AppError('Service not found', 404));
    let finalAmount = service.price;
    // Calculate Add-ons
    const addons = addonIds?.length ? await prisma_1.default.addon.findMany({
        where: { id: { in: addonIds } }
    }) : [];
    for (const addon of addons) {
        finalAmount += addon.price;
    }
    if (couponId) {
        const coupon = await prisma_1.default.coupon.findUnique({ where: { id: couponId } });
        if (coupon && coupon.isActive && new Date(coupon.validUntil) >= new Date()) {
            const discount = (service.price * coupon.discountPercentage) / 100;
            finalAmount -= coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
        }
    }
    if (redeemPoints) {
        // Validate user has enough points
        const user = await prisma_1.default.user.findUnique({ where: { id: req.user.id } });
        if (!user || user.loyaltyPoints < redeemPoints) {
            return next(new AppError_1.AppError('Insufficient loyalty points', 400));
        }
        // 10 points = $1 discount
        const pointsDiscount = redeemPoints * 0.1;
        finalAmount -= pointsDiscount;
        if (finalAmount < 0)
            finalAmount = 0;
        // Deduct points
        await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: { loyaltyPoints: { decrement: redeemPoints } }
        });
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
            bookingAddons: {
                create: addons.map((addon) => ({
                    addonId: addon.id,
                    price: addon.price
                }))
            }
        },
        include: { user: true, service: true, bookingAddons: { include: { addon: true } } }
    });
    // Send confirmation email
    (0, mailer_1.sendEmail)(booking.user.email, 'Booking Confirmed - CleanRide', `<h1>Your booking is confirmed!</h1>
     <p>Hi ${booking.user.name},</p>
     <p>You have successfully booked <strong>${booking.service.name}</strong> for ${new Date(booking.bookingDate).toLocaleString()}.</p>
     <p>Total Amount: $${booking.totalAmount}</p>
     <p>We will assign a partner to you shortly.</p>`);
    res.status(201).json({ success: true, data: { booking } });
});
exports.getMyBookings = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const bookings = await prisma_1.default.booking.findMany({
        where: { userId: req.user.id },
        include: { service: true, partner: true, store: true, payment: true, review: true, coupon: true, bookingAddons: { include: { addon: true } } },
        orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, results: bookings.length, data: { bookings } });
});
exports.getPartnerBookings = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const bookings = await prisma_1.default.booking.findMany({
        where: { partnerId: req.user.id },
        include: { service: true, user: true, store: true, bookingAddons: { include: { addon: true } } },
        orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, results: bookings.length, data: { bookings } });
});
exports.getAllBookings = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const bookings = await prisma_1.default.booking.findMany({
        include: { user: true, partner: true, service: true, store: true, payment: true, bookingAddons: { include: { addon: true } } },
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
        include: { user: true, partner: true }
    });
    // Notify the user via Socket.IO
    if (booking.userId) {
        index_1.io.to(booking.userId).emit('notification', {
            title: 'Booking Updated',
            message: `Your booking status is now ${status}`,
            type: 'info'
        });
        if (status === 'COMPLETED' && booking.user) {
            // Award loyalty points (1 point per $1 spent)
            const pointsEarned = Math.floor(booking.totalAmount);
            await prisma_1.default.user.update({
                where: { id: booking.userId },
                data: { loyaltyPoints: { increment: pointsEarned } }
            });
            (0, mailer_1.sendEmail)(booking.user.email, 'Wash Completed! - CleanRide', `<h1>Your service is complete!</h1>
         <p>Hi ${booking.user.name},</p>
         <p>Your vehicle wash service has been marked as <strong>COMPLETED</strong>.</p>
         <p>We hope you enjoy your clean ride. Please log in to your dashboard to leave a review!</p>
         <p>Thanks for choosing CleanRide.</p>`);
        }
    }
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
        include: { user: true, partner: true }
    });
    // Notify the assigned partner
    if (booking.partnerId) {
        index_1.io.to(booking.partnerId).emit('notification', {
            title: 'New Job Assigned',
            message: 'You have been assigned to a new wash job.',
            type: 'success'
        });
    }
    // Notify the user
    if (booking.userId) {
        index_1.io.to(booking.userId).emit('notification', {
            title: 'Partner Assigned',
            message: `${booking.partner?.name || 'A partner'} has been assigned to your booking.`,
            type: 'success'
        });
        if (booking.user) {
            (0, mailer_1.sendEmail)(booking.user.email, 'Partner Assigned - CleanRide', `<h1>Your Wash Partner is on the way!</h1>
         <p>Hi ${booking.user.name},</p>
         <p><strong>${booking.partner?.name || 'A partner'}</strong> has been assigned to your booking and will be arriving at your location.</p>
         <p>If you need to contact them, please reach out via the platform.</p>`);
        }
    }
    res.status(200).json({ success: true, data: { booking } });
});
exports.updateImages = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const files = req.files;
    let beforeImageUrl;
    let afterImageUrl;
    if (files?.beforeImage) {
        beforeImageUrl = `/uploads/${files.beforeImage[0].filename}`;
    }
    if (files?.afterImage) {
        afterImageUrl = `/uploads/${files.afterImage[0].filename}`;
    }
    const booking = await prisma_1.default.booking.update({
        where: { id: req.params.id },
        data: {
            ...(beforeImageUrl && { beforeImageUrl }),
            ...(afterImageUrl && { afterImageUrl })
        }
    });
    res.status(200).json({ success: true, data: { booking } });
});
