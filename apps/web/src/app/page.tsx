'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BriefResponse } from '@vedasphere/shared';
import { useCity } from '../context/CityContext';
import { BriefCard } from '../components/BriefCard';
import { DataCard } from '../components/DataCard';
import { AqiCard } from '../components/AqiCard';
import { NewsCard } from '../components/NewsCard';
import { PricesCard } from '../components/PricesCard';
import { Footer } from '../components/Footer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function BriefPage() {
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
      if (!res.ok) throw new Error('Failed to load brief');
      return res.json();
    },
    enabled: isLoaded && !!city,
  });

  const loading = isLoading || !isLoaded;
  const errorMsg = error instanceof Error ? error.message : undefined;

  return (
    <>
      {/* Hero Brief Card */}
      <BriefCard
        city={city}
        lines={brief?.lines ?? []}
        overallStatus={brief?.overallStatus ?? 'fresh'}
        generatedAt={brief?.generatedAt ?? new Date().toISOString()}
        isLoading={loading}
      />

      {/* Weather */}
      <div className="mb-4">
        <DataCard
          title="Today's Weather"
          data={brief?.weather}
          isLoading={loading}
          isError={isError}
          errorMessage={errorMsg}
        />
      </div>

      {/* AQI */}
      <div className="mb-4">
        <AqiCard
          data={brief?.aqi}
          isLoading={loading}
          isError={isError}
          errorMessage={errorMsg}
        />
      </div>

      {/* News */}
      <div className="mb-4">
        <NewsCard
          data={brief?.news}
          isLoading={loading}
          isError={isError}
          errorMessage={errorMsg}
        />
      </div>

      {/* Prices */}
      <div className="mb-4">
        <PricesCard
          data={brief?.prices}
          isLoading={loading}
          isError={isError}
          errorMessage={errorMsg}
        />
      </div>

      <Footer />
    </>
  );
}
