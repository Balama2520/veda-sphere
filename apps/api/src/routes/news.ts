import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { fetchNewsData } from '../sources/news.js';

export const NewsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().min(1).max(20)),
});

export async function newsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/v1/news', async (request, reply) => {
    const parseResult = NewsQuerySchema.safeParse(request.query);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid limit query parameter. Must be an integer between 1 and 20.',
          details: parseResult.error.format(),
        },
      });
    }

    const limit = parseResult.data.limit;
    const result = await fetchNewsData(limit);
    return reply.status(200).send(result);
  });
}
