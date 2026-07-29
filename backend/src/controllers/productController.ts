import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

// GET /api/products?search=&category=&page=&limit=
export const listProducts = async (req: AuthRequest, res: Response) => {
  const page = Math.max(parseInt((req.query.page as string) || "1"), 1);
  const limit = Math.min(Math.max(parseInt((req.query.limit as string) || "20"), 1), 100);
  const search = (req.query.search as string) || "";
  const category = req.query.category as string | undefined;

  const where: any = { active: true };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
      { category: { contains: search } },
    ];
  }
  if (category) where.category = category;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
};

export const getProduct = async (req: AuthRequest, res: Response) => {
  const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) } });
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, sku, category, price, costPrice, stock, reorderPoint, variant } = req.body;
    const product = await prisma.product.create({
      data: {
        name,
        sku: sku.toUpperCase(),
        category,
        price: Number(price),
        costPrice: Number(costPrice) || 0,
        stock: Number(stock) || 0,
        reorderPoint: Number(reorderPoint) || 5,
        size: variant?.size || null,
        color: variant?.color || null,
      },
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: "Could not create product", error: (err as Error).message });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, sku, category, price, costPrice, stock, reorderPoint, variant, active } = req.body;
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(sku !== undefined && { sku: sku.toUpperCase() }),
        ...(category !== undefined && { category }),
        ...(price !== undefined && { price: Number(price) }),
        ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(reorderPoint !== undefined && { reorderPoint: Number(reorderPoint) }),
        ...(variant?.size !== undefined && { size: variant.size || null }),
        ...(variant?.color !== undefined && { color: variant.color || null }),
        ...(active !== undefined && { active }),
      },
    });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: "Could not update product", error: (err as Error).message });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: { active: false },
    });
    res.json({ message: "Product deactivated", product });
  } catch {
    res.status(404).json({ message: "Product not found" });
  }
};

// GET /api/products/low-stock
export const lowStockProducts = async (_req: AuthRequest, res: Response) => {
  const active = await prisma.product.findMany({ where: { active: true } });
  const items = active
    .filter((p) => p.stock <= p.reorderPoint)
    .sort((a, b) => a.stock - b.stock);
  res.json({ items, count: items.length });
};
