'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, FileText, KeySquare, Users, TrendingUp, Filter, Server } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
    summary: {
        totalLeads: number;
        activeProjects: number;
        totalOrders: number;
        totalArticles: number;
    };
    charts: {
        leadFunnel: { name: string; value: number; fill: string }[];
        monthlyVolume: { month: string; orders: number }[];
        hostingPipeline: { status: string; count: number }[];
    };
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const res = await api.get('/dashboard');
                if (res.data.success) {
                    setData(res.data.data);
                }
            } catch (err) {
                toast.error('Failed to load dashboard analytics');
            } finally {
                setLoading(false);
            }
        }

        fetchAnalytics();
    }, []);

    if (loading) {
        return <div className="p-12 text-center font-black uppercase tracking-widest text-muted-foreground">INITIALIZING INTELLIGENCE HUB...</div>;
    }

    if (!data) return null;

    const summaryCards = [
        { label: 'Total Leads', value: data.summary.totalLeads, icon: Users },
        { label: 'Active Projects', value: data.summary.activeProjects, icon: KeySquare },
        { label: 'Total Orders', value: data.summary.totalOrders, icon: Briefcase },
        { label: 'Published Articles', value: data.summary.totalArticles, icon: FileText },
    ];

    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280']; // For Hosting Pie

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-8 h-8" /> COMMAND CENTER
                </h1>
                <p className="text-muted-foreground font-medium">Advanced operations analytics and agency growth tracking.</p>
            </div>

            {/* Top Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {summaryCards.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={i}
                            className="bg-background border-2 border-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex flex-col justify-between"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{stat.label}</h3>
                                <Icon className="w-5 h-5 text-foreground" />
                            </div>
                            <div className="text-4xl font-black">{stat.value}</div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row 1 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-4">

                {/* Monthly Revenue / Volume */}
                <Card className="lg:col-span-2 rounded-none border-2 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <CardHeader className="border-b-2 border-foreground bg-muted/20">
                        <CardTitle className="font-black uppercase tracking-tight">Order Volume Pipeline</CardTitle>
                        <CardDescription className="font-bold text-xs uppercase text-muted-foreground">Last 6 Months Trajectory</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.charts.monthlyVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#000000" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                                    <RechartsTooltip
                                        contentStyle={{ border: '2px solid #000', borderRadius: 0, boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)', fontWeight: 900 }}
                                        itemStyle={{ color: '#000' }}
                                    />
                                    <Area type="monotone" dataKey="orders" stroke="#000" strokeWidth={4} fillOpacity={1} fill="url(#colorOrders)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Lead Funnel */}
                <Card className="rounded-none border-2 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <CardHeader className="border-b-2 border-foreground bg-muted/20">
                        <CardTitle className="font-black uppercase tracking-tight flex items-center gap-2"><Filter className="w-5 h-5" /> Lead Funnel</CardTitle>
                        <CardDescription className="font-bold text-xs uppercase text-muted-foreground">Conversion Breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[350px] w-full flex items-center justify-center">
                            {data.summary.totalLeads === 0 ? (
                                <p className="text-muted-foreground font-bold tracking-widest uppercase">No Leads Yet</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.charts.leadFunnel} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900 }} width={80} />
                                        <RechartsTooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ border: '2px solid #000', borderRadius: 0, boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)', fontWeight: 900 }}
                                        />
                                        <Bar dataKey="value" fill="#000" barSize={30} radius={[0, 4, 4, 0]}>
                                            {data.charts.leadFunnel.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Charts Row 2 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-2">

                {/* Hosting Pipeline */}
                <Card className="rounded-none border-2 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <CardHeader className="border-b-2 border-foreground bg-muted/20">
                        <CardTitle className="font-black uppercase tracking-tight flex items-center gap-2"><Server className="w-5 h-5" /> Hosting Status</CardTitle>
                        <CardDescription className="font-bold text-xs uppercase text-muted-foreground">Active vs Expiring Monitors</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 pb-2">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.charts.hostingPipeline.filter(s => s.count > 0)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="count"
                                        stroke="none"
                                    >
                                        {data.charts.hostingPipeline.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ border: '2px solid #000', borderRadius: 0, boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)', fontWeight: 900 }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 800 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
