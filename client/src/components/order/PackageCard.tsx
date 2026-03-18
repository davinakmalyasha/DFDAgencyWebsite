"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

interface PackageData {
    id: number;
    name: string;
    slug: string;
    price: number | string;
    discountPrice?: number | string | null;
    features: string[];
    isActive: boolean;
}

interface PackageCardProps {
    pkg: PackageData;
    isSelected: boolean;
    onSelect: (id: number) => void;
}

export function PackageCard({ pkg, isSelected, onSelect }: PackageCardProps) {
    const price = Number(pkg.discountPrice || pkg.price);
    const originalPrice = pkg.discountPrice ? Number(pkg.price) : null;
    const features = Array.isArray(pkg.features) ? pkg.features : [];
    const { formatPrice } = useCurrency();

    return (
        <motion.button
            type="button"
            onClick={() => onSelect(pkg.id)}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={`relative w-full text-left rounded-2xl p-6 transition-all duration-300 border-2 cursor-pointer group ${isSelected
                    ? "border-zinc-950 bg-zinc-950 text-white shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
                    : "border-zinc-200 bg-white text-zinc-950 hover:border-zinc-400 hover:shadow-lg"
                }`}
        >
            {/* Selected Indicator */}
            <motion.div
                initial={false}
                animate={{
                    scale: isSelected ? 1 : 0,
                    opacity: isSelected ? 1 : 0,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center"
            >
                <Check className="w-5 h-5 text-zinc-950" />
            </motion.div>

            {/* Package Name */}
            <p className={`text-[10px] font-bold tracking-[0.2em] uppercase mb-2 ${isSelected ? "text-zinc-400" : "text-zinc-500"
                }`}>
                {pkg.name}
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-black tracking-tighter">
                    {price === 0 ? "Custom Quote" : formatPrice(price)}
                </span>
                {originalPrice && price !== 0 && (
                    <span className={`text-sm line-through ${isSelected ? "text-zinc-500" : "text-zinc-400"
                        }`}>
                        {formatPrice(originalPrice)}
                    </span>
                )}
            </div>

            {/* Features */}
            <div className="mt-4 space-y-2">
                {features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? "bg-white" : "bg-zinc-950"
                            }`} />
                        <span className={`text-sm ${isSelected ? "text-zinc-300" : "text-zinc-600"
                            }`}>
                            {String(feature)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Select hint */}
            <div className={`mt-6 text-center text-[10px] font-bold tracking-widest uppercase ${isSelected ? "text-zinc-400" : "text-zinc-400 group-hover:text-zinc-950"
                } transition-colors`}>
                {isSelected ? "✓ Selected" : "Tap to select"}
            </div>
        </motion.button>
    );
}
