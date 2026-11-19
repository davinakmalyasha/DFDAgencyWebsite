"use client";

import { Check, CheckCircle2, Loader2 } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { useCurrency } from "@/hooks/useCurrency";
import { useDictionary, useLocale } from "@/i18n/provider";
import { localePath } from "@/i18n/config";

export function PricingSection({ packages = [] }: { packages?: Record<string, unknown>[] }) {
    const dict = useDictionary();
    const locale = useLocale();
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "start 30%"]
    });

    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Animate background from zinc-50 (#fafafa) to near-black (#09090b)
    const backgroundColor = useTransform(scrollYProgress, [0, 1], ["#fafafa", "#09090b"]);
    // Animate header text from black (#09090b) to white (#ffffff)
    const textColor = useTransform(scrollYProgress, [0, 1], ["#09090b", "#ffffff"]);

    const handlePlanSelect = (planSlug: string, custom: boolean, planName: string) => {
        if (custom) {
            const text = encodeURIComponent(
                locale === 'id'
                    ? `Halo DFD, saya ingin membahas proyek custom (${planName}).`
                    : `Hi DFD, I'd like to talk about a custom project (${planName}).`
            );
            window.open(`https://wa.me/62895324350359?text=${text}`, '_blank');
            return;
        }
        setLoadingId(planSlug);
        const next = encodeURIComponent(localePath(locale, `/order?package=${planSlug}`));
        router.push(`${localePath(locale, '/start')}?next=${next}`);
    };

    const displayPackages = packages && packages.length > 0 ? (packages as any[]) : [];

    const { formatPrice } = useCurrency();

    return (
        <motion.section ref={sectionRef} style={{ backgroundColor, color: textColor }} className="py-32 transition-colors duration-300">
            <div className="mx-auto w-[90%] max-w-[1440px]">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-20">
                    <motion.h2 style={{ color: textColor }} className="text-4xl md:text-5xl font-black tracking-tighter mb-6">
                        {dict.pricing.title}
                    </motion.h2>
                    <p className="text-zinc-500 text-lg leading-relaxed">
                        {dict.pricing.description}
                    </p>
                </div>

                <CurrencyToggle />

                {/* Pricing Cards Container */}
                <div className="relative">
                    <div className="flex lg:grid lg:grid-cols-4 gap-4 px-4 lg:px-0 overflow-x-auto lg:overflow-visible snap-x snap-mandatory scrollbar-hide pb-12 lg:pb-0">
                        {displayPackages.map((plan, i) => {
                            const finalPrice = plan.discountPrice ? plan.discountPrice : plan.price;
                            const isCustom = plan.slug === 'custom' || finalPrice === 0 || finalPrice === '0' || finalPrice === null;
                            const isFeatured = i === 2 || plan.slug === 'ecosystem'; // Highlight the 3rd or specific plan
                            const badge = dict.pricing.commercialChoice;
                            const buttonText = isCustom ? dict.pricing.contactUs : dict.pricing.startProject;
                            const slug = String(plan.slug || '');
                            const localizedName =
                                dict.pricing.packageNames[slug as keyof typeof dict.pricing.packageNames] ||
                                String(plan.name);
                            const localizedDescription =
                                dict.pricing.packageDescriptions[
                                    slug as keyof typeof dict.pricing.packageDescriptions
                                ] ||
                                (plan.description as string) ||
                                dict.pricing.defaultDescription;

                            return (
                            <div
                                key={plan.id || i}
                                className={`flex-shrink-0 w-[85vw] sm:w-[45vw] lg:w-auto snap-center relative bg-white text-zinc-950 rounded-2xl p-6 md:p-8 flex flex-col ${isFeatured ? "lg:scale-105 shadow-2xl z-10 border-4 border-zinc-200" : "scale-100 opacity-90 hover:opacity-100 border border-zinc-100"
                                    } transition-all duration-300`}
                            >
                                {isFeatured && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 text-white px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-md">
                                        {badge}
                                    </div>
                                )}

                                <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-6">
                                    {localizedName}
                                </h3>

                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black tracking-tighter">
                                        {isCustom ? dict.pricing.custom : formatPrice(finalPrice)}
                                    </span>
                                </div>
                                
                                {plan.discountPrice && plan.price !== plan.discountPrice && !isCustom && (
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-sm font-bold tracking-tighter line-through text-zinc-500">
                                            {formatPrice(plan.price)}
                                        </span>
                                        <span className="text-green-600 text-xs font-bold tracking-widest uppercase ml-1">{dict.pricing.discount}</span>
                                    </div>
                                )}
                                {!plan.discountPrice && !isCustom && (
                                    <div className="h-6 mb-6"></div> // Spacer to keep heights aligned
                                )}

                                <p className="text-sm text-zinc-600 mb-8 h-10">
                                    {localizedDescription}
                                </p>

                                <div className="flex flex-col gap-4 mb-10 mt-auto">
                                    {(Array.isArray(plan.features) ? plan.features : []).map((feature: any, j: number) => {
                                        const featureText = typeof feature === 'string' ? feature : feature.name;
                                        const localizedFeature =
                                            dict.pricing.featureLabels[
                                                featureText as keyof typeof dict.pricing.featureLabels
                                            ] || featureText;
                                        return (
                                        <div key={j} className="flex items-start gap-3">
                                            <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${isFeatured ? "text-zinc-950" : "text-zinc-500"}`} />
                                            <span className="text-sm font-medium text-zinc-700 leading-tight">{localizedFeature}</span>
                                        </div>
                                    )})}
                                </div>

                                <button
                                    onClick={() => handlePlanSelect(plan.slug, isCustom, plan.name)}
                                    disabled={loadingId !== null}
                                    className={`w-full py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${isFeatured
                                        ? "bg-zinc-950 text-white hover:bg-zinc-800 hover:scale-105 shadow-xl"
                                        : "bg-white text-zinc-950 border-2 border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50"
                                        } ${loadingId !== null ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {loadingId === plan.slug ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {dict.pricing.processing}
                                        </>
                                    ) : buttonText}
                                </button>
                            </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
