'use client';

import { useEffect, useState } from 'react';
import { PublicService } from '@/services/public.service';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Link as LinkIcon, Clock, CheckCircle2, ChevronRight, User, Star, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import api from '@/lib/axios';

interface Order {
    id: string;
    totalAmount: string;
    status: string;
    createdAt: string;
    briefData?: any;
    Lead: { name: string; businessName: string };
    Package: { name: string };
    handoffUrl?: string;
    Notes: OrderNote[];
    Resources: OrderResource[];
    isLocked: boolean;
    Project?: { id: number; testimonialQuote: string | null };
}

interface OrderNote {
    id: number;
    content: string;
    isPublic: boolean;
    isClient: boolean;
    isEdited: boolean;
    parentId: number | null;
    createdAt: string;
    Author: { username: string } | null;
    Parent?: { id: number; content: string; isClient?: boolean };
}

interface OrderResource {
    id: number;
    title: string;
    url: string;
    icon: string | null;
}

export default function TrackOrder() {
    const params = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [reviewQuote, setReviewQuote] = useState('');
    const [reviewNameOverride, setReviewNameOverride] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const [clientNote, setClientNote] = useState('');
    const [isSubmittingNote, setIsSubmittingNote] = useState(false);

    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [replyingToNote, setReplyingToNote] = useState<OrderNote | null>(null);

    // Verification Lock state
    const [whatsappInput, setWhatsappInput] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        if (!params.id) return;
        PublicService.trackOrder(params.id as string)
            .then(res => {
                if (res.success) {
                    setOrder(res.data);
                    // Trigger confetti if completed
                    if (res.data.status === 'COMPLETED') {
                        triggerSuccessConfetti();
                    }
                }
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Failed to locate project in database.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [params.id]);

    const handleVerify = async () => {
        if (!whatsappInput.trim()) return toast.error('Please enter your WhatsApp number.');
        setIsVerifying(true);
        try {
            const res = await api.post(`/orders/track/${params.id}/verify`, { 
                whatsapp: whatsappInput 
            });
            
            if (res.data.success) {
                toast.success('Identity verified! Details unlocked.');
                // Refresh order data
                const refreshRes = await PublicService.trackOrder(params.id as string);
                if (refreshRes.success) {
                    setOrder(refreshRes.data);
                }
            } else {
                toast.error(res.data.message || 'Verification failed. Please check your number.');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Verification failed.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewQuote || reviewQuote.trim().length < 10) {
            return toast.error('Please provide a slightly longer review (min 10 characters).');
        }

        try {
            setIsSubmittingReview(true);
            const res = await api.post(`/orders/track/${order!.id}/testimonial`, { 
                quote: reviewQuote, 
                overrideName: reviewNameOverride 
            });
            
            if (res.data.success) {
                toast.success('Thank you for your review!');
                // Optimistically update UI
                setOrder(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        Project: prev.Project ? { ...prev.Project, testimonialQuote: reviewQuote } : undefined
                    };
                });
            } else {
                toast.error(res.data.message || 'Failed to submit review.');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleSubmitClientNote = async () => {
        if (!clientNote.trim() || !order) return;
        setIsSubmittingNote(true);
        try {
            const res = await api.post(`/orders/track/${order.id}/notes`, { 
                content: clientNote,
                parentId: replyingToNote?.id
            });
            
            if (res.data.success) {
                toast.success('Update posted!');
                setClientNote('');
                setReplyingToNote(null);
                // Optimistically update
                setOrder(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        Notes: [res.data.data, ...prev.Notes]
                    };
                });
            } else {
                toast.error(res.data.message || 'Failed to post update.');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmittingNote(false);
        }
    };

    const handleEditClientNote = async (noteId: number) => {
        if (!editContent.trim() || !order) return;
        try {
            const res = await api.patch(`/orders/track/${order.id}/notes/${noteId}`, { 
                content: editContent 
            });
            if (res.data.success) {
                toast.success('Note updated!');
                setEditingNoteId(null);
                setEditContent('');
                setOrder(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        Notes: prev.Notes.map(n => n.id === noteId ? res.data.data : n)
                    };
                });
            } else {
                toast.error(res.data.message || 'Failed to update note.');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update note.');
        }
    };

    const handleDeleteClientNote = async (noteId: number) => {
        if (!confirm('Are you sure you want to delete this update?') || !order) return;
        try {
            const res = await api.delete(`/orders/track/${order.id}/notes/${noteId}`);
            if (res.data.success) {
                toast.success('Note deleted.');
                setOrder(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        Notes: prev.Notes.filter(n => n.id !== noteId)
                    };
                });
            } else {
                toast.error(res.data.message || 'Failed to delete note.');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete note.');
        }
    };

    const getStatusDisplay = (status: string) => {
        const flow = ['PENDING_PAYMENT', 'PROCESSING', 'REVISION', 'COMPLETED'];
        const cx = flow.indexOf(status);
        if (cx === -1) return status;

        return (
            <div className="flex items-center space-x-2 text-xs font-medium uppercase tracking-wider text-zinc-500 mt-4 overflow-x-auto pb-2">
                {flow.map((s, i) => (
                    <div key={s} className="flex items-center opacity-70">
                        <span className={`flex items-center justify-center w-5 h-5 rounded-full mr-1.5 ${i <= cx ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-400'}`}>
                            {i < cx ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : i + 1}
                        </span>
                        <span className={i <= cx ? 'text-zinc-900 font-bold' : ''}>{s.replace('_', ' ')}</span>
                        {i < flow.length - 1 && <ChevronRight className="w-3 h-3 mx-2 text-zinc-300" />}
                    </div>
                ))}
            </div>
        );
    };

    if (loading) return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-8">
            <div className="w-full max-w-5xl space-y-6">
                <Skeleton className="h-12 w-64" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-80 lg:col-span-1" />
                    <Skeleton className="h-[500px] lg:col-span-2" />
                </div>
            </div>
        </div>
    );
    
    if (error) return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-8">
            <div className="bg-white p-10 font-bold text-red-600 border border-red-200 rounded-xl shadow-sm text-center max-w-lg w-full">
                <p className="text-xl mb-2">Tracking Error</p>
                <p className="text-sm font-normal text-zinc-600">{error}</p>
            </div>
        </div>
    );

    if (!order) return null;

    // --- VERIFICATION LOCK UI ---
    if (order.isLocked) {
        return (
            <div className="min-h-screen bg-[#FDFDFC] flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-100 via-transparent to-transparent">
                <Card className="max-w-md w-full border-0 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[32px] overflow-hidden bg-white/80 backdrop-blur-xl">
                    <CardHeader className="pt-12 pb-8 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 mb-2">
                           <User className="w-8 h-8 text-white" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-3xl font-black tracking-tight text-zinc-900 uppercase">Verification</CardTitle>
                            <CardDescription className="text-zinc-500 font-medium">Please enter your WhatsApp number to unlock project details.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="px-10 pb-12 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 pl-1">WhatsApp Number</label>
                                <Input 
                                    type="text" 
                                    placeholder="e.g. 0812..." 
                                    className="h-14 bg-zinc-50/50 border-zinc-200 rounded-2xl text-lg font-bold placeholder:text-zinc-300 focus:ring-0 focus:border-zinc-950 transition-all"
                                    value={whatsappInput}
                                    onChange={(e) => setWhatsappInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                    disabled={isVerifying}
                                />
                            </div>
                            <Button 
                                className="w-full h-14 bg-zinc-950 hover:bg-zinc-800 text-white rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                onClick={handleVerify}
                                disabled={isVerifying}
                            >
                                {isVerifying ? 'Verifying...' : 'Unlock Project'}
                            </Button>
                        </div>
                        <div className="pt-4 text-center">
                            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider leading-relaxed">
                                Secure Identity Check by<br/>
                                <span className="text-zinc-950 font-black">DFD AGENCY SECURITY</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFC] text-zinc-950 font-sans selection:bg-zinc-900 selection:text-white pb-20">
            {/* Minimal Header */}
            <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="text-xl font-black tracking-tighter uppercase">DFD<span className="text-zinc-400">AGENCY</span></div>
                    <div className="text-xs font-mono bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded-md border border-zinc-200">
                        ID: {order.id.slice(0, 8)}...
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 mt-10 space-y-12">
                
                {/* Intro Section */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900">
                            Hi {order.Lead.businessName ? order.Lead.name.split(' ')[0] : order.Lead.name},
                        </h1>
                        <p className="text-lg text-zinc-500 font-medium">Tracking your project: <strong>{order.Package.name}</strong>.</p>
                        {getStatusDisplay(order.status)}
                    </div>

                    {/* LOCKED STATE ONLY FOR PENDING PAYMENT */}
                    {order.status === 'PENDING_PAYMENT' && (
                        <div className="py-20 border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center text-center px-6 bg-white/50">
                            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
                                <Clock className="w-8 h-8 text-zinc-400 animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-zinc-900 mb-2">Project Command Center Initializing</h2>
                            <p className="text-zinc-500 max-w-sm text-sm leading-relaxed">
                                We've received your inquiry! Your command center unlocks once we move your project into the <strong>Processing</strong> stage. For now, please ensure you've connected with us on WhatsApp to finalize payment.
                            </p>
                            <div className="mt-8">
                                <Button variant="outline" className="rounded-full border-zinc-200 text-xs uppercase tracking-widest font-black h-10 px-6" asChild>
                                    <a href={`https://wa.me/62812115160?text=I'd like to confirm my order ${order.id.slice(0, 8)}`} target="_blank" rel="noopener noreferrer">
                                        Confirm on WhatsApp
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* SUCCESS HANDOFF BANNER (UNLOCKED) */}
                    {order.status === 'COMPLETED' && (
                        <Card className="bg-zinc-950 text-white border-0 shadow-2xl relative overflow-hidden group rounded-3xl">
                            {/* Animated background accent */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/50 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-zinc-700/50 transition-colors duration-700"></div>
                            
                            <CardContent className="p-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="space-y-4 text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 text-[10px] font-black tracking-widest uppercase mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                        Deployment Success
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Your project is live!</h2>
                                    <p className="text-zinc-400 max-w-md text-base leading-relaxed">
                                        Congratulations! We have successfully finalized and deployed your high-performance solution. Access your production environment or claim your source assets below.
                                    </p>
                                </div>
                                
                                <div className="flex flex-col gap-4 w-full md:w-auto">
                                    {order.handoffUrl && (
                                        <Button className="bg-white text-zinc-950 hover:bg-zinc-200 font-bold h-14 px-10 text-lg rounded-xl shadow-[0_20px_40px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-95" asChild>
                                            <a href={order.handoffUrl} target="_blank" rel="noopener noreferrer">
                                                Visit Production Site
                                                <LinkIcon className="w-5 h-5 ml-2" />
                                            </a>
                                        </Button>
                                    )}
                                    <div className="flex gap-3">
                                        <Button variant="outline" size="lg" className="flex-1 border-zinc-800 hover:bg-zinc-800 text-white font-bold h-12" asChild>
                                            <a href="#testimonial-section">Review</a>
                                        </Button>
                                        <Button variant="outline" size="lg" className="flex-1 border-zinc-800 hover:bg-zinc-800 text-white font-bold h-12" asChild>
                                            <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/orders/track/${order.id}/invoice`} target="_blank" rel="noopener noreferrer">Invoice</a>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* UNLOCKED COMMAND CENTER CONTENT */}
                {order.status !== 'PENDING_PAYMENT' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        
                        {/* LEFT COLUMN: Details & Resources (4 cols) */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Order Summary Snapshot */}
                            <Card className="border border-zinc-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                                <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
                                    <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-800">
                                        <FileText className="w-4 h-4 text-zinc-400" /> Order Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Package</p>
                                        <p className="font-bold text-zinc-900">{order.Package.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Date Started</p>
                                        <p className="font-medium text-zinc-900">{format(new Date(order.createdAt), 'MMMM dd, yyyy')}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Project Brief Snapshot */}
                            {order.briefData && Object.keys(order.briefData).some(key => key !== 'businessName' && order.briefData[key]) && (
                                <Card className="border border-zinc-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                                    <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
                                        <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-800">
                                            <FileText className="w-4 h-4 text-zinc-400" /> Project Brief
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 space-y-4">
                                        {Object.entries(order.briefData).map(([key, value]) => {
                                            if (!value || key === 'businessName') return null;
                                            return (
                                                <div key={key} className="space-y-1 border-b border-zinc-50 pb-2 last:border-0 last:pb-0">
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </p>
                                                    <p className="text-sm font-medium text-zinc-800 break-words">
                                                        {String(value)}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Project Asset Links */}
                            <Card className="border border-zinc-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                                <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
                                    <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-800">
                                        <LinkIcon className="w-4 h-4 text-zinc-400" /> Source Assets
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {order.Resources.length === 0 ? (
                                        <div className="p-6 text-sm text-zinc-500 text-center italic">Final assets are being uploaded...</div>
                                    ) : (
                                        <div className="divide-y divide-zinc-100">
                                            {order.Resources.map((res) => (
                                                <a 
                                                    key={res.id} 
                                                    href={res.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors group"
                                                >
                                                    <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">{res.title}</span>
                                                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Testimonial Submission Widget */}
                            <div id="testimonial-section">
                                {order.Project && !order.Project.testimonialQuote && (
                                    <Card className="border border-zinc-900 shadow-md rounded-2xl overflow-hidden bg-zinc-900 text-white relative">
                                        <CardHeader className="pb-4 relative z-10">
                                            <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> Share Your Thoughts
                                            </CardTitle>
                                            <CardDescription className="text-zinc-400 text-xs">
                                                We'd love to hear about your experience working with DFD Agency.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-5 space-y-4 relative z-10">
                                            <Textarea 
                                                placeholder="How was the final result?" 
                                                className="resize-none bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 text-sm focus-visible:ring-1 focus-visible:ring-zinc-600"
                                                rows={4}
                                                value={reviewQuote}
                                                onChange={(e) => setReviewQuote(e.target.value)}
                                                disabled={isSubmittingReview}
                                            />
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Display Name (Optional)</label>
                                                <Input 
                                                    placeholder={order.Lead.businessName || order.Lead.name} 
                                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 h-9 text-xs"
                                                    value={reviewNameOverride}
                                                    onChange={(e) => setReviewNameOverride(e.target.value)}
                                                    disabled={isSubmittingReview}
                                                />
                                            </div>
                                            <Button 
                                                className="w-full bg-white text-zinc-950 hover:bg-zinc-200 transition-colors text-xs h-9 uppercase tracking-widest font-bold mt-2"
                                                onClick={handleSubmitReview}
                                                disabled={isSubmittingReview}
                                            >
                                                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                                            </Button>
                                        </CardContent>
                                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-zinc-800 blur-3xl rounded-full opacity-50 z-0 pointer-events-none"></div>
                                    </Card>
                                )}
                                
                                {order.Project?.testimonialQuote && (
                                    <Card className="border border-zinc-200 shadow-sm rounded-2xl overflow-hidden bg-zinc-50">
                                        <CardContent className="p-6 text-center space-y-2">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            </div>
                                            <h3 className="text-sm font-bold text-zinc-900">Thank you for your feedback!</h3>
                                            <p className="text-xs text-zinc-500 italic">"{order.Project.testimonialQuote}"</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                        </div>

                        {/* RIGHT COLUMN: Project Timeline Diary (8 cols) */}
                        <div className="lg:col-span-8">
                            <Card className="border border-zinc-200 shadow-sm rounded-2xl h-full min-h-[600px] bg-white overflow-hidden">
                                <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
                                    <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-800">
                                        <Clock className="w-4 h-4 text-zinc-400" /> Milestone History
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 md:p-8">
                                    <div className="relative border-l-2 border-zinc-100 ml-4 space-y-10 pb-4">
                                        {order.Notes.length === 0 ? (
                                            <div className="pl-8 text-sm text-zinc-500 italic">No milestone entries available.</div>
                                        ) : (
                                            order.Notes.map((note, index) => (
                                                <div key={note.id} className="relative pl-8 animate-in slide-in-from-bottom-2 fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                                                    <div className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-4 border-white ${note.isClient ? 'bg-indigo-500' : 'bg-zinc-900'} shadow-sm ring-1 ring-zinc-200`}></div>
                                                    
                                                    <div className={`border ${note.isClient ? 'bg-indigo-50/30 border-indigo-100' : 'bg-white border-zinc-200'} rounded-xl p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow relative overflow-hidden group`}>
                                                        {note.Parent && (
                                                            <div className="mb-3 pl-3 border-l-2 border-zinc-200 text-xs text-zinc-500 italic py-1">
                                                                <p className="font-semibold mb-1 text-[10px] uppercase tracking-wider">
                                                                    Replied to {note.Parent.isClient ? 'Client' : 'Project Manager'}:
                                                                </p>
                                                                {note.Parent.content.length > 80 ? note.Parent.content.slice(0, 80) + '...' : note.Parent.content}
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between mb-3 text-xs font-medium text-zinc-500">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`flex items-center gap-1.5 ${note.isClient ? 'text-indigo-600' : 'text-zinc-600'}`}>
                                                                    <User className="w-3.5 h-3.5" /> 
                                                                    {note.isClient ? (order.Lead.businessName || order.Lead.name) : (note.Author?.username || 'System')}
                                                                </span>
                                                                <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                                                                <span>{format(new Date(note.createdAt), 'MMMM dd, HH:mm')}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <p className="text-[15px] leading-relaxed text-zinc-700 whitespace-pre-wrap">
                                                            {note.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </main>

        </div>
    );
}
