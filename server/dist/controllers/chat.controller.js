"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingMessages = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const prisma_1 = __importDefault(require("../utils/prisma"));
exports.getBookingMessages = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { bookingId } = req.params;
    const messages = await prisma_1.default.message.findMany({
        where: { bookingId: bookingId },
        include: { sender: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' }
    });
    res.status(200).json({ success: true, results: messages.length, data: { messages } });
});
