'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, X } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

interface ImageUploaderProps {
    value?: string;
    onChange: (url: string) => void;
    onError?: (error: string) => void;
}

export function ImageUploader({ value, onChange, onError }: ImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            toast.error('Invalid file type. Only images are allowed.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('Image is too large. Max size is 5MB.');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (res.data.success) {
                toast.success('Image Uploaded to Cloudinary');
                onChange(res.data.data.url);
            }
        } catch (error) {
            const msg = (error as {response?: {data?: {message?: string}}}).response?.data?.message || (error as Error).message;
            toast.error('Upload failed', { description: msg });
            if (onError) onError(msg);
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {value ? (
                <div className="relative border-2 border-foreground bg-muted/20 p-2 group w-full h-48 flex items-center justify-center overflow-hidden">
                    <img src={value} alt="Uploaded preview" className="object-cover max-h-full max-w-full" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="rounded-none font-bold uppercase"
                            onClick={() => onChange('')}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-foreground/30 hover:border-foreground bg-muted/10 transition-colors h-48">
                    {isUploading ? (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin text-foreground mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest text-foreground/70">Uploading...</p>
                        </>
                    ) : (
                        <>
                            <UploadCloud className="h-8 w-8 text-foreground/50 mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest text-foreground/70 mb-2">Click or Drop Image</p>
                            <p className="text-xs text-muted-foreground font-mono">JPG, PNG, WEBP (Max 5MB)</p>
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
