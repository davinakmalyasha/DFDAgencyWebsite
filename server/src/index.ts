console.log('[DEBUG] Server script starting...');
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
import articleRoutes from './routes/article.routes';
import promoRoutes from './routes/promo.routes';
import userRoutes from './routes/user.routes';
import aiRoutes from './routes/ai.routes';
import uploadRoutes from './routes/upload.routes';
import hostingRoutes from './routes/hosting.routes';
import auditRoutes from './routes/audit.routes';
import dashboardRoutes from './routes/dashboard.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import clientRoutes from './routes/client.routes';
import { csrfProtection } from './middlewares/csrf.middleware';
import { auditMiddleware } from './middlewares/audit.middleware';
import { globalSanitizer } from './middlewares/security.middleware';
import { CronService } from './services/cron.service';
import { WhatsAppService } from './services/whatsapp.service';

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('[FATAL] JWT_SECRET missing or too short — must be >=32 chars. Refusing to boot.');
    process.exit(1);
}

// Initialize Automated Business Logic (Non-blocking)
WhatsAppService.initialize().catch(err => console.error('[WhatsApp] Global Init Error:', err));
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
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "https://res.cloudinary.com"],
            "script-src": ["'self'", "'unsafe-inline'"], // Add as needed for Next.js or third-party scripts
        },
    },
}));
app.disable('x-powered-by');
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'https://dfd-agency-website.vercel.app',
        'https://dfdagencywebsite.vercel.app'
    ],
    credentials: true
}));

// Request Logger: structured, async, with request-id correlation (pino)
// Replaces the previous console + synchronous fs.appendFileSync logging which
// blocked the event loop on every request.
import pino from 'pino';
import pinoHttp from 'pino-http';

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    redact: {
        paths: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
        censor: '[REDACTED]'
    },
});

const httpLogger = pinoHttp({
    logger,
    // Log at debug for 2xx/3xx (quiet), info for 4xx, warn for 5xx
    customLogLevel: (req, res, err) => {
        if (err || res.statusCode >= 500) return 'warn';
        if (res.statusCode >= 400) return 'info';
        return 'debug';
    },
    autoLogging: process.env.NODE_ENV !== 'test',
});

app.use(httpLogger);

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
app.use(cookieParser(process.env.JWT_SECRET as string));

app.use(globalSanitizer);
app.use(csrfProtection);
app.use(auditMiddleware);

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
app.use('/api/v1/articles', articleRoutes);
app.use('/api/v1/promos', promoRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/hosting', hostingRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/v1/client', clientRoutes);
app.use('/api/v1/admin/audit', auditRoutes);

// Global Error Handling Middleware
app.use((err: any, req: any, res: any, next: any) => {
    logger.error({ err, url: req.url, method: req.method, ip: req.ip }, 'Unhandled error');

    const statusCode = err.statusCode || 500;
    // Never leak internal details (SQL fragments, stack traces) to clients.
    const isProd = process.env.NODE_ENV === 'production';
    const message = isProd && statusCode >= 500 ? 'Internal Server Error' : (err.message || 'Internal Server Error');
    res.status(statusCode).json({
        success: false,
        message: message,
        data: null,
        error: {
            name: err.name,
            message: isProd && statusCode >= 500 ? undefined : err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
    });
});

// Start Server
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running securely on port ${PORT}`);
});
