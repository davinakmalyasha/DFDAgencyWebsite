"use client";

import { Linkedin, Mail, Github, Cpu, Award, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function TeamSection() {
    return (
        <section id="team" className="py-32 bg-white border-b border-zinc-200/50">
            <div className="mx-auto w-[90%] max-w-[1024px]">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center text-center mb-24"
                >
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 mb-6 block">
                        The Core Logic
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-zinc-950 mb-8">
                        The Lead Orchestrator.
                    </h2>
                    <p className="text-zinc-500 text-lg leading-relaxed max-w-2xl">
                        At DFD, we&apos;ve replaced agency bloat with architectural precision. One visionary engineer, 
                        orchestrating a swarm of high-performance AI agents to build what others take months to design.
                    </p>
                </motion.div>

                {/* Founder Feature */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
                    
                    {/* Visual Side */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-200 shadow-2xl relative group">
                            <img
                                src="/founder.jpg"
                                alt="Davin Akmal Yasha"
                                className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700"
                            />
                        </div>
                    </motion.div>

                    {/* Content Side */}
                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="mb-10">
                            <h3 className="text-4xl font-black tracking-tight text-zinc-950 mb-2">Davin Akmal Yasha</h3>
                            <p className="text-sm font-bold tracking-[0.3em] uppercase text-zinc-400">Founder & Lead Software Architect</p>
                        </div>

                        <div className="space-y-8 mb-12">
                            <div className="flex gap-4">
                                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 flex-shrink-0 h-fit">
                                    <Cpu className="w-5 h-5 text-zinc-950" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-zinc-950 mb-1">Hybrid Orchestration</h4>
                                    <p className="text-sm text-zinc-500 leading-relaxed">
                                        Fusing classical software architecture with cutting-edge AI pipelines to deliver 
                                        mathematically optimized performance.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 flex-shrink-0 h-fit">
                                    <Award className="w-5 h-5 text-zinc-950" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-zinc-950 mb-1">Security-First Mindset</h4>
                                    <p className="text-sm text-zinc-500 leading-relaxed">
                                        Specialized in decoupled, hardened ecosystems. Every line of code is audited 
                                        for zero-vulnerability reliability.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 flex-shrink-0 h-fit">
                                    <Zap className="w-5 h-5 text-zinc-950" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-zinc-950 mb-1">Velocity Expert</h4>
                                    <p className="text-sm text-zinc-500 leading-relaxed">
                                        Leveraging AI agents to automate the boilerplate, focusing 100% of human logic 
                                        on your business&apos;s core unique value.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                            <a 
                                href="https://www.linkedin.com/in/davin-yasa-974ba82a1/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-950 transition-colors group"
                            >
                                <Linkedin className="w-4 h-4" />
                                <span>LinkedIn</span>
                            </a>
                            <a 
                                href="https://github.com/davinakmalyasha" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-950 transition-colors group"
                            >
                                <Github className="w-4 h-4" />
                                <span>GitHub</span>
                            </a>
                            <a 
                                href="mailto:davinyasa06@gmail.com" 
                                className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-950 transition-colors group"
                            >
                                <Mail className="w-4 h-4" />
                                <span>Email</span>
                            </a>
                        </div>
                    </motion.div>
                </div>

                {/* Modern Studio CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col md:flex-row items-center justify-between gap-8 p-12 bg-zinc-950 text-white rounded-3xl overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black tracking-tight mb-2 text-white">
                            Ready to scale with a rock-solid foundation?
                        </h3>
                        <p className="text-sm text-zinc-400">
                            Stop paying for agency bloat. Start building with elite engineering precision.
                        </p>
                    </div>
                    <button className="relative z-10 px-10 py-5 rounded-full font-bold bg-white text-zinc-950 hover:bg-zinc-100 hover:scale-105 transition-all duration-300 whitespace-nowrap text-sm shadow-xl">
                        BOOK ARCHITECTURE SYNC
                    </button>
                </motion.div>

            </div>
        </section>
    );
}
