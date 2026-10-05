'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BriefResponse } from '@vedasphere/shared';
import { useCity } from '../../context/CityContext';
import { PricesCard } from '../../components/PricesCard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function PricesPage() {
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
    <main aria-labelledby="prices-heading">
      <h1
        id="prices-heading"
        className="text-2xl font-bold text-ink mb-1 tracking-tight"
      >
        Prices
      </h1>
      <p className="text-sm text-muted mb-6">{city}</p>

      <PricesCard
        data={brief?.prices}
        isLoading={loading}
        isError={isError}
        errorMessage={errorMsg}
      />
    </main>
  );
}
