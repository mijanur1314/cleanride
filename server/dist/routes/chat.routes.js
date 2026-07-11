"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect);
router.get('/:bookingId', chat_controller_1.getBookingMessages);
exports.default = router;
