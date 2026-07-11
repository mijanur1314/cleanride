"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const vehicle_controller_1 = require("../controllers/vehicle.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect);
router.post('/', vehicle_controller_1.addVehicle);
router.get('/my-vehicles', vehicle_controller_1.getMyVehicles);
router.delete('/:id', vehicle_controller_1.deleteVehicle);
exports.default = router;
