import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getDictionary } from "@/i18n/messages";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

type PageProps = { params: Promise<{ locale: string }> };

type Section = { title: string; paragraphs?: string[]; bullets?: string[] };

const sections: Record<Locale, Section[]> = {
    en: [
        {
            title: "1. Acceptance of Terms",
            paragraphs: [
                "By accessing or using the services provided by DFD Agency (\u201cthe Agency\u201d), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. These terms apply to all clients, visitors, and others who access our services.",
            ],
        },
        {
            title: "2. Description of Services",
            paragraphs: [
                "DFD Agency provides high-end digital solutions including but not limited to UI/UX design, full-stack web development, AI integration, and digital branding. Detailed project scopes are defined in individual project briefs or invoices.",
            ],
        },
        {
            title: "3. Project Briefs & AI Utilization",
            paragraphs: [
                "We leverage advanced AI tools, including Google Gemini, to accelerate project workflows. While we maintain high quality standards, clients acknowledge that AI-assisted content or code generation is part of our production methodology.",
            ],
        },
        {
            title: "4. Client Obligations",
            paragraphs: [
                "Clients agree to provide accurate project requirements, timely feedback, and necessary assets (logos, copy, images) required for project completion. Delays in client feedback may lead to project timeline adjustments.",
            ],
        },
        {
            title: "5. Payment Terms",
            bullets: [
                "Invoicing: all payments are processed via secure invoice, bank transfer, or an agreed payment method.",
                "Deposit: a non-refundable deposit may be required before project commencement as specified in the selected package.",
                "Final Payment: project deliverables will be released or deployed only upon full receipt of final payment.",
                "No Refunds: due to the digital nature of our services, all sales are final once work has commenced.",
            ],
        },
        {
            title: "6. Intellectual Property",
            paragraphs: [
                "Upon receipt of full payment, all custom design and code assets created specifically for the client shall be transferred to the client. DFD Agency retains the right to display completed work in its portfolio unless otherwise agreed in writing.",
            ],
        },
        {
            title: "7. Limitation of Liability",
            paragraphs: [
                "DFD Agency shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our services, including loss of business profits or data.",
            ],
        },
        {
            title: "8. Termination",
            paragraphs: [
                "We reserve the right to terminate or suspend access to our services immediately, without prior notice or liability, for any reason, including if you breach these Terms.",
            ],
        },
        {
            title: "9. Governing Law",
            paragraphs: [
                "These Terms shall be governed and construed in accordance with the laws of the Republic of Indonesia, without regard to its conflict of law provisions.",
            ],
        },
    ],
    id: [
        {
            title: "1. Penerimaan Syarat",
            paragraphs: [
                "Dengan mengakses atau menggunakan layanan yang disediakan DFD Agency (\u201cAgensi\u201d), Anda setuju untuk terikat dengan Syarat Layanan ini. Jika Anda tidak setuju, mohon jangan menggunakan layanan kami. Syarat ini berlaku bagi seluruh klien, pengunjung, dan pihak lain yang mengakses layanan kami.",
            ],
        },
        {
            title: "2. Deskripsi Layanan",
            paragraphs: [
                "DFD Agency menyediakan solusi digital kelas atas yang mencakup antara lain desain UI/UX, pengembangan web full-stack, integrasi AI, dan branding digital. Lingkup proyek secara rinci ditetapkan dalam brief proyek atau faktur masing-masing.",
            ],
        },
        {
            title: "3. Brief Proyek & Penggunaan AI",
            paragraphs: [
                "Kami memanfaatkan alat AI canggih, termasuk Google Gemini, untuk mempercepat alur kerja proyek. Meskipun kami menjaga standar kualitas tinggi, klien memahami bahwa konten atau kode berbantuan AI merupakan bagian dari metodologi produksi kami.",
            ],
        },
        {
            title: "4. Kewajiban Klien",
            paragraphs: [
                "Klien setuju untuk memberikan kebutuhan proyek yang akurat, umpan balik tepat waktu, dan aset yang diperlukan (logo, copy, gambar) untuk penyelesaian proyek. Keterlambatan umpan balik dapat menyebabkan penyesuaian timeline proyek.",
            ],
        },
        {
            title: "5. Ketentuan Pembayaran",
            bullets: [
                "Faktur: seluruh pembayaran diproses melalui faktur aman, transfer bank, atau metode pembayaran yang disepakati.",
                "Deposit: deposit yang tidak dapat dikembalikan dapat diminta sebelum proyek dimulai sesuai paket yang dipilih.",
                "Pembayaran Final: hasil kerja akan dirilis atau diluncurkan hanya setelah pembayaran final diterima penuh.",
                "Tanpa Pengembalian Dana: karena sifat digital layanan kami, seluruh penjualan bersifat final setelah pekerjaan dimulai.",
            ],
        },
        {
            title: "6. Hak Kekayaan Intelektual",
            paragraphs: [
                "Setelah pembayaran penuh diterima, seluruh aset desain dan kode khusus yang dibuat untuk klien dialihkan kepada klien. DFD Agency berhak menampilkan pekerjaan yang telah selesai dalam portofolio kecuali disepakati lain secara tertulis.",
            ],
        },
        {
            title: "7. Batasan Tanggung Jawab",
            paragraphs: [
                "DFD Agency tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan kami, termasuk kehilangan keuntungan bisnis atau data.",
            ],
        },
        {
            title: "8. Penghentian",
            paragraphs: [
                "Kami berhak menghentikan atau menangguhkan akses ke layanan kami segera, tanpa pemberitahuan sebelumnya atau tanggung jawab, untuk alasan apa pun, termasuk jika Anda melanggar Syarat ini.",
            ],
        },
        {
            title: "9. Hukum yang Berlaku",
            paragraphs: [
                "Syarat ini diatur dan ditafsirkan sesuai dengan hukum Republik Indonesia, tanpa memperhatikan ketentuan konflik hukumnya.",
            ],
        },
    ],
};

const contact: Record<Locale, string> = {
    en: "If you have any questions about these Terms, please contact us at",
    id: "Jika Anda memiliki pertanyaan tentang Syarat ini, hubungi kami di",
};

export async function generateMetadata({ params }: PageProps) {
    const { locale: raw } = await params;
    const locale = isLocale(raw) ? raw : defaultLocale;
    const dict = getDictionary(locale);
    return {
        title: dict.legal.termsTitle,
        alternates: {
            canonical: `/${locale}/terms`,
            languages: { en: '/en/terms', id: '/id/terms', 'x-default': '/en/terms' },
        },
    };
}

export default async function TermsPage({ params }: PageProps) {
    const { locale: raw } = await params;
    const locale: Locale = isLocale(raw) ? raw : defaultLocale;
    const dict = getDictionary(locale);
    return (
        <main className="min-h-screen bg-[#FDFDFC] font-sans selection:bg-zinc-900 selection:text-white">
            <Navbar />

            <section className="pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-5xl font-black tracking-tight text-zinc-900 mb-4">{dict.legal.termsTitle}</h1>
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
                                <span className="font-bold text-zinc-900">hello@dfdagency.com</span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
