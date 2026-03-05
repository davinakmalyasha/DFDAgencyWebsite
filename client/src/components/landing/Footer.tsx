"use client";

import Link from "next/link";
import { Twitter, Instagram, Linkedin, Github } from "lucide-react";
import { motion } from "framer-motion";

export function Footer() {
    return (
        <footer className="bg-white pt-24 pb-12">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mx-auto w-[90%] max-w-[1440px]"
            >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-24 pr-0 md:pr-12">

                    {/* Logo / Brand Info */}
                    <div className="col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-6 h-6 bg-zinc-950 rounded-[4px]"></div>
                            <span className="font-extrabold text-xl tracking-tight">DFD AGENCY</span>
                        </Link>
                        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
                            Architecting digital legacies for the world&apos;s most discerning brands.
                        </p>
                    </div>

                    {/* Links - Services */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-2">SERVICES</h4>
                        <Link href="#" className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors">UI/UX Design</Link>
                        <Link href="#" className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors">Web Development</Link>
                        <Link href="#" className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors">Branding</Link>
                        <Link href="#" className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors">Consulting</Link>
                    </div>

                    {/* Links - Legal */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-2">LEGAL</h4>
                        <Link href="#" className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors">Privacy Policy</Link>
                        <Link href="#" className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors">Terms of Service</Link>
                        <Link href="#" className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors">Cookie Policy</Link>
                        <Link href="#" className="text-sm text-zinc-600 hover:text-zinc-950 transition-colors">Accessibility</Link>
                    </div>

                    {/* Links - Connect */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-2">CONNECT</h4>
                        <div className="flex gap-4 mb-4">
                            <a href="#" className="text-zinc-400 hover:text-zinc-950 transition-colors"><Twitter className="w-5 h-5" /></a>
                            <a href="#" className="text-zinc-400 hover:text-zinc-950 transition-colors"><Instagram className="w-5 h-5" /></a>
                            <a href="#" className="text-zinc-400 hover:text-zinc-950 transition-colors"><Linkedin className="w-5 h-5" /></a>
                            <a href="#" className="text-zinc-400 hover:text-zinc-950 transition-colors"><Github className="w-5 h-5" /></a>
                        </div>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest leading-relaxed">
                            Stay updated with our latest insights and digital trends.
                        </p>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-zinc-200/50">
                    <p className="text-xs text-zinc-400">
                        &copy; 2024 DFD Agency. All rights reserved.
                    </p>
                    <p className="text-[10px] tracking-widest uppercase font-bold text-zinc-300 mt-4 md:mt-0">
                        MINIMALIST MONOCHROME
                    </p>
                </div>
            </motion.div>
        </footer>
    );
}
