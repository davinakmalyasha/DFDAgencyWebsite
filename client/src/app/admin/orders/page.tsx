'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Rocket, CreditCard, FileText, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ReceiptTemplateModal } from '@/components/admin/ReceiptTemplateModal';

interface Lead {
    id: number;
    name: string;
    whatsapp: string;
    businessName: string | null;
}

interface Package {
    id: number;
    name: string;
}

interface LinkedProject {
    id: number;
    title: string;
}

interface Order {
    id: string;
    idempotencyKey: string | null;
    totalAmount: string;
    status: 'PENDING_PAYMENT' | 'PROCESSING' | 'REVISION' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
    Lead: Lead;
    Package: Package;
    Project: LinkedProject | null;
    briefData?: { description?: string };
    _count?: { Notes: number };
}

const ORDER_STATUSES = ['PENDING_PAYMENT', 'PROCESSING', 'REVISION', 'COMPLETED', 'CANCELLED'] as const;

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);

    // Delete confirmation state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/orders?limit=50');
            if (res.data.success) {
                setOrders(res.data.data);
            }
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Network error';
            toast.error('Failed to load orders', { description: message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            fetchOrders();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed';
            toast.error('Status update failed', { description: message });
        }
    };

    const handleDelete = async (orderId: string) => {
        try {
            await api.delete(`/orders/${orderId}`);
            toast.success('Order deleted');
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
            fetchOrders();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Delete failed';
            toast.error('Delete failed', { description: message });
        }
    };

    const handleBulkCleanup = async () => {
        const pendingOrders = orders.filter((o) => o.status === 'PENDING_PAYMENT');
        if (pendingOrders.length === 0) {
            toast.info('No pending orders to clean up');
            return;
        }
        try {
            const results = await Promise.allSettled(pendingOrders.map((o) => api.delete(`/orders/${o.id}`)));
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            const failCount = results.length - successCount;

            if (failCount === 0) {
                toast.success(`${successCount} pending orders deleted`);
            } else if (successCount > 0) {
                toast.warning(`Partial Success: ${successCount} deleted, ${failCount} failed`);
            } else {
                toast.error(`Failed to delete all ${failCount} pending orders`);
            }
            
            setBulkDeleteDialogOpen(false);
            fetchOrders();
        } catch (err: unknown) {
            toast.error('Unexpected error during bulk cleanup');
        }
    };

    const handlePromote = async (orderId: string) => {
        try {
            const res = await api.post(`/orders/${orderId}/promote`);
            if (res.data.success) {
                toast.success('Order promoted to portfolio!', { description: `Project "${res.data.data.title}" created.` });
                fetchOrders();
            }
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Promotion failed';
            toast.error('Promote failed', { description: message });
        }
    };

    const handlePayClick = (order: Order) => {
        setSelectedOrderForPayment(order);
        setPaymentModalOpen(true);
    };

    const handleReceiptClick = (order: Order) => {
        setSelectedOrderForReceipt(order);
        setReceiptModalOpen(true);
    };

    const handleDownloadInvoice = async (orderId: string) => {
        try {
            toast.loading('Generating invoice...', { id: 'invoice-toast' });
            const res = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `INV-${orderId.substring(0, 8).toUpperCase()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success('Invoice downloaded', { id: 'invoice-toast' });
        } catch (err: unknown) {
            toast.error('Invoice generation failed', { id: 'invoice-toast', description: 'Could not fetch the invoice PDF.' });
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 border-green-700 text-green-800';
            case 'PROCESSING': return 'bg-blue-100 border-blue-700 text-blue-800';
            case 'REVISION': return 'bg-yellow-100 border-yellow-700 text-yellow-800';
            case 'PENDING_PAYMENT': return 'bg-orange-100 border-orange-700 text-orange-800';
            case 'CANCELLED': return 'bg-red-100 border-red-700 text-red-800';
            default: return 'bg-gray-100 border-gray-700 text-gray-800';
        }
    };

    const pendingCount = orders.filter(o => o.status === 'PENDING_PAYMENT').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Order Pipeline</h1>
                    <p className="text-muted-foreground font-medium">Manage orders and promote completed ones to portfolio.</p>
                </div>
                <div className="flex items-center gap-3">
                    {pendingCount > 0 && (
                        <Button
                            onClick={() => setBulkDeleteDialogOpen(true)}
                            variant="outline"
                            className="rounded-none border-2 border-red-600 text-red-600 font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(220,38,38,0.4)] hover:bg-red-600 hover:text-white transition-none"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clean Test Orders ({pendingCount})
                        </Button>
                    )}
                    <Button onClick={fetchOrders} variant="outline" className="rounded-none border-2 border-foreground font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-foreground hover:text-background transition-none">
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <Table>
                    <TableHeader className="bg-muted/30 border-b-2 border-foreground">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-bold text-black uppercase tracking-wider w-32">Date</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Client</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Package</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Amount</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Status</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 font-bold text-muted-foreground">LOADING PIPELINE...</TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 font-bold text-muted-foreground">NO ORDERS FOUND</TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id} className="border-b-2 border-foreground/10 hover:bg-muted/30 transition-none">
                                    <TableCell className="font-mono text-xs">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <div className="font-bold">{order.Lead?.name ?? '—'}</div>
                                        <div className="text-xs font-mono text-muted-foreground">{order.Lead?.whatsapp ?? ''}</div>
                                    </TableCell>
                                    <TableCell className="font-bold text-sm">{order.Package?.name ?? `#${order.id}`}</TableCell>
                                    <TableCell className="font-mono font-bold">
                                        Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={order.status}
                                            onValueChange={(val) => handleStatusChange(order.id, val)}
                                        >
                                            <SelectTrigger className={`w-[160px] rounded-none border-2 text-[10px] font-black uppercase h-8 ${getStatusStyle(order.status)}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none border-2 border-foreground">
                                                {ORDER_STATUSES.map((s) => (
                                                    <SelectItem key={s} value={s} className="text-xs font-bold uppercase">
                                                        {s.replace(/_/g, ' ')}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Manage Order Details */}
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                title="Manage Order Details"
                                                className="relative rounded-none border-2 border-foreground hover:bg-muted transition-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                asChild
                                            >
                                                <Link href={`/admin/orders/${order.id}`}>
                                                    <FileText className="h-4 w-4" />
                                                    {order._count && order._count.Notes > 0 && (
                                                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-foreground">
                                                            {order._count.Notes}
                                                        </span>
                                                    )}
                                                </Link>
                                            </Button>
                                            
                                            {order.status === 'PENDING_PAYMENT' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handlePayClick(order)}
                                                    className="rounded-none border-2 border-foreground bg-blue-600 text-white font-bold text-xs uppercase hover:bg-blue-700 transition-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                >
                                                    <CreditCard className="w-3 h-3 mr-1" />
                                                    Pay
                                                </Button>
                                            )}
                                            {['PROCESSING', 'COMPLETED'].includes(order.status) && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleReceiptClick(order)}
                                                    variant="outline"
                                                    className="rounded-none border-2 border-foreground text-foreground font-bold text-xs uppercase hover:bg-muted transition-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                >
                                                    <FileText className="w-3 h-3 mr-1" />
                                                    Receipt
                                                </Button>
                                            )}
                                            {order.status === 'COMPLETED' && !order.Project && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handlePromote(order.id)}
                                                    className="rounded-none border-2 border-foreground bg-green-600 text-white font-bold text-xs uppercase hover:bg-green-700 transition-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                >
                                                    <Rocket className="w-3 h-3 mr-1" />
                                                    Promote
                                                </Button>
                                            )}
                                            {order.Project && (
                                                <span className="text-[10px] font-bold uppercase text-green-700 border-2 border-green-700 px-2 py-1 bg-green-50 inline-block">
                                                    ✓ Portfolio #{order.Project.id}
                                                </span>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => { setDeleteTarget(order); setDeleteDialogOpen(true); }}
                                                className="rounded-none border-2 border-red-600 text-red-600 font-bold text-xs uppercase hover:bg-red-600 hover:text-white transition-none shadow-[2px_2px_0px_0px_rgba(220,38,38,0.4)]"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Payment Modal */}
            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                <DialogContent className="border-4 border-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Manual Payment Confirmation</DialogTitle>
                        <DialogDescription className="font-medium text-foreground">
                            Instruct the client to transfer the total amount to the following bank account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-muted/30 border-2 border-foreground p-4 text-center">
                            <p className="font-bold text-sm text-foreground uppercase tracking-widest mb-1">Bank BCA</p>
                            <p className="font-black text-3xl tracking-widest text-[#0066AE]">1234 5678 90</p>
                            <p className="font-bold text-sm text-muted-foreground mt-1 uppercase">A.N. DFD Agency</p>
                        </div>
                        <div className="flex justify-between items-center border-2 border-foreground p-3 bg-muted/10">
                            <span className="font-bold uppercase text-xs">Total Amount:</span>
                            <span className="font-black text-lg">
                                Rp {selectedOrderForPayment ? Number(selectedOrderForPayment.totalAmount).toLocaleString('id-ID') : '0'}
                            </span>
                        </div>
                        <div className="pt-2">
                            <Button
                                onClick={() => {
                                    if (!selectedOrderForPayment?.Lead?.whatsapp) return;
                                    const text = `Halo Kak ${selectedOrderForPayment.Lead.name},\n\nTerima kasih telah memesan paket *${selectedOrderForPayment.Package?.name}* di DFD Agency.\n\nBerikut adalah rincian tagihan Anda:\n*Order ID:* ${selectedOrderForPayment.id}\n*Total:* Rp ${Number(selectedOrderForPayment.totalAmount).toLocaleString('id-ID')}\n\nMohon lakukan transfer ke rekening berikut:\n*BCA:* 1234 5678 90 (A.N. DFD Agency)\n\nSilakan balas pesan ini dengan *Bukti Transfer* jika sudah melakukan pembayaran agar project bisa segera kami proses.\n\nTerima kasih! 🙏`;
                                    let waNum = selectedOrderForPayment.Lead.whatsapp.replace(/\D/g, '');
                                    if (waNum.startsWith('0')) waNum = '62' + waNum.substring(1);
                                    const waLink = `https://wa.me/${waNum}?text=${encodeURIComponent(text)}`;
                                    window.open(waLink, '_blank');
                                }}
                                className="w-full rounded-none border-2 border-foreground bg-green-600 text-white font-bold uppercase tracking-widest hover:bg-green-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-none text-md h-12"
                            >
                                WhatsApp Client (Proof of Payment)
                            </Button>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground text-center mt-2 uppercase tracking-wide">
                            Once the client sends the payment proof, manually change the status to &quot;PROCESSING&quot;.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Single Delete Confirmation */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="border-4 border-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-red-600">Delete Order?</DialogTitle>
                        <DialogDescription className="font-medium">
                            This will soft-delete the order from <span className="font-bold">{deleteTarget?.Lead?.name}</span> for <span className="font-bold">{deleteTarget?.Package?.name}</span>. The record will be hidden but not permanently removed from the database.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" className="rounded-none border-2 border-foreground font-bold uppercase">Cancel</Button>
                        </DialogClose>
                        <Button onClick={() => deleteTarget && handleDelete(deleteTarget.id)} className="rounded-none border-2 border-red-600 bg-red-600 text-white font-bold uppercase hover:bg-red-700 transition-none">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Confirmation */}
            <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <DialogContent className="border-4 border-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-red-600">Delete All Pending Orders?</DialogTitle>
                        <DialogDescription className="font-medium">
                            This will soft-delete <span className="font-bold">{pendingCount}</span> orders with status &quot;PENDING_PAYMENT&quot;. This is useful for cleaning up failed test orders. Records are not permanently removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" className="rounded-none border-2 border-foreground font-bold uppercase">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleBulkCleanup} className="rounded-none border-2 border-red-600 bg-red-600 text-white font-bold uppercase hover:bg-red-700 transition-none">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete All Pending ({pendingCount})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ReceiptTemplateModal 
                open={receiptModalOpen} 
                onOpenChange={setReceiptModalOpen} 
                order={selectedOrderForReceipt} 
            />
        </div>
    );
}
