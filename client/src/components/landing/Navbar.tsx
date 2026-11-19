"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Magnetic } from "@/components/landing/Magnetic";
import { useDictionary, useLocale } from "@/i18n/provider";
import { localePath } from "@/i18n/config";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useSession } from "@/components/providers/SessionProvider";

const LINKS = [
    { href: '#services', key: 'services' },
    { href: '#process', key: 'process' },
    { href: '#portfolio', key: 'portfolio' },
    { href: '#pricing', key: 'pricing' },
    { href: '#team', key: 'team' },
    { href: '#faq', key: 'faq' },
] as const;

export function Navbar() {
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const { user } = useSession();
    const locale = useLocale();
    const dict = useDictionary();

    const dashboard = user?.role === "SUPERADMIN" || user?.role === "EDITOR"
        ? "/admin/dashboard"
        : localePath(locale, "/client/dashboard");

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() ?? 0;
        if (latest > previous && latest > 150) {
            setHidden(true);
            setMenuOpen(false);
        } else {
            setHidden(false);
        }
    });

    return (
        <motion.nav
            variants={{
                visible: { y: 0, transition: { duration: 0.35, ease: "easeInOut" } },
                hidden: { y: "-100%", transition: { duration: 0.35, ease: "easeInOut" } },
            }}
            animate={hidden ? "hidden" : "visible"}
            initial="visible"
            className="fixed top-0 left-0 right-0 z-[100] bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200/50"
        >
            <div className="mx-auto w-[90%] max-w-[1440px] h-16 flex items-center justify-between">
                {/* Logo */}
                <Magnetic intensity={0.2}>
                    <Link href={localePath(locale, '/')} className="flex items-center gap-2">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 20 }}
                            className="relative w-10 h-10 overflow-hidden rounded-[8px]"
                        >
                            <Image
                                src="/logo-opt.webp"
                                alt="DFD Agency Logo"
                                fill
                                className="object-cover"
                                sizes="40px"
                                priority
                                unoptimized
                            />
                        </motion.div>
                    </Link>
                </Magnetic>

                {/* Navigation Links */}
                <div className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-zinc-500 uppercase tracking-widest">
                    {LINKS.map((item, i) => (
                        <motion.div
                            key={item.key}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                        >
                            <Magnetic intensity={0.2}>
                                <Link
                                    href={item.href}
                                    className="px-2 py-1 hover:text-zinc-950 transition-colors"
                                >
                                    {dict.nav[item.key]}
                                </Link>
                            </Magnetic>
                        </motion.div>
                    ))}
                </div>

                {/* Desktop CTA */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="hidden sm:flex items-center gap-3"
                >
                    <LanguageSwitcher />
                    {!user && (
                        <Link href={localePath(locale, '/client/login')} className="text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-950 transition-colors">
                            {dict.nav.signIn}
                        </Link>
                    )}
                    <Magnetic intensity={0.3}>
                        <Link href={user ? dashboard : localePath(locale, '/start')}>
                            <Button className="rounded-full px-5 py-2 h-auto text-xs bg-zinc-950 text-white hover:bg-zinc-800 transition-colors">
                                {user ? dict.nav.dashboard : dict.nav.getStarted}
                            </Button>
                        </Link>
                    </Magnetic>
                </motion.div>

                {/* Mobile toggle */}
                <button
                    type="button"
                    aria-label={menuOpen ? dict.nav.closeMenu : dict.nav.openMenu}
                    onClick={() => setMenuOpen((open) => !open)}
                    className="lg:hidden p-2 border border-zinc-300 rounded-full text-zinc-950"
                >
                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {menuOpen && (
                <div className="lg:hidden border-t border-zinc-200 bg-zinc-50 px-5 py-4 space-y-3">
                    {LINKS.map((item) => (
                        <Link
                            key={item.key}
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className="block text-sm font-bold uppercase tracking-widest text-zinc-700"
                        >
                            {dict.nav[item.key]}
                        </Link>
                    ))}
                    <div className="pt-3 border-t border-zinc-200 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                {dict.language.label}
                            </span>
                            <LanguageSwitcher />
                        </div>
                        <div className="flex items-center justify-between">
                            {!user ? (
                                <Link href={localePath(locale, '/client/login')} className="text-xs font-bold uppercase tracking-widest text-zinc-600">
                                    {dict.nav.signIn}
                                </Link>
                            ) : (
                                <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[150px]">{user.email}</span>
                            )}
                            <Link href={user ? dashboard : localePath(locale, '/start')} onClick={() => setMenuOpen(false)}>
                                <Button className="rounded-full px-5 py-2 h-auto text-xs bg-zinc-950 text-white hover:bg-zinc-800">
                                    {user ? dict.nav.dashboard : dict.nav.getStarted}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </motion.nav>
    );
}
