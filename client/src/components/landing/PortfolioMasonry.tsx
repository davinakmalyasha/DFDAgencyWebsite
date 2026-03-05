"use client";

import { useRef } from "react";
import { ArrowUpRight, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, Variants, useScroll, useTransform } from "framer-motion";

// Local component for individual projects to track their own scroll parallax
function MasonryProjectItem({ item, variants }: { item: Record<string, unknown>, variants: Variants }) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    // Inner parallax: the image moves down slightly as you scroll down
    const yParallax = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

    // Clip-path reveal transition
    const clipVariants: Variants = {
        hidden: { clipPath: "inset(100% 0 0 0)", scale: 1.1 },
        visible: {
            clipPath: "inset(0% 0 0 0)",
            scale: 1,
            transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <motion.div variants={variants} className={`group cursor-pointer ${item.extraClass}`} data-cursor-text="VIEW">
            <div ref={ref} className={`w-full ${item.aspect} bg-zinc-100 mb-6 overflow-hidden relative`}>
                <motion.div
                    variants={clipVariants}
                    className="w-full h-full relative origin-bottom"
                >
                    <motion.div
                        style={{ y: yParallax }}
                        className={`absolute -inset-[20%] ${item.color} group-hover:scale-105 transition-transform duration-700 ease-out`}
                    ></motion.div>
                </motion.div>
            </div>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold tracking-tight text-zinc-950 uppercase mb-1 group-hover:text-zinc-600 transition-colors">{String(item.title || "")}</h3>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">{String(item.category || "")} / {String(item.year || "")}</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-950 group-hover:-translate-y-1 group-hover:translate-x-1 transition-all duration-300" />
            </div>
        </motion.div>
    );
}

export function PortfolioMasonry({ projects = [] }: { projects?: Record<string, unknown>[] }) {
    const tabs = ["ALL", "RESIDENTIAL", "COMMERCIAL", "INTERIOR", "CULTURAL"];

    // Default static items (fallback if DB is empty)
    const defaultLeft = [
        { title: "Monolith House", category: "Architecture", year: "2024", aspect: "aspect-[4/5]", color: "bg-zinc-300" },
        { title: "Obsidian Hub", category: "Office", year: "2023", aspect: "aspect-square", color: "bg-zinc-800" },
        { title: "Linear Villa", category: "Interior", year: "2022", aspect: "aspect-[4/5]", color: "bg-zinc-400" },
    ];

    const defaultRight = [
        { title: "Void Pavilion", category: "Installation", year: "2023", aspect: "aspect-square", color: "bg-zinc-400", extraClass: "md:w-3/4 ml-auto" },
        { title: "The Anchor", category: "Residential", year: "2024", aspect: "aspect-[16/10]", color: "bg-zinc-300", extraClass: "w-full" },
        { title: "Stark Retreat", category: "Residential", year: "2023", aspect: "aspect-[16/9]", color: "bg-zinc-500", extraClass: "w-full" },
    ];

    let leftColumn = defaultLeft as Record<string, unknown>[];
    let rightColumn = defaultRight as Record<string, unknown>[];

    if (projects.length > 0) {
        // Distribute dynamic projects
        const leftAspects = ["aspect-[4/5]", "aspect-square", "aspect-[4/5]"];
        const rightAspects = ["aspect-square", "aspect-[16/10]", "aspect-[16/9]"];

        leftColumn = projects.filter((_, i) => i % 2 === 0).map((p, index) => ({
            title: p.title,
            category: p.category,
            year: new Date((p.completionDate as string) || new Date().toISOString()).getFullYear().toString(),
            aspect: leftAspects[index % 3], // cycle through the 3 preset aspects
            color: "bg-zinc-300", // placeholder color since we don't have images yet
            extraClass: "",
        }));

        rightColumn = projects.filter((_, i) => i % 2 === 1).map((p, index) => ({
            title: p.title,
            category: p.category,
            year: new Date((p.completionDate as string) || new Date().toISOString()).getFullYear().toString(),
            aspect: rightAspects[index % 3],
            color: "bg-zinc-400",
            extraClass: index % 3 === 0 ? "md:w-3/4 ml-auto" : "w-full", // Give the first item the inset look
        }));
    }

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
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
        },
    };

    return (
        <section className="py-32 bg-zinc-50 border-b border-zinc-200/50 overflow-hidden">
            <div className="mx-auto w-[90%] max-w-[1440px]">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-16"
                >
                    <h2 className="text-[12vw] md:text-[8vw] lg:text-[140px] font-black tracking-tighter text-zinc-950 leading-[0.8] mb-8">
                        PROJECTS
                    </h2>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                        <p className="text-zinc-500 max-w-sm text-lg leading-relaxed">
                            A curated selection of architectural excellence. We explore the
                            intersection of structural minimalism and functional permanence.
                        </p>

                        {/* Filter Tabs */}
                        <div className="flex flex-wrap items-center gap-6 md:gap-8 pb-4 border-b border-zinc-200/50 w-full md:w-auto">
                            {tabs.map((tab, i) => (
                                <button
                                    key={i}
                                    className={`text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${i === 0 ? "text-zinc-950 border-b-2 border-zinc-950 pb-2 -mb-[18px]" : "text-zinc-400 hover:text-zinc-950 pb-2 -mb-[18px]"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Masonry Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16 lg:gap-y-24"
                >
                    {/* LEFT COLUMN */}
                    <div className="flex flex-col gap-16 lg:gap-24">
                        {leftColumn.map((item, i) => (
                            <MasonryProjectItem key={i} item={item} variants={itemVariants} />
                        ))}
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="flex flex-col gap-16 lg:gap-24 pt-0 md:pt-32">
                        {rightColumn.map((item, i) => (
                            <MasonryProjectItem key={i} item={item} variants={itemVariants} />
                        ))}
                    </div>

                </motion.div>

                {/* Footer Navigation */}
                <div className="mt-24 pt-8 justify-between items-center border-t border-zinc-200/50 hidden md:flex">
                    <button className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-zinc-950 hover:text-zinc-600 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Prev
                    </button>

                    <div className="flex gap-4 text-[10px] font-black tracking-widest text-zinc-400">
                        <span className="text-zinc-950">01</span>
                        <span>02</span>
                        <span>03</span>
                        <span>04</span>
                    </div>

                    <button className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-zinc-950 hover:text-zinc-600 transition-colors">
                        Next
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

            </div>
        </section>
    );
}
