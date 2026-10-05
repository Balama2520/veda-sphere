'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BriefResponse } from '@vedasphere/shared';
import { useCity } from '../../context/CityContext';
import { DataCard } from '../../components/DataCard';
import { AqiCard } from '../../components/AqiCard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function WeatherPage() {
  const { city, isLoaded } = useCity();

  const { data: brief, isLoading, isError, error } = useQuery<BriefResponse>({
    queryKey: ['brief', city],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/v1/brief?city=${encodeURIComponent(city)}&lang=en`
      );
      if (res.status === 404) {
        const d = await res.json();
        throw new Error(d?.error?.message || `City '${city}' not found.`);
      }
      if (!res.ok) throw new Error('Failed to load data');
      return res.json();
    },
    enabled: isLoaded && !!city,
  });

  const loading = isLoading || !isLoaded;
  const errorMsg = error instanceof Error ? error.message : undefined;

  return (
    <main aria-labelledby="weather-heading">
      <h1
        id="weather-heading"
        className="text-2xl font-bold text-ink mb-1 tracking-tight"
      >
        Weather
      </h1>
      <p className="text-sm text-muted mb-6">{city}</p>

      <div className="mb-4">
        <DataCard
          title="Today's Weather"
          data={brief?.weather}
          isLoading={loading}
          isError={isError}
          errorMessage={errorMsg}
        />
      </div>

      <div className="mb-4">
        <AqiCard
          data={brief?.aqi}
          isLoading={loading}
          isError={isError}
          errorMessage={errorMsg}
        />
      </div>
    </main>
  );
}
