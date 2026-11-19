'use client';

import { useState } from 'react';
import { api } from '@/lib/axios';
import { useSession } from '@/components/providers/SessionProvider';
import { useDictionary, useLocale } from '@/i18n/provider';
import { localePath } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    ArrowUpRight,
    Eye,
    EyeOff,
    KeyRound,
    LogOut,
    Mail,
    MessageCircle,
    ShieldCheck,
    UserRound,
} from 'lucide-react';

const WHATSAPP = 'https://wa.me/62895324350359?text=Hi%20DFD%2C%20I%20need%20help%20with%20my%20client%20account';

function initials(name?: string | null) {
    if (!name) return 'DF';
    const parts = name.replace(/[._-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'DF';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function displayName(name?: string | null) {
    if (!name) return 'Client';
    return name.replace(/[._-]+/g, ' ');
}

function PasswordField({
    id,
    label,
    value,
    onChange,
    autoComplete,
    hint,
    showLabel,
    hideLabel,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    autoComplete: string;
    hint?: string;
    showLabel: string;
    hideLabel: string;
}) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-xs font-semibold text-zinc-600">
                {label}
            </Label>
            <div className="relative">
                <Input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    required
                    autoComplete={autoComplete}
                    className="h-10 rounded-xl border-zinc-200 bg-white pr-10 text-sm shadow-none focus-visible:ring-zinc-950/20"
                />
                <button
                    type="button"
                    onClick={() => setVisible((state) => !state)}
                    aria-label={visible ? hideLabel : showLabel}
                    className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
                >
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
            {hint && <p className="text-[11px] text-zinc-400">{hint}</p>}
        </div>
    );
}

export default function ProfilePage() {
    const { user } = useSession();
    const locale = useLocale();
    const dict = useDictionary();
    const t = dict.portal.profile;
    const showPassword = locale === 'id' ? 'Tampilkan kata sandi' : 'Show password';
    const hidePassword = locale === 'id' ? 'Sembunyikan kata sandi' : 'Hide password';
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error(t.passwordsMismatch);
            return;
        }
        if (newPassword.length < 8) {
            toast.error(t.passwordShort);
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/change-password', { currentPassword, newPassword });
            toast.success(t.changed);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch {
            toast.error(t.changeFailed);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            toast.success(dict.portal.nav.signedOut);
        } catch {
            toast.error(dict.portal.nav.signOutFailed);
        } finally {
            try {
                window.sessionStorage.removeItem('dfd_session_user');
            } catch {
                /* ignore */
            }
            window.location.replace(localePath(locale, '/client/login'));
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">{t.eyebrow}</p>
                <h1 className="mt-2 text-3xl font-black tracking-tighter sm:text-4xl">{t.title}</h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">{t.description}</p>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                {/* Identity */}
                <div className="space-y-4">
                    <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                        <div className="relative overflow-hidden bg-zinc-950 px-6 pb-16 pt-6 text-white">
                            <div
                                aria-hidden
                                className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/5 blur-2xl"
                            />
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                                {t.clientAccount}
                            </p>
                            <div className="relative mt-6 flex items-center gap-4">
                                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10 text-xl font-black tracking-tight ring-1 ring-white/15">
                                    {initials(user?.username)}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-lg font-bold capitalize tracking-tight">
                                        {displayName(user?.username)}
                                    </p>
                                    <p className="mt-0.5 truncate text-xs text-zinc-400">{user?.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 -mt-10 px-6 pb-6">
                            <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-50 text-zinc-500">
                                        <UserRound className="h-3.5 w-3.5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                                            {t.username}
                                        </p>
                                        <p className="truncate text-sm font-medium capitalize text-zinc-900">
                                            {displayName(user?.username)}
                                        </p>
                                    </div>
                                </div>
                                <div className="h-px bg-zinc-100" />
                                <div className="flex items-center gap-3">
                                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-50 text-zinc-500">
                                        <Mail className="h-3.5 w-3.5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                                            {t.email}
                                        </p>
                                        <p className="truncate text-sm font-medium text-zinc-900">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="h-px bg-zinc-100" />
                                <div className="flex items-center gap-3">
                                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-50 text-zinc-500">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                                            {t.access}
                                        </p>
                                        <p className="truncate text-sm font-medium capitalize text-zinc-900">
                                            {user?.role?.toLowerCase() === 'client'
                                                ? t.client
                                                : user?.role?.toLowerCase() || t.client}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div className="flex items-start gap-2 rounded-2xl bg-zinc-50 px-3.5 py-3">
                                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                    <p className="text-[11px] leading-relaxed text-zinc-500">
                                        <span className="font-semibold text-zinc-700">{t.sessionActive}</span>{' '}
                                        {t.sessionActiveDescription}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleLogout}
                                    className="h-10 w-full rounded-full border-zinc-200 bg-white text-xs font-semibold text-zinc-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    {t.signOutDevice}
                                </Button>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                        <div className="flex items-start gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-50 text-zinc-500">
                                <MessageCircle className="h-4 w-4" />
                            </span>
                            <div>
                                <h2 className="text-sm font-bold tracking-tight">{t.changeDetailsTitle}</h2>
                                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                                    {t.changeDetailsDescription}
                                </p>
                                <a
                                    href={WHATSAPP}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 underline-offset-4 hover:underline"
                                >
                                    {t.messageWhatsapp}
                                    <ArrowUpRight className="h-3 w-3" />
                                </a>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Security */}
                <section className="rounded-3xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                    <div className="flex items-start gap-3 border-b border-zinc-100 px-6 py-5">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-950 text-white">
                            <KeyRound className="h-4 w-4" />
                        </span>
                        <div>
                            <h2 className="text-base font-bold tracking-tight">{t.changePassword}</h2>
                            <p className="mt-0.5 text-xs text-zinc-500">{t.securityDescription}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
                        <PasswordField
                            id="current-password"
                            label={t.currentPassword}
                            value={currentPassword}
                            onChange={setCurrentPassword}
                            autoComplete="current-password"
                            showLabel={showPassword}
                            hideLabel={hidePassword}
                        />
                        <PasswordField
                            id="new-password"
                            label={t.newPassword}
                            value={newPassword}
                            onChange={setNewPassword}
                            autoComplete="new-password"
                            hint={t.hint}
                            showLabel={showPassword}
                            hideLabel={hidePassword}
                        />
                        <PasswordField
                            id="confirm-password"
                            label={t.confirmPassword}
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            autoComplete="new-password"
                            showLabel={showPassword}
                            hideLabel={hidePassword}
                        />

                        <div className="rounded-2xl bg-zinc-50 px-3.5 py-3">
                            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-zinc-500">
                                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                {t.sessionNote}
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                'h-10 w-full rounded-full bg-zinc-950 text-sm font-semibold text-white transition-colors hover:bg-zinc-800',
                                loading && 'opacity-70'
                            )}
                        >
                            {loading ? t.saving : t.updatePassword}
                        </Button>

                        <p className="text-center text-[11px] text-zinc-400">
                            {t.forgotCurrent}{' '}
                            <a
                                href={WHATSAPP}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-zinc-700 underline underline-offset-2"
                            >
                                {t.messageUs}
                            </a>
                        </p>
                    </form>
                </section>
            </div>
        </div>
    );
}
