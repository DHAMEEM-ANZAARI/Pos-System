
# Inventory Management System

## 1. Install prerequisites

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

## 2. Backend setup

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

Demo accounts created by the seed script (password for all: `password123`):

| Role    | Email             |
|---------|-------------------|
| Admin   | admin@pos.test    |
| Manager | manager@pos.test  |
| Cashier | cashier@pos.test  |

## 3. Frontend setup

Open a **second** PowerShell window:
```powershell
cd Downloads\pos-system\frontend
npm install
npm run dev
```
You should see a `Local: http://localhost:5173/` link. Vite proxies `/api` to `http://localhost:5000`, so no extra config is needed.

## 4. Use it

Open **http://localhost:5173** and sign in with one of the demo accounts above.

- **Cashier**: search/add products to the cart on the Terminal page, adjust quantities, pick a payment method, and hit Charge.
- **Manager/Admin**: also get **Catalog** (add/edit/deactivate products), **Inventory** (low-stock alerts + restock), and refund permissions on **Orders**.

## 5. API overview

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

## 6. Production build

```powershell
cd backend
npm run build
npm start

cd ..\frontend
npm run build  
```
