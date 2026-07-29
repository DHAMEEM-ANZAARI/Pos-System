import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

interface CheckoutItem {
  productId: number;
  quantity: number;
}

const generateOrderNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
};

// POST /api/orders/checkout
// body: { items: [{ productId, quantity }], discount, paymentMethod, taxRate }
export const checkout = async (req: AuthRequest, res: Response) => {
  const { items, discount = 0, paymentMethod = "cash", taxRate = 0.18 } = req.body as {
    items: CheckoutItem[];
    discount?: number;
    paymentMethod?: "cash" | "card" | "wallet";
    taxRate?: number;
  };

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items array is required" });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const lineItems: {
        productId: number;
        name: string;
        sku: string;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
      }[] = [];

      for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
          throw { status: 400, message: "Each item requires a valid productId and quantity" };
        }

        // Atomic guarded decrement: the WHERE clause (stock >= quantity) combined
        // with the UPDATE is a single atomic statement in MySQL, and running it
        // inside this Prisma transaction means the whole checkout rolls back
        // together if any line item fails. This prevents overselling without
        // needing raw row locking.
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity }, active: true },
          data: { stock: { decrement: item.quantity } },
        });

        if (result.count === 0) {
          throw {
            status: 409,
            message: `Insufficient stock or product unavailable for product ${item.productId}`,
          };
        }

        const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });

        lineItems.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitPrice: product.price,
          quantity: item.quantity,
          lineTotal: Number((product.price * item.quantity).toFixed(2)),
        });
      }

      const subtotal = Number(lineItems.reduce((sum, li) => sum + li.lineTotal, 0).toFixed(2));
      const discountedSubtotal = Math.max(subtotal - discount, 0);
      const taxAmount = Number((discountedSubtotal * taxRate).toFixed(2));
      const total = Number((discountedSubtotal + taxAmount).toFixed(2));

      const createdOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          cashierId: req.user!.id,
          subtotal,
          taxAmount,
          discount,
          total,
          paymentMethod,
          status: "completed",
          lineItems: { create: lineItems },
        },
        include: { lineItems: true },
      });

      // Immutable ledger entries for each line item
      for (const li of lineItems) {
        const p = await tx.product.findUniqueOrThrow({ where: { id: li.productId } });
        await tx.inventoryLedger.create({
          data: {
            productId: li.productId,
            change: -li.quantity,
            reason: "sale",
            orderId: createdOrder.id,
            performedById: req.user!.id,
            balanceAfter: p.stock,
          },
        });
      }

      return createdOrder;
    });

    res.status(201).json(order);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || "Checkout failed" });
  }
};

// GET /api/orders?page=&limit=
export const listOrders = async (req: AuthRequest, res: Response) => {
  const page = Math.max(parseInt((req.query.page as string) || "1"), 1);
  const limit = Math.min(Math.max(parseInt((req.query.limit as string) || "20"), 1), 100);

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      include: { cashier: { select: { name: true, email: true } }, lineItems: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count(),
  ]);

  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
};

export const getOrder = async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(req.params.id) },
    include: { cashier: { select: { name: true, email: true } }, lineItems: true },
  });
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
};

// POST /api/orders/:id/refund
export const refundOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id: Number(req.params.id) },
        include: { lineItems: true },
      });
      if (!existing) throw { status: 404, message: "Order not found" };
      if (existing.status === "refunded") throw { status: 400, message: "Order already refunded" };

      for (const li of existing.lineItems) {
        const updated = await tx.product.update({
          where: { id: li.productId },
          data: { stock: { increment: li.quantity } },
        });
        await tx.inventoryLedger.create({
          data: {
            productId: li.productId,
            change: li.quantity,
            reason: "refund",
            orderId: existing.id,
            performedById: req.user!.id,
            balanceAfter: updated.stock,
          },
        });
      }

      return tx.order.update({ where: { id: existing.id }, data: { status: "refunded" } });
    });

    res.json(order);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || "Refund failed" });
  }
};
