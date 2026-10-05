import { FastifyInstance } from 'fastify';
import { fetchCurrencyData } from '../sources/currency.js';

export async function currencyRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/v1/currency', async (_request, reply) => {
    const result = await fetchCurrencyData();
    return reply.status(200).send(result);
  });
}
