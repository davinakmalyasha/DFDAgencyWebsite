"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function TrackOrderDialog({ children }: { children: React.ReactNode }) {
    const [orderId, setOrderId] = useState("");
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim()) return;

        setOpen(false);
        router.push(`/track/${orderId.trim()}`);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-zinc-200 shadow-xl bg-white/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="font-extrabold tracking-tight">Track Your Project</DialogTitle>
                    <DialogDescription>
                        Enter your secure Order ID (Magic Link code) below to view your project's live progress.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleTrack} className="flex items-center space-x-2 mt-4">
                    <Input
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        placeholder="e.g. 14e9276f-f606..."
                        className="flex-1 border-zinc-200 focus-visible:ring-zinc-500"
                        autoFocus
                    />
                    <Button type="submit" size="icon" className="bg-zinc-950 hover:bg-zinc-800 text-white transition-all shrink-0">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
