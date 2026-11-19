'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import api from '@/lib/axios';
import { useSession } from '@/components/providers/SessionProvider';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ClientRequest, Milestone, Order } from '@dfd/shared';
import {
    AlertCircle,
    ArrowRight,
    ArrowUpRight,
    Briefcase,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
    ExternalLink,
    Eye,
    FileText,
    FolderOpen,
    Image as ImageIcon,
    KeyRound,
    Loader2,
    MessageCircle,
    MessageSquare,
    Plus,
    RefreshCw,
    Rocket,
    ScrollText,
    Send,
    Sparkles,
    ThumbsDown,
    ThumbsUp,
} from 'lucide-react';

const STEPS = ['Brief', 'Payment', 'Production', 'Review', 'Handover'];
const WHATSAPP = 'https://wa.me/62895324350359?text=Hi%20DFD%2C%20I%27d%20like%20to%20start%20a%20project';

type PortalOrder = Order & {
    packageName?: string;
    Package?: { id: number; name: string };
    progress?: { currentStep?: number; status?: string };
};

type PortalRequest = ClientRequest;

type ApiFailure = {
    response?: {
        status?: number;
        data?: { message?: string; error?: string };
    };
};

type Tone = 'neutral' | 'amber' | 'sky' | 'violet' | 'emerald' | 'rose';

const TONE_CLASS: Record<Tone, string> = {
    neutral: 'border-zinc-200 bg-white text-zinc-600',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
};

const ORDER_STATUS: Record<string, { label: string; tone: Tone }> = {
    PENDING_PAYMENT: { label: 'Payment pending', tone: 'amber' },
    PROCESSING: { label: 'In production', tone: 'sky' },
    REVISION: { label: 'In revision', tone: 'violet' },
    COMPLETED: { label: 'Completed', tone: 'emerald' },
    CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

const MILESTONE_STATUS: Record<string, { label: string; tone: Tone }> = {
    READY: { label: 'New', tone: 'amber' },
    IN_REVIEW: { label: 'In review', tone: 'violet' },
    REVISION_NEEDED: { label: 'Revision asked', tone: 'rose' },
    APPROVED: { label: 'Approved', tone: 'emerald' },
    REJECTED: { label: 'Rejected', tone: 'rose' },
};

const REQUEST_STATUS: Record<string, { label: string; tone: Tone }> = {
    PENDING: { label: 'Open', tone: 'amber' },
    APPROVED: { label: 'Approved', tone: 'emerald' },
    REJECTED: { label: 'Declined', tone: 'rose' },
};

const REQUEST_TYPE: Record<string, { label: string; icon: typeof MessageSquare }> = {
    GENERAL: { label: 'General', icon: MessageSquare },
    ACCESS: { label: 'Access', icon: KeyRound },
    FILE: { label: 'Files & Drive', icon: FolderOpen },
    MEETING: { label: 'Meeting', icon: CalendarDays },
    REVISION: { label: 'Revision', icon: RefreshCw },
};

const REQUEST_TYPES = ['GENERAL', 'ACCESS', 'FILE', 'MEETING', 'REVISION'];

function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none',
                TONE_CLASS[tone]
            )}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {label}
        </span>
    );
}

function StatTile({
    label,
    value,
    hint,
    icon: Icon,
    highlight = false,
}: {
    label: string;
    value: number;
    hint: string;
    icon: typeof Briefcase;
    highlight?: boolean;
}) {
    return (
        <div
            className={cn(
                'rounded-2xl border p-4 transition-colors sm:p-5',
                highlight
                    ? 'border-zinc-950 bg-zinc-950 text-white shadow-[0_16px_40px_-24px_rgba(9,9,11,0.9)]'
                    : 'border-zinc-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <span className={cn('text-xs font-medium', highlight ? 'text-zinc-400' : 'text-zinc-500')}>
                    {label}
                </span>
                <span
                    className={cn(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-full',
                        highlight ? 'bg-white/10 text-white' : 'bg-zinc-50 text-zinc-500'
                    )}
                >
                    <Icon className="h-3.5 w-3.5" />
                </span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tighter leading-none">{value}</p>
            <p className={cn('mt-2 text-[11px]', highlight ? 'text-zinc-400' : 'text-zinc-400')}>{hint}</p>
        </div>
    );
}

function ProgressRail({ step, status }: { step: number; status: string }) {
    const current = Math.max(0, Math.min(step, STEPS.length - 1));
    return (
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {STEPS.map((label, index) => {
                const done = status === 'COMPLETED' || index < current;
                const active = !done && index === current && status !== 'CANCELLED';
                return (
                    <div key={label} className="min-w-0">
                        <div
                            className={cn(
                                'h-1.5 rounded-full transition-colors',
                                done ? 'bg-zinc-950' : active ? 'bg-zinc-400' : 'bg-zinc-100'
                            )}
                        />
                        <div className="mt-2 flex items-center gap-1.5">
                            {done ? (
                                <Check className="h-3 w-3 shrink-0 text-zinc-950" />
                            ) : (
                                <span
                                    className={cn(
                                        'h-1.5 w-1.5 shrink-0 rounded-full',
                                        active ? 'bg-zinc-950' : 'bg-zinc-300'
                                    )}
                                />
                            )}
                            <span
                                className={cn(
                                    'truncate text-[10px] font-semibold sm:text-[11px]',
                                    done || active ? 'text-zinc-900' : 'text-zinc-400'
                                )}
                            >
                                {label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function DocLink({
    href,
    label,
    icon: Icon,
    accent = false,
}: {
    href: string;
    label: string;
    icon: typeof FileText;
    accent?: boolean;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold transition-all duration-200',
                accent
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-700 hover:bg-emerald-600 hover:text-white'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-900 hover:text-zinc-950'
            )}
        >
            <Icon className="h-3 w-3" />
            {label}
            <ArrowUpRight className="h-2.5 w-2.5 opacity-40" />
        </a>
    );
}

function SectionHeading({
    title,
    count,
    description,
    action,
}: {
    title: string;
    count?: number;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex items-end justify-between gap-4">
            <div>
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold tracking-tight">{title}</h2>
                    {typeof count === 'number' && (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-zinc-100 px-1.5 text-[10px] font-bold text-zinc-500">
                            {count}
                        </span>
                    )}
                </div>
                {description && <p className="mt-1 text-xs text-zinc-400">{description}</p>}
            </div>
            {action}
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-3">
                <Skeleton className="h-3 w-36 rounded-full" />
                <Skeleton className="h-9 w-72 rounded-xl" />
                <Skeleton className="h-4 w-96 max-w-full rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[118px] rounded-2xl" />
                ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-4">
                    {[0, 1].map((i) => (
                        <Skeleton key={i} className="h-64 rounded-3xl" />
                    ))}
                </div>
                <Skeleton className="h-72 rounded-3xl" />
            </div>
        </div>
    );
}

export default function ClientDashboardPage() {
    const { user } = useSession();
    const { formatPrice } = useCurrency();
    const [orders, setOrders] = useState<PortalOrder[]>([]);
    const [milestonesByOrder, setMilestonesByOrder] = useState<Record<string, Milestone[]>>({});
    const [requests, setRequests] = useState<PortalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [today] = useState(() => format(new Date(), 'EEEE, d MMMM'));
    const [feedback, setFeedback] = useState<Record<string, string>>({});
    const [feedbackOpen, setFeedbackOpen] = useState<Record<string, boolean>>({});
    const [requestOpen, setRequestOpen] = useState(false);
    const [requestForm, setRequestForm] = useState({ title: '', body: '', type: 'GENERAL', orderId: '' });
    const [sendingRequest, setSendingRequest] = useState(false);
    const [decideModal, setDecideModal] = useState<{
        open: boolean;
        milestoneId: number | null;
        action: 'APPROVE' | 'REQUEST_REVISION';
    }>({ open: false, milestoneId: null, action: 'APPROVE' });
    const [decideNote, setDecideNote] = useState('');
    const [loadingDecide, setLoadingDecide] = useState(false);

    const load = useCallback(async (options?: { silent?: boolean }) => {
        if (options?.silent) setRefreshing(true);
        else setLoading(true);
        try {
            const [ordersRes, requestsRes] = await Promise.all([
                api.get('/client/orders'),
                api.get('/client/requests'),
            ]);
            const list: PortalOrder[] = ordersRes.data.data || [];
            const milestones = await Promise.all(
                list.map(async (order) => {
                    try {
                        const res = await api.get(`/client/orders/${order.id}/milestones`);
                        return [order.id, (res.data.data || []) as Milestone[]] as const;
                    } catch {
                        return [order.id, [] as Milestone[]] as const;
                    }
                })
            );
            setOrders(list);
            setMilestonesByOrder(Object.fromEntries(milestones));
            setRequests(requestsRes.data.data || []);
            setLoadError('');
        } catch (error) {
            const failure = error as ApiFailure;
            if (failure.response?.status !== 401) {
                const message = failure.response?.data?.message || 'Refresh and try again.';
                setLoadError(message);
                toast.error('Could not load your projects', { description: message });
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void load();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [load]);

    const allMilestones = useMemo(
        () =>
            orders.flatMap((order) =>
                (milestonesByOrder[order.id] || []).map((milestone) => ({ milestone, order }))
            ),
        [orders, milestonesByOrder]
    );

    const awaitingReview = useMemo(
        () =>
            allMilestones.filter(
                ({ milestone }) => milestone.status === 'READY' || milestone.status === 'IN_REVIEW'
            ),
        [allMilestones]
    );

    const approvedCount = useMemo(
        () => allMilestones.filter(({ milestone }) => milestone.status === 'APPROVED').length,
        [allMilestones]
    );

    const activeProjects = useMemo(
        () => orders.filter((order) => order.status !== 'COMPLETED' && order.status !== 'CANCELLED'),
        [orders]
    );

    const openRequests = useMemo(
        () => requests.filter((request) => request.status === 'PENDING'),
        [requests]
    );

    const decideMilestone = useMemo(
        () => allMilestones.find(({ milestone }) => milestone.id === decideModal.milestoneId)?.milestone,
        [allMilestones, decideModal.milestoneId]
    );

    async function submitFeedback(orderId: string) {
        const quote = feedback[orderId];
        if (!quote || quote.trim().length < 10) return toast.error('Feedback too short (min 10 characters)');
        try {
            await api.post('/client/feedback', { orderId, quote: quote.trim() });
            toast.success('Feedback sent — thank you!');
            setFeedback((state) => ({ ...state, [orderId]: '' }));
            setFeedbackOpen((state) => ({ ...state, [orderId]: false }));
        } catch (error) {
            const failure = error as ApiFailure;
            toast.error(failure.response?.data?.message || 'Could not send feedback');
        }
    }

    async function submitRequest() {
        if (!requestForm.title.trim() || !requestForm.body.trim()) {
            return toast.error('Add a title and a few details');
        }
        try {
            setSendingRequest(true);
            await api.post('/client/requests', {
                ...requestForm,
                orderId: requestForm.orderId || null,
            });
            toast.success('Request sent');
            setRequestForm({ title: '', body: '', type: 'GENERAL', orderId: '' });
            setRequestOpen(false);
            await load({ silent: true });
        } catch (error) {
            const failure = error as ApiFailure;
            toast.error(failure.response?.data?.message || 'Could not send request');
        } finally {
            setSendingRequest(false);
        }
    }

    async function submitDecide() {
        if (!decideModal.milestoneId) return;
        const entry = allMilestones.find(({ milestone }) => milestone.id === decideModal.milestoneId);
        if (!entry) return;
        try {
            setLoadingDecide(true);
            await api.post(`/client/orders/${entry.order.id}/milestones/${decideModal.milestoneId}/decide`, {
                action: decideModal.action,
                note: decideNote.trim() || null,
            });
            toast.success(decideModal.action === 'APPROVE' ? 'Approved — thank you!' : 'Revision requested');
            setDecideModal({ open: false, milestoneId: null, action: 'APPROVE' });
            setDecideNote('');
            await load({ silent: true });
        } catch (error) {
            const failure = error as ApiFailure;
            toast.error(failure.response?.data?.message || 'Could not save your decision');
        } finally {
            setLoadingDecide(false);
        }
    }

    if (loading) return <DashboardSkeleton />;

    const firstName = (user?.username || 'there').replace(/[._-]+/g, ' ').split(' ')[0];

    return (
        <div className="space-y-8">
            {/* Greeting */}
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                        {today || 'Client portal'}
                    </p>
                    <h1 className="mt-2 text-3xl font-black tracking-tighter sm:text-4xl">
                        Welcome back, <span className="capitalize">{firstName}</span>.
                    </h1>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
                        Everything about your projects lives here — progress, approvals, documents, and the team.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => load({ silent: true })}
                        disabled={refreshing}
                        title="Refresh"
                        className="h-10 w-10 rounded-full border-zinc-200 bg-white text-zinc-500 shadow-sm hover:border-zinc-300 hover:text-zinc-950"
                    >
                        <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setRequestOpen(true)}
                        className="h-10 rounded-full border-zinc-200 bg-white px-4 text-[13px] font-semibold shadow-sm hover:border-zinc-300 hover:bg-zinc-50"
                    >
                        <MessageSquare className="h-3.5 w-3.5" />
                        New request
                    </Button>
                    <Link
                        href="/order"
                        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-zinc-950 px-5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800"
                    >
                        <Plus className="h-4 w-4" />
                        New project
                    </Link>
                </div>
            </motion.section>

            {/* Stats */}
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile
                    label="Active projects"
                    value={activeProjects.length}
                    hint={activeProjects.length ? 'Currently in progress' : 'No active work yet'}
                    icon={Briefcase}
                />
                <StatTile
                    label="Awaiting your review"
                    value={awaitingReview.length}
                    hint={awaitingReview.length ? 'Action needed from you' : 'All caught up'}
                    icon={Eye}
                    highlight={awaitingReview.length > 0}
                />
                <StatTile
                    label="Approved deliverables"
                    value={approvedCount}
                    hint="Signed off by you"
                    icon={CheckCircle2}
                />
                <StatTile
                    label="Open requests"
                    value={openRequests.length}
                    hint="With the team"
                    icon={MessageSquare}
                />
            </section>

            {/* Review queue */}
            {awaitingReview.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.08, ease: 'easeOut' }}
                    className="overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-6"
                >
                    <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-100 text-amber-700">
                            <Eye className="h-4 w-4" />
                        </span>
                        <div>
                            <h2 className="text-sm font-bold tracking-tight">Needs your attention</h2>
                            <p className="text-[11px] text-zinc-500">
                                {awaitingReview.length} deliverable{awaitingReview.length === 1 ? '' : 's'} waiting for
                                your review
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        {awaitingReview.map(({ milestone, order }) => (
                            <div
                                key={milestone.id}
                                className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-white/90 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-zinc-900">{milestone.title}</p>
                                    <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                                        {order.Package?.name || order.packageName || 'Project'} ·{' '}
                                        {milestone.category}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            setDecideModal({
                                                open: true,
                                                milestoneId: milestone.id,
                                                action: 'APPROVE',
                                            })
                                        }
                                        className="h-8 rounded-full bg-zinc-950 px-3.5 text-[11px] font-semibold text-white hover:bg-zinc-800"
                                    >
                                        <ThumbsUp className="h-3 w-3" />
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            setDecideModal({
                                                open: true,
                                                milestoneId: milestone.id,
                                                action: 'REQUEST_REVISION',
                                            })
                                        }
                                        className="h-8 rounded-full border-zinc-200 px-3.5 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50"
                                    >
                                        <ThumbsDown className="h-3 w-3" />
                                        Revise
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.section>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                {/* Projects */}
                <section className="space-y-4">
                    <SectionHeading
                        title="Your projects"
                        count={orders.length}
                        description="Live status, deliverables, and files for every engagement."
                    />

                    {loadError && orders.length === 0 ? (
                        <div className="rounded-3xl border border-rose-200 bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-500">
                                <AlertCircle className="h-5 w-5" />
                            </span>
                            <h3 className="mt-4 text-lg font-bold tracking-tight">We couldn&apos;t load your projects.</h3>
                            <p className="mx-auto mt-1.5 max-w-sm text-sm text-zinc-500">{loadError}</p>
                            <Button
                                type="button"
                                onClick={() => load()}
                                disabled={refreshing}
                                className="mt-5 h-10 rounded-full bg-zinc-950 px-5 text-[13px] font-semibold text-white hover:bg-zinc-800"
                            >
                                <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
                                Try again
                            </Button>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white px-6 py-14 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                            <div
                                aria-hidden
                                className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-zinc-100/80 blur-3xl"
                            />
                            <div
                                aria-hidden
                                className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-zinc-50 blur-3xl"
                            />
                            <div className="relative mx-auto max-w-md">
                                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-zinc-950 text-white shadow-lg shadow-zinc-950/10">
                                    <Rocket className="h-6 w-6" />
                                </span>
                                <h3 className="mt-5 text-xl font-black tracking-tight">Your first project starts here.</h3>
                                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
                                    Pick a package, share a short brief, and we will set up your portal. Progress,
                                    approvals, invoices, and final files all land in one place.
                                </p>
                                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                    <Link
                                        href="/order"
                                        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-zinc-950 px-5 text-[13px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800"
                                    >
                                        Start a project
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                    <a
                                        href={WHATSAPP}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-5 text-[13px] font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                                    >
                                        <MessageCircle className="h-3.5 w-3.5" />
                                        Chat with us
                                    </a>
                                </div>
                                <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                                    <span className="rounded-full bg-zinc-50 px-2.5 py-1">Choose a package</span>
                                    <ArrowRight className="h-3 w-3" />
                                    <span className="rounded-full bg-zinc-50 px-2.5 py-1">Share your brief</span>
                                    <ArrowRight className="h-3 w-3" />
                                    <span className="rounded-full bg-zinc-50 px-2.5 py-1">Review &amp; launch</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        orders.map((order) => {
                            const milestones = milestonesByOrder[order.id] || [];
                            const orderStatus = ORDER_STATUS[order.status] || {
                                label: order.status.replace(/_/g, ' ').toLowerCase(),
                                tone: 'neutral' as Tone,
                            };
                            const currentStep = order.progress?.currentStep ?? order.currentStep ?? 0;
                            const amount = formatPrice(order.totalAmount);
                            const feedbackVisible = Boolean(feedbackOpen[order.id]);

                            return (
                                <article
                                    key={order.id}
                                    className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-shadow duration-300 hover:shadow-[0_18px_50px_-30px_rgba(9,9,11,0.35)]"
                                >
                                    {/* Project header */}
                                    <div className="border-b border-zinc-100 p-5 sm:p-6">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                                                        Project
                                                    </p>
                                                    <StatusPill label={orderStatus.label} tone={orderStatus.tone} />
                                                </div>
                                                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                                    <h3 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
                                                        {order.Package?.name || order.packageName || 'Project'}
                                                    </h3>
                                                    {amount && (
                                                        <span className="text-sm font-semibold text-zinc-400">
                                                            {amount}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-xs text-zinc-400">
                                                    Order #{order.id.slice(-8).toUpperCase()} · Started{' '}
                                                    {format(new Date(order.createdAt), 'd MMM yyyy')}
                                                    {order.updatedAt
                                                        ? ` · Updated ${format(new Date(order.updatedAt), 'd MMM')}`
                                                        : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                                                    Progress
                                                </span>
                                                <span className="text-[11px] font-medium text-zinc-500">
                                                    {order.status === 'COMPLETED'
                                                        ? 'Delivered'
                                                        : `Step ${Math.min(currentStep + 1, STEPS.length)} of ${STEPS.length}`}
                                                </span>
                                            </div>
                                            <ProgressRail step={currentStep} status={order.status} />
                                        </div>

                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {order.driveFolderUrl && (
                                                <DocLink href={order.driveFolderUrl} label="Drive" icon={FolderOpen} />
                                            )}
                                            {order.handoffUrl && (
                                                <DocLink
                                                    href={order.handoffUrl}
                                                    label="Final assets"
                                                    icon={ExternalLink}
                                                    accent
                                                />
                                            )}
                                            <DocLink
                                                href={`/api/v1/client/orders/${order.id}/invoice`}
                                                label="Invoice"
                                                icon={FileText}
                                            />
                                            <DocLink
                                                href={`/api/v1/client/orders/${order.id}/contract`}
                                                label="Contract"
                                                icon={ScrollText}
                                            />
                                            <DocLink
                                                href={`/api/v1/client/orders/${order.id}/welcome`}
                                                label="Welcome pack"
                                                icon={Sparkles}
                                            />
                                        </div>
                                    </div>

                                    {/* Deliverables */}
                                    <div className="space-y-4 p-5 sm:p-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="flex items-center gap-2 text-sm font-bold tracking-tight">
                                                Deliverables
                                                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500">
                                                    {milestones.length}
                                                </span>
                                            </h4>
                                        </div>

                                        {milestones.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60 px-5 py-8 text-center">
                                                <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-white text-zinc-400 shadow-sm">
                                                    <ImageIcon className="h-4 w-4" />
                                                </span>
                                                <p className="mt-3 text-sm font-semibold text-zinc-700">
                                                    Nothing posted yet
                                                </p>
                                                <p className="mt-1 text-xs text-zinc-400">
                                                    New work from the team will appear here automatically.
                                                </p>
                                            </div>
                                        ) : (
                                            <ol className="relative space-y-3 before:absolute before:bottom-5 before:left-[7px] before:top-5 before:w-px before:bg-zinc-200">
                                                {milestones.map((milestone) => {
                                                    const status = MILESTONE_STATUS[milestone.status] || {
                                                        label: milestone.status.replace(/_/g, ' ').toLowerCase(),
                                                        tone: 'neutral' as Tone,
                                                    };
                                                    const decided =
                                                        milestone.status === 'APPROVED' ||
                                                        milestone.status === 'REJECTED' ||
                                                        milestone.status === 'REVISION_NEEDED';
                                                    const dot =
                                                        milestone.status === 'APPROVED'
                                                            ? 'border-emerald-500 bg-emerald-500'
                                                            : milestone.status === 'REVISION_NEEDED' ||
                                                                milestone.status === 'REJECTED'
                                                              ? 'border-rose-500 bg-rose-500'
                                                              : milestone.status === 'IN_REVIEW'
                                                                ? 'border-violet-500 bg-violet-500'
                                                                : milestone.status === 'READY'
                                                                  ? 'border-amber-500 bg-amber-500'
                                                                  : 'border-zinc-300 bg-white';
                                                    return (
                                                        <li key={milestone.id} className="relative pl-7">
                                                            <span
                                                                className={cn(
                                                                    'absolute left-0 top-6 h-[15px] w-[15px] rounded-full border-2 ring-4 ring-white',
                                                                    dot
                                                                )}
                                                            />
                                                            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-zinc-300">
                                                                {milestone.coverUrl && (
                                                                    <a
                                                                        href={milestone.coverUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="group relative block h-40 overflow-hidden border-b border-zinc-100 bg-zinc-50 sm:h-48"
                                                                    >
                                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                        <img
                                                                            src={milestone.coverUrl}
                                                                            alt={milestone.title}
                                                                            loading="lazy"
                                                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                                                        />
                                                                        <span className="absolute inset-0 flex items-center justify-center bg-zinc-950/0 transition-colors duration-300 group-hover:bg-zinc-950/25">
                                                                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-zinc-950 opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                                                                                <ExternalLink className="h-3.5 w-3.5" />
                                                                            </span>
                                                                        </span>
                                                                    </a>
                                                                )}
                                                                <div className="space-y-3 p-4">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <StatusPill label={status.label} tone={status.tone} />
                                                                        <span className="rounded-full bg-zinc-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                                                                            {milestone.category}
                                                                        </span>
                                                                        <span className="ml-auto text-[10px] text-zinc-400">
                                                                            {format(new Date(milestone.createdAt), 'd MMM · HH:mm')}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="text-sm font-semibold leading-snug text-zinc-900">
                                                                            {milestone.title}
                                                                        </h5>
                                                                        {milestone.description && (
                                                                            <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-zinc-500">
                                                                                {milestone.description}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                                        <span className="text-[10px] text-zinc-400">
                                                                            {milestone.Creator?.username
                                                                                ? `Posted by ${milestone.Creator.username}`
                                                                                : 'Posted by DFD team'}
                                                                        </span>
                                                                        {!decided && milestone.status !== 'DRAFT' && (
                                                                            <div className="flex gap-2">
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() =>
                                                                                        setDecideModal({
                                                                                            open: true,
                                                                                            milestoneId: milestone.id,
                                                                                            action: 'APPROVE',
                                                                                        })
                                                                                    }
                                                                                    className="h-8 rounded-full bg-zinc-950 px-3.5 text-[11px] font-semibold text-white hover:bg-zinc-800"
                                                                                >
                                                                                    <ThumbsUp className="h-3 w-3" />
                                                                                    Approve
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() =>
                                                                                        setDecideModal({
                                                                                            open: true,
                                                                                            milestoneId: milestone.id,
                                                                                            action: 'REQUEST_REVISION',
                                                                                        })
                                                                                    }
                                                                                    className="h-8 rounded-full border-zinc-200 px-3.5 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50"
                                                                                >
                                                                                    <ThumbsDown className="h-3 w-3" />
                                                                                    Request revision
                                                                                </Button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ol>
                                        )}

                                        {/* Feedback */}
                                        <div className="overflow-hidden rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFeedbackOpen((state) => ({
                                                        ...state,
                                                        [order.id]: !state[order.id],
                                                    }))
                                                }
                                                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                                                aria-expanded={feedbackVisible}
                                            >
                                                <span className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
                                                    <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
                                                    Share feedback on this project
                                                </span>
                                                <ChevronDown
                                                    className={cn(
                                                        'h-3.5 w-3.5 text-zinc-400 transition-transform duration-200',
                                                        feedbackVisible && 'rotate-180'
                                                    )}
                                                />
                                            </button>
                                            {feedbackVisible && (
                                                <div className="space-y-2 border-t border-dashed border-zinc-200 p-4">
                                                    <Textarea
                                                        placeholder="What is going well? What could be better? (min 10 characters)"
                                                        value={feedback[order.id] || ''}
                                                        onChange={(event) =>
                                                            setFeedback((state) => ({
                                                                ...state,
                                                                [order.id]: event.target.value,
                                                            }))
                                                        }
                                                        className="min-h-[96px] rounded-xl border-zinc-200 bg-white text-sm shadow-none focus-visible:ring-zinc-950/20"
                                                    />
                                                    <div className="flex justify-end">
                                                        <Button
                                                            type="button"
                                                            onClick={() => submitFeedback(order.id)}
                                                            className="h-9 rounded-full bg-zinc-950 px-4 text-xs font-semibold text-white hover:bg-zinc-800"
                                                        >
                                                            <Send className="h-3 w-3" />
                                                            Send feedback
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })
                    )}
                </section>

                {/* Sidebar */}
                <aside className="space-y-4 lg:sticky lg:top-24">
                    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-bold tracking-tight">Your requests</h2>
                                <p className="mt-0.5 text-[11px] text-zinc-400">
                                    {requests.length === 0
                                        ? 'Questions and extras go here'
                                        : `${requests.length} total · ${openRequests.length} open`}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setRequestOpen(true)}
                                title="New request"
                                className="h-8 w-8 rounded-full border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-950"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <div className="mt-4 space-y-2.5">
                            {requests.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-6 text-center">
                                    <MessageCircle className="mx-auto h-5 w-5 text-zinc-300" />
                                    <p className="mt-2 text-xs font-semibold text-zinc-600">No requests yet</p>
                                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                                        Ask for access, files, a meeting, or a change.
                                    </p>
                                </div>
                            ) : (
                                requests.map((request) => {
                                    const meta = REQUEST_TYPE[request.type] || REQUEST_TYPE.GENERAL;
                                    const status = REQUEST_STATUS[request.status] || {
                                        label: request.status.toLowerCase(),
                                        tone: 'neutral' as Tone,
                                    };
                                    const Icon = meta.icon;
                                    return (
                                        <div
                                            key={request.id}
                                            className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3.5"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                                                    <Icon className="h-3 w-3" />
                                                    {meta.label}
                                                </span>
                                                <StatusPill label={status.label} tone={status.tone} />
                                            </div>
                                            <p className="mt-2 text-xs font-semibold leading-snug text-zinc-900">
                                                {request.title}
                                            </p>
                                            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-500">
                                                {request.body}
                                            </p>
                                            {request.adminNote && (
                                                <div className="mt-2 rounded-xl border border-zinc-200 bg-white px-2.5 py-2">
                                                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                                                        Team note
                                                    </p>
                                                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
                                                        {request.adminNote}
                                                    </p>
                                                </div>
                                            )}
                                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                                {request.driveUrl && (
                                                    <a
                                                        href={request.driveUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-600 underline-offset-2 hover:underline"
                                                    >
                                                        <FolderOpen className="h-3 w-3" />
                                                        Drive
                                                    </a>
                                                )}
                                                {request.calendlyEventUrl && (
                                                    <a
                                                        href={request.calendlyEventUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-600 underline-offset-2 hover:underline"
                                                    >
                                                        <CalendarDays className="h-3 w-3" />
                                                        Meeting
                                                    </a>
                                                )}
                                                <span className="ml-auto text-[10px] text-zinc-400">
                                                    {format(new Date(request.createdAt), 'd MMM')}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    <section className="relative overflow-hidden rounded-3xl bg-zinc-950 p-5 text-white shadow-[0_18px_50px_-30px_rgba(9,9,11,0.8)]">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/5 blur-2xl"
                        />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                            Direct line
                        </p>
                        <h3 className="mt-2 text-lg font-bold tracking-tight">Need a hand?</h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                            Questions about scope, invoices, or your timeline? Message the team directly.
                        </p>
                        <a
                            href={WHATSAPP}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-zinc-950 transition-transform duration-200 hover:-translate-y-0.5"
                        >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Chat on WhatsApp
                            <ArrowUpRight className="h-3 w-3" />
                        </a>
                    </section>
                </aside>
            </div>

            {/* New request dialog */}
            <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
                <DialogContent className="overflow-hidden rounded-3xl border-zinc-200 p-0 shadow-2xl shadow-zinc-950/10 sm:max-w-lg">
                    <DialogHeader className="border-b border-zinc-100 px-6 py-5 text-left">
                        <DialogTitle className="text-lg font-bold tracking-tight">New request</DialogTitle>
                        <p className="mt-1 text-xs text-zinc-500">
                            Ask for access, files, a meeting, or a change. The team replies in your portal.
                        </p>
                    </DialogHeader>
                    <div className="space-y-4 px-6 py-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="request-type" className="text-xs font-semibold text-zinc-600">
                                    Request type
                                </Label>
                                <Select
                                    value={requestForm.type}
                                    onValueChange={(value) => setRequestForm((state) => ({ ...state, type: value }))}
                                >
                                    <SelectTrigger
                                        id="request-type"
                                        className="h-10 rounded-xl border-zinc-200 bg-white text-sm shadow-none focus:ring-zinc-950/20"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-zinc-200">
                                        {REQUEST_TYPES.map((type) => (
                                            <SelectItem key={type} value={type} className="text-sm">
                                                {REQUEST_TYPE[type].label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="request-order" className="text-xs font-semibold text-zinc-600">
                                    Link a project <span className="font-normal text-zinc-400">(optional)</span>
                                </Label>
                                <Select
                                    value={requestForm.orderId || 'none'}
                                    onValueChange={(value) =>
                                        setRequestForm((state) => ({
                                            ...state,
                                            orderId: value === 'none' ? '' : value,
                                        }))
                                    }
                                >
                                    <SelectTrigger
                                        id="request-order"
                                        className="h-10 rounded-xl border-zinc-200 bg-white text-sm shadow-none focus:ring-zinc-950/20"
                                    >
                                        <SelectValue placeholder="No project" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-zinc-200">
                                        <SelectItem value="none" className="text-sm">
                                            No project
                                        </SelectItem>
                                        {orders.map((order) => (
                                            <SelectItem key={order.id} value={order.id} className="text-sm">
                                                {order.Package?.name || order.packageName || `#${order.id.slice(-8)}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="request-title" className="text-xs font-semibold text-zinc-600">
                                Title
                            </Label>
                            <Input
                                id="request-title"
                                placeholder="e.g. Add a contact form to the homepage"
                                value={requestForm.title}
                                onChange={(event) =>
                                    setRequestForm((state) => ({ ...state, title: event.target.value }))
                                }
                                className="h-10 rounded-xl border-zinc-200 bg-white text-sm shadow-none focus-visible:ring-zinc-950/20"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="request-body" className="text-xs font-semibold text-zinc-600">
                                Details
                            </Label>
                            <Textarea
                                id="request-body"
                                placeholder="Share the context, links, and anything the team should know."
                                value={requestForm.body}
                                onChange={(event) =>
                                    setRequestForm((state) => ({ ...state, body: event.target.value }))
                                }
                                className="min-h-[110px] rounded-xl border-zinc-200 bg-white text-sm shadow-none focus-visible:ring-zinc-950/20"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/60 px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRequestOpen(false)}
                            className="h-9 rounded-full border-zinc-200 bg-white px-4 text-xs font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={submitRequest}
                            disabled={sendingRequest}
                            className="h-9 rounded-full bg-zinc-950 px-4 text-xs font-semibold text-white hover:bg-zinc-800"
                        >
                            {sendingRequest ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Send className="h-3.5 w-3.5" />
                            )}
                            Send request
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Decision dialog */}
            <Dialog
                open={decideModal.open}
                onOpenChange={(open) => setDecideModal((state) => ({ ...state, open }))}
            >
                <DialogContent className="overflow-hidden rounded-3xl border-zinc-200 p-0 shadow-2xl shadow-zinc-950/10 sm:max-w-md">
                    <DialogHeader className="border-b border-zinc-100 px-6 py-5 text-left">
                        <span
                            className={cn(
                                'mb-3 grid h-10 w-10 place-items-center rounded-full',
                                decideModal.action === 'APPROVE'
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-amber-50 text-amber-600'
                            )}
                        >
                            {decideModal.action === 'APPROVE' ? (
                                <ThumbsUp className="h-4 w-4" />
                            ) : (
                                <ThumbsDown className="h-4 w-4" />
                            )}
                        </span>
                        <DialogTitle className="text-lg font-bold tracking-tight">
                            {decideModal.action === 'APPROVE' ? 'Approve deliverable' : 'Request a revision'}
                        </DialogTitle>
                        {decideMilestone && (
                            <p className="mt-1 text-xs text-zinc-500">
                                {decideMilestone.title}
                                {decideMilestone.category ? ` · ${decideMilestone.category}` : ''}
                            </p>
                        )}
                    </DialogHeader>
                    <div className="px-6 py-5">
                        <Label htmlFor="decide-note" className="text-xs font-semibold text-zinc-600">
                            {decideModal.action === 'APPROVE' ? 'Anything you loved? (optional)' : 'What needs to change?'}
                        </Label>
                        <Textarea
                            id="decide-note"
                            placeholder={
                                decideModal.action === 'APPROVE'
                                    ? 'Share a quick note with the team…'
                                    : 'Describe the changes so the team can get it right…'
                            }
                            value={decideNote}
                            onChange={(event) => setDecideNote(event.target.value)}
                            className="mt-1.5 min-h-[100px] rounded-xl border-zinc-200 bg-white text-sm shadow-none focus-visible:ring-zinc-950/20"
                        />
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/60 px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setDecideModal({ open: false, milestoneId: null, action: 'APPROVE' })
                            }
                            className="h-9 rounded-full border-zinc-200 bg-white px-4 text-xs font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={submitDecide}
                            disabled={loadingDecide}
                            className={cn(
                                'h-9 rounded-full px-4 text-xs font-semibold text-white',
                                decideModal.action === 'APPROVE'
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-zinc-950 hover:bg-zinc-800'
                            )}
                        >
                            {loadingDecide && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {decideModal.action === 'APPROVE' ? 'Approve' : 'Send revision'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
