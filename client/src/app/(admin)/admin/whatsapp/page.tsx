'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, RefreshCcw, PowerOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

type BotStatus = 'DISCONNECTED' | 'INITIALIZING' | 'CONNECTED';

export default function WhatsAppManagerPage() {
    const [status, setStatus] = useState<BotStatus>('INITIALIZING');
    const [qrValue, setQrValue] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const checkStatus = async () => {
        try {
            const res = await api.get('/whatsapp/status');
            if (res.data.success) {
                setStatus(res.data.data.status);
            }
        } catch (err) {
            console.error('Failed to fetch status');
        }
    };

    const fetchQR = async () => {
        try {
            const res = await api.get('/whatsapp/qr');
            if (res.data.success && res.data.data.qr) {
                setQrValue(res.data.data.qr);
            }
        } catch (err) {
            // QR might not be ready yet
            setQrValue(null);
        }
    };

    useEffect(() => {
        // Initial check
        checkStatus();
        setLoading(false);

        // Polling interval
        const interval = setInterval(() => {
            checkStatus();
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Only pool QR when disconnected
        if (status === 'DISCONNECTED') {
            fetchQR();
            const qrInterval = setInterval(fetchQR, 5000);
            return () => clearInterval(qrInterval);
        }
    }, [status]);

    const handleStartSession = async () => {
        try {
            setStatus('INITIALIZING');
            toast.info('Starting WhatsApp Bot sequence...');
            await api.post('/whatsapp/start');
        } catch (err) {
            toast.error('Failed to command bot start');
        }
    };

    const handleLogout = async () => {
        if (!confirm('Are you sure you want to end the active WhatsApp Session? All future automatic notifications will fail until you scan a new QR code.')) return;

        try {
            toast.info('Terminating WhatsApp Bot Session...');
            await api.post('/whatsapp/logout');
            setStatus('DISCONNECTED');
        } catch (err) {
            toast.error('Failed to log out bot');
        }
    };

    if (loading) return null;

    return (
        <div className="space-y-6 max-w-2xl mx-auto pt-8">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
                    <Smartphone className="w-8 h-8" /> WA Session Manager
                </h1>
                <p className="text-muted-foreground font-medium">Link your agency device to enable automated robotic messaging.</p>
            </div>

            <Card className="rounded-none border-2 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader className="border-b-2 border-foreground bg-muted/20 pb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="font-black uppercase tracking-tight">Bot Status</CardTitle>
                            <CardDescription className="font-bold text-xs uppercase text-muted-foreground mt-1">Live Connection Monitor</CardDescription>
                        </div>
                        {status === 'CONNECTED' && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 border border-green-500 font-bold text-sm">
                                <ShieldCheck className="w-4 h-4" /> SECURE & ACTIVE
                            </div>
                        )}
                        {status === 'INITIALIZING' && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500 font-bold text-sm animate-pulse">
                                <RefreshCcw className="w-4 h-4 animate-spin" /> BOOTING UP...
                            </div>
                        )}
                        {status === 'DISCONNECTED' && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-600 border border-red-500 font-bold text-sm">
                                <AlertCircle className="w-4 h-4" /> DISCONNECTED
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center min-h-[350px]">
                    {status === 'CONNECTED' && (
                        <div className="text-center space-y-4">
                            <div className="relative inline-flex mb-4">
                                <div className="absolute inset-0 bg-green-500 blur-xl opacity-30 animate-pulse rounded-full"></div>
                                <Smartphone className="w-24 h-24 text-green-500 relative z-10" />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-widest text-green-600">Operations Normal</h2>
                            <p className="font-medium text-muted-foreground max-w-sm mx-auto">
                                The automated WhatsApp engine is live. The system will dispatch payment invoices and hosting reminders seamlessly.
                            </p>
                        </div>
                    )}

                    {status === 'INITIALIZING' && (
                        <div className="text-center space-y-4">
                            <RefreshCcw className="w-16 h-16 text-muted-foreground animate-spin mx-auto" />
                            <h2 className="text-lg font-bold uppercase tracking-widest">Opening Headless Browser...</h2>
                            <p className="text-sm font-medium text-muted-foreground">This may take 10-30 seconds depending on server RAM.</p>
                        </div>
                    )}

                    {status === 'DISCONNECTED' && (
                        <div className="text-center w-full space-y-6 flex flex-col items-center">
                            {qrValue ? (
                                <div className="bg-white p-4 border-4 border-black inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <QRCodeSVG value={qrValue} size={240} />
                                </div>
                            ) : (
                                <div className="w-[240px] h-[240px] border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted/10">
                                    <span className="font-bold text-muted-foreground uppercase text-xs text-center px-4">Waiting for QR Payload...</span>
                                </div>
                            )}

                            <div className="max-w-xs">
                                <h3 className="font-bold mb-2 uppercase">Authentication Required</h3>
                                <p className="text-sm text-muted-foreground font-medium">
                                    1. Open WhatsApp on your device<br />
                                    2. Tap Menu <span className="font-bold">⋮</span> or Settings ⚙️<br />
                                    3. Select Linked Devices<br />
                                    4. Scan this code block<br />
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="border-t-2 border-foreground bg-muted/10 flex justify-end gap-3 p-4">
                    {status === 'DISCONNECTED' && (
                        <Button
                            variant="default"
                            className="rounded-none border-2 border-transparent font-bold uppercase hover:bg-black"
                            onClick={handleStartSession}
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" /> Force Reboot Bot
                        </Button>
                    )}

                    {status === 'CONNECTED' && (
                        <Button
                            variant="destructive"
                            className="rounded-none font-bold uppercase"
                            onClick={handleLogout}
                        >
                            <PowerOff className="w-4 h-4 mr-2" /> Terminate Session
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
