import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';

interface StockItem {
  productId: string;
  quantity: number;
}

export async function checkAvailability(items: StockItem[]): Promise<void> {
  for (const item of items) {
    const inventory = await prisma.inventory.findUnique({
      where: { productId: item.productId },
    });
    if (inventory && inventory.stockLevel < item.quantity) {
      throw new AppError(409, `Insufficient stock for product ${item.productId}`, 'INSUFFICIENT_STOCK');
    }
  }
}

export async function deductStock(items: StockItem[]): Promise<void> {
  await prisma.$transaction(
    items.map((item) =>
      prisma.inventory.update({
        where: { productId: item.productId },
        data: { stockLevel: { decrement: item.quantity } },
      })
    )
  );
}

export async function restoreStock(items: StockItem[]): Promise<void> {
  await prisma.$transaction(
    items.map((item) =>
      prisma.inventory.update({
        where: { productId: item.productId },
        data: { stockLevel: { increment: item.quantity } },
      })
    )
  );
}
