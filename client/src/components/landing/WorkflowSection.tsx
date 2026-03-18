"use client";

import { ShieldCheck, Compass, Cpu, Globe } from "lucide-react";
import { motion, Variants } from "framer-motion";

export function WorkflowSection() {
    const steps = [
        {
            phase: "PHASE 01",
            title: "Secure Foundation",
            description: "Initiate the vision. Secure your development slot and lock in the high-performance engineering resources required for your architectural success.",
            icon: <ShieldCheck className="w-5 h-5 text-white" />,
            placeholder: (
                <div className="w-full h-32 md:h-48 flex items-center justify-center opacity-10">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <div className="absolute inset-0 border-[8px] border-zinc-950 rounded-full opacity-20"></div>
                        <div className="w-24 h-24 border-4 border-zinc-950 rounded-xl relative flex items-center justify-center bg-zinc-50">
                            <div className="w-2 h-12 bg-zinc-950 rounded-full"></div>
                        </div>
                        <div className="absolute top-1/2 left-0 w-full h-px bg-zinc-950 -translate-y-1/2 opacity-20"></div>
                        <div className="absolute top-0 left-1/2 w-px h-full bg-zinc-950 -translate-x-1/2 opacity-20"></div>
                    </div>
                </div>
            )
        },
        {
            phase: "PHASE 02",
            title: "Strategic Blueprinting",
            description: "Architecture before code. We sync on your business goals and map out a technical blueprint that guarantees flawless results and peak performance.",
            icon: <Compass className="w-5 h-5 text-white" />,
            placeholder: (
                <div className="w-full h-32 md:h-48 relative overflow-hidden opacity-10 border border-zinc-200 rounded-xl bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:32px_32px]">
                    <div className="absolute top-1/4 left-1/4 w-32 h-20 border-2 border-zinc-950 border-dashed rounded-sm"></div>
                    <div className="absolute top-1/2 left-1/2 w-48 h-32 border-2 border-zinc-950 rounded-sm -translate-x-1/2 -translate-y-1/2"></div>
                </div>
            )
        },
        {
            phase: "PHASE 03",
            title: "Orchestrated Engineering",
            description: "High-Performance Logic meets AI-Agent precision. We rapidly build your site using our elite dev-stack, ensuring perfect speed and impregnable security.",
            icon: <Cpu className="w-5 h-5 text-white" />,
            placeholder: (
                <div className="w-full h-32 md:h-48 flex flex-col justify-center gap-4 px-8 opacity-10">
                    <div className="flex gap-4 items-center">
                        <div className="w-3 h-3 rounded-full bg-zinc-950"></div>
                        <div className="h-2 w-full bg-zinc-950 rounded-full"></div>
                    </div>
                    <div className="flex gap-4 items-center ml-12">
                        <div className="h-2 w-2/3 bg-zinc-200 rounded-full"></div>
                        <div className="w-12 h-4 border-2 border-zinc-950 rounded-sm"></div>
                    </div>
                    <div className="flex gap-4 items-center ml-4">
                        <div className="w-3 h-3 border-2 border-zinc-950 rounded-full"></div>
                        <div className="h-2 w-3/4 bg-zinc-950 rounded-full"></div>
                    </div>
                </div>
            )
        },
        {
            phase: "PHASE 04",
            title: "Ecosystem Ascension",
            description: "Live & Beyond. We deploy your site to the global edge and provide you with your Tracking Dashboard to manage your business growth on autopilot.",
            icon: <Globe className="w-5 h-5 text-white" />,
            placeholder: (
                <div className="w-full h-48 md:h-64 bg-zinc-950 rounded-2xl flex flex-col items-center justify-center text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,#fff_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                    <div className="w-40 h-40 rounded-full border border-white/20 flex items-center justify-center relative">
                        <div className="absolute w-2 h-2 bg-white rounded-full top-0 left-1/2 -translate-x-1/2 pulse shadow-[0_0_10px_#fff]"></div>
                        <div className="absolute w-2 h-2 bg-white rounded-full bottom-8 left-4 pulse shadow-[0_0_10px_#fff]"></div>
                        <div className="w-24 h-24 rounded-full border-4 border-white/40 animate-pulse"></div>
                    </div>
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
                        Engineered for Speed.<br />Built for Excellence.
                    </h2>
                    <p className="text-zinc-500 text-lg leading-relaxed max-w-2xl">
                        We&apos;ve removed the friction. Our orchestrated delivery pipeline is 
                        engineered for peak velocity and total transparency.
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
