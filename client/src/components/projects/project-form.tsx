'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProjectInput, ProjectSchema } from '@/lib/validations';
import api from '@/lib/axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { toast } from 'sonner';
import { ImageUploader } from './image-uploader';
import { AIWriterModal } from '@/components/ai-writer-modal';

export function ProjectForm({
    initialData,
    onSuccess
}: {
    initialData?: ProjectInput & { id?: number };
    onSuccess: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ProjectInput>({
        resolver: zodResolver(ProjectSchema),
        defaultValues: initialData || {
            title: '',
            slug: '',
            category: '',
            description: '',
            content: '',
            clientName: '',
            link: '',
            imageUrl: '',
            technologies: [''], // One default tech field
        },
    });

    const technologiesCount = form.watch('technologies').length;

    async function onSubmit(data: ProjectInput) {
        setIsLoading(true);
        const payload = {
            ...data,
            technologies: data.technologies.filter(t => t.trim() !== ''),
            // Ensure nullification for optional empty strings to Prisma bounds
            link: data.link || null,
            content: data.content || null,
            clientName: data.clientName || null
        };

        try {
            if (initialData?.id) {
                await api.put(`/projects/${initialData.id}`, payload);
                toast.success('Project Details Updated');
            } else {
                await api.post('/projects', payload);
                toast.success('New Project Added to Portfolio');
            }
            onSuccess();
        } catch (error: any) {
            toast.error(initialData?.id ? 'Update Failed' : 'Creation Failed', {
                description: error.response?.data?.message || error.message
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <AIWriterModal
                    type="Project"
                    onSuccess={(data) => {
                        if (data.title) form.setValue('title', data.title);
                        if (data.description) form.setValue('description', data.description);
                        if (data.content) form.setValue('content', data.content);
                        // Infer slug from title if missing
                        if (data.title && !form.getValues('slug')) {
                            form.setValue('slug', data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                        }
                    }}
                />

                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase tracking-wider text-xs">Cover Image (Cloudinary)</FormLabel>
                            <FormControl>
                                <ImageUploader
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold uppercase tracking-wider text-xs">Project Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="E.g. FinTech App" className="rounded-none border-foreground focus-visible:ring-foreground" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold uppercase tracking-wider text-xs">URL Slug</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. fintech-app" className="rounded-none border-foreground focus-visible:ring-foreground" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold uppercase tracking-wider text-xs">Category</FormLabel>
                                <FormControl>
                                    <Input placeholder="Mobile App, Website, Branding" className="rounded-none border-foreground focus-visible:ring-foreground" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold uppercase tracking-wider text-xs">Client Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Optional" className="rounded-none border-foreground focus-visible:ring-foreground" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase tracking-wider text-xs">Short Headline / Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="The main hook or subheadline..." className="rounded-none border-foreground focus-visible:ring-foreground resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase tracking-wider text-xs">Detailed Case Study (Markdown)</FormLabel>
                            <FormControl>
                                <Textarea rows={6} placeholder="Full case study or context for the project..." className="rounded-none border-foreground focus-visible:ring-foreground font-mono text-xs" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-2">
                    <label className="font-bold uppercase tracking-wider text-xs">Tech Stack</label>
                    <p className="text-xs text-muted-foreground">Technologies used (e.g. Next.js, Node.js, Prisma)</p>

                    <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: Math.max(1, technologiesCount) }).map((_, index) => (
                            <FormField
                                key={index}
                                control={form.control}
                                name={`technologies.${index}`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder={`Tech ${index + 1}`} className="rounded-none border-foreground focus-visible:ring-foreground text-xs" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        ))}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            const current = form.getValues('technologies');
                            form.setValue('technologies', [...current, '']);
                        }}
                        className="w-full mt-2 rounded-none border-2 border-dashed border-foreground/30 hover:border-foreground transition-none font-bold uppercase text-xs"
                    >
                        + Add Technology
                    </Button>
                </div>

                <FormField
                    control={form.control}
                    name="link"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase tracking-wider text-xs">External Link (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="https://..." type="url" className="rounded-none border-foreground focus-visible:ring-foreground" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="w-full py-6 rounded-none font-black tracking-widest uppercase transition-all hover:bg-white hover:text-black border-2 border-transparent hover:border-black active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] bg-black"
                    disabled={isLoading}
                >
                    {isLoading ? 'SYNCING DATA...' : (initialData?.id ? 'UPDATE PROJECT' : 'PUBLISH PROJECT')}
                </Button>
            </form>
        </Form>
    );
}
