'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

interface AIResult {
    title?: string;
    description?: string;
    content?: string;
}

interface AIWriterModalProps {
    type: 'Project' | 'Package' | 'Article';
    onSuccess: (data: AIResult) => void;
}

export function AIWriterModal({ type, onSuccess }: AIWriterModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [context, setContext] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!context.trim()) {
            toast.error('Please provide some context first.');
            return;
        }

        setIsGenerating(true);
        try {
            const res = await api.post('/ai/generate-copy', {
                type,
                context
            });

            if (res.data.success && res.data.data) {
                onSuccess(res.data.data);
                toast.success('AI Content Generated Successfully');
                setIsOpen(false);
                setContext('');
            } else {
                toast.error('Failed to parse AI response');
            }
        } catch (error) {
            toast.error('AI Generation Failed', {
                description: (error as {response?: {data?: {message?: string}}}).response?.data?.message || (error as Error).message
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full mb-4 rounded-none font-black tracking-widest uppercase border-2 border-foreground hover:bg-foreground hover:text-background transition-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                >
                    <Sparkles className="mr-2 h-4 w-4" /> Generate with Gemini 3.1 Pro
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-none border-2 border-foreground bg-background p-0">
                <div className="p-6 border-b-2 border-foreground bg-muted/30">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                            <Sparkles className="h-6 w-6" /> AI Copywriter
                        </DialogTitle>
                        <DialogDescription className="font-medium text-foreground/70">
                            Provide brief context about this {type}. The AI will instantly craft the Title, Description, and detailed Content for you.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider">Project Context & Details</label>
                        <Textarea
                            placeholder="e.g. A high-conversion landing page for a boutique coffee shop in Jakarta..."
                            className="min-h-[120px] rounded-none border-2 border-foreground focus-visible:ring-0 focus-visible:bg-muted/10"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                        />
                    </div>
                    <Button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full rounded-none font-bold tracking-widest uppercase transition-all hover:bg-white hover:text-black border-2 border-foreground hover:border-black active:translate-y-1 bg-black text-white"
                    >
                        {isGenerating ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> WRITING COPY...</>
                        ) : (
                            'EXECUTE COMMAND'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
