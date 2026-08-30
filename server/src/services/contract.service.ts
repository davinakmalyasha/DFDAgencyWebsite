import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function buildDoc(title: string, orderId: string): { doc: PDFKit.PDFDocument; filePath: string; fileName: string; writeStream: fs.WriteStream } {
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `${title}-${orderId.slice(0, 8).toUpperCase()}.pdf`;
    const dir = path.join(__dirname, '../../public/docs');
    ensureDir(dir);
    const filePath = path.join(dir, fileName);
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);
    return { doc, filePath, fileName, writeStream };
}

function finalize(doc: PDFKit.PDFDocument, filePath: string, writeStream: fs.WriteStream): Promise<string> {
    return new Promise((resolve, reject) => {
        doc.end();
        writeStream.on('finish', () => resolve(filePath));
        writeStream.on('error', reject);
    });
}

export class ContractService {
    static async generateContract(orderId: string): Promise<{ pdfUrl: string; id?: string }> {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                totalAmount: true,
                Lead: { select: { name: true, businessName: true, whatsapp: true } },
                Package: { select: { name: true, features: true } },
            },
        });
        if (!order) throw new Error('Order not found');
        const existing = await prisma.contract.findUnique({
            where: { orderId },
            select: { pdfUrl: true, id: true }
        });
        if (existing?.pdfUrl && fs.existsSync(existing.pdfUrl)) {
            return { pdfUrl: existing.pdfUrl, id: existing.id };
        }
        const { doc, filePath, writeStream } = buildDoc('CONTRACT', order.id);
        doc.fontSize(20).text('SERVICE AGREEMENT', { align: 'right' });
        doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString('id-ID')}`, { align: 'right' });
        doc.text(`Order #: ${order.id.slice(0, 8).toUpperCase()}`, { align: 'right' });
        doc.moveDown(2);

        doc.fontSize(12).text('Between:', { underline: true });
        doc.fontSize(10).text('DFD Agency ("Provider")', { continued: false });
        doc.text('and');
        doc.text(`${order.Lead.businessName || order.Lead.name} ("Client") — WA ${order.Lead.whatsapp}`);
        doc.moveDown(2);

        doc.fontSize(12).text('1. Scope of Work', { underline: true });
        doc.fontSize(10).text(`Package: ${order.Package.name}`);
        const features = (order.Package.features as any) || [];
        if (Array.isArray(features)) features.forEach((f: string) => doc.text(`• ${f}`));
        doc.moveDown(1);

        doc.fontSize(12).text('2. Project Value', { underline: true });
        doc.fontSize(10).text(`Total: Rp ${Number(order.totalAmount).toLocaleString('id-ID')}`);
        doc.moveDown(1);

        doc.fontSize(12).text('3. Timeline', { underline: true });
        doc.fontSize(10).text('Project starts once payment is received and the brief is finalized. Production follows the 5-step pipeline: Brief → Payment → Production → Review → Handover.');
        doc.moveDown(1);

        doc.fontSize(12).text('4. Revision Policy', { underline: true });
        doc.fontSize(10).text('Up to two (2) revision rounds are included per project. Additional revisions will be billed separately.');
        doc.moveDown(1);

        doc.fontSize(12).text('5. Ownership & Handover', { underline: true });
        doc.fontSize(10).text('Source files, accounts, and credentials are transferred to the client upon final payment.');
        doc.moveDown(2);

        doc.fontSize(10).text('Client signature: __________________________   Date: ___________');
        doc.moveDown(1);
        doc.fontSize(10).text('Provider signature: DFD Agency               Date: ___________');
        doc.moveDown(2);
        doc.fontSize(8).text('This document is auto-generated and serves as a binding summary of the project agreement.', { align: 'center' });

        const finalPath = await finalize(doc, filePath, writeStream);

        const row = await prisma.contract.upsert({
            where: { orderId },
            create: { orderId, pdfUrl: finalPath, status: 'SENT' },
            update: { pdfUrl: finalPath, status: 'SENT' },
            select: { id: true, pdfUrl: true, status: true }
        });
        return { pdfUrl: finalPath, id: row.id };
    }

    static async generateWelcomeDoc(orderId: string): Promise<{ pdfUrl: string; id?: string }> {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                Lead: { select: { name: true, businessName: true } },
                Package: { select: { name: true } },
            },
        });
        if (!order) throw new Error('Order not found');
        const { doc, filePath, writeStream } = buildDoc('WELCOME', order.id);
        doc.fontSize(22).text('Welcome to DFD Agency', { align: 'left' });
        doc.fontSize(12).text(`Hi ${order.Lead.businessName || order.Lead.name} — we're excited to build your ${order.Package.name}.`);
        doc.moveDown(1);

        doc.fontSize(14).text('Your Onboarding Checklist', { underline: true });
        doc.fontSize(10).text('☐ Complete payment (if not already done)');
        doc.text('☐ Review and confirm project brief');
        doc.text('☐ Provide brand assets (logo, colors, references)');
        doc.text('☐ Join your project channel (Telegram / WhatsApp)');
        doc.text('☐ Approve wireframe / mockup');
        doc.text('☐ Review development preview');
        doc.text('☐ Provide final feedback or sign-off');
        doc.moveDown(1);

        doc.fontSize(14).text('Your 5-Step Journey', { underline: true });
        doc.fontSize(10).text('1. Brief — you finalize scope & brand');
        doc.text('2. Payment — invoice settled');
        doc.text('3. Production — we build (with weekly updates)');
        doc.text('4. Review — your revisions & QA');
        doc.text('5. Handover — site live + Drive folder + invoice');
        doc.moveDown(1);

        doc.fontSize(14).text('Communication', { underline: true });
        doc.fontSize(10).text('Reach the team via the client portal or WhatsApp. We respond within one business day.');
        doc.moveDown(2);

        doc.fontSize(10).text('This welcome doc is auto-generated. Contact us if anything is unclear.', { align: 'center' });

        const finalPath = await finalize(doc, filePath, writeStream);
        return { pdfUrl: finalPath };
    }
}
