"use client";

import { useCurrency } from "@/hooks/useCurrency";
import { useDictionary, interpolate } from "@/i18n/provider";

interface OrderSummaryProps {
    packageName: string;
    packagePrice: number;
    clientName: string;
    whatsapp: string;
    businessName?: string | null;
    briefDescription?: string;
}

export function OrderSummary({
    packageName,
    packagePrice,
    clientName,
    whatsapp,
    businessName,
    briefDescription,
}: OrderSummaryProps) {
    const { formatPrice, currency, exchangeRate } = useCurrency();
    const dict = useDictionary();
    const t = dict.order.summary;

    return (
        <div className="rounded-2xl border-2 border-zinc-200 bg-white p-8">
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500 mb-6">
                {t.title}
            </h3>

            {/* Package */}
            <div className="flex items-center justify-between pb-6 border-b border-zinc-100">
                <div>
                    <p className="font-bold text-zinc-950">{packageName}</p>
                    <p className="text-xs text-zinc-500 mt-1">{t.websitePackage}</p>
                </div>
                <p className="text-xl font-black tracking-tighter text-zinc-950">
                    {packagePrice === 0 ? t.custom : formatPrice(packagePrice)}
                </p>
            </div>

            {/* Client Info */}
            <div className="py-6 border-b border-zinc-100 space-y-3">
                <SummaryRow label={t.name} value={clientName} />
                <SummaryRow label={t.whatsapp} value={whatsapp} />
                {businessName && (
                    <SummaryRow label={t.business} value={businessName} />
                )}
                {briefDescription && (
                    <SummaryRow label={t.brief} value={briefDescription} />
                )}
            </div>

            {/* Total */}
            <div className="pt-6 border-t border-zinc-100 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <p className="font-bold text-zinc-950">{t.total}</p>
                    <p className="text-2xl font-black tracking-tighter text-zinc-950">
                        {packagePrice === 0 ? t.custom : formatPrice(packagePrice)}
                    </p>
                </div>
                {packagePrice > 0 && currency === "USD" && (
                    <p className="text-[10px] text-zinc-400 text-right uppercase tracking-widest mt-1">
                        {interpolate(t.paymentNoteUsd, {
                            rate: new Intl.NumberFormat("id-ID").format(exchangeRate),
                        })}
                    </p>
                )}
            </div>
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-zinc-500 flex-shrink-0">{label}</p>
            <p className="text-sm font-medium text-zinc-950 text-right">{value}</p>
        </div>
    );
}
