"use client";

import { motion } from "framer-motion";

export function FinalCta() {
    return (
        <section id="final-cta" className="bg-zinc-950 text-white rounded-t-[40px] md:rounded-t-[80px] overflow-hidden">
            <div className="mx-auto w-[90%] max-w-[1024px] py-32 md:py-48 text-center flex flex-col items-center">

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.15 }
                        }
                    }}
                    className="mb-12 overflow-hidden flex flex-col items-center"
                >
                    <motion.div variants={{ hidden: { y: "100%" }, visible: { y: 0, transition: { duration: 0.7, ease: "easeOut" } } }}>
                        <h2 className="text-5xl md:text-7xl lg:text-[120px] font-black tracking-tighter leading-[0.9] text-zinc-400">
                            FROM IDEA TO LIVE
                        </h2>
                    </motion.div>
                    <motion.div variants={{ hidden: { y: "100%" }, visible: { y: 0, transition: { duration: 0.7, ease: "easeOut" } } }}>
                        <h2 className="text-5xl md:text-7xl lg:text-[120px] font-black tracking-tighter leading-[0.9] text-white">
                            IN 7 DAYS
                        </h2>
                    </motion.div>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="max-w-xl text-zinc-400 text-lg md:text-xl leading-relaxed mb-16"
                >
                    We leverage proprietary AI pipelines to accelerate design, code generation,
                    and content creation. Quality is not sacrificed; it&apos;s engineered.
                </motion.p>

                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                    className="px-10 py-5 bg-white text-zinc-950 rounded-full font-bold text-lg hover:bg-zinc-200 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                >
                    Start Your Project
                </motion.button>

            </div>
        </section>
    );
}
