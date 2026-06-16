"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.login = exports.register = void 0;
const prisma_1 = require("../lib/prisma");
const authService_1 = require("../services/authService");
const AppError_1 = require("../utils/AppError");
const REFRESH_COOKIE = 'refreshToken';
const register = async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new AppError_1.AppError(409, 'Email already registered', 'EMAIL_EXISTS');
    }
    const passwordHash = await (0, authService_1.hashPassword)(password);
    const user = await prisma_1.prisma.user.create({
        data: { name, email, passwordHash },
        select: { id: true, name: true, email: true, role: true, loyaltyPoints: true },
    });
    const tokens = await (0, authService_1.signTokens)(user.id, user.email, user.role);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({
        accessToken: tokens.accessToken,
        user,
    });
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
        throw new AppError_1.AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }
    const valid = await (0, authService_1.comparePassword)(password, user.passwordHash);
    if (!valid) {
        throw new AppError_1.AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }
    const tokens = await (0, authService_1.signTokens)(user.id, user.email, user.role);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
        accessToken: tokens.accessToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            loyaltyPoints: user.loyaltyPoints,
        },
    });
};
exports.login = login;
const refresh = async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) {
        throw new AppError_1.AppError(401, 'Refresh token missing', 'TOKEN_MISSING');
    }
    const payload = (0, authService_1.verifyRefreshToken)(token);
    if (!payload) {
        throw new AppError_1.AppError(401, 'Invalid refresh token', 'TOKEN_INVALID');
    }
    const stored = await Promise.resolve().then(() => __importStar(require('../lib/redis'))).then((r) => r.redis.get(`refresh:${payload.sub}`));
    if (!stored || stored !== payload.jti) {
        throw new AppError_1.AppError(401, 'Refresh token revoked', 'TOKEN_REVOKED');
    }
    const accessToken = await Promise.resolve().then(() => __importStar(require('../services/authService'))).then((a) => a.signTokens(payload.sub, '', 'CUSTOMER'));
    const newRefreshJti = await (0, authService_1.rotateRefreshToken)(payload.sub);
    res.cookie(REFRESH_COOKIE, newRefreshJti, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken: accessToken.accessToken });
};
exports.refresh = refresh;
const logout = async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
        const payload = (0, authService_1.verifyRefreshToken)(token);
        if (payload) {
            await (0, authService_1.revokeRefreshToken)(payload.sub);
        }
    }
    res.clearCookie(REFRESH_COOKIE);
    res.status(204).send();
};
exports.logout = logout;
//# sourceMappingURL=authController.js.map