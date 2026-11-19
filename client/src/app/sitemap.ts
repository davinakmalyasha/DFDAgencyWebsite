import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();
    const pages = [
        { path: '', priority: 1, changeFrequency: 'weekly' as const },
        { path: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
        { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    ];

    return pages.flatMap((page) =>
        (['en', 'id'] as const).map((locale) => ({
            url: `${SITE_URL}/${locale}${page.path}`,
            lastModified,
            changeFrequency: page.changeFrequency,
            priority: page.priority,
            alternates: {
                languages: {
                    en: `${SITE_URL}/en${page.path}`,
                    id: `${SITE_URL}/id${page.path}`,
                },
            },
        }))
    );
}
