import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

// POST /api/inventory/restock  { productId, quantity }
export const restock = async (req: AuthRequest, res: Response) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: "productId and a positive quantity are required" });
  }
  try {
    const product = await prisma.product.update({
      where: { id: Number(productId) },
      data: { stock: { increment: quantity } },
    });

    await prisma.inventoryLedger.create({
      data: {
        productId: product.id,
        change: quantity,
        reason: "restock",
        performedById: req.user!.id,
        balanceAfter: product.stock,
      },
    });

    res.json(product);
  } catch {
    res.status(404).json({ message: "Product not found" });
  }
};

// POST /api/inventory/adjust  { productId, newStock }
export const adjustStock = async (req: AuthRequest, res: Response) => {
  const { productId, newStock } = req.body;
  if (!productId || newStock === undefined || newStock < 0) {
    return res.status(400).json({ message: "productId and a valid newStock are required" });
  }
  const existing = await prisma.product.findUnique({ where: { id: Number(productId) } });
  if (!existing) return res.status(404).json({ message: "Product not found" });

  const change = newStock - existing.stock;
  const product = await prisma.product.update({
    where: { id: existing.id },
    data: { stock: newStock },
  });

  await prisma.inventoryLedger.create({
    data: {
      productId: product.id,
      change,
      reason: "adjustment",
      performedById: req.user!.id,
      balanceAfter: product.stock,
    },
  });

  res.json(product);
};

// GET /api/inventory/ledger/:productId
export const getLedger = async (req: AuthRequest, res: Response) => {
  const entries = await prisma.inventoryLedger.findMany({
    where: { productId: Number(req.params.productId) },
    include: { performedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(entries);
};
