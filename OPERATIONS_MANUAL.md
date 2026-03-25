# DFD Agency: Official Operations Manual

Welcome to the command center of **DFD Agency**. Your full-stack infrastructure is entirely decoupled, running on a global serverless edge network (Vercel) and a dedicated backend API (Railway) connected to a high-performance MySQL cloud database (Aiven).

This operations manual dictates exactly how to run your automated agency on a daily basis.

---

## 🔒 1. Accessing the Command Center

Your Master Admin account has been securely injected directly into the live database.

1. Go to **[Your Live Website URL]/admin/login**
2. **Email:** `davinyasa06@gmail.com`
3. **Password:** `davinadmin123` *(Change this when you are ready via standard practices)*

**Security Note:** 
The Dashboard is heavily protected by deep encryption bounds. All API requests made from the dashboard are sent via hardened `HttpOnly` JWT Cookies. Raw user variables are never exposed to `localStorage`.

---

## ⚙️ 2. The Order & Project Lifecycle

Your agency is automated. When a client initiates a project from the landing page, the pipeline triggers. Here is how you manage them:

### A. New Leads
*  When a user fills out the *"Initiate Project"* form, they are created as a `Lead` and an `Order` is generated in `PENDING_PAYMENT` status.
*  The client receives a Tracking Link that they must verify via WhatsApp OTP to access.

### B. Progression State
From the Admin Dashboard, switch the `Order Status` to progress the client's tracking dashboard automatically:
1. **`PENDING_PAYMENT`** → Awaiting invoice clearance.
2. **`PROCESSING`** → Payment cleared. Strategic Blueprinting and Engineering has begun.
3. **`REVISION`** → Delivering initial drafts for client feedback.
4. **`COMPLETED`** → Handover completed. Order locks and triggers the final Confetti animation for the client.

---

## 📱 3. Connecting WhatsApp Automation 

To ensure the server can automatically send WhatsApp OTPs and project lifecycle updates to clients, you must authorize your agency's WhatsApp number.

1.  Open your **Railway Dashboard**.
2.  Navigate to the **Backend Service** -> **Deployments** -> **View Logs**.
3.  The server uses `whatsapp-web.js`. On boot, it generates a giant **QR Code** directly in the terminal logs.
4.  Open WhatsApp on your mobile phone -> *Linked Devices* -> *Link a Device*.
5.  Scan the QR code in the Railway terminal.
6.  *Status:* Your server is now a fully functional WhatsApp bot.

---

## 🏗️ 4. Modifying the Website Content

Since this is a hard-coded React application (Next.js) optimized for peak 100/100 Lighthouse performance, there is no bulky WordPress-style CMS slowing down the frontend.

**To change text, pricing, or images:**
1. Open the project folder locally in VS Code or Cursor.
2. Navigate to `client/src/components/landing`.
3. Modify the text directly in the `.tsx` files (e.g., `HeroSection.tsx`, `PricingSection.tsx`).
4. Open the terminal and commit the code to GitHub:
   ```bash
   git add .
   git commit -m "update: modified pricing tiers"
   git push origin main
   ```
5. **Autopilot Deployment:** Vercel detects the GitHub push instantly, compiles the new React components into static HTML, and effortlessly deploys it to the global Edge network within 30 seconds. No further action needed.

---

*Mission Control complete. DFD Agency is fully operational.*
