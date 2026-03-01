'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ArticleForm } from '@/components/articles/article-form';

export default function ArticlesPage() {
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<any | undefined>(undefined);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const res = await api.get('/articles?limit=50');
            if (res.data.success) {
                setArticles(res.data.data);
            }
        } catch (error: any) {
            toast.error('Failed to load articles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you absolutely sure you want to delete this article?')) return;

        try {
            const res = await api.delete(`/articles/${id}`);
            if (res.data.success) {
                toast.success('Article deleted safely.');
                fetchArticles();
            } else {
                toast.error('Delete failed', { description: res.data.message });
            }
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unknown error';
            toast.error('Delete failed', { description: message });
        }
    };

    const handleFormSuccess = () => {
        setIsSheetOpen(false);
        fetchArticles();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Content Engine</h1>
                    <p className="text-muted-foreground font-medium">Manage SEO articles, news, and technical publications.</p>
                </div>
                <Button
                    onClick={() => { setSelectedArticle(undefined); setIsSheetOpen(true); }}
                    className="rounded-none font-bold uppercase tracking-widest border-2 border-transparent hover:border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all"
                >
                    <Plus className="mr-2 h-4 w-4" /> New Article
                </Button>
            </div>

            <div className="border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <Table>
                    <TableHeader className="bg-muted/30 border-b-2 border-foreground">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-bold text-black uppercase tracking-wider w-16">Cover</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Title & Slug</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Author</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider">Published</TableHead>
                            <TableHead className="font-bold text-black uppercase tracking-wider text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 font-bold text-muted-foreground">FETCHING ARTICLES...</TableCell>
                            </TableRow>
                        ) : articles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 font-bold text-muted-foreground">NO ARTICLES PUBLISHED</TableCell>
                            </TableRow>
                        ) : (
                            articles.map((item) => (
                                <TableRow key={item.id} className="border-b-2 border-foreground/10 hover:bg-muted/30 transition-none">
                                    <TableCell>
                                        <div className="w-12 h-12 bg-muted/50 border-2 border-foreground overflow-hidden flex items-center justify-center">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-bold">N/A</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold truncate max-w-sm">{item.title}</div>
                                        <div className="text-xs text-muted-foreground">{item.slug}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase border-2 border-foreground bg-muted/10">
                                            {item.authorName || 'Agency Editor'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {item.isPublished
                                            ? new Date(item.publishedAt).toLocaleDateString()
                                            : <span className="text-red-600 font-bold uppercase border border-red-600 px-1">DRAFT</span>
                                        }
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="icon" onClick={() => { setSelectedArticle(item); setIsSheetOpen(true); }} className="rounded-none border-2 border-foreground hover:bg-foreground hover:text-background transition-none h-8 w-8">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" onClick={() => handleDelete(item.id)} className="rounded-none border-2 border-foreground hover:bg-red-600 hover:text-white transition-none h-8 w-8">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] md:w-[700px] border-l-2 border-foreground p-0 overflow-y-auto bg-background">
                    <div className="p-6 border-b-2 border-foreground bg-muted/30">
                        <SheetTitle className="text-2xl font-black uppercase tracking-tight">
                            {selectedArticle ? 'Edit Article' : 'Draft New Article'}
                        </SheetTitle>
                    </div>
                    <div className="p-6">
                        {isSheetOpen && (
                            <ArticleForm
                                initialData={selectedArticle}
                                onSuccess={handleFormSuccess}
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
