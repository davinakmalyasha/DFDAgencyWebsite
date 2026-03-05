"use client";

import { Check, CheckCircle2 } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function PricingSection({ packages = [] }: { packages?: Record<string, unknown>[] }) {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "start 30%"]
    });

    // Animate background from zinc-50 (#fafafa) to near-black (#09090b)
    const backgroundColor = useTransform(scrollYProgress, [0, 1], ["#fafafa", "#09090b"]);
    // Animate header text from black (#09090b) to white (#ffffff)
    const textColor = useTransform(scrollYProgress, [0, 1], ["#09090b", "#ffffff"]);

    const plans = [
        {
            name: "BASIC",
            price: "99",
            description: "Perfect for startups and small projects.",
            features: ["5 Active Projects", "Custom Domain", "Basic Analytics", "Email Support"],
            buttonText: "Get Started",
            featured: false,
        },
        {
            name: "PRO",
            price: "249",
            description: "The complete agency powerhouse.",
            features: ["Unlimited Projects", "Advanced Analytics", "24/7 Priority Support", "Custom Branding", "Team Collaboration"],
            buttonText: "Start Free Trial",
            featured: true,
            badge: "MOST IDEAL",
        },
        {
            name: "ENTERPRISE",
            price: "499",
            description: "Bespoke solutions for large teams.",
            features: ["Everything in Pro", "Dedicated Account Manager", "SLA Guarantee", "Custom Integrations"],
            buttonText: "Contact Sales",
            featured: false,
        },
    ];

    return (
        <motion.section ref={sectionRef} style={{ backgroundColor, color: textColor }} className="py-32 transition-colors duration-300">
            <div className="mx-auto w-[90%] max-w-[1440px]">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-20">
                    <motion.h2 style={{ color: textColor }} className="text-4xl md:text-5xl font-black tracking-tighter mb-6">
                        Simple, Transparent Pricing
                    </motion.h2>
                    <p className="text-zinc-500 text-lg leading-relaxed">
                        Choose the plan that best fits your agency&apos;s needs. From solo creators to
                        global enterprises, we have you covered.
                    </p>
                </div>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
                    {plans.map((plan, i) => (
                        <div
                            key={i}
                            className={`relative bg-white text-zinc-950 rounded-2xl p-8 md:p-10 flex flex-col ${plan.featured ? "scale-105 shadow-2xl z-10 border-4 border-zinc-200" : "scale-100 opacity-90 hover:opacity-100"
                                } transition-all duration-300`}
                        >
                            {plan.featured && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 text-white px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-md">
                                    {plan.badge}
                                </div>
                            )}

                            <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-6">
                                {plan.name}
                            </h3>

                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-5xl font-black tracking-tighter">${plan.price}</span>
                                <span className="text-zinc-500 font-medium">/mo</span>
                            </div>

                            <p className="text-sm text-zinc-600 mb-8 h-10">
                                {plan.description}
                            </p>

                            <div className="flex flex-col gap-4 mb-10 mt-auto">
                                {plan.features.map((feature, j) => (
                                    <div key={j} className="flex items-center gap-3">
                                        <CheckCircle2 className={`w-4 h-4 ${plan.featured ? "text-zinc-950" : "text-zinc-400"}`} />
                                        <span className="text-sm font-medium text-zinc-700">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${plan.featured
                                    ? "bg-zinc-950 text-white hover:bg-zinc-800 hover:scale-105 shadow-xl"
                                    : "bg-white text-zinc-950 border-2 border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50"
                                    }`}
                            >
                                {plan.buttonText}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
}
