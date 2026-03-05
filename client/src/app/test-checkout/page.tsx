'use client';

import { useState, useEffect } from 'react';
import { PublicService } from '@/services/public.service';
import { useRouter } from 'next/navigation';

export default function TestCheckout() {
    const [packages, setPackages] = useState<{id: string; name: string; price: number; discountPrice?: number; features: string[]}[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [form, setForm] = useState({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        companyName: '',
        requirements: '',
        packageId: '',
        paymentMethod: 'MIDTRANS'
    });

    useEffect(() => {
        PublicService.getPackages().then(res => {
            if (res.data) setPackages(res.data);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const orderRes = await PublicService.createOrder(form);
            if (orderRes.success && orderRes.data?.paymentUrl) {
                // Redirect user to real Midtrans payment gateway
                window.location.href = orderRes.data.paymentUrl;
            } else if (orderRes.success && orderRes.data?.id) {
                // Fallback if manual transfer logic instead of Midtrans
                alert('Order Created successfully! Proceed to checkout page manually.');
            } else {
                alert('Order created, but no payment URL returned: ' + JSON.stringify(orderRes));
            }
        } catch (error) {
            alert('Checkout failed: ' + ((error as {response?: {data?: {message?: string}}}).response?.data?.message || (error as Error).message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 max-w-2xl mx-auto bg-white text-black min-h-screen">
            <h1 className="text-3xl font-black mb-2 tracking-tighter">RAW CHECKOUT PIPELINE</h1>
            <p className="text-xs font-bold bg-red-100 text-red-800 p-2 mb-6">DO NOT USE FOR PRODUCTION. NO UI, PURE FUNCTIONALITY.</p>

            <form onSubmit={handleSubmit} className="space-y-4 border-4 border-black p-6">
                <div>
                    <label className="block text-sm font-bold uppercase mb-1">Package Select</label>
                    <select required className="w-full border-2 border-black p-2 bg-white" value={form.packageId} onChange={e => setForm({ ...form, packageId: e.target.value })}>
                        <option value="">-- CHOOSE A PACKAGE --</option>
                        {packages.map(pkg => (
                            <option key={pkg.id} value={pkg.id}>
                                {pkg.name} - Rp {pkg.price} {pkg.discountPrice ? `(Discount: Rp ${pkg.discountPrice})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold uppercase mb-1">Client Name</label>
                    <input required type="text" className="w-full border-2 border-black p-2" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-bold uppercase mb-1">Client Email</label>
                    <input required type="email" className="w-full border-2 border-black p-2" value={form.clientEmail} onChange={e => setForm({ ...form, clientEmail: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-bold uppercase mb-1">Client Phone (WhatsApp)</label>
                    <input required type="text" className="w-full border-2 border-black p-2" value={form.clientPhone} onChange={e => setForm({ ...form, clientPhone: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-bold uppercase mb-1">Company Name (Optional)</label>
                    <input type="text" className="w-full border-2 border-black p-2" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-bold uppercase mb-1">Project Requirements / Brief</label>
                    <textarea required className="w-full border-2 border-black p-2" rows={4} value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-bold uppercase mb-1">Payment Method</label>
                    <select required className="w-full border-2 border-black p-2 bg-white" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                        <option value="MIDTRANS">Auto (Midtrans QRIS/VA)</option>
                        <option value="MANUAL_TRANSFER">Manual (Bank Transfer)</option>
                    </select>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-black text-white p-4 font-black mt-4 hover:bg-zinc-800 transition-colors">
                    {loading ? 'PROCESSING THROUGH EXPRESS...' : 'EXECUTE PIPELINE -> OPEN PAYMENT'}
                </button>
            </form>
        </div>
    );
}
