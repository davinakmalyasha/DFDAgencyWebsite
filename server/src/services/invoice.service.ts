import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';

export class InvoiceService {
    /**
     * Generate a PDF Invoice for an order
     * @param orderId UUID of the Order
     * @returns URL path to the generated invoice
     */
    static async generateInvoice(orderId: string): Promise<string> {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { Lead: true, Package: true }
        });

        if (!order) throw new Error('Order not found for invoice generation');

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const fileName = `INV-${order.id.slice(0, 8).toUpperCase()}.pdf`;
                const filePath = path.join(__dirname, '../../public/invoices', fileName);

                // Ensure directory exists
                if (!fs.existsSync(path.dirname(filePath))) {
                    fs.mkdirSync(path.dirname(filePath), { recursive: true });
                }

                const writeStream = fs.createWriteStream(filePath);
                doc.pipe(writeStream);

                // --- Invoice Header ---
                doc.fontSize(20).text('INVOICE', { align: 'right' });
                doc.fontSize(10).text(`Date: ${order.createdAt.toLocaleDateString('id-ID')}`, { align: 'right' });
                doc.text(`Invoice #: INV-${order.id.slice(0, 8).toUpperCase()}`, { align: 'right' });
                doc.moveDown(2);

                // --- Company Info ---
                doc.fontSize(14).text('DFD Agency', { align: 'left' });
                doc.fontSize(10).text('Jakarta, Indonesia');
                doc.text('contact@dfdagency.com');
                doc.moveDown(2);

                // --- Client Info ---
                doc.fontSize(12).text('Billed To:');
                doc.fontSize(10).text(`Name: ${order.Lead.name}`);
                doc.text(`Business: ${order.Lead.businessName || 'N/A'}`);
                doc.text(`WhatsApp: ${order.Lead.whatsapp}`);
                doc.moveDown(2);

                // --- Order Details ---
                doc.fontSize(12).text('Order Items', { underline: true });
                doc.moveDown(0.5);

                // Table Header
                const tableTop = doc.y;
                doc.fontSize(10)
                    .text('Description', 50, tableTop)
                    .text('Amount', 400, tableTop, { align: 'right' });

                doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();

                // Table Items
                const itemTop = tableTop + 25;
                doc.text(`Website Package: ${order.Package.name}`, 50, itemTop)
                    .text(`Rp ${Number(order.totalAmount).toLocaleString('id-ID')}`, 400, itemTop, { align: 'right' });

                doc.moveTo(50, itemTop + 15).lineTo(500, itemTop + 15).stroke();

                // Total
                doc.moveDown(2);
                doc.fontSize(12).text(`Total Paid: Rp ${Number(order.totalAmount).toLocaleString('id-ID')}`, { align: 'right' });

                // Footer
                doc.moveDown(5);
                doc.fontSize(10).text('Thank you for choosing DFD Agency!', { align: 'center', oblique: true });

                doc.end();

                writeStream.on('finish', () => {
                    resolve(filePath);
                });

                writeStream.on('error', (err) => {
                    reject(err);
                });

            } catch (error) {
                reject(error);
            }
        });
    }
}
