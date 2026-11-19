'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const settingsSchema = z.object({
    emailContact: z.string().email(),
    whatsappNumber: z.string().min(8),
    officeAddress: z.string().min(5),
    instagramLink: z.string().url().optional().or(z.literal('')),
    linkedinLink: z.string().url().optional().or(z.literal('')),
    isMaintenanceMode: z.boolean().default(false),
    metaPixelId: z.string().optional().or(z.literal('')),
    googleAnalyticsId: z.string().optional().or(z.literal('')),
});

type SettingsInput = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<SettingsInput>({
        resolver: zodResolver(settingsSchema) as any,
        defaultValues: {
            emailContact: '',
            whatsappNumber: '',
            officeAddress: '',
            instagramLink: '',
            linkedinLink: '',
            isMaintenanceMode: false,
            metaPixelId: '',
            googleAnalyticsId: '',
        },
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                if (res.data.success && res.data.data) {
                    const settings = res.data.data;
                    form.reset({
                        emailContact: settings.emailContact || '',
                        whatsappNumber: settings.whatsappNumber || '',
                        officeAddress: settings.officeAddress || '',
                        instagramLink: settings.instagramLink || '',
                        linkedinLink: settings.linkedinLink || '',
                        isMaintenanceMode: settings.isMaintenanceMode || false,
                        metaPixelId: settings.metaPixelId || '',
                        googleAnalyticsId: settings.googleAnalyticsId || '',
                    });
                }
            } catch (error) {
                toast.error('Failed to load settings');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [form]);

    async function onSubmit(data: SettingsInput) {
        setIsSaving(true);
        try {
            const res = await api.put('/settings', data);
            if (res.data.success) {
                toast.success('Settings configuration updated and synchronized');
            }
        } catch (error) {
            toast.error('Update failed', { description: (error as Error).message });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) return <div className="font-bold p-8">CONFIGURING MODULE...</div>;

    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tight">Global Parameters</h1>
                <p className="text-muted-foreground font-medium">Control primary agency contact details and global website states.</p>
            </div>

            <div className="border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">

                        <div className="grid grid-cols-2 gap-6">
                            <FormField control={form.control as any}
                                name="emailContact"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold uppercase tracking-wider text-xs">Primary Email</FormLabel>
                                        <FormControl>
                                            <Input className="rounded-none border-foreground focus-visible:ring-foreground" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField control={form.control as any}
                                name="whatsappNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold uppercase tracking-wider text-xs">WhatsApp Number</FormLabel>
                                        <FormControl>
                                            <Input className="rounded-none border-foreground focus-visible:ring-foreground" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField control={form.control as any}
                            name="officeAddress"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold uppercase tracking-wider text-xs">Office Address</FormLabel>
                                    <FormControl>
                                        <Input className="rounded-none border-foreground focus-visible:ring-foreground" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-6">
                            <FormField control={form.control as any}
                                name="instagramLink"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold uppercase tracking-wider text-xs">Instagram Link</FormLabel>
                                        <FormControl>
                                            <Input className="rounded-none border-foreground focus-visible:ring-foreground" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField control={form.control as any}
                                name="linkedinLink"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold uppercase tracking-wider text-xs">LinkedIn Link</FormLabel>
                                        <FormControl>
                                            <Input className="rounded-none border-foreground focus-visible:ring-foreground" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <FormField control={form.control as any}
                                name="metaPixelId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold uppercase tracking-wider text-xs">Meta Pixel ID</FormLabel>
                                        <FormControl>
                                            <Input className="rounded-none border-foreground focus-visible:ring-foreground" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField control={form.control as any}
                                name="googleAnalyticsId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold uppercase tracking-wider text-xs">Google Analytics ID</FormLabel>
                                        <FormControl>
                                            <Input className="rounded-none border-foreground focus-visible:ring-foreground" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField control={form.control as any}
                            name="isMaintenanceMode"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-none border-2 border-foreground bg-muted/20 p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base font-bold uppercase tracking-wider">
                                            Maintenance Mode
                                        </FormLabel>
                                        <div className="text-xs text-muted-foreground font-medium">
                                            Disable public access to the client-facing website interface.
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="data-[state=checked]:bg-red-600 border-2 border-foreground"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="pt-4 flex justify-end">
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="ps-8 pe-8 rounded-none font-black tracking-widest uppercase transition-all hover:bg-white hover:text-black border-2 border-transparent hover:border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none bg-black text-white"
                            >
                                {isSaving ? 'UPDATING...' : 'APPLY CONFIGURATION'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
