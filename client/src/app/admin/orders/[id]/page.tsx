'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Clock, Save, Link as LinkIcon, Trash2, Plus, FileText, User, RefreshCw, Package, Activity as ActivityIcon } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ReceiptTemplateModal } from '@/components/admin/ReceiptTemplateModal';
import { MilestoneComposer } from '@/components/admin/MilestoneComposer';
import { MilestoneList } from '@/components/admin/MilestoneList';
import { OrderActivityFeed } from '@/components/admin/OrderActivityFeed';
import { ChatWithClientButton } from '@/components/admin/ChatWithClientButton';
import { ShareProjectButton } from '@/components/admin/ShareProjectButton';

interface Order {
    id: string;
    totalAmount: string;
    status: string;
    createdAt: string;
    Lead: { name: string; whatsapp: string; businessName: string };
    Package: { name: string };
    briefData?: { description?: string };
    handoffUrl?: string;
    currentStep?: number;
    Project?: { id: number; slug: string };
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
    createdAt: string;
}

interface Milestone {
    id: number;
    title: string;
    description: string | null;
    coverUrl: string | null;
    category: string;
    status: string;
    notifyClient: boolean;
    viewedAt: string | null;
    decidedAt: string | null;
    createdAt: string;
    Creator?: { username: string } | null;
}

export default function AdminOrderDetail(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [notes, setNotes] = useState<OrderNote[]>([]);
    const [resources, setResources] = useState<OrderResource[]>([]);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(true);

    const [newNote, setNewNote] = useState('');
    const [isNotePublic, setIsNotePublic] = useState(false);
    const [newResourceTitle, setNewResourceTitle] = useState('');
    const [newResourceUrl, setNewResourceUrl] = useState('');
    const [orderStatus, setOrderStatus] = useState('');
    const [handoffUrl, setHandoffUrl] = useState('');
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);

    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [replyingToNote, setReplyingToNote] = useState<OrderNote | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [orderResult, notesResult, resourcesResult, milestonesResult] = await Promise.allSettled([
                api.get(`/orders/${params.id}`),
                api.get(`/orders/${params.id}/notes`),
                api.get(`/orders/${params.id}/resources`),
                api.get(`/orders/${params.id}/milestones`),
            ]);

            if (orderResult.status === 'fulfilled') {
                const orderData = orderResult.value.data.data;
                setOrder(orderData);
                setOrderStatus(orderData.status);
                setHandoffUrl(orderData.handoffUrl || '');
            } else {
                throw new Error('Critical: Failed to load core order details');
            }
            if (notesResult.status === 'fulfilled') setNotes(notesResult.value.data.data || []);
            else { toast.error('Partial Failure: Could not load timeline'); setNotes([]); }

            if (resourcesResult.status === 'fulfilled') setResources(resourcesResult.value.data.data || []);
            else { toast.error('Partial Failure: Could not load resources'); setResources([]); }

            if (milestonesResult.status === 'fulfilled') setMilestones(milestonesResult.value.data.data || []);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load order details');
            router.push('/admin/orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [params.id]);

    const handleDeleteNote = async (noteId: number) => {
        if (!confirm('Delete this note?')) return;
        try { await api.delete(`/orders/notes/${noteId}`); setNotes(notes.filter(n => n.id !== noteId)); toast.success('Note deleted'); }
        catch { toast.error('Failed to delete note'); }
    };
    const handleEditNote = async (noteId: number) => {
        if (!editContent.trim()) return toast.error('Content cannot be empty');
        try {
            const res = await api.patch(`/orders/notes/${noteId}`, { content: editContent, isPublic: notes.find(n => n.id === noteId)?.isPublic });
            setNotes(notes.map(n => n.id === noteId ? res.data.data : n));
            setEditingNoteId(null); setEditContent(''); toast.success('Note updated');
        } catch { toast.error('Failed to update note'); }
    };
    const handleAddNote = async () => {
        if (!newNote.trim()) return toast.error('Note cannot be empty');
        try {
            const res = await api.post(`/orders/${params.id}/notes`, { content: newNote, isPublic: isNotePublic, parentId: replyingToNote?.id });
            setNotes([res.data.data, ...notes]);
            setNewNote(''); setIsNotePublic(false); setReplyingToNote(null); toast.success('Note added');
        } catch { toast.error('Failed to add note'); }
    };
    const handleAddResource = async () => {
        if (!newResourceTitle.trim() || !newResourceUrl.trim()) return toast.error('Title and URL required');
        try {
            const res = await api.post(`/orders/${params.id}/resources`, { title: newResourceTitle, url: newResourceUrl });
            setResources([res.data.data, ...resources]); setNewResourceTitle(''); setNewResourceUrl(''); toast.success('Resource added');
        } catch { toast.error('Failed to add resource'); }
    };
    const handleDeleteResource = async (resId: number) => {
        if (!confirm('Delete this resource?')) return;
        try { await api.delete(`/orders/resources/${resId}`); setResources(resources.filter(r => r.id !== resId)); toast.success('Resource deleted'); }
        catch { toast.error('Failed to delete resource'); }
    };
    const handleUpdateOrder = async () => {
        if (!order) return;
        try {
            setIsUpdatingOrder(true);
            const res = await api.patch(`/orders/${order.id}/status`, { status: orderStatus, handoffUrl });
            setOrder(res.data.data); toast.success('Order updated');
        } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
        finally { setIsUpdatingOrder(false); }
    };

    const reloadMilestones = async () => {
        try {
            const r = await api.get(`/orders/${params.id}/milestones`);
            setMilestones(r.data.data || []);
        } catch {}
    };

    if (loading) return (
        <div className="p-8 space-y-6">
            <Skeleton className="h-10 w-48" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-64 lg:col-span-1" />
                <Skeleton className="h-96 lg:col-span-2" />
            </div>
        </div>
    );
    if (!order) return null;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-foreground pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild className="rounded-none border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Link href="/admin/orders"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">Order · {order.id.slice(-6)}</h1>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            {order.Lead.businessName || order.Lead.name} · {order.Package.name}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <ChatWithClientButton orderId={order.id} clientName={order.Lead.businessName || order.Lead.name} variant="header" label="Chat Client" />
                    {order.status === 'COMPLETED' && !order.Project && (
                        <Button onClick={async () => {
                            if (!confirm('Promote to Portfolio?')) return;
                            try { const r = await api.post(`/orders/${order.id}/promote`); toast.success('Promoted!'); router.push(`/admin/projects/${r.data.data.id}`); }
                            catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
                        }} className="rounded-none border-2 border-foreground bg-green-600 text-white font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-green-700">
                            Promote
                        </Button>
                    )}
                    {order.Project && <ShareProjectButton slug={order.Project.slug} variant="header" />}
                    <Button variant="outline" size="sm" onClick={() => setReceiptModalOpen(true)} className="rounded-none border-2 border-foreground font-bold uppercase">
                        <FileText className="w-4 h-4 mr-2" /> Receipt
                    </Button>
                    <Button variant="outline" size="icon" onClick={fetchData} className="rounded-none border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-2 border-foreground rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <CardHeader className="border-b-2 border-foreground bg-foreground text-background py-3">
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Order Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Business</p>
                                <p className="font-bold">{order.Lead.businessName || '—'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">WhatsApp</p>
                                <p className="font-mono text-sm">{order.Lead.whatsapp}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</p>
                                <p className="font-mono font-bold">Rp {Number(order.totalAmount).toLocaleString('id-ID')}</p>
                            </div>
                            <div className="space-y-2 pt-2 border-t-2 border-dashed">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</Label>
                                <select className="w-full p-2 rounded-none border-2 border-foreground text-sm font-bold uppercase" value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
                                    <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                                    <option value="PROCESSING">PROCESSING</option>
                                    <option value="REVISION">REVISION</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Handoff / Asset URL</Label>
                                <Input placeholder="https://..." value={handoffUrl} onChange={(e) => setHandoffUrl(e.target.value)} className="rounded-none border-2 border-foreground" />
                            </div>
                            <Button onClick={handleUpdateOrder} disabled={isUpdatingOrder} className="w-full rounded-none border-2 border-foreground bg-foreground text-background font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {isUpdatingOrder ? 'Saving...' : 'Save'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-foreground rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <CardHeader className="border-b-2 border-foreground bg-foreground text-background py-3">
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Resources</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <Input placeholder="Title (Figma, Repo, etc.)" value={newResourceTitle} onChange={(e) => setNewResourceTitle(e.target.value)} className="rounded-none border-2 border-foreground" />
                            <div className="flex gap-2">
                                <Input placeholder="https://..." value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)} className="rounded-none border-2 border-foreground" />
                                <Button onClick={handleAddResource} size="icon" className="rounded-none border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><Plus className="w-4 h-4" /></Button>
                            </div>
                            <div className="space-y-2 pt-2">
                                {resources.length === 0 ? <p className="text-xs italic text-muted-foreground">No resources yet.</p> : resources.map((res) => (
                                    <div key={res.id} className="flex items-center justify-between p-2 border-2 border-foreground text-sm group">
                                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="font-bold underline truncate mr-2 flex items-center gap-1">
                                            <LinkIcon className="w-3 h-3" /> {res.title}
                                        </a>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500" onClick={() => handleDeleteResource(res.id)}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-foreground rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <CardHeader className="border-b-2 border-foreground bg-foreground text-background py-3">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><ActivityIcon className="w-4 h-4" /> Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <OrderActivityFeed orderId={order.id} />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-2 border-foreground rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <CardHeader className="border-b-2 border-foreground bg-foreground text-background py-3">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Package className="w-4 h-4" /> Deliverables ({milestones.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <MilestoneComposer orderId={order.id} onCreated={reloadMilestones} />
                            <MilestoneList milestones={milestones} onChanged={reloadMilestones} />
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-foreground rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <CardHeader className="border-b-2 border-foreground bg-foreground text-background py-3">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Project Diary (Internal)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4 bg-zinc-50">
                            <div className="bg-background p-3 border-2 border-foreground space-y-2">
                                {replyingToNote && (
                                    <div className="flex items-center justify-between bg-muted p-2 border-l-4 border-foreground text-xs">
                                        <span className="truncate">Replying: "{replyingToNote.content}"</span>
                                        <button onClick={() => setReplyingToNote(null)}><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                )}
                                <Textarea placeholder="Internal note (off by default)..." className="resize-none border-0 focus-visible:ring-0 px-0 bg-transparent" value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={2} />
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="public-mode" checked={isNotePublic} onCheckedChange={setIsNotePublic} />
                                        <Label htmlFor="public-mode" className="text-xs font-bold uppercase cursor-pointer">{isNotePublic ? 'Public' : 'Internal'}</Label>
                                    </div>
                                    <Button onClick={handleAddNote} size="sm" className="rounded-none border-2 border-foreground bg-foreground text-background font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        <Save className="w-3 h-3 mr-1" /> Post
                                    </Button>
                                </div>
                            </div>

                            <div className="relative border-l-2 border-foreground/20 ml-2 space-y-3">
                                {notes.length === 0 ? <p className="pl-4 text-xs italic text-muted-foreground">No notes yet.</p> : notes.map((note) => (
                                    <div key={note.id} className="relative pl-4">
                                        <div className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-background ${note.isPublic ? 'bg-blue-500' : 'bg-foreground'}`}></div>
                                        <div className={`p-3 border-2 ${note.isPublic ? 'bg-blue-50 border-blue-300' : 'bg-background border-foreground'}`}>
                                            {note.Parent && (
                                                <div className="mb-2 pl-2 border-l-2 border-foreground/30 text-xs italic text-muted-foreground">
                                                    Replied to: "{note.Parent.content.slice(0, 80)}{note.Parent.content.length > 80 ? '...' : ''}"
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase">
                                                    <User className="w-3 h-3" />
                                                    {note.isClient ? (order.Lead.businessName || order.Lead.name) : (note.Author?.username || 'system')}
                                                    <span className="text-muted-foreground">· {format(new Date(note.createdAt), 'MMM dd HH:mm')}</span>
                                                    {note.isEdited && <span className="italic">(edited)</span>}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {!note.isClient && (
                                                        <button onClick={() => { setEditingNoteId(note.id); setEditContent(note.content); }} className="text-[10px] font-bold uppercase text-foreground/40 hover:text-blue-600">Edit</button>
                                                    )}
                                                    <button onClick={() => handleDeleteNote(note.id)} className="text-foreground/40 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                            {editingNoteId === note.id ? (
                                                <div className="space-y-2">
                                                    <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-[60px] text-sm border-2 border-foreground rounded-none" />
                                                    <div className="flex gap-2 justify-end">
                                                        <Button variant="outline" size="sm" onClick={() => setEditingNoteId(null)} className="rounded-none">Cancel</Button>
                                                        <Button size="sm" onClick={() => handleEditNote(note.id)} className="rounded-none">Save</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ReceiptTemplateModal open={receiptModalOpen} onOpenChange={setReceiptModalOpen} order={order} />
        </div>
    );
}
