import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-[#FDFDFC] font-sans selection:bg-zinc-900 selection:text-white">
            <Navbar />
            
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-5xl font-black tracking-tight text-zinc-900 mb-4">Privacy Policy</h1>
                    <p className="text-zinc-500 mb-12 font-medium italic">Last Updated: March 13, 2026</p>

                    <div className="space-y-12 text-zinc-700 leading-relaxed">
                        
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">1. Introduction</h2>
                            <p>
                                DFD Agency ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">2. The Data We Collect</h2>
                            <p>We may collect, use, store and transfer different kinds of personal data about you:</p>
                            <ul className="list-disc pl-5 mt-4 space-y-2">
                                <li><strong>Identity Data:</strong> Name, business name, and professional credentials provided during lead generation or project briefing.</li>
                                <li><strong>Contact Data:</strong> WhatsApp number, email address, and billing address.</li>
                                <li><strong>Transaction Data:</strong> Details about payments to and from you and other details of products and services you have purchased from us.</li>
                                <li><strong>Technical Data:</strong> IP address, login data, browser type and version, and platform data via session cookies.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">3. How We Use Your Data</h2>
                            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                            <ul className="list-disc pl-5 mt-4 space-y-2">
                                <li>To execute a contract we are about to enter into or have entered into with you (Project Delivery).</li>
                                <li>To communicate project updates via WhatsApp or the Project Tracking Dashboard.</li>
                                <li>Where it is necessary for our legitimate interests (or those of a third party).</li>
                                <li>To comply with a legal or regulatory obligation.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">4. Third-Party Integrations</h2>
                            <p>To provide elite digital services, we share specific data with trusted third-party providers:</p>
                            <ul className="list-disc pl-5 mt-4 space-y-2">
                                <li><strong>Midtrans:</strong> For secure payment processing. We do not store your credit card or bank details on our servers.</li>
                                <li><strong>Google Gemini:</strong> To generate AI-assisted project copy and initial design conceptualization.</li>
                                <li><strong>Cloudinary:</strong> For hosting and optimization of project assets and thumbnails.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">5. Cookies & Authentication</h2>
                            <p>
                                We use session-based authentication. Your login token (JWT) is stored in <span className="font-mono text-zinc-900 font-bold">HttpOnly, Secure, SameSite=Strict</span> cookies. This ensures maximum security against XSS and CSRF attacks. We do not use persistent tracking cookies for marketing without your explicit consent.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">6. Data Security</h2>
                            <p>
                                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. Access to your project data via "Magic Links" is strictly limited to users with the unique project identification code.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">7. Data Retention</h2>
                            <p>
                                We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">8. Your Legal Rights</h2>
                            <p>
                                You have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, or restriction of processing of your personal data.
                            </p>
                        </div>

                        <div className="pt-12 border-t border-zinc-200">
                            <p className="text-sm text-zinc-500">
                                If you wish to exercise any of these rights or have concerns about your data, please reach out to <span className="font-bold text-zinc-900">privacy@dfdagency.com</span>
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
