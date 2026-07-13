"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscription_controller_1 = require("../controllers/subscription.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const redis_1 = require("../utils/redis");
const router = (0, express_1.Router)();
// Cached for 1 hour
router.get('/plans', (0, redis_1.cacheRoute)(3600), subscription_controller_1.getPlans);
router.post('/create-order', auth_middleware_1.protect, subscription_controller_1.createSubscriptionOrder);
router.post('/verify', auth_middleware_1.protect, subscription_controller_1.verifySubscription);
router.get('/my-subscription', auth_middleware_1.protect, subscription_controller_1.getMySubscription);
exports.default = router;
