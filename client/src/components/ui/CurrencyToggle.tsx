"use client";

import { motion } from "framer-motion";
import { useCurrency } from "@/hooks/useCurrency";

export function CurrencyToggle() {
    const { currency, toggleCurrency } = useCurrency();

    return (
        <div className="flex items-center justify-center gap-4 mt-8 mb-4">
            <button
                type="button"
                onClick={toggleCurrency}
                className="group flex items-center gap-4 cursor-pointer outline-none"
            >
                <span
                    className={`text-sm font-bold transition-all duration-500 ${
                        currency === "IDR" ? "text-inherit scale-110" : "text-zinc-500 group-hover:text-zinc-700"
                    }`}
                >
                    IDR
                </span>
                
                <div className="relative w-14 h-7 rounded-full bg-zinc-500/20 backdrop-blur-md border border-white/10 p-1 flex items-center">
                    <motion.div
                        className="w-5 h-5 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.2)] flex items-center justify-center overflow-hidden"
                        initial={false}
                        animate={{ x: currency === "USD" ? 28 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                        <span className="text-[9px] text-zinc-950 font-black">
                            {currency === "USD" ? "$" : "Rp"}
                        </span>
                    </motion.div>
                </div>

                <span
                    className={`text-sm font-bold transition-all duration-500 ${
                        currency === "USD" ? "text-inherit scale-110" : "text-zinc-500 group-hover:text-zinc-700"
                    }`}
                >
                    USD
                </span>
            </button>
        </div>
    );
}
