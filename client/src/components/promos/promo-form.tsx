'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { promoSchema, PromoInput } from '@/lib/validations';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface PromoFormProps {
    initialData?: (PromoInput & { id: number });
    onSuccess: () => void;
}

export function PromoForm({ initialData, onSuccess }: PromoFormProps) {
    const [loading, setLoading] = useState(false);
    const [packages, setPackages] = useState<{id: number; name: string}[]>([]);

    useEffect(() => {
        // Fetch only packages that have an active discount
        api.get('/packages?limit=100&hasDiscount=true').then((res) => {
            if (res.data.success) {
                setPackages(res.data.data);
            }
        });
    }, []);

    const form = useForm<PromoInput>({
        resolver: zodResolver(promoSchema) as any,
        defaultValues: {
            text: initialData?.text || '',
            linkUrl: initialData?.linkUrl || '',
            packageId: initialData?.packageId || undefined,
            isActive: initialData?.isActive ?? true,
            startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : '',
            endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : '',
        }
    });

    const onSubmit = async (values: PromoInput) => {
        try {
            setLoading(true);
            const payload = {
                ...values,
                startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
                endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
                packageId: values.packageId ? Number(values.packageId) : null
            };

            if (initialData?.id) {
                await api.put(`/promos/${initialData.id}`, payload);
                toast.success('Promo Banner updated.');
            } else {
                await api.post('/promos', payload);
                toast.success('Promo Banner created.');
            }
            onSuccess();
        } catch (error) {
            toast.error('Failed to save Promo', { description: (error as {response?: {data?: {message?: string}}}).response?.data?.message || (error as Error).message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">

                <FormField control={form.control as any}
                    name="text"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase tracking-wider text-black">Banner Text</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. FLASH SALE: Get Landing Page Pro now!" className="border-2 border-foreground rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:border-black" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField control={form.control as any}
                    name="packageId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase tracking-wider">Link to Package (Optional)</FormLabel>
                            <Select onValueChange={(val) => field.onChange(val ? Number(val) : undefined)} value={field.value?.toString() || ""}>
                                <FormControl>
                                    <SelectTrigger className="border-2 border-foreground rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        <SelectValue placeholder="Select a package..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-none border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <SelectItem value="none" onClick={() => form.setValue('packageId', undefined)}>-- None --</SelectItem>
                                    {packages.map(pkg => (
                                        <SelectItem key={(pkg as {id: number}).id} value={(pkg as {id: number}).id.toString()}>{(pkg as {name: string}).name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField control={form.control as any}
                    name="linkUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase tracking-wider text-black">Link URL (Optional Fallback)</FormLabel>
                            <FormControl>
                                <Input placeholder="https://example.com/promo" className="border-2 border-foreground rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:border-black" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control as any}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold uppercase tracking-wider text-black">Start Date (Optional)</FormLabel>
                                <FormControl>
                                    <Input type="datetime-local" className="border-2 border-foreground rounded-none focus-visible:ring-0 focus-visible:border-black" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField control={form.control as any}
                        name="endDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold uppercase tracking-wider text-black">End Date (Optional)</FormLabel>
                                <FormControl>
                                    <Input type="datetime-local" className="border-2 border-foreground rounded-none focus-visible:ring-0 focus-visible:border-black" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField control={form.control as any}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-none border-2 border-foreground p-4 bg-muted/20">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base font-bold uppercase tracking-wider">
                                    Active Status
                                </FormLabel>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white hover:bg-neutral-800 rounded-none border-2 border-transparent font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all"
                >
                    {loading ? 'Saving...' : 'Save Promo'}
                </Button>
            </form>
        </Form>
    );
}
