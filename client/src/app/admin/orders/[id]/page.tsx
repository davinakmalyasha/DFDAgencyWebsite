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
import { ArrowLeft, Clock, Save, Link as LinkIcon, Trash2, Plus, FileText, User, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ReceiptTemplateModal } from '@/components/admin/ReceiptTemplateModal';

interface Order {
    id: string;
    totalAmount: string;
    status: string;
    createdAt: string;
    Lead: { name: string; whatsapp: string; businessName: string };
    Package: { name: string };
    briefData?: { description?: string };
    handoffUrl?: string; // Add this
    Project?: { id: string };
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

export default function AdminOrderDetail(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [notes, setNotes] = useState<OrderNote[]>([]);
    const [resources, setResources] = useState<OrderResource[]>([]);
    const [loading, setLoading] = useState(true);

    // Form inputs
    const [newNote, setNewNote] = useState('');
    const [isNotePublic, setIsNotePublic] = useState(false);
    const [newResourceTitle, setNewResourceTitle] = useState('');
    const [newResourceUrl, setNewResourceUrl] = useState('');
    const [orderStatus, setOrderStatus] = useState(''); // New
    const [handoffUrl, setHandoffUrl] = useState(''); // New
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false); // New
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);

    // Edit/Reply state
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [replyingToNote, setReplyingToNote] = useState<OrderNote | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [orderResult, notesResult, resourcesResult] = await Promise.allSettled([
                api.get(`/orders/${params.id}`),
                api.get(`/orders/${params.id}/notes`),
                api.get(`/orders/${params.id}/resources`)
            ]);

            if (orderResult.status === 'fulfilled') {
                const orderData = orderResult.value.data.data;
                setOrder(orderData);
                setOrderStatus(orderData.status);
                setHandoffUrl(orderData.handoffUrl || '');
            } else {
                throw new Error("Critical: Failed to load core order details");
            }

            if (notesResult.status === 'fulfilled') {
                setNotes(notesResult.value.data.data || []);
            } else {
                toast.error("Partial Failure: Could not load order timeline/notes");
                setNotes([]);
            }

            if (resourcesResult.status === 'fulfilled') {
                setResources(resourcesResult.value.data.data || []);
            } else {
                toast.error("Partial Failure: Could not load project resources");
                setResources([]);
            }
        } catch (error: any) {
            console.error('Failed to fetch data', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to load order details';
            toast.error(errorMessage);
            console.log('Error context:', {
                id: params.id,
                url: error.config?.url,
                status: error.response?.status
            });
            router.push('/admin/orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    const handleDeleteNote = async (noteId: number) => {
        if (!confirm('Are you sure you want to delete this note?')) return;
        try {
            await api.delete(`/orders/notes/${noteId}`);
            setNotes(notes.filter(n => n.id !== noteId));
            toast.success('Note deleted');
        } catch (error) {
            toast.error('Failed to delete note');
        }
    };

    const handleEditNote = async (noteId: number) => {
        if (!editContent.trim()) return toast.error('Content cannot be empty');
        try {
            const res = await api.patch(`/orders/notes/${noteId}`, {
                content: editContent,
                isPublic: notes.find(n => n.id === noteId)?.isPublic
            });
            setNotes(notes.map(n => n.id === noteId ? res.data.data : n));
            setEditingNoteId(null);
            setEditContent('');
            toast.success('Note updated');
        } catch (error) {
            toast.error('Failed to update note');
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return toast.error('Note cannot be empty');
        try {
            const res = await api.post(`/orders/${params.id}/notes`, {
                content: newNote,
                isPublic: isNotePublic,
                parentId: replyingToNote?.id
            });
            setNotes([res.data.data, ...notes]);
            setNewNote('');
            setIsNotePublic(false);
            setReplyingToNote(null);
            toast.success('Note added successfully');
        } catch (error) {
            toast.error('Failed to add note');
        }
    };

    const handleAddResource = async () => {
        if (!newResourceTitle.trim() || !newResourceUrl.trim()) return toast.error('Title and URL required');
        try {
            const res = await api.post(`/orders/${params.id}/resources`, {
                title: newResourceTitle,
                url: newResourceUrl
            });
            setResources([res.data.data, ...resources]);
            setNewResourceTitle('');
            setNewResourceUrl('');
            toast.success('Resource added');
        } catch (error) {
            toast.error('Failed to add resource');
        }
    };

    const handleDeleteResource = async (resId: number) => {
        if (!confirm('Delete this resource?')) return;
        try {
            await api.delete(`/resources/${resId}`);
            setResources(resources.filter(r => r.id !== resId));
            toast.success('Resource deleted');
        } catch (error) {
            toast.error('Failed to delete resource');
        }
    };

    const handleUpdateOrder = async () => {
        if (!order) return;
        try {
            setIsUpdatingOrder(true);
            const res = await api.patch(`/orders/${order.id}/status`, {
                status: orderStatus,
                handoffUrl: handoffUrl
            });
            setOrder(res.data.data);
            toast.success('Order updated successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update order');
        } finally {
            setIsUpdatingOrder(false);
        }
    };
    const handlePromote = async () => {
        if (!order || order.status !== 'COMPLETED') return toast.error('Only completed orders can be promoted');
        if (order.Project) return toast.error('Order already promoted to project');

        const confirmed = confirm('Promote this completed order to a Portfolio Project?');
        if (!confirmed) return;

        try {
            const res = await api.post(`/orders/${params.id}/promote`);
            toast.success('Promoted to Portfolio Project!');
            router.push(`/admin/projects/${res.data.data.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Promotion failed');
        }
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/admin/orders"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manage Order: {order.id.slice(-6)}</h1>
                        <p className="text-sm text-zinc-500">Client: {order.Lead.name} • {order.Package.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {order.status === 'COMPLETED' && !order.Project && (
                        <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handlePromote}>
                            <Plus className="w-4 h-4 mr-2" /> Promote to Project
                        </Button>
                    )}
                    {order.Project && (
                        <Button variant="outline" asChild>
                            <Link href={`/admin/projects/${order.Project.id}`}>
                                <LinkIcon className="w-4 h-4 mr-2" /> View Project
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setReceiptModalOpen(true)}>
                        <FileText className="w-4 h-4 mr-2" /> Receipt Template
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT COLUMN: Details & Resources */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Order Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-zinc-400" /> Order Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-zinc-500">Business Name</p>
                                <p className="font-medium text-zinc-900">{order.Lead.businessName || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500">WhatsApp</p>
                                <p className="font-medium text-zinc-900">{order.Lead.whatsapp}</p>
                            </div>
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-sm text-zinc-500">Order Status</Label>
                                    <select 
                                        className="w-full p-2 rounded-md border text-sm bg-white"
                                        value={orderStatus}
                                        onChange={(e) => setOrderStatus(e.target.value)}
                                    >
                                        <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                                        <option value="PROCESSING">PROCESSING</option>
                                        <option value="REVISION">REVISION</option>
                                        <option value="COMPLETED">COMPLETED</option>
                                        <option value="CANCELLED">CANCELLED</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-zinc-500">Handoff / Asset Link</Label>
                                    <Input 
                                        placeholder="https://gdrive.com/..." 
                                        value={handoffUrl}
                                        onChange={(e) => setHandoffUrl(e.target.value)}
                                    />
                                    <p className="text-[10px] text-zinc-400 italic">This link will appear for the client once status is COMPLETED.</p>
                                </div>
                                <Button 
                                    className="w-full" 
                                    size="sm" 
                                    onClick={handleUpdateOrder}
                                    disabled={isUpdatingOrder}
                                >
                                    {isUpdatingOrder ? 'Saving...' : 'Save Order Mapping'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resources Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><LinkIcon className="w-5 h-5 text-zinc-400" /> Project Resources</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Input 
                                    placeholder="Resource Name (e.g. Figma Source)" 
                                    value={newResourceTitle} 
                                    onChange={(e) => setNewResourceTitle(e.target.value)} 
                                />
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="https://..." 
                                        value={newResourceUrl} 
                                        onChange={(e) => setNewResourceUrl(e.target.value)} 
                                    />
                                    <Button onClick={handleAddResource} size="icon"><Plus className="w-4 h-4" /></Button>
                                </div>
                            </div>
                            
                            <div className="space-y-2 pt-4">
                                {resources.length === 0 ? (
                                    <p className="text-sm text-zinc-500 italic">No resources attached yet.</p>
                                ) : (
                                    resources.map((res) => (
                                        <div key={res.id} className="flex items-center justify-between p-2 rounded-md border text-sm group">
                                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate mr-2">
                                                {res.title}
                                            </a>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500" onClick={() => handleDeleteResource(res.id)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Project Diary */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="flex flex-col h-full min-h-[500px]">
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-zinc-400" /> Project Diary (Timeline)</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-4 space-y-6 bg-zinc-50/50">
                            
                            {/* Note Input */}
                            <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                                {replyingToNote && (
                                    <div className="flex items-center justify-between bg-zinc-50 p-2 rounded-lg border-l-4 border-zinc-400 mb-2">
                                        <div className="text-xs truncate max-w-[80%] text-zinc-600">
                                            Replying to: <span className="italic">"{replyingToNote.content}"</span>
                                        </div>
                                        <button onClick={() => setReplyingToNote(null)} className="text-zinc-400 hover:text-zinc-600">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                <Textarea 
                                    placeholder={replyingToNote ? "Write your reply..." : "Write a timeline update or technical note..."}
                                    className="resize-none border-0 focus-visible:ring-0 px-0"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    rows={3}
                                />
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="flex items-center space-x-2">
                                        <Switch 
                                            id="public-mode" 
                                            checked={isNotePublic} 
                                            onCheckedChange={setIsNotePublic} 
                                        />
                                        <Label htmlFor="public-mode" className="text-sm text-zinc-600 cursor-pointer">
                                            {isNotePublic ? <span className="text-blue-600 font-medium">Public (Client Visible)</span> : 'Internal Note'}
                                        </Label>
                                    </div>
                                    <Button onClick={handleAddNote} size="sm"><Save className="w-4 h-4 mr-2" /> {replyingToNote ? 'Post Reply' : 'Post Note'}</Button>
                                </div>
                            </div>

                            {/* Timeline Feed */}
                            <div className="relative border-l border-zinc-200 ml-3 space-y-6 pb-4">
                                {notes.length === 0 ? (
                                    <div className="pl-6 text-sm text-zinc-500 italic">No timeline entries yet. Start logging progress above.</div>
                                ) : (
                                    notes.map((note) => (
                                        <div key={note.id} className="relative pl-6">
                                            {/* Timeline Dot */}
                                            <div className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white ${note.isPublic ? 'bg-blue-500' : 'bg-zinc-300'}`}></div>
                                            
                                            <div className={`p-4 rounded-xl border ${note.isPublic ? 'bg-blue-50/30 border-blue-100' : 'bg-white shadow-sm'}`}>
                                                {/* Quote Reply if exists */}
                                                {note.Parent && (
                                                    <div className="mb-3 pl-3 border-l-2 border-zinc-200 text-xs text-zinc-500 italic py-1">
                                                        <p className="font-semibold mb-1 text-[10px] uppercase tracking-wider">
                                                            Replied to {note.Parent.isClient ? (order.Lead.businessName || order.Lead.name) : 'Staff'}:
                                                        </p>
                                                        {note.Parent.content.length > 100 ? note.Parent.content.slice(0, 100) + '...' : note.Parent.content}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                        <span className="flex items-center gap-1 font-medium text-zinc-700">
                                                            <User className="w-3 h-3" /> 
                                                            {note.isClient ? (order.Lead.businessName || order.Lead.name) : (note.Author?.username || (note.content.includes('testimonial') ? 'Testimonial System' : 'Automation'))}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{format(new Date(note.createdAt), 'MMM dd, HH:mm')}</span>
                                                        {note.isEdited && <span className="text-[10px] italic ml-1">(edited)</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1.5 mr-2">
                                                            <button 
                                                                onClick={() => { setReplyingToNote(note); setNewNote(`@${note.Author?.username || 'Client'} `); }}
                                                                className="text-[10px] font-bold uppercase text-zinc-400 hover:text-zinc-600 transition-colors"
                                                            >
                                                                Reply
                                                            </button>
                                                            {!note.isClient && (
                                                                <button 
                                                                    onClick={() => { setEditingNoteId(note.id); setEditContent(note.content); }}
                                                                    className="text-[10px] font-bold uppercase text-zinc-400 hover:text-blue-600 transition-colors"
                                                                >
                                                                    Edit
                                                                </button>
                                                            )}
                                                        </div>
                                                        {note.isPublic ? (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Public</span>
                                                        ) : (
                                                            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Internal</span>
                                                        )}
                                                        <button onClick={() => handleDeleteNote(note.id)} className="text-zinc-400 hover:text-red-500 transition-colors ml-1">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {editingNoteId === note.id ? (
                                                    <div className="space-y-3 pt-2">
                                                        <Textarea 
                                                            value={editContent} 
                                                            onChange={(e) => setEditContent(e.target.value)} 
                                                            className="min-h-[100px] text-sm"
                                                        />
                                                        <div className="flex gap-2 justify-end">
                                                            <Button variant="outline" size="sm" onClick={() => setEditingNoteId(null)}>Cancel</Button>
                                                            <Button size="sm" onClick={() => handleEditNote(note.id)}>Save Changes</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-zinc-800 whitespace-pre-wrap">{note.content}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <ReceiptTemplateModal 
                open={receiptModalOpen} 
                onOpenChange={setReceiptModalOpen} 
                order={order} 
            />
        </div>
    );
}
