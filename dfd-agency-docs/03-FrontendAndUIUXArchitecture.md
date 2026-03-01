## FRONTEND & UI/UX ARCHITECTURE (NEXT.JS)
**[ATTENTION AI AGENT]**: The frontend is responsible for conversion, speed, and seamless user experience. It must be strictly decoupled from direct database access (use Express API endpoints).

**1. Landing Page Structure (14 Sections):**
The main page must flow logically to maximize UMKM client conversion:
1. `Navbar` (Sticky, transparent to solid on scroll)
2. `Hero Section` (High impact headline + Primary CTA)
3. `Client Logos / Tech Stack` (Social proof/trust)
4. `Pain Points` (Relatable SME problems)
5. `Solution & Benefit` (Why choose this agency)
6. `Workflow` (4 simple steps: Order -> Brief -> Code -> Launch)
7. `Comparison Table` (Agency vs. DIY/Traditional)
8. `Portfolio Showcase` (Filterable tabs, using Next.js `<Image />` for WebP optimization)
9. `Testimonials` (Carousel or masonry grid)
10. `Pricing` (Dynamic cards fetched from API, distinct CTA buttons)
11. `Team` (The 3 founders)
12. `FAQ` (Accordion using Shadcn UI)
13. `Final CTA` (Urgency driven)
14. `Footer` (Links, Legal, Contacts)

**2. Global UI Features:**
- **Floating WhatsApp Button:** Fixed at bottom-right, deeply linked with pre-filled messages.
- **Image Optimization Strategy:** To prevent Vercel over-billing, the Next.js `<Image />` component MUST be configured with a custom `loader` function that points directly to Cloudinary's transformation API.
- **Animations:** Framer Motion (High-End Eye Candy Strategy).  
- **The Feel:** Aim for "Fluid & Weightless". The animations must feel like butter—smooth, intentional, and high-end.
- **Easing:** Use custom cubic-bezier curves instead of default "spring". Specifically: `[0.22, 1, 0.36, 1]` (Quintic Out) for a smooth deceleration that feels premium.
- **Micro-Interactions:** - **Staggered Reveals:** When a section enters the viewport, elements (like cards or text lines) must reveal one by one with a tiny delay (`staggerChildren: 0.1`).
  - **Hover Effects:** Use very subtle scaling (`scale: 1.02`) and soft border-color shifts.
  - **Smooth Scroll:** Implement a subtle parallax or smooth-scroll feel using Framer Motion's `useScroll` and `useTransform` for the Hero image.
- **Performance:** Keep it lightweight by only animating `opacity`, `transform (x, y)`, and `scale`. Avoid animating heavy properties like `width`, `height`, or `filters` which cause layout thrashing.
- **Markdown Pages:** The `/terms` (Syarat & Ketentuan) and `/blog/[slug]` pages MUST use `@tailwindcss/typography` (`prose` class) to render Markdown content beautifully.
- **Data Freshness (ISR):** Expose an On-Demand Revalidation endpoint (e.g., `POST /api/revalidate`) so the Express backend can instantly clear Next.js cache when an Admin updates DB records.
- **SEO Sync (Metadata API):** In Next.js, `generateMetadata()` functions MUST use the same `fetch` tags/revalidation logic as the page components. This ensures the ISR webhook clears both the body and the `<head>` metadata (SEO titles/descriptions) simultaneously.

**3. Client Tracking Portal (Magic Link):**
- Route: `/track/[orderId]` (Dynamic route).
- **No Login Required:** This page uses the UUID from the `Order` table to securely fetch and display real-time project status (Timeline/Progress bar) without requiring the client to create an account.

---

## ⚙️ 6. CORE BUSINESS FLOWS & AUTOMATION
The backend must handle these specific automation flows to ensure the agency runs on "Autopilot".

**1. Self-Serve Checkout Flow:**
- **Trigger:** Client selects a package and fills out the brief form.
- **Action:** Express API validates via Zod -> Creates `Lead` -> Creates `Order` (Idempotency checked) -> Generates Midtrans QRIS/VA link.
- **Webhook:** Midtrans sends success payload -> Express updates `Payment` and `Order` status to `PROCESSING` -> Triggers Telegram Bot to alert the Admin team -> Triggers WhatsApp API/Bot to send the "Magic Tracking Link" to the client.

**2. Automated Cron Jobs (`node-cron`):**
- **Auto-Renewal Reminder:** Runs daily at 08:00 AM. Scans `Project` table for `domainExpiryDate` exactly 30 days from today. If found, dispatches a WhatsApp reminder with a payment link.
- **Auto-Testimonial Request:** Runs daily. Scans `Order` table for status `COMPLETED` where `updatedAt` is exactly 7 days ago. Dispatches a WhatsApp message asking for a review.
- **Database Backup:** Runs daily at midnight. Dumps the MySQL database and uploads the `.sql` file to Cloud Storage or sends it via Telegram.

**3. AI-Powered CMS (Admin Panel):**
- Inside the custom Next.js Admin Dashboard, integrate an AI generation endpoint.
- **Feature:** A "Generate Copywriting" button on the `Project` and `Article` creation forms.
- **Action:** Calls an Express endpoint that securely communicates with an LLM API (e.g., Google Gemini API) to auto-generate SEO titles, descriptions, and marketing copy based on short prompts.

---

## 🔌 7. EXPRESS.JS API STANDARDS
**[ATTENTION AI AGENT]**: When generating the Express.js backend, strictly use the following patterns:

**1. Project Structure:**
```text
/server
  ├── /controllers    (Business logic)
  ├── /routes         (Express router definitions)
  ├── /middlewares    (Auth, Zod validation, Error handler, Rate limit)
  ├── /services       (External APIs: Midtrans, Cloudinary, Telegram)
  ├── /prisma         (Prisma client instance)
  ├── /utils          (Helpers, Idempotency generators)
  └── index.ts        (Entry point, Helmet, CORS config)
Note: The /server and /client directories must have their own independent package.json files and node_modules.

2. Standardized JSON Response
All API endpoints MUST return a consistent JSON structure:

JSON
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": { ... },
  "error": null
}
3. Global Error Handling & Sentry:

Do not let the server crash on unhandled promise rejections.

Implement a global Express error-handling middleware.

Integrate Sentry.io initialization at the top of index.ts to catch and report all 500-level errors silently to the team's dashboard.
- **Shared Validation:** If possible, create a /shared folder at the root to store Zod schemas that can be used by both the Express backend and Next.js frontend to ensure data consistency.