'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArticleInput, ArticleSchema } from '@/lib/validations';
import api from '@/lib/axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/projects/image-uploader';
import { Sparkles, Loader2 } from 'lucide-react';

export function ArticleForm({
    initialData,
    onSuccess
}: {
    initialData?: ArticleInput & { id?: number };
    onSuccess: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const form = useForm<ArticleInput>({
        resolver: zodResolver(ArticleSchema) as any,
        mode: 'onTouched',
        defaultValues: initialData || {
            title: '',
            slug: '',
            content: '',
            description: '',
            imageUrl: '',
            authorName: '',
            isPublished: false,
        },
    });

    const handleAiGenerate = async () => {
        const title = form.getValues('title');
        if (!title || title.length < 3) {
            toast.error('Masukan judul artikel minimal 3 karakter untuk konteks AI.');
            return;
        }

        try {
            setIsAiLoading(true);
            const res = await api.post('/ai/generate-copy', {
                type: 'Blog Article',
                context: title
            });

            if (res.data.success) {
                const { title: aiTitle, description, content } = res.data.data;
                if (aiTitle) form.setValue('title', aiTitle);
                if (description) form.setValue('description', description);
                if (content) form.setValue('content', content);
                toast.success('Magic Content generated! ✨');
            }
        } catch (error: any) {
            toast.error('AI Generation failed', { description: error.response?.data?.message || 'Check your Gemini API Key' });
        } finally {
            setIsAiLoading(false);
        }
    };

    async function onSubmit(data: ArticleInput) {
        setIsLoading(true);
        const payload = {
            ...data,
            imageUrl: data.imageUrl || null,
            description: data.description || null,
            authorName: data.authorName || null
        };

        try {
            if (initialData?.id) {
                await api.put(`/articles/${initialData.id}`, payload);
                toast.success('Article Updated');
            } else {
                await api.post('/articles', payload);
                toast.success('Article Published');
            }
            onSuccess();
        } catch (error) {
            toast.error(initialData?.id ? 'Update Failed' : 'Creation Failed', {
                description: (error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Check your inputs'
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">

                <FormField control={form.control as any}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase tracking-wider text-xs">Article Cover (Optional)</FormLabel>
                            <FormControl>
                                <ImageUploader
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField control={form.control as any}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel className="font-bold uppercase tracking-wider text-xs">Article Title</FormLabel>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleAiGenerate}
                                    disabled={isAiLoading}
                                    className="h-6 px-2 text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-none border border-blue-600/20"
                                >
                                    {isAiLoading ? (
                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                        <Sparkles className="mr-1 h-3 w-3" />
                                    )}
                                    Magic Content
                                </Button>
                            </div>
                            <FormControl>
                                <Input placeholder="Attention-grabbing headline..." className="rounded-none border-foreground focus-visible:ring-foreground" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control as any}
                        name="slug"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold uppercase tracking-wider text-xs">URL Slug</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. how-to-build-app" className="rounded-none border-foreground focus-visible:ring-foreground" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField control={form.control as any}
                        name="authorName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold uppercase tracking-wider text-xs">Author Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Anonymous if empty" className="rounded-none border-foreground focus-visible:ring-foreground" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField control={form.control as any}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase tracking-wider text-xs">SEO Meta Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Short excerpt for search engines..." className="rounded-none border-foreground focus-visible:ring-foreground resize-none" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField control={form.control as any}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase tracking-wider text-xs">Article Body (Markdown)</FormLabel>
                            <FormControl>
                                <Textarea rows={12} placeholder="# Heading\nWrite your content here..." className="rounded-none border-foreground focus-visible:ring-foreground font-mono text-sm leading-relaxed" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField control={form.control as any}
                    name="isPublished"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-none border-2 border-foreground bg-muted/20 p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-sm font-bold uppercase tracking-wider">
                                    Publish Immediately
                                </FormLabel>
                                <div className="text-xs text-muted-foreground font-medium">
                                    Turn off to save as a draft instead.
                                </div>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="data-[state=checked]:bg-foreground border-2 border-foreground"
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="w-full py-6 rounded-none font-black tracking-widest uppercase transition-all hover:bg-white hover:text-black border-2 border-transparent hover:border-black active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] bg-black"
                    disabled={isLoading}
                >
                    {isLoading ? 'SAVING...' : (initialData?.id ? 'UPDATE ARTICLE' : 'SAVE ARTICLE')}
                </Button>
            </form>
        </Form>
    );
}
