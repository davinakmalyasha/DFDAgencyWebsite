import { Metadata } from 'next';
import { PublicService } from '@/services/public.service';
import { ShareButtons } from '@/components/landing/ShareButtons';
import { notFound } from 'next/navigation';
import { Globe, Calendar, Layers, Quote } from 'lucide-react';
import { getDictionary } from '@/i18n/messages';
import { defaultLocale, isLocale, localePath, type Locale } from '@/i18n/config';
import { SITE_URL } from '@/lib/site';

interface PageProps { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale: raw, slug } = await params;
    const locale: Locale = isLocale(raw) ? raw : defaultLocale;
    const dict = getDictionary(locale);
    try {
        const projects = (await PublicService.getProjects()) || [];
        const project = projects.find((p: any) => p.slug === slug);
        if (!project) return { title: dict.project.notFoundTitle };
        return {
            title: `${project.title} — DFD Agency`,
            description: project.description?.slice(0, 160),
            alternates: {
                canonical: `/${locale}/p/${slug}`,
                languages: {
                    en: `/en/p/${slug}`,
                    id: `/id/p/${slug}`,
                    'x-default': `/en/p/${slug}`,
                },
            },
            openGraph: {
                title: project.title,
                description: project.description?.slice(0, 160),
                type: 'article',
                images: project.thumbnailUrl ? [project.thumbnailUrl] : [],
            },
        };
    } catch { return { title: dict.project.notFoundTitle }; }
}

export default async function ProjectPublicPage({ params }: PageProps) {
    const { locale: raw, slug } = await params;
    const locale: Locale = isLocale(raw) ? raw : defaultLocale;
    const dict = getDictionary(locale);
    let project: any = null;
    try {
        const projects = (await PublicService.getProjects()) || [];
        project = projects.find((p: any) => p.slug === slug);
    } catch {}
    if (!project) notFound();

    const shareUrl = `${SITE_URL}${localePath(locale, `/p/${slug}`)}`;
    const shareText = dict.project.shareText.replace('{title}', project.title);

    return (
        <main className="min-h-screen bg-background font-sans">
            {/* Nav bar */}
            <nav className="border-b-2 border-foreground">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <a href={localePath(locale, '/')} className="font-black uppercase tracking-tight">DFD Agency</a>
                    <a href={localePath(locale, '/#portfolio')} className="text-xs font-bold uppercase tracking-widest underline">{dict.project.allProjects}</a>
                </div>
            </nav>

            <article className="max-w-4xl mx-auto px-4 py-10 space-y-8">
                <header className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{project.category}</div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">{project.title}</h1>
                    {project.clientName && <p className="text-lg font-bold">{dict.project.forClient.replace('{client}', project.clientName)}</p>}
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
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {dict.project.duration}</div>
                            <div className="font-bold">{project.duration}</div>
                        </div>
                    )}
                    {Array.isArray(project.techStack) && project.techStack.length > 0 && (
                        <div className="border-2 border-foreground p-4 md:col-span-2">
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Layers className="w-3 h-3" /> {dict.project.tech}</div>
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
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{dict.project.share}</div>
                    <ShareButtons url={shareUrl} text={shareText} />
                    <a href={shareUrl} className="text-xs font-mono break-all underline flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {shareUrl}
                    </a>
                </section>

                <footer className="border-t-2 border-foreground pt-6 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {dict.project.madeBy} <a href={localePath(locale, '/')} className="underline">DFD Agency</a>
                </footer>
            </article>
        </main>
    );
}
