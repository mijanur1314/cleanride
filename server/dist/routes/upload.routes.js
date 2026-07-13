"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = require("../controllers/upload.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Only authenticated users can upload files
router.post('/', auth_middleware_1.protect, upload_controller_1.uploadMiddleware.single('file'), upload_controller_1.uploadFile);
exports.default = router;
