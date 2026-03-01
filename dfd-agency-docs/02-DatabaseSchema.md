## DATABASE ARCHITECTURE (PRISMA SCHEMA)
**[ATTENTION AI AGENT]**: Below is the definitive Prisma ORM schema (`schema.prisma`). Use MySQL as the provider. Adhere strictly to these field names, types, and relations. 

Critical constraints:
- Implement Soft Deletes (`deletedAt DateTime?`) on major entities.
- Use `UUID` or NanoID for `Order` and `Payment` IDs to secure the "Magic Link Tracking" feature (preventing URL guessing).

```prisma
// This is the blueprint for schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// 1. ADMIN USERS (The Agency Team)
model User {
  id           Int        @id @default(autoincrement())
  username     String     @unique
  email        String     @unique
  passwordHash String     // Must be bcrypt hashed
  role         Role       @default(EDITOR)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  
  AuditLogs    AuditLog[]
  Articles     Article[]
}

enum Role {
  SUPERADMIN
  EDITOR
}

// 2. PACKAGES (Dynamic Pricing & Offerings)
model Package {
  id            Int       @id @default(autoincrement())
  name          String
  slug          String    @unique
  price         Decimal   @db.Decimal(10, 2)
  discountPrice Decimal?  @db.Decimal(10, 2) // Optional crossed-out price
  features      Json      // Array of feature strings
  isActive      Boolean   @default(true)
  sortOrder     Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Soft delete

  Orders        Order[]
}

// 3. PROJECTS (The Portfolio Engine)
model Project {
  id                 Int       @id @default(autoincrement())
  title              String
  slug               String    @unique
  clientName         String
  category           Category
  thumbnailUrl       String    // Stored in Cloudinary/Supabase
  description        String    @db.Text // Long Markdown/HTML content
  techStack          Json      // Array of strings
  
  // The "3 Specific Data Points" for Trust
  duration           String    // e.g., "3 Days"
  testimonialQuote   String?   @db.Text
  testimonialAuthor  String?
  maintenanceStatus  MaintenanceStatus @default(CLIENT_MANAGED)
  
  // Passive Income / Auto-Renewal Engine
  domainExpiryDate   DateTime? 
  
  // SEO & Analytics
  seoTitle           String?
  seoDescription     String?
  viewsCount         Int       @default(0)
  isFeatured         Boolean   @default(false)

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  deletedAt          DateTime? // Soft delete

  Images             ProjectImage[]
}

enum Category {
  FNB
  RETAIL
  SERVICES
  CORPORATE
}

enum MaintenanceStatus {
  ACTIVE
  INACTIVE
  CLIENT_MANAGED
}

// 4. PROJECT IMAGES (Portfolio Gallery)
model ProjectImage {
  id         Int      @id @default(autoincrement())
  projectId  Int
  imageUrl   String
  caption    String?
  sortOrder  Int      @default(0)
  
  Project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // TAMBAHAN PERFORMA: Bikin query gambar project jadi kilat
  @@index([projectId])
}

// 5. PROMOS (Top Banner/Running Text)
model Promo {
  id         Int       @id @default(autoincrement())
  text       String
  linkUrl    String?
  isActive   Boolean   @default(false)
  startDate  DateTime?
  endDate    DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}

// 6. LEADS (Inquiries / CRM)
model Lead {
  id           Int        @id @default(autoincrement())
  name         String
  whatsapp     String
  businessName String?
  message      String?    @db.Text
  status       LeadStatus @default(NEW)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  deletedAt    DateTime?

  Orders       Order[]
}

enum LeadStatus {
  NEW
  CONTACTED
  CLOSED_WON
  CLOSED_LOST
}

// 7. ORDERS (Self-Serve Checkout System)
model Order {
  id               String      @id @default(uuid())
  leadId           Int
  packageId        Int
  totalAmount      Decimal     @db.Decimal(10, 2)
  briefData        Json        
  status           OrderStatus @default(PENDING_PAYMENT)
  agreedToTermsAt  DateTime    
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  deletedAt        DateTime?

  Lead             Lead        @relation(fields: [leadId], references: [id])
  Package          Package     @relation(fields: [packageId], references: [id])
  Payments         Payment[]

  @@index([leadId])
  @@index([packageId])
  @@index([status])
}

enum OrderStatus {
  PENDING_PAYMENT
  PROCESSING
  REVISION
  COMPLETED
  CANCELLED
}

// 8. PAYMENTS (Transaction Ledger)
model Payment {
  id                String        @id @default(uuid())
  orderId           String
  paymentMethod     String        
  paymentStatus     PaymentStatus @default(UNPAID)
  paymentProofUrl   String?       
  paidAt            DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  Order             Order         @relation(fields: [orderId], references: [id])

  @@index([orderId])
}

enum PaymentStatus {
  UNPAID
  PAID
  FAILED
  REFUNDED
}

// 9. AUDIT LOGS (Security Accountability)
model AuditLog {
  id         Int      @id @default(autoincrement())
  userId     Int
  action     String   
  target     String   
  details    Json?    
  ipAddress  String?
  createdAt  DateTime @default(now())

  User       User     @relation(fields: [userId], references: [id])

  @@index([userId])
}

// 10. ARTICLES (SEO Content Engine)
model Article {
  id           Int       @id @default(autoincrement())
  title        String
  slug         String    @unique
  content      String    @db.LongText
  thumbnailUrl String?
  authorId     Int
  isPublished  Boolean   @default(false)
  views        Int       @default(0)
  tags         Json?     
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  Author       User      @relation(fields: [authorId], references: [id])

  @@index([authorId])
  @@index([isPublished])
}

// 11. GLOBAL SETTINGS (Dynamic Configuration)
model GlobalSetting {
  id                 Int      @id @default(autoincrement())
  whatsappNumber     String
  emailContact       String
  officeAddress      String   @db.Text
  instagramLink      String?
  isMaintenanceMode  Boolean  @default(false)
  metaPixelId        String?
  googleAnalyticsId  String?
  updatedAt          DateTime @updatedAt
}