'use client';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { loginSchema, registerSchema, otpSchema } from '@/lib/validations';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type OtpValues = z.infer<typeof otpSchema>;
type OtpStep = { kind: 'login' | 'signup'; id: number; email: string };

declare global {
    interface Window { google?: any }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const WHATSAPP = 'https://wa.me/62895324350359?text=Hi%20DFD%2C%20I%20need%20help%20with%20my%20client%20account';

function safeNext(raw: string | null): string | null {
    if (!raw) return null;
    const value = raw.trim();
    if (!value.startsWith('/') || value.startsWith('//')) return null;
    return value;
}

function destinationFor(role: string, next: string | null) {
    if (role === 'SUPERADMIN' || role === 'EDITOR') return '/admin/dashboard';
    return next || '/client/dashboard';
}

function LoginFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
    );
}

function LoginContent() {
    const searchParams = useSearchParams();
    const next = safeNext(searchParams.get('next'));
    const [mode, setMode] = useState<'signin' | 'register'>('signin');
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState<OtpStep | null>(null);
    const [signupEnabled, setSignupEnabled] = useState(false);
    const [resendIn, setResendIn] = useState(0);
    const googleBtn = useRef<HTMLDivElement>(null);
    const googleHandler = useRef<(resp: any) => void>(() => {});

    const loginForm = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { identity: '', password: '' },
    });
    const registerForm = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    });
    const otpForm = useForm<OtpValues>({ resolver: zodResolver(otpSchema), defaultValues: { code: '' } });

    const finish = useCallback((role: string) => {
        window.location.assign(destinationFor(role, next));
    }, [next]);

    useEffect(() => {
        let alive = true;
        api.get('/auth/config')
            .then((res) => {
                if (alive) setSignupEnabled(Boolean(res.data?.data?.signupEnabled));
            })
            .catch(() => {
                if (alive) setSignupEnabled(false);
            });
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        if (resendIn <= 0) return;
        const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [resendIn]);

    const onGoogle = useCallback(async (resp: any) => {
        if (!resp?.credential) return;
        setLoading(true);
        try {
            const r = await api.post('/auth/google', { idToken: resp.credential });
            if (r.data.success) {
                toast.success('Welcome');
                finish(r.data.data.user.role);
            }
        } catch (e: any) {
            toast.error('Google sign-in failed', {
                description: e.response?.data?.message || 'Try again',
            });
        } finally {
            setLoading(false);
        }
    }, [finish]);

    googleHandler.current = onGoogle;

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || !googleBtn.current) return;
        const render = () => {
            if (!window.google || !googleBtn.current) return;
            try {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: (resp: any) => googleHandler.current(resp),
                    ux_mode: 'popup',
                });
                window.google.accounts.id.renderButton(googleBtn.current, {
                    theme: 'outline',
                    size: 'large',
                    width: 320,
                    text: 'continue_with',
                });
            } catch {
                /* GIS unavailable — password login still works */
            }
        };
        if (window.google) {
            render();
            return;
        }
        const existing = document.querySelector('script[data-gsi]') as HTMLScriptElement | null;
        if (existing) {
            existing.addEventListener('load', render, { once: true });
            return () => existing.removeEventListener('load', render);
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.dataset.gsi = 'true';
        script.addEventListener('load', render, { once: true });
        document.head.appendChild(script);
    }, []);

    async function onLogin(data: LoginValues) {
        setLoading(true);
        try {
            const r = await api.post('/auth/login', data);
            if (r.data.success) {
                if (r.data.data?.otpRequired) {
                    setOtp({ kind: 'login', id: r.data.data.userId, email: r.data.data.email || '' });
                    setMode('signin');
                    toast.success('Verification code sent to your email');
                } else {
                    finish(r.data.data.user.role);
                }
            }
        } catch (e: any) {
            toast.error('Login failed', { description: e.response?.data?.message || 'Invalid credentials' });
        } finally {
            setLoading(false);
        }
    }

    async function onRegister(data: RegisterValues) {
        setLoading(true);
        try {
            const r = await api.post('/auth/register', {
                name: data.name,
                email: data.email,
                password: data.password,
            });
            if (r.data.success) {
                setOtp({ kind: 'signup', id: r.data.data.signupId, email: r.data.data.email || '' });
                setResendIn(30);
                toast.success('Check your email for the 6-digit code');
            }
        } catch (e: any) {
            const code = e.response?.data?.error;
            if (code === 'EMAIL_TAKEN') {
                loginForm.setValue('identity', data.email);
                setMode('signin');
                toast.error('Email already registered', {
                    description: 'Sign in with your password, or use Continue with Google.',
                });
            } else {
                toast.error('Could not create account', {
                    description: e.response?.data?.message || 'Try again',
                });
            }
        } finally {
            setLoading(false);
        }
    }

    async function onVerify(data: OtpValues) {
        if (!otp) return;
        setLoading(true);
        try {
            const path = otp.kind === 'login' ? '/auth/login/verify' : '/auth/register/verify';
            const body = otp.kind === 'login'
                ? { userId: otp.id, code: data.code }
                : { signupId: otp.id, code: data.code };
            const r = await api.post(path, body);
            if (r.data.success) {
                toast.success(otp.kind === 'login' ? 'Welcome back' : 'Account created');
                finish(r.data.data.user.role);
            }
        } catch (e: any) {
            toast.error('Verification failed', {
                description: e.response?.data?.message || 'Invalid or expired code',
            });
        } finally {
            setLoading(false);
        }
    }

    async function resendSignup() {
        if (!otp || otp.kind !== 'signup' || resendIn > 0) return;
        try {
            await api.post('/auth/register/resend', { signupId: otp.id });
            setResendIn(30);
            toast.success('A new code is on its way');
        } catch (e: any) {
            toast.error('Could not resend', { description: e.response?.data?.message || 'Try again' });
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-2 border-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader className="space-y-1 pb-6 border-b-2 border-foreground bg-muted/30">
                    <CardTitle className="text-2xl font-black uppercase tracking-tight">Client Portal</CardTitle>
                    <CardDescription className="font-medium">
                        {otp ? 'One more step to verify it is you' : 'Sign in or create your project account'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {otp ? (
                        <Form {...otpForm}>
                            <form onSubmit={otpForm.handleSubmit(onVerify)} className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Enter the 6-digit code sent to <span className="font-bold">{otp.email}</span>
                                </p>
                                <FormField control={otpForm.control} name="code" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold">Verification code</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="123456"
                                                inputMode="numeric"
                                                maxLength={6}
                                                autoComplete="one-time-code"
                                                className="border-foreground rounded-none text-center text-2xl tracking-[0.5em]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <Button type="submit" disabled={loading} className="w-full rounded-none font-bold uppercase tracking-widest border-2 border-transparent hover:border-black hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                                    {loading ? 'Verifying…' : 'Verify'}
                                </Button>
                                {otp.kind === 'signup' && (
                                    <Button type="button" variant="ghost" className="w-full rounded-none text-xs" disabled={resendIn > 0} onClick={resendSignup}>
                                        {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                                    </Button>
                                )}
                                <Button type="button" variant="ghost" className="w-full rounded-none text-xs" onClick={() => { setOtp(null); otpForm.reset(); }}>
                                    Back
                                </Button>
                            </form>
                        </Form>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-2 mb-6 border-2 border-foreground p-1">
                                <button
                                    type="button"
                                    onClick={() => setMode('signin')}
                                    className={`py-2 text-xs font-black uppercase tracking-widest ${mode === 'signin' ? 'bg-foreground text-background' : 'bg-background text-foreground'}`}
                                >
                                    Sign in
                                </button>
                                <button
                                    type="button"
                                    disabled={!signupEnabled}
                                    onClick={() => setMode('register')}
                                    className={`py-2 text-xs font-black uppercase tracking-widest disabled:opacity-40 ${mode === 'register' ? 'bg-foreground text-background' : 'bg-background text-foreground'}`}
                                >
                                    Create account
                                </button>
                            </div>

                            {!signupEnabled && (
                                <p className="text-[11px] text-muted-foreground mb-4 text-center">
                                    New client? Continue with Google, or{' '}
                                    <a href={WHATSAPP} target="_blank" rel="noreferrer" className="font-bold underline">
                                        message us on WhatsApp
                                    </a>{' '}
                                    to get set up.
                                </p>
                            )}

                            {mode === 'signin' ? (
                                <Form {...loginForm}>
                                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                                        <FormField control={loginForm.control} name="identity" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">Email or username</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="you@company.com" autoComplete="username" className="border-foreground rounded-none" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={loginForm.control} name="password" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="••••••••" autoComplete="current-password" className="border-foreground rounded-none" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <Button type="submit" disabled={loading} className="w-full rounded-none font-bold uppercase tracking-widest border-2 border-transparent hover:border-black hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                                            {loading ? 'Signing in…' : 'Sign in'}
                                        </Button>
                                        <p className="text-center text-[11px] text-muted-foreground">
                                            <a href={WHATSAPP} target="_blank" rel="noreferrer" className="font-bold underline">
                                                Forgot password?
                                            </a>{' '}
                                            Message us on WhatsApp.
                                        </p>
                                    </form>
                                </Form>
                            ) : (
                                <Form {...registerForm}>
                                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                                        <FormField control={registerForm.control} name="name" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">Full name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Your name" autoComplete="name" className="border-foreground rounded-none" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={registerForm.control} name="email" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">Email</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="you@company.com" autoComplete="email" className="border-foreground rounded-none" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={registerForm.control} name="password" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="Min 8, letters + numbers" autoComplete="new-password" className="border-foreground rounded-none" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={registerForm.control} name="confirmPassword" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">Confirm password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="Repeat password" autoComplete="new-password" className="border-foreground rounded-none" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <Button type="submit" disabled={loading} className="w-full rounded-none font-bold uppercase tracking-widest border-2 border-transparent hover:border-black hover:bg-white hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                                            {loading ? 'Creating account…' : 'Create account'}
                                        </Button>
                                        <p className="text-[10px] text-center text-muted-foreground">
                                            By continuing you agree to our Terms and Privacy Policy.
                                        </p>
                                    </form>
                                </Form>
                            )}

                            {GOOGLE_CLIENT_ID && (
                                <>
                                    <div className="flex items-center gap-3 my-5">
                                        <div className="h-px flex-1 bg-foreground/20" />
                                        <span className="text-xs font-bold uppercase text-muted-foreground">or</span>
                                        <div className="h-px flex-1 bg-foreground/20" />
                                    </div>
                                    <div ref={googleBtn} className="flex justify-center" />
                                </>
                            )}

                            <p className="text-[10px] text-center text-muted-foreground mt-5">
                                You stay signed in for 30 days on this device. We renew the session while you are active.
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function ClientLoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginContent />
        </Suspense>
    );
}
