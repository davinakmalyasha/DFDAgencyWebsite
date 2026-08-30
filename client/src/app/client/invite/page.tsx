'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ClientInvitePage() {
    const params = useSearchParams();
    const router = useRouter();
    const token = params.get('token');
    const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (!token) { setState('error'); setMsg('Missing invite token'); return; }
        api.post('/auth/invite/verify', { token }).then(() => {
            setState('ok');
            setTimeout(() => { router.push('/client/dashboard'); router.refresh(); }, 800);
        }).catch((e: any) => {
            setState('error');
            setMsg(e.response?.data?.message || 'Invite invalid or expired');
        });
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="max-w-md w-full border-2 border-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader><CardTitle className="font-black uppercase">Client Invite</CardTitle></CardHeader>
                <CardContent>
                    {state === 'loading' && <p className="text-sm text-muted-foreground">Verifying your invite…</p>}
                    {state === 'ok' && <p className="text-sm font-semibold text-green-600">Verified — redirecting to your dashboard…</p>}
                    {state === 'error' && (<><p className="text-sm text-red-600 mb-4">{msg}</p><Button variant="outline" className="rounded-none" onClick={() => router.push('/client/login')}>Go to login</Button></>)}
                </CardContent>
            </Card>
        </div>
    );
}
