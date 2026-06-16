import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { parsePage } from '../utils/pagination';
import { AppError } from '../utils/AppError';
import { Prisma } from '@prisma/client';
import path from 'path';
import fs from 'fs';

export const listProducts = async (req: Request, res: Response) => {
  const { category, q, available, page: pageStr, limit: limitStr } = req.query as Record<string, string | undefined>;
  const pagination = parsePage({ page: pageStr, limit: limitStr });

  const where: Prisma.ProductWhereInput = {};

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
    prisma.product.findMany({
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
    prisma.product.count({ where }),
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

export const getProduct = async (req: Request, res: Response) => {
  const slug = req.params.slug as string;

  const product = await prisma.product.findUnique({
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
    throw new AppError(404, 'Product not found', 'NOT_FOUND');
  }

  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : null;

  res.json({ ...product, averageRating });
};

export const listCategories = async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: { where: { isAvailable: true } } },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  res.json({ categories });
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, description, price, categoryId, preparationMinutes, variants } = req.body;

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  let imageUrl: string | undefined;
  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  }

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name,
        slug,
        description,
        price: new Prisma.Decimal(price),
        categoryId,
        preparationMinutes: preparationMinutes || 5,
        imageUrl,
        variants: {
          create: (variants || []).map((v: { name: string; priceModifier?: number }) => ({
            name: v.name,
            priceModifier: new Prisma.Decimal(v.priceModifier || 0),
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

export const updateProduct = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, description, price, categoryId, preparationMinutes, isAvailable } = req.body;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Product not found', 'NOT_FOUND');
  }

  const data: Prisma.ProductUpdateInput = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (price !== undefined) data.price = new Prisma.Decimal(price);
  if (categoryId !== undefined) data.category = { connect: { id: categoryId } };
  if (preparationMinutes !== undefined) data.preparationMinutes = preparationMinutes;
  if (isAvailable !== undefined) data.isAvailable = isAvailable;

  if (req.file) {
    data.imageUrl = `/uploads/${req.file.filename}`;
    if (existing.imageUrl) {
      const oldPath = path.join(process.env.UPLOAD_DIR || './uploads', existing.imageUrl.replace('/uploads/', ''));
      fs.unlink(oldPath, () => {});
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data,
    include: { variants: true, inventory: true, category: true },
  });

  res.json(product);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Product not found', 'NOT_FOUND');
  }

  await prisma.product.update({
    where: { id },
    data: { isAvailable: false },
  });

  res.status(204).send();
};
