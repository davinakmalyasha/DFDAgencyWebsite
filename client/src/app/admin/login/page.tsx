'use client';

import { useState } from 'react';
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

type LoginFormValues = z.infer<typeof loginSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

export default function AdminLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [otpUserId, setOtpUserId] = useState<number | null>(null);
    const [otpEmail, setOtpEmail] = useState('');

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            identity: '',
            password: '',
        },
    });

    const otpForm = useForm<OtpFormValues>({
        resolver: zodResolver(otpSchema),
        defaultValues: { code: '' },
    });

    async function onSubmit(data: LoginFormValues) {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', data);

            if (response.data.success) {
                if (response.data.data?.otpRequired) {
                    setOtpUserId(response.data.data.userId);
                    setOtpEmail(response.data.data.email || '');
                    toast.success('Verification code sent to your email');
                } else {
                    toast.success('Login Successful', { description: 'Welcome back to the dashboard.' });
                    // Force a hard navigation to trigger middleware and reset client cache properly
                    router.push('/admin/dashboard');
                    router.refresh();
                }
            }
        } catch (error) {
            toast.error('Authentication Failed', {
                description: (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Invalid credentials',
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function onVerify(data: OtpFormValues) {
        if (!otpUserId) return;
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login/verify', { userId: otpUserId, code: data.code });
            if (response.data.success) {
                toast.success('Login Successful', { description: 'Welcome back to the dashboard.' });
                router.push('/admin/dashboard');
                router.refresh();
            }
        } catch (error) {
            toast.error('Verification Failed', {
                description: (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Invalid or expired code',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
            <Card className="w-full max-w-sm border-2 border-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader className="space-y-1 pb-6 border-b-2 border-foreground mb-4 bg-muted/30">
                    <CardTitle className="text-2xl font-black uppercase tracking-tight">DFD Agency</CardTitle>
                    <CardDescription className="text-foreground/70 font-medium">
                        Admin Command Center
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {otpUserId ? (
                        <Form {...otpForm}>
                            <form onSubmit={otpForm.handleSubmit(onVerify)} className="space-y-4">
                                <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to <span className="font-bold">{otpEmail}</span></p>
                                <FormField
                                    control={otpForm.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">Verification code</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="123456"
                                                    inputMode="numeric"
                                                    maxLength={6}
                                                    autoComplete="one-time-code"
                                                    className="border-foreground focus-visible:ring-foreground rounded-none text-center text-2xl tracking-[0.5em]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    className="w-full rounded-none font-bold tracking-widest uppercase transition-all hover:bg-white hover:text-black border-2 border-transparent hover:border-black active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Verifying...' : 'Verify'}
                                </Button>
                                <Button type="button" variant="ghost" className="w-full rounded-none text-xs" onClick={() => { setOtpUserId(null); otpForm.reset(); }}>Back to sign in</Button>
                            </form>
                        </Form>
                    ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="identity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold">Email or Username</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="admin@dfdagency.com"
                                                className="border-foreground focus-visible:ring-foreground rounded-none"
                                                autoComplete="username"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold">Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="border-foreground focus-visible:ring-foreground rounded-none"
                                                autoComplete="current-password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="w-full rounded-none font-bold tracking-widest uppercase transition-all hover:bg-white hover:text-black border-2 border-transparent hover:border-black active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Authenticating...' : 'Engage'}
                            </Button>
                        </form>
                    </Form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
