import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const run = async () => {
  console.log("[seed] clearing existing demo data...");
  // Delete in FK-safe order
  await prisma.inventoryLedger.deleteMany();
  await prisma.orderLineItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();

  const store = await prisma.store.create({
    data: { name: "Downtown Flagship Store", location: "Chennai, Tamil Nadu", taxRate: 0.18 },
  });

  const passwordHash = await bcrypt.hash("password123", 10);

  const users = await Promise.all(
    [
      { name: "Admin User", email: "admin@pos.test", role: "admin" as const },
      { name: "Manager User", email: "manager@pos.test", role: "manager" as const },
      { name: "Cashier User", email: "cashier@pos.test", role: "cashier" as const },
    ].map((u) =>
      prisma.user.create({
        data: { ...u, password: passwordHash, storeId: store.id },
      })
    )
  );

  await prisma.product.createMany({
    data: [
      { name: "Classic Cotton T-Shirt", sku: "TSH-BLK-M", category: "Apparel", price: 499, costPrice: 220, size: "M", color: "Black", stock: 40, reorderPoint: 10 },
      { name: "Classic Cotton T-Shirt", sku: "TSH-WHT-L", category: "Apparel", price: 499, costPrice: 220, size: "L", color: "White", stock: 25, reorderPoint: 10 },
      { name: "Denim Jeans", sku: "JNS-BLU-32", category: "Apparel", price: 1499, costPrice: 700, size: "32", color: "Blue", stock: 15, reorderPoint: 5 },
      { name: "Running Shoes", sku: "SHO-GRY-9", category: "Footwear", price: 2999, costPrice: 1500, size: "9", color: "Grey", stock: 8, reorderPoint: 5 },
      { name: "Leather Wallet", sku: "WAL-BRN-01", category: "Accessories", price: 899, costPrice: 350, stock: 3, reorderPoint: 5 },
      { name: "Stainless Steel Water Bottle", sku: "BOT-SIL-01", category: "Accessories", price: 349, costPrice: 150, stock: 60, reorderPoint: 15 },
    ],
  });

  console.log("[seed] done. Demo accounts (password: password123):");
  users.forEach((u) => console.log(`  - ${u.role.padEnd(8)} ${u.email}`));

  await prisma.$disconnect();
};

run().catch(async (err) => {
  console.error("[seed] failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
