"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const socket_1 = require("./socket");
const PORT = process.env.PORT || 5000;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const server = http_1.default.createServer(app_1.default);
// Initialize Socket.IO
(0, socket_1.initSocket)(server, frontendUrl);
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
