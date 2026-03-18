"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface ProjectDesc {
    id: number;
    title: string;
    slug: string;
    clientName: string;
    thumbnailUrl: string;
    testimonialQuote: string | null;
    testimonialAuthor: string | null;
}

export function Testimonials({ projects }: { projects: ProjectDesc[] }) {
    // Filter projects that have a testimonial and taking the 6 most recent ones
    const testimonials = projects
        .filter(p => p.testimonialQuote && p.testimonialQuote.length > 5)
        .slice(0, 6);

    // If no testimonials, we show a "Coming Soon" or "Social Proof Pending" state 
    // instead of hiding the section entirely to manage user expectations.
    const isEmpty = testimonials.length === 0;

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

                {/* Testimonials Grid / Empty State */}
                {isEmpty ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="p-12 border-2 border-dashed border-zinc-100 flex flex-col items-center justify-center text-center bg-zinc-50/30"
                    >
                        <div className="space-y-4">
                            <div className="flex justify-center gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-4 h-4 bg-zinc-100 rounded-full animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                                ))}
                            </div>
                            <h3 className="text-xl font-bold tracking-tight text-zinc-950 uppercase">Syncing Public Feedback</h3>
                            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
                                Our client success stories are currently undergoing validation. 
                                Verified excellence results will appear here shortly.
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {testimonials.map((t) => (
                            <TestimonialCard key={t.id} t={t} variants={itemVariants} />
                        ))}
                    </motion.div>
                )}

            </div>
        </section>
    );
}

function TestimonialCard({ t, variants }: { t: ProjectDesc; variants: Variants }) {
    return (
        <motion.div variants={variants} className="flex flex-col justify-between p-10 border border-zinc-200/60 bg-white hover:border-zinc-300 hover:shadow-xl transition-all duration-500 min-h-[320px] relative group overflow-hidden">
            {/* Hidden Client Logo Background (Subtle Texture) */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110"></div>

            <div className="relative mb-8 z-10 flex-grow">
                {/* Decorative large quote mark */}
                <span className="absolute -top-6 -left-4 text-8xl font-serif text-zinc-100 select-none z-0">
                    &ldquo;
                </span>
                <p className="text-zinc-600 text-lg leading-relaxed relative z-10 whitespace-pre-wrap line-clamp-6">
                    <span className="font-semibold text-zinc-950">{t.testimonialQuote?.charAt(0)}</span>
                    {t.testimonialQuote?.slice(1)}
                </p>
            </div>

            <div className="flex items-center justify-between gap-4 mt-auto pt-8 border-t border-zinc-100 z-10">
                <div>
                    <h4 className="text-sm font-black tracking-tight text-zinc-950 uppercase line-clamp-1">{t.testimonialAuthor || t.clientName}</h4>
                    <Link href={`/portfolio/${t.slug}`} className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 hover:text-zinc-950 transition-colors inline-flex items-center mt-1">
                        View Project &rarr;
                    </Link>
                </div>
                
                <div className="w-12 h-12 shrink-0 filter grayscale group-hover:grayscale-0 transition-all rounded-[4px] overflow-hidden border border-zinc-200 bg-zinc-50 flex items-center justify-center">
                    <TestimonialImage src={t.thumbnailUrl} alt={t.title} />
                </div>
            </div>
        </motion.div>
    );
}

function TestimonialImage({ src, alt }: { src: string | null; alt: string }) {
    const [isError, setIsError] = useState(false);

    return (
        <Image 
            src={isError || !src ? "/logo.png" : src} 
            alt={alt} 
            width={48} 
            height={48} 
            className="w-full h-full object-cover"
            onError={() => setIsError(true)}
            unoptimized={isError}
        />
    );
}
