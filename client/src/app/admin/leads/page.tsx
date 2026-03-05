'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Lead {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    serviceOfInterest: string | null;
    message: string | null;
    status: 'NEW' | 'CONTACTED' | 'PROPOSAL_SENT' | 'CLOSED_WON' | 'CLOSED_LOST';
    createdAt: string;
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const res = await api.get('/leads?limit=50');
            if (res.data.success) {
                setLeads(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to load leads', { description: (error as Error).message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const updateStatus = async (id: number, newStatus: string) => {
        try {
            const res = await api.put(`/leads/${id}/status`, { status: newStatus });
            if (res.data.success) {
                toast.success('Lead structure synced.');
                fetchLeads();
            }
        } catch (error) {
            toast.error('Failed to update status', { description: (error as Error).message });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Leads Engine</h1>
                    <p className="text-muted-foreground font-medium">Monitor and engage inbound agency inquiries.</p>
                </div>
                <Button onClick={fetchLeads} variant="outline" className="rounded-none border-2 border-foreground font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-foreground hover:text-background transition-none">
                    Sync CRM
                </Button>
            </div>

            <div className="border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <Table>
                    <TableHeader className="bg-muted/30 border-b-2 border-foreground">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-bold text-black uppercase tracking-wider w-24">Date</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Prospect</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Service</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Message</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider w-40">Pipeline Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 font-bold text-muted-foreground">SCANNING DATABASES...</TableCell>
                            </TableRow>
                        ) : leads.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 font-bold text-muted-foreground">NO LEADS IN PIPELINE</TableCell>
                            </TableRow>
                        ) : (
                            leads.map((lead) => (
                                <TableRow key={lead.id} className="border-b-2 border-foreground/10 hover:bg-muted/30 transition-none">
                                    <TableCell className="font-mono text-xs">{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <div className="font-bold">{lead.name}</div>
                                        <div className="text-xs font-mono">{lead.email}</div>
                                        {lead.phone && <div className="text-xs text-muted-foreground font-mono">{lead.phone}</div>}
                                    </TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase border-2 border-foreground/30 bg-muted/50">
                                            {lead.serviceOfInterest || 'General Inquiry'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate text-xs" title={lead.message || ''}>
                                        {lead.message || <span className="text-muted-foreground italic">No message recorded</span>}
                                    </TableCell>
                                    <TableCell>
                                        <Select value={lead.status} onValueChange={(val) => updateStatus(lead.id, val)}>
                                            <SelectTrigger className="w-full rounded-none border-2 border-foreground focus:ring-0 h-8 text-xs font-bold uppercase">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none border-2 border-foreground">
                                                <SelectItem value="NEW" className="text-xs font-bold">● NEW</SelectItem>
                                                <SelectItem value="CONTACTED" className="text-xs font-bold text-blue-600">● CONTACTED</SelectItem>
                                                <SelectItem value="PROPOSAL_SENT" className="text-xs font-bold text-orange-600">● PROPOSAL</SelectItem>
                                                <SelectItem value="CLOSED_WON" className="text-xs font-bold text-green-600">★ WON</SelectItem>
                                                <SelectItem value="CLOSED_LOST" className="text-xs font-bold text-red-600">☒ LOST</SelectItem>
                                            </SelectContent>
                                        </Select>
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
