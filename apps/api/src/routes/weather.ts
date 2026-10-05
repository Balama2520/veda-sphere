import { FastifyInstance } from 'fastify';
import { WeatherQuerySchema } from '@vedasphere/shared';
import { Cache } from '../cache/index.js';
import { getWeatherForCity } from '../sources/weather.js';
import { CityNotFoundError } from '../sources/geocoding.js';

export function registerWeatherRoutes(app: FastifyInstance, cache: Cache): void {
  app.get('/v1/weather', async (request, reply) => {
    const parseResult = WeatherQuerySchema.safeParse(request.query || {});
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: issue ? issue.message : 'Invalid city parameter',
        },
      });
    }

    const { city } = parseResult.data;

    try {
      const weatherResult = await getWeatherForCity(city, cache);
      return reply.send(weatherResult);
    } catch (err) {
      if (err instanceof CityNotFoundError) {
        return reply.status(404).send({
          error: {
            code: 'CITY_NOT_FOUND',
            message: err.message,
          },
        });
      }

      app.log.error(err);
      return reply.status(500).send({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve weather data',
        },
      });
    }
  });
}
