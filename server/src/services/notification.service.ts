/**
 * NotificationService
 * Standardized interface for sending alerts to the agency team.
 * Currently supports a simple console logger, designed to be easily 
 * replaced with Telegram Bot API or WhatsApp Business API.
 */

interface NotifiableLead {
    name: string;
    whatsapp: string;
    businessName: string | null;
    message: string | null;
}

interface NotifiableOrder {
    id: string;
    totalAmount: number | bigint | { toString(): string };
    status: string;
}

export class NotificationService {
    /**
     * Notify Admin of a new Lead
     */
    static async notifyNewLead(lead: NotifiableLead) {
        const message = `🚀 *NEW LEAD RECEIVED*\n\n` +
            `👤 Name: ${lead.name}\n` +
            `📱 WA: ${lead.whatsapp}\n` +
            `🏢 Business: ${lead.businessName || 'N/A'}\n` +
            `💬 Message: ${lead.message || 'N/A'}`;

        await this.logToAgency('TELEGRAM', message);
    }

    /**
     * Notify Admin of a new Order
     */
    static async notifyNewOrder(order: NotifiableOrder, lead: NotifiableLead) {
        const message = `💰 *NEW ORDER RECEIVED*\n\n` +
            `🆔 Order ID: ${order.id}\n` +
            `👤 Client: ${lead.name}\n` +
            `📦 Amount: Rp ${Number(order.totalAmount).toLocaleString('id-ID')}\n` +
            `🔗 Status: ${order.status}`;

        await this.logToAgency('TELEGRAM', message);
    }


    /**
     * Unified logging / dispatching (Internal)
     */
    private static async logToAgency(channel: 'TELEGRAM' | 'WHATSAPP', message: string) {
        if (channel === 'TELEGRAM') {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            const chatId = process.env.TELEGRAM_CHAT_ID;

            if (botToken && chatId) {
                try {
                    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: message,
                            parse_mode: 'Markdown'
                        })
                    });
                } catch (error) {
                    console.error('Telegram notification failed:', error);
                }
            }
        }

        // Always log to console as fallback/audit
        console.log(`[AGENCY_ALERT][${channel}]:\n${message}\n-------------------`);
    }
}

