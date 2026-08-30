'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { loginSchema } from '@/lib/validations';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

type V = z.infer<typeof loginSchema>;

export default function ClientLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const form = useForm<V>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
    async function onSubmit(data: V) {
        setLoading(true);
        try {
            const r = await api.post('/auth/login', data);
            if (r.data.success) {
                const role = r.data.data.user.role;
                toast.success('Welcome back');
                router.push(role === 'CLIENT' ? '/client/dashboard' : '/admin/dashboard');
                router.refresh();
            }
        } catch (e: any) {
            toast.error('Login failed', { description: e.response?.data?.message || 'Invalid credentials' });
        } finally { setLoading(false); }
    }
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-sm border-2 border-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader className="space-y-1 pb-6 border-b-2 border-foreground bg-muted/30">
                    <CardTitle className="text-2xl font-black uppercase tracking-tight">Client Portal</CardTitle>
                    <CardDescription className="font-medium">Sign in to track your project</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold">Email</FormLabel><FormControl><Input placeholder="you@company.com" autoComplete="email" className="border-foreground rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="password" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold">Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" autoComplete="current-password" className="border-foreground rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="submit" disabled={loading} className="w-full rounded-none font-bold uppercase tracking-widest border-2 border-transparent hover:border-black hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">{loading ? 'Signing in…' : 'Sign in'}</Button>
                        </form>
                    </Form>
                    <p className="text-xs text-muted-foreground mt-4 text-center">Got an invite link? Open it — no password needed.</p>
                </CardContent>
            </Card>
        </div>
    );
}
