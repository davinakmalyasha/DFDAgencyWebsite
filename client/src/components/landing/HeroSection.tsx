"use client";

import { ArrowRight } from "lucide-react";
import { motion, Variants, useScroll, useTransform, useSpring, motionValue } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import Script from "next/script";

export function HeroSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end start"]
    });

    const yLeft = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const opacityLeft = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    const yRight = useTransform(scrollYProgress, [0, 1], [0, 150]);
    const scaleRight = useTransform(scrollYProgress, [0, 1], [1, 0.9]);

    // 3D Hover Effect variables
    const mouseX = motionValue(0);
    const mouseY = motionValue(0);

    // Smooth out the mouse values
    const smoothX = useSpring(mouseX, { damping: 20, stiffness: 150, mass: 0.5 });
    const smoothY = useSpring(mouseY, { damping: 20, stiffness: 150, mass: 0.5 });

    // Map mouse position to rotation (limited to small degrees for elegant effect)
    // Note: rotating X based on Y mouse, rotating Y based on X mouse
    const rotateX = useTransform(smoothY, [-250, 250], [10, -10]);
    const rotateY = useTransform(smoothX, [-250, 250], [-10, 10]);

    // Slight pop-out effect when hovering near the center
    const tiltDistance = useTransform(
        [smoothX, smoothY],
        ([x, y]) => Math.sqrt(Math.pow(x as number, 2) + Math.pow(y as number, 2))
    );
    const rotateZ = useTransform(tiltDistance, [0, 300], [50, 0]);
    // Animation Variants
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const textRevealVariants: Variants = {
        hidden: { y: "100%", opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.8, ease: "easeOut" }
        },
    };

    const fadeUpVariants: Variants = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.8, ease: "easeOut" }
        },
    };

    const scaleVariants: Variants = {
        hidden: { scale: 0.95, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: { duration: 1.2, ease: "easeOut" }
        },
    };

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": "DFD Agency",
        "alternateName": "Digital Foundry & Design",
        "description": "Elite Software Architecture and Senior TypeScript Development studio specializing in Next.js and high-performance digital experiences.",
        "url": process.env.NEXT_PUBLIC_SITE_URL || "https://dfdagency.com",
        "logo": "https://dfdagency.com/logo.png",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "ID"
        },
        "priceRange": "$$$"
    };

    return (
        <>
            <Script
                id="structured-data"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <section id="hero-section" ref={sectionRef} className="relative pt-24 pb-16 overflow-hidden min-h-[90vh] flex items-center">
            <div className="mx-auto w-[90%] max-w-[1440px]">

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center relative"
                >
                    {/* Left Text */}
                    <motion.div style={{ y: yLeft, opacity: opacityLeft }} className="max-w-2xl relative z-10">
                        {/* Elite Engineering Badge */}
                        <motion.div variants={fadeUpVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-200/50 mb-8">
                            <div className="w-2 h-2 rounded-full bg-zinc-950 animate-pulse"></div>
                            <span className="text-xs font-bold tracking-widest uppercase text-zinc-800">
                                Precision Engineering
                            </span>
                        </motion.div>

                        <h1 className="text-5xl md:text-6xl lg:text-[72px] font-black tracking-tighter leading-[1.05] mb-6">
                            {[
                                { text: "Designed to be", color: "text-zinc-950" },
                                { text: "Flawless.", color: "text-zinc-950" },
                                { text: "Dependable by", color: "text-zinc-400" },
                                { text: "nature", color: "text-zinc-950" }
                            ].map((line, i) => (
                                <span key={i} className="block overflow-hidden">
                                    <motion.span variants={textRevealVariants} className={`block ${line.color}`}>
                                        {line.text}
                                    </motion.span>
                                </span>
                            ))}
                        </h1>

                        <motion.div variants={fadeUpVariants} className="overflow-hidden mb-8">
                            <p className="text-base md:text-lg text-zinc-600 max-w-lg leading-relaxed">
                                We bridge the gap between human engineering and AI-Agent precision. Delivering 
                                elite-tier digital architecture at a fraction of traditional agency costs. 
                                We don&apos;t just build websites; we deploy high-performance assets.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUpVariants} className="flex flex-wrap items-center gap-4">
                            <Link href="/order">
                                <button className="flex items-center gap-2 bg-zinc-950 text-white px-8 py-4 rounded-full font-semibold hover:bg-zinc-800 hover:scale-105 transition-all duration-300 group">
                                    Initiate Project
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>
                            <button className="px-8 py-4 rounded-full font-semibold bg-white border border-zinc-200 text-zinc-950 hover:bg-zinc-100 transition-colors">
                                Success Stories
                            </button>
                        </motion.div>
                    </motion.div>

                    {/* Right Image/Box Area */}
                    <motion.div
                        style={{ y: yRight, scale: scaleRight, perspective: 1200 }}
                        className="relative h-[450px] lg:h-[520px] w-full z-0 group cursor-pointer"
                        onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left - rect.width / 2;
                            const y = e.clientY - rect.top - rect.height / 2;
                            mouseX.set(x);
                            mouseY.set(y);
                        }}
                        onMouseLeave={() => {
                            mouseX.set(0);
                            mouseY.set(0);
                        }}
                    >
                        {/* 3D Wrapper */}
                        <motion.div
                            className="w-full h-full relative"
                            style={{
                                rotateX,
                                rotateY,
                                z: rotateZ,
                                transformStyle: "preserve-3d",
                            }}
                        >
                            {/* The main dark placeholder box */}
                            <div className="absolute top-0 right-0 w-[90%] h-full bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.3)] transition-shadow duration-300 group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                                {/* Subtle gradient/lines illusion if needed, we'll keep it solid dark for now as requested */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a] to-[#0a0a0a] opacity-50"></div>

                                {/* Placeholder vertical lines mimicking the design animated */}
                                <div className="absolute inset-0 flex justify-evenly opacity-20">
                                    {[1, 2, 3].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ height: 0 }}
                                            animate={{ height: "100%" }}
                                            transition={{ duration: 1.5, delay: 0.8 + (i * 0.2), ease: "circOut" }}
                                            className="w-px bg-white origin-top"
                                        ></motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* The Floating Stats Box (99.9% Uptime) pushed out in 3D z-space */}
                            <motion.div
                                initial={{ y: 50, opacity: 0, scale: 0.9 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                transition={{ delay: 1.2, duration: 0.6, type: "spring", bounce: 0.4 }}
                                className="absolute bottom-12 -left-8 md:left-0 bg-white p-8 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] max-w-[280px] border border-zinc-100 z-20 group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.25)] transition-shadow duration-300"
                                style={{
                                    transform: "translateZ(80px)", // True CSS 3D floating effect
                                }}
                            >
                                <h3 className="text-4xl font-black tracking-tighter text-zinc-950 mb-2">
                                    10-Day
                                </h3>
                                <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-3">
                                    Avg. Deployment
                                </p>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    From strategic blueprint to global launch powered by AI-orchestrated engineering.
                                </p>
                            </motion.div>
                        </motion.div>
                    </motion.div>

                </motion.div>
            </div>
        </section>
        </>
    );
}
