import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Middleware to validate Express requests using our internal @dfd/shared logic
interface ValidationSchema {
    body?: z.ZodSchema;
    params?: z.ZodSchema;
    query?: z.ZodSchema;
}

export const validateRequest = (schema: z.ZodSchema | ValidationSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if ('parse' in schema) {
                // Legacy behavior: only validate body
                schema.parse(req.body);
            } else {
                // New behavior: validate specific parts
                if (schema.body) schema.body.parse(req.body);
                if (schema.params) schema.params.parse(req.params);
                if (schema.query) schema.query.parse(req.query);
            }
            next();
        } catch (error: any) {
            if (error.name === 'ZodError' || error instanceof z.ZodError) {
                const combinedMessage = error.issues.map((i: any) => i.message).join(', ');
                return res.status(400).json({
                    success: false,
                    message: combinedMessage,
                    data: null,
                    error: error.issues
                });
            }
            next(error);
        }
    };
};
