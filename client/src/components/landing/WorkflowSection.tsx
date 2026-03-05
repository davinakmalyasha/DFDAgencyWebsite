"use client";

import { ClipboardList, Sparkles, TerminalSquare, Rocket } from "lucide-react";
import { motion, Variants } from "framer-motion";

export function WorkflowSection() {
    const steps = [
        {
            phase: "PHASE 01",
            title: "Order & Onboard",
            description: "Kick off your project instantly. We integrate with your existing tools, establish communication channels, and define the core success metrics for your product.",
            icon: <ClipboardList className="w-5 h-5 text-white" />,
            placeholder: (
                <div className="w-full h-32 md:h-48 flex items-center justify-center opacity-20">
                    <svg className="w-24 h-24 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
            )
        },
        {
            phase: "PHASE 02",
            title: "AI Brief Generation",
            description: "Our proprietary AI engine parses your requirements to generate a comprehensive technical architecture and UI/UX strategy in minutes, not weeks.",
            icon: <Sparkles className="w-5 h-5 text-white" />,
            placeholder: (
                <div className="w-full h-32 md:h-48 flex flex-col items-center justify-center gap-4 opacity-20">
                    <div className="w-48 h-2 bg-zinc-950 rounded-full"></div>
                    <div className="w-32 h-2 bg-zinc-950 rounded-full"></div>
                    <div className="w-40 h-2 bg-zinc-950 rounded-full"></div>
                </div>
            )
        },
        {
            phase: "PHASE 03",
            title: "Rapid Coding",
            description: "Development begins with high-velocity sprints. We use modern tech stacks and automated testing to ensure a stable, scalable foundation from the first commit.",
            icon: <TerminalSquare className="w-5 h-5 text-white" />,
            placeholder: (
                <div className="w-full h-32 md:h-48 flex items-end justify-center gap-2 opacity-20">
                    <div className="w-16 h-16 bg-zinc-950 rounded-t-sm"></div>
                    <div className="w-24 h-32 bg-zinc-950 rounded-t-sm"></div>
                    <div className="w-20 h-24 bg-zinc-950 rounded-t-sm"></div>
                </div>
            )
        },
        {
            phase: "PHASE 04",
            title: "Launch & Scale",
            description: "Go live with confidence. We handle the deployment, monitoring, and infrastructure scaling to support your growth from 100 to 1,000,000 users.",
            icon: <Rocket className="w-5 h-5 text-white" />,
            placeholder: (
                <div className="w-full h-48 md:h-64 bg-zinc-950 rounded-2xl flex flex-col items-center justify-center text-white relative overflow-hidden">
                    <p className="absolute bottom-4 left-6 text-xs font-bold tracking-widest uppercase opacity-50">PRODUCTION READY</p>
                    <div className="w-32 h-32 rounded-full border-4 border-zinc-800 opacity-20"></div>
                </div>
            )
        },
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3,
            },
        },
    };

    const stepVariants: Variants = {
        hidden: { opacity: 0, x: -30 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.8, ease: "easeOut" }
        },
    };

    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="mx-auto w-[90%] max-w-[1280px]">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-24 flex flex-col items-center text-center"
                >
                    <span className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-6 block">
                        HOW WE WORK
                    </span>
                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-zinc-950 mb-8 leading-[1.1] max-w-4xl">
                        A modern process for<br />modern products.
                    </h2>
                    <p className="text-zinc-500 text-lg leading-relaxed max-w-2xl">
                        We&apos;ve optimized our delivery pipeline to maximize speed without
                        compromising on technical excellence. Here is your roadmap from idea to scale.
                    </p>
                </motion.div>

                {/* Timeline */}
                <div className="relative max-w-4xl mx-auto">
                    {/* Vertical Connecting Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-px bg-zinc-200 hidden md:block z-0"></div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="flex flex-col gap-24 relative z-10"
                    >
                        {steps.map((step, i) => (
                            <motion.div variants={stepVariants} key={i} className="flex flex-col md:flex-row gap-8 md:gap-16">
                                {/* Number & Icon Indicator */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-zinc-950 shadow-xl flex items-center justify-center shrink-0">
                                        {step.icon}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 pt-2">
                                    <div className="flex items-baseline gap-4 mb-4">
                                        <span className="text-[10px] font-black tracking-widest text-zinc-400">
                                            {step.phase}
                                        </span>
                                        <h3 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-950">
                                            {step.title}
                                        </h3>
                                    </div>
                                    <p className="text-zinc-500 leading-relaxed mb-12">
                                        {step.description}
                                    </p>

                                    {/* Abstract Visual Placeholder matching PNG */}
                                    <div className="w-full">
                                        {step.placeholder}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
