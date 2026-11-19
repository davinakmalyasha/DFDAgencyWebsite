import { Suspense } from "react";
import { OrderFlow } from "@/components/order/OrderFlow";
import type { Metadata } from "next";
import { SERVER_API_BASE } from "@/lib/api-base";
import { getDictionary } from "@/i18n/messages";
import { defaultLocale, isLocale } from "@/i18n/config";

interface PackageData {
    id: number;
    name: string;
    slug: string;
    price: number | string;
    discountPrice?: number | string | null;
    features: string[];
    isActive: boolean;
}

interface ApiResponse {
    success: boolean;
    data: PackageData[];
}

type PageProps = { params: Promise<{ locale: string }> };

async function getPackages(): Promise<PackageData[]> {
    try {
        const res = await fetch(`${SERVER_API_BASE}/packages?isPublished=true`, {
            next: { revalidate: 60 },
        });
        const json: ApiResponse = await res.json();
        return json.data || [];
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale: raw } = await params;
    const dict = getDictionary(isLocale(raw) ? raw : defaultLocale);
    return {
        title: `${dict.order.choosePackageTitle} — DFD Agency`,
        description: dict.order.choosePackageSubtitle,
        robots: { index: false, follow: false },
    };
}

export default async function OrderPage() {
    const packages = await getPackages();

    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                    <div className="w-6 h-6 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <OrderFlow packages={packages} />
        </Suspense>
    );
}
