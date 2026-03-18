import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Project Tracking',
    description: 'Monitor your project progress in real-time.',
    robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
        },
    },
};

export default function TrackLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
