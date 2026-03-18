"use client";

import { BrainCircuit, PenTool, Banknote, CheckCircle } from "lucide-react";
import { motion, Variants } from "framer-motion";

export function FeaturesSection() {
    const features = [
        {
            icon: <BrainCircuit className="w-5 h-5 text-zinc-950" />,
            title: "Expert + AI Hybrid",
            description: "Human engineering soul paired with AI-agent precision. We automate the foundational code to focus purely on high-level architecture.",
            highlights: ["AI ORCHESTRATION", "HUMAN SOUL"],
        },
        {
            icon: <PenTool className="w-5 h-5 text-zinc-950" />,
            title: "Architectural Excellence",
            description: "Every asset is hand-engineered for peak stability and design fidelity. We don't just 'make' websites; we craft robust digital foundations.",
            highlights: ["DESIGN FIDELITY", "ROBUST CODEBASE"],
        },
        {
            icon: <Banknote className="w-5 h-5 text-zinc-950" />,
            title: "Value Engineering",
            description: "Premium results at a non-agency price. By reducing manual build hours through AI, we pass the engineering savings directly to you.",
            highlights: ["ELITE QUALITY", "SMARTER PRICING"],
        },
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        },
    };

    return (
        <section id="services" className="py-24 bg-zinc-50 border-b border-zinc-200/50">
            <div className="mx-auto w-[90%] max-w-[1440px]">
                {/* Header */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={containerVariants}
                    className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16"
                >
                    <div className="max-w-2xl">
                        <motion.h4 variants={itemVariants} className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-6">
                            The DFD Advantage
                        </motion.h4>
                        <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-950 leading-[1.1]">
                            High-Performance Digital Architecture
                        </motion.h2>
                    </div>
                    <motion.p variants={itemVariants} className="text-zinc-500 max-w-sm text-sm leading-relaxed">
                        Fusing expert logic with AI precision to build robust digital foundations. Our automated engineering pipeline delivers elite-tier quality at a smarter, value-driven price point.
                    </motion.p>
                </motion.div>

                {/* Feature Cards Grid */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={containerVariants}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            className="bg-[#F4F4F5] p-10 rounded-2xl flex flex-col items-start border border-zinc-200/50 hover:border-zinc-300 transition-colors"
                        >
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center mb-8">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-extrabold tracking-tight text-zinc-950 mb-4">
                                {feature.title}
                            </h3>
                            <p className="text-zinc-600 text-sm leading-relaxed mb-auto pb-8">
                                {feature.description}
                            </p>

                            <div className="w-full pt-6 border-t border-zinc-200/60 mt-auto flex flex-col gap-3">
                                {feature.highlights.map((highlight, j) => (
                                    <div key={j} className="flex items-center gap-2">
                                        <CheckCircle className="w-3 h-3 text-zinc-400" />
                                        <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">
                                            {highlight}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
