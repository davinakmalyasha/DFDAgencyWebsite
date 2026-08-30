import { Metadata } from 'next';
import { PublicService } from '@/services/public.service';
import { ShareButtons } from '@/components/landing/ShareButtons';
import { notFound } from 'next/navigation';
import { Globe, Calendar, Layers, Quote } from 'lucide-react';

interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    try {
        const projects = (await PublicService.getProjects()) || [];
        const project = projects.find((p: any) => p.slug === slug);
        if (!project) return { title: 'Project — DFD Agency' };
        return {
            title: `${project.title} — DFD Agency`,
            description: project.description?.slice(0, 160),
            openGraph: {
                title: project.title,
                description: project.description?.slice(0, 160),
                type: 'article',
                images: project.thumbnailUrl ? [project.thumbnailUrl] : [],
            },
        };
    } catch { return { title: 'Project — DFD Agency' }; }
}

export default async function ProjectPublicPage({ params }: PageProps) {
    const { slug } = await params;
    let project: any = null;
    try {
        const projects = (await PublicService.getProjects()) || [];
        project = projects.find((p: any) => p.slug === slug);
    } catch {}
    if (!project) notFound();

    const shareUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/p/${slug}`;
    const shareText = `Check out this project: ${project.title} by DFD Agency`;

    return (
        <main className="min-h-screen bg-background font-sans">
            {/* Nav bar */}
            <nav className="border-b-2 border-foreground">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <a href="/" className="font-black uppercase tracking-tight">DFD Agency</a>
                    <a href="/" className="text-xs font-bold uppercase tracking-widest underline">All Projects</a>
                </div>
            </nav>

            <article className="max-w-4xl mx-auto px-4 py-10 space-y-8">
                <header className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{project.category}</div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">{project.title}</h1>
                    {project.clientName && <p className="text-lg font-bold">For {project.clientName}</p>}
                </header>

                {project.thumbnailUrl && (
                    <div className="border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={project.thumbnailUrl} alt={project.title} className="w-full h-auto" />
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-4">
                    {project.duration && (
                        <div className="border-2 border-foreground p-4">
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Duration</div>
                            <div className="font-bold">{project.duration}</div>
                        </div>
                    )}
                    {Array.isArray(project.techStack) && project.techStack.length > 0 && (
                        <div className="border-2 border-foreground p-4 md:col-span-2">
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Layers className="w-3 h-3" /> Tech</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {project.techStack.map((t: string) => (
                                    <span key={t} className="text-[10px] font-bold uppercase tracking-widest border-2 border-foreground px-2 py-0.5">{t}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {project.description && (
                    <section className="prose prose-lg max-w-none">
                        <p className="text-base whitespace-pre-wrap">{project.description}</p>
                    </section>
                )}

                {project.testimonialQuote && (
                    <section className="border-2 border-foreground bg-foreground text-background p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <Quote className="w-6 h-6 mb-2" />
                        <p className="text-lg font-bold leading-snug">{project.testimonialQuote}</p>
                        {project.testimonialAuthor && <p className="text-[10px] font-black uppercase tracking-widest mt-3 opacity-70">— {project.testimonialAuthor}</p>}
                    </section>
                )}

                {/* Share row */}
                <section className="border-2 border-foreground p-4 space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Share this project</div>
                    <ShareButtons url={shareUrl} text={shareText} />
                    <a href={shareUrl} className="text-xs font-mono break-all underline flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {shareUrl}
                    </a>
                </section>

                <footer className="border-t-2 border-foreground pt-6 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Made by <a href="/" className="underline">DFD Agency</a>
                </footer>
            </article>
        </main>
    );
}
