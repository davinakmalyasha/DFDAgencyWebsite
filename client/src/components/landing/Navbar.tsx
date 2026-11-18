"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Magnetic } from "@/components/landing/Magnetic";
import { useSession } from "@/components/providers/SessionProvider";

const LINKS = ["Services", "Process", "Portfolio", "Pricing", "Team", "FAQ"];

export function Navbar() {
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const { user } = useSession();

    const dashboard = user?.role === "SUPERADMIN" || user?.role === "EDITOR"
        ? "/admin/dashboard"
        : "/client/dashboard";

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
                    <Link href="/" className="flex items-center gap-2">
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
                            key={item}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                        >
                            <Magnetic intensity={0.2}>
                                <Link
                                    href={`#${item.toLowerCase()}`}
                                    className="px-2 py-1 hover:text-zinc-950 transition-colors"
                                >
                                    {item}
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
                    {!user && (
                        <Link href="/client/login" className="text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-950 transition-colors">
                            Sign in
                        </Link>
                    )}
                    <Magnetic intensity={0.3}>
                        <Link href={user ? dashboard : "/start"}>
                            <Button className="rounded-full px-5 py-2 h-auto text-xs bg-zinc-950 text-white hover:bg-zinc-800 transition-colors">
                                {user ? "Dashboard" : "Get Started"}
                            </Button>
                        </Link>
                    </Magnetic>
                </motion.div>

                {/* Mobile toggle */}
                <button
                    type="button"
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
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
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            onClick={() => setMenuOpen(false)}
                            className="block text-sm font-bold uppercase tracking-widest text-zinc-700"
                        >
                            {item}
                        </Link>
                    ))}
                    <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
                        {!user ? (
                            <Link href="/client/login" className="text-xs font-bold uppercase tracking-widest text-zinc-600">
                                Sign in
                            </Link>
                        ) : (
                            <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[150px]">{user.email}</span>
                        )}
                        <Link href={user ? dashboard : "/start"} onClick={() => setMenuOpen(false)}>
                            <Button className="rounded-full px-5 py-2 h-auto text-xs bg-zinc-950 text-white hover:bg-zinc-800">
                                {user ? "Dashboard" : "Get Started"}
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </motion.nav>
    );
}
