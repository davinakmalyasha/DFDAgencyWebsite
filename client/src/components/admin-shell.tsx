'use client';

import { usePathname } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function AdminShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/admin/login';

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen">
            {/* Desktop Sidebar */}
            <AppSidebar />
            
            {/* Mobile Sidebar - Accessible via Header Toggle */}
            <main className="flex-1 lg:ml-64 min-w-0 bg-muted/10 min-h-screen flex flex-col">
                <div className="flex h-16 shrink-0 items-center px-4 lg:px-6 border-b-2 border-foreground bg-background">
                    {/* Hamburger for Mobile */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="rounded-none border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-64 border-r-2 border-foreground">
                                <AppSidebar className="!flex w-full !relative" />
                            </SheetContent>
                        </Sheet>
                    </div>

                    <div className="ml-auto font-mono text-[10px] lg:text-xs uppercase font-bold tracking-widest text-foreground/50">
                        Secure Connection Established
                    </div>
                </div>
                <div className="p-4 lg:p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
