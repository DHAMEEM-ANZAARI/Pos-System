# Counter · POS — Omnichannel Retail POS & Inventory Management System

Project 1 from the Infotact internship spec, built as a working MVP:
- **Backend**: Node.js, Express, TypeScript, **MySQL via Prisma ORM**, JWT auth, RBAC (cashier/manager/admin)
- **Frontend**: React, TypeScript, Tailwind CSS, Vite — a receipt/ledger-styled POS terminal
- **Core flows**: unified product catalog, real-time POS checkout, atomic stock decrement + inventory ledger, low-stock alerts & restocking, order history & refunds

## What's implemented vs. the full spec

This is a complete, runnable MVP covering the functional core of the spec (auth/RBAC, catalog, POS checkout, atomic inventory, low-stock alerts, order/refund flow). Redis caching, Docker/CI pipelines, and multi-store geo-routing were intentionally left out to keep local setup simple. Checkout runs inside a real Prisma/MySQL transaction: each line item is decremented with an atomic `UPDATE ... WHERE stock >= quantity` guard, and if any item fails (insufficient stock), the whole transaction rolls back — so nothing oversells.

## 1. Install prerequisites (Windows)

**Node.js** — download the LTS installer from https://nodejs.org and run it. Verify in PowerShell:
```powershell
node -v
npm -v
```

**MySQL** — install MySQL Community Server for Windows:
1. Download the installer from https://dev.mysql.com/downloads/installer/
2. Run it, choose the "Server only" (or "Developer Default") setup type.
3. During setup, set a root password — remember it, you'll need it below.
4. Finish the wizard; MySQL runs as a Windows service automatically after install.

Create the database. Open **MySQL Command Line Client** (or MySQL Workbench) from the Start menu and run:
```sql
CREATE DATABASE pos_system;
```

*(Alternative if you don't want to install MySQL locally: use a free hosted MySQL instance from [PlanetScale](https://planetscale.com) or [Railway](https://railway.app) and skip straight to using their connection string in step 3.)*

## 2. Unzip the project

```powershell
cd Downloads
Expand-Archive pos-system.zip -DestinationPath pos-system
```

## 3. Backend setup

```powershell
cd pos-system\backend
npm install
copy .env.example .env
```

Open `.env` in Notepad and set your MySQL connection string and a JWT secret:
```
PORT=5000
DATABASE_URL=mysql://root:YOUR_PASSWORD@127.0.0.1:3306/pos_system
JWT_SECRET=any-long-random-string-you-like
JWT_EXPIRES_IN=8h
```

Create the database tables (Prisma reads `prisma/schema.prisma` and builds the schema for you):
```powershell
npx prisma migrate dev --name init
```

Seed demo data and start the API:
```powershell
npm run seed
npm run dev
```
You should see `[server] listening on http://localhost:5000`. Leave this window open.

> Tip: `npx prisma studio` opens a browser-based table viewer/editor for your MySQL data if you want to inspect it directly.

Demo accounts created by the seed script (password for all: `password123`):

| Role    | Email             |
|---------|-------------------|
| Admin   | admin@pos.test    |
| Manager | manager@pos.test  |
| Cashier | cashier@pos.test  |

## 4. Frontend setup

Open a **second** PowerShell window:
```powershell
cd Downloads\pos-system\frontend
npm install
npm run dev
```
You should see a `Local: http://localhost:5173/` link. Vite proxies `/api` to `http://localhost:5000`, so no extra config is needed.

## 5. Use it

Open **http://localhost:5173** and sign in with one of the demo accounts above.

- **Cashier**: search/add products to the cart on the Terminal page, adjust quantities, pick a payment method, and hit Charge.
- **Manager/Admin**: also get **Catalog** (add/edit/deactivate products), **Inventory** (low-stock alerts + restock), and refund permissions on **Orders**.

## 6. API overview

| Method | Route                          | Access          |
|--------|---------------------------------|-----------------|
| POST   | /api/auth/register               | public (defaults to cashier role) |
| POST   | /api/auth/login                  | public          |
| GET    | /api/products                    | any logged-in user |
| GET    | /api/products/low-stock          | manager/admin   |
| POST   | /api/products                    | manager/admin   |
| PUT    | /api/products/:id                | manager/admin   |
| DELETE | /api/products/:id (soft delete)  | manager/admin   |
| POST   | /api/orders/checkout             | any logged-in user |
| GET    | /api/orders                      | any logged-in user |
| POST   | /api/orders/:id/refund           | manager/admin   |
| POST   | /api/inventory/restock           | manager/admin   |
| POST   | /api/inventory/adjust            | manager/admin   |
| GET    | /api/inventory/ledger/:productId | manager/admin   |

## 7. Production build

```powershell
cd backend
npm run build
npm start

cd ..\frontend
npm run build   # outputs static files to frontend\dist
```

## Troubleshooting

- **`Can't reach database server`**: MySQL service isn't running, or `DATABASE_URL` has the wrong password/port. Check the MySQL80 service is started in Windows Services (`services.msc`).
- **`Access denied for user 'root'`**: password in `.env` doesn't match what you set during MySQL install.
- **`npx prisma migrate dev` fails**: make sure the `pos_system` database exists (see step 1) and the connection string's database name matches it.
