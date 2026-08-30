import { prisma } from '../lib/prisma';
import { ProjectInput } from '@dfd/shared';
import { PaginationHelper } from '../utils/pagination.helper';
import { cached, invalidate } from '../lib/cache';

export class ProjectService {
    /**
     * Get all projects (cached 60s on public read path)
     */
    static async getAllProjects(page: number = 1, limit: number = 10, isFeatured?: boolean) {
        const cacheKey = `projects:${page}:${limit}:${isFeatured ?? 'all'}`;
        return cached(cacheKey, 60, async () => {
            const { skip, limit: l, page: p } = PaginationHelper.getSkipLimit(page, limit);
            const where: any = { deletedAt: null };
            if (isFeatured !== undefined) where.isFeatured = isFeatured;

            const [data, total] = await Promise.all([
                prisma.project.findMany({
                    where,
                    skip,
                    take: l,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true, title: true, slug: true, clientName: true, category: true,
                        thumbnailUrl: true, description: true, techStack: true, duration: true,
                        testimonialQuote: true, testimonialAuthor: true, createdAt: true,
                        Images: { select: { id: true, imageUrl: true, caption: true } },
                    }
                }),
                prisma.project.count({ where })
            ]);

            return PaginationHelper.formatResult(data, total, p, l);
        });
    }

    /**
     * Get single project by ID or Slug (cached 60s)
     */
    static async getProject(identifier: number | string) {
        const cacheKey = `project:${typeof identifier === 'number' ? `id:${identifier}` : `slug:${identifier}`}`;
        return cached<Awaited<ReturnType<typeof prisma.project.findFirst>>>(cacheKey, 60, () => prisma.project.findFirst({
            where: typeof identifier === 'number' ? { id: identifier } : { slug: identifier },
            select: {
                id: true, title: true, slug: true, clientName: true, category: true,
                thumbnailUrl: true, description: true, techStack: true, duration: true,
                testimonialQuote: true, testimonialAuthor: true, createdAt: true,
                Images: { select: { id: true, imageUrl: true, caption: true } },
            }
        }));
    }

    static async createProject(data: ProjectInput) {
        const result = await prisma.project.create({
            data: {
                ...data,
                techStack: data.techStack as any,
                domainExpiryDate: data.domainExpiryDate ? new Date(data.domainExpiryDate) : null
            },
            select: { id: true, title: true, slug: true, clientName: true, category: true, createdAt: true }
        });
        invalidate('projects:');
        invalidate(`project:slug:${result.slug}`);
        return result;
    }

    static async updateProject(id: number, data: Partial<ProjectInput>) {
        const result = await prisma.project.update({
            where: { id },
            data: {
                ...data,
                techStack: data.techStack ? (data.techStack as any) : undefined,
                domainExpiryDate: data.domainExpiryDate !== undefined
                    ? (data.domainExpiryDate ? new Date(data.domainExpiryDate) : null)
                    : undefined
            },
            select: { id: true, title: true, slug: true, clientName: true, category: true, updatedAt: true }
        });
        invalidate('projects:');
        invalidate(`project:slug:${result.slug}`);
        invalidate(`project:id:${id}`);
        return result;
    }

    static async deleteProject(id: number) {
        const project = await prisma.project.findUnique({
            where: { id },
            select: { id: true, slug: true }
        });
        if (!project) throw new Error('Project not found');

        const deletedSlug = `${project.slug}-deleted-${Date.now()}`;

        const updated = await prisma.$transaction(async (tx: any) => {
            const updatedProject = await tx.project.update({
                where: { id },
                data: { deletedAt: new Date(), slug: deletedSlug },
                select: { id: true, slug: true, deletedAt: true }
            });
            await tx.projectImage.updateMany({
                where: { projectId: id },
                data: { deletedAt: new Date() }
            });
            return updatedProject;
        });
        invalidate('projects:');
        invalidate(`project:slug:${project.slug}`);
        invalidate(`project:id:${id}`);
        return updated;
    }

    static async addImage(projectId: number, data: { imageUrl: string; caption?: string; sortOrder?: number }) {
        const result = await prisma.projectImage.create({
            data: { projectId, ...data },
            select: { id: true, imageUrl: true, caption: true, sortOrder: true, projectId: true }
        });
        invalidate(`project:id:${projectId}`);
        return result;
    }

    static async deleteImage(imageId: number) {
        const img = await prisma.projectImage.findUnique({
            where: { id: imageId },
            select: { id: true, projectId: true }
        });
        if (!img) return null;
        const result = await prisma.projectImage.update({
            where: { id: imageId },
            data: { deletedAt: new Date() },
            select: { id: true, deletedAt: true }
        });
        invalidate(`project:id:${img.projectId}`);
        return result;
    }

    static async incrementViews(id: number) {
        return prisma.project.update({
            where: { id },
            data: { viewsCount: { increment: 1 } },
            select: { id: true, viewsCount: true }
        });
    }
}
