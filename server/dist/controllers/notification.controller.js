"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getMyNotifications = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const prisma_1 = __importDefault(require("../utils/prisma"));
exports.getMyNotifications = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const notifications = await prisma_1.default.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: { notifications } });
});
exports.markAsRead = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const notification = await prisma_1.default.notification.updateMany({
        where: {
            id: req.params.id,
            userId: req.user.id
        },
        data: { isRead: true }
    });
    res.status(200).json({ success: true });
});
exports.markAllAsRead = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    await prisma_1.default.notification.updateMany({
        where: { userId: req.user.id, isRead: false },
        data: { isRead: true }
    });
    res.status(200).json({ success: true });
});
