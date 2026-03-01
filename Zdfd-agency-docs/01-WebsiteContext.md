#  MASTER ARCHITECTURE BLUEPRINT: AI-POWERED WEB AGENCY (SaaS-Level)

##  1. PROJECT OVERVIEW
This document serves as the absolute Single Source of Truth (SSOT) for the development of an automated, AI-first web agency platform. This system is designed not just as a digital brochure, but as an **Automated SaaS Agency** targeting SMEs (UMKM) in Indonesia.

The development is driven by a 3-person team utilizing **Architecture-Driven Vibe Coding** (leveraging AI Agents like Google Antigravity for backend/logic and Google Stitch for UI/UX).

**Core System Objectives:**
1. **Maximum Performance & SEO:** Blazing fast load times and perfect Core Web Vitals.
2. **Enterprise-Grade Security:** Bank-level protection against common web vulnerabilities.
3. **Full Business Automation:** Automated ordering, payment webhook integration, real-time tracking, and auto-renewal reminders.
4. **Frictionless UX:** Zero-friction client journey (No mandatory user registration/login for clients; utilizing Magic Link tracking instead).

---

##  2. TECH STACK & ARCHITECTURE
This project adopts a **Decoupled Architecture** (Separate Frontend and Backend) to ensure maximum scalability, security, and performance.

**Frontend (Client-Side / UI):**
- **Framework:** Next.js (App Router).
- **Styling:** Tailwind CSS.
- **Design System & Aesthetics (CRITICAL):** Strictly Minimalist & Monochrome. The primary background MUST be pure White (`bg-white`), and all primary text, borders, and UI elements MUST be pure Black (`text-black`). Exclude all other colors, heavy gradients, or thick drop-shadows. Achieve a "Premium & Modern" look by relying heavily on generous negative space (whitespace), crisp typography, and sharp borders.
- **UI Components:** Shadcn UI (for rapid, accessible component generation). Configure Shadcn to use the minimalist monochrome aesthetic (e.g., black buttons with white text, thin black borders for cards).
- **Animations:** Framer Motion (for premium micro-interactions). Keep animations extremely lightweight and The vibe is "High-end Luxury SaaS".
- **Typography:** `@tailwindcss/typography` plugin (for rendering Markdown content perfectly with high-contrast black-on-white text).


**Backend (Server-Side / REST API):**
- **Runtime & Framework:** Node.js with Express.js.
- **Language:** TypeScript (Mandatory for strict type-checking and Zod integration).
- **Validation Engine:** Zod.
- **ORM:** Prisma ORM.
- **Database:** MySQL (Relational DB).

**External Integrations & Infrastructure:**
- **Media Storage:** Cloudinary or Supabase Storage (Strictly no local file storage).
- **Payment Gateway:** Midtrans (QRIS, Virtual Account integration).
    - **Security:** Webhooks MUST verify the `signature_key` provided by Midtrans to prevent spoofing.
- **Error Tracking:** Sentry.io (Real-time bug monitoring).
- **Notifications:** Telegram Bot API / WhatsApp API Gateway (For team alerts and client updates).

---

## 3. STRICT SECURITY & ENTERPRISE STANDARDS
**[ATTENTION AI AGENT]**: You must strictly adhere to the following security protocols without exception. Any code generated must comply with these rules:

1. **Authentication (Admin-Only Portal):**
   - The login system is strictly for Internal Admins. Clients do not create accounts.
   - Use **JWT (JSON Web Tokens)** for session management.
   - **CRITICAL:** JWTs MUST be stored in **HttpOnly, Secure, SameSite=Strict Cookies**. Never store tokens in `localStorage` or `sessionStorage` to prevent XSS attacks.
   - **CSRF Protection:** Since we use cookies for auth, the Express backend MUST implement strict CSRF protection (e.g., verifying `Origin` and `Referer` headers for state-changing requests or using CSRF tokens).
   - All passwords in the database must be hashed using `bcryptjs`.

2. **Input Sanitization & Validation:**
   - Every incoming request (`req.body`, `req.query`, `req.params`) MUST be validated using **Zod schemas**.
   - Reject any invalid payloads immediately before they reach the database controllers.

3. **Server Protection (Middlewares):**
   - Implement `helmet` to secure HTTP headers.
   - **CRITICAL Infrastructure:** Configure Express to trust reverse proxies (`app.set('trust proxy', 1)`) so rate limiters work correctly when deployed behind Cloudflare/Render/Nginx proxy walls.
   - Implement `express-rate-limit` to prevent brute-force attacks, DDoS, and form spamming.
   - Implement **Strict CORS Whitelisting** (The Express API must only accept requests from the official Next.js frontend domain).

4. **Data Integrity (Anti-Oops System):**
   - **Soft Deletes:** DO NOT use direct SQL `DELETE` queries for critical tables (Projects, Orders, Leads). Implement a `deleted_at` (TIMESTAMP) column. Default all `SELECT` queries to filter out records where `deleted_at IS NOT NULL`.
   - **Idempotency:** Implement idempotency keys or strict session checks on the Checkout/Order endpoints to prevent duplicate database entries if a user double-clicks the submit button.

5. **Legal & Audit Trail:**
   - Every checkout form MUST include a mandatory Terms & Conditions checkbox.
   - The database MUST record the exact timestamp when the user agreed to the terms (`agreed_to_terms_at`).

6. **File Management Protocol:**
   - Never save uploaded files (images, documents) to the local server disk.
   - All media uploads must be streamed directly to Cloud Storage (Cloudinary/Supabase), storing only the returned secure URL in the MySQL database.

   