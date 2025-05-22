"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureLogger = configureLogger;
const winston_1 = __importDefault(require("winston"));
function configureLogger(level) {
    return winston_1.default.createLogger({
        level,
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.printf(({ level, message, timestamp }) => {
            return `${timestamp} ${level}: ${message}`;
        })),
        transports: [
            new winston_1.default.transports.Console()
        ]
    });
}
