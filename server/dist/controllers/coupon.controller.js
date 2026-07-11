"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveCoupons = exports.validateCoupon = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../utils/prisma"));
exports.validateCoupon = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { code } = req.body;
    if (!code)
        return next(new AppError_1.AppError('Please provide a coupon code', 400));
    const coupon = await prisma_1.default.coupon.findUnique({
        where: { code: code.toUpperCase() }
    });
    if (!coupon)
        return next(new AppError_1.AppError('Invalid coupon code', 404));
    if (!coupon.isActive)
        return next(new AppError_1.AppError('This coupon is no longer active', 400));
    if (new Date(coupon.validUntil) < new Date())
        return next(new AppError_1.AppError('This coupon has expired', 400));
    res.status(200).json({ success: true, data: { coupon } });
});
exports.getActiveCoupons = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const coupons = await prisma_1.default.coupon.findMany({
        where: {
            isActive: true,
            validUntil: { gte: new Date() }
        }
    });
    res.status(200).json({ success: true, results: coupons.length, data: { coupons } });
});
