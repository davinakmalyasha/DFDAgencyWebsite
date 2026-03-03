import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
// import * as Sentry from "@sentry/node"; // Enable after adding DSN
// import { nodeProfilingIntegration } from "@sentry/profiling-node";

import authRoutes from './routes/auth.routes';
import settingRoutes from './routes/setting.routes';
import packageRoutes from './routes/package.routes';
import projectRoutes from './routes/project.routes';
import leadRoutes from './routes/lead.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import articleRoutes from './routes/article.routes';
import promoRoutes from './routes/promo.routes';
import userRoutes from './routes/user.routes';
import aiRoutes from './routes/ai.routes';
import uploadRoutes from './routes/upload.routes';
import hostingRoutes from './routes/hosting.routes';
import auditRoutes from './routes/audit.routes';
import dashboardRoutes from './routes/dashboard.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import { csrfProtection } from './middlewares/csrf.middleware';
import { CronService } from './services/cron.service';
import { WhatsAppService } from './services/whatsapp.service';

dotenv.config();

// Initialize Automated Business Logic
WhatsAppService.initialize();
CronService.init();


/**
 * Sentry.io Error Tracking Initialization
 * Part of Phase 6: Stability & Performance
 */
/*
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});
*/

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Proxy for Rate Limiting behind reverse proxies (Nginx/Cloudflare/Render)
app.set('trust proxy', 1);

// Security Middlewares
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Apply the rate limiting middleware to all requests ONLY if strictly production
if (process.env.NODE_ENV === 'production') {
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 150,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: 'Too many requests from this IP, please try again later.'
    });
    app.use(limiter);
}

// Body Parsers & Cookie Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(csrfProtection);

// Base Route
app.get('/api/v1', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'DFD Agency API running securely',
        data: null,
        error: null
    });
});

// Auth Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/settings', settingRoutes);
app.use('/api/v1/packages', packageRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/articles', articleRoutes);
app.use('/api/v1/promos', promoRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/hosting', hostingRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);

// Global Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack); // Log the error stack for debugging
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        message: message,
        data: null,
        error: {
            name: err.name,
            message: err.message,
            // Optionally, include stack in development
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running securely on port ${PORT}`);
});
