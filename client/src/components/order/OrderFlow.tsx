"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck, CreditCard, MessageCircle, Sparkles } from "lucide-react";
import { PackageCard } from "./PackageCard";
import { OrderSummary } from "./OrderSummary";
import { PublicService } from "@/services/public.service";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { useCurrency } from "@/hooks/useCurrency";

// ─── Types ──────────────────────────────────────────────────────────────

interface PackageData {
    id: number;
    name: string;
    slug: string;
    price: number | string;
    discountPrice?: number | string | null;
    features: string[];
    isActive: boolean;
    description?: string;
}

interface FormState {
    packageId: number | null;
    name: string;
    countryCode: string;
    whatsapp: string;
    businessName: string;
    briefDescription: string;
    agreedToTerms: boolean;
}

const COUNTRY_CODES = [
    { code: "+62", label: "🇮🇩 +62", country: "Indonesia" },
    { code: "+60", label: "🇲🇾 +60", country: "Malaysia" },
    { code: "+65", label: "🇸🇬 +65", country: "Singapore" },
    { code: "+1", label: "🇺🇸 +1", country: "USA" },
    { code: "+44", label: "🇬🇧 +44", country: "UK" },
    { code: "+61", label: "🇦🇺 +61", country: "Australia" },
    { code: "+81", label: "🇯🇵 +81", country: "Japan" },
    { code: "+82", label: "🇰🇷 +82", country: "South Korea" },
    { code: "+91", label: "🇮🇳 +91", country: "India" },
] as const;

interface FormErrors {
    name?: string;
    whatsapp?: string;
    briefDescription?: string;
    agreedToTerms?: string;
}

interface OrderFlowProps {
    packages: PackageData[];
}

// ─── Stepper Steps ──────────────────────────────────────────────────────

const STEPS = [
    { id: 1, label: "Package", shortLabel: "01" },
    { id: 2, label: "Details", shortLabel: "02" },
    { id: 3, label: "Review", shortLabel: "03" },
] as const;

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 80 : -80,
        opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
        x: direction < 0 ? 80 : -80,
        opacity: 0,
    }),
};

// ─── Component ──────────────────────────────────────────────────────────

export function OrderFlow({ packages }: OrderFlowProps) {
    const searchParams = useSearchParams();
    const preselectedId = searchParams.get("package");
    const { currency, exchangeRate } = useCurrency();

    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [shouldShake, setShouldShake] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'MIDTRANS' | 'WHATSAPP' | null>(null);

    const [form, setForm] = useState<FormState>({
        packageId: preselectedId ? Number(preselectedId) : null,
        name: "",
        countryCode: "+62",
        whatsapp: "",
        businessName: "",
        briefDescription: "",
        agreedToTerms: false,
    });

    // Auto-advance to step 2 if package was preselected via query param
    const initialStep = preselectedId ? 2 : 1;
    const [hasAutoAdvanced, setHasAutoAdvanced] = useState(false);
    if (initialStep === 2 && !hasAutoAdvanced && form.packageId) {
        setStep(2);
        setDirection(1);
        setHasAutoAdvanced(true);
    }

    const selectedPackage = useMemo(() => {
        const found = packages.find((p) => p.id === form.packageId);
        if (found) return found;
        if (form.packageId === 9999) {
            return {
                id: 9999,
                name: "Custom Elite Solutions",
                slug: "custom",
                price: 0,
                discountPrice: null,
                features: [],
                description: "For complex, high-performance ecosystems requiring specialized logic, custom architecture, and elite engineering precision."
            };
        }
        return undefined;
    }, [packages, form.packageId]);

    const updateField = useCallback(
        <K extends keyof FormState>(key: K, value: FormState[K]) => {
            setForm((prev) => ({ ...prev, [key]: value }));
            // Clear error on edit
            if (key in errors) {
                setErrors((prev) => ({ ...prev, [key]: undefined }));
            }
        },
        [errors]
    );

    // ─── Validation ─────────────────────────────────────────────────────

    const validateStep2 = useCallback((): boolean => {
        const newErrors: FormErrors = {};

        if (!form.name || form.name.length < 2) {
            newErrors.name = "Name must be at least 2 characters";
        }

        const localNumber = form.whatsapp.replace(/^0+/, "");
        if (!localNumber || !/^\d{6,15}$/.test(localNumber)) {
            newErrors.whatsapp = "Enter a valid phone number (e.g. 0895324350359)";
        }

        if (!form.briefDescription || form.briefDescription.length < 10) {
            newErrors.briefDescription = "Please describe your project briefly (min 10 chars)";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [form.name, form.whatsapp, form.briefDescription]);

    // ─── Submit ─────────────────────────────────────────────────────────

    const handleSubmit = useCallback(async () => {
        if (isSubmitting) return;
        if (!form.agreedToTerms) {
            setErrors({ agreedToTerms: "You must agree to the terms and conditions" });
            return;
        }
        if (!form.packageId) return;

        setIsSubmitting(true);
        try {
            const idempotencyKey = crypto.randomUUID();
            const fullWhatsapp = form.countryCode + form.whatsapp.replace(/^0+/, "");
            const payload = {
                packageId: form.packageId,
                name: form.name,
                whatsapp: fullWhatsapp,
                businessName: form.businessName || null,
                briefData: {
                    description: form.briefDescription,
                },
                agreedToTerms: true as const,
            };

            const res = await PublicService.createOrder(payload);

            if (res.success && res.data) {
                const priceMatch = Number(selectedPackage?.discountPrice || selectedPackage?.price);
                const isCustom = priceMatch === 0;

                const waNumber = "62895324350359";
                const message = isCustom
                    ? `*CUSTOM PROJECT INQUIRY* 🤝\n\n*Package:* ${selectedPackage?.name}\n*Client:* ${form.name}\n*WA:* ${fullWhatsapp}\n*Company:* ${form.businessName || "-"}\n\n*Brief:* ${form.briefDescription}\n\n*Track Request:* ${window.location.origin}/track/${res.data.id}\n\nI would like to consult directly regarding a custom quote for my project.`
                    : `*NEW PROJECT ORDER* 🚀\n\n*Package:* ${selectedPackage?.name}\n*Client:* ${form.name}\n*WA:* ${fullWhatsapp}\n*Company:* ${form.businessName || "-"}\n\n*Brief:* ${form.briefDescription}\n\n*Track Order:* ${window.location.origin}/track/${res.data.id}\n\nI am ready to proceed with payment.`;

                const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
                window.open(waUrl, "_blank");

                window.setTimeout(() => {
                    if (res.data?.id) {
                        window.location.href = `/order/success/${res.data.id}`;
                    }
                }, 500);
            } else {
                throw new Error("Order creation failed");
            }
        } catch (error: unknown) {
            const message =
                (error as { response?: { data?: { message?: string } } })?.response
                    ?.data?.message ||
                (error instanceof Error ? error.message : "Something went wrong");
            alert(message);
        } finally {
            setIsSubmitting(false);
        }
    }, [form, selectedPackage, paymentMethod]);

    // ─── Navigation ─────────────────────────────────────────────────────

    const goNext = useCallback(() => {
        if (isSubmitting) return;
        if (step === 1 && !form.packageId) return;
        if (step === 2 && !validateStep2()) {
            setShouldShake(true);
            setTimeout(() => setShouldShake(false), 500);
            return;
        }
        if (step === 3) {
            if (!form.agreedToTerms) {
                setErrors({ agreedToTerms: "You must agree to the terms and conditions" });
                return;
            }
            handleSubmit();
            return;
        }

        setDirection(1);
        setStep((s) => Math.min(s + 1, 3));
    }, [step, form.packageId, validateStep2, form.agreedToTerms, handleSubmit]);

    const goBack = useCallback(() => {
        if (isSubmitting) return;
        setDirection(-1);
        setStep((s) => Math.max(s - 1, 1));
    }, []);

    // ─── Render ─────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-zinc-50">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-50/80 backdrop-blur-xl border-b border-zinc-200">
                <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
                    {step === 1 ? (
                        <a href="/" className="flex items-center gap-2 text-sm font-bold tracking-[0.15em] uppercase text-zinc-950 hover:text-zinc-600 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Home
                        </a>
                    ) : (
                        <button
                            onClick={goBack}
                            className="flex items-center gap-2 text-sm font-bold tracking-[0.15em] uppercase text-zinc-950 hover:text-zinc-600 transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    )}

                    {/* Stepper Indicator */}
                    <div className="flex items-center gap-2">
                        {STEPS.map((s, i) => (
                            <div key={s.id} className="flex items-center gap-2">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all duration-300 ${step >= s.id
                                    ? "bg-zinc-950 text-white"
                                    : "bg-zinc-200 text-zinc-500"
                                    }`}>
                                    <span>{s.shortLabel}</span>
                                    <span className="hidden sm:inline">{s.label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`w-8 h-0.5 transition-colors duration-300 ${step > s.id ? "bg-zinc-950" : "bg-zinc-200"
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="pt-20 pb-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <AnimatePresence mode="wait" custom={direction}>
                        {step === 1 && (
                            <StepWrapper key="step1" direction={direction}>
                                <StepHeader
                                    title="Choose Your Package"
                                    subtitle="Select the plan that fits your business needs."
                                />
                                <CurrencyToggle />
                                <div className="space-y-4 mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {packages.filter(p => Number(p.discountPrice || p.price) > 0).map((pkg) => (
                                            <PackageCard
                                                key={pkg.id}
                                                pkg={pkg}
                                                isSelected={form.packageId === pkg.id}
                                                onSelect={(id) => updateField("packageId", id)}
                                            />
                                        ))}
                                    </div>

                                    {/* Elevated Bespoke Option (Database Driven or Static Fallback) */}
                                    {(() => {
                                        const dbCustom = packages.find(p => Number(p.discountPrice || p.price) === 0 || p.slug === 'custom');
                                        const pkg = dbCustom || {
                                            id: 9999,
                                            name: "Custom Elite Solutions",
                                            slug: "custom",
                                            price: 0,
                                            discountPrice: null,
                                            features: [],
                                            description: "For complex, high-performance ecosystems requiring specialized logic, custom architecture, and elite engineering precision."
                                        };

                                        return (
                                            <motion.button
                                                key={pkg.id}
                                                type="button"
                                                onClick={() => updateField("packageId", pkg.id)}
                                                whileHover={{ y: -4 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`relative w-full text-left rounded-3xl p-6 md:p-8 transition-all duration-500 border-2 overflow-hidden group cursor-pointer ${form.packageId === pkg.id
                                                        ? "border-zinc-950 bg-zinc-950 text-white shadow-[0_30px_60px_rgba(0,0,0,0.3)]"
                                                        : "border-zinc-200 bg-white text-zinc-950 hover:border-zinc-400 hover:shadow-xl"
                                                    }`}
                                            >
                                                {/* Accent Background for Bespoke */}
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-100/50 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-zinc-200/50" />

                                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className={`p-2 rounded-lg ${form.packageId === pkg.id ? "bg-white/10" : "bg-zinc-100"}`}>
                                                                <Sparkles className={`w-5 h-5 ${form.packageId === pkg.id ? "text-white" : "text-zinc-950"}`} />
                                                            </div>
                                                            <span className={`text-[10px] font-black tracking-[0.3em] uppercase ${form.packageId === pkg.id ? "text-zinc-400" : "text-zinc-500"
                                                                }`}>
                                                                Elite Custom Solutions
                                                            </span>
                                                        </div>
                                                        <h3 className="text-2xl md:text-3xl font-black tracking-tighter mb-3">
                                                            {pkg.name}
                                                        </h3>
                                                        <p className={`text-sm md:text-base max-w-xl leading-relaxed ${form.packageId === pkg.id ? "text-zinc-400" : "text-zinc-500"
                                                            }`}>
                                                            {pkg.description || "For complex, high-performance ecosystems requiring specialized logic, custom architecture, and elite engineering precision."}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col items-center md:items-end gap-6 h-full justify-between">
                                                        <div className="text-center md:text-right">
                                                            <span className="text-2xl md:text-3xl font-black tracking-tighter block">Custom Quote</span>
                                                            <span className={`text-xs font-medium ${form.packageId === pkg.id ? "text-zinc-500" : "text-zinc-400"}`}>Based on scope</span>
                                                        </div>
                                                        <div className={`px-8 py-3 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${form.packageId === pkg.id
                                                                ? "bg-white text-zinc-950"
                                                                : "bg-zinc-950 text-white group-hover:scale-105"
                                                            }`}>
                                                            {form.packageId === pkg.id ? "✓ SELECTED" : "SELECT CUSTOM"}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Feature Pill Tags */}
                                                <div className="relative z-10 mt-6 flex flex-wrap gap-2">
                                                    {pkg.features.map((f, i) => (
                                                        <span key={i} className={`px-3 py-1 rounded-full text-[10px] font-bold border ${form.packageId === pkg.id ? "bg-white/5 border-white/10 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-600"}`}>
                                                            {f}
                                                        </span>
                                                    ))}
                                                    {[
                                                        "Custom Frameworks",
                                                        "Logic Complexity Handling",
                                                        "Massive API Scalling",
                                                        "Pro Performance Audit"
                                                    ].map((f, i) => (
                                                        <span key={`extra-${i}`} className={`px-3 py-1 rounded-full text-[10px] font-bold border ${form.packageId === pkg.id
                                                                ? "bg-white/10 border-white/20 text-white"
                                                                : "bg-zinc-100 border-zinc-200 text-zinc-950"
                                                            }`}>
                                                            {f}
                                                        </span>
                                                    ))}
                                                </div>
                                            </motion.button>
                                        );
                                    })()}
                                </div>
                            </StepWrapper>
                        )}

                        {step === 2 && (
                            <StepWrapper key="step2" direction={direction}>
                                <StepHeader
                                    title="Tell Us About You"
                                    subtitle="We'll use this to create your project and send updates."
                                />
                                <motion.div
                                    animate={shouldShake ? { x: [-10, 10, -10, 10, 0] } : {}}
                                    className="max-w-xl mx-auto mt-10 space-y-6"
                                >
                                    <FormField
                                        label="Your Name"
                                        required
                                        error={errors.name}
                                    >
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            value={form.name}
                                            onChange={(e) => updateField("name", e.target.value)}
                                            className={inputClass(errors.name)}
                                        />
                                    </FormField>

                                    <FormField
                                        label="WhatsApp Number"
                                        required
                                        error={errors.whatsapp}
                                    >
                                        <div className="flex gap-2">
                                            <select
                                                value={form.countryCode}
                                                onChange={(e) => updateField("countryCode", e.target.value)}
                                                className={`w-28 flex-shrink-0 px-3 py-3 rounded-xl border-2 text-sm text-zinc-950 bg-white
                                                            outline-none transition-all duration-200 border-zinc-200 focus:border-zinc-950
                                                            hover:border-zinc-300 focus:ring-2 focus:ring-zinc-950/10 appearance-none`}
                                            >
                                                {COUNTRY_CODES.map((c) => (
                                                    <option key={c.code} value={c.code}>
                                                        {c.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="tel"
                                                placeholder="0895324350359"
                                                value={form.whatsapp}
                                                onChange={(e) => updateField("whatsapp", e.target.value.replace(/[^\d]/g, ""))}
                                                className={inputClass(errors.whatsapp) + " flex-1"}
                                            />
                                        </div>
                                    </FormField>

                                    <FormField label="Business Name" hint="Optional">
                                        <input
                                            type="text"
                                            placeholder="PT Example"
                                            value={form.businessName}
                                            onChange={(e) => updateField("businessName", e.target.value)}
                                            className={inputClass()}
                                        />
                                    </FormField>

                                    <FormField
                                        label="Project Brief"
                                        required
                                        error={errors.briefDescription}
                                        hint="What kind of website do you need? Describe your goals, features, and any references."
                                    >
                                        <textarea
                                            rows={4}
                                            placeholder="I need a modern website for my restaurant business. It should showcase our menu, location, and allow online reservations..."
                                            value={form.briefDescription}
                                            onChange={(e) => updateField("briefDescription", e.target.value)}
                                            className={inputClass(errors.briefDescription) + " resize-none"}
                                        />
                                    </FormField>
                                </motion.div>
                            </StepWrapper>
                        )}

                        {step === 3 && selectedPackage && (
                            <StepWrapper key="step3" direction={direction}>
                                <StepHeader
                                    title="Review & Pay"
                                    subtitle="Double-check everything before proceeding to payment."
                                />
                                <div className="max-w-xl mx-auto mt-10 space-y-6">
                                    <OrderSummary
                                        packageName={selectedPackage.name}
                                        packagePrice={Number(selectedPackage.discountPrice || selectedPackage.price)}
                                        clientName={form.name}
                                        whatsapp={form.whatsapp}
                                        businessName={form.businessName || null}
                                        briefDescription={form.briefDescription}
                                    />

                                    {/* Terms Checkbox */}
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={form.agreedToTerms}
                                                onChange={(e) => updateField("agreedToTerms", e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${form.agreedToTerms
                                                ? "bg-zinc-950 border-zinc-950"
                                                : errors.agreedToTerms
                                                    ? "border-red-500"
                                                    : "border-zinc-300 group-hover:border-zinc-500"
                                                }`}>
                                                {form.agreedToTerms && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ duration: 0.15 }}
                                                    >
                                                        <Check className="w-3.5 h-3.5 text-white" />
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-sm text-zinc-600 leading-relaxed">
                                            I agree to the{" "}
                                            <a
                                                href="/terms"
                                                target="_blank"
                                                className="font-semibold text-zinc-950 underline underline-offset-2 hover:text-zinc-600 transition-colors"
                                            >
                                                Terms & Conditions
                                            </a>{" "}
                                            and{" "}
                                            <a
                                                href="/privacy"
                                                target="_blank"
                                                className="font-semibold text-zinc-950 underline underline-offset-2 hover:text-zinc-600 transition-colors"
                                            >
                                                Privacy Policy
                                            </a>.
                                        </span>
                                    </label>

                                    {errors.agreedToTerms && (
                                        <p className="text-xs text-red-500 font-medium">
                                            {errors.agreedToTerms}
                                        </p>
                                    )}

                                    {/* Security Badge */}
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span className="text-xs">
                                            Your details are securely submitted and encrypted.
                                        </span>
                                    </div>
                                </div>
                            </StepWrapper>
                        )}

                        {/* Step 4 Removed to route directly via WhatsApp checkout */}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
                <div className="max-w-6xl mx-auto px-4 pb-10 pt-6 flex items-center justify-between pointer-events-auto">
                    <div /> {/* Spacer to keep Continue button on the right */}

                    {step < 3 ? (
                        <button
                            onClick={goNext}
                            disabled={step === 1 && !form.packageId}
                            className="flex items-center gap-2 px-8 py-3 rounded-full bg-zinc-950 text-white text-sm font-bold
                                       hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Continue
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={goNext}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-8 py-3 rounded-full bg-zinc-950 text-white text-sm font-bold
                                       hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Proceed to WhatsApp
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Step Wrapper ───────────────────────────────────────────────────────

function StepWrapper({
    children,
    direction,
}: {
    children: React.ReactNode;
    direction: number;
}) {
    return (
        <motion.div
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

// ─── Step Header ────────────────────────────────────────────────────────

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-950">
                {title}
            </h1>
            <p className="text-zinc-500 mt-3 text-lg">{subtitle}</p>
        </div>
    );
}

// ─── Form Field ─────────────────────────────────────────────────────────

function FormField({
    label,
    required,
    error,
    hint,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <label className="flex items-center gap-1 text-sm font-bold text-zinc-950">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                {children}
            </div>
            <AnimatePresence mode="wait">
                {error ? (
                    <motion.p
                        key="error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-xs text-red-500 font-medium"
                    >
                        {error}
                    </motion.p>
                ) : hint ? (
                    <motion.p
                        key="hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-zinc-400"
                    >
                        {hint}
                    </motion.p>
                ) : null}
            </AnimatePresence>
        </div>
    );
}

// ─── Input Styles ───────────────────────────────────────────────────────

function inputClass(error?: string) {
    return `w-full px-4 py-3 rounded-xl border-2 text-sm text-zinc-950 bg-white 
            placeholder:text-zinc-400 outline-none transition-all duration-200
            focus:ring-2 focus:ring-zinc-950/10
            ${error
            ? "border-red-400 focus:border-red-500"
            : "border-zinc-200 focus:border-zinc-950 hover:border-zinc-300"
        }`;
}
