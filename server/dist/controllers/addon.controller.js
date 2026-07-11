"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAddon = exports.getAddons = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../utils/prisma"));
exports.getAddons = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const addons = await prisma_1.default.addon.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, results: addons.length, data: { addons } });
});
// Admin only
exports.createAddon = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const { name, description, price } = req.body;
    if (!name || !price) {
        return next(new AppError_1.AppError('Name and price are required', 400));
    }
    const addon = await prisma_1.default.addon.create({
        data: { name, description, price }
    });
    res.status(201).json({ success: true, data: { addon } });
});
