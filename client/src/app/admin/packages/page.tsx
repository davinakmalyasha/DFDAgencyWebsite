'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { PackageInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { PackageForm } from '@/components/packages/package-form';

interface Package extends PackageInput {
    id: number;
    createdAt: string;
}

export default function PackagesPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<Package | undefined>(undefined);

    const fetchPackages = async () => {
        try {
            setLoading(true);
            const res = await api.get('/packages?limit=100');
            if (res.data.success) {
                setPackages(res.data.data);
            }
        } catch (error: any) {
            toast.error('Failed to load packages', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you absolutely sure you want to delete this package?')) return;

        try {
            const res = await api.delete(`/packages/${id}`);
            if (res.data.success) {
                toast.success('Package deleted via soft-delete.');
                fetchPackages();
            } else {
                toast.error('Delete failed', { description: res.data.message });
            }
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unknown error';
            toast.error('Delete failed', { description: message });
        }
    };

    const handleOpenForm = (pkg?: Package) => {
        setSelectedPackage(pkg);
        setIsSheetOpen(true);
    };

    const handleFormSuccess = () => {
        setIsSheetOpen(false);
        fetchPackages();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Packages</h1>
                    <p className="text-muted-foreground font-medium">Manage pricing tiers and features.</p>
                </div>
                <Button
                    onClick={() => handleOpenForm()}
                    className="rounded-none font-bold uppercase tracking-widest border-2 border-transparent hover:border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all"
                >
                    <Plus className="mr-2 h-4 w-4" /> New Package
                </Button>
            </div>

            <div className="border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <Table>
                    <TableHeader className="bg-muted/30 border-b-2 border-foreground">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-bold text-black uppercase tracking-wider">ID</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Name</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Price (IDR)</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Status</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 font-bold text-muted-foreground">LOADING DATA...</TableCell>
                            </TableRow>
                        ) : packages.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 font-bold text-muted-foreground">NO PACKAGES FOUND</TableCell>
                            </TableRow>
                        ) : (
                            packages.map((pkg) => (
                                <TableRow key={pkg.id} className="border-b-2 border-foreground/10 hover:bg-muted/30 transition-none">
                                    <TableCell className="font-mono">{pkg.id}</TableCell>
                                    <TableCell>
                                        <div className="font-bold">{pkg.name}</div>
                                        <div className="text-xs text-muted-foreground">{pkg.slug}</div>
                                    </TableCell>
                                    <TableCell className="font-mono">Rp {pkg.price.toLocaleString('id-ID')}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 text-[10px] font-bold uppercase border border-foreground ${pkg.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                                                {pkg.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            {pkg.isPopular && (
                                                <span className="px-2 py-1 text-[10px] font-bold uppercase border border-white text-white bg-black">
                                                    Popular
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="icon" onClick={() => handleOpenForm(pkg)} className="rounded-none border-2 border-foreground hover:bg-foreground hover:text-background transition-none h-8 w-8">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" onClick={() => handleDelete(pkg.id)} className="rounded-none border-2 border-foreground hover:bg-red-600 hover:text-white transition-none h-8 w-8">
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
                                {selectedPackage ? 'Edit Package' : 'New Package'}
                            </SheetTitle>
                            <SheetDescription className="font-medium text-foreground/70">
                                Enter the core details below. Changes are instantly reflected via the API.
                            </SheetDescription>
                        </SheetHeader>
                    </div>
                    <div className="p-6">
                        {isSheetOpen && (
                            <PackageForm
                                initialData={selectedPackage}
                                onSuccess={handleFormSuccess}
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
