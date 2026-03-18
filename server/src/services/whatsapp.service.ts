import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import { AuditService } from './audit.service';

export type WAStatus = 'DISCONNECTED' | 'INITIALIZING' | 'CONNECTED';

class WAClient {
    private client: Client;
    private status: WAStatus = 'DISCONNECTED';
    private qrCodeCache: string | null = null;
    private phoneRegex = /^(?:\+62|62|0)[2-9]\d{7,11}$/;

    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth({ clientId: "dfd-agency-bot" }),
            puppeteer: {
                executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ],
            }
        });

        this.setupListeners();
    }

    private setupListeners() {
        this.client.on('qr', async (qr) => {
            console.log('[WhatsApp] QR RECEIVED');
            this.status = 'DISCONNECTED';
            try {
                this.qrCodeCache = qr; // Storing raw string, frontend uses qrcode.react
            } catch (err) {
                console.error('[WhatsApp] QR Error', err);
            }
        });

        this.client.on('ready', () => {
            console.log('[WhatsApp] Client is READY');
            this.status = 'CONNECTED';
            this.qrCodeCache = null;
            AuditService.log(1, 'WA_CONNECT', 'System', { message: 'WhatsApp Bot Connected Successfully' });
        });

        this.client.on('authenticated', () => {
            console.log('[WhatsApp] AUTHENTICATED');
            this.status = 'INITIALIZING';
        });

        this.client.on('auth_failure', msg => {
            console.error('[WhatsApp] AUTHENTICATION FAILURE', msg);
            this.status = 'DISCONNECTED';
            this.qrCodeCache = null;
            AuditService.log(1, 'WA_AUTH_FAIL', 'System', { message: msg });
        });

        this.client.on('disconnected', (reason) => {
            console.log('[WhatsApp] Client was DISCONNECTED', reason);
            this.status = 'DISCONNECTED';
            this.qrCodeCache = null;
            AuditService.log(1, 'WA_DISCONNECT', 'System', { reason });
            // Attempt to restart
            this.initialize();
        });
    }

    public async initialize() {
        if (this.status === 'CONNECTED') return;
        console.log('[WhatsApp] Initializing client...');
        this.status = 'INITIALIZING';
        this.qrCodeCache = null;
        try {
            await this.client.initialize();
        } catch (error) {
            console.error('[WhatsApp] Initialization failed. If this is a RAM issue, configure swap or use lightweight browser args.', error);
            this.status = 'DISCONNECTED';
        }
    }

    public async logout() {
        try {
            await this.client.logout();
            this.status = 'DISCONNECTED';
            this.qrCodeCache = null;
            await this.client.destroy();
            await this.initialize(); // restart fresh to get new QR
        } catch (err) {
            console.error('[WhatsApp] Logout error', err);
        }
    }

    public getStatus() {
        return this.status;
    }

    public getQRCode() {
        return this.qrCodeCache;
    }

    public formatIndonesianNumber(phone: string): string {
        let clean = phone.replace(/\D/g, '');
        if (clean.startsWith('0')) {
            clean = '62' + clean.substring(1);
        } else if (!clean.startsWith('62')) {
            clean = '62' + clean;
        }
        return `${clean}@c.us`;
    }

    public async sendMessage(to: string, message: string): Promise<boolean> {
        if (this.status !== 'CONNECTED') {
            console.warn(`[WhatsApp] Cannot send message to ${to}, client is not connected.`);
            return false;
        }

        try {
            const formattedNumber = this.formatIndonesianNumber(to);
            // @ts-ignore - Library types might be out of sync with response object
            const response = await this.client.sendMessage(formattedNumber, message);
            return !!response.id.id;
        } catch (error) {
            console.error(`[WhatsApp] Failed to send message to ${to}:`, error);
            return false;
        }
    }
}

// Export singleton instance
export const WhatsAppService = new WAClient();
