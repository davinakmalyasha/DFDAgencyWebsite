"use client";

import { Sparkles } from "lucide-react";
import { motion, Variants } from "framer-motion";

export function ComparisonTable() {
    const comparisons = [
        {
            feature: "Development Speed",
            freelancers: "Unpredictable / Often Lags",
            traditional: "Slow (3-6 Months)",
            dfd: "Rapid (Days-to-Market)",
        },
        {
            feature: "Engineering Quality",
            freelancers: "Inconsistent / Buggy",
            traditional: "Manual / Heavy Bloat",
            dfd: "Architectural Excellence",
        },
        {
            feature: "Pricing Logic",
            freelancers: "Cheap / Hidden Costs",
            traditional: "Inflated Agency Hours",
            dfd: "Value Engineering",
        },
        {
            feature: "Platform Security",
            freelancers: "Basic / Vulnerable",
            traditional: "Standard / Plugin-Heavy",
            dfd: "Hardened & Decoupled",
        },
        {
            feature: "Scalability",
            freelancers: "Limited / DIY feeling",
            traditional: "Manual Re-engineering",
            dfd: "Enterprise-Ready (Global)",
        },
    ];

    const tableRowVariants: Variants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
    };

    return (
        <section id="process" className="py-24 bg-zinc-50 border-b border-zinc-200/50">
            <div className="mx-auto w-[90%] max-w-[1024px]">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-950 mb-4">
                        The Engineering Edge
                    </h2>
                    <p className="text-zinc-500 max-w-2xl text-lg leading-relaxed">
                        A transparent contrast of how our orchestrated delivery pipeline provides 
                        elite-tier performance without the traditional agency bloat.
                    </p>
                </motion.div>

                {/* Table Container */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="w-full overflow-x-auto"
                >
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-zinc-200">
                                <th className="py-6 px-6 text-sm font-bold tracking-widest uppercase text-zinc-400 w-1/4">
                                    Feature
                                </th>
                                <th className="py-6 px-6 text-sm font-bold tracking-widest uppercase text-zinc-400 w-1/4">
                                    Freelancers
                                </th>
                                <th className="py-6 px-6 text-sm font-bold tracking-widest uppercase text-zinc-400 w-1/4">
                                    Traditional Agency
                                </th>
                                <th className="py-6 px-6 text-sm font-black tracking-widest uppercase text-zinc-950 bg-zinc-100 rounded-t-xl w-1/4">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        DFD Agency
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <motion.tbody
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                            variants={{
                                visible: { transition: { staggerChildren: 0.1 } }
                            }}
                        >
                            {comparisons.map((row, i) => (
                                <motion.tr
                                    variants={tableRowVariants}
                                    key={i}
                                    className="border-b border-zinc-200/50 hover:bg-white transition-colors"
                                >
                                    <td className="py-6 px-6 text-sm font-semibold text-zinc-950">
                                        {row.feature}
                                    </td>
                                    <td className="py-6 px-6 text-sm text-zinc-500">
                                        {row.freelancers}
                                    </td>
                                    <td className="py-6 px-6 text-sm text-zinc-500">
                                        {row.traditional}
                                    </td>
                                    <td className="py-6 px-6 text-sm font-bold text-zinc-950 bg-zinc-100 placeholder:last-of-type:rounded-b-xl">
                                        {row.dfd}
                                    </td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </table>
                </motion.div>
            </div>
        </section>
    );
}
