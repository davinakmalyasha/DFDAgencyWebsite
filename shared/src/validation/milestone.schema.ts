import { z } from 'zod';

export const milestoneCategoryEnum = z.enum(['DESIGN', 'FRONTEND', 'BACKEND', 'COPY', 'CONTENT', 'REVIEW', 'ASSET', 'OTHER']);
export const milestoneStatusEnum = z.enum(['DRAFT', 'READY', 'IN_REVIEW', 'REVISION_NEEDED', 'APPROVED', 'REJECTED']);

export const createMilestoneSchema = z.object({
    title: z.string().min(2).max(200),
    description: z.string().max(5000).optional().nullable(),
    coverUrl: z.string().url().max(2000).optional().nullable(),
    category: milestoneCategoryEnum.default('OTHER'),
    status: milestoneStatusEnum.default('READY'),
    notifyClient: z.boolean().default(true),
    notifyChannel: z.enum(['NONE', 'WHATSAPP', 'TELEGRAM', 'BOTH']).default('WHATSAPP'),
});

export const updateMilestoneSchema = createMilestoneSchema.partial();

export const milestoneDecisionSchema = z.object({
    action: z.enum(['APPROVE', 'REQUEST_REVISION']),
    note: z.string().max(2000).optional().nullable(),
});

export const orderActivityMeta = z.record(z.string(), z.any()).optional();

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type MilestoneDecisionInput = z.infer<typeof milestoneDecisionSchema>;
