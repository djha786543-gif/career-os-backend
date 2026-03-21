"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCache = getCache;
exports.setCache = setCache;
exports.deleteCache = deleteCache;
const node_cache_1 = __importDefault(require("node-cache"));
// Default TTL: 24h. Individual entries can override via setCache(key, val, ttl).
const cache = new node_cache_1.default({
    stdTTL: parseInt(process.env.CACHE_TTL || '86400', 10),
    checkperiod: 600, // check for expired keys every 10 minutes
});
function getCache(key) {
    return cache.get(key);
}
/** @param ttlSeconds  Optional per-entry TTL override (seconds). 0 = use default. */
function setCache(key, value, ttlSeconds = 0) {
    if (ttlSeconds > 0) {
        cache.set(key, value, ttlSeconds);
    }
    else {
        cache.set(key, value);
    }
}
function deleteCache(key) {
    cache.del(key);
}
