"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteService = exports.updateService = exports.createService = exports.getServiceById = exports.getServices = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_1 = require("zod");
const serviceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    price: zod_1.z.number().positive(),
    duration: zod_1.z.number().positive(),
    imageUrl: zod_1.z.string().url().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.getServices = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const services = await prisma_1.default.service.findMany({
        where: req.user?.role === 'ADMIN' ? {} : { isActive: true },
    });
    res.status(200).json({
        success: true,
        results: services.length,
        data: { services },
    });
});
exports.getServiceById = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const service = await prisma_1.default.service.findUnique({
        where: { id: req.params.id },
    });
    if (!service)
        return next(new AppError_1.AppError('No service found with that ID', 404));
    res.status(200).json({ success: true, data: { service } });
});
exports.createService = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const parsed = serviceSchema.safeParse(req.body);
    if (!parsed.success)
        return next(new AppError_1.AppError('Invalid input data', 400));
    const service = await prisma_1.default.service.create({ data: parsed.data });
    res.status(201).json({ success: true, data: { service } });
});
exports.updateService = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const parsed = serviceSchema.partial().safeParse(req.body);
    if (!parsed.success)
        return next(new AppError_1.AppError('Invalid input data', 400));
    const service = await prisma_1.default.service.update({
        where: { id: req.params.id },
        data: parsed.data,
    });
    res.status(200).json({ success: true, data: { service } });
});
exports.deleteService = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    await prisma_1.default.service.delete({ where: { id: req.params.id } });
    res.status(204).json({ success: true, data: null });
});
