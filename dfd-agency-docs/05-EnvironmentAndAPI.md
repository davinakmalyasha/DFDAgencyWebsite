##  ENVIRONMENT VARIABLES (.env BLUEPRINT)
**[ATTENTION AI AGENT]**: When setting up the project, use the following standardized environment variable keys. Ensure these are referenced correctly in both Express.js and Next.js.

**Backend (Express.js) `.env`:**
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database (Prisma)
DATABASE_URL="mysql://user:password@localhost:3306/dfd_agency"

# Security
JWT_SECRET="super_secure_random_string"
JWT_EXPIRES_IN="7d"

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY="SB-Mid-server-..."
MIDTRANS_IS_PRODUCTION=false

# Cloud Storage (Cloudinary)
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"

## Frontend (Next.js) .env.local:

NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-..."

## API ENDPOINT CONTRACT (RESTful STANDARDS)
**[ATTENTION AI AGENT]**: When generating the Express.js routes, strictly follow these RESTful patterns and Base URL: `/api/v1`

**1. Authentication (`/auth`)**
- `POST /api/v1/auth/login` : Admin login (Returns HttpOnly Cookie)
- `POST /api/v1/auth/logout` : Admin logout (Clears Cookie)

**2. Users (`/users` - Admin Only)**
- `GET /api/v1/users` : List all users
- `POST /api/v1/users` : Create new user
- `GET /api/v1/users/:id` : Get user details
- `PUT /api/v1/users/:id` : Update user
- `DELETE /api/v1/users/:id` : Delete user

**3. Packages (`/packages`)**
- `GET /api/v1/packages` : List active packages (Public)
- `GET /api/v1/packages/:slug` : Get package details (Public)
- `POST /api/v1/packages` : Create new package (Admin)
- `PUT /api/v1/packages/:id` : Update package (Admin)
- `DELETE /api/v1/packages/:id` : Soft delete package (Admin)

**4. Projects & Images (`/projects`)**
- `GET /api/v1/projects` : List projects (Public)
- `GET /api/v1/projects/:slug` : Get project details (Public)
- `POST /api/v1/projects` : Create new project (Admin)
- `PUT /api/v1/projects/:id` : Update project (Admin)
- `DELETE /api/v1/projects/:id` : Soft delete project (Admin)
- `POST /api/v1/projects/:projectId/images` : Upload project image (Admin)
- `DELETE /api/v1/projects/:projectId/images/:imageId` : Delete project image (Admin)

**5. Promos (`/promos`)**
- `GET /api/v1/promos/active` : Get active promo banner (Public)
- `GET /api/v1/promos` : List all promos (Admin)
- `POST /api/v1/promos` : Create new promo (Admin)
- `PUT /api/v1/promos/:id` : Update promo (Admin)
- `DELETE /api/v1/promos/:id` : Delete promo (Admin)

**6. Leads (`/leads`)**
- `POST /api/v1/leads` : Submit lead inquiry (Public)
- `GET /api/v1/leads` : List all leads (Admin)
- `GET /api/v1/leads/:id` : Get lead details (Admin)
- `PATCH /api/v1/leads/:id/status` : Update lead status (Admin)
- `DELETE /api/v1/leads/:id` : Soft delete lead (Admin)

**7. Orders & Tracking (`/orders`)**
- `POST /api/v1/orders` : Create new order/checkout (Public)
- `GET /api/v1/orders/track/:orderId` : Magic Link Tracking (Public - No Login)
- `GET /api/v1/orders` : List all orders (Admin)
- `GET /api/v1/orders/:id` : Get order details (Admin)
- `PATCH /api/v1/orders/:id/status` : Update order status (Admin)
- `DELETE /api/v1/orders/:id` : Soft delete order (Admin)

**8. Payments (`/payments`)**
- `POST /api/v1/payments/webhook` : Midtrans Webhook listener (Public)
- `GET /api/v1/payments/:orderId` : Get payment details by Order ID (Admin)

**9. Articles (`/articles`)**
- `GET /api/v1/articles` : List published articles (Public)
- `GET /api/v1/articles/:slug` : Get article details (Public)
- `POST /api/v1/articles` : Create new article (Admin)
- `PUT /api/v1/articles/:id` : Update article (Admin)
- `DELETE /api/v1/articles/:id` : Soft delete article (Admin)

**10. Global Settings (`/settings`)**
- `GET /api/v1/settings` : Get current active settings (Public)
- `PUT /api/v1/settings` : Update global settings (Admin)

**11. AI Generator (`/ai`)**
- `POST /api/v1/ai/generate-copy` : Generate SEO/marketing copy (Admin)