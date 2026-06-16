"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.signTokens = signTokens;
exports.verifyToken = verifyToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.rotateRefreshToken = rotateRefreshToken;
exports.revokeRefreshToken = revokeRefreshToken;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const redis_1 = require("../lib/redis");
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, 12);
}
async function comparePassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
async function signTokens(userId, email, role) {
    const payload = { sub: userId, email, role };
    const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = (0, uuid_1.v4)();
    const refreshJti = jsonwebtoken_1.default.sign({ jti: refreshToken, sub: userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    await redis_1.redis.set(`refresh:${userId}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
    return { accessToken, refreshToken: refreshJti };
}
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
function verifyRefreshToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
    }
    catch {
        return null;
    }
}
async function rotateRefreshToken(userId) {
    const newRefreshToken = (0, uuid_1.v4)();
    const newRefreshJti = jsonwebtoken_1.default.sign({ jti: newRefreshToken, sub: userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    await redis_1.redis.del(`refresh:${userId}`);
    await redis_1.redis.set(`refresh:${userId}`, newRefreshToken, 'EX', 7 * 24 * 60 * 60);
    return newRefreshJti;
}
async function revokeRefreshToken(userId) {
    await redis_1.redis.del(`refresh:${userId}`);
}
//# sourceMappingURL=authService.js.map