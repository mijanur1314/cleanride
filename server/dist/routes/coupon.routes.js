"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coupon_controller_1 = require("../controllers/coupon.controller");
const router = (0, express_1.Router)();
router.get('/active', coupon_controller_1.getActiveCoupons);
router.post('/validate', coupon_controller_1.validateCoupon);
exports.default = router;
