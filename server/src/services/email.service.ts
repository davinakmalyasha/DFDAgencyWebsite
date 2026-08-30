export class EmailService {
    static async sendInviteEmail(to: string, inviteUrl: string, username: string) {
        const resendKey = process.env.RESEND_API_KEY;
        const from = process.env.EMAIL_FROM || 'DFD Agency <hello@dfdagency.com>';
        const subject = 'Your DFD Agency client portal invite';
        const html = `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
                <h2>Welcome, ${username}</h2>
                <p>Your client portal is ready. Click below to log in — no password needed for 48 hours. You'll stay logged in for 30 days after.</p>
                <p><a href="${inviteUrl}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px">Open your portal →</a></p>
                <p style="color:#666;font-size:13px">Link: <a href="${inviteUrl}">${inviteUrl}</a><br/>Expires in 48 hours. If you didn't request this, ignore it.</p>
            </div>`;
        if (!resendKey) {
            console.log(`[EmailService] RESEND_API_KEY not set — invite link for ${to}: ${inviteUrl}`);
            return { mocked: true, inviteUrl };
        }
        try {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ from, to, subject, html }),
            });
            if (!res.ok) console.error('[EmailService] Resend error', await res.text());
        } catch (e) {
            console.error('[EmailService] send failed', e);
        }
    }

    static async sendRequestDecision(to: string, title: string, status: string, adminNote?: string | null, driveUrl?: string | null) {
        const resendKey = process.env.RESEND_API_KEY;
        const from = process.env.EMAIL_FROM || 'DFD Agency <hello@dfdagency.com>';
        const subject = `Your request "${title}" was ${status.toLowerCase()}`;
        const html = `<div style="font-family:sans-serif;max-width:560px"><h3>Request ${status}</h3><p><b>${title}</b></p>${adminNote ? `<p>Note: ${adminNote}</p>` : ''}${driveUrl ? `<p>Drive: <a href="${driveUrl}">${driveUrl}</a></p>` : ''}</div>`;
        if (!resendKey) {
            console.log(`[EmailService] Decision mocked for ${to}: ${status} ${title}`);
            return;
        }
        try {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ from, to, subject, html }),
            });
        } catch (e) { console.error('[EmailService] decision send failed', e); }
    }
}
