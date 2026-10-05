import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { fetchPricesData } from '../sources/prices.js';

export const PricesQuerySchema = z.object({
  city: z.string().min(2).max(60).default('Hyderabad'),
});

export async function pricesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/v1/prices', async (request, reply) => {
    const parseResult = PricesQuerySchema.safeParse(request.query);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid city parameter.',
          details: parseResult.error.format(),
        },
      });
    }

    const city = parseResult.data.city;
    const result = await fetchPricesData(city);
    return reply.status(200).send(result);
  });
}
