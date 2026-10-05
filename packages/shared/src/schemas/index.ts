import { z } from 'zod';

export const DataStatusSchema = z.enum(['fresh', 'stale', 'demo']);

export const SourceInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  attribution: z.string().optional(),
  ttlSeconds: z.number().int().positive().optional(),
});

export const NormalizedResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    source: SourceInfoSchema,
    updatedAt: z.string(),
    status: DataStatusSchema,
  });

export const CityItemSchema = z.object({
  name: z.string(),
  state: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
});

export const CitySearchQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters').max(60, 'Query cannot exceed 60 characters'),
});

export const WeatherDataSchema = z.object({
  city: z.string(),
  temperatureC: z.number(),
  humidity: z.number(),
  rainChancePercent: z.number(),
  todayMaxC: z.number(),
  conditionLabel: z.string(),
  advice: z.string(),
});

export const WeatherQuerySchema = z.object({
  city: z
    .string()
    .min(2, 'City name must be at least 2 characters')
    .max(60, 'City name cannot exceed 60 characters')
    .default('Hyderabad'),
});

export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const HealthQuerySchema = z.object({});
