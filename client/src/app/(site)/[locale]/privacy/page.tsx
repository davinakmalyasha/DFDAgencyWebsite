import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getDictionary } from "@/i18n/messages";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

type PageProps = { params: Promise<{ locale: string }> };

type Section = { title: string; paragraphs?: string[]; bullets?: string[] };

const sections: Record<Locale, Section[]> = {
    en: [
        {
            title: "1. Introduction",
            paragraphs: [
                "DFD Agency (\u201cwe\u201d, \u201cour\u201d, or \u201cus\u201d) respects your privacy and is committed to protecting your personal data. This policy explains how we look after your personal data when you visit our website and tells you about your privacy rights.",
            ],
        },
        {
            title: "2. The Data We Collect",
            paragraphs: ["We may collect, use, store and transfer different kinds of personal data about you:"],
            bullets: [
                "Identity Data: name, business name, and professional details provided during lead generation or project briefing.",
                "Contact Data: WhatsApp number, email address, and billing address.",
                "Transaction Data: details about payments and the services you have purchased from us.",
                "Technical Data: IP address, login data, browser type and version, and platform data via session cookies.",
            ],
        },
        {
            title: "3. How We Use Your Data",
            paragraphs: ["We only use your personal data when the law allows us to. Most commonly, we use it to:"],
            bullets: [
                "Execute a contract we are about to enter into or have entered into with you.",
                "Communicate project updates via WhatsApp or the client portal.",
                "Support our legitimate interests, or those of a third party, where permitted by law.",
                "Comply with a legal or regulatory obligation.",
            ],
        },
        {
            title: "4. Third-Party Integrations",
            paragraphs: ["To provide our services, we share specific data with trusted providers:"],
            bullets: [
                "Bank and payment processors: for payments and invoices. We do not store card or bank details on our servers.",
                "Google Gemini: to assist with project copy and initial design conceptualization.",
                "Cloudinary: for hosting and optimizing project assets and thumbnails.",
            ],
        },
        {
            title: "5. Cookies & Authentication",
            paragraphs: [
                "We use session-based authentication. Your login token (JWT) is stored in HttpOnly, Secure, SameSite=Strict cookies to protect against XSS and CSRF attacks. We do not use persistent marketing cookies without your explicit consent.",
            ],
        },
        {
            title: "6. Data Security",
            paragraphs: [
                "We apply appropriate security measures to prevent your personal data from being accidentally lost, used, accessed, altered, or disclosed without authorization. Access to project data is limited to authenticated account holders and the agency team.",
            ],
        },
        {
            title: "7. Data Retention",
            paragraphs: [
                "We retain personal data only as long as necessary to fulfill the purposes for which it was collected, including legal, accounting, and reporting requirements.",
            ],
        },
        {
            title: "8. Your Legal Rights",
            paragraphs: [
                "You have rights under applicable data protection laws, including the right to request access, correction, erasure, or restriction of processing of your personal data.",
            ],
        },
    ],
    id: [
        {
            title: "1. Pendahuluan",
            paragraphs: [
                "DFD Agency (\u201ckami\u201d) menghormati privasi Anda dan berkomitmen melindungi data pribadi Anda. Kebijakan ini menjelaskan bagaimana kami menjaga data pribadi Anda saat Anda mengunjungi website kami serta hak privasi yang Anda miliki.",
            ],
        },
        {
            title: "2. Data yang Kami Kumpulkan",
            paragraphs: ["Kami dapat mengumpulkan, menggunakan, menyimpan, dan memindahkan berbagai jenis data pribadi Anda:"],
            bullets: [
                "Data Identitas: nama, nama bisnis, dan detail profesional yang diberikan saat pengisian lead atau brief proyek.",
                "Data Kontak: nomor WhatsApp, alamat email, dan alamat penagihan.",
                "Data Transaksi: detail pembayaran dan layanan yang Anda beli dari kami.",
                "Data Teknis: alamat IP, data login, jenis dan versi browser, serta data platform melalui cookie sesi.",
            ],
        },
        {
            title: "3. Cara Kami Menggunakan Data Anda",
            paragraphs: ["Kami hanya menggunakan data pribadi Anda ketika diizinkan oleh hukum. Umumnya kami menggunakannya untuk:"],
            bullets: [
                "Menjalankan kontrak yang akan atau telah kami buat dengan Anda.",
                "Mengomunikasikan pembaruan proyek melalui WhatsApp atau portal klien.",
                "Mendukung kepentingan sah kami atau pihak ketiga sesuai ketentuan hukum.",
                "Memenuhi kewajiban hukum atau peraturan yang berlaku.",
            ],
        },
        {
            title: "4. Integrasi Pihak Ketiga",
            paragraphs: ["Untuk menyediakan layanan, kami membagikan data tertentu kepada penyedia tepercaya:"],
            bullets: [
                "Bank dan pemroses pembayaran: untuk pembayaran dan faktur. Kami tidak menyimpan data kartu atau rekening di server kami.",
                "Google Gemini: untuk membantu pembuatan copy proyek dan konseptualisasi desain awal.",
                "Cloudinary: untuk hosting dan optimalisasi aset serta thumbnail proyek.",
            ],
        },
        {
            title: "5. Cookie & Autentikasi",
            paragraphs: [
                "Kami menggunakan autentikasi berbasis sesi. Token login (JWT) disimpan dalam cookie HttpOnly, Secure, SameSite=Strict untuk melindungi dari serangan XSS dan CSRF. Kami tidak menggunakan cookie pemasaran persisten tanpa persetujuan eksplisit Anda.",
            ],
        },
        {
            title: "6. Keamanan Data",
            paragraphs: [
                "Kami menerapkan langkah keamanan yang sesuai untuk mencegah data pribadi Anda hilang, digunakan, diakses, diubah, atau diungkapkan tanpa izin. Akses ke data proyek dibatasi untuk pemilik akun terautentikasi dan tim agensi.",
            ],
        },
        {
            title: "7. Penyimpanan Data",
            paragraphs: [
                "Kami menyimpan data pribadi hanya selama diperlukan untuk memenuhi tujuan pengumpulannya, termasuk kebutuhan hukum, akuntansi, dan pelaporan.",
            ],
        },
        {
            title: "8. Hak Hukum Anda",
            paragraphs: [
                "Anda memiliki hak berdasarkan hukum perlindungan data yang berlaku, termasuk hak untuk meminta akses, koreksi, penghapusan, atau pembatasan pemrosesan data pribadi Anda.",
            ],
        },
    ],
};

const contact: Record<Locale, string> = {
    en: "If you wish to exercise any of these rights or have concerns about your data, please contact us at",
    id: "Jika Anda ingin menggunakan hak-hak tersebut atau memiliki pertanyaan tentang data Anda, hubungi kami di",
};

export async function generateMetadata({ params }: PageProps) {
    const { locale: raw } = await params;
    const locale = isLocale(raw) ? raw : defaultLocale;
    const dict = getDictionary(locale);
    return {
        title: dict.legal.privacyTitle,
        alternates: {
            canonical: `/${locale}/privacy`,
            languages: { en: '/en/privacy', id: '/id/privacy', 'x-default': '/en/privacy' },
        },
    };
}

export default async function PrivacyPage({ params }: PageProps) {
    const { locale: raw } = await params;
    const locale: Locale = isLocale(raw) ? raw : defaultLocale;
    const dict = getDictionary(locale);
    return (
        <main className="min-h-screen bg-[#FDFDFC] font-sans selection:bg-zinc-900 selection:text-white">
            <Navbar />

            <section className="pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-5xl font-black tracking-tight text-zinc-900 mb-4">{dict.legal.privacyTitle}</h1>
                    <p className="text-zinc-500 mb-12 font-medium italic">{dict.legal.lastUpdated}</p>

                    <div className="space-y-12 text-zinc-700 leading-relaxed">
                        {sections[locale].map((section) => (
                            <div key={section.title}>
                                <h2 className="text-xl font-bold text-zinc-900 mb-4">{section.title}</h2>
                                {section.paragraphs?.map((paragraph) => (
                                    <p key={paragraph} className="mb-3 last:mb-0">
                                        {paragraph}
                                    </p>
                                ))}
                                {section.bullets && (
                                    <ul className="list-disc pl-5 mt-4 space-y-2">
                                        {section.bullets.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}

                        <div className="pt-12 border-t border-zinc-200">
                            <p className="text-sm text-zinc-500">
                                {contact[locale]}{' '}
                                <span className="font-bold text-zinc-900">privacy@dfdagency.com</span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
