// Type shim for broken npm install
// DELETE this file once `npm install` is working

declare module 'express' {
    export interface Request {
        method: string;
        url: string;
        originalUrl?: string;
        path?: string;
        ip: string;
        body: any;
        params: any;
        query: any;
        cookies: any;
        signedCookies?: any;
        headers: any;
        user?: any;
    }
    export interface Response {
        status(code: number): Response;
        json(body: any): Response;
        send(body: any): Response;
        download(path: string, callback?: (err: any) => void): Response;
        download(path: string, filename: string, callback?: (err: any) => void): Response;
        cookie(name: string, value: string, options?: any): Response;
        clearCookie(name: string, options?: any): Response;
        redirect(url: string): Response;
        on(event: string, listener: (...args: any[]) => void): Response;
        statusCode: number;
        headersSent: boolean;
        set(field: string, value: any): Response;
    }
    export type NextFunction = (err?: any) => void;
    export interface Express {
        use(...args: any[]): any;
        get(path: string, ...handlers: any[]): any;
        post(path: string, ...handlers: any[]): any;
        put(path: string, ...handlers: any[]): any;
        patch(path: string, ...handlers: any[]): any;
        delete(path: string, ...handlers: any[]): any;
        listen(port: number, host?: string, callback?: () => void): any;
        set?(setting: string, value: any): any;
        disable?(setting: string): any;
    }
    export interface Router {
        get(path: string, ...handlers: any[]): any;
        post(path: string, ...handlers: any[]): any;
        put(path: string, ...handlers: any[]): any;
        patch(path: string, ...handlers: any[]): any;
        delete(path: string, ...handlers: any[]): any;
        use(...args: any[]): any;
    }
    export function Router(): Router;
    const express: { (): Express; Router: typeof Router; json: any; urlencoded: any; static: any; raw: any };
    export default express;
}
declare module 'express-rate-limit';
declare module '@prisma/client' {
    // Stub - real client needs to be generated via `npx prisma generate`
    namespace Prisma {
        type InputJsonValue = any;
        const JsonNull: any;
        const DbNull: any;
    }
    const PrismaClient: any;
    const Prisma: typeof Prisma;
    const UserRole: any;
    export const LeadStatus: any;
    export const OrderStatus: any;
    export const MilestoneCategory: any;
    export const MilestoneStatus: any;
    export const ProjectCategory: any;
    export const HostingStatus: any;
    export const PaymentStatus: any;
    export const ProjectMaintenanceStatus: any;
    export const RequestStatus: any;
    export const RequestType: any;
    export const User: any;
    export const Lead: any;
    export const Order: any;
    export const Package: any;
    export const Project: any;
    export const ProjectImage: any;
    export const AuditLog: any;
    export const Article: any;
    export const Promo: any;
    export const Payment: any;
    export const Hosting: any;
    export const GlobalSetting: any;
    export const OrderNote: any;
    export const OrderResource: any;
    export const OrderMilestone: any;
    export const MilestoneView: any;
    export const OrderActivity: any;
    export const ClientRequest: any;
    export const Contract: any;
}
declare module 'cors';
declare module 'cookie-parser';
declare module 'helmet';
declare module 'bcryptjs';
declare module 'jsonwebtoken';
declare module 'multer';
declare module 'qrcode';
declare module 'node-cron';
declare module 'whatsapp-web.js';
declare module 'googleapis';
declare module 'pdfkit';
declare module 'dotenv' {
    const dotenv: { config: (opts?: any) => any };
    export default dotenv;
}
