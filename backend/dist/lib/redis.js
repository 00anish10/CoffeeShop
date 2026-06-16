"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
exports.redis = new ioredis_1.default(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        if (times > 3)
            return null;
        return Math.min(times * 200, 2000);
    },
});
exports.redis.on('error', (err) => {
    console.error('Redis connection error:', err.message);
});
//# sourceMappingURL=redis.js.map