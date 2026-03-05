'use client';

import { useEffect, useState } from 'react';
import { PublicService } from '@/services/public.service';
import { useParams } from 'next/navigation';

export default function TrackOrder() {
    const params = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!params.id) return;
        PublicService.trackOrder(params.id as string)
            .then(res => {
                if (res.success) {
                    setOrder(res.data);
                }
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Failed to locate project in database.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [params.id]);

    if (loading) return <div className="p-12 font-black text-2xl uppercase tracking-widest text-center">Tracking Sequence Initiated...</div>;
    if (error) return <div className="p-10 font-bold text-red-600 border-4 border-red-600 m-10 text-xl">{error}</div>;

    return (
        <div className="p-10 space-y-6 bg-white text-black min-h-screen">
            <h1 className="text-4xl font-black tracking-tighter">PROJECT TRACKING RAW</h1>
            <p className="text-sm font-bold bg-black text-white p-2 inline-block">Order ID / Identifikator: {params.id}</p>

            <pre className="text-xs overflow-auto bg-gray-100 p-4 border-4 border-black mt-4">
                {JSON.stringify(order, null, 2)}
            </pre>
        </div>
    );
}
