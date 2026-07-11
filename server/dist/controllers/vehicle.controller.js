"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVehicle = exports.getMyVehicles = exports.addVehicle = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_1 = require("zod");
const vehicleSchema = zod_1.z.object({
    type: zod_1.z.string().min(1),
    make: zod_1.z.string().optional(),
    model: zod_1.z.string().optional(),
    plateNumber: zod_1.z.string().optional(),
    isDefault: zod_1.z.boolean().optional(),
});
exports.addVehicle = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const parsed = vehicleSchema.safeParse(req.body);
    if (!parsed.success)
        return next(new AppError_1.AppError('Invalid input data', 400));
    const { type, make, model, plateNumber, isDefault } = parsed.data;
    if (isDefault) {
        await prisma_1.default.vehicle.updateMany({
            where: { userId: req.user.id, isDefault: true },
            data: { isDefault: false },
        });
    }
    const vehicle = await prisma_1.default.vehicle.create({
        data: {
            userId: req.user.id,
            type: type,
            make,
            model,
            plateNumber,
            isDefault: isDefault || false,
        }
    });
    res.status(201).json({ success: true, data: { vehicle } });
});
exports.getMyVehicles = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const vehicles = await prisma_1.default.vehicle.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, results: vehicles.length, data: { vehicles } });
});
exports.deleteVehicle = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const vehicle = await prisma_1.default.vehicle.findUnique({
        where: { id: req.params.id }
    });
    if (!vehicle || vehicle.userId !== req.user.id) {
        return next(new AppError_1.AppError('Vehicle not found', 404));
    }
    await prisma_1.default.vehicle.delete({
        where: { id: req.params.id }
    });
    res.status(204).json({ success: true, data: null });
});
