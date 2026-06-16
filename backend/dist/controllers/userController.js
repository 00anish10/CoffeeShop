"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = exports.updateProfile = exports.getProfile = void 0;
const prisma_1 = require("../lib/prisma");
const getProfile = async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            loyaltyPoints: true,
            avatarUrl: true,
            createdAt: true,
        },
    });
    if (!user) {
        res.status(404).json({ error: { message: 'User not found', code: 'NOT_FOUND' } });
        return;
    }
    res.json(user);
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    const { name, avatarUrl } = req.body;
    const user = await prisma_1.prisma.user.update({
        where: { id: req.user.id },
        data: { name, avatarUrl },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            loyaltyPoints: true,
            avatarUrl: true,
        },
    });
    res.json(user);
};
exports.updateProfile = updateProfile;
const getUsers = async (req, res) => {
    const users = await prisma_1.prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            loyaltyPoints: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
};
exports.getUsers = getUsers;
//# sourceMappingURL=userController.js.map