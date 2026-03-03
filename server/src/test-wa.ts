import { Client, LocalAuth } from 'whatsapp-web.js';

console.log('Starting Test WA Client...');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "test-bot" }),
    puppeteer: {
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

client.on('qr', (qr) => {
    console.log('QR RECEIVED!');
    process.exit(0);
});

client.on('ready', () => {
    console.log('Client is ready!');
    process.exit(0);
});

client.initialize().catch(err => {
    console.error('CRASH:', err);
    process.exit(1);
});
