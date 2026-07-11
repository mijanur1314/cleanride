"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
router.get('/', (0, auth_middleware_1.restrictTo)('ADMIN'), user_controller_1.getUsers);
router.patch('/updateMe', user_controller_1.updateProfile);
router
    .route('/:id')
    .get(user_controller_1.getUserById)
    .delete((0, auth_middleware_1.restrictTo)('ADMIN'), user_controller_1.deleteUser);
exports.default = router;
