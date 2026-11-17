'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { loginSchema, otpSchema } from '@/lib/validations';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

type V = z.infer<typeof loginSchema>;
type O = z.infer<typeof otpSchema>;

declare global {
    interface Window { google?: any }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function routeFor(role: string) {
    return role === 'CLIENT' ? '/client/dashboard' : '/admin/dashboard';
}

export default function ClientLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [otpUserId, setOtpUserId] = useState<number | null>(null);
    const [otpEmail, setOtpEmail] = useState('');
    const googleBtn = useRef<HTMLDivElement>(null);
    const form = useForm<V>({ resolver: zodResolver(loginSchema), defaultValues: { identity: '', password: '' } });
    const otpForm = useForm<O>({ resolver: zodResolver(otpSchema), defaultValues: { code: '' } });

    // Google Identity button (hidden when client ID is not configured).
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || !googleBtn.current || window.google) return;
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.defer = true;
        s.onload = () => {
            try {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: onGoogle,
                    ux_mode: 'popup',
                });
                window.google.accounts.id.renderButton(googleBtn.current, {
                    theme: 'outline', size: 'large', width: 320, text: 'continue_with',
                });
            } catch { /* GIS unavailable — password login still works */ }
        };
        document.head.appendChild(s);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function onGoogle(resp: any) {
        setLoading(true);
        try {
            const r = await api.post('/auth/google', { idToken: resp.credential });
            if (r.data.success) {
                const role = r.data.data.user.role;
                toast.success('Welcome');
                router.push(routeFor(role));
                router.refresh();
            }
        } catch (e: any) {
            toast.error('Google sign-in failed', { description: e.response?.data?.message || 'Try again' });
        } finally { setLoading(false); }
    }

    function go(user: any) {
        const role = user.role;
        toast.success('Welcome back');
        router.push(routeFor(role));
        router.refresh();
    }

    async function onSubmit(data: V) {
        setLoading(true);
        try {
            const r = await api.post('/auth/login', data);
            if (r.data.success) {
                if (r.data.data?.otpRequired) {
                    setOtpUserId(r.data.data.userId);
                    setOtpEmail(r.data.data.email || '');
                    toast.success('Verification code sent to your email');
                } else {
                    go(r.data.data.user);
                }
            }
        } catch (e: any) {
            toast.error('Login failed', { description: e.response?.data?.message || 'Invalid credentials' });
        } finally { setLoading(false); }
    }

    async function onVerify(data: O) {
        if (!otpUserId) return;
        setLoading(true);
        try {
            const r = await api.post('/auth/login/verify', { userId: otpUserId, code: data.code });
            if (r.data.success) go(r.data.data.user);
        } catch (e: any) {
            toast.error('Verification failed', { description: e.response?.data?.message || 'Invalid or expired code' });
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
                    {otpUserId ? (
                        <Form {...otpForm}>
                            <form onSubmit={otpForm.handleSubmit(onVerify)} className="space-y-4">
                                <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to <span className="font-bold">{otpEmail}</span></p>
                                <FormField control={otpForm.control} name="code" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold">Verification code</FormLabel><FormControl><Input placeholder="123456" inputMode="numeric" maxLength={6} autoComplete="one-time-code" className="border-foreground rounded-none text-center text-2xl tracking-[0.5em]" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Button type="submit" disabled={loading} className="w-full rounded-none font-bold uppercase tracking-widest border-2 border-transparent hover:border-black hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">{loading ? 'Verifying…' : 'Verify'}</Button>
                                <Button type="button" variant="ghost" className="w-full rounded-none text-xs" onClick={() => { setOtpUserId(null); otpForm.reset(); }}>Back to sign in</Button>
                            </form>
                        </Form>
                    ) : (
                        <>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField control={form.control} name="identity" render={({ field }) => (
                                        <FormItem><FormLabel className="font-bold">Email or username</FormLabel><FormControl><Input placeholder="you@company.com" autoComplete="username" className="border-foreground rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="password" render={({ field }) => (
                                        <FormItem><FormLabel className="font-bold">Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" autoComplete="current-password" className="border-foreground rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <Button type="submit" disabled={loading} className="w-full rounded-none font-bold uppercase tracking-widest border-2 border-transparent hover:border-black hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">{loading ? 'Signing in…' : 'Sign in'}</Button>
                                </form>
                            </Form>
                            {GOOGLE_CLIENT_ID && (
                                <>
                                    <div className="flex items-center gap-3 my-4"><div className="h-px flex-1 bg-foreground/20" /><span className="text-xs font-bold uppercase text-muted-foreground">or</span><div className="h-px flex-1 bg-foreground/20" /></div>
                                    <div ref={googleBtn} className="flex justify-center" />
                                </>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
