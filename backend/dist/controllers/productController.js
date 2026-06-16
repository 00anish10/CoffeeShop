"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.listCategories = exports.getProduct = exports.listProducts = void 0;
const prisma_1 = require("../lib/prisma");
const pagination_1 = require("../utils/pagination");
const AppError_1 = require("../utils/AppError");
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const listProducts = async (req, res) => {
    const { category, q, available, page: pageStr, limit: limitStr } = req.query;
    const pagination = (0, pagination_1.parsePage)({ page: pageStr, limit: limitStr });
    const where = {};
    if (category) {
        where.category = { slug: category };
    }
    if (q) {
        where.OR = [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
        ];
    }
    if (available !== undefined) {
        where.isAvailable = available === 'true';
    }
    const [products, total] = await Promise.all([
        prisma_1.prisma.product.findMany({
            where,
            include: {
                category: true,
                variants: true,
                _count: { select: { reviews: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: pagination.skip,
            take: pagination.take,
        }),
        prisma_1.prisma.product.count({ where }),
    ]);
    res.json({
        products,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages: Math.ceil(total / pagination.limit),
        },
    });
};
exports.listProducts = listProducts;
const getProduct = async (req, res) => {
    const slug = req.params.slug;
    const product = await prisma_1.prisma.product.findUnique({
        where: { slug },
        include: {
            category: true,
            variants: true,
            reviews: {
                include: { user: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' },
            },
            inventory: true,
            _count: { select: { reviews: true } },
        },
    });
    if (!product) {
        throw new AppError_1.AppError(404, 'Product not found', 'NOT_FOUND');
    }
    const averageRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : null;
    res.json({ ...product, averageRating });
};
exports.getProduct = getProduct;
const listCategories = async (_req, res) => {
    const categories = await prisma_1.prisma.category.findMany({
        include: {
            _count: {
                select: { products: { where: { isAvailable: true } } },
            },
        },
        orderBy: { sortOrder: 'asc' },
    });
    res.json({ categories });
};
exports.listCategories = listCategories;
const createProduct = async (req, res) => {
    const { name, description, price, categoryId, preparationMinutes, variants } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let imageUrl;
    if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
    }
    const product = await prisma_1.prisma.$transaction(async (tx) => {
        const created = await tx.product.create({
            data: {
                name,
                slug,
                description,
                price: new client_1.Prisma.Decimal(price),
                categoryId,
                preparationMinutes: preparationMinutes || 5,
                imageUrl,
                variants: {
                    create: (variants || []).map((v) => ({
                        name: v.name,
                        priceModifier: new client_1.Prisma.Decimal(v.priceModifier || 0),
                    })),
                },
                inventory: {
                    create: { stockLevel: 100, lowStockThreshold: 10 },
                },
            },
            include: { variants: true, inventory: true, category: true },
        });
        return created;
    });
    res.status(201).json(product);
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    const id = req.params.id;
    const { name, description, price, categoryId, preparationMinutes, isAvailable } = req.body;
    const existing = await prisma_1.prisma.product.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError_1.AppError(404, 'Product not found', 'NOT_FOUND');
    }
    const data = {};
    if (name !== undefined)
        data.name = name;
    if (description !== undefined)
        data.description = description;
    if (price !== undefined)
        data.price = new client_1.Prisma.Decimal(price);
    if (categoryId !== undefined)
        data.category = { connect: { id: categoryId } };
    if (preparationMinutes !== undefined)
        data.preparationMinutes = preparationMinutes;
    if (isAvailable !== undefined)
        data.isAvailable = isAvailable;
    if (req.file) {
        data.imageUrl = `/uploads/${req.file.filename}`;
        if (existing.imageUrl) {
            const oldPath = path_1.default.join(process.env.UPLOAD_DIR || './uploads', existing.imageUrl.replace('/uploads/', ''));
            fs_1.default.unlink(oldPath, () => { });
        }
    }
    const product = await prisma_1.prisma.product.update({
        where: { id },
        data,
        include: { variants: true, inventory: true, category: true },
    });
    res.json(product);
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    const id = req.params.id;
    const existing = await prisma_1.prisma.product.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError_1.AppError(404, 'Product not found', 'NOT_FOUND');
    }
    await prisma_1.prisma.product.update({
        where: { id },
        data: { isAvailable: false },
    });
    res.status(204).send();
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=productController.js.map