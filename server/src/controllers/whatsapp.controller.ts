import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';

export class WhatsAppController {
    static getStatus(req: Request, res: Response) {
        const status = WhatsAppService.getStatus();
        return res.status(200).json({
            success: true,
            message: 'WhatsApp connection status retrieved',
            data: { status },
            error: null
        });
    }

    static getQR(req: Request, res: Response) {
        const qr = WhatsAppService.getQRCode();
        const status = WhatsAppService.getStatus();

        if (status === 'CONNECTED') {
            return res.status(400).json({ success: false, message: 'Already connected', data: null, error: 'Cannot fetch QR while connected' });
        }

        if (!qr) {
            return res.status(404).json({ success: false, message: 'QR not ready or bot initializing', data: null, error: 'QR Payload Null' });
        }

        return res.status(200).json({
            success: true,
            message: 'QR code fetched',
            data: { qr },
            error: null
        });
    }

    static async startSession(req: Request, res: Response) {
        // Fire and forget to avoid HTTP timeouts since Chromium takes 10-30s to boot
        WhatsAppService.initialize().catch(err => console.error('[WhatsApp] Async Init Error:', err));
        return res.status(200).json({
            success: true,
            message: 'WhatsApp initialization signaled',
            data: null,
            error: null
        });
    }

    static async logout(req: Request, res: Response) {
        await WhatsAppService.logout();
        return res.status(200).json({
            success: true,
            message: 'WhatsApp disconnected and session wiped',
            data: null,
            error: null
        });
    }
}
