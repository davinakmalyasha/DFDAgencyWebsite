'use client';

import { LayoutDashboard, Users, MessageSquare, Briefcase, FileText, Settings, KeySquare, LogOut, Globe, ShieldAlert, Smartphone, Megaphone } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { toast } from "sonner";

const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/admin/orders', icon: Briefcase },
    { name: 'Leads', href: '/admin/leads', icon: Users },
    { name: 'Projects', href: '/admin/projects', icon: KeySquare },
    { name: 'Hosting', href: '/admin/hosting', icon: Globe },
    { name: 'Packages', href: '/admin/packages', icon: MessageSquare },
    { name: 'Articles', href: '/admin/articles', icon: FileText },
    { name: 'Promos', href: '/admin/promos', icon: Megaphone },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'System Logs', href: '/admin/logs', icon: ShieldAlert },
    { name: 'WA Session', href: '/admin/whatsapp', icon: Smartphone },
];

export function AppSidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            toast.info('Logged out seamlessly.');
            router.push('/admin/login');
            router.refresh();
        } catch (error) {
            toast.error('Logout failed.');
        }
    };

    return (
        <aside className={`w-64 border-r-2 border-foreground bg-background h-screen flex flex-col fixed inset-y-0 left-0 z-50 hidden lg:flex ${className}`}>
            {/* Header */}
            <div className="h-16 flex items-center px-4 border-b-2 border-foreground bg-muted/30 shrink-0">
                <h2 className="text-xl font-black tracking-tight uppercase">DFD Admin</h2>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-4">
                <div className="px-4 mb-2">
                    <p className="text-xs font-bold tracking-wider text-foreground/70 uppercase">Navigation</p>
                </div>
                <nav className="flex flex-col gap-1 px-2">
                    {navigation.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 text-sm font-bold border-2 border-transparent transition-none ${isActive
                                    ? 'bg-foreground text-background shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]'
                                    : 'text-foreground hover:bg-foreground hover:text-background'
                                    }`}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Footer / Logout */}
            <div className="p-4 border-t-2 border-foreground shrink-0">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 w-full text-left text-sm font-bold text-red-600 border-2 border-transparent hover:bg-red-600 hover:text-white transition-none"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <span>Terminate Session</span>
                </button>
            </div>
        </aside>
    );
}
