"use client";

import { motion } from "framer-motion";
import { useDictionary, useLocale } from "@/i18n/provider";

export function FinalCta() {
    const dict = useDictionary();
    const locale = useLocale();
    const whatsappText = encodeURIComponent(
        locale === 'id' ? 'Halo, saya tertarik dengan layanan DFD.' : 'Hey im interested'
    );
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
                            {dict.finalCta.line1}
                        </h2>
                    </motion.div>
                    <motion.div variants={{ hidden: { y: "100%" }, visible: { y: 0, transition: { duration: 0.7, ease: "easeOut" } } }}>
                        <h2 className="text-5xl md:text-7xl lg:text-[120px] font-black tracking-tighter leading-[0.9] text-white">
                            {dict.finalCta.line2}
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
                    {dict.finalCta.description}
                </motion.p>

                <a 
                    href={`https://wa.me/62895324350359?text=${whatsappText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                        className="px-10 py-5 bg-white text-zinc-950 rounded-full font-bold text-lg hover:bg-zinc-200 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                    >
                        {dict.finalCta.button}
                    </motion.button>
                </a>

            </div>
        </section>
    );
}
