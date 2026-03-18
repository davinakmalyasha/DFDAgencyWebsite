import { AdminShell } from "@/components/admin-shell";
import { Toaster } from "@/components/ui/sonner";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <AdminShell>{children}</AdminShell>
        </>
    );
}
