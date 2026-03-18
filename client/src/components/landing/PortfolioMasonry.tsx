"use client";

import { useRef, useState, useMemo } from "react";
import { ArrowUpRight, ArrowLeft, ArrowRight, Play } from "lucide-react";
import { motion, Variants, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface ProjectItem {
    title: string;
    category: string;
    year: string;
    aspect: string;
    color: string;
    extraClass?: string;
    thumbnailUrl?: string;
}

// Local component for individual projects to track their own scroll parallax
function MasonryProjectItem({ item, variants }: { item: ProjectItem, variants: Variants }) {
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
            <div ref={ref} className={`w-full ${item.aspect} bg-zinc-100 mb-6 overflow-hidden relative rounded-sm`}>
                <motion.div
                    variants={clipVariants}
                    className="w-full h-full relative origin-bottom"
                >
                    <motion.div
                        style={{ y: yParallax }}
                        className={`absolute -inset-[20%] ${item.thumbnailUrl ? "" : item.color} group-hover:scale-110 transition-transform duration-1000 ease-out`}
                    >
                        {item.thumbnailUrl && (
                            <Image 
                                src={String(item.thumbnailUrl)} 
                                alt={String(item.title)} 
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        )}
                    </motion.div>

                    {/* Premium Hover Overlay */}
                    <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-[2px] flex items-center justify-center">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="w-16 h-16 rounded-full border border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center">
                                <Play className="w-6 h-6 text-white fill-white ml-1" />
                            </div>
                            <span className="text-[10px] font-black tracking-[0.3em] text-white uppercase">View Case Study</span>
                        </motion.div>
                    </div>
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

export function PortfolioMasonry({ projects = [] }: { projects?: any[] }) {
    const tabs = ["ALL", "PLATFORM", "E-COMMERCE", "LANDING", "SaaS", "CUSTOM"];
    const [activeTab, setActiveTab] = useState("ALL");

    const allItems = useMemo(() => {
        return projects.map((p): ProjectItem => ({
            title: p.title,
            category: p.category,
            thumbnailUrl: p.thumbnailUrl,
            year: new Date((p.completionDate as string) || new Date().toISOString()).getFullYear().toString(),
            aspect: "aspect-square", // Default aspect
            color: "bg-zinc-300",
        }));
    }, [projects]);

    const filteredItems = useMemo(() => {
        if (activeTab === "ALL") return allItems;
        return allItems.filter(item => item.category.toUpperCase() === activeTab.toUpperCase());
    }, [activeTab, allItems]);

    // Redstribute into columns
    const leftColumn = filteredItems.filter((_, i) => i % 2 === 0).map((item, i) => ({
        ...item,
        aspect: i % 2 === 0 ? "aspect-[4/5]" : "aspect-square"
    }));

    const rightColumn = filteredItems.filter((_, i) => i % 2 === 1).map((item, i) => ({
        ...item,
        aspect: i % 2 === 0 ? "aspect-square" : "aspect-[16/10]",
        extraClass: i === 0 ? "md:w-3/4 ml-auto" : "w-full"
    }));

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
                            A curated selection of high-performance digital assets. We explore the
                            intersection of elite software architecture and seamless user experience.
                        </p>

                        {/* Filter Tabs */}
                        <div className="flex flex-wrap items-center gap-6 md:gap-8 pb-4 border-b border-zinc-200/50 w-full md:w-auto">
                            {tabs.map((tab, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 relative ${activeTab === tab ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-950"
                                        }`}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <motion.div 
                                            layoutId="activeTab"
                                            className="absolute -bottom-[18px] left-0 right-0 h-0.5 bg-zinc-950"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Masonry Grid / Empty State */}
                {allItems.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="py-24 border-y-2 border-zinc-950/10 flex flex-col items-center justify-center text-center"
                    >
                        <div className="mb-8 relative">
                            <h3 className="text-[10vw] font-black text-zinc-100 uppercase select-none leading-none">Zero_Point</h3>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-black tracking-[0.5em] uppercase text-zinc-400 bg-zinc-50 px-4">Initializing Portfolio</span>
                            </div>
                        </div>
                        <p className="max-w-md text-zinc-400 text-sm font-medium uppercase tracking-widest leading-relaxed px-4">
                            Our architecture lab is currently refining the next generation of digital assets. 
                            Stay synchronized for the upcoming release.
                        </p>
                        <div className="mt-12 flex flex-col items-center gap-4">
                            <div className="w-12 h-[2px] bg-zinc-950/20" />
                            <span className="text-[8px] font-mono text-zinc-300 uppercase tracking-[0.3em]">DFD_ENGINE / STATUS: STANDBY</span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16 lg:gap-y-24"
                    >
                        <AnimatePresence mode="popLayout">
                            {/* LEFT COLUMN */}
                            <div className="flex flex-col gap-16 lg:gap-24">
                                {leftColumn.map((item, i) => (
                                    <MasonryProjectItem key={`${activeTab}-left-${i}`} item={item} variants={itemVariants} />
                                ))}
                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="flex flex-col gap-16 lg:gap-24 pt-0 md:pt-32">
                                {rightColumn.map((item, i) => (
                                    <MasonryProjectItem key={`${activeTab}-right-${i}`} item={item} variants={itemVariants} />
                                ))}
                            </div>
                        </AnimatePresence>
                    </motion.div>
                )}

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
