"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const requestLogger_1 = require("./middleware/requestLogger");
const errorHandler_1 = require("./middleware/errorHandler");
const socket_1 = require("./socket");
const prisma_1 = require("./lib/prisma");
const redis_1 = require("./lib/redis");
const asyncHandler_1 = require("./utils/asyncHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const orders_1 = __importDefault(require("./routes/orders"));
const users_1 = __importDefault(require("./routes/users"));
const admin_1 = __importDefault(require("./routes/admin"));
const tables_1 = __importDefault(require("./routes/tables"));
const loyalty_1 = __importDefault(require("./routes/loyalty"));
const stripe_1 = __importDefault(require("./routes/stripe"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
(0, socket_1.setupSocketHandlers)(httpServer);
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};
// Security & performance middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(corsOptions));
app.use((0, compression_1.default)());
// Global rate limit
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: 'Too many requests, please try again later', code: 'RATE_LIMITED' } },
});
app.use(globalLimiter);
// Auth rate limit (stricter)
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: 'Too many auth attempts, please try again later', code: 'RATE_LIMITED' } },
});
// Stripe webhook needs raw body
app.use('/api/stripe/webhook', express_1.default.raw({ type: 'application/json' }));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Request logging
app.use(requestLogger_1.requestLogger);
// Static files
app.use('/uploads', express_1.default.static(path_1.default.resolve(UPLOAD_DIR)));
// Routes
app.use('/api/auth', authLimiter, auth_1.default);
app.use('/api/products', products_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/users', users_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/tables', tables_1.default);
app.use('/api/loyalty', loyalty_1.default);
app.use('/api/stripe', stripe_1.default);
// Health check
app.get('/api/health', (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    let dbOk = false;
    let redisOk = false;
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        dbOk = true;
    }
    catch { /* db down */ }
    try {
        const ping = await redis_1.redis.ping();
        redisOk = ping === 'PONG';
    }
    catch { /* redis down */ }
    const healthy = dbOk && redisOk;
    res.status(healthy ? 200 : 503).json({
        status: healthy ? 'ok' : 'degraded',
        db: dbOk ? 'connected' : 'disconnected',
        redis: redisOk ? 'connected' : 'disconnected',
        uptime: process.uptime(),
    });
}));
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
const PORT = parseInt(process.env.PORT || '3001', 10);
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
exports.default = app;
//# sourceMappingURL=app.js.map