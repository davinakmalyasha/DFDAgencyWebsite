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

To run this platform locally, follow these strict execution bounds.

### 1. Install Dependencies
Initialize the monorepo from the root directory to link the workspaces.
```bash
npm install
```

### 2. Environment Variables
You must inject `.env` files into both the `client/` and `server/` directories.

**client/.env**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

**server/.env**
```env
PORT=5000
DATABASE_URL="mysql://user:pass@host:port/db"
JWT_SECRET="your_secure_secret"
CLOUDINARY_URL="cloudinary://..."
```

### 3. Build the Shared Workspace (Critical)
The server cannot boot unless it has native local access to the compiled shared logic.
```bash
cd shared
npm run build
```

### 4. Ignite the Servers
Boot the backend API:
```bash
cd server
npx prisma generate
npx prisma db push
npm run dev
```

Boot the frontend React interface:
```bash
cd client
npm run dev
```

---
*Engineered by Davin Yasa & DFD Architecture.*
