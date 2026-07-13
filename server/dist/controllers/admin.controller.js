"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignPartnerToBooking = exports.getAllBookings = exports.getAllUsers = exports.getDashboardStats = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../utils/prisma"));
const email_1 = require("../utils/email");
const index_1 = require("../index");
exports.getDashboardStats = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    // Aggregate stats
    const totalUsers = await prisma_1.default.user.count({ where: { role: 'USER' } });
    const totalPartners = await prisma_1.default.user.count({ where: { role: 'PARTNER' } });
    const totalBookings = await prisma_1.default.booking.count();
    // Calculate total revenue (assuming payments are successful)
    const bookings = await prisma_1.default.booking.findMany({
        select: { totalAmount: true }
    });
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    // Get recent bookings
    const recentBookings = await prisma_1.default.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { name: true, email: true } },
            partner: { select: { name: true } },
            service: { select: { name: true } }
        }
    });
    res.status(200).json({
        success: true,
        data: {
            stats: {
                totalUsers,
                totalPartners,
                totalBookings,
                totalRevenue
            },
            recentBookings
        }
    });
});
exports.getAllUsers = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const users = await prisma_1.default.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            loyaltyPoints: true
        },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({
        success: true,
        results: users.length,
        data: { users }
    });
});
exports.getAllBookings = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const bookings = await prisma_1.default.booking.findMany({
        include: {
            user: { select: { name: true, email: true } },
            partner: { select: { name: true, email: true } },
            service: { select: { name: true, price: true } },
            bookingAddons: { select: { addon: { select: { name: true, price: true } } } }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({
        success: true,
        results: bookings.length,
        data: { bookings }
    });
});
exports.assignPartnerToBooking = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const bookingId = req.params.bookingId;
    const partnerId = req.body.partnerId;
    if (!partnerId)
        return next(new AppError_1.AppError('Partner ID is required', 400));
    const partner = await prisma_1.default.user.findUnique({ where: { id: partnerId } });
    if (!partner || partner.role !== 'PARTNER') {
        return next(new AppError_1.AppError('Invalid partner ID', 400));
    }
    const booking = await prisma_1.default.booking.update({
        where: { id: bookingId },
        data: {
            partnerId,
            status: 'CONFIRMED' // Update status once assigned
        },
        include: {
            user: { select: { name: true, email: true } },
            partner: { select: { name: true, email: true } },
            service: { select: { name: true } }
        }
    });
    // Notify User
    if (booking.user) {
        await (0, email_1.sendEmail)({
            to: booking.user.email,
            subject: 'CleanRide - Partner Assigned to Your Booking',
            html: `
        <h2>Great News!</h2>
        <p>Hi ${booking.user.name},</p>
        <p>A service partner (<strong>${booking.partner?.name}</strong>) has been assigned to your ${booking.service.name} booking.</p>
        <p>They will arrive at the scheduled time.</p>
        <br/>
        <p>Thank you for choosing CleanRide!</p>
      `
        });
    }
    // Notify Partner
    if (booking.partner) {
        await (0, email_1.sendEmail)({
            to: booking.partner.email,
            subject: 'CleanRide - New Booking Assigned to You',
            html: `
        <h2>New Job Assigned</h2>
        <p>Hi ${booking.partner.name},</p>
        <p>You have been assigned a new <strong>${booking.service.name}</strong> job.</p>
        <p>Please check your partner dashboard for location and timing details.</p>
        <br/>
        <p>Best,<br/>CleanRide Admin</p>
      `
        });
    }
    // Emit WebSocket Event to the User's personal room to trigger UI update
    index_1.io.to(booking.userId).emit('booking-updated', {
        bookingId: booking.id,
        status: booking.status,
        partnerName: booking.partner?.name,
        message: 'A partner has been assigned to your booking!'
    });
    res.status(200).json({
        success: true,
        data: { booking }
    });
});
