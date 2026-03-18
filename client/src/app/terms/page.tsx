import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-[#FDFDFC] font-sans selection:bg-zinc-900 selection:text-white">
            <Navbar />
            
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-5xl font-black tracking-tight text-zinc-900 mb-4">Terms of Service</h1>
                    <p className="text-zinc-500 mb-12 font-medium italic">Last Updated: March 13, 2026</p>

                    <div className="space-y-12 text-zinc-700 leading-relaxed">
                        
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using the services provided by DFD Agency ("the Agency"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. These terms apply to all clients, visitors, and others who access our services.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">2. Description of Services</h2>
                            <p>
                                DFD Agency provides high-end digital solutions including but not limited to UI/UX Design, Full-Stack Web Development, AI Integration, and Digital Branding. Detailed project scopes are defined in individual project briefs or invoices.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">3. Project Briefs & AI Utilization</h2>
                            <p>
                                We leverage advanced AI tools (including Google Gemini) to accelerate project workflows. While we ensure high standards of quality, clients acknowledge that AI-assisted content or code generation is a part of our production methodology intended to maximize efficiency and delivery speed.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">4. Client Obligations</h2>
                            <p>
                                Clients agree to provide accurate project requirements, timely feedback, and necessary assets (logos, copy, images) required for project completion. Delays in client feedback may lead to project timeline adjustments.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">5. Payment Terms</h2>
                            <ul className="list-disc pl-5 mt-4 space-y-2">
                                <li><strong>Invoicing:</strong> All payments are processed via our secure payment gateway partner (Midtrans).</li>
                                <li><strong>Deposit:</strong> A non-refundable deposit may be required before project commencement as specified in the selected package.</li>
                                <li><strong>Final Payment:</strong> Project deliverables will be released or deployed only upon full receipt of final payment.</li>
                                <li><strong>No Refunds:</strong> Due to the digital nature of our architectural services, all sales are final once work has commenced.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">6. Intellectual Property</h2>
                            <p>
                                Upon receipt of full payment, all custom design and code assets created specifically for the Client shall be transferred to the Client. DFD Agency retains the right to display the completed work in its portfolio for promotional purposes unless otherwise agreed in writing.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">7. Limitation of Liability</h2>
                            <p>
                                DFD Agency shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our services, including but not limited to loss of business profits or data.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">8. Termination</h2>
                            <p>
                                We reserve the right to terminate or suspend access to our services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-4">9. Governing Law</h2>
                            <p>
                                These Terms shall be governed and construed in accordance with the laws of the Republic of Indonesia, without regard to its conflict of law provisions.
                            </p>
                        </div>

                        <div className="pt-12 border-t border-zinc-200">
                            <p className="text-sm text-zinc-500">
                                If you have any questions about these Terms, please contact us at <span className="font-bold text-zinc-900">hello@dfdagency.com</span>
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
