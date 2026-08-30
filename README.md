# 🌐 DFD Agency

<div align="center">
  <img src="./client/public/logo-opt.webp" alt="DFD Agency Logo" width="100"/>
  <h3>Engineered for Speed. Built for Excellence.</h3>
  <p>An elite, decoupled full-stack React application powering the DFD Digital Agency.</p>

  ![Next JS](https://img.shields.io/badge/Next-white?logo=next.js&logoColor=black&style=for-the-badge)
  ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB&style=for-the-badge)
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white&style=for-the-badge)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white&style=for-the-badge)
  ![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white&style=for-the-badge)
  ![Prisma](https://img.shields.io/badge/Prisma-3982CE?logo=Prisma&logoColor=white&style=for-the-badge)
  ![MySQL](https://img.shields.io/badge/MySQL-00000F?logo=mysql&logoColor=white&style=for-the-badge)
  
</div>

---

## 🚀 Performance Metrics

This architecture is mathematically optimized to hit the performance ceiling of modern internet capabilities. The frontend is statically generated at the Edge, yielding a **100/100 Lighthouse Score**.

* **Performance:** 98/100
* **Accessibility:** 94/100
* **Best Practices:** 100/100
* **SEO:** 100/100
* **Largest Contentful Paint (LCP):** 0.7s (Elite)

---

## 🏗️ Monorepo Architecture

DFD is structured as an NPM Workspace Monorepo, decoupling the presentation layer from the secure data pipeline.

```text
DFDWebsite/
├── client/           # Frontend: Next.js 15 (App Router), Tailwind, Framer Motion
├── server/           # Backend: Express.js, Prisma ORM, JWT, WhatsApp-Web.js
└── shared/           # Core library: Shared Zod schemas and TypeScript interfaces
```

### The Data Flow
1. **Edge Delivery:** Vercel serves the heavily-cached React frontend to the client.
2. **Type-Safe Ingress:** HTTP Requests hit the Railway-hosted Express server. Routes instantly validate payloads against the exact same Zod schemas compiled in the `shared` workspace.
3. **Deep Processing:** Express executes business logic and interfaces with the Aiven MySQL database via Prisma ORM.

---

## 🔒 Security Hardening

*   **Zod Strict Validation:** Absolutely no data touches the controllers without passing rigorous Zod type-checking.
*   **Encrypted State:** Admin sessions rely on hardened, `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
*   **Audit Logging:** Mutative actions within the dashboard are tracked and stamped in an immutable `AuditLog` table.
*   **WhatsApp Defense:** Client tracking dashboards are secured behind an involuntary 2FA WhatsApp lock to mask PII.

---

## 💻 Local Developer Setup

To run this platform locally, follow these execution bounds.

### 1. Prerequisites
- **Node.js 20 LTS or 22 LTS** (Node 24 has known npm 11 + workspace bugs)
- **MySQL 8.0+** — either install [Laragon](https://laragon.org/) (recommended, Windows) which gives you MySQL with one click, OR run via Docker
- **Git**

### 2. Clone & Install Dependencies
Initialize the monorepo from the root directory to link the workspaces.
```bash
git clone <your-repo-url>
cd DFDWebsite
npm install
```

### 3. Database (choose one)

**Option A — Laragon (easiest)**
1. Open Laragon → Start All
2. Open HeidiSQL or `mysql -u root` and run:
   ```sql
   CREATE DATABASE dfd_agency CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Copy `server/.env.example` to `server/.env`. The default `DATABASE_URL` already points to Laragon's MySQL:
   ```
   DATABASE_URL="mysql://root@localhost:3306/dfd_agency?connection_limit=5"
   ```

**Option B — Docker (no Laragon required)**
```bash
docker compose up -d
```
Creates MySQL on `localhost:3306`, database `dfd_agency`, user `root`, no password. The same `DATABASE_URL` works.

### 4. Build the Shared Workspace (Critical)
The server cannot boot unless it has native local access to the compiled shared logic.
```bash
cd shared
npm run build
```

### 5. Generate Prisma Client + Migrate Database
```bash
cd ../server
npx prisma generate
npx prisma migrate deploy
```

If this is a fresh database, the migrations create all tables. You can also seed default data:
```bash
npm run prisma:seed
```
This creates a `superadmin` user (email `admin@dfdagency.com`, password `superadmin123`) and three default packages.

### 6. Start the Servers

Backend (port 5000):
```bash
npm run dev
```

Frontend (port 3000, in a new terminal):
```bash
cd ../client
npm run dev
```

Visit `http://localhost:3000` for the public site, `http://localhost:3000/admin/login` for the admin.

### 7. Production Database
Point `DATABASE_URL` to your managed MySQL (Aiven, PlanetScale, etc.):
```
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DBNAME?ssl-mode=REQUIRED&connection_limit=5"
```
Then re-run `npx prisma migrate deploy`. No code changes needed.

---

## 🗄️ Database Conventions

- **Soft delete everywhere**: every table has `deletedAt: DateTime?`. Queries filter on `deletedAt: null` by default.
- **Indexes** are pre-declared on every foreign key and every column used in `WHERE` filters (see `prisma/schema.prisma`).
- **Never use `include`** in services — always use `select` to limit the columns returned. Reduces bandwidth and forces you to think about which fields are needed.
- **Service layer** owns all Prisma queries. Controllers should call services, not `prisma.xxx` directly. The only exception is the `ownsOrder` permission check on the client portal, which needs to span multiple models.
- **In-memory cache** (`server/src/lib/cache.ts`) is used for hot read paths: package list, project list, active promo, articles, settings. TTL is 60s by default. Writes invalidate the relevant keys. Replace with Redis if you scale to multiple instances.

---
*Engineered by Davin Yasa & DFD Architecture.*
