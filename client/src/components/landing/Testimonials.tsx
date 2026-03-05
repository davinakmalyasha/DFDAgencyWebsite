"use client";

import { motion, Variants } from "framer-motion";

export function Testimonials() {
    const testimonials = [
        {
            quote: "DFD Agency transformed our digital presence with unparalleled sophistication. Their eye for structural balance is simply unmatched in the industry.",
            author: "ALEX RIVERA",
            role: "CEO OF LUMA",
            image: "https://i.pravatar.cc/100?img=33"
        },
        {
            quote: "A premium partnership that redefined our brand's luxury positioning. The aesthetic clarity they brought to our portfolio was transformative.",
            author: "JULIAN VANE",
            role: "FOUNDER OF NOIR",
            image: "https://i.pravatar.cc/100?img=59"
        },
        {
            quote: "Excellence is an understatement. DFD Agency delivers a level of craft rarely seen in the digital space. Truly a bespoke experience from start to finish.",
            author: "ELENA ROSSI",
            role: "PARTNER AT ROSSI & CO",
            image: "https://i.pravatar.cc/100?img=44"
        },
        {
            quote: "The attention to detail and architectural precision is world-class. They don't just build websites; they craft digital monuments.",
            author: "SARAH CHEN",
            role: "CREATIVE DIRECTOR, ARCHI",
            image: "https://i.pravatar.cc/100?img=20"
        },
        {
            quote: "Minimalism is hard to master. DFD Agency makes it look effortless. Their design philosophy aligns perfectly with our high-end requirements.",
            author: "MARCUS THORNE",
            role: "MARKETING HEAD, OBELISK",
            image: "https://i.pravatar.cc/100?img=11"
        },
        {
            quote: "They understood our vision before we could even articulate it. The final result was a minimalist masterpiece that speaks volumes through its silence.",
            author: "DAVID KIMM",
            role: "LEAD ARCHITECT, STUDIO K",
            image: "https://i.pravatar.cc/100?img=68"
        }
    ];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" },
        },
    };

    return (
        <section className="py-32 bg-white border-b border-zinc-200/50">
            <div className="mx-auto w-[90%] max-w-[1440px]">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 mb-24"
                >
                    <div>
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-400 mb-6 block">
                            CLIENT TESTIMONIALS
                        </span>
                        <h2 className="text-5xl md:text-7xl lg:text-[100px] font-black tracking-tighter text-zinc-950 leading-[0.9]">
                            Voices of<br />Excellence
                        </h2>
                    </div>

                    <div className="flex flex-col items-start lg:items-end gap-6 max-w-sm text-left lg:text-right">
                        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 leading-relaxed">
                            ARCHITECTING DIGITAL LEGACIES FOR THE WORLD&apos;S MOST DISCERNING BRANDS.
                        </p>
                        <button className="px-6 py-3 border border-zinc-200 text-xs font-bold tracking-widest uppercase hover:bg-zinc-50 transition-colors">
                            CASE STUDIES &rarr;
                        </button>
                    </div>
                </motion.div>

                {/* Testimonials Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {testimonials.map((t, i) => (
                        <motion.div variants={itemVariants} key={i} className="flex flex-col justify-between p-10 border border-zinc-200/60 bg-white hover:border-zinc-300 hover:shadow-xl transition-all duration-500 min-h-[320px]">

                            <div className="relative mb-8">
                                {/* Decorative large quote mark */}
                                <span className="absolute -top-6 -left-4 text-8xl font-serif text-zinc-100 select-none z-0">
                                    &ldquo;
                                </span>
                                <p className="text-zinc-600 text-lg leading-relaxed relative z-10">
                                    <span className="font-semibold text-zinc-950">{t.quote.charAt(0)}</span>
                                    {t.quote.slice(1)}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 mt-auto pt-8 border-t border-zinc-100">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 shrink-0 filter grayscale">
                                    <img src={t.image} alt={t.author} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black tracking-tight text-zinc-950 uppercase">{t.author}</h4>
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{t.role}</p>
                                </div>
                            </div>

                        </motion.div>
                    ))}
                </motion.div>

            </div>
        </section>
    );
}
