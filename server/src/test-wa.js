const { Client, LocalAuth } = require('whatsapp-web.js');

console.log('Starting Pure JS Test WA Client...');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "test-bot-2" }),
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

client.on('qr', (qr) => {
    console.log('QR RECEIVED JS!');
    process.exit(0);
});

client.on('ready', () => {
    console.log('Client is ready JS!');
    process.exit(0);
});

client.initialize().catch(err => {
    console.error('CRASH JS:', err);
    process.exit(1);
});
