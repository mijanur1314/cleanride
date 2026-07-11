"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const addon_controller_1 = require("../controllers/addon.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.get('/', addon_controller_1.getAddons);
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('ADMIN'), addon_controller_1.createAddon);
exports.default = router;
