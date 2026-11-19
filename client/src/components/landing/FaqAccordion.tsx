"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDictionary } from "@/i18n/provider";

export function FaqAccordion() {
    const dict = useDictionary();
    const faqs = dict.faq.items;

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <section className="py-32 bg-zinc-50 border-b border-zinc-200/50" id="faq">
            <div className="mx-auto w-[90%] max-w-[800px]">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-950 mb-6">
                        {dict.faq.title}
                    </h2>
                    <p className="text-zinc-500 text-lg leading-relaxed">
                        {dict.faq.description}
                    </p>
                </motion.div>

                {/* Accordion */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="flex flex-col gap-4 mb-16"
                >
                    {faqs.map((faq, i) => (
                        <motion.div
                            variants={itemVariants}
                            key={i}
                            className={`border border-zinc-200/60 rounded-2xl bg-white overflow-hidden transition-all duration-300 ${openIndex === i ? 'shadow-lg' : 'hover:border-zinc-300'}`}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full flex justify-between items-center p-6 text-left"
                            >
                                <span className="text-sm font-bold text-zinc-950 pr-8">
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${openIndex === i ? 'rotate-180 text-zinc-950' : ''}`}
                                />
                            </button>

                            <AnimatePresence initial={false}>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <p className="px-6 pb-6 text-zinc-500 text-sm leading-relaxed border-t border-zinc-100 pt-4 mt-2">
                                            {faq.answer}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Contact Block */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-white p-8 rounded-2xl border border-zinc-200/50 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left"
                >
                    <div>
                        <h4 className="text-sm font-bold text-zinc-950 mb-2">{dict.faq.stillTitle}</h4>
                        <p className="text-xs text-zinc-500">{dict.faq.stillDescription}</p>
                    </div>
                    <a
                        href="https://wa.me/62895324350359?text=Hi%20DFD%2C%20I%20have%20a%20question"
                        target="_blank"
                        rel="noreferrer"
                        className="whitespace-nowrap px-6 py-3 bg-zinc-950 text-white text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                        {dict.common.contactUs}
                    </a>
                </motion.div>

            </div>
        </section>
    );
}
