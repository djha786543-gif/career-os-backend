"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
// Re-export the shared pool as a named export so monitor modules can use { pool }
const db_1 = __importDefault(require("../db"));
exports.pool = db_1.default;
