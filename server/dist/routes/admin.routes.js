"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// Apply auth middleware to all admin routes
router.use(auth_middleware_1.protect);
router.use((0, auth_middleware_1.restrictTo)('ADMIN'));
router.get('/stats', admin_controller_1.getDashboardStats);
router.get('/users', admin_controller_1.getAllUsers);
router.get('/bookings', admin_controller_1.getAllBookings);
router.patch('/bookings/:bookingId/assign', admin_controller_1.assignPartnerToBooking);
exports.default = router;
