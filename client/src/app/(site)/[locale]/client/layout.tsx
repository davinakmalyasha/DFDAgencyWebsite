'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { AuthGate } from '@/components/auth/AuthGate';
import { useSession } from '@/components/providers/SessionProvider';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { useDictionary, useLocale } from '@/i18n/provider';
import { localePath } from '@/i18n/config';
import { cn } from '@/lib/utils';
import {
    ArrowUpRight,
    ChevronDown,
    LayoutDashboard,
    LogOut,
    MessageCircle,
    Plus,
    UserRound,
} from 'lucide-react';

const WHATSAPP =
    'https://wa.me/62895324350359?text=Hi%20DFD%2C%20I%20need%20help%20with%20my%20client%20account';

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

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useSession();
    const locale = useLocale();
    const dict = useDictionary();
    const t = dict.portal.nav;

    const nav = [
        { href: localePath(locale, '/client/dashboard'), label: t.overview, icon: LayoutDashboard },
        { href: localePath(locale, '/client/profile'), label: t.profile, icon: UserRound },
    ];
    const loginPath = localePath(locale, '/client/login');
    const orderPath = localePath(locale, '/order');

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            toast.success(t.signedOut);
        } catch {
            toast.error(t.signOutFailed);
        } finally {
            try {
                window.sessionStorage.removeItem('dfd_session_user');
            } catch {
                /* ignore */
            }
            window.location.replace(loginPath);
        }
    };

    if (pathname.endsWith('/client/login')) {
        return <>{children}</>;
    }

    return (
        <AuthGate loginPath={loginPath}>
            <div className="relative flex min-h-screen flex-col bg-zinc-50 text-zinc-950">
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[440px] bg-[radial-gradient(ellipse_at_top,_rgba(24,24,27,0.075),_transparent_62%)]"
                />

                <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl">
                    <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
                        <Link
                            href={localePath(locale, '/client/dashboard')}
                            className="group flex shrink-0 items-center gap-3"
                        >
                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-950 text-[11px] font-black tracking-tight text-white shadow-sm transition-transform duration-300 group-hover:-rotate-6">
                                DFD
                            </span>
                            <span className="hidden flex-col leading-none sm:flex">
                                <span className="text-sm font-bold tracking-tight">DFD Agency</span>
                                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                                    {dict.common.clientPortal}
                                </span>
                            </span>
                        </Link>

                        <nav className="ml-2 hidden items-center gap-1 rounded-full border border-zinc-200/80 bg-zinc-100/60 p-1 md:flex">
                            {nav.map((item) => {
                                const active = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        aria-current={active ? 'page' : undefined}
                                        className={cn(
                                            'flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200',
                                            active
                                                ? 'bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/80'
                                                : 'text-zinc-500 hover:text-zinc-900'
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="ml-auto flex items-center gap-2">
                            <LanguageSwitcher className="hidden sm:inline-flex" />
                            <Link
                                href={orderPath}
                                className="hidden h-9 items-center gap-1.5 rounded-full bg-zinc-950 px-4 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 md:inline-flex"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {t.newProject}
                            </Link>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-2.5 text-left shadow-sm transition-colors hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/20"
                                    >
                                        <span className="grid h-7 w-7 place-items-center rounded-full bg-zinc-950 text-[11px] font-bold text-white">
                                            {initials(user?.username)}
                                        </span>
                                        <span className="hidden flex-col leading-tight lg:flex">
                                            <span className="max-w-[140px] truncate text-xs font-semibold capitalize text-zinc-900">
                                                {displayName(user?.username)}
                                            </span>
                                            <span className="max-w-[160px] truncate text-[10px] text-zinc-400">
                                                {user?.email || dict.common.clientPortal}
                                            </span>
                                        </span>
                                        <ChevronDown className="hidden h-3.5 w-3.5 text-zinc-400 lg:block" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    sideOffset={8}
                                    className="w-60 rounded-2xl border-zinc-200 p-1.5 shadow-xl shadow-zinc-950/5"
                                >
                                    <DropdownMenuLabel className="px-3 py-2">
                                        <span className="block truncate text-sm font-semibold capitalize text-zinc-900">
                                            {displayName(user?.username)}
                                        </span>
                                        <span className="mt-0.5 block truncate text-xs font-normal text-zinc-500">
                                            {user?.email}
                                        </span>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-zinc-100" />
                                    <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2 text-sm">
                                        <Link href={localePath(locale, '/client/dashboard')}>
                                            <LayoutDashboard className="mr-2 h-4 w-4 text-zinc-400" />
                                            {t.overview}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2 text-sm">
                                        <Link href={localePath(locale, '/client/profile')}>
                                            <UserRound className="mr-2 h-4 w-4 text-zinc-400" />
                                            {t.profileSecurity}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2 text-sm">
                                        <Link href={orderPath}>
                                            <Plus className="mr-2 h-4 w-4 text-zinc-400" />
                                            {t.startProject}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-zinc-100" />
                                    <DropdownMenuItem
                                        onSelect={handleLogout}
                                        className="cursor-pointer rounded-xl px-3 py-2 text-sm font-medium text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        {t.signOut}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 border-t border-zinc-100 px-4 pb-2 pt-1.5 md:hidden">
                        {nav.map((item) => {
                            const active = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                                        active ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:bg-zinc-100'
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                        <LanguageSwitcher className="sm:hidden" />
                        <Link
                            href={orderPath}
                            className="ml-auto flex items-center gap-1.5 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 sm:ml-0"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span className="sm:hidden">{dict.common.newProject.split(' ')[0]}</span>
                            <span className="hidden sm:inline">{t.newProject}</span>
                        </Link>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                    {children}
                </main>

                <footer className="border-t border-zinc-200/70">
                    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                        <p>
                            © {new Date().getFullYear()} DFD Agency · {dict.common.clientPortal}
                        </p>
                        <div className="flex items-center gap-4">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                {dict.portal.footer.secureSession}
                            </span>
                            <a
                                href={WHATSAPP}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-medium text-zinc-600 transition-colors hover:text-zinc-950"
                            >
                                <MessageCircle className="h-3.5 w-3.5" />
                                {dict.portal.footer.needHelp}
                                <ArrowUpRight className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </AuthGate>
    );
}
