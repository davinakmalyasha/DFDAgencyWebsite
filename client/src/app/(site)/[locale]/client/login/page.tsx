'use client';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { useDictionary, useLocale } from '@/i18n/provider';
import { localePath, localizeNextPath } from '@/i18n/config';
import { toast } from 'sonner';
import {
    ArrowLeft,
    ArrowUpRight,
    CheckCircle2,
    Eye,
    EyeOff,
    FolderOpen,
    Loader2,
    MessageCircle,
    ShieldCheck,
    Sparkles,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type LoginValues = { identity: string; password: string };
type RegisterValues = { name: string; email: string; password: string; confirmPassword: string };
type OtpValues = { code: string };
type OtpStep = { kind: 'login' | 'signup'; id: number; email: string };

type ApiFailure = {
    response?: {
        data?: { message?: string; error?: string };
    };
};

interface GoogleCredentialResponse {
    credential?: string;
}

interface GoogleIdentityServices {
    accounts: {
        id: {
            initialize: (options: {
                client_id: string;
                callback: (response: GoogleCredentialResponse) => void;
                ux_mode?: string;
            }) => void;
            renderButton: (
                parent: HTMLElement,
                options: { theme?: string; size?: string; width?: number; text?: string }
            ) => void;
        };
    };
}

declare global {
    interface Window { google?: GoogleIdentityServices }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const WHATSAPP = 'https://wa.me/62895324350359?text=Hi%20DFD%2C%20I%20need%20help%20with%20my%20client%20account';

function destinationFor(role: string, next: string | null) {
    if (role === 'SUPERADMIN' || role === 'EDITOR') return '/admin/dashboard';
    return next || '/client/dashboard';
}

function LoginFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
    );
}

const inputClass =
    'h-11 rounded-xl border-zinc-200 bg-white text-sm shadow-none focus-visible:ring-zinc-950/20';

const primaryButtonClass =
    'h-11 w-full rounded-full bg-zinc-950 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 disabled:opacity-60';

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <FormLabel className="text-xs font-semibold text-zinc-600">{children}</FormLabel>;
}

function LoginContent() {
    const searchParams = useSearchParams();
    const locale = useLocale();
    const dict = useDictionary();
    const t = dict.auth;
    const v = t.validation;
    const next = localizeNextPath(searchParams.get('next'), locale);
    const [mode, setMode] = useState<'signin' | 'register'>('signin');
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState<OtpStep | null>(null);
    const [signupEnabled, setSignupEnabled] = useState(false);
    const [resendIn, setResendIn] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const googleBtn = useRef<HTMLDivElement>(null);
    const googleHandler = useRef<(resp: GoogleCredentialResponse) => void>(() => {});
    const showPasswordLabel = locale === 'id' ? 'Tampilkan kata sandi' : 'Show password';
    const hidePasswordLabel = locale === 'id' ? 'Sembunyikan kata sandi' : 'Hide password';

    const schemas = useMemo(() => ({
        login: z.object({
            identity: z.string().min(1, v.identityRequired),
            password: z.string().min(8, v.passwordMin),
        }),
        register: z.object({
            name: z.string().min(2, v.nameMin),
            email: z.string().email(v.emailInvalid),
            password: z
                .string()
                .min(8, v.passwordMin)
                .regex(/[A-Za-z]/, v.letter)
                .regex(/\d/, v.number),
            confirmPassword: z.string().min(8, v.confirm),
        }).refine((value) => value.password === value.confirmPassword, {
            message: v.mismatch,
            path: ['confirmPassword'],
        }),
        otp: z.object({
            code: z.string().regex(/^\d{6}$/, v.otp),
        }),
    }), [v]);

    const loginForm = useForm<LoginValues>({
        resolver: zodResolver(schemas.login),
        defaultValues: { identity: '', password: '' },
    });
    const registerForm = useForm<RegisterValues>({
        resolver: zodResolver(schemas.register),
        defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    });
    const otpForm = useForm<OtpValues>({ resolver: zodResolver(schemas.otp), defaultValues: { code: '' } });

    const finish = useCallback((role: string) => {
        const fallback = localePath(locale, '/client/dashboard');
        const destination = destinationFor(role, next || fallback);
        window.location.assign(destination);
    }, [locale, next]);

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

    const onGoogle = useCallback(async (resp: GoogleCredentialResponse) => {
        if (!resp?.credential) return;
        setLoading(true);
        try {
            const r = await api.post('/auth/google', { idToken: resp.credential });
            if (r.data.success) {
                toast.success(t.welcomeToast);
                finish(r.data.data.user.role);
            }
        } catch {
            toast.error(t.errors.google, { description: t.errors.tryAgain });
        } finally {
            setLoading(false);
        }
    }, [finish, t]);

    useEffect(() => {
        googleHandler.current = onGoogle;
    }, [onGoogle]);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || !googleBtn.current) return;
        const render = () => {
            if (!window.google || !googleBtn.current) return;
            try {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: (resp: GoogleCredentialResponse) => googleHandler.current(resp),
                    ux_mode: 'popup',
                });
                window.google.accounts.id.renderButton(googleBtn.current, {
                    theme: 'outline',
                    size: 'large',
                    width: Math.min(320, Math.max(240, window.innerWidth - 88)),
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
                    toast.success(t.codeSentToast);
                } else {
                    finish(r.data.data.user.role);
                }
            }
        } catch {
            toast.error(t.errors.login);
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
                toast.success(t.codeSentToast);
            }
        } catch (error) {
            const failure = error as ApiFailure;
            const code = failure.response?.data?.error;
            if (code === 'EMAIL_TAKEN') {
                loginForm.setValue('identity', data.email);
                setMode('signin');
                toast.error(t.errors.emailTaken, { description: t.errors.emailTakenDescription });
            } else {
                toast.error(t.errors.register, { description: failure.response?.data?.message || t.errors.tryAgain });
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
                toast.success(otp.kind === 'login' ? t.signedInToast : t.accountCreatedToast);
                finish(r.data.data.user.role);
            }
        } catch {
            toast.error(t.errors.verification);
        } finally {
            setLoading(false);
        }
    }

    async function resendSignup() {
        if (!otp || otp.kind !== 'signup' || resendIn > 0) return;
        try {
            await api.post('/auth/register/resend', { signupId: otp.id });
            setResendIn(30);
            toast.success(t.newCodeToast);
        } catch {
            toast.error(t.errors.resend);
        }
    }

    return (
        <div className="min-h-screen bg-white text-zinc-950 lg:grid lg:grid-cols-[1.04fr_1fr]">
            {/* Brand side */}
            <aside className="relative hidden overflow-hidden bg-zinc-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -right-28 -top-24 h-[26rem] w-[26rem] rounded-full bg-white/[0.06] blur-3xl"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-40 -left-24 h-[30rem] w-[30rem] rounded-full bg-white/[0.04] blur-3xl"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
                />

                <Link href={localePath(locale, '/')} className="relative flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[12px] font-black tracking-tight text-zinc-950">
                        DFD
                    </span>
                    <span className="flex flex-col leading-none">
                        <span className="text-sm font-bold tracking-tight">DFD Agency</span>
                        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                            {dict.common.clientPortal}
                        </span>
                    </span>
                </Link>

                <div className="relative max-w-lg py-12">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                            {t.privateWorkspace}
                        </span>
                    </div>
                    <h1 className="mt-7 text-5xl font-black leading-[1.03] tracking-tighter xl:text-6xl">
                        {t.headline}
                        <br />
                        <span className="text-zinc-500">{t.headlineMuted}</span>
                    </h1>
                    <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-400">{t.intro}</p>

                    <div className="mt-9 space-y-4">
                        {[
                            { icon: Zap, title: t.featureLiveTitle, body: t.featureLiveBody },
                            { icon: CheckCircle2, title: t.featureApprovalsTitle, body: t.featureApprovalsBody },
                            { icon: FolderOpen, title: t.featureFilesTitle, body: t.featureFilesBody },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.title} className="flex items-start gap-3.5">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300">
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{item.title}</p>
                                        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{item.body}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-9 flex flex-wrap gap-2">
                        {[t.tagSession, t.tagCookies, t.tagSignIn].map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-medium text-zinc-400"
                            >
                                <ShieldCheck className="h-3 w-3" />
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="relative flex items-center justify-between text-[11px] text-zinc-600">
                    <span>© {new Date().getFullYear()} DFD Agency</span>
                    <Link
                        href={localePath(locale, '/')}
                        className="inline-flex items-center gap-1 transition-colors hover:text-zinc-300"
                    >
                        {t.backWebsite}
                        <ArrowUpRight className="h-3 w-3" />
                    </Link>
                </div>
            </aside>

            {/* Form side */}
            <main className="flex min-h-screen flex-col">
                <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
                    <Link href={localePath(locale, '/')} className="flex items-center gap-2.5 lg:hidden">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-950 text-[11px] font-black text-white">
                            DFD
                        </span>
                        <span className="text-sm font-bold tracking-tight">DFD Agency</span>
                    </Link>
                    <div className="ml-auto flex items-center gap-3">
                        <LanguageSwitcher />
                        <a
                            href={WHATSAPP}
                            target="_blank"
                            rel="noreferrer"
                            className="hidden items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-950 sm:inline-flex"
                        >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {t.needHelp}
                        </a>
                        <Link
                            href={localePath(locale, '/')}
                            className="hidden items-center gap-1 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-950 sm:inline-flex"
                        >
                            {t.backSite}
                            <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-center px-5 pb-14 pt-2 sm:px-8">
                    <div className="w-full max-w-[420px]">
                        {otp ? (
                            <div>
                                <button
                                    type="button"
                                    onClick={() => { setOtp(null); otpForm.reset(); }}
                                    className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-950"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    {t.backToSignIn}
                                </button>

                                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-950 text-white">
                                    <Sparkles className="h-5 w-5" />
                                </span>
                                <h1 className="mt-5 text-3xl font-black tracking-tighter">{t.verifyTitle}</h1>
                                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                                    {t.verifySentPrefix}{' '}
                                    <span className="font-semibold text-zinc-800">{otp.email}</span>.{' '}
                                    {t.verifySentSuffix}
                                </p>

                                <Form {...otpForm}>
                                    <form onSubmit={otpForm.handleSubmit(onVerify)} className="mt-7 space-y-4">
                                        <FormField control={otpForm.control} name="code" render={({ field }) => (
                                            <FormItem>
                                                <FieldLabel>{t.verificationCode}</FieldLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="000000"
                                                        inputMode="numeric"
                                                        maxLength={6}
                                                        autoComplete="one-time-code"
                                                        className="h-14 rounded-2xl border-zinc-200 bg-white text-center text-2xl font-bold tracking-[0.45em] shadow-none focus-visible:ring-zinc-950/20"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <Button type="submit" disabled={loading} className={primaryButtonClass}>
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                            {loading ? t.verifying : t.verify}
                                        </Button>
                                        {otp.kind === 'signup' && (
                                            <button
                                                type="button"
                                                disabled={resendIn > 0}
                                                onClick={resendSignup}
                                                className="w-full text-center text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-950 disabled:opacity-50"
                                            >
                                                {resendIn > 0
                                                    ? t.resendIn.replace('{seconds}', String(resendIn))
                                                    : t.resend}
                                            </button>
                                        )}
                                    </form>
                                </Form>
                            </div>
                        ) : (
                            <div>
                                <div className="mb-8">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                                        {t.clientPortal}
                                    </p>
                                    <h1 className="mt-2 text-3xl font-black tracking-tighter sm:text-[34px]">
                                        {mode === 'signin' ? t.welcomeBack : t.createAccount}
                                    </h1>
                                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                                        {mode === 'signin' ? t.welcomeSub : t.createSub}
                                    </p>
                                </div>

                                <div className="mb-6 flex rounded-full bg-zinc-100 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setMode('signin')}
                                        className={cn(
                                            'flex-1 rounded-full py-2 text-xs font-semibold transition-all duration-200',
                                            mode === 'signin'
                                                ? 'bg-white text-zinc-950 shadow-sm'
                                                : 'text-zinc-500 hover:text-zinc-800'
                                        )}
                                    >
                                        {t.signInTab}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!signupEnabled}
                                        onClick={() => setMode('register')}
                                        className={cn(
                                            'flex-1 rounded-full py-2 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40',
                                            mode === 'register'
                                                ? 'bg-white text-zinc-950 shadow-sm'
                                                : 'text-zinc-500 hover:text-zinc-800'
                                        )}
                                    >
                                        {t.createTab}
                                    </button>
                                </div>

                                {!signupEnabled && (
                                    <p className="mb-5 rounded-xl bg-zinc-50 px-3.5 py-2.5 text-[11px] leading-relaxed text-zinc-500">
                                        {t.newClient} {t.newClientGoogle}{' '}
                                        <a
                                            href={WHATSAPP}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-semibold text-zinc-800 underline underline-offset-2"
                                        >
                                            {t.messageWhatsapp}
                                        </a>{' '}
                                        {t.setUp}
                                    </p>
                                )}

                                {mode === 'signin' ? (
                                    <Form {...loginForm}>
                                        <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                                            <FormField control={loginForm.control} name="identity" render={({ field }) => (
                                                <FormItem>
                                                    <FieldLabel>{t.emailOrUsername}</FieldLabel>
                                                    <FormControl>
                                                        <Input placeholder={t.emailPlaceholder} autoComplete="username" className={inputClass} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={loginForm.control} name="password" render={({ field }) => (
                                                <FormItem>
                                                    <FieldLabel>{t.password}</FieldLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                type={showPassword ? 'text' : 'password'}
                                                                placeholder={t.passwordPlaceholder}
                                                                autoComplete="current-password"
                                                                className={cn(inputClass, 'pr-10')}
                                                                {...field}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPassword((state) => !state)}
                                                                aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
                                                                className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
                                                            >
                                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <Button type="submit" disabled={loading} className={primaryButtonClass}>
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                                {loading ? t.signingIn : t.signIn}
                                            </Button>
                                            <p className="text-center text-[11px] text-zinc-400">
                                                {t.forgot}{' '}
                                                <a
                                                    href={WHATSAPP}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-semibold text-zinc-700 underline underline-offset-2"
                                                >
                                                    {t.messageWhatsapp}
                                                </a>
                                            </p>
                                        </form>
                                    </Form>
                                ) : (
                                    <Form {...registerForm}>
                                        <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                                            <FormField control={registerForm.control} name="name" render={({ field }) => (
                                                <FormItem>
                                                    <FieldLabel>{t.fullName}</FieldLabel>
                                                    <FormControl>
                                                        <Input placeholder={t.fullNamePlaceholder} autoComplete="name" className={inputClass} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={registerForm.control} name="email" render={({ field }) => (
                                                <FormItem>
                                                    <FieldLabel>{t.email}</FieldLabel>
                                                    <FormControl>
                                                        <Input type="email" placeholder={t.emailPlaceholder} autoComplete="email" className={inputClass} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={registerForm.control} name="password" render={({ field }) => (
                                                <FormItem>
                                                    <FieldLabel>{t.password}</FieldLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                type={showPassword ? 'text' : 'password'}
                                                                placeholder={t.passwordMin}
                                                                autoComplete="new-password"
                                                                className={cn(inputClass, 'pr-10')}
                                                                {...field}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPassword((state) => !state)}
                                                                aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
                                                                className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
                                                            >
                                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={registerForm.control} name="confirmPassword" render={({ field }) => (
                                                <FormItem>
                                                    <FieldLabel>{t.confirmPassword}</FieldLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                type={showConfirm ? 'text' : 'password'}
                                                                placeholder={t.confirmPlaceholder}
                                                                autoComplete="new-password"
                                                                className={cn(inputClass, 'pr-10')}
                                                                {...field}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowConfirm((state) => !state)}
                                                                aria-label={showConfirm ? hidePasswordLabel : showPasswordLabel}
                                                                className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
                                                            >
                                                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <Button type="submit" disabled={loading} className={primaryButtonClass}>
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                                {loading ? t.creating : t.create}
                                            </Button>
                                            <p className="text-center text-[10px] leading-relaxed text-zinc-400">
                                                {t.termsPrefix}{' '}
                                                <Link href={localePath(locale, '/terms')} className="underline underline-offset-2 hover:text-zinc-700">{t.terms}</Link>{' '}
                                                {t.and}{' '}
                                                <Link href={localePath(locale, '/privacy')} className="underline underline-offset-2 hover:text-zinc-700">{t.privacy}</Link>.
                                            </p>
                                        </form>
                                    </Form>
                                )}

                                {GOOGLE_CLIENT_ID && (
                                    <>
                                        <div className="my-6 flex items-center gap-3">
                                            <div className="h-px flex-1 bg-zinc-200" />
                                            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                                                {t.orContinue}
                                            </span>
                                            <div className="h-px flex-1 bg-zinc-200" />
                                        </div>
                                        <div ref={googleBtn} className="flex justify-center" />
                                    </>
                                )}

                                <div className="mt-6 flex items-start gap-2 rounded-xl bg-zinc-50 px-3.5 py-2.5">
                                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                    <p className="text-[10px] leading-relaxed text-zinc-500">{t.sessionNote}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
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
