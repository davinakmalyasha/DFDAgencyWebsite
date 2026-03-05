'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PackageInput, PackageSchema } from '@/lib/validations';
import api from '@/lib/axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { toast } from 'sonner';

export function PackageForm({
    initialData,
    onSuccess
}: {
    initialData?: PackageInput & { id?: number };
    onSuccess: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<PackageInput>({
        resolver: zodResolver(PackageSchema),
        defaultValues: initialData || {
            name: '',
            slug: '',
            price: 0,
            originalPrice: undefined,
            description: '',
            features: [''], // Start with one empty feature
            isPopular: false,
            isActive: true,
        },
    });

    const featuresCount = form.watch('features').length;

    async function onSubmit(data: PackageInput) {
        setIsLoading(true);
        // Clean up empty features
        const pData = {
            ...data,
            features: data.features.filter(f => f.trim() !== '')
        };

        try {
            if (initialData?.id) {
                await api.put(`/packages/${initialData.id}`, pData);
                toast.success('Package Updated Successfully');
            } else {
                await api.post('/packages', pData);
                toast.success('Package Created Successfully');
            }
            onSuccess();
        } catch (error) {
            toast.error(initialData?.id ? 'Update Failed' : 'Creation Failed', {
                description: (error as {response?: {data?: {message?: string}}}).response?.data?.message || (error as Error).message
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-bold uppercase tracking-wider text-xs">Package Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Starter Pack" className="rounded-none border-foreground focus-visible:ring-foreground" {...field} />
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
                                <Input placeholder="e.g. starter-pack" className="rounded-none border-foreground focus-visible:ring-foreground" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold uppercase tracking-wider text-xs">Current Price (IDR)</FormLabel>
                                <FormControl>
                                    <Input type="number" className="rounded-none border-foreground focus-visible:ring-foreground" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="originalPrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold uppercase tracking-wider text-xs">Original Price (IDR)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Optional" className="rounded-none border-foreground focus-visible:ring-foreground" {...field} value={field.value || ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
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
                            <FormLabel className="font-bold uppercase tracking-wider text-xs">Description</FormLabel>
                            <FormControl>
                                <Input placeholder="Brief description visible on cards" className="rounded-none border-foreground focus-visible:ring-foreground" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-2">
                    <label className="font-bold uppercase tracking-wider text-xs">Features List</label>
                    <p className="text-xs text-muted-foreground">Enter one feature per box</p>

                    {Array.from({ length: featuresCount }).map((_, index) => (
                        <FormField
                            key={index}
                            control={form.control}
                            name={`features.${index}`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder={`Feature ${index + 1}`} className="rounded-none border-foreground focus-visible:ring-foreground" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            const current = form.getValues('features');
                            form.setValue('features', [...current, '']);
                        }}
                        className="w-full rounded-none border-2 border-dashed border-foreground/30 hover:border-foreground transition-none font-bold uppercase text-xs"
                    >
                        + Add Feature
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-foreground/10">
                    <FormField
                        control={form.control}
                        name="isPopular"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border-2 border-foreground bg-muted/20">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="rounded-none border-foreground data-[state=checked]:bg-foreground"
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="font-bold uppercase tracking-wider text-xs cursor-pointer">
                                        Highlight as Popular
                                    </FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border-2 border-foreground bg-muted/20">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="rounded-none border-foreground data-[state=checked]:bg-foreground"
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="font-bold uppercase tracking-wider text-xs cursor-pointer">
                                        Is Active
                                    </FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full rounded-none font-bold tracking-widest uppercase transition-all hover:bg-white hover:text-black border-2 border-transparent hover:border-black active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
                    disabled={isLoading}
                >
                    {isLoading ? 'Processing...' : (initialData?.id ? 'Update Package' : 'Create Package')}
                </Button>
            </form>
        </Form>
    );
}
