"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStore = exports.updateStore = exports.createStore = exports.getStoreById = exports.getStores = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_1 = require("zod");
const storeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    address: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1),
    state: zod_1.z.string().min(1),
    zipCode: zod_1.z.string().min(1),
    isActive: zod_1.z.boolean().optional(),
});
exports.getStores = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const stores = await prisma_1.default.store.findMany({
        where: req.user?.role === 'ADMIN' ? {} : { isActive: true },
    });
    res.status(200).json({
        success: true,
        results: stores.length,
        data: { stores },
    });
});
exports.getStoreById = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const store = await prisma_1.default.store.findUnique({
        where: { id: req.params.id },
    });
    if (!store)
        return next(new AppError_1.AppError('No store found with that ID', 404));
    res.status(200).json({ success: true, data: { store } });
});
exports.createStore = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const parsed = storeSchema.safeParse(req.body);
    if (!parsed.success)
        return next(new AppError_1.AppError('Invalid input data', 400));
    const store = await prisma_1.default.store.create({ data: parsed.data });
    res.status(201).json({ success: true, data: { store } });
});
exports.updateStore = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const parsed = storeSchema.partial().safeParse(req.body);
    if (!parsed.success)
        return next(new AppError_1.AppError('Invalid input data', 400));
    const store = await prisma_1.default.store.update({
        where: { id: req.params.id },
        data: parsed.data,
    });
    res.status(200).json({ success: true, data: { store } });
});
exports.deleteStore = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    await prisma_1.default.store.delete({ where: { id: req.params.id } });
    res.status(204).json({ success: true, data: null });
});
