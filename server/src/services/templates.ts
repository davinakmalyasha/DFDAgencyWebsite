/**
 * Message template engine
 * Single source of truth for every customer-facing message (WA, email, telegram).
 * Add a new key here + a renderer; never hardcode strings elsewhere.
 */

export type TemplateKey =
    | 'DELIVERABLE'
    | 'STATUS_CHANGE'
    | 'REVISION_REQUEST'
    | 'PAYMENT_INSTRUCTIONS'
    | 'MEETING_INVITE'
    | 'GENERIC_GREETING'
    | 'TESTIMONIAL_REQUEST';

export interface TemplateContext {
    clientName?: string;
    businessName?: string;
    packageName?: string;
    orderId?: string;
    portalUrl?: string;
    milestoneTitle?: string;
    milestoneDescription?: string;
    milestoneCategory?: string;
    milestoneUrl?: string;
    coverUrl?: string;
    status?: string;
    handoffUrl?: string;
    invoiceUrl?: string;
    totalAmount?: string;
    meetingUrl?: string;
    meetingTime?: string;
    customMessage?: string;
}

const PORTAL_BASE = () => process.env.FRONTEND_URL || 'http://localhost:3000';

const greeting = (ctx: TemplateContext) => {
    const name = ctx.businessName || ctx.clientName || 'there';
    return `Hi ${name} 👋`;
};

export const TEMPLATES: Record<TemplateKey, (ctx: TemplateContext) => string> = {
    DELIVERABLE: (ctx) => {
        const lines = [
            greeting(ctx),
            '',
            `New update on your ${ctx.packageName || 'project'}:`,
            `• ${ctx.milestoneTitle || 'New deliverable'}`,
        ];
        if (ctx.milestoneDescription) lines.push(`— ${ctx.milestoneDescription}`);
        if (ctx.coverUrl) lines.push(`Preview: ${ctx.coverUrl}`);
        if (ctx.milestoneUrl) lines.push(`Open: ${ctx.milestoneUrl}`);
        const url = ctx.portalUrl || `${PORTAL_BASE()}/client/dashboard`;
        lines.push('', `View in your portal: ${url}`);
        lines.push('', '— DFD Agency');
        return lines.join('\n');
    },

    STATUS_CHANGE: (ctx) => {
        return [
            greeting(ctx),
            '',
            `Your project status just changed to *${ctx.status}*.`,
            ctx.handoffUrl ? `\nFinal assets: ${ctx.handoffUrl}` : '',
            '',
            `Track progress: ${ctx.portalUrl || `${PORTAL_BASE()}/client/dashboard`}`,
            '',
            '— DFD Agency',
        ].filter(Boolean).join('\n');
    },

    REVISION_REQUEST: (ctx) => {
        return [
            greeting(ctx),
            '',
            'We need a small revision from your side:',
            `• ${ctx.customMessage || 'Please review the latest update'}`,
            '',
            `Portal: ${ctx.portalUrl || `${PORTAL_BASE()}/client/dashboard`}`,
            '',
            '— DFD Agency',
        ].join('\n');
    },

    PAYMENT_INSTRUCTIONS: (ctx) => {
        return [
            greeting(ctx),
            '',
            `Thanks for ordering *${ctx.packageName}* at DFD Agency.`,
            '',
            `Order ID: ${ctx.orderId}`,
            `Total: Rp ${ctx.totalAmount || '—'}`,
            '',
            'Please transfer to:',
            '*BCA:* 1234 5678 90 (A.N. DFD Agency)',
            '',
            'Reply with the transfer proof so we can start right away 🙏',
        ].join('\n');
    },

    MEETING_INVITE: (ctx) => {
        return [
            greeting(ctx),
            '',
            'Quick meeting invite from DFD Agency:',
            ctx.meetingTime ? `When: ${ctx.meetingTime}` : '',
            ctx.meetingUrl ? `Link: ${ctx.meetingUrl}` : '',
            '',
            'See you there!',
        ].filter(Boolean).join('\n');
    },

    GENERIC_GREETING: (ctx) => {
        return [
            greeting(ctx),
            '',
            ctx.customMessage || 'Touching base on your project — let us know if you need anything.',
            '',
            '— DFD Agency',
        ].join('\n');
    },

    TESTIMONIAL_REQUEST: (ctx) => {
        return [
            greeting(ctx),
            '',
            `Your *${ctx.packageName}* project is wrapped 🎉`,
            'If you have 30 seconds, a short testimonial would mean the world to us:',
            `${ctx.portalUrl || `${PORTAL_BASE()}/client/dashboard`}`,
            '',
            'Thank you! — DFD Agency',
        ].join('\n');
    },
};

export function render(key: TemplateKey, ctx: TemplateContext): string {
    const tpl = TEMPLATES[key];
    if (!tpl) throw new Error(`Unknown template key: ${key}`);
    return tpl(ctx);
}

export function buildWhatsappLink(phone: string, message: string): string {
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '62' + digits.slice(1);
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
