'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { PromoInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from 'sonner';
import { Megaphone, Edit2, Trash2 } from 'lucide-react';
import { PromoForm } from '@/components/promos/promo-form';

interface Promo extends PromoInput {
    id: number;
    createdAt: string;
    Package?: { name: string } | null;
}

export default function PromosPage() {
    const [promos, setPromos] = useState<Promo[]>([]);
    const [loading, setLoading] = useState(true);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedPromo, setSelectedPromo] = useState<Promo | undefined>(undefined);

    const fetchPromos = async () => {
        try {
            setLoading(true);
            const res = await api.get('/promos?limit=100');
            if (res.data.success) {
                setPromos(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to load promos', { description: (error as Error).message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromos();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            const res = await api.delete(`/promos/${id}`);
            if (res.data.success) {
                toast.success('Promo banner deleted.');
                fetchPromos();
            } else {
                toast.error('Delete failed', { description: res.data.message });
            }
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const handleOpenForm = (promo?: Promo) => {
        setSelectedPromo(promo);
        setIsSheetOpen(true);
    };

    const handleFormSuccess = () => {
        setIsSheetOpen(false);
        fetchPromos();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Promo Banners</h1>
                    <p className="text-muted-foreground font-medium">Manage top-bar announcements and flash sales.</p>
                </div>
                <Button
                    onClick={() => handleOpenForm()}
                    className="rounded-none font-bold uppercase tracking-widest border-2 border-transparent hover:border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all"
                >
                    <Megaphone className="mr-2 h-4 w-4" /> New Banner
                </Button>
            </div>

            <div className="border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <Table>
                    <TableHeader className="bg-muted/30 border-b-2 border-foreground">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-bold text-black uppercase tracking-wider">Banner Text</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Linked Package</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Status</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Timer</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 font-bold text-muted-foreground">LOADING DATA...</TableCell>
                            </TableRow>
                        ) : promos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 font-bold text-muted-foreground">NO ACTIVE PROMOS FOUND</TableCell>
                            </TableRow>
                        ) : (
                            promos.map((promo) => (
                                <TableRow key={promo.id} className="border-b-2 border-foreground/10 hover:bg-muted/30 transition-none">
                                    <TableCell>
                                        <div className="font-bold">{promo.text}</div>
                                        <div className="text-xs text-muted-foreground">{promo.linkUrl || '-'}</div>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">{promo.Package?.name || 'Text Only'}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 text-[10px] font-bold uppercase border border-foreground ${promo.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                                                {promo.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground font-mono">
                                        {promo.startDate ? `Start: ${new Date(promo.startDate).toLocaleDateString()}` : 'No Start'}
                                        <br />
                                        {promo.endDate ? `End: ${new Date(promo.endDate).toLocaleDateString()}` : 'No End'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="icon" onClick={() => handleOpenForm(promo)} className="rounded-none border-2 border-foreground hover:bg-foreground hover:text-background transition-none h-8 w-8">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" onClick={() => handleDelete(promo.id)} className="rounded-none border-2 border-foreground hover:bg-red-600 hover:text-white transition-none h-8 w-8">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Form Side Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] border-l-2 border-foreground p-0 overflow-y-auto bg-background">
                    <div className="p-6 border-b-2 border-foreground bg-muted/30">
                        <SheetHeader>
                            <SheetTitle className="text-2xl font-black uppercase tracking-tight">
                                {selectedPromo ? 'Edit Banner' : 'New Banner'}
                            </SheetTitle>
                            <SheetDescription className="font-medium text-foreground/70">
                                Configure the announcement bar properties below.
                            </SheetDescription>
                        </SheetHeader>
                    </div>
                    <div className="p-6">
                        {isSheetOpen && (
                            <PromoForm
                                initialData={selectedPromo}
                                onSuccess={handleFormSuccess}
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
