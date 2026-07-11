"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateProfile = exports.getUserById = exports.getUsers = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../utils/prisma"));
exports.getUsers = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const users = await prisma_1.default.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
        },
    });
    res.status(200).json({
        success: true,
        results: users.length,
        data: {
            users,
        },
    });
});
exports.getUserById = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: req.params.id },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            bookings: true,
        },
    });
    if (!user) {
        return next(new AppError_1.AppError('No user found with that ID', 404));
    }
    res.status(200).json({
        success: true,
        data: {
            user,
        },
    });
});
exports.updateProfile = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    // Prevent role or password update via this route
    if (req.body.password || req.body.role) {
        return next(new AppError_1.AppError('This route is not for password or role updates.', 400));
    }
    const updatedUser = await prisma_1.default.user.update({
        where: { id: req.user.id },
        data: {
            name: req.body.name,
            phone: req.body.phone,
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
        },
    });
    res.status(200).json({
        success: true,
        data: {
            user: updatedUser,
        },
    });
});
exports.deleteUser = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    await prisma_1.default.user.delete({
        where: { id: req.params.id },
    });
    res.status(204).json({
        success: true,
        data: null,
    });
});
