"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCache = getCache;
exports.setCache = setCache;
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default({ stdTTL: parseInt(process.env.CACHE_TTL || '86400', 10) });
function getCache(key) {
    return cache.get(key);
}
function setCache(key, value) {
    cache.set(key, value);
}
