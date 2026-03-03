'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Rocket } from 'lucide-react';

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
}

const ORDER_STATUSES = ['PENDING_PAYMENT', 'PROCESSING', 'REVISION', 'COMPLETED', 'CANCELLED'] as const;

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Order Pipeline</h1>
                    <p className="text-muted-foreground font-medium">Manage orders and promote completed ones to portfolio.</p>
                </div>
                <Button onClick={fetchOrders} variant="outline" className="rounded-none border-2 border-foreground font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-foreground hover:text-background transition-none">
                    Refresh
                </Button>
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
                                            <span className="text-[10px] font-bold uppercase text-green-700 border-2 border-green-700 px-2 py-1 bg-green-50">
                                                ✓ Portfolio #{order.Project.id}
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
