## EXECUTION PHASES (VIBE CODING WORKFLOW)
**[ATTENTION AI AGENT]**: You must execute the development of this platform in the exact order specified below. Do not jump to Frontend UI until the Database and Core API are fully functional and tested.

### Phase 1: Infrastructure & Database Initialization
1. Initialize a monorepo or separate folders for `/client` (Next.js) and `/server` (Express).
2. Initialize `package.json` and install base dependencies for both environments.
3. Setup Prisma (`npx prisma init`) and paste the complete `schema.prisma` defined in Section 4.
4. Run Prisma migrations to generate the MySQL database tables.
5. **CRITICAL FIRST BOOT**: Run the Prisma seed script (`npx prisma db seed`) to initialize `GlobalSettings` and the `SUPERADMIN` user to prevent application crashes on first run.

### Phase 2: Core Backend API & Security (Express.js)
1. Setup the Express server (`index.ts`) with `helmet`, `cors` (strict origin), and `express-rate-limit`.
2. Implement the JWT Authentication flow (Login) using `bcryptjs` and `HttpOnly` cookies.
3. Build the Zod validation schemas for all incoming payloads.
4. Build the CRUD endpoints for `Users`, `Packages`, `Projects`, `Articles`, and `GlobalSettings`.
5. Integrate the Cloud Storage provider (Cloudinary/Supabase) for image upload endpoints.

### Phase 3: Business Logic & Integrations
1. Build the Public Order endpoint (Checkout): Handle Idempotency, insert to `Leads` and `Orders`.
2. Integrate the Midtrans API: Generate payment links and create the Webhook listener endpoint to automatically update `Payment` and `Order` statuses (Enforce strict idempotency to handle webhook retries and handle `expire` status to garbage collect unpaid orders).
3. Implement `node-cron` jobs: Auto-backup DB, 30-day domain expiry reminders, and 7-day testimonial requests.
4. Setup Telegram Bot API to send real-time alerts to the Admin group upon new orders or errors.
    - **RESILIENCE**: Implement error debouncing and `try/catch` for `HTTP 429` (Rate Limit) errors to prevent the Express server from crashing during traffic spikes or error loops.

### Phase 4: Admin Dashboard (Next.js - Protected)
1. Setup Next.js App Router with a protected layout (`/admin/*`).
2. Build the Login page handling the HttpOnly cookie response.
3. Build the CRUD UI tables and forms using Shadcn UI and React Hook Form (Ensure API calls trigger Next.js cache revalidation).
4. Integrate the "AI Copywriting" button (calling Google Gemini API/OpenAI) inside the Project and Article creation forms.

### Phase 5: Public Frontend & UI/UX (Next.js - Public)
1. Build the 14-section Landing Page following the exact structure in Section 5.
2. Use Google Stitch components (if provided) and wrap them with Framer Motion for scroll animations.
3. Implement the dynamic Pricing section (fetching from the `packages` API).
4. Build the Order Form modal/page with the mandatory T&C agreement checkbox.
5. Build the Magic Link Tracking Page (`/track/[orderId]`) fetching public timeline data.
6. Build the Legal Pages (`/terms`, `/privacy`) using `@tailwindcss/typography` to render Markdown files.

### Phase 6: Final Polish & Deployment
1. Integrate Sentry.io on both Frontend and Backend for silent error tracking.
2. Add JSON-LD Schema markup in the Next.js `<head>` for Local Business SEO.
3. Generate the automated `sitemap.xml` and `robots.txt`.
4. Deploy Frontend to Vercel and Backend to Railway/Render (or VPS).

**[END OF BLUEPRINT] - AGENT, ACKNOWLEDGE THESE INSTRUCTIONS AND AWAIT THE FIRST PROMPT.**