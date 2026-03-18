'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface OrderReceiptModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: {
        id: string;
        totalAmount: string;
        Lead: { name: string; whatsapp: string; businessName: string | null };
        Package: { name: string };
        briefData?: { description?: string };
    } | null;
}

export function ReceiptTemplateModal({ open, onOpenChange, order }: OrderReceiptModalProps) {
    const [copied, setCopied] = React.useState(false);

    if (!order) return null;

    const formatRp = (amount: string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    const trackUrl = `${window.location.origin}/track/${order.id}`;

    const templateText = `--- DFD AGENCY ORDER RECEIPT ---
🚀 Project: ${order.Package.name}
📝 Description: ${order.briefData?.description || 'N/A'}
🧾 Receipt ID: ${order.id.toUpperCase()}
💰 Total: ${formatRp(order.totalAmount)}

👤 Client: ${order.Lead.name}
🏢 Business: ${order.Lead.businessName || '-'}
📞 WhatsApp: ${order.Lead.whatsapp}

🔗 Track Your Progress:
${trackUrl}
--------------------------------`;

    const handleCopy = () => {
        navigator.clipboard.writeText(templateText);
        setCopied(true);
        toast.success('Template copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const element = document.createElement('a');
        const file = new Blob([templateText], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `Receipt-${order.id.slice(0, 8)}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        toast.success('Template downloaded as .txt');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-4 border-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-background max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">Order Receipt Template</DialogTitle>
                    <DialogDescription className="font-medium">
                        Copy or download this template to share with the client or for internal records.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 bg-muted/30 border-2 border-foreground p-4 font-mono text-xs whitespace-pre-wrap relative group">
                    {templateText}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-none border-2 border-foreground" onClick={handleCopy}>
                            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-3 pt-6">
                    <Button 
                        variant="outline" 
                        className="rounded-none border-2 border-foreground font-bold uppercase tracking-widest hover:bg-muted transition-none flex-1"
                        onClick={handleDownload}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download .txt
                    </Button>
                    <Button 
                        className="rounded-none border-2 border-foreground bg-zinc-950 text-white font-bold uppercase tracking-widest hover:bg-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-none flex-1"
                        onClick={handleCopy}
                    >
                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? 'Copied!' : 'Copy Template'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
