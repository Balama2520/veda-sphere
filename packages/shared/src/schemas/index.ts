import { z } from 'zod';

export const DataStatusSchema = z.enum(['fresh', 'stale', 'demo']);

export const SourceInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  attribution: z.string().optional(),
  ttlSeconds: z.number().int().positive().optional(),
});

export const NormalizedResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    source: SourceInfoSchema,
    updatedAt: z.string().datetime(),
    status: DataStatusSchema,
  });

export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const HealthQuerySchema = z.object({});
