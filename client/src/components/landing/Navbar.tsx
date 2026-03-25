"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { Magnetic } from "@/components/landing/Magnetic";
import { TrackOrderDialog } from "./TrackOrderDialog";

export function Navbar() {
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() ?? 0;
        if (latest > previous && latest > 150) {
            setHidden(true);
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
                                src="/logo.png"
                                alt="DFD Agency Logo"
                                fill
                                className="object-cover"
                                sizes="40px"
                                priority
                            />
                        </motion.div>
                    </Link>
                </Magnetic>

                {/* Navigation Links */}
                <div className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-zinc-500 uppercase tracking-widest">
                    {["Services", "Process", "Portfolio", "Pricing", "Team", "FAQ"].map((item, i) => (
                        <motion.div
                            key={item}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                        >
                            <Magnetic intensity={0.2}>
                                <Link
                                    href={item === "Order" ? "/order" : `#${item.toLowerCase()}`}
                                    className="px-2 py-1 hover:text-zinc-950 transition-colors"
                                >
                                    {item}
                                </Link>
                            </Magnetic>
                        </motion.div>
                    ))}

                    {/* Track Project Dialog Trigger */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + 5 * 0.1, duration: 0.5 }}
                    >
                        <Magnetic intensity={0.2}>
                            <TrackOrderDialog>
                                <button className="px-2 py-1 font-semibold text-zinc-950 hover:text-zinc-600 transition-colors cursor-pointer outline-none">
                                    Track Order
                                </button>
                            </TrackOrderDialog>
                        </Magnetic>
                    </motion.div>
                </div>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                >
                    <Magnetic intensity={0.3}>
                        <Link href="/order">
                            <Button
                                className="rounded-full px-5 py-2 h-auto text-xs bg-zinc-950 text-white hover:bg-zinc-800 transition-colors"
                            >
                                Initiate Project
                            </Button>
                        </Link>
                    </Magnetic>
                </motion.div>
            </div>
        </motion.nav>
    );
}
