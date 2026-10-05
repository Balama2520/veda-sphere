import { FastifyInstance } from 'fastify';
import { CitySearchQuerySchema } from '@vedasphere/shared';
import { Cache } from '../cache/index.js';
import { searchCities } from '../sources/geocoding.js';

export function registerCityRoutes(app: FastifyInstance, cache: Cache): void {
  app.get('/v1/cities/search', async (request, reply) => {
    const parseResult = CitySearchQuerySchema.safeParse(request.query);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: issue ? issue.message : 'Invalid query parameters',
        },
      });
    }

    const { q } = parseResult.data;
    const cities = await searchCities(q, cache);
    return reply.send(cities);
  });
}
