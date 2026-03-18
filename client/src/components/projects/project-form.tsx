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
import { Sparkles, Loader2 } from 'lucide-react';

export function ProjectForm({
    initialData,
    onSuccess
}: {
    initialData?: ProjectInput & { id?: number };
    onSuccess: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const form = useForm<ProjectInput>({
        resolver: zodResolver(ProjectSchema) as any,
        mode: 'onTouched',
        defaultValues: initialData || {
            title: '',
            slug: '',
            clientName: '',
            category: 'SERVICES' as never,
            thumbnailUrl: '',
            description: '',
            techStack: [''],
            duration: '',
            maintenanceStatus: 'CLIENT_MANAGED',
            isFeatured: false,
        },
    });

    const handleAiGenerate = async () => {
        const title = form.getValues('title');
        if (!title || title.length < 3) {
            toast.error('Masukan nama project minimal 3 karakter untuk konteks AI.');
            return;
        }

        try {
            setIsAiLoading(true);
            const res = await api.post('/ai/generate-copy', {
                type: 'Portfolio Project',
                context: title
            });

            if (res.data.success) {
                const { title: aiTitle, description } = res.data.data;
                if (aiTitle) form.setValue('title', aiTitle);
                if (description) form.setValue('description', description);
                toast.success('Magic Copy applied! ✨');
            }
        } catch (error: any) {
            toast.error('AI Generation failed', { description: error.response?.data?.message || 'Check your Gemini API Key' });
        } finally {
            setIsAiLoading(false);
        }
    };

    const technologiesCount = (form.watch('techStack') || []).length;

    async function onSubmit(data: ProjectInput) {
        setIsLoading(true);
        const payload = {
            ...data,
            techStack: data.techStack.filter(t => t.trim() !== ''),
            thumbnailUrl: data.thumbnailUrl || null,
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
        } catch (error) {
            toast.error(initialData?.id ? 'Update Failed' : 'Creation Failed', {
                description: (error as { response?: { data?: { message?: string } } }).response?.data?.message || (error as Error).message
            });
        } finally {
            setIsLoading(false);
        }
    }

    const onInvalid = (errors: any) => {
        console.error('Form Validation Errors:', errors);
        const firstError = Object.values(errors)[0] as any;
        if (firstError) {
            toast.error('Validation Error', { 
                description: firstError.message || 'Please check all required fields.' 
            });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any, onInvalid)} className="space-y-6">

                <FormField control={form.control as any}
                    name="thumbnailUrl"
                    render={({ field }) => (
                        <FormItem>
                            <label className="font-bold uppercase tracking-wider text-xs">Cover Image (Cloudinary)</label>
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

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control as any}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel className="font-bold uppercase tracking-wider text-xs">Project Title</FormLabel>
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
                                        Magic Copy
                                    </Button>
                                </div>
                                <FormControl>
                                    <Input placeholder="E.g. FinTech App" className="rounded-none border-foreground focus-visible:ring-foreground" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField control={form.control as any}
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
                    <FormField control={form.control as any}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <label className="font-bold uppercase tracking-wider text-xs">Category</label>
                                <FormControl>
                                    <select
                                        {...field}
                                        className="w-full h-10 px-3 py-2 rounded-none border border-foreground bg-background focus-visible:outline-none text-sm"
                                    >
                                        <option value="PLATFORM">Platform</option>
                                        <option value="E_COMMERCE">E-Commerce</option>
                                        <option value="LANDING">Landing Page</option>
                                        <option value="SAAS">SaaS</option>
                                        <option value="CUSTOM">Custom Solution</option>
                                        <option value="SERVICES">Services (Legacy)</option>
                                    </select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField control={form.control as any}
                        name="clientName"
                        render={({ field }) => (
                            <FormItem>
                                <label className="font-bold uppercase tracking-wider text-xs">Client Name</label>
                                <FormControl>
                                    <Input placeholder="Client Name" className="rounded-none border-foreground focus-visible:ring-foreground" {...field} value={field.value || ''} />
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
                            <FormLabel className="font-bold uppercase tracking-wider text-xs">Short Headline / Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="The main hook or subheadline..." className="rounded-none border-foreground focus-visible:ring-foreground resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control as any}
                        name="duration"
                        render={({ field }) => (
                            <FormItem>
                                <label className="font-bold uppercase tracking-wider text-xs">Project Duration</label>
                                <FormControl>
                                    <Input placeholder="e.g. 3 Days" className="rounded-none border-foreground focus-visible:ring-foreground" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField control={form.control as any}
                        name="isFeatured"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between border border-foreground p-3">
                                <div className="space-y-0.5">
                                    <label className="font-bold uppercase tracking-wider text-xs">Featured Project</label>
                                    <p className="text-[10px] text-muted-foreground uppercase">Show on home page</p>
                                </div>
                                <FormControl>
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="h-4 w-4 rounded-none border-foreground"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4 border-2 border-zinc-100 p-4 bg-zinc-50/50">
                    <label className="font-bold uppercase tracking-widest text-[10px] text-zinc-400">Social Proof / Testimonial</label>
                    
                    <FormField control={form.control as any}
                        name="testimonialQuote"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold uppercase tracking-wider text-xs">Testimonial Quote</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="What did the client say about this project?" className="rounded-none border-foreground focus-visible:ring-foreground resize-none min-h-[100px]" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField control={form.control as any}
                        name="testimonialAuthor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold uppercase tracking-wider text-xs">Testimonial Author Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. CEO of Nexus" className="rounded-none border-foreground focus-visible:ring-foreground" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-2">
                    <label className="font-bold uppercase tracking-wider text-xs">Tech Stack</label>
                    <p className="text-[10px] text-muted-foreground uppercase">Technologies used (e.g. Next.js, Node.js, Prisma)</p>

                    <div className="grid grid-cols-2 gap-2">
                        {form.watch('techStack').map((_, index) => (
                            <FormField
                                key={index}
                                control={form.control as any}
                                name={`techStack.${index}`}
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
                            const current = form.getValues('techStack');
                            form.setValue('techStack', [...current, '']);
                        }}
                        className="w-full mt-2 rounded-none border-2 border-dashed border-foreground/30 hover:border-foreground transition-none font-bold uppercase text-xs h-10"
                    >
                        + Add Technology
                    </Button>
                </div>

                {/* External link field removed — not in ProjectSchema */}

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
